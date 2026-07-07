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

import type { RentalLocation } from "./constants";

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
  status: "pending" | "confirmed" | "cancelled";
  notes: string | null;
  created_at: string;
  car?: Car;
};
