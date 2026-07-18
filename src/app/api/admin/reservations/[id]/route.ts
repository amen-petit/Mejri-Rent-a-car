import { NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin-guard";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { reservationStatusSchema } from "@/lib/validation";
import { sendReservationEmails } from "@/lib/email";
import { auditLog } from "@/lib/audit";
import { formatDateFr } from "@/lib/dates";
import { BRAND_NAME } from "@/lib/constants";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const actor = await getAdminIdentity();
  if (!actor) {
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

  auditLog({
    actor,
    action: "reservation.status_change",
    target: id,
    details: { status: parsed.data.status },
  });

  // Customer recipient comes from the server-loaded row, never from client input.
  if (parsed.data.status === "confirmed" || parsed.data.status === "cancelled") {
    void sendReservationEmails(parsed.data.status, {
      carName: updated.car?.name ?? "Voiture",
      carBrand: updated.car?.brand ?? BRAND_NAME,
      clientName: updated.client_name,
      clientPhone: updated.client_phone,
      clientEmail: updated.client_email ?? null,
      startDate: formatDateFr(updated.start_date),
      endDate: formatDateFr(updated.end_date),
      pickupLocation: updated.pickup_location ?? null,
      returnLocation: updated.return_location ?? null,
      totalPrice: updated.total_price,
      addons: updated.addons ?? null,
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
  const actor = await getAdminIdentity();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("reservations").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete." }, { status: 500 });
  }

  auditLog({ actor, action: "reservation.delete", target: id });

  return NextResponse.json({ ok: true });
}
