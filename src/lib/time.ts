/**
 * Timezone-aware helpers for the booking flow.
 *
 * Booking dates (YYYY-MM-DD) and times (HH:MM) are wall-clock values in the
 * agency's local timezone. The server, however, runs in UTC, so any naive
 * comparison against `new Date()` is off by the UTC offset and can either
 * reject a valid "today" or accept an already-passed time. These helpers
 * compute "now" in the agency timezone so both sides agree on what is past.
 */

// IANA timezone of the rental agency. Override per client via env. Defaults to
// Tunisia (UTC+1, no DST). Using a real timezone (not a fixed offset) keeps it
// correct for clients in regions that observe daylight saving time.
export const BOOKING_TIMEZONE =
  process.env.NEXT_PUBLIC_BOOKING_TIMEZONE || "Africa/Tunis";

/** Convert an "HH:MM" slot to minutes since midnight. Returns NaN if malformed. */
export function timeToMinutes(time: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return NaN;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Current wall-clock moment in the given timezone, as a YYYY-MM-DD date string
 * and minutes-since-midnight. Works the same on the server (UTC) and the client.
 */
export function nowInTimezone(
  timeZone: string = BOOKING_TIMEZONE,
  now: Date = new Date(),
): { dateStr: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const year = get("year");
  const month = get("month");
  const day = get("day");
  // hour12:false can emit "24" at midnight in some engines; normalize to 0–23.
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));

  return {
    dateStr: `${year}-${month}-${day}`,
    minutes: hour * 60 + minute,
  };
}

/**
 * True if the chosen pickup (date + "HH:MM") is in the past relative to now,
 * evaluated in the agency timezone. A small lead-time buffer (minutes) can be
 * required so a booking can't be made for a slot that is effectively "now".
 */
export function isPickupInPast(
  startDate: string,
  pickupTime: string,
  options: { timeZone?: string; bufferMinutes?: number; now?: Date } = {},
): boolean {
  const { timeZone = BOOKING_TIMEZONE, bufferMinutes = 0, now } = options;
  const current = nowInTimezone(timeZone, now);

  if (startDate < current.dateStr) return true;
  if (startDate > current.dateStr) return false;

  // Same calendar day: the pickup time must be at least `bufferMinutes` ahead.
  const pickupMinutes = timeToMinutes(pickupTime);
  if (Number.isNaN(pickupMinutes)) return false;
  return pickupMinutes <= current.minutes + bufferMinutes;
}
