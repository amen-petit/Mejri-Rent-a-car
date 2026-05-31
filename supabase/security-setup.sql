-- =============================================================================
-- Fekra rent a car — Security hardening migration
-- Run this in the Supabase SQL Editor AFTER deploying the server refactor
-- (service-role route handlers). Running it before will break the live site,
-- because the old client-side code depends on anon read/write access.
--
-- What it does:
--   1. Adds an atomic booking function (prevents double-booking + price fraud).
--   2. Enables RLS: public can READ cars only; reservations are fully locked
--      to anon (all access goes through the server's service-role key).
--   3. Locks storage uploads to the server (removes public INSERT).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Atomic "create reservation only if a unit is free" function
--    Called by the server (service role) from POST /api/reservations.
--    Uses a per-car transaction advisory lock so concurrent bookings for the
--    same car are serialized -> no overbooking under load.
-- -----------------------------------------------------------------------------
-- Pickup / return times the client chooses on the booking page.
alter table reservations add column if not exists pickup_time time;
alter table reservations add column if not exists return_time time;

-- Drop the older (pre-time) signature if it exists, so we don't leave a stale
-- overload behind when upgrading an existing database.
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

-- Don't let anon/authenticated call the function directly; only the server.
revoke all on function create_reservation_if_available(
  uuid, date, date, time, time, numeric, text, text, text, text
) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2a. CARS — public read-only. No public writes (admin writes use service role,
--     which bypasses RLS).
-- -----------------------------------------------------------------------------
alter table cars enable row level security;

drop policy if exists "cars_public_select" on cars;
create policy "cars_public_select"
  on cars for select
  to anon, authenticated
  using (true);
-- No INSERT / UPDATE / DELETE policies -> denied for anon & authenticated.

-- -----------------------------------------------------------------------------
-- 2b. RESERVATIONS — fully locked to the public. Every read/write goes through
--     the server (service role bypasses RLS). This protects customer PII.
-- -----------------------------------------------------------------------------
alter table reservations enable row level security;
-- Intentionally NO policies -> anon & authenticated get zero access.

-- -----------------------------------------------------------------------------
-- 3. STORAGE — remove public upload. Uploads now go through
--    POST /api/admin/cars/[id]/images (service role). Public READ stays so the
--    public image URLs keep working.
-- -----------------------------------------------------------------------------
drop policy if exists "Anyone can upload car images" on storage.objects;
-- Keep the existing "Public can view car images" SELECT policy.

-- Defense in depth at the bucket level (you may have already set these):
update storage.buckets
set file_size_limit = 5242880, -- 5 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
where id = 'car-images';
