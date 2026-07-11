import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdminRequest } from "@/lib/admin-guard";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { promotionUpdateSchema } from "@/lib/validation";
import { hasOverlappingActivePromotion } from "@/lib/promotions-admin";
import { CARS_CACHE_TAG, PROMOS_CACHE_TAG } from "@/lib/constants";
import type { Promotion } from "@/lib/types";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

function bustPromoCaches() {
  revalidateTag(PROMOS_CACHE_TAG, { expire: 0 });
  revalidateTag(CARS_CACHE_TAG, { expire: 0 });
}

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

  const parsed = promotionUpdateSchema.safeParse(body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Re-validate cross-field rules against the merged (existing + patch) record.
  const { data: existing, error: fetchError } = await supabase
    .from("promotions")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !existing) {
    return NextResponse.json({ error: "Promotion introuvable." }, { status: 404 });
  }
  const merged = { ...(existing as Promotion), ...parsed.data };

  if (merged.end_date < merged.start_date) {
    return NextResponse.json(
      { error: "La date de fin doit être postérieure à la date de début." },
      { status: 400 },
    );
  }
  if (merged.discount_type === "percentage" && merged.discount_value > 100) {
    return NextResponse.json(
      { error: "Une réduction en pourcentage ne peut pas dépasser 100." },
      { status: 400 },
    );
  }
  if (merged.discount_type === "fixed") {
    const { data: car } = await supabase
      .from("cars")
      .select("price_per_day")
      .eq("id", merged.car_id)
      .single();
    if (car && merged.discount_value >= car.price_per_day) {
      return NextResponse.json(
        { error: "La réduction doit être inférieure au prix du véhicule." },
        { status: 400 },
      );
    }
  }

  if (merged.is_active) {
    try {
      const conflict = await hasOverlappingActivePromotion(
        supabase,
        merged.car_id,
        merged.start_date,
        merged.end_date,
        id,
      );
      if (conflict) {
        return NextResponse.json(
          {
            error:
              "Une promotion active chevauche déjà ces dates pour ce véhicule.",
          },
          { status: 409 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Échec de la vérification des conflits." },
        { status: 500 },
      );
    }
  }

  const { error } = await supabase
    .from("promotions")
    .update(parsed.data)
    .eq("id", id);

  if (error) {
    console.error("Promotion update failed:", error.message);
    return NextResponse.json(
      { error: "Failed to update promotion." },
      { status: 500 },
    );
  }

  bustPromoCaches();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("promotions").delete().eq("id", id);

  if (error) {
    console.error("Promotion delete failed:", error.message);
    return NextResponse.json(
      { error: "Failed to delete promotion." },
      { status: 500 },
    );
  }

  bustPromoCaches();
  return NextResponse.json({ ok: true });
}
