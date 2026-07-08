"use client";

/**
 * Hero -distilled dark stage. One confident idea: a clean spotlit car, a bold
 * Fraunces headline with a single cobalt mark, and the booking bar as the sole
 * primary action.
 *
 * Deliberately stripped of the old chrome (film grain, cursor spotlight,
 * parallax, tech grid, mix-blend, outline type, gradient sweeps, price count-up,
 * stats HUD, bounce scroll cue, the em-dash "spine"). Surfaces are solid with
 * hairline borders (no glass); depth is one restrained wash, not a stack. Motion
 * is a quiet staggered reveal on the site's exponential ease-out, static under
 * prefers-reduced-motion.
 */
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Car } from "@/lib/types";
import Arrow from "@/components/icons/Arrow";
import CarSilhouette from "@/components/icons/CarSilhouette";
import BookingSearchCard from "@/components/BookingSearchCard";
import { useI18n } from "@/i18n/client";
import { interpolate } from "@/i18n/format";

export default function Hero({ car }: { car?: Car }) {
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      setReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const reveal = (delay: number): React.CSSProperties =>
    reduce
      ? {}
      : {
          transition:
            "opacity 0.7s var(--ease-out), transform 0.7s var(--ease-out)",
          transitionDelay: `${delay}ms`,
          opacity: ready ? 1 : 0,
          transform: ready ? "none" : "translateY(0.6rem)",
        };

  return (
    <section className="relative isolate bg-ink text-paper">
      {/* One restrained depth wash (contained to the section, no gradient stack). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(115% 90% at 82% 0%, #17171b 0%, #0b0b0c 56%, #090909 100%)",
        }}
      />

      <div className="mx-auto flex min-h-[calc(100svh-4.25rem)] max-w-7xl flex-col justify-center gap-y-12 px-5 py-12 sm:px-8 lg:gap-y-16 lg:py-16">
        <div className="grid items-center gap-x-12 gap-y-12 lg:grid-cols-12">
          {/* Type */}
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-3" style={reveal(60)}>
              <span className="h-px w-10 bg-accent" />
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-white/55">
                {t.hero.kicker}
              </span>
            </div>

            <h1 className="mt-7 font-display font-medium leading-[0.95] tracking-[-0.03em] text-[clamp(2.9rem,6.4vw,5.5rem)]">
              <span className="block" style={reveal(150)}>
                {t.hero.title1} {t.hero.title2}
              </span>
              <span className="block" style={reveal(240)}>
                {t.hero.title3}
                <span className="text-accent">.</span>
              </span>
            </h1>

            <p
              className="mt-7 max-w-md text-base leading-relaxed text-white/60"
              style={reveal(360)}
            >
              {t.hero.subtitle}
            </p>

            {car && (
              <div className="mt-8" style={reveal(440)}>
                <Link
                  href={`/voitures/${car.id}`}
                  className="group inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
                >
                  <span className="border-b border-white/25 pb-0.5 transition-colors group-hover:border-white">
                    {interpolate(t.hero.discover, { name: car.name })}
                  </span>
                  <Arrow className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </Link>
              </div>
            )}
          </div>

          {/* The car -one clean object: image plate + solid info bar, one border. */}
          <div className="lg:col-span-6" style={reveal(300)}>
            {car ? (
              <Link
                href={`/voitures/${car.id}`}
                aria-label={interpolate(t.hero.discover, { name: car.name })}
                className="group block overflow-hidden rounded-[var(--radius-lg)] border border-white/10"
              >
                <div className="relative aspect-[16/11] bg-cloud">
                  {car.images?.[0] ? (
                    <Image
                      src={car.images[0]}
                      alt={`${car.brand} ${car.name}`}
                      fill
                      priority
                      unoptimized
                      sizes="(max-width: 1024px) 100vw, 46vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <CarSilhouette className="h-24 w-24 text-ash" />
                    </div>
                  )}
                  <span className="absolute end-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink/85 px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    {t.hero.available}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-white/10 bg-graphite px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-[0.56rem] font-semibold uppercase tracking-[0.22em] text-white/40">
                      {car.brand}
                    </p>
                    <p className="mt-0.5 truncate font-display text-base font-medium text-white">
                      {car.name}
                    </p>
                  </div>
                  <p className="shrink-0 whitespace-nowrap text-end">
                    <span className="text-[0.55rem] uppercase tracking-[0.16em] text-white/40">
                      {t.hero.from}{" "}
                    </span>
                    <span className="font-display text-xl text-white">
                      {car.price_per_day}
                      <span className="ms-1 text-xs text-white/45">
                        {t.hero.perDayShort}
                      </span>
                    </span>
                  </p>
                </div>
              </Link>
            ) : (
              <div className="aspect-[16/11] rounded-[var(--radius-lg)] border border-white/10 bg-graphite" />
            )}
          </div>
        </div>

        {/* Booking command bar -the single primary action. */}
        <div style={reveal(520)}>
          <BookingSearchCard variant="hero" />
        </div>
      </div>
    </section>
  );
}
