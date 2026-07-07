/**
 * Zod schemas for validating untrusted input at API boundaries.
 * Shared by the server route handlers.
 */
import { z } from "zod";
import {
  CAR_CATEGORIES,
  TRANSMISSION_OPTIONS,
  FUEL_TYPES,
  BOOKING_TIME_SLOTS,
  RENTAL_LOCATIONS,
} from "./constants";

export const pricingTierSchema = z
  .object({
    min_days: z.number().int().min(1).max(3650),
    // null = open-ended ("from min_days and up").
    max_days: z.number().int().min(1).max(3650).nullable(),
    price_per_day: z.number().positive().max(1_000_000),
  })
  .refine((tier) => tier.max_days === null || tier.max_days >= tier.min_days, {
    message: "max_days must be greater than or equal to min_days",
  });

export const carInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  brand: z.string().trim().min(1).max(120),
  category: z.enum(CAR_CATEGORIES),
  price_per_day: z.number().positive().max(1_000_000),
  quantity: z.number().int().min(1).max(1000),
  transmission: z.enum(TRANSMISSION_OPTIONS),
  fuel_type: z.enum(FUEL_TYPES),
  seats: z.number().int().min(1).max(99),
  description: z.string().trim().max(5000).nullable().optional(),
  features: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
  is_available: z.boolean(),
  is_featured: z.boolean(),
  pricing_tiers: z.array(pricingTierSchema).max(20).nullable().optional(),
});

export type CarInput = z.infer<typeof carInputSchema>;

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

// HH:MM that must be one of the offered booking slots (08:00–20:00, 30-min).
// Validating against the shared slot list keeps the server authoritative: a
// crafted request can't smuggle an out-of-hours time past the UI.
const bookingTime = z
  .string()
  .refine((t) => BOOKING_TIME_SLOTS.includes(t), {
    message: "Heure invalide",
  });

const rentalLocation = z.enum(RENTAL_LOCATIONS);

export const reservationInputSchema = z
  .object({
    car_id: z.string().uuid(),
    client_name: z.string().trim().min(1).max(120),
    client_phone: z.string().trim().min(4).max(40),
    client_email: z.string().trim().email().max(200).nullable().optional(),
    start_date: dateOnly,
    end_date: dateOnly,
    pickup_time: bookingTime,
    return_time: bookingTime,
    pickup_location: rentalLocation,
    return_location: rentalLocation,
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((r) => r.end_date >= r.start_date, {
    message: "end_date must be on or after start_date",
    path: ["end_date"],
  })
  // On a single-day rental the return must be strictly after the pickup.
  .refine(
    (r) => r.start_date !== r.end_date || r.return_time > r.pickup_time,
    {
      message: "return_time must be after pickup_time on the same day",
      path: ["return_time"],
    },
  );

export type ReservationInput = z.infer<typeof reservationInputSchema>;

export const reservationStatusSchema = z.object({
  status: z.enum(["confirmed", "cancelled", "pending"]),
});

// Availability search (hero booking card → GET /api/cars/search). Locations are
// intentionally NOT part of this schema: they don't affect which cars are
// available, only how the resulting reservation is fulfilled.
export const availabilitySearchSchema = z
  .object({
    start: dateOnly,
    end: dateOnly,
  })
  .refine((s) => s.end >= s.start, {
    message: "end must be on or after start",
    path: ["end"],
  });

export type AvailabilitySearch = z.infer<typeof availabilitySearchSchema>;
