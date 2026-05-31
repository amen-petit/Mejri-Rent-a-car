-- =============================================================================
-- Migration: add pickup_time / return_time to reservations
-- Run this in the Supabase SQL Editor on a database that already has
-- security-setup.sql applied. It is idempotent and safe to re-run.
--
-- What it does:
--   1. Adds nullable pickup_time / return_time columns (existing rows stay NULL).
--   2. Replaces create_reservation_if_available with a signature that stores the
--      two times. The old 8-arg signature is dropped so no stale overload remains.
-- =============================================================================

-- 1. New columns -------------------------------------------------------------
alter table reservations add column if not exists pickup_time time;
alter table reservations add column if not exists return_time time;

-- 2. Replace the atomic booking function (new signature) ----------------------
--    A changed argument list is a NEW function to Postgres, so drop the old one
--    first to avoid leaving two overloads behind.
drop function if exists create_reservation_if_available(
  uuid, date, date, numeric, text, text, text, text
);

create or replace function create_reservation_if_available(
  p_car_id uuid,
  p_start  date,
  p_end    date,
  p_pickup time,
  p_return time,
  p_total  numeric,
  p_name   text,
  p_phone  text,
  p_email  text,
  p_notes  text
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
    start_date, end_date, pickup_time, return_time, total_price, notes, status
  )
  values (
    p_car_id, p_name, p_phone, p_email,
    p_start, p_end, p_pickup, p_return, p_total, p_notes, 'pending'
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Keep the function server-only (service role bypasses these grants).
revoke all on function create_reservation_if_available(
  uuid, date, date, time, time, numeric, text, text, text, text
) from public, anon, authenticated;
