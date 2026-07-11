import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdminRequest } from "@/lib/admin-guard";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { carInputSchema } from "@/lib/validation";
import { CARS_CACHE_TAG } from "@/lib/constants";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to load cars." }, { status: 500 });
  }

  return NextResponse.json({ cars: data ?? [] });
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = carInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("cars")
    .insert({
      ...parsed.data,
      description: parsed.data.description ?? null,
      pricing_tiers: parsed.data.pricing_tiers ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Car insert failed:", error.message);
    return NextResponse.json({ error: "Failed to create car." }, { status: 500 });
  }

  // Public fleet changed — drop the cached list so the new car shows immediately.
  revalidateTag(CARS_CACHE_TAG, { expire: 0 });

  return NextResponse.json({ id: data.id });
}
