"use client";

/**
 * Floating WhatsApp contact CTA. Reads as a native brand element — an ink pill
 * with the WhatsApp glyph in green as the only accent — not a third-party
 * widget. Collapsed to a 56px circle; expands to a labelled pill on hover /
 * keyboard focus. All visuals (radius, shadow, easing, positioning, pulse,
 * reduced-motion) live in the `.wa-fab*` design-system classes in globals.css.
 *
 * Rendered through a portal into <body>: the page content sits inside a
 * `.page-enter` wrapper whose entrance animation leaves a lingering transform,
 * and any transformed ancestor becomes the containing block for `position:
 * fixed` descendants — which would pin the button to that wrapper (near the
 * page bottom, scrolling away) instead of to the viewport. Portalling to <body>
 * lifts it above that wrapper so `fixed` resolves against the viewport, exactly
 * how the app's other floating UI (the DateField popover) escapes the same trap.
 *
 * Everything is configurable via props with sensible localized defaults, so the
 * same component can be dropped anywhere with a different number or message.
 */
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import { useI18n } from "@/i18n/client";

// SSR-safe "are we on the client yet?" — false during SSR and hydration, true
// afterwards. Lets the portal wait for a real `document` without a setState-in-
// effect (which this project's lint rules reject) or a hydration mismatch.
const noopSubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

type Props = {
  /** Digits-only E.164 number (no "+"). Defaults to the brand number. */
  phoneNumber?: string;
  /** Pre-filled chat message. Defaults to a localized greeting. */
  message?: string;
  /** Pill label revealed on hover / focus. Defaults to the localized label. */
  label?: string;
  /** Screen-reader label. Defaults to `label`. */
  ariaLabel?: string;
};

export default function WhatsAppFab({
  phoneNumber = WHATSAPP_NUMBER,
  message,
  label,
  ariaLabel,
}: Props) {
  const { t } = useI18n();
  const hydrated = useHydrated();

  const chatMessage = message ?? t.contact.whatsappCtaMessage;
  const pillLabel = label ?? t.contact.whatsapp;
  // wa.me opens WhatsApp Web on desktop and the app on mobile automatically.
  const href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(chatMessage)}`;

  // The portal needs a client-side `document`; render nothing until hydrated.
  if (!hydrated) return null;

  return createPortal(
    <div className="wa-fab-fixed">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel ?? pillLabel}
        className="wa-fab"
      >
        <span className="wa-fab__label" aria-hidden="true">
          {pillLabel}
        </span>
        <span className="wa-fab__icon">
          <WhatsAppIcon size={26} />
        </span>
      </a>
    </div>,
    document.body,
  );
}
