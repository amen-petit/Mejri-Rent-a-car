/**
 * Pure, framework-agnostic pricing logic. Single source of truth shared by the
 * client (for display) and the server (for the authoritative quote that gets
 * persisted). No React, no DOM, no network.
 *
 * Dates are handled as calendar dates (YYYY-MM-DD) in UTC to avoid timezone
 * drift between the browser and the server.
 */
import type { Car, PricingTier } from "./types";

export const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Parse a YYYY-MM-DD string into a UTC date (tz-stable). Rejects out-of-range
 *  values like 2025-13-40 via a round-trip check. */
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

export function normalizePricingTiers(
  tiers?: PricingTier[] | null,
): PricingTier[] {
  return (tiers || [])
    .filter(
      (tier) =>
        Number.isFinite(tier.min_days) &&
        Number.isFinite(tier.max_days) &&
        Number.isFinite(tier.price_per_day) &&
        tier.min_days >= 1 &&
        tier.max_days >= tier.min_days &&
        tier.price_per_day > 0,
    )
    .sort((a, b) => a.min_days - b.min_days);
}

export function getMatchingTierForDuration(
  durationDays: number,
  tiers?: PricingTier[] | null,
): PricingTier | null {
  if (durationDays <= 0) return null;
  const normalized = normalizePricingTiers(tiers);
  if (normalized.length === 0) return null;

  const exactMatch = normalized.find(
    (tier) => durationDays >= tier.min_days && durationDays <= tier.max_days,
  );
  if (exactMatch) return exactMatch;

  const lowerTier = [...normalized]
    .reverse()
    .find((tier) => durationDays >= tier.min_days);
  if (lowerTier) return lowerTier;

  return normalized[0];
}

export function getDailyRateForDuration(
  durationDays: number,
  defaultRate: number,
  tiers?: PricingTier[] | null,
): number {
  if (durationDays <= 0) return defaultRate;
  const tier = getMatchingTierForDuration(durationDays, tiers);
  return tier ? tier.price_per_day : defaultRate;
}

export type Quote = {
  totalDays: number;
  dailyRate: number;
  totalPrice: number;
  tier: PricingTier | null;
};

/**
 * Authoritative quote for a car over a date range. The server uses this to set
 * total_price; the client uses it for display. Returns a zero-day quote for
 * invalid/empty ranges.
 */
export function computeQuote(
  car: Pick<Car, "price_per_day" | "pricing_tiers">,
  startDate: string,
  endDate: string,
): Quote {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

  if (!start || !end || end < start) {
    return { totalDays: 0, dailyRate: car.price_per_day, totalPrice: 0, tier: null };
  }

  const totalDays = getDaysBetween(start, end);
  const tiers = normalizePricingTiers(car.pricing_tiers);
  const dailyRate = getDailyRateForDuration(totalDays, car.price_per_day, tiers);
  const tier = getMatchingTierForDuration(totalDays, tiers);

  return { totalDays, dailyRate, totalPrice: totalDays * dailyRate, tier };
}
