import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import LocationSection from "@/components/LocationSection";
import ReviewsShowcase from "@/components/ReviewsShowcase";
import WhatsAppFab from "@/components/WhatsAppFab";
import PromoBadge from "@/components/PromoBadge";
import PromoPrice from "@/components/PromoPrice";
import Link from "next/link";
import Image from "next/image";
import { getCachedCars, getCachedActivePromotions } from "@/lib/cars";
import { attachPromotions, computePromotionSavings } from "@/lib/promotions";
import type { Metadata } from "next";
import { getServerI18n } from "@/i18n/server";
import { interpolate } from "@/i18n/format";
import {
  SITE_URL,
  BRAND_NAME,
  PHONE_DISPLAY,
  WHATSAPP_NUMBER,
  FEATURED_CARS_LIMIT,
  HERO_ROTATION_LIMIT,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Accueil",
  description: `${BRAND_NAME}: location de voitures en Tunisie avec réservation en ligne simple, flotte moderne et assistance 24/7.`,
  alternates: { canonical: "/" },
};

function CarSilhouette({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
      />
    </svg>
  );
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export default async function Home() {
  const { t } = await getServerI18n();
  const [cars, promotions] = await Promise.all([
    getCachedCars().catch(() => []),
    getCachedActivePromotions().catch(() => []),
  ]);
  // Attach each car's currently-active promotion (resolved in one place).
  const withPromo = attachPromotions(cars, promotions);
  const availableCars = withPromo.filter((car) => car.is_available);
  const featuredCars = availableCars.filter((car) => car.is_featured);
  const otherAvailableCars = availableCars.filter((car) => !car.is_featured);
  const ordered = [...featuredCars, ...otherAvailableCars];

  // Hero-selection strategy: PREFER cars with an active promotion so campaigns
  // headline the hero automatically. Among promoted cars, order by featured
  // first, then the biggest saving, then newest. When nothing is promoted, fall
  // back to the previous behaviour (featured, else the newest available car).
  const promoCars = [...availableCars]
    .filter((car) => car.promotion)
    .sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      const sa = computePromotionSavings(a.price_per_day, a.promotion).savingsPct;
      const sb = computePromotionSavings(b.price_per_day, b.promotion).savingsPct;
      if (sa !== sb) return sb - sa;
      return b.created_at.localeCompare(a.created_at);
    });
  const heroCars =
    promoCars.length > 0
      ? promoCars.slice(0, HERO_ROTATION_LIMIT)
      : featuredCars.length > 0
        ? featuredCars.slice(0, HERO_ROTATION_LIMIT)
        : ordered.slice(0, 1);
  // Fleet never repeats a car already in the hero rotation.
  const heroIds = new Set(heroCars.map((car) => car.id));
  const fleet = ordered
    .filter((car) => !heroIds.has(car.id))
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
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />
      <Navbar />

      {/* ─────────────────────────  HERO  ───────────────────────── */}
      <Hero cars={heroCars} />

      {/* ─────────────────────  FEATURED FLEET  ───────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <div
          data-reveal
          className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
        >
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
          <div className="mt-14 border border-mist bg-cloud p-12 text-center text-stone">
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
                    <span className="inline-flex items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-accent">
                      <span className="h-1 w-1 rounded-full text-accent" />
                      {t.fleet.featured}
                    </span>
                  )}
                </div>

                {/* Image plate */}
                <div className="relative mt-5 aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border border-mist bg-cloud transition-[border-color,box-shadow] duration-300 group-hover:border-ink group-hover:shadow-[var(--shadow-md)]">
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
                  <span className="absolute end-3 top-3 rounded-full border border-mist bg-paper px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] text-stone">
                    {t.enums.category[car.category] ?? car.category}
                  </span>
                  {car.promotion && (
                    <PromoBadge
                      promotion={car.promotion}
                      className="absolute start-3 top-3 shadow-sm"
                    />
                  )}
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
                    {t.enums.transmission[car.transmission] ?? car.transmission}{" "}
                    · {t.enums.fuel[car.fuel_type] ?? car.fuel_type} ·{" "}
                    {car.seats} {t.common.seats}
                  </p>

                  <div className="mt-5 flex items-end justify-between border-t border-mist pt-4">
                    {car.promotion ? (
                      (() => {
                        const s = computePromotionSavings(
                          car.price_per_day,
                          car.promotion,
                        );
                        return (
                          <PromoPrice
                            original={s.original}
                            discounted={s.discounted}
                            unit={t.fleet.perDay}
                            savingsPct={s.savingsPct}
                          />
                        );
                      })()
                    ) : (
                      <p className="font-display text-2xl text-ink">
                        {car.price_per_day}
                        <span className="ms-1 text-sm text-ash">
                          {t.fleet.perDay}
                        </span>
                      </p>
                    )}
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
          <div data-reveal className="max-w-2xl">
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
                className={`reveal-d${idx + 1} border-t-2 border-mist pt-6 transition-colors duration-300 hover:border-accent`}
              >
                <span className="font-display text-4xl font-medium text-accent">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-lg font-medium text-ink">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-sm leading-7 text-stone">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────  REVIEWS + CTA  (ink band)  ──────────────── */}
      <section className="relative isolate overflow-hidden bg-ink text-paper">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(70% 55% at 88% 2%, color-mix(in srgb, var(--color-accent) 13%, transparent), transparent 62%)",
          }}
        />
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          {/* Real Google reviews, curated */}
          <ReviewsShowcase t={t} />

          {/* CTA */}
          <div className="flex flex-col items-start justify-between gap-10 pt-16 pb-20 lg:flex-row lg:items-end lg:pt-20 lg:pb-28">
            <div data-reveal="left" className="max-w-2xl">
              <span className="eyebrow text-white/60">{t.cta.eyebrow}</span>
              <h2 className="mt-5 font-display text-[clamp(2.4rem,5vw,4rem)] font-medium leading-[1.02] tracking-[-0.02em] text-white">
                {t.cta.titleA}
                <br />
                {t.cta.titleB}{" "}
                <span className="italic text-white/50">
                  {t.cta.titleAccent}
                </span>{" "}
                ?
              </h2>
            </div>

            <div
              data-reveal="right"
              className="reveal-d2 flex w-full flex-col gap-4 lg:w-auto lg:items-end"
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/voitures" className="btn-accent px-8 py-4">
                  {t.cta.bookNow}
                  <Arrow className="rtl:rotate-180" />
                </Link>
                <a
                  href={`tel:+${WHATSAPP_NUMBER}`}
                  className="btn-ghost-dark px-8 py-4"
                >
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

      {/* ─────────────────────  LOCATION / MAP  ───────────────────── */}
      <LocationSection />

      {/* Floating WhatsApp contact CTA — fixed to the viewport, above content. */}
      <WhatsAppFab />
    </main>
  );
}
