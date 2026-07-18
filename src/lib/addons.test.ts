import { describe, it, expect } from "vitest";
import {
  computeAddonLines,
  sumAddonLines,
  getAddonService,
  isAddonKey,
} from "./addons";

describe("getAddonService", () => {
  it("returns the chauffeur service at 30 DT/day", () => {
    expect(getAddonService("chauffeur")).toEqual({
      key: "chauffeur",
      pricePerDay: 30,
    });
  });
});

describe("isAddonKey", () => {
  it("accepts known keys and rejects everything else", () => {
    expect(isAddonKey("chauffeur")).toBe(true);
    expect(isAddonKey("gps")).toBe(false);
    expect(isAddonKey(null)).toBe(false);
    expect(isAddonKey(30)).toBe(false);
  });
});

describe("computeAddonLines", () => {
  it("prices chauffeur as days × 30", () => {
    expect(computeAddonLines(["chauffeur"], 1)).toEqual([
      { key: "chauffeur", daily_rate: 30, days: 1, total: 30 },
    ]);
    expect(computeAddonLines(["chauffeur"], 5)).toEqual([
      { key: "chauffeur", daily_rate: 30, days: 5, total: 150 },
    ]);
    expect(computeAddonLines(["chauffeur"], 10)[0].total).toBe(300);
  });

  it("returns [] for no keys or non-positive duration", () => {
    expect(computeAddonLines([], 5)).toEqual([]);
    expect(computeAddonLines(["chauffeur"], 0)).toEqual([]);
    expect(computeAddonLines(["chauffeur"], -3)).toEqual([]);
  });

  it("dedupes repeated keys", () => {
    expect(computeAddonLines(["chauffeur", "chauffeur"], 3)).toHaveLength(1);
  });

  it("silently drops unknown keys", () => {
    // Cast simulates a malformed/legacy key slipping through.
    expect(
      computeAddonLines(["gps" as unknown as "chauffeur"], 3),
    ).toEqual([]);
  });
});

describe("sumAddonLines", () => {
  it("sums line totals", () => {
    expect(sumAddonLines(computeAddonLines(["chauffeur"], 7))).toBe(210);
    expect(sumAddonLines([])).toBe(0);
  });
});
