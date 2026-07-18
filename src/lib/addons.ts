/**
 * Optional booking add-on services (chauffeur, and future services like GPS,
 * baby seat, additional driver, Wi-Fi, insurance…). Pure and framework-agnostic
 * — no React, no DOM, no network, no server-only imports — so it's the single
 * source of truth for add-on pricing, shared by the client (display), the admin
 * preview, and the server (authoritative booking).
 *
 * To add a future service: append one entry to ADDON_SERVICES here, add its
 * label to the i18n `addons` map, and widen the DB CHECK-equivalent (the jsonb
 * column is schemaless, so no migration is needed — only these two edits).
 */

/** Canonical stored add-on keys. The source of truth for the enum. */
export const ADDON_KEYS = ["chauffeur"] as const;
export type AddonKey = (typeof ADDON_KEYS)[number];

export type AddonService = {
  key: AddonKey;
  /** Price charged per rental day, in DT. */
  pricePerDay: number;
};

/**
 * The catalog — the ONLY place a service's current price lives. Reservations
 * snapshot the rate they used (see AddonLine), so changing a price here never
 * alters historical bookings.
 */
export const ADDON_SERVICES: readonly AddonService[] = [
  { key: "chauffeur", pricePerDay: 30 },
];

/** A priced add-on snapshot stored on a reservation. */
export type AddonLine = {
  key: AddonKey;
  /** Rate used at booking time (DT/day) — frozen for historical accuracy. */
  daily_rate: number;
  days: number;
  total: number;
};

export function getAddonService(key: AddonKey): AddonService | undefined {
  return ADDON_SERVICES.find((s) => s.key === key);
}

export function isAddonKey(value: unknown): value is AddonKey {
  return (
    typeof value === "string" && (ADDON_KEYS as readonly string[]).includes(value)
  );
}

/**
 * Price the selected add-ons for a rental duration. Reuses `totalDays` from the
 * vehicle quote (never re-derives duration). Dedupes keys, drops unknown keys
 * and non-positive durations, and returns a snapshot line per service.
 */
export function computeAddonLines(
  keys: AddonKey[],
  totalDays: number,
): AddonLine[] {
  if (totalDays <= 0) return [];
  const seen = new Set<AddonKey>();
  const lines: AddonLine[] = [];
  for (const key of keys) {
    if (seen.has(key)) continue;
    const service = getAddonService(key);
    if (!service) continue;
    seen.add(key);
    lines.push({
      key,
      daily_rate: service.pricePerDay,
      days: totalDays,
      total: service.pricePerDay * totalDays,
    });
  }
  return lines;
}

export function sumAddonLines(lines: AddonLine[]): number {
  return lines.reduce((sum, line) => sum + line.total, 0);
}
