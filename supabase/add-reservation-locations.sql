-- =============================================================================
-- Migration: pickup / return LOCATIONS on reservations
-- Run this in the Supabase SQL Editor. Idempotent and safe to re-run.
--
-- IMPORTANT — run this BEFORE deploying the code that sends the new fields:
-- the booking route calls create_reservation_if_available() with two extra
-- location arguments. Applying the SQL first means there is never a moment where
-- the deployed code and the database function signatures disagree.
--
-- What it does:
--   1. Adds pickup_location / return_location (backfilled, defaulted, NOT NULL).
--   2. Adds CHECK constraints so only the app's known locations can be stored.
--   3. Replaces the atomic booking function with a signature that persists them.
-- =============================================================================

-- 1. Columns -----------------------------------------------------------------
--    Added nullable first so the backfill can run on existing rows, then locked
--    down with a default + NOT NULL. Existing reservations become 'agency'.
alter table reservations add column if not exists pickup_location text;
alter table reservations add column if not exists return_location text;

update reservations set pickup_location = 'agency' where pickup_location is null;
update reservations
  set return_location = coalesce(return_location, pickup_location, 'agency')
  where return_location is null;

alter table reservations alter column pickup_location set default 'agency';
alter table reservations alter column return_location set default 'agency';
alter table reservations alter column pickup_location set not null;
alter table reservations alter column return_location set not null;

-- 2. Allowed-values constraints (defense in depth; mirror the app enum) -------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reservations_pickup_location_valid'
  ) then
    alter table reservations
      add constraint reservations_pickup_location_valid
      check (pickup_location in ('agency', 'airport'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'reservations_return_location_valid'
  ) then
    alter table reservations
      add constraint reservations_return_location_valid
      check (return_location in ('agency', 'airport'));
  end if;
end $$;

-- 3. Replace the atomic booking RPC with the location-aware signature ---------
--    A changed argument list is a NEW function to Postgres, so drop the previous
--    (pickup/return-time) overload first to avoid leaving two behind.
drop function if exists create_reservation_if_available(
  uuid, date, date, time, time, numeric, text, text, text, text
);

create or replace function create_reservation_if_available(
  p_car_id          uuid,
  p_start           date,
  p_end             date,
  p_pickup          time,
  p_return          time,
  p_pickup_location text,
  p_return_location text,
  p_total           numeric,
  p_name            text,
  p_phone           text,
  p_email           text,
  p_notes           text
) returns uuid
language plpgsql
as $$
declare
  v_quantity    int;
  v_overlapping int;
  v_id          uuid;
begin
  -- Serialize concurrent bookings for THIS car.
  perform pg_advisory_xact_lock(hashtext(p_car_id::text));

  select quantity into v_quantity
  from cars
  where id = p_car_id and is_available = true;

  if v_quantity is null then
    raise exception 'car_unavailable';
  end if;

  select count(*) into v_overlapping
  from reservations
  where car_id = p_car_id
    and status in ('pending', 'confirmed')
    and start_date <= p_end
    and end_date   >= p_start;

  if v_overlapping >= v_quantity then
    raise exception 'no_availability';
  end if;

  insert into reservations (
    car_id, client_name, client_phone, client_email,
    start_date, end_date, pickup_time, return_time,
    pickup_location, return_location, total_price, notes, status
  )
  values (
    p_car_id, p_name, p_phone, p_email,
    p_start, p_end, p_pickup, p_return,
    p_pickup_location, p_return_location, p_total, p_notes, 'pending'
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Keep the function server-only (the service role bypasses these grants).
revoke all on function create_reservation_if_available(
  uuid, date, date, time, time, text, text, numeric, text, text, text, text
) from public, anon, authenticated;
