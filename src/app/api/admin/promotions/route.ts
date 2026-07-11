import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdminRequest } from "@/lib/admin-guard";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { promotionInputSchema } from "@/lib/validation";
import { hasOverlappingActivePromotion } from "@/lib/promotions-admin";
import { CARS_CACHE_TAG, PROMOS_CACHE_TAG } from "@/lib/constants";

export const runtime = "nodejs";

function bustPromoCaches() {
  revalidateTag(PROMOS_CACHE_TAG, { expire: 0 });
  revalidateTag(CARS_CACHE_TAG, { expire: 0 });
}

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to load promotions." },
      { status: 500 },
    );
  }

  return NextResponse.json({ promotions: data ?? [] });
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

  const parsed = promotionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }
  const input = parsed.data;

  const supabase = getSupabaseAdmin();

  // The car must exist; its price bounds a `fixed` discount.
  const { data: car, error: carError } = await supabase
    .from("cars")
    .select("id, price_per_day")
    .eq("id", input.car_id)
    .single();
  if (carError || !car) {
    return NextResponse.json({ error: "Véhicule introuvable." }, { status: 400 });
  }
  if (
    input.discount_type === "fixed" &&
    input.discount_value >= car.price_per_day
  ) {
    return NextResponse.json(
      { error: "La réduction doit être inférieure au prix du véhicule." },
      { status: 400 },
    );
  }

  // Block a new active promo that overlaps an existing active one for this car.
  if (input.is_active) {
    try {
      const conflict = await hasOverlappingActivePromotion(
        supabase,
        input.car_id,
        input.start_date,
        input.end_date,
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

  const { data, error } = await supabase
    .from("promotions")
    .insert({ ...input, label: input.label ?? null })
    .select("id")
    .single();

  if (error) {
    console.error("Promotion insert failed:", error.message);
    return NextResponse.json(
      { error: "Failed to create promotion." },
      { status: 500 },
    );
  }

  bustPromoCaches();
  return NextResponse.json({ id: data.id });
}
