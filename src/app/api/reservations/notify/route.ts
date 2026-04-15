import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type NotifyPayload = {
  event?: "created" | "confirmed" | "cancelled";
  carName: string;
  carBrand: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string | null;
  startDate: string;
  endDate: string;
  totalPrice: number;
  notes?: string | null;
};

function getTransport() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || "587");
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "Missing EMAIL_HOST, EMAIL_USER, or EMAIL_PASS environment variables.",
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as NotifyPayload;
    const event = payload.event || "created";

    if (
      !payload.carName ||
      !payload.carBrand ||
      !payload.clientName ||
      !payload.clientPhone ||
      !payload.startDate ||
      !payload.endDate ||
      typeof payload.totalPrice !== "number"
    ) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const notifyTo = process.env.NOTIFY_TO || process.env.EMAIL_USER;
    if (!notifyTo) {
      return NextResponse.json(
        { error: "Missing NOTIFY_TO or EMAIL_USER environment variable." },
        { status: 500 },
      );
    }

    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const transporter = getTransport();

    const isConfirmed = event === "confirmed";
    const subject =
      event === "created"
        ? `Nouvelle réservation - ${payload.carBrand} ${payload.carName}`
        : event === "confirmed"
          ? `Réservation confirmée - ${payload.carBrand} ${payload.carName}`
          : `Réservation annulée - ${payload.carBrand} ${payload.carName}`;

    const adminTitle =
      event === "created"
        ? "Nouvelle réservation reçue"
        : event === "confirmed"
          ? "Réservation confirmée"
          : "Réservation annulée";

    const adminIntro =
      event === "created"
        ? "Une nouvelle réservation a été effectuée via le site."
        : event === "confirmed"
          ? "Une réservation a été confirmée depuis l'interface admin."
          : "Une réservation a été annulée depuis l'interface admin.";

    const customerSubject =
      event === "created"
        ? `Confirmation de demande - ${payload.carBrand} ${payload.carName}`
        : event === "confirmed"
          ? `Votre réservation est confirmée - ${payload.carBrand} ${payload.carName}`
          : `Votre réservation a été annulée - ${payload.carBrand} ${payload.carName}`;

    const customerTitle =
      event === "created"
        ? "Votre demande de réservation est bien reçue"
        : event === "confirmed"
          ? "Votre réservation est confirmée"
          : "Votre réservation a été annulée";

    const customerIntro =
      event === "created"
        ? `Merci ${payload.clientName}. Nous avons bien reçu votre demande pour <strong>${payload.carBrand} ${payload.carName}</strong>.`
        : event === "confirmed"
          ? `Bonjour ${payload.clientName}. Votre réservation pour <strong>${payload.carBrand} ${payload.carName}</strong> est confirmée.`
          : `Bonjour ${payload.clientName}. Votre réservation pour <strong>${payload.carBrand} ${payload.carName}</strong> a été annulée.`;

    if (event === "created") {
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000000;">
          <h2 style="margin: 0 0 16px;">${adminTitle}</h2>
          <p style="margin: 0 0 12px;">${adminIntro}</p>
          <table cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 640px;">
            <tr><td style="padding: 8px 0; font-weight: bold; width: 180px;">Client</td><td>${payload.clientName}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Téléphone</td><td>${payload.clientPhone}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Email</td><td>${payload.clientEmail || "—"}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Véhicule</td><td>${payload.carBrand} ${payload.carName}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Début</td><td>${payload.startDate}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Fin</td><td>${payload.endDate}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Prix total</td><td>${payload.totalPrice} DT</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Notes</td><td>${payload.notes || "—"}</td></tr>
          </table>
        </div>
      `;

      await transporter.sendMail({
        from: fromAddress,
        to: notifyTo,
        subject,
        html: adminHtml,
      });
    }

    if (payload.clientEmail) {
      const customerHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000000;">
          <h2 style="margin: 0 0 16px;">${customerTitle}</h2>
          <p style="margin: 0 0 12px;">${customerIntro}</p>
          <p style="margin: 0 0 12px;">Période: ${payload.startDate} au ${payload.endDate}</p>
          <p style="margin: 0 0 12px;">Prix estimé: ${payload.totalPrice} DT</p>
          <p style="margin: 0;">
            ${
              event === "created"
                ? "Notre équipe vous contactera rapidement pour confirmer la réservation."
                : isConfirmed
                  ? "Vous pouvez maintenant préparer votre arrivée et nous contacter si vous avez des questions."
                  : "Si vous souhaitez plus d'informations, vous pouvez répondre à cet email ou nous contacter directement."
            }
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: fromAddress,
        to: payload.clientEmail,
        subject: customerSubject,
        html: customerHtml,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Reservation notify failed:", error);
    return NextResponse.json(
      { error: "Failed to send notification email." },
      { status: 500 },
    );
  }
}
