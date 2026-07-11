/**
 * Pure, framework-agnostic promotion logic. THE single source of the discount
 * math, shared by the client (display), the admin preview, and the server
 * (authoritative booking). No React, no DOM, no network, no server-only imports
 * — safe to reuse from client components and from `pricing.ts`.
 *
 * Dates are calendar dates (YYYY-MM-DD); string comparison is correct for that
 * ISO format, which sidesteps timezone drift between browser and server.
 */
import type { Promotion } from "./types";

/** Today's calendar date (YYYY-MM-DD) in UTC. */
export function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * A promotion counts only when it is toggled on AND today falls inside its
 * inclusive [start_date, end_date] window. This is what makes not-yet-started
 * and expired promotions disappear automatically, with no cron.
 */
export function isPromotionActive(
  promo: Promotion,
  today: string = todayYmd(),
): boolean {
  return (
    promo.is_active &&
    promo.start_date <= today &&
    promo.end_date >= today
  );
}

/**
 * Resolve the one promotion to apply for a car right now. Overlapping active
 * promos are blocked at the admin API, so there is normally 0 or 1 match; if
 * several ever slip through, the most recently created active one wins
 * deterministically.
 */
export function getActivePromotion(
  promotions: Promotion[],
  carId: string,
  today: string = todayYmd(),
): Promotion | null {
  const active = promotions
    .filter((p) => p.car_id === carId && isPromotionActive(p, today))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return active[0] ?? null;
}

/**
 * Apply a promotion to a per-day rate. `percentage` takes a percent off;
 * `fixed` takes a flat amount off per day. The result is derived from the given
 * base rate (never a stored price) and floored at 0, so the discounted price is
 * always consistent with the car's current pricing.
 */
export function applyPromotionToRate(
  baseRate: number,
  promo: Promotion | null | undefined,
): number {
  if (!promo) return baseRate;
  if (promo.discount_type === "percentage") {
    return Math.max(0, Math.round(baseRate * (1 - promo.discount_value / 100)));
  }
  // fixed amount off per day
  return Math.max(0, baseRate - promo.discount_value);
}

export type PromotionSavings = {
  original: number;
  discounted: number;
  savingsAmount: number;
  savingsPct: number;
};

/** Original vs discounted rate plus the saving, for badges and strikethroughs. */
export function computePromotionSavings(
  baseRate: number,
  promo: Promotion | null | undefined,
): PromotionSavings {
  const discounted = applyPromotionToRate(baseRate, promo);
  const savingsAmount = Math.max(0, baseRate - discounted);
  const savingsPct =
    baseRate > 0 ? Math.round((savingsAmount / baseRate) * 100) : 0;
  return { original: baseRate, discounted, savingsAmount, savingsPct };
}

/**
 * Attach each car's currently-active promotion. Pure merge used by the public
 * pages so the "which promo applies" decision lives in exactly one place.
 */
export function attachPromotions<C extends { id: string }>(
  cars: C[],
  promotions: Promotion[],
  today: string = todayYmd(),
): (C & { promotion: Promotion | null })[] {
  return cars.map((car) => ({
    ...car,
    promotion: getActivePromotion(promotions, car.id, today),
  }));
}
