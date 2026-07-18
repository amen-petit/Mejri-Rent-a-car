-- =============================================================================
-- Migration: optional add-on services on reservations (Chauffeur, and future
--            services like GPS, baby seat, additional driver, …)
-- Run this in the Supabase SQL Editor. Idempotent and safe to re-run.
--
-- IMPORTANT — run this BEFORE deploying the add-ons code: the booking route
-- calls create_reservation_if_available() with a new p_addons argument, so the
-- function signature must exist first.
--
-- What it does:
--   1. Adds an `addons` jsonb column: an array of priced line snapshots, e.g.
--      [{"key":"chauffeur","daily_rate":30,"days":7,"total":210}]. Generic on
--      purpose — a new service never needs a schema change, only a catalog entry
--      in src/lib/addons.ts. Each line stores the RATE USED, so historical
--      reservations stay accurate if the catalog price changes later.
--   2. Replaces the atomic booking RPC with a signature that also accepts and
--      persists `addons`. `total_price` now carries the GRAND total (vehicle +
--      add-ons). Existing rows keep addons '[]' and their vehicle-only total —
--      historically correct, no backfill.
-- =============================================================================

alter table reservations
  add column if not exists addons jsonb not null default '[]'::jsonb;

-- Replace the (promotion-aware) 15-arg overload with the add-ons signature. A
-- changed argument list is a NEW function to Postgres, so drop the old one first.
drop function if exists create_reservation_if_available(
  uuid, date, date, time, time, text, text, numeric, numeric, numeric, text,
  text, text, text, text
);

create or replace function create_reservation_if_available(
  p_car_id           uuid,
  p_start            date,
  p_end              date,
  p_pickup           time,
  p_return           time,
  p_pickup_location  text,
  p_return_location  text,
  p_total            numeric,   -- grand total: vehicle + add-ons
  p_original_daily   numeric,   -- vehicle daily rate before promo
  p_discounted_daily numeric,   -- vehicle daily rate actually charged
  p_promo_label      text,
  p_addons           jsonb,     -- [{key, daily_rate, days, total}]
  p_name             text,
  p_phone            text,
  p_email            text,
  p_notes            text
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
    pickup_location, return_location, total_price,
    original_price_per_day, discounted_price_per_day, promotion_label,
    addons, notes, status
  )
  values (
    p_car_id, p_name, p_phone, p_email,
    p_start, p_end, p_pickup, p_return,
    p_pickup_location, p_return_location, p_total,
    p_original_daily, p_discounted_daily, p_promo_label,
    coalesce(p_addons, '[]'::jsonb), p_notes, 'pending'
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Keep the function server-only (the service role bypasses these grants).
revoke all on function create_reservation_if_available(
  uuid, date, date, time, time, text, text, numeric, numeric, numeric, text,
  jsonb, text, text, text, text
) from public, anon, authenticated;
