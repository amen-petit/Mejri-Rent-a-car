/**
 * Shared helpers for the date+location booking search that flows through the
 * URL (hero card → results → car detail). Keeping build/parse/validate in one
 * pure module means the producer and every consumer agree on the exact param
 * shape — no stringly-typed drift between pages.
 */
import { parseDateOnly } from "./dates";
import { nowInTimezone } from "./time";
import {
  DEFAULT_RENTAL_LOCATION,
  isRentalLocation,
  type RentalLocation,
} from "./constants";

export type BookingSearch = {
  start: string; // YYYY-MM-DD (pickup date)
  end: string; // YYYY-MM-DD (return date)
  pickup: RentalLocation;
  return: RentalLocation;
};

export type BookingSearchError = "select" | "order" | "past";

/** Serialize a search into a query string for /voitures and /voitures/[id]. */
export function buildBookingSearchParams(search: BookingSearch): string {
  const params = new URLSearchParams({
    start: search.start,
    end: search.end,
    pickup: search.pickup,
    return: search.return,
  });
  return params.toString();
}

/**
 * Read a validated search from a param getter (works with URLSearchParams and
 * Next's ReadonlyURLSearchParams). Returns null when the dates are missing or
 * malformed. Locations fall back to defaults; return defaults to pickup.
 */
export function parseBookingSearch(
  get: (key: string) => string | null,
): BookingSearch | null {
  const start = get("start");
  const end = get("end");
  if (!start || !end) return null;

  const startDate = parseDateOnly(start);
  const endDate = parseDateOnly(end);
  if (!startDate || !endDate || endDate < startDate) return null;

  const pickupRaw = get("pickup");
  const pickup = isRentalLocation(pickupRaw) ? pickupRaw : DEFAULT_RENTAL_LOCATION;
  const returnRaw = get("return");
  const returnLocation = isRentalLocation(returnRaw) ? returnRaw : pickup;

  return { start, end, pickup, return: returnLocation };
}

/**
 * Client-side pre-submit validation. Returns an error key (mapped to a localized
 * message by the caller) or null when the dates are valid. "Past" is evaluated
 * in the agency timezone so it matches the server's booking guard.
 */
export function validateBookingDates(start: string, end: string): BookingSearchError | null {
  if (!start || !end) return "select";
  const startDate = parseDateOnly(start);
  const endDate = parseDateOnly(end);
  if (!startDate || !endDate) return "select";
  if (endDate < startDate) return "order";
  if (start < nowInTimezone().dateStr) return "past";
  return null;
}
