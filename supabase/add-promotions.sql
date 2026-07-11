-- =============================================================================
-- Migration: Promotional Vehicles
-- Run this in the Supabase SQL Editor. Idempotent and safe to re-run.
--
-- IMPORTANT — run this BEFORE deploying the promotions code:
--   - The public site reads active promotions with the ANON key (RLS below only
--     ever exposes currently-active rows), and the booking route calls
--     create_reservation_if_available() with three new pricing arguments.
--   Applying the SQL first means the deployed code and the database never
--   disagree on the promotions table or the function signature.
--
-- What it does:
--   1. Creates the `promotions` table (one row = one campaign on one car).
--   2. Enables RLS: the public can READ only currently-active promotions;
--      all writes go through the server's service-role key.
--   3. Adds price-snapshot columns to `reservations` so historical bookings
--      keep the exact price that was charged.
--   4. Replaces the atomic booking function with a signature that persists the
--      original + discounted daily price and the promotion label.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. promotions table
--    discount_type:
--      'percentage' -> discount_value is a percent (0 < v <= 100)
--      'fixed'      -> discount_value is a flat amount OFF per day (DT)
--    The discounted price is always DERIVED from the car's current price in the
--    app, so it can never drift when the base price changes. Nothing here stores
--    a frozen promotional price.
-- -----------------------------------------------------------------------------
create table if not exists promotions (
  id             uuid primary key default gen_random_uuid(),
  car_id         uuid not null references cars(id) on delete cascade,
  discount_type  text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric not null check (discount_value > 0),
  label          text,
  badge_style    text not null default 'warm'
                   check (badge_style in ('warm', 'accent', 'ink')),
  start_date     date not null,
  end_date       date not null,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  constraint promotions_dates_valid check (end_date >= start_date),
  -- A percentage can never exceed 100%. (A 'fixed' amount is validated against
  -- the car's price in the API, since that requires a join.)
  constraint promotions_percentage_max
    check (discount_type <> 'percentage' or discount_value <= 100)
);

-- Overlap lookups (API guard) and public "active now" reads hit these columns.
create index if not exists promotions_car_id_idx on promotions (car_id);
create index if not exists promotions_active_window_idx
  on promotions (is_active, start_date, end_date);

-- -----------------------------------------------------------------------------
-- 2. RLS — public read is limited to CURRENTLY-active promotions.
--    This is what makes expired / not-yet-started / disabled promotions vanish
--    from the client automatically, with no cron job: the row simply stops
--    being selectable by the anon key the moment it leaves its window.
--    Admin management uses the service-role key, which bypasses RLS.
-- -----------------------------------------------------------------------------
alter table promotions enable row level security;

drop policy if exists "promotions_public_active_select" on promotions;
create policy "promotions_public_active_select"
  on promotions for select
  to anon, authenticated
  using (
    is_active = true
    and current_date >= start_date
    and current_date <= end_date
  );
-- No INSERT / UPDATE / DELETE policies -> denied for anon & authenticated.

-- Optional defense-in-depth: forbid overlapping ACTIVE promos for the same car
-- at the database level too. Requires the btree_gist extension. The API already
-- rejects overlaps with a friendly message; uncomment to enforce in the DB.
--   create extension if not exists btree_gist;
--   alter table promotions add constraint promotions_no_active_overlap
--     exclude using gist (
--       car_id with =,
--       daterange(start_date, end_date, '[]') with &&
--     ) where (is_active);

-- -----------------------------------------------------------------------------
-- 3. reservations — snapshot the price actually charged.
--    Nullable: existing rows predate promotions and keep NULL. New bookings
--    always store both dailies (equal when no promo) so historical reservations
--    never change if a car's price or a promotion is edited later.
-- -----------------------------------------------------------------------------
alter table reservations add column if not exists original_price_per_day numeric;
alter table reservations add column if not exists discounted_price_per_day numeric;
alter table reservations add column if not exists promotion_label text;

-- -----------------------------------------------------------------------------
-- 4. Replace the atomic booking RPC with the price-snapshot signature.
--    A changed argument list is a NEW function to Postgres, so drop the previous
--    (location-aware) overload first to avoid leaving two behind.
-- -----------------------------------------------------------------------------
drop function if exists create_reservation_if_available(
  uuid, date, date, time, time, text, text, numeric, text, text, text, text
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
  p_original_daily  numeric,
  p_discounted_daily numeric,
  p_promo_label     text,
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
    pickup_location, return_location, total_price,
    original_price_per_day, discounted_price_per_day, promotion_label,
    notes, status
  )
  values (
    p_car_id, p_name, p_phone, p_email,
    p_start, p_end, p_pickup, p_return,
    p_pickup_location, p_return_location, p_total,
    p_original_daily, p_discounted_daily, p_promo_label,
    p_notes, 'pending'
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Keep the function server-only (the service role bypasses these grants).
revoke all on function create_reservation_if_available(
  uuid, date, date, time, time, text, text, numeric, numeric, numeric, text,
  text, text, text, text
) from public, anon, authenticated;
