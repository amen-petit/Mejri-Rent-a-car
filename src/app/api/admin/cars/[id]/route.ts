import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdminRequest } from "@/lib/admin-guard";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { carInputSchema } from "@/lib/validation";
import { CARS_CACHE_TAG } from "@/lib/constants";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Partial: supports both full edits and single-field toggles (e.g. availability).
  const parsed = carInputSchema.partial().safeParse(body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("cars").update(parsed.data).eq("id", id);

  if (error) {
    console.error("Car update failed:", error.message);
    return NextResponse.json({ error: "Failed to update car." }, { status: 500 });
  }

  // Edits/toggles (availability, featured, price…) affect the public fleet.
  revalidateTag(CARS_CACHE_TAG, { expire: 0 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("cars").delete().eq("id", id);

  if (error) {
    console.error("Car delete failed:", error.message);
    return NextResponse.json({ error: "Failed to delete car." }, { status: 500 });
  }

  // Removed car must disappear from the public fleet.
  revalidateTag(CARS_CACHE_TAG, { expire: 0 });

  return NextResponse.json({ ok: true });
}
