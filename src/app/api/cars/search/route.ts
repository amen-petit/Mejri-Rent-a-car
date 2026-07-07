import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { availabilitySearchSchema } from "@/lib/validation";
import {
  computeCarWindowAvailability,
  MAX_AVAILABILITY_RANGE_DAYS,
} from "@/lib/availability";
import { getDaysBetweenStrings } from "@/lib/dates";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import type { Car } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public availability search for the hero booking flow.
 * GET /api/cars/search?start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * Returns only cars with at least one unit bookable for the whole window. Uses
 * the same blocking semantics as the atomic booking RPC (pending + confirmed),
 * so a car shown here can actually be booked. No customer PII is returned.
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  const limit = await rateLimit(`car-search:${ip}`, 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const sp = new URL(req.url).searchParams;
  const parsed = availabilitySearchSchema.safeParse({
    start: sp.get("start"),
    end: sp.get("end"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_range" }, { status: 400 });
  }
  const { start, end } = parsed.data;

  // Bound the work: reject absurd spans (mirrors the admin availability cap).
  if (getDaysBetweenStrings(start, end) > MAX_AVAILABILITY_RANGE_DAYS) {
    return NextResponse.json({ error: "range_too_large" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Fetch the catalog and only the reservations that overlap the window. The
  // overlap predicate matches the booking guard: start_date <= end AND
  // end_date >= start.
  const [carsRes, reservationsRes] = await Promise.all([
    supabase.from("cars").select("*").order("created_at", { ascending: false }),
    supabase
      .from("reservations")
      .select("car_id, start_date, end_date, status")
      .in("status", ["pending", "confirmed"])
      .lte("start_date", end)
      .gte("end_date", start),
  ]);

  if (carsRes.error || reservationsRes.error) {
    // Never leak DB internals; the UI shows a friendly empty/error state.
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }

  const cars = (carsRes.data ?? []) as Car[];
  const availability = computeCarWindowAvailability(
    cars,
    reservationsRes.data ?? [],
    start,
    end,
  );

  const availableCars = availability
    .filter((entry) => entry.availableUnits > 0)
    .map((entry) => entry.car);

  return NextResponse.json({ cars: availableCars, start, end });
}
