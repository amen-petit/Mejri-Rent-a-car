import { describe, it, expect } from "vitest";
import {
  reservationOverlapsWindow,
  peakConcurrentReservations,
  computeFleetAvailability,
  resolveAvailabilityWindow,
  MAX_AVAILABILITY_RANGE_DAYS,
  type AvailabilityCar,
} from "./availability";
import type { Reservation } from "./types";

function res(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: Math.random().toString(36).slice(2),
    car_id: "car-1",
    client_name: "Alice",
    client_phone: "20 000 000",
    client_email: null,
    start_date: "2026-06-10",
    end_date: "2026-06-12",
    pickup_time: null,
    return_time: null,
    pickup_location: "agency",
    return_location: "agency",
    total_price: 300,
    original_price_per_day: null,
    discounted_price_per_day: null,
    promotion_label: null,
    status: "confirmed",
    notes: null,
    created_at: "2026-06-01T00:00:00Z",
    ...overrides,
  };
}

function car(overrides: Partial<AvailabilityCar> = {}): AvailabilityCar {
  return {
    id: "car-1",
    brand: "Renault",
    name: "Clio",
    images: [],
    quantity: 2,
    is_available: true,
    ...overrides,
  };
}

describe("reservationOverlapsWindow", () => {
  it("detects overlap on inclusive boundaries", () => {
    const r = res({ start_date: "2026-06-10", end_date: "2026-06-12" });
    expect(reservationOverlapsWindow(r, "2026-06-12", "2026-06-15")).toBe(true);
    expect(reservationOverlapsWindow(r, "2026-06-08", "2026-06-10")).toBe(true);
  });

  it("rejects windows that do not touch the reservation", () => {
    const r = res({ start_date: "2026-06-10", end_date: "2026-06-12" });
    expect(reservationOverlapsWindow(r, "2026-06-13", "2026-06-20")).toBe(false);
    expect(reservationOverlapsWindow(r, "2026-06-01", "2026-06-09")).toBe(false);
  });
});

describe("peakConcurrentReservations", () => {
  it("returns 0 with no reservations", () => {
    expect(peakConcurrentReservations([], "2026-06-10", "2026-06-12")).toBe(0);
  });

  it("counts overlap on a single day", () => {
    const list = [
      res({ start_date: "2026-06-01", end_date: "2026-06-15" }),
      res({ start_date: "2026-06-10", end_date: "2026-06-11" }),
    ];
    expect(peakConcurrentReservations(list, "2026-06-10", "2026-06-10")).toBe(2);
  });

  it("finds the busiest day across a range, not the total count", () => {
    // Three reservations touch the range, but never more than 2 at once.
    const list = [
      res({ start_date: "2026-06-10", end_date: "2026-06-11" }),
      res({ start_date: "2026-06-11", end_date: "2026-06-13" }),
      res({ start_date: "2026-06-14", end_date: "2026-06-16" }),
    ];
    // Day 11 has the first two overlapping → peak 2.
    expect(peakConcurrentReservations(list, "2026-06-10", "2026-06-16")).toBe(2);
  });

  it("counts a reservation that spans the whole window via the window start", () => {
    const list = [res({ start_date: "2026-01-01", end_date: "2026-12-31" })];
    expect(peakConcurrentReservations(list, "2026-06-10", "2026-06-20")).toBe(1);
  });
});

describe("computeFleetAvailability", () => {
  it("computes available units for a single date", () => {
    const cars = [car({ quantity: 3 })];
    const reservations = [
      res({ start_date: "2026-06-10", end_date: "2026-06-12" }),
      res({ start_date: "2026-06-11", end_date: "2026-06-15", client_phone: "21 111 111" }),
    ];
    const summary = computeFleetAvailability(
      cars,
      reservations,
      "2026-06-11",
      "2026-06-11",
    );
    expect(summary.rentedUnits).toBe(2);
    expect(summary.availableUnits).toBe(1);
    expect(summary.carsAvailable).toBe(1);
    expect(summary.carsFullyBooked).toBe(0);
    expect(summary.distinctCustomers).toBe(2);
    expect(summary.cars[0].reservations).toHaveLength(2);
  });

  it("marks a car fully booked when peak reaches quantity", () => {
    const cars = [car({ quantity: 1 })];
    const reservations = [res({ start_date: "2026-06-10", end_date: "2026-06-12" })];
    const summary = computeFleetAvailability(
      cars,
      reservations,
      "2026-06-10",
      "2026-06-12",
    );
    expect(summary.availableUnits).toBe(0);
    expect(summary.carsFullyBooked).toBe(1);
    expect(summary.carsAvailable).toBe(0);
  });

  it("treats offline cars as zero available and excludes them from utilization", () => {
    const cars = [car({ quantity: 2, is_available: false })];
    const summary = computeFleetAvailability(cars, [], "2026-06-10", "2026-06-10");
    expect(summary.availableUnits).toBe(0);
    expect(summary.offlineUnits).toBe(2);
    expect(summary.cars[0].isOffline).toBe(true);
    expect(summary.utilizationRate).toBe(0);
  });

  it("ignores cancelled reservations defensively", () => {
    const cars = [car({ quantity: 1 })];
    const reservations = [
      res({ status: "cancelled", start_date: "2026-06-10", end_date: "2026-06-12" }),
    ];
    const summary = computeFleetAvailability(
      cars,
      reservations,
      "2026-06-11",
      "2026-06-11",
    );
    expect(summary.rentedUnits).toBe(0);
    expect(summary.availableUnits).toBe(1);
    expect(summary.confirmedReservations).toBe(0);
  });

  it("does not count pending reservations toward occupancy but still shows them", () => {
    const cars = [car({ quantity: 1 })];
    const reservations = [
      res({
        status: "pending",
        start_date: "2026-06-10",
        end_date: "2026-06-12",
      }),
    ];
    const summary = computeFleetAvailability(
      cars,
      reservations,
      "2026-06-11",
      "2026-06-11",
    );
    // Pending does not consume the unit.
    expect(summary.rentedUnits).toBe(0);
    expect(summary.availableUnits).toBe(1);
    expect(summary.carsFullyBooked).toBe(0);
    expect(summary.confirmedReservations).toBe(0);
    expect(summary.pendingReservations).toBe(1);
    // Distinct customers counts confirmed renters only.
    expect(summary.distinctCustomers).toBe(0);
    // …but the pending reservation is still listed for the owner to see.
    expect(summary.cars[0].reservations).toHaveLength(1);
    expect(summary.cars[0].reservations[0].status).toBe("pending");
  });

  it("counts only confirmed when pending and confirmed overlap the same unit", () => {
    const cars = [car({ quantity: 1 })];
    const reservations = [
      res({
        status: "confirmed",
        client_phone: "20 000 000",
        start_date: "2026-06-10",
        end_date: "2026-06-12",
      }),
      res({
        status: "pending",
        client_phone: "21 111 111",
        start_date: "2026-06-11",
        end_date: "2026-06-13",
      }),
    ];
    const summary = computeFleetAvailability(
      cars,
      reservations,
      "2026-06-11",
      "2026-06-11",
    );
    expect(summary.rentedUnits).toBe(1);
    expect(summary.availableUnits).toBe(0);
    expect(summary.confirmedReservations).toBe(1);
    expect(summary.pendingReservations).toBe(1);
    expect(summary.cars[0].reservations).toHaveLength(2);
  });

  it("dedupes customers by normalized phone", () => {
    const cars = [car({ quantity: 5 })];
    const reservations = [
      res({ client_phone: "28 538 910", start_date: "2026-06-11", end_date: "2026-06-11" }),
      res({ client_phone: "28538910", start_date: "2026-06-11", end_date: "2026-06-11" }),
    ];
    const summary = computeFleetAvailability(
      cars,
      reservations,
      "2026-06-11",
      "2026-06-11",
    );
    expect(summary.distinctCustomers).toBe(1);
  });

  it("computes utilization over in-service units only", () => {
    const cars = [
      car({ id: "a", quantity: 2, is_available: true }),
      car({ id: "b", quantity: 2, is_available: false }),
    ];
    const reservations = [
      res({ car_id: "a", start_date: "2026-06-11", end_date: "2026-06-11" }),
    ];
    const summary = computeFleetAvailability(
      cars,
      reservations,
      "2026-06-11",
      "2026-06-11",
    );
    // 1 rented out of 2 in-service units = 0.5
    expect(summary.utilizationRate).toBeCloseTo(0.5);
  });
});

describe("resolveAvailabilityWindow", () => {
  it("resolves a single date", () => {
    expect(resolveAvailabilityWindow({ date: "2026-06-11" })).toEqual({
      windowStart: "2026-06-11",
      windowEnd: "2026-06-11",
    });
  });

  it("resolves a range", () => {
    expect(
      resolveAvailabilityWindow({ start: "2026-06-10", end: "2026-06-15" }),
    ).toEqual({ windowStart: "2026-06-10", windowEnd: "2026-06-15" });
  });

  it("swaps a reversed range", () => {
    expect(
      resolveAvailabilityWindow({ start: "2026-06-15", end: "2026-06-10" }),
    ).toEqual({ windowStart: "2026-06-10", windowEnd: "2026-06-15" });
  });

  it("rejects malformed dates", () => {
    expect(resolveAvailabilityWindow({ date: "2026-13-40" })).toBeNull();
    expect(resolveAvailabilityWindow({ date: "nope" })).toBeNull();
    expect(resolveAvailabilityWindow({})).toBeNull();
  });

  it("rejects an over-long range", () => {
    const start = "2026-01-01";
    const end = "2027-12-31"; // way over MAX_AVAILABILITY_RANGE_DAYS
    expect(resolveAvailabilityWindow({ start, end })).toBeNull();
    expect(MAX_AVAILABILITY_RANGE_DAYS).toBe(366);
  });
});
