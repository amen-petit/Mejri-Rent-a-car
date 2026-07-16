export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const BRAND_NAME =
  process.env.NEXT_PUBLIC_BRAND_NAME || "Fekra rent a car";

// Short brand mark used in headings and the decorative background watermark.
export const BRAND_SHORT = process.env.NEXT_PUBLIC_BRAND_SHORT || "Fekra";

export const PHONE_DISPLAY =
  process.env.NEXT_PUBLIC_PHONE_DISPLAY || "28 538 910";

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "21628538910";

export const PHONE2_DISPLAY =
  process.env.NEXT_PUBLIC_PHONE2_DISPLAY || "27 06 03 08";

// E.164 tel: target. The WhatsApp number already carries the country code, so we
// derive the dialable number from it and prefix "+". Keep a single source so the
// navbar, footer and CTA can never drift from the displayed number.
export const PHONE_TEL = `+${WHATSAPP_NUMBER.replace(/\D/g, "")}`;
export const PHONE2_TEL = `+216${PHONE2_DISPLAY.replace(/\D/g, "")}`;

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
export const MAPS_ADDRESS = process.env.NEXT_PUBLIC_MAPS_ADDRESS || MAPS_QUERY;

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

// "Voir tous les avis" target — the reviews tab of the Google listing.
export const REVIEWS_URL =
  process.env.NEXT_PUBLIC_GOOGLE_REVIEWS_URL ||
  "https://maps.app.goo.gl/d6hKdW44pPWXxiUj8";

export const FEATURED_CARS_LIMIT = 3;

// How many vedette (featured) cars the hero rotates through, one every few
// seconds. Caps the rotation so the fleet below always keeps some cars of its
// own; falls back to a single car when nothing is featured yet.
export const HERO_ROTATION_LIMIT = 5;

// ── Fleet data cache ─────────────────────────────────────────────────────────
// The public fleet (home page) is read through Next's data cache instead of
// hitting Supabase on every request. The list only changes when an admin
// mutates a car, so every admin car write busts CARS_CACHE_TAG for a near-
// instant update; the time window below is a bounded-staleness safety net in
// case a bust is ever missed. Shared here so the reader (lib/cars) and the
// admin route handlers can never drift on the tag name.
export const CARS_CACHE_TAG = "cars";
export const CARS_CACHE_REVALIDATE_SECONDS = 300;

// Active promotions are cached alongside the fleet and busted whenever an admin
// creates/edits/deletes a promotion. Date-based expiry is bounded by the same
// revalidate window as the fleet.
export const PROMOS_CACHE_TAG = "promotions";

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

// Pickup / return time slots offered to the client: 00:00–23:30 in 30-min steps.
// Single source of truth shared by the booking UI and the server validation, so
// the dropdown and the accepted values can never drift apart.
export const BOOKING_TIME_START_MIN = 0; // 00:00
export const BOOKING_TIME_END_MIN = 23 * 60 + 30; // 23:30
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
// The agency plus every major Tunisian airport. Modeled as a config enum (with a
// matching DB CHECK constraint) rather than a table — a near-static national list
// where compile-time type safety is worth more than runtime editability. Adding a
// location later = one value here + its labels in the i18n dictionaries
// (booking.locations) + widening the CHECK (supabase/expand-locations.sql).
// `airport` is the legacy code for Tunis-Carthage, kept so existing reservations
// need no backfill; the rest use descriptive codes. Order = display order.
// These are the canonical stored values.
export const RENTAL_LOCATIONS = [
  "agency",
  "airport", // Aéroport Tunis-Carthage (legacy code — kept to avoid a backfill)
  "enfidha_hammamet",
  "monastir",
  "djerba_zarzis",
  "sfax_thyna",
  "tozeur_nefta",
  "tabarka_ain_draham",
  "gafsa_ksar",
] as const;

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

// ── Promotions ───────────────────────────────────────────────────────────────
// Canonical stored values, mirrored by the DB CHECK constraints in
// supabase/add-promotions.sql. Keep this list and the migration in sync.
export const PROMOTION_TYPES = ["percentage", "fixed"] as const;
export const PROMO_BADGE_STYLES = ["warm", "accent", "ink"] as const;
export const DEFAULT_PROMO_BADGE_STYLE = "warm" as const;

export const FUEL_TYPES = [
  "Essence",
  "Diesel",
  "Hybride",
  "Électrique",
] as const;
