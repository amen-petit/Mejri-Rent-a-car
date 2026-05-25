import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { EMAIL_DEFAULT_PORT } from "@/lib/constants";

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

type EmailCopy = {
  adminSubject: string;
  adminTitle: string;
  adminIntro: string;
  sendAdminEmail: boolean;
  customerSubject: string;
  customerTitle: string;
  customerIntro: string;
  customerCta: string;
};

function buildEmailCopy(
  event: NonNullable<NotifyPayload["event"]>,
  payload: NotifyPayload,
): EmailCopy {
  const carLabel = `${payload.carBrand} ${payload.carName}`;

  switch (event) {
    case "confirmed":
      return {
        adminSubject: `Réservation confirmée - ${carLabel}`,
        adminTitle: "Réservation confirmée",
        adminIntro: "Une réservation a été confirmée depuis l'interface admin.",
        sendAdminEmail: false,
        customerSubject: `Votre réservation est confirmée - ${carLabel}`,
        customerTitle: "Votre réservation est confirmée",
        customerIntro: `Bonjour ${payload.clientName}. Votre réservation pour <strong>${carLabel}</strong> est confirmée.`,
        customerCta:
          "Vous pouvez maintenant préparer votre arrivée et nous contacter si vous avez des questions.",
      };

    case "cancelled":
      return {
        adminSubject: `Réservation annulée - ${carLabel}`,
        adminTitle: "Réservation annulée",
        adminIntro: "Une réservation a été annulée depuis l'interface admin.",
        sendAdminEmail: false,
        customerSubject: `Votre réservation a été annulée - ${carLabel}`,
        customerTitle: "Votre réservation a été annulée",
        customerIntro: `Bonjour ${payload.clientName}. Votre réservation pour <strong>${carLabel}</strong> a été annulée.`,
        customerCta:
          "Si vous souhaitez plus d'informations, vous pouvez répondre à cet email ou nous contacter directement.",
      };

    default: // "created"
      return {
        adminSubject: `Nouvelle réservation - ${carLabel}`,
        adminTitle: "Nouvelle réservation reçue",
        adminIntro: "Une nouvelle réservation a été effectuée via le site.",
        sendAdminEmail: true,
        customerSubject: `Confirmation de demande - ${carLabel}`,
        customerTitle: "Votre demande de réservation est bien reçue",
        customerIntro: `Merci ${payload.clientName}. Nous avons bien reçu votre demande pour <strong>${carLabel}</strong>.`,
        customerCta:
          "Notre équipe vous contactera rapidement pour confirmer la réservation.",
      };
  }
}

function buildAdminHtml(copy: EmailCopy, payload: NotifyPayload): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000000;">
      <h2 style="margin: 0 0 16px;">${copy.adminTitle}</h2>
      <p style="margin: 0 0 12px;">${copy.adminIntro}</p>
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
}

function buildCustomerHtml(copy: EmailCopy, payload: NotifyPayload): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000000;">
      <h2 style="margin: 0 0 16px;">${copy.customerTitle}</h2>
      <p style="margin: 0 0 12px;">${copy.customerIntro}</p>
      <p style="margin: 0 0 12px;">Période: ${payload.startDate} au ${payload.endDate}</p>
      <p style="margin: 0 0 12px;">Prix estimé: ${payload.totalPrice} DT</p>
      <p style="margin: 0;">${copy.customerCta}</p>
    </div>
  `;
}

function createTransport() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT) || EMAIL_DEFAULT_PORT;
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
    auth: { user, pass },
  });
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as NotifyPayload;
    const event = payload.event ?? "created";

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
    const transporter = createTransport();
    const copy = buildEmailCopy(event, payload);

    if (copy.sendAdminEmail) {
      await transporter.sendMail({
        from: fromAddress,
        to: notifyTo,
        subject: copy.adminSubject,
        html: buildAdminHtml(copy, payload),
      });
    }

    if (payload.clientEmail) {
      await transporter.sendMail({
        from: fromAddress,
        to: payload.clientEmail,
        subject: copy.customerSubject,
        html: buildCustomerHtml(copy, payload),
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
