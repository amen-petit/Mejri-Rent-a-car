import { describe, it, expect } from "vitest";
import { parseDateOnly, getDaysBetween } from "./dates";
import {
  normalizePricingTiers,
  getMatchingTierForDuration,
  getDailyRateForDuration,
  computeQuote,
} from "./pricing";
import type { PricingTier } from "./types";

const tiers: PricingTier[] = [
  { min_days: 1, max_days: 3, price_per_day: 100 },
  { min_days: 4, max_days: 7, price_per_day: 80 },
  { min_days: 8, max_days: 30, price_per_day: 60 },
];

describe("parseDateOnly", () => {
  it("parses a valid YYYY-MM-DD as UTC", () => {
    const d = parseDateOnly("2025-06-15");
    expect(d).not.toBeNull();
    expect(d!.getUTCFullYear()).toBe(2025);
    expect(d!.getUTCMonth()).toBe(5);
    expect(d!.getUTCDate()).toBe(15);
  });

  it("rejects malformed strings", () => {
    expect(parseDateOnly("2025-6-5")).toBeNull();
    expect(parseDateOnly("15/06/2025")).toBeNull();
    expect(parseDateOnly("")).toBeNull();
    expect(parseDateOnly("not-a-date")).toBeNull();
  });

  it("rejects out-of-range months and days", () => {
    expect(parseDateOnly("2025-13-01")).toBeNull();
    expect(parseDateOnly("2025-00-10")).toBeNull();
    expect(parseDateOnly("2025-02-30")).toBeNull();
    expect(parseDateOnly("2025-06-31")).toBeNull();
  });
});

describe("getDaysBetween", () => {
  it("counts inclusively", () => {
    expect(
      getDaysBetween(parseDateOnly("2025-01-01")!, parseDateOnly("2025-01-01")!),
    ).toBe(1);
    expect(
      getDaysBetween(parseDateOnly("2025-01-01")!, parseDateOnly("2025-01-03")!),
    ).toBe(3);
  });

  it("is unaffected by DST month boundaries", () => {
    expect(
      getDaysBetween(parseDateOnly("2025-03-30")!, parseDateOnly("2025-04-02")!),
    ).toBe(4);
  });
});

describe("normalizePricingTiers", () => {
  it("returns [] for null/empty", () => {
    expect(normalizePricingTiers(null)).toEqual([]);
    expect(normalizePricingTiers([])).toEqual([]);
  });

  it("filters out invalid tiers", () => {
    const dirty: PricingTier[] = [
      { min_days: 0, max_days: 3, price_per_day: 100 }, // min < 1
      { min_days: 5, max_days: 2, price_per_day: 100 }, // max < min
      { min_days: 1, max_days: 3, price_per_day: 0 }, // price <= 0
      { min_days: 4, max_days: 7, price_per_day: 80 }, // valid
    ];
    expect(normalizePricingTiers(dirty)).toEqual([
      { min_days: 4, max_days: 7, price_per_day: 80 },
    ]);
  });

  it("sorts ascending by min_days", () => {
    const result = normalizePricingTiers([tiers[2], tiers[0], tiers[1]]);
    expect(result.map((t) => t.min_days)).toEqual([1, 4, 8]);
  });
});

describe("getMatchingTierForDuration", () => {
  it("returns null for non-positive duration or no tiers", () => {
    expect(getMatchingTierForDuration(0, tiers)).toBeNull();
    expect(getMatchingTierForDuration(5, [])).toBeNull();
    expect(getMatchingTierForDuration(5, null)).toBeNull();
  });

  it("matches the exact tier for an in-range duration", () => {
    expect(getMatchingTierForDuration(2, tiers)).toEqual(tiers[0]);
    expect(getMatchingTierForDuration(5, tiers)).toEqual(tiers[1]);
    expect(getMatchingTierForDuration(10, tiers)).toEqual(tiers[2]);
  });

  it("matches tier boundaries", () => {
    expect(getMatchingTierForDuration(3, tiers)).toEqual(tiers[0]);
    expect(getMatchingTierForDuration(4, tiers)).toEqual(tiers[1]);
  });

  it("falls back to the highest applicable lower tier across a gap", () => {
    const gapped: PricingTier[] = [
      { min_days: 1, max_days: 3, price_per_day: 100 },
      { min_days: 8, max_days: 30, price_per_day: 60 },
    ];
    // 5 days has no exact tier -> nearest lower tier (1-3)
    expect(getMatchingTierForDuration(5, gapped)).toEqual(gapped[0]);
  });

  it("uses the highest lower tier when above all ranges", () => {
    expect(getMatchingTierForDuration(40, tiers)).toEqual(tiers[2]);
  });

  it("returns the first tier when below all ranges", () => {
    const high: PricingTier[] = [{ min_days: 3, max_days: 5, price_per_day: 90 }];
    expect(getMatchingTierForDuration(1, high)).toEqual(high[0]);
  });

  it("matches an open-ended tier (null max) for any duration at/above its min", () => {
    const openEnded: PricingTier[] = [
      { min_days: 1, max_days: 14, price_per_day: 100 },
      { min_days: 15, max_days: null, price_per_day: 60 }, // 15 and up
    ];
    expect(getMatchingTierForDuration(15, openEnded)).toEqual(openEnded[1]);
    expect(getMatchingTierForDuration(400, openEnded)).toEqual(openEnded[1]);
    expect(getMatchingTierForDuration(10, openEnded)).toEqual(openEnded[0]);
  });
});

describe("getDailyRateForDuration", () => {
  it("returns the default rate when no tiers", () => {
    expect(getDailyRateForDuration(5, 120, null)).toBe(120);
    expect(getDailyRateForDuration(5, 120, [])).toBe(120);
  });

  it("returns the default rate for non-positive duration", () => {
    expect(getDailyRateForDuration(0, 120, tiers)).toBe(120);
  });

  it("returns the tier rate when tiers apply", () => {
    expect(getDailyRateForDuration(2, 120, tiers)).toBe(100);
    expect(getDailyRateForDuration(5, 120, tiers)).toBe(80);
    expect(getDailyRateForDuration(10, 120, tiers)).toBe(60);
  });
});

describe("computeQuote", () => {
  it("uses the flat rate when there are no tiers", () => {
    const q = computeQuote(
      { price_per_day: 120, pricing_tiers: null },
      "2025-01-01",
      "2025-01-03",
    );
    expect(q).toEqual({ totalDays: 3, dailyRate: 120, totalPrice: 360, tier: null });
  });

  it("applies the matching tier rate", () => {
    const q = computeQuote(
      { price_per_day: 120, pricing_tiers: tiers },
      "2025-01-01",
      "2025-01-05",
    );
    expect(q.totalDays).toBe(5);
    expect(q.dailyRate).toBe(80);
    expect(q.totalPrice).toBe(400);
    expect(q.tier).toEqual(tiers[1]);
  });

  it("handles a single-day booking", () => {
    const q = computeQuote(
      { price_per_day: 120, pricing_tiers: null },
      "2025-01-01",
      "2025-01-01",
    );
    expect(q.totalDays).toBe(1);
    expect(q.totalPrice).toBe(120);
  });

  it("returns a zero quote when end is before start", () => {
    const q = computeQuote(
      { price_per_day: 120, pricing_tiers: tiers },
      "2025-01-10",
      "2025-01-05",
    );
    expect(q.totalDays).toBe(0);
    expect(q.totalPrice).toBe(0);
    expect(q.tier).toBeNull();
  });

  it("applies an open-ended tier for a long rental", () => {
    const openEnded: PricingTier[] = [
      { min_days: 1, max_days: 14, price_per_day: 100 },
      { min_days: 15, max_days: null, price_per_day: 60 },
    ];
    const q = computeQuote(
      { price_per_day: 120, pricing_tiers: openEnded },
      "2025-01-01",
      "2025-01-20", // 20 days
    );
    expect(q.totalDays).toBe(20);
    expect(q.dailyRate).toBe(60);
    expect(q.totalPrice).toBe(1200);
    expect(q.tier).toEqual(openEnded[1]);
  });

  it("returns a zero quote for invalid dates", () => {
    const q = computeQuote(
      { price_per_day: 120, pricing_tiers: null },
      "2025-13-40",
      "2025-13-45",
    );
    expect(q.totalDays).toBe(0);
    expect(q.totalPrice).toBe(0);
  });
});
