-- =============================================================================
-- Migration: expand pickup / return locations to all major Tunisian airports
-- Run this in the Supabase SQL Editor. Idempotent and safe to re-run.
--
-- IMPORTANT — run this BEFORE deploying the code that offers the new locations.
-- The booking RPC inserts pickup_location / return_location straight into the
-- reservations table, so the CHECK constraints must accept the new codes first,
-- otherwise a booking to (say) 'monastir' would be rejected by the database.
--
-- What it does:
--   - Widens the two location CHECK constraints to allow the agency plus every
--     major Tunisian airport. No column or data changes: existing rows already
--     hold 'agency' or 'airport' (Tunis-Carthage), which remain valid — no
--     backfill needed.
--
-- These codes MUST match RENTAL_LOCATIONS in src/lib/constants.ts.
-- =============================================================================

alter table reservations
  drop constraint if exists reservations_pickup_location_valid;
alter table reservations
  drop constraint if exists reservations_return_location_valid;

alter table reservations
  add constraint reservations_pickup_location_valid
  check (pickup_location in (
    'agency',
    'airport',
    'enfidha_hammamet',
    'monastir',
    'djerba_zarzis',
    'sfax_thyna',
    'tozeur_nefta',
    'tabarka_ain_draham',
    'gafsa_ksar'
  ));

alter table reservations
  add constraint reservations_return_location_valid
  check (return_location in (
    'agency',
    'airport',
    'enfidha_hammamet',
    'monastir',
    'djerba_zarzis',
    'sfax_thyna',
    'tozeur_nefta',
    'tabarka_ain_draham',
    'gafsa_ksar'
  ));
