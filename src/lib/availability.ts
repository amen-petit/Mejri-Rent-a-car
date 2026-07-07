/**
 * Pure, framework-agnostic fleet-availability logic. Single source of truth for
 * the admin availability view, shared by the API route (authoritative compute)
 * and unit tests. No React, no DOM, no network, no Supabase.
 *
 * Availability model:
 *   - Each car has `quantity` physical units.
 *   - A reservation occupies one unit on every calendar day in
 *     [start_date, end_date] (inclusive).
 *   - Only CONFIRMED reservations consume inventory. Pending requests are shown
 *     to the owner for awareness but do not reduce availability until confirmed.
 *   - On a given day, rented units = number of confirmed reservations
 *     overlapping that day; available units = quantity − rented.
 *
 * For a date RANGE we report the PEAK concurrent reservations across the range.
 * A unit is free for the whole range only if it is free on the busiest day, so
 * `quantity − peak` is exactly the number of units still bookable for the
 * entire window — the question an owner actually asks.
 */
import type { Reservation } from "./types";
import { MS_PER_DAY } from "./constants";
import { parseDateOnly } from "./dates";

/** Maximum span (inclusive days) accepted for a range query, to bound work. */
export const MAX_AVAILABILITY_RANGE_DAYS = 366;

/** Minimal car shape the availability compute needs. */
export type AvailabilityCar = {
  id: string;
  brand: string;
  name: string;
  images: string[];
  quantity: number;
  is_available: boolean;
};

export type CarAvailability = {
  car: AvailabilityCar;
  /** Physical units for this model (quantity, floored at 0). */
  totalUnits: number;
  /** Units occupied at the busiest day of the window (peak concurrent). */
  rentedUnits: number;
  /** Units still bookable for the whole window. 0 when the car is offline. */
  availableUnits: number;
  /** True when staff manually took the car offline (is_available = false). */
  isOffline: boolean;
  /** Active reservations overlapping the window, sorted by start date. */
  reservations: Reservation[];
};

export type FleetAvailabilitySummary = {
  windowStart: string;
  windowEnd: string;
  isRange: boolean;
  /** Number of car models in the fleet. */
  totalCars: number;
  /** Sum of quantity across all cars. */
  totalUnits: number;
  /** Sum of quantity across offline (is_available = false) cars. */
  offlineUnits: number;
  /** Peak rented units summed across cars. */
  rentedUnits: number;
  /** Units still bookable for the whole window, summed across cars. */
  availableUnits: number;
  /** Models with at least one bookable unit for the window. */
  carsAvailable: number;
  /** In-service models with zero bookable units for the window. */
  carsFullyBooked: number;
  /** Confirmed reservations overlapping the window. */
  confirmedReservations: number;
  /** Pending requests overlapping the window (shown, but not counted). */
  pendingReservations: number;
  /** Distinct customers (by normalized phone) with a CONFIRMED rental. */
  distinctCustomers: number;
  /** rentedUnits / in-service units, in [0, 1]. 0 when no in-service units. */
  utilizationRate: number;
  cars: CarAvailability[];
};

/** True if [start_date, end_date] intersects the inclusive window [from, to]. */
export function reservationOverlapsWindow(
  reservation: Pick<Reservation, "start_date" | "end_date">,
  from: string,
  to: string,
): boolean {
  return reservation.start_date <= to && reservation.end_date >= from;
}

/** True if a reservation covers the single calendar day `day`. */
function reservationCoversDay(
  reservation: Pick<Reservation, "start_date" | "end_date">,
  day: string,
): boolean {
  return reservation.start_date <= day && reservation.end_date >= day;
}

/**
 * Peak number of simultaneously-active reservations across [from, to].
 *
 * Overlap count only rises at a reservation's start, so the maximum is reached
 * at one of the "event" days: the window start, or any reservation start that
 * falls inside the window. Checking those candidates is exact and O(n²) on the
 * small reservation sets a rental agency has.
 */
export function peakConcurrentReservations(
  reservations: Pick<Reservation, "start_date" | "end_date">[],
  from: string,
  to: string,
): number {
  const overlapping = reservations.filter((r) =>
    reservationOverlapsWindow(r, from, to),
  );
  if (overlapping.length === 0) return 0;

  const candidateDays = new Set<string>([from]);
  for (const r of overlapping) {
    if (r.start_date >= from && r.start_date <= to) {
      candidateDays.add(r.start_date);
    }
  }

  let peak = 0;
  for (const day of candidateDays) {
    let count = 0;
    for (const r of overlapping) {
      if (reservationCoversDay(r, day)) count += 1;
    }
    if (count > peak) peak = count;
  }
  return peak;
}

/**
 * Statuses that consume a physical unit for CUSTOMER-FACING availability.
 * This mirrors the atomic booking RPC (`create_reservation_if_available`), which
 * blocks on pending + confirmed — so the public search can never advertise a car
 * that would then be rejected at checkout. (The admin owner view separately
 * counts confirmed-only, because it answers a different, committed-occupancy
 * question.)
 */
export const BOOKING_BLOCKING_STATUSES = ["pending", "confirmed"] as const;

/**
 * How many units of each car are still bookable for the whole [start, end]
 * window. Pure and framework-agnostic; the search endpoint groups DB rows and
 * calls this so the site and the booking guard agree on availability.
 *
 * An offline car (is_available = false) yields 0. Otherwise availableUnits =
 * quantity − peak concurrent blocking reservations across the window.
 */
export function computeCarWindowAvailability<
  C extends { id: string; quantity: number; is_available: boolean },
>(
  cars: C[],
  reservations: Pick<
    Reservation,
    "car_id" | "start_date" | "end_date" | "status"
  >[],
  windowStart: string,
  windowEnd: string,
): { car: C; availableUnits: number }[] {
  const blockingByCar = new Map<
    string,
    Pick<Reservation, "start_date" | "end_date">[]
  >();
  for (const r of reservations) {
    if (!(BOOKING_BLOCKING_STATUSES as readonly string[]).includes(r.status)) {
      continue;
    }
    const list = blockingByCar.get(r.car_id) ?? [];
    list.push(r);
    blockingByCar.set(r.car_id, list);
  }

  return cars.map((car) => {
    if (!car.is_available) return { car, availableUnits: 0 };
    const totalUnits = Math.max(0, Math.floor(car.quantity ?? 0));
    const peak = peakConcurrentReservations(
      blockingByCar.get(car.id) ?? [],
      windowStart,
      windowEnd,
    );
    return { car, availableUnits: Math.max(0, totalUnits - peak) };
  });
}

/** Strip whitespace so "28 538 910" and "28538910" count as one customer. */
function normalizePhone(phone: string): string {
  return phone.replace(/\s/g, "");
}

/**
 * Compute per-car and fleet-wide availability for an inclusive date window.
 * `reservations` should already be filtered to active statuses; any cancelled
 * rows passed in are ignored defensively.
 */
export function computeFleetAvailability(
  cars: AvailabilityCar[],
  reservations: Reservation[],
  windowStart: string,
  windowEnd: string,
): FleetAvailabilitySummary {
  const isRange = windowStart !== windowEnd;

  // Pending + confirmed are shown to the owner; only confirmed consume inventory.
  const shown = reservations.filter((r) => r.status !== "cancelled");
  const byCar = new Map<string, Reservation[]>();
  for (const r of shown) {
    if (!reservationOverlapsWindow(r, windowStart, windowEnd)) continue;
    const list = byCar.get(r.car_id) ?? [];
    list.push(r);
    byCar.set(r.car_id, list);
  }

  const carAvailabilities: CarAvailability[] = cars.map((car) => {
    const totalUnits = Math.max(0, Math.floor(car.quantity ?? 0));
    const carReservations = (byCar.get(car.id) ?? []).sort((a, b) =>
      a.start_date.localeCompare(b.start_date),
    );
    // Occupancy is driven by confirmed reservations only.
    const rentedUnits = peakConcurrentReservations(
      carReservations.filter((r) => r.status === "confirmed"),
      windowStart,
      windowEnd,
    );
    const isOffline = !car.is_available;
    const availableUnits = isOffline
      ? 0
      : Math.max(0, totalUnits - rentedUnits);

    return {
      car,
      totalUnits,
      rentedUnits,
      availableUnits,
      isOffline,
      reservations: carReservations,
    };
  });

  // Fleet aggregates.
  const overlappingReservations = carAvailabilities.flatMap(
    (c) => c.reservations,
  );
  const confirmed = overlappingReservations.filter(
    (r) => r.status === "confirmed",
  );
  const pending = overlappingReservations.filter((r) => r.status === "pending");
  const distinctCustomers = new Set(
    confirmed.map((r) => normalizePhone(r.client_phone)),
  ).size;

  const totalUnits = carAvailabilities.reduce((s, c) => s + c.totalUnits, 0);
  const offlineUnits = carAvailabilities
    .filter((c) => c.isOffline)
    .reduce((s, c) => s + c.totalUnits, 0);
  const rentedUnits = carAvailabilities.reduce((s, c) => s + c.rentedUnits, 0);
  const availableUnits = carAvailabilities.reduce(
    (s, c) => s + c.availableUnits,
    0,
  );
  const inServiceUnits = totalUnits - offlineUnits;

  return {
    windowStart,
    windowEnd,
    isRange,
    totalCars: cars.length,
    totalUnits,
    offlineUnits,
    rentedUnits,
    availableUnits,
    carsAvailable: carAvailabilities.filter((c) => c.availableUnits > 0).length,
    carsFullyBooked: carAvailabilities.filter(
      (c) => !c.isOffline && c.availableUnits === 0 && c.totalUnits > 0,
    ).length,
    confirmedReservations: confirmed.length,
    pendingReservations: pending.length,
    distinctCustomers,
    utilizationRate:
      inServiceUnits > 0 ? rentedUnits / inServiceUnits : 0,
    cars: carAvailabilities,
  };
}

/**
 * Validate and normalize a window from raw query params. Accepts either a
 * single `date` or a `start`/`end` pair. Returns null on malformed input or a
 * range that exceeds the allowed span. Swaps reversed ranges.
 */
export function resolveAvailabilityWindow(params: {
  date?: string | null;
  start?: string | null;
  end?: string | null;
}): { windowStart: string; windowEnd: string } | null {
  const { date, start, end } = params;

  if (start || end) {
    const startStr = start ?? end!;
    const endStr = end ?? start!;
    const startDate = parseDateOnly(startStr);
    const endDate = parseDateOnly(endStr);
    if (!startDate || !endDate) return null;

    let from = startStr;
    let to = endStr;
    if (startDate > endDate) {
      from = endStr;
      to = startStr;
    }

    const spanDays =
      Math.round(
        (parseDateOnly(to)!.getTime() - parseDateOnly(from)!.getTime()) /
          MS_PER_DAY,
      ) + 1;
    if (spanDays > MAX_AVAILABILITY_RANGE_DAYS) return null;

    return { windowStart: from, windowEnd: to };
  }

  const single = date && parseDateOnly(date) ? date : null;
  if (!single) return null;
  return { windowStart: single, windowEnd: single };
}
