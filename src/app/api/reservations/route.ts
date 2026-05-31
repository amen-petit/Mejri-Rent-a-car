import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { reservationInputSchema } from "@/lib/validation";
import { computeQuote } from "@/lib/pricing";
import { sendReservationEmails } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { isPickupInPast } from "@/lib/time";

// Require the pickup to be at least this far ahead when booking for "today",
// so a customer can't reserve a slot that is effectively the current moment.
const PICKUP_LEAD_MINUTES = 30;

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limit = rateLimit(`reservation:${ip}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez dans un instant." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = reservationInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }
  const input = parsed.data;

  // Reject pickups in the past. Evaluated in the agency timezone (not UTC), so
  // a same-day booking is allowed only when the chosen pickup time is still
  // ahead of "now" by the lead buffer. This also makes a valid "today" booking
  // work regardless of the server's UTC offset.
  if (
    isPickupInPast(input.start_date, input.pickup_time, {
      bufferMinutes: PICKUP_LEAD_MINUTES,
    })
  ) {
    return NextResponse.json(
      { error: "L'heure de prise en charge est déjà passée." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: car, error: carError } = await supabase
    .from("cars")
    .select("id, name, brand, price_per_day, pricing_tiers, is_available, quantity")
    .eq("id", input.car_id)
    .single();

  if (carError || !car || !car.is_available) {
    return NextResponse.json({ error: "Véhicule indisponible." }, { status: 409 });
  }

  // Authoritative price computed on the server; any client-sent price is ignored.
  const quote = computeQuote(car, input.start_date, input.end_date);
  if (quote.totalDays <= 0 || quote.totalPrice <= 0) {
    return NextResponse.json({ error: "Période invalide." }, { status: 400 });
  }

  // Atomic availability check + insert (see SQL function create_reservation_if_available).
  const { data: newId, error: rpcError } = await supabase.rpc(
    "create_reservation_if_available",
    {
      p_car_id: car.id,
      p_start: input.start_date,
      p_end: input.end_date,
      p_pickup: input.pickup_time,
      p_return: input.return_time,
      p_total: quote.totalPrice,
      p_name: input.client_name,
      p_phone: input.client_phone,
      p_email: input.client_email ?? null,
      p_notes: input.notes ?? null,
    },
  );

  if (rpcError) {
    return NextResponse.json(
      { error: "Plus de disponibilité pour ces dates." },
      { status: 409 },
    );
  }

  // Fire-and-forget: a failed email must not fail a successful booking.
  void sendReservationEmails("created", {
    carName: car.name,
    carBrand: car.brand,
    clientName: input.client_name,
    clientPhone: input.client_phone,
    clientEmail: input.client_email ?? null,
    startDate: input.start_date,
    endDate: input.end_date,
    pickupTime: input.pickup_time,
    returnTime: input.return_time,
    totalPrice: quote.totalPrice,
    notes: input.notes ?? null,
  }).catch((error) =>
    console.error(
      "Reservation email failed:",
      error instanceof Error ? error.message : "unknown error",
    ),
  );

  return NextResponse.json({ ok: true, id: newId, totalPrice: quote.totalPrice });
}
