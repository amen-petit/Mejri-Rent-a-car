-- =============================================================================
-- Performance & data-integrity migration
-- Run in the Supabase SQL Editor after security-setup.sql.
-- Safe to run multiple times (idempotent).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Index the reservation-overlap lookup.
--    The booking RPC and the availability endpoints all scan reservations by
--    (car_id, status) over a date window. Without this index those are
--    sequential scans that get slower as the table grows. A composite index on
--    the exact filter columns turns each lookup into an index range scan.
-- -----------------------------------------------------------------------------
create index if not exists reservations_car_status_dates_idx
  on reservations (car_id, status, start_date, end_date);

-- Listing pages order reservations by created_at desc; index it for the admin
-- reservations table pagination.
create index if not exists reservations_created_at_idx
  on reservations (created_at desc);

-- -----------------------------------------------------------------------------
-- 2. Data-integrity constraints (defense in depth).
--    The API already validates these with Zod, but enforcing them in the
--    database guarantees no malformed row can ever exist, regardless of how it
--    was inserted.
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reservations_dates_valid'
  ) then
    alter table reservations
      add constraint reservations_dates_valid
      check (end_date >= start_date);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'reservations_total_nonneg'
  ) then
    alter table reservations
      add constraint reservations_total_nonneg
      check (total_price >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'cars_quantity_positive'
  ) then
    alter table cars
      add constraint cars_quantity_positive
      check (quantity >= 1);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'cars_price_positive'
  ) then
    alter table cars
      add constraint cars_price_positive
      check (price_per_day > 0);
  end if;
end $$;
