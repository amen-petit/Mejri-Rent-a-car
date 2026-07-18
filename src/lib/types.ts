export type PricingTier = {
  min_days: number;
  /** Upper bound (inclusive). `null` means open-ended — "from min_days and up". */
  max_days: number | null;
  price_per_day: number;
};

export type Car = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price_per_day: number;
  transmission: string;
  fuel_type: string;
  seats: number;
  features: string[];
  images: string[];
  is_available: boolean;
  is_featured: boolean;
  description: string | null;
  quantity: number;
  pricing_tiers?: PricingTier[] | null;
  created_at: string;
};

export type PromotionType = "percentage" | "fixed";
export type PromotionBadgeStyle = "warm" | "accent" | "ink";

/**
 * A marketing campaign attached to one car. `discount_type` decides how
 * `discount_value` is read: a percent off (`percentage`) or a flat amount off
 * per day (`fixed`). The effective price is always derived from the car's
 * current price — nothing here stores a frozen promotional price.
 */
export type Promotion = {
  id: string;
  car_id: string;
  discount_type: PromotionType;
  discount_value: number;
  label: string | null;
  badge_style: PromotionBadgeStyle;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  is_active: boolean;
  created_at: string;
};

/** A car with its currently-active promotion attached (null when none). */
export type CarWithPromotion = Car & { promotion?: Promotion | null };

import type { RentalLocation } from "./constants";
import type { AddonLine } from "./addons";

/** A priced optional add-on service stored on a reservation (snapshot). */
export type ReservationAddon = AddonLine;

export type Reservation = {
  id: string;
  car_id: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  start_date: string;
  end_date: string;
  pickup_time: string | null;
  return_time: string | null;
  pickup_location: RentalLocation;
  return_location: RentalLocation;
  total_price: number;
  // Price snapshot at booking time. Null on reservations made before promotions
  // existed; otherwise both are set (equal when no promo applied) so historical
  // records never shift if a car's price or a promotion changes later.
  original_price_per_day: number | null;
  discounted_price_per_day: number | null;
  promotion_label: string | null;
  // Optional add-on services (chauffeur, …). Priced snapshots; defaults to []
  // for reservations made before add-ons existed. total_price is the GRAND
  // total (vehicle + these).
  addons: ReservationAddon[];
  status: "pending" | "confirmed" | "cancelled";
  notes: string | null;
  created_at: string;
  car?: Car;
};
