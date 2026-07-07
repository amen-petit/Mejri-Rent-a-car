"use client";

/**
 * Homepage "Location" section — an embedded Google Map above the footer. Uses
 * Google's keyless `output=embed` endpoint (no API key required) with the place
 * driven by central config (MAPS_QUERY / MAPS_ADDRESS), so it's easy to point at
 * the real agency without touching this component.
 */
import { MAPS_ADDRESS, MAPS_EMBED_URL, MAPS_LINK_URL } from "@/lib/constants";
import { useI18n } from "@/i18n/client";

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

export default function LocationSection() {
  const { t } = useI18n();

  return (
    <section id="location" className="scroll-mt-24 bg-cloud">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
          {/* Info */}
          <div>
            <span className="eyebrow">{t.location.eyebrow}</span>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)] font-medium tracking-tight text-ink">
              {t.location.title}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-stone">
              {t.location.desc}
            </p>

            <div className="mt-8 flex items-start gap-3 border-t border-mist pt-6">
              <PinIcon className="mt-0.5 shrink-0 text-ink" />
              <div>
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ash">
                  {t.location.addressLabel}
                </p>
                <p className="mt-1 font-display text-lg text-ink">
                  {MAPS_ADDRESS}
                </p>
              </div>
            </div>

            <a
              href={MAPS_LINK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-8 w-full sm:w-auto"
            >
              <PinIcon className="h-4 w-4" />
              {t.location.openInMaps}
            </a>
          </div>

          {/* Map */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border border-mist bg-paper shadow-sm sm:aspect-[16/10]">
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
