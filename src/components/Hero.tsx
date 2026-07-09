"use client";

/**
 * Hero — distilled dark stage. A single dominant Fraunces headline crowns the
 * section, then the booking card (the primary action) sits to the left of the
 * spotlit car showcase, so a visitor can read the promise, see a featured car,
 * and start a reservation without scrolling.
 *
 * The vedette (featured) cars rotate through one grounded cutout. Motion is a
 * quiet staggered reveal on load, a gentle crossfade between cars, and a fade-up
 * on the swapping facts. Rotation pauses on hover/focus and can be jogged by the
 * dots. Everything is static under prefers-reduced-motion.
 */
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Car } from "@/lib/types";
import CarSilhouette from "@/components/icons/CarSilhouette";
import BookingSearchCard from "@/components/BookingSearchCard";
import { useI18n } from "@/i18n/client";
import { interpolate } from "@/i18n/format";

const ROTATE_MS = 2500;

export default function Hero({ cars }: { cars: Car[] }) {
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      setReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Advance the vedette rotation on a fixed cadence. The timeout is keyed to the
  // current index, so any manual jump (arrows or dots) resets the countdown and
  // the picked car gets a full beat before the next auto-advance. Held while the
  // visitor hovers or focuses the showcase, or when there's only one car.
  useEffect(() => {
    if (cars.length <= 1 || paused) return;
    const id = window.setTimeout(
      () => setIndex((i) => (i + 1) % cars.length),
      ROTATE_MS,
    );
    return () => window.clearTimeout(id);
  }, [cars.length, paused, index]);

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

  const car = cars[index];
  const go = (dir: number) =>
    setIndex((i) => (i + dir + cars.length) % cars.length);

  return (
    <section className="relative isolate overflow-hidden bg-ink text-paper">
      {/* Living dark stage: an enriched cobalt-warmed base, two slow auroras, a
          faint dot lattice for texture, and grain to kill banding. All contained
          to the section; motion freezes under prefers-reduced-motion. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* Base wash — warm-neutral falloff with a cobalt breath from the top. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 100% at 78% -10%, #1b1c24 0%, #101015 46%, #09090b 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(90% 70% at 84% 4%, color-mix(in srgb, var(--color-accent) 22%, transparent) 0%, transparent 60%)",
          }}
        />

        {/* Drifting auroras — the scene breathes. */}
        <span className="hero-aurora hero-aurora--one" />
        <span className="hero-aurora hero-aurora--two" />

        {/* Faint dot lattice, faded toward the edges so it never reads as a grid. */}
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage:
              "radial-gradient(120% 90% at 50% 20%, #000 0%, transparent 72%)",
            WebkitMaskImage:
              "radial-gradient(120% 90% at 50% 20%, #000 0%, transparent 72%)",
          }}
        />

        {/* Grain — removes gradient banding on dark surfaces. */}
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-soft-light"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Soft floor vignette to seat the content and blend into the next section. */}
        <div
          className="absolute inset-x-0 bottom-0 h-40"
          style={{
            background:
              "linear-gradient(to bottom, transparent, color-mix(in srgb, var(--color-ink) 80%, transparent))",
          }}
        />
      </div>

      <div className="mx-auto flex min-h-[calc(100svh-4.25rem)] max-w-7xl flex-col justify-center gap-y-10 px-5 py-10 sm:px-8 lg:gap-y-14 lg:py-14">
        {/* Headline — crowns the hero, centred, spanning its width. */}
        <div className="text-center">
          <div
            className="inline-flex items-center gap-3"
            style={reveal(60)}
          >
            <span className="h-px w-8 bg-accent" />
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-white/55">
              {t.hero.kicker}
            </span>
            <span className="h-px w-8 bg-accent" />
          </div>

          <h1
            className="mt-6 text-balance font-display font-medium leading-[1.05] tracking-[-0.03em] text-[clamp(2.4rem,5vw,4rem)]"
            style={reveal(150)}
          >
            {t.hero.title1} {t.hero.title2} {t.hero.title3}
            <span className="text-accent">.</span>
          </h1>
        </div>

        {/* Booking (left) + car showcase (right). On tablet/mobile the car comes
            first and the booking card follows, both top-aligned on one baseline. */}
        <div className="grid items-start gap-x-10 gap-y-10 lg:grid-cols-12">
          {/* Booking — the primary action, immediately available. */}
          <div
            className="order-2 lg:order-1 lg:col-span-5"
            style={reveal(340)}
          >
            <BookingSearchCard variant="hero" layout="stacked" />
          </div>

          {/* The vedette — a grounded cutout that crossfades between the featured
              cars, its facts on a separate dark bar, dots to jog the set. */}
          <div
            className="order-1 lg:order-2 lg:col-span-7"
            style={reveal(260)}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            {car ? (
              <>
                <Link
                  href={`/voitures/${car.id}`}
                  aria-label={interpolate(t.hero.discover, { name: car.name })}
                  className="group block"
                >
                  {/* Stage — cars stacked and crossfading; a soft cast shadow
                      under each grounds it against the dark. */}
                  <div className="relative aspect-[16/10]">
                    {cars.map((c, i) => (
                      <div
                        key={c.id}
                        aria-hidden={i !== index}
                        className="absolute inset-0 translate-y-[16%] will-change-[opacity,transform]"
                        style={{
                          opacity: i === index ? 1 : 0,
                          transform:
                            i === index
                              ? "translateY(0) scale(1)"
                              : "translateY(12px) scale(0.965)",
                          transition: reduce
                            ? "none"
                            : "opacity 620ms var(--ease-out), transform 620ms var(--ease-out)",
                        }}
                      >
                        {c.images?.[0] ? (
                          <Image
                            src={c.images[0]}
                            alt={`${c.brand} ${c.name}`}
                            fill
                            priority={i === 0}
                            unoptimized
                            sizes="(max-width: 1024px) 100vw, 46vw"
                            className="object-contain object-center drop-shadow-[0_20px_22px_rgba(0,0,0,0.5)] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <CarSilhouette className="h-24 w-24 text-ash" />
                          </div>
                        )}
                      </div>
                    ))}

                    <span className="absolute end-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-full bg-ink/85 px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {t.hero.available}
                    </span>
                  </div>

                  {/* Facts — floating dark bar: brand·name / specs / price.
                      The bar holds; only its contents fade on each swap. */}
                  <div className="mt-3 rounded-2xl border border-white/10 bg-graphite px-6 py-4 shadow-[0_24px_50px_-28px_rgba(0,0,0,0.9)] transition-colors duration-300 group-hover:border-white/20">
                    <div key={car.id} className="hero-swap flex items-center gap-5">
                      <div className="me-auto min-w-0">
                        <p className="text-[0.56rem] font-semibold uppercase tracking-[0.22em] text-white/40">
                          {car.brand}
                        </p>
                        <p className="mt-1 truncate font-display text-2xl font-medium leading-none text-white">
                          {car.name}
                        </p>
                      </div>

                      <div className="hidden shrink-0 sm:block">
                        <p className="text-[0.56rem] font-semibold uppercase tracking-[0.22em] text-white/40">
                          {t.enums.transmission[car.transmission] ??
                            car.transmission}
                        </p>
                        <p className="mt-1 whitespace-nowrap text-sm text-white/65">
                          {t.enums.fuel[car.fuel_type] ?? car.fuel_type} ·{" "}
                          {car.seats} {t.common.seats}
                        </p>
                      </div>

                      <div className="shrink-0 border-s border-white/10 ps-5">
                        <p className="text-[0.56rem] font-semibold uppercase tracking-[0.22em] text-white/40">
                          {t.hero.from}
                        </p>
                        <p className="mt-1 whitespace-nowrap font-display leading-none text-white">
                          <span className="text-2xl font-medium">
                            {car.price_per_day}
                          </span>
                          <span className="ms-1 text-xs text-white/45">
                            {t.hero.perDayShort}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>

                {cars.length > 1 && (
                  <div className="mt-5 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => go(-1)}
                      aria-label={t.hero.prev}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/55 transition-colors duration-200 hover:border-white/40 hover:bg-white/[0.06] hover:text-white"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="rtl:rotate-180"
                        aria-hidden="true"
                      >
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>

                    <div className="flex items-center gap-1">
                      {cars.map((c, i) => (
                        <button
                          key={c.id}
                          type="button"
                          aria-label={c.name}
                          aria-current={i === index}
                          onClick={() => setIndex(i)}
                          className="group/dot flex h-8 items-center px-1.5"
                        >
                          <span
                            className={`block h-1.5 rounded-full transition-all duration-300 ease-out ${
                              i === index
                                ? "w-6 bg-accent"
                                : "w-1.5 bg-white/25 group-hover/dot:bg-white/55"
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => go(1)}
                      aria-label={t.hero.next}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/55 transition-colors duration-200 hover:border-white/40 hover:bg-white/[0.06] hover:text-white"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="rtl:rotate-180"
                        aria-hidden="true"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-[16/10] rounded-2xl border border-white/10 bg-graphite/40" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
