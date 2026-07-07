import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import LocationSection from "@/components/LocationSection";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import Link from "next/link";
import Image from "next/image";
import { getCars } from "@/lib/cars";
import type { Metadata } from "next";
import { getServerI18n } from "@/i18n/server";
import { interpolate } from "@/i18n/format";
import {
  SITE_URL,
  BRAND_NAME,
  BRAND_SHORT,
  PHONE_DISPLAY,
  WHATSAPP_NUMBER,
  FEATURED_CARS_LIMIT,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Accueil",
  description: `${BRAND_NAME}: location de voitures en Tunisie avec réservation en ligne simple, flotte moderne et assistance 24/7.`,
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

function CarSilhouette({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export default async function Home() {
  const { t } = await getServerI18n();
  const cars = await getCars().catch(() => []);
  const availableCars = cars.filter((car) => car.is_available);
  const featuredCars = availableCars.filter((car) => car.is_featured);
  const otherAvailableCars = availableCars.filter((car) => !car.is_featured);
  const ordered = [...featuredCars, ...otherAvailableCars];
  const hero = ordered[0];
  // Fleet excludes the hero vehicle: never repeat the showcased car, and
  // never request the same remote image twice on one page (which races the
  // image optimizer and can blank one copy).
  const fleet = ordered
    .filter((car) => car.id !== hero?.id)
    .slice(0, FEATURED_CARS_LIMIT);

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "CarRental",
    name: BRAND_NAME,
    url: SITE_URL,
    image: `${SITE_URL}/Untitled%20design.png`,
    telephone: PHONE_DISPLAY,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Tunis",
      addressCountry: "TN",
    },
    areaServed: "Tunisie",
    priceRange: "$$",
  };

  return (
    <main className="overflow-x-hidden bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <Navbar />

      {/* ─────────────────────────  HERO  ───────────────────────── */}
      <Hero car={hero} />

      {/* ─────────────────────  FEATURED FLEET  ───────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">{t.fleet.eyebrow}</span>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)] font-medium tracking-tight text-ink">
              {t.fleet.title}
            </h2>
          </div>
          <Link
            href="/voitures"
            className="group inline-flex w-fit items-center gap-2 border-b border-ink pb-1 text-sm font-medium text-ink"
          >
            {t.fleet.allFleet}
            <Arrow className="transition-transform duration-200 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180" />
          </Link>
        </div>

        {fleet.length === 0 ? (
          <div className="mt-12 border border-mist bg-cloud p-12 text-center text-stone">
            {t.fleet.empty}
          </div>
        ) : (
          <div className="mt-14 grid gap-x-8 gap-y-14 md:grid-cols-3">
            {fleet.map((car, idx) => (
              <Link
                href={`/voitures/${car.id}`}
                key={car.id}
                data-reveal
                className={`reveal-d${idx + 1} group block`}
              >
                {/* Index + hairline */}
                <div className="flex items-center gap-4">
                  <span className="font-display text-sm text-ash">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="h-px flex-1 bg-mist transition-colors duration-300 group-hover:bg-ink" />
                  {car.is_featured && (
                    <span className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-accent">
                      {t.fleet.featured}
                    </span>
                  )}
                </div>

                {/* Image plate */}
                <div className="relative mt-5 aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border border-mist bg-cloud">
                  {car.images?.[0] ? (
                    <Image
                      src={car.images[0]}
                      alt={`${car.brand} ${car.name}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-contain p-5 transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <CarSilhouette className="h-16 w-16 text-ash" />
                    </div>
                  )}
                  <span className="absolute end-3 top-3 rounded-full border border-ink/10 bg-paper/80 px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] text-stone backdrop-blur-sm">
                    {t.enums.category[car.category] ?? car.category}
                  </span>
                </div>

                {/* Caption */}
                <div className="mt-5">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-stone">
                    {car.brand}
                  </p>
                  <h3 className="mt-1.5 font-display text-xl font-medium text-ink">
                    {car.name}
                  </h3>
                  <p className="mt-2 text-xs text-ash">
                    {t.enums.transmission[car.transmission] ?? car.transmission} ·{" "}
                    {t.enums.fuel[car.fuel_type] ?? car.fuel_type} · {car.seats}{" "}
                    {t.common.seats}
                  </p>

                  <div className="mt-5 flex items-end justify-between border-t border-mist pt-4">
                    <p className="font-display text-2xl text-ink">
                      {car.price_per_day}
                      <span className="ms-1 text-sm text-ash">
                        {t.fleet.perDay}
                      </span>
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors duration-200 group-hover:text-accent">
                      {t.fleet.book}
                      <Arrow className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ─────────────────────  HOW IT WORKS  ───────────────────── */}
      <section id="how" className="scroll-mt-24 bg-cloud">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="max-w-2xl">
            <span className="eyebrow">{t.how.eyebrow}</span>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)] font-medium tracking-tight text-ink">
              {t.how.title}
            </h2>
          </div>

          <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {t.how.steps.map((step, idx) => (
              <div
                key={idx}
                data-reveal
                className={`reveal-d${idx + 1} border-t border-line pt-6`}
              >
                <span className="font-display text-4xl font-medium text-ink/15">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-lg font-medium text-ink">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-sm leading-7 text-stone">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────  WHY / FEATURES  ───────────────────── */}
      <section id="about" className="scroll-mt-24">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="max-w-2xl">
            <span className="eyebrow">
              {interpolate(t.features.eyebrow, { brand: BRAND_SHORT })}
            </span>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)] font-medium tracking-tight text-ink">
              {t.features.titleA}
              <br className="hidden sm:block" /> {t.features.titleB}
            </h2>
          </div>

          <div className="mt-16 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-mist bg-mist sm:grid-cols-2">
            {t.features.items.map((f, idx) => (
              <div
                key={idx}
                data-reveal
                className={`reveal-d${(idx % 2) + 1} bg-paper p-8 lg:p-10`}
              >
                <div className="flex items-baseline gap-4">
                  <span className="font-display text-2xl text-ash">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-xl font-medium text-ink">
                    {f.title}
                  </h3>
                </div>
                <p className="mt-4 max-w-sm text-sm leading-7 text-stone">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────  ENGAGEMENTS + CTA  (ink band)  ──────────────── */}
      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          {/* Engagements — honest commitments, no fake testimonials */}
          <div className="grid gap-px border-b border-white/10 py-16 sm:grid-cols-3 lg:py-20">
            {t.engagements.map((e, idx) => (
              <div key={idx} className="sm:px-8 sm:first:ps-0">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-white/40">
                  {e.k}
                </p>
                <p className="mt-3 font-display text-3xl font-medium text-white">
                  {e.v}
                </p>
                <p className="mt-3 max-w-xs text-sm leading-7 text-white/55">
                  {e.d}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col items-start justify-between gap-10 py-16 lg:flex-row lg:items-end lg:py-24">
            <div className="max-w-2xl">
              <span className="eyebrow text-white/55 before:bg-white/40">
                {t.cta.eyebrow}
              </span>
              <h2 className="mt-6 font-display text-[clamp(2.4rem,5vw,4rem)] font-medium leading-[1.02] tracking-[-0.02em] text-white">
                {t.cta.titleA}
                <br />
                {t.cta.titleB}{" "}
                <span className="italic text-white/50">{t.cta.titleAccent}</span> ?
              </h2>
            </div>

            <div className="flex w-full flex-col gap-4 lg:w-auto lg:items-end">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/voitures" className="btn-accent px-8 py-4">
                  {t.cta.bookNow}
                  <Arrow className="rtl:rotate-180" />
                </Link>
                <a href={`tel:+${WHATSAPP_NUMBER}`} className="btn-ghost-dark px-8 py-4">
                  {interpolate(t.cta.call, { phone: PHONE_DISPLAY })}
                </a>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/50">
                {t.cta.badges.map((b) => (
                  <span key={b} className="inline-flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-accent" />
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────  CONTACT & PRIVACY  ───────────────────── */}
      <section id="contact" className="scroll-mt-24 bg-cloud">
        <div className="mx-auto grid max-w-7xl gap-px overflow-hidden border-y border-mist bg-mist lg:grid-cols-2">
          {/* Contact */}
          <div className="bg-paper p-8 sm:p-12 lg:p-16">
            <span className="eyebrow">{t.contact.eyebrow}</span>
            <h3 className="mt-5 font-display text-2xl font-medium text-ink sm:text-3xl">
              {t.contact.title}
            </h3>
            <p className="mt-4 max-w-md text-sm leading-7 text-stone">
              {t.contact.desc}
            </p>

            <dl className="mt-10 space-y-6">
              <div className="flex items-baseline gap-6 border-t border-mist pt-5">
                <dt className="w-24 shrink-0 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ash">
                  {t.contact.phone}
                </dt>
                <dd className="font-display text-lg text-ink" dir="ltr">
                  {PHONE_DISPLAY}
                </dd>
              </div>
              <div className="flex items-baseline gap-6 border-t border-mist pt-5">
                <dt className="w-24 shrink-0 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ash">
                  {t.contact.address}
                </dt>
                <dd className="font-display text-lg text-ink">
                  {t.contact.addressValue}
                </dd>
              </div>
            </dl>

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-flex items-center gap-2.5 rounded-[var(--radius)] border border-ink px-6 py-3.5 text-sm font-medium text-ink transition-colors duration-200 hover:bg-[#25D366] hover:border-[#25D366] hover:text-white active:scale-[0.98]"
            >
              <WhatsAppIcon size={17} />
              {t.contact.whatsapp}
            </a>
          </div>

          {/* Privacy */}
          <div id="privacy" className="scroll-mt-24 bg-paper p-8 sm:p-12 lg:p-16">
            <span className="eyebrow">{t.privacy.eyebrow}</span>
            <h3 className="mt-5 font-display text-2xl font-medium text-ink sm:text-3xl">
              {t.privacy.title}
            </h3>
            <ul className="mt-8 space-y-5">
              {t.privacy.points.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-4 border-t border-mist pt-5"
                >
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <p className="text-sm leading-7 text-stone">{point}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─────────────────────  LOCATION / MAP  ───────────────────── */}
      <LocationSection />
    </main>
  );
}
