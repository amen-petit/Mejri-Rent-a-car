/**
 * Shared helpers for the date+time+location booking search that flows through
 * the URL (hero card → results → car detail). Keeping build/parse/validate in
 * one pure module means the producer and every consumer agree on the exact
 * param shape — no stringly-typed drift between pages.
 */
import { parseDateOnly } from "./dates";
import { nowInTimezone, timeToMinutes, isPickupInPast } from "./time";
import {
  DEFAULT_RENTAL_LOCATION,
  isRentalLocation,
  BOOKING_TIME_SLOTS,
  DEFAULT_PICKUP_TIME,
  DEFAULT_RETURN_TIME,
  PICKUP_LEAD_MINUTES,
  type RentalLocation,
} from "./constants";

export type BookingSearch = {
  start: string; // YYYY-MM-DD (pickup date)
  end: string; // YYYY-MM-DD (return date)
  startTime: string; // HH:MM (pickup time)
  endTime: string; // HH:MM (return time)
  pickup: RentalLocation;
  return: RentalLocation;
};

export type BookingSearchError =
  | "select"
  | "order"
  | "past"
  | "timeOrder"
  | "pastTime";

/** Coerce a raw param to a known slot, falling back when absent/malformed. */
function normalizeSlot(raw: string | null, fallback: string): string {
  return raw && BOOKING_TIME_SLOTS.includes(raw) ? raw : fallback;
}

/** Serialize a search into a query string for /voitures and /voitures/[id]. */
export function buildBookingSearchParams(search: BookingSearch): string {
  const params = new URLSearchParams({
    start: search.start,
    end: search.end,
    startTime: search.startTime,
    endTime: search.endTime,
    pickup: search.pickup,
    return: search.return,
  });
  return params.toString();
}

/**
 * Read a validated search from a param getter (works with URLSearchParams and
 * Next's ReadonlyURLSearchParams). Returns null when the dates are missing or
 * malformed. Times fall back to the defaults, locations to their defaults, and
 * return defaults to pickup.
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

  const startTime = normalizeSlot(get("startTime"), DEFAULT_PICKUP_TIME);
  const endTime = normalizeSlot(get("endTime"), DEFAULT_RETURN_TIME);

  const pickupRaw = get("pickup");
  const pickup = isRentalLocation(pickupRaw) ? pickupRaw : DEFAULT_RENTAL_LOCATION;
  const returnRaw = get("return");
  const returnLocation = isRentalLocation(returnRaw) ? returnRaw : pickup;

  return { start, end, startTime, endTime, pickup, return: returnLocation };
}

/**
 * Client-side pre-submit validation of the full search (dates + times). Returns
 * an error key (mapped to a localized message by the caller) or null when valid.
 * Everything past-related is evaluated in the agency timezone so it matches the
 * server's booking guard.
 */
export function validateBookingSearch(
  start: string,
  end: string,
  startTime: string,
  endTime: string,
): BookingSearchError | null {
  if (!start || !end) return "select";
  const startDate = parseDateOnly(start);
  const endDate = parseDateOnly(end);
  if (!startDate || !endDate) return "select";
  if (endDate < startDate) return "order";
  if (start < nowInTimezone().dateStr) return "past";
  // Same calendar day: the return time must be after the pickup time.
  if (start === end && timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    return "timeOrder";
  }
  // Pickup today: the chosen time must be at least the lead buffer ahead of now.
  if (isPickupInPast(start, startTime, { bufferMinutes: PICKUP_LEAD_MINUTES })) {
    return "pastTime";
  }
  return null;
}
