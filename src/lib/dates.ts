/**
 * Pure date utilities — the single source of truth for calendar-date parsing,
 * formatting, and inclusive day counting across the app. No React, no DOM.
 *
 * Calendar dates are "YYYY-MM-DD" strings. `parseDateOnly` reads them as UTC so
 * day counts are timezone-stable between the browser and the server; the
 * day-count helpers below build on it so every surface (pricing, booking UI,
 * admin views) reports the SAME number of days for the same range.
 */
import { MS_PER_DAY } from "./constants";

/**
 * Parse a YYYY-MM-DD string into a UTC date (tz-stable). Rejects out-of-range
 * values like 2025-13-40 via a round-trip check.
 */
export function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

/** Inclusive day count between two calendar dates (start and end both counted). */
export function getDaysBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
}

/**
 * Inclusive day count from two YYYY-MM-DD strings. Returns 0 for invalid input.
 * Use this in the UI instead of ad-hoc `new Date(a) - new Date(b)` math so the
 * displayed duration always matches the priced duration.
 */
export function getDaysBetweenStrings(startDate: string, endDate: string): number {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (!start || !end) return 0;
  return getDaysBetween(start, end);
}

/**
 * Format a Date as YYYY-MM-DD using LOCAL parts (not UTC), so a date the user
 * picked in their own timezone is preserved when sent to the API.
 */
export function formatDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Human-readable French date (dd/mm/yyyy). Accepts a Date or a date string. */
export function formatDateFr(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("fr-FR");
}
