/**
 * SERVER-ONLY email sending. Refactored out of the public notify route so that
 * mail can only be triggered from authenticated/authoritative server flows, and
 * so all interpolated values are HTML-escaped (prevents content injection in the
 * messages sent from our trusted domain).
 */
import "server-only";
import nodemailer from "nodemailer";
import { EMAIL_DEFAULT_PORT } from "./constants";
import { fr } from "./../i18n/dictionaries/fr";
import type { ReservationAddon } from "./types";

/** Localize a stored location value for the (French) notification emails. */
function locationLabel(value?: string | null): string {
  if (!value) return "—";
  return fr.booking.locations[value] ?? value;
}

/** French one-line summary of add-on services, e.g. "Service chauffeur (7 × 30 DT = 210 DT)". */
function addonsSummary(addons?: ReservationAddon[] | null): string {
  if (!addons || addons.length === 0) return "";
  return addons
    .map((a) => {
      const label = fr.addons[a.key]?.label ?? a.key;
      return `${label} (${a.days} × ${a.daily_rate} DT = ${a.total} DT)`;
    })
    .join(" ; ");
}

export type ReservationEvent = "created" | "confirmed" | "cancelled";

export type ReservationEmailPayload = {
  carName: string;
  carBrand: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string | null;
  startDate: string;
  endDate: string;
  pickupTime?: string | null;
  returnTime?: string | null;
  pickupLocation?: string | null;
  returnLocation?: string | null;
  totalPrice: number;
  /** Pre-discount total, set only when a promotion was applied. */
  originalTotal?: number | null;
  promotionLabel?: string | null;
  /** Optional add-on services on the reservation (chauffeur, …). */
  addons?: ReservationAddon[] | null;
  notes?: string | null;
};

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char] ?? char,
  );
}

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
  event: ReservationEvent,
  payload: ReservationEmailPayload,
): EmailCopy {
  const carLabel = `${payload.carBrand} ${payload.carName}`;
  const safeCar = escapeHtml(carLabel);
  const safeName = escapeHtml(payload.clientName);

  switch (event) {
    case "confirmed":
      return {
        adminSubject: `Réservation confirmée - ${carLabel}`,
        adminTitle: "Réservation confirmée",
        adminIntro: "Une réservation a été confirmée depuis l'interface admin.",
        sendAdminEmail: false,
        customerSubject: `Votre réservation est confirmée - ${carLabel}`,
        customerTitle: "Votre réservation est confirmée",
        customerIntro: `Bonjour ${safeName}. Votre réservation pour <strong>${safeCar}</strong> est confirmée.`,
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
        customerIntro: `Bonjour ${safeName}. Votre réservation pour <strong>${safeCar}</strong> a été annulée.`,
        customerCta:
          "Si vous souhaitez plus d'informations, vous pouvez répondre à cet email ou nous contacter directement.",
      };
    default:
      return {
        adminSubject: `Nouvelle réservation - ${carLabel}`,
        adminTitle: "Nouvelle réservation reçue",
        adminIntro: "Une nouvelle réservation a été effectuée via le site.",
        sendAdminEmail: true,
        customerSubject: `Confirmation de demande - ${carLabel}`,
        customerTitle: "Votre demande de réservation est bien reçue",
        customerIntro: `Merci ${safeName}. Nous avons bien reçu votre demande pour <strong>${safeCar}</strong>.`,
        customerCta:
          "Notre équipe vous contactera rapidement pour confirmer la réservation.",
      };
  }
}

function buildAdminHtml(copy: EmailCopy, p: ReservationEmailPayload): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 0;font-weight:bold;width:180px;">${label}</td><td>${escapeHtml(value)}</td></tr>`;
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000;">
      <h2 style="margin:0 0 16px;">${copy.adminTitle}</h2>
      <p style="margin:0 0 12px;">${copy.adminIntro}</p>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:640px;">
        ${row("Client", p.clientName)}
        ${row("Téléphone", p.clientPhone)}
        ${row("Email", p.clientEmail || "—")}
        ${row("Véhicule", `${p.carBrand} ${p.carName}`)}
        ${row("Début", p.pickupTime ? `${p.startDate} à ${p.pickupTime}` : p.startDate)}
        ${row("Fin", p.returnTime ? `${p.endDate} à ${p.returnTime}` : p.endDate)}
        ${row("Lieu de départ", locationLabel(p.pickupLocation))}
        ${row("Lieu de retour", locationLabel(p.returnLocation))}
        ${p.addons && p.addons.length > 0 ? row("Services", addonsSummary(p.addons)) : ""}
        ${row("Prix total", `${p.totalPrice} DT`)}
        ${
          p.originalTotal != null && p.originalTotal > p.totalPrice
            ? row(
                "Promotion",
                `${p.promotionLabel ? `${p.promotionLabel} — ` : ""}−${p.originalTotal - p.totalPrice} DT (au lieu de ${p.originalTotal} DT)`,
              )
            : ""
        }
        ${row("Notes", p.notes || "—")}
      </table>
    </div>`;
}

function buildCustomerHtml(copy: EmailCopy, p: ReservationEmailPayload): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000;">
      <h2 style="margin:0 0 16px;">${copy.customerTitle}</h2>
      <p style="margin:0 0 12px;">${copy.customerIntro}</p>
      <p style="margin:0 0 12px;">Période: ${escapeHtml(p.startDate)}${p.pickupTime ? ` à ${escapeHtml(p.pickupTime)}` : ""} au ${escapeHtml(p.endDate)}${p.returnTime ? ` à ${escapeHtml(p.returnTime)}` : ""}</p>
      <p style="margin:0 0 12px;">Lieu: ${escapeHtml(locationLabel(p.pickupLocation))}${p.returnLocation && p.returnLocation !== p.pickupLocation ? ` → ${escapeHtml(locationLabel(p.returnLocation))}` : ""}</p>
      ${
        p.addons && p.addons.length > 0
          ? `<p style="margin:0 0 12px;">✓ ${escapeHtml(addonsSummary(p.addons))}</p>`
          : ""
      }
      <p style="margin:0 0 12px;">Prix estimé: ${p.totalPrice} DT</p>
      ${
        p.originalTotal != null && p.originalTotal > p.totalPrice
          ? `<p style="margin:0 0 12px;color:#0a7a3f;">Promotion appliquée${p.promotionLabel ? ` (${escapeHtml(p.promotionLabel)})` : ""} : vous économisez ${p.originalTotal - p.totalPrice} DT.</p>`
          : ""
      }
      <p style="margin:0;">${copy.customerCta}</p>
    </div>`;
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

/**
 * Sends reservation emails. The customer recipient is taken from the payload,
 * which the caller MUST source from a server-loaded reservation row (never from
 * raw client input), so this can never be abused as an open relay.
 */
export async function sendReservationEmails(
  event: ReservationEvent,
  payload: ReservationEmailPayload,
): Promise<void> {
  const notifyTo = process.env.NOTIFY_TO || process.env.EMAIL_USER;
  const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const transporter = createTransport();
  const copy = buildEmailCopy(event, payload);

  if (copy.sendAdminEmail && notifyTo) {
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
}
