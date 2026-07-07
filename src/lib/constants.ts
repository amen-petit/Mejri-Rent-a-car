export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const BRAND_NAME =
  process.env.NEXT_PUBLIC_BRAND_NAME || "Fekra rent a car";

// Short brand mark used in headings and the decorative background watermark.
export const BRAND_SHORT =
  process.env.NEXT_PUBLIC_BRAND_SHORT || "Fekra";

export const PHONE_DISPLAY =
  process.env.NEXT_PUBLIC_PHONE_DISPLAY || "28 538 910";

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "21628538910";

// E.164 tel: target. The WhatsApp number already carries the country code, so we
// derive the dialable number from it and prefix "+". Keep a single source so the
// navbar, footer and CTA can never drift from the displayed number.
export const PHONE_TEL = `+${WHATSAPP_NUMBER.replace(/\D/g, "")}`;

// ── Social media ────────────────────────────────────────────────────────────
// Central place for outbound social URLs. Empty string = link hidden, so a
// client without an Instagram page simply doesn't render that icon.
export const SOCIAL_LINKS = {
  facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
} as const;

// ── Location / Google Maps ──────────────────────────────────────────────────
// Driven by a single query (address or business name). The embed uses Google's
// keyless `output=embed` endpoint; the button opens the Maps search UI. Set
// NEXT_PUBLIC_MAPS_QUERY to the agency's real address/place for production.
export const MAPS_QUERY =
  process.env.NEXT_PUBLIC_MAPS_QUERY || `${BRAND_NAME}, Tunisie`;

// Human-readable address shown next to the map (falls back to the query).
export const MAPS_ADDRESS =
  process.env.NEXT_PUBLIC_MAPS_ADDRESS || MAPS_QUERY;

// Prefer an explicit embed URL (Google Maps → Share → Embed a map) when set:
// it pins the exact business/place. Otherwise fall back to a keyless query embed
// derived from MAPS_QUERY.
export const MAPS_EMBED_URL =
  process.env.NEXT_PUBLIC_MAPS_EMBED_URL ||
  `https://www.google.com/maps?q=${encodeURIComponent(MAPS_QUERY)}&output=embed`;

// "Open in Google Maps" target. Overridable so the button lands on the same
// place as the embed; defaults to a search on MAPS_QUERY.
export const MAPS_LINK_URL =
  process.env.NEXT_PUBLIC_MAPS_LINK_URL ||
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    MAPS_QUERY,
  )}`;

export const FEATURED_CARS_LIMIT = 3;

export const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Minimum lead time (minutes) required for a same-day pickup. Shared by the
// booking UI (to filter selectable slots) and the API (to reject stale slots),
// so both sides agree on what counts as "too soon".
export const PICKUP_LEAD_MINUTES = 30;

export const EMAIL_DEFAULT_PORT = 587;

export const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export const MONTHS_FR_SHORT = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

export const DAYS_FR = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

// Pickup / return time slots offered to the client: 08:00–20:00 in 30-min steps.
// Single source of truth shared by the booking UI and the server validation, so
// the dropdown and the accepted values can never drift apart.
export const BOOKING_TIME_START_MIN = 8 * 60; // 08:00
export const BOOKING_TIME_END_MIN = 20 * 60; // 20:00
export const BOOKING_TIME_STEP_MIN = 30;

export const BOOKING_TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (
    let m = BOOKING_TIME_START_MIN;
    m <= BOOKING_TIME_END_MIN;
    m += BOOKING_TIME_STEP_MIN
  ) {
    const h = String(Math.floor(m / 60)).padStart(2, "0");
    const min = String(m % 60).padStart(2, "0");
    slots.push(`${h}:${min}`);
  }
  return slots;
})();

export const DEFAULT_PICKUP_TIME = "10:00";
export const DEFAULT_RETURN_TIME = "10:00";

export const RESERVATION_STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  cancelled: "Annulée",
};

export const RESERVATION_STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed: "bg-primary/20 text-navy border-primary",
  cancelled: "bg-red-50 text-red-500 border-red-200",
};

// ── Rental pickup / return locations ─────────────────────────────────────────
// Only two fixed points exist for this agency. Modeled as a config enum (with a
// matching DB CHECK constraint) rather than a table — simple now, and extended
// by adding a value here + the migration. Labels are localized in the i18n
// dictionaries (booking.locations); these are the canonical stored values.
export const RENTAL_LOCATIONS = ["agency", "airport"] as const;

export type RentalLocation = (typeof RENTAL_LOCATIONS)[number];

export const DEFAULT_RENTAL_LOCATION: RentalLocation = "agency";

export function isRentalLocation(value: unknown): value is RentalLocation {
  return (
    typeof value === "string" &&
    (RENTAL_LOCATIONS as readonly string[]).includes(value)
  );
}

export const CAR_CATEGORIES = [
  "Citadine",
  "Berline",
  "SUV",
  "Utilitaire",
  "Luxe",
] as const;

export const TRANSMISSION_OPTIONS = ["Manuelle", "Automatique"] as const;

export const FUEL_TYPES = [
  "Essence",
  "Diesel",
  "Hybride",
  "Électrique",
] as const;
