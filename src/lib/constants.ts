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

export const FEATURED_CARS_LIMIT = 3;

export const MS_PER_DAY = 1000 * 60 * 60 * 24;

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
