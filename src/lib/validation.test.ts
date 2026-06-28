import { describe, it, expect } from "vitest";
import { pricingTierSchema } from "./validation";

describe("pricingTierSchema", () => {
  it("accepts an open-ended tier (null max_days)", () => {
    const result = pricingTierSchema.safeParse({
      min_days: 15,
      max_days: null,
      price_per_day: 60,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a bounded tier", () => {
    const result = pricingTierSchema.safeParse({
      min_days: 1,
      max_days: 7,
      price_per_day: 80,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a bounded tier where max < min", () => {
    const result = pricingTierSchema.safeParse({
      min_days: 10,
      max_days: 5,
      price_per_day: 80,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive price", () => {
    const result = pricingTierSchema.safeParse({
      min_days: 1,
      max_days: 7,
      price_per_day: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a min_days below 1", () => {
    const result = pricingTierSchema.safeParse({
      min_days: 0,
      max_days: 7,
      price_per_day: 80,
    });
    expect(result.success).toBe(false);
  });
});
