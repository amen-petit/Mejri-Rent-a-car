-- =============================================================================
-- Admin reservations — search / filter / sort index support
-- Run in the Supabase SQL Editor after performance-and-integrity.sql.
-- Safe to run multiple times (idempotent).
--
-- Backs the admin reservations list (server-side pagination + customer search +
-- date-range filter + sorting) so each query stays an index scan as the table
-- grows into the tens of thousands of rows.
-- =============================================================================

-- Trigram matching for case-insensitive ILIKE '%term%' customer search.
create extension if not exists pg_trgm;

create index if not exists reservations_client_name_trgm
  on reservations using gin (client_name gin_trgm_ops);

create index if not exists reservations_client_phone_trgm
  on reservations using gin (client_phone gin_trgm_ops);

create index if not exists reservations_client_email_trgm
  on reservations using gin (client_email gin_trgm_ops);

-- Status-filtered, newest-first pagination (the default admin view).
create index if not exists reservations_status_created_idx
  on reservations (status, created_at desc);

-- Date-range (rental-period overlap) filtering across the whole fleet.
create index if not exists reservations_start_date_idx
  on reservations (start_date);

create index if not exists reservations_end_date_idx
  on reservations (end_date);
