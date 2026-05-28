import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Public, non-PII availability for a single car: only the date ranges of active
 * (pending/confirmed) reservations. Used to render the booking calendar without
 * exposing customer data.
 */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("reservations")
    .select("start_date, end_date")
    .eq("car_id", id)
    .in("status", ["pending", "confirmed"]);

  if (error) {
    return NextResponse.json({ unavailable: [] }, { status: 200 });
  }

  return NextResponse.json({ unavailable: data ?? [] });
}
