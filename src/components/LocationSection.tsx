"use client";

/**
 * Homepage "Location" section — an embedded Google Map above the footer. Uses
 * Google's keyless `output=embed` endpoint (no API key required) with the place
 * driven by central config (MAPS_QUERY / MAPS_ADDRESS), so it's easy to point at
 * the real agency without touching this component.
 */
import {
  MAPS_ADDRESS,
  MAPS_EMBED_URL,
  MAPS_LINK_URL,
  PHONE_TEL,
  PHONE_DISPLAY,
  WHATSAPP_NUMBER,
} from "@/lib/constants";
import { useI18n } from "@/i18n/client";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export default function LocationSection() {
  const { t } = useI18n();

  return (
    <section id="location" className="scroll-mt-24 bg-cloud">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
          {/* Info */}
          <div data-reveal>
            <span className="eyebrow">{t.location.eyebrow}</span>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)] font-medium tracking-tight text-ink">
              {t.location.title}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-stone">
              {t.location.desc}
            </p>

            <div className="mt-8 space-y-6">
              {/* Phone */}
              <div className="flex items-start gap-3 border-t border-mist pt-6">
                <PhoneIcon className="mt-0.5 shrink-0 text-ink" />
                <div>
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ash">
                    {t.contact.phone}
                  </p>
                  <a
                    href={`tel:${PHONE_TEL}`}
                    aria-label={`${t.nav.call} ${PHONE_DISPLAY}`}
                    className="mt-1 inline-block font-display text-lg text-ink underline-offset-4 hover:underline"
                    dir="ltr"
                  >
                    {PHONE_DISPLAY}
                  </a>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3 border-t border-mist pt-6">
                <PinIcon className="mt-0.5 shrink-0 text-ink" />
                <div>
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ash">
                    {t.location.addressLabel}
                  </p>
                  <p className="mt-1 font-display text-lg text-ink">
                    Rue Windemere Immeuble Malika Lac 1 <br />
                    16 Avenue De CarthageAin Zaghouan Tunis
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={MAPS_LINK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full sm:w-auto"
              >
                <PinIcon className="h-4 w-4" />
                {t.location.openInMaps}
              </a>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-[var(--radius)] border border-ink px-6 py-3.5 text-sm font-medium text-ink transition-colors duration-200 hover:border-[#25D366] hover:bg-[#25D366] hover:text-white active:scale-[0.98] sm:w-auto"
              >
                <WhatsAppIcon size={17} />
                {t.contact.whatsapp}
              </a>
            </div>
          </div>

          {/* Map */}
          <div
            data-reveal="right"
            className="reveal-d2 relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border border-mist bg-paper shadow-sm sm:aspect-[16/10]"
          >
            <iframe
              src={MAPS_EMBED_URL}
              title={t.location.mapTitle}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
