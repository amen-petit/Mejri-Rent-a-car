import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public, non-PII summary: how many units of each car are actively rented today
 * (pending/confirmed reservations overlapping the current date). The catalog
 * uses this to show real-time available unit counts without reading customer data.
 */
export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("reservations")
    .select("car_id")
    .in("status", ["pending", "confirmed"])
    .lte("start_date", today)
    .gte("end_date", today);

  if (error) {
    return NextResponse.json({ counts: {} }, { status: 200 });
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.car_id] = (counts[row.car_id] ?? 0) + 1;
  }

  return NextResponse.json({ counts });
}
