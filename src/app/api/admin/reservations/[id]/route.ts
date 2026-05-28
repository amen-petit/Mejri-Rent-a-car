import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-guard";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { reservationStatusSchema } from "@/lib/validation";
import { sendReservationEmails } from "@/lib/email";

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

  const parsed = reservationStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: updated, error } = await supabase
    .from("reservations")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .select("*, car:cars(name, brand)")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: "Failed to update." }, { status: 500 });
  }

  // Customer recipient comes from the server-loaded row, never from client input.
  if (parsed.data.status === "confirmed" || parsed.data.status === "cancelled") {
    void sendReservationEmails(parsed.data.status, {
      carName: updated.car?.name ?? "Voiture",
      carBrand: updated.car?.brand ?? "Fekra rent a car",
      clientName: updated.client_name,
      clientPhone: updated.client_phone,
      clientEmail: updated.client_email ?? null,
      startDate: new Date(updated.start_date).toLocaleDateString("fr-FR"),
      endDate: new Date(updated.end_date).toLocaleDateString("fr-FR"),
      totalPrice: updated.total_price,
      notes: updated.notes ?? null,
    }).catch((emailError) =>
      console.error(
        "Reservation status email failed:",
        emailError instanceof Error ? emailError.message : "unknown error",
      ),
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("reservations").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
