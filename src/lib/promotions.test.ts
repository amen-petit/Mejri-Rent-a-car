import { describe, it, expect } from "vitest";
import {
  isPromotionActive,
  getActivePromotion,
  applyPromotionToRate,
  computePromotionSavings,
} from "./promotions";
import type { Promotion } from "./types";

function mkPromo(over: Partial<Promotion> = {}): Promotion {
  return {
    id: "p1",
    car_id: "c1",
    discount_type: "percentage",
    discount_value: 20,
    label: "Summer Sale",
    badge_style: "warm",
    start_date: "2025-06-01",
    end_date: "2025-06-30",
    is_active: true,
    created_at: "2025-05-01T00:00:00Z",
    ...over,
  };
}

describe("isPromotionActive", () => {
  it("is active inside the window when enabled", () => {
    expect(isPromotionActive(mkPromo(), "2025-06-15")).toBe(true);
    expect(isPromotionActive(mkPromo(), "2025-06-01")).toBe(true); // inclusive start
    expect(isPromotionActive(mkPromo(), "2025-06-30")).toBe(true); // inclusive end
  });

  it("is inactive before the start or after the end", () => {
    expect(isPromotionActive(mkPromo(), "2025-05-31")).toBe(false);
    expect(isPromotionActive(mkPromo(), "2025-07-01")).toBe(false);
  });

  it("is inactive when disabled regardless of date", () => {
    expect(isPromotionActive(mkPromo({ is_active: false }), "2025-06-15")).toBe(
      false,
    );
  });
});

describe("applyPromotionToRate", () => {
  it("returns the base rate with no promotion", () => {
    expect(applyPromotionToRate(100, null)).toBe(100);
  });

  it("applies a percentage discount (rounded)", () => {
    expect(applyPromotionToRate(100, mkPromo({ discount_value: 20 }))).toBe(80);
    expect(applyPromotionToRate(130, mkPromo({ discount_value: 15 }))).toBe(111); // 110.5 -> 111
  });

  it("applies a fixed discount and never goes below zero", () => {
    expect(
      applyPromotionToRate(
        100,
        mkPromo({ discount_type: "fixed", discount_value: 15 }),
      ),
    ).toBe(85);
    expect(
      applyPromotionToRate(
        10,
        mkPromo({ discount_type: "fixed", discount_value: 999 }),
      ),
    ).toBe(0);
  });
});

describe("computePromotionSavings", () => {
  it("reports amount and percent saved", () => {
    const s = computePromotionSavings(200, mkPromo({ discount_value: 25 }));
    expect(s).toEqual({
      original: 200,
      discounted: 150,
      savingsAmount: 50,
      savingsPct: 25,
    });
  });
});

describe("getActivePromotion", () => {
  it("returns null when nothing matches the car or the date", () => {
    expect(getActivePromotion([mkPromo()], "other-car", "2025-06-15")).toBeNull();
    expect(getActivePromotion([mkPromo()], "c1", "2025-01-01")).toBeNull();
  });

  it("returns the active promotion for the car", () => {
    expect(getActivePromotion([mkPromo()], "c1", "2025-06-15")?.id).toBe("p1");
  });

  it("prefers the most recently created when several are active (backstop)", () => {
    const older = mkPromo({ id: "old", created_at: "2025-05-01T00:00:00Z" });
    const newer = mkPromo({ id: "new", created_at: "2025-05-20T00:00:00Z" });
    expect(getActivePromotion([older, newer], "c1", "2025-06-15")?.id).toBe(
      "new",
    );
  });
});
