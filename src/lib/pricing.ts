/**
 * Pure, framework-agnostic pricing logic. Single source of truth shared by the
 * client (for display) and the server (for the authoritative quote that gets
 * persisted). No React, no DOM, no network.
 *
 * Dates are handled as calendar dates (YYYY-MM-DD) in UTC to avoid timezone
 * drift between the browser and the server.
 */
import type { Car, PricingTier, Promotion } from "./types";
import { getDaysBetween, parseDateOnly } from "./dates";
import { applyPromotionToRate } from "./promotions";
import {
  computeAddonLines,
  sumAddonLines,
  type AddonKey,
  type AddonLine,
} from "./addons";

export function normalizePricingTiers(
  tiers?: PricingTier[] | null,
): PricingTier[] {
  return (tiers || [])
    .filter(
      (tier) =>
        Number.isFinite(tier.min_days) &&
        Number.isFinite(tier.price_per_day) &&
        tier.min_days >= 1 &&
        tier.price_per_day > 0 &&
        // max_days may be null (open-ended); otherwise it must be a finite
        // number not smaller than min_days.
        (tier.max_days === null ||
          (Number.isFinite(tier.max_days) && tier.max_days >= tier.min_days)),
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
    (tier) =>
      durationDays >= tier.min_days &&
      (tier.max_days === null || durationDays <= tier.max_days),
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
  /** Effective daily rate charged — the discounted rate when a promo applies. */
  dailyRate: number;
  /** Effective total — days × effective daily rate. */
  totalPrice: number;
  tier: PricingTier | null;
  /** Daily rate before any promotion (the tier/base rate). */
  originalDailyRate: number;
  /** Total before any promotion, for strikethrough display. */
  originalTotal: number;
  /** The promotion applied, if any. */
  promotion: Promotion | null;
};

/**
 * Authoritative quote for a car over a date range. The server uses this to set
 * total_price; the client uses it for display. Returns a zero-day quote for
 * invalid/empty ranges.
 *
 * When an active `promotion` is passed, the discount is applied to the effective
 * (tier-selected) daily rate, and `dailyRate`/`totalPrice` become the DISCOUNTED
 * values — so every existing caller (booking persist, detail estimate, summary)
 * automatically charges the promotional price. `originalDailyRate`/`originalTotal`
 * expose the pre-discount figures for strikethrough display. With no promotion,
 * original === effective (fully backward compatible).
 */
export function computeQuote(
  car: Pick<Car, "price_per_day" | "pricing_tiers">,
  startDate: string,
  endDate: string,
  promotion?: Promotion | null,
): Quote {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

  if (!start || !end || end < start) {
    const base = car.price_per_day;
    const discounted = applyPromotionToRate(base, promotion);
    return {
      totalDays: 0,
      dailyRate: discounted,
      totalPrice: 0,
      tier: null,
      originalDailyRate: base,
      originalTotal: 0,
      promotion: promotion ?? null,
    };
  }

  const totalDays = getDaysBetween(start, end);
  const tiers = normalizePricingTiers(car.pricing_tiers);
  const originalDailyRate = getDailyRateForDuration(
    totalDays,
    car.price_per_day,
    tiers,
  );
  const tier = getMatchingTierForDuration(totalDays, tiers);
  const dailyRate = applyPromotionToRate(originalDailyRate, promotion);

  return {
    totalDays,
    dailyRate,
    totalPrice: totalDays * dailyRate,
    tier,
    originalDailyRate,
    originalTotal: totalDays * originalDailyRate,
    promotion: promotion ?? null,
  };
}

/** A full booking quote: the vehicle quote plus priced optional add-ons. */
export type BookingQuote = Quote & {
  /** Vehicle-only total (the effective, promo-adjusted rate × days). */
  vehicleTotal: number;
  /** Priced add-on snapshots for the selected services. */
  addons: AddonLine[];
  /** Sum of all add-on totals. */
  addonsTotal: number;
  /** What the customer pays: vehicleTotal + addonsTotal. */
  grandTotal: number;
};

/**
 * Authoritative booking quote = vehicle quote (via `computeQuote`, unchanged)
 * plus optional add-on services priced over the SAME duration (no duplicated
 * date math). Used by the client for the live breakdown and by the server to
 * persist the grand total + the add-on snapshots. With no add-ons selected,
 * `grandTotal === vehicleTotal`.
 */
export function computeBookingQuote(
  car: Pick<Car, "price_per_day" | "pricing_tiers">,
  startDate: string,
  endDate: string,
  promotion: Promotion | null | undefined,
  addonKeys: AddonKey[],
): BookingQuote {
  const quote = computeQuote(car, startDate, endDate, promotion);
  const addons = computeAddonLines(addonKeys, quote.totalDays);
  const addonsTotal = sumAddonLines(addons);
  return {
    ...quote,
    vehicleTotal: quote.totalPrice,
    addons,
    addonsTotal,
    grandTotal: quote.totalPrice + addonsTotal,
  };
}
