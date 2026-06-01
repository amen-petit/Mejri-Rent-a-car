import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-guard";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  computeFleetAvailability,
  resolveAvailabilityWindow,
  type AvailabilityCar,
} from "@/lib/availability";
import type { Reservation } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin-only fleet availability for a date or date range. Returns ready-to-render
 * per-car and fleet-wide figures so the page does no business logic itself.
 *
 * Query params: `?date=YYYY-MM-DD` for a single day, or `?start=...&end=...`
 * for an inclusive range. Defaults to today (agency-naive, server date) when
 * nothing is provided.
 */
export async function GET(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const today = new Date().toISOString().split("T")[0];
  const window = resolveAvailabilityWindow({
    date: url.searchParams.get("date") ?? today,
    start: url.searchParams.get("start"),
    end: url.searchParams.get("end"),
  });

  if (!window) {
    return NextResponse.json(
      { error: "Invalid date or range." },
      { status: 400 },
    );
  }

  const { windowStart, windowEnd } = window;
  const supabase = getSupabaseAdmin();

  const [carsRes, reservationsRes] = await Promise.all([
    supabase
      .from("cars")
      .select("id, brand, name, images, quantity, is_available")
      .order("brand", { ascending: true })
      .order("name", { ascending: true }),
    // Active reservations that intersect the window.
    supabase
      .from("reservations")
      .select(
        "id, car_id, client_name, client_phone, client_email, start_date, end_date, pickup_time, return_time, total_price, status, notes, created_at",
      )
      .in("status", ["pending", "confirmed"])
      .lte("start_date", windowEnd)
      .gte("end_date", windowStart),
  ]);

  if (carsRes.error || reservationsRes.error) {
    return NextResponse.json(
      { error: "Failed to load availability." },
      { status: 500 },
    );
  }

  const summary = computeFleetAvailability(
    (carsRes.data ?? []) as AvailabilityCar[],
    (reservationsRes.data ?? []) as Reservation[],
    windowStart,
    windowEnd,
  );

  return NextResponse.json(summary);
}
