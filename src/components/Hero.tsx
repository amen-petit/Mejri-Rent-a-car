"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Car } from "@/lib/types";
import Arrow from "@/components/icons/Arrow";
import CarSilhouette from "@/components/icons/CarSilhouette";

// Subtle film grain — inline SVG, desaturated fractal noise. No external asset,
// no license risk. Gives the dark stage a tactile, "shot-on-film" quality.
const GRAIN =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>`,
  );

export default function Hero({ car }: { car?: Car }) {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const [shownPrice, setShownPrice] = useState(car?.price_per_day ?? 0);

  // Detect whether rich motion is appropriate (fine pointer + motion allowed).
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const okMotion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Apply on the next frame so the state writes happen in a callback (not
    // synchronously in the effect body) and the entrance transition plays.
    const id = requestAnimationFrame(() => {
      setInteractive(fine && okMotion);
      setMounted(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Depth-layered pointer parallax + cursor spotlight, smoothed with a single
  // rAF loop (no per-move React state — transforms applied straight to refs).
  useEffect(() => {
    if (!interactive) return;
    const el = sectionRef.current;
    if (!el) return;

    const target = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    const spot = { x: 0.5, y: 0.4 };
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width - 0.5; // -0.5 .. 0.5
      target.y = (e.clientY - r.top) / r.height - 0.5;
      spot.x = (e.clientX - r.left) / r.width;
      spot.y = (e.clientY - r.top) / r.height;
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
    };

    const tick = () => {
      pos.x += (target.x - pos.x) * 0.08;
      pos.y += (target.y - pos.y) * 0.08;

      if (headlineRef.current)
        headlineRef.current.style.transform = `translate3d(${pos.x * -14}px, ${pos.y * -10}px, 0)`;
      if (panelRef.current)
        panelRef.current.style.transform = `translate3d(${pos.x * 26}px, ${pos.y * 20}px, 0) rotateY(${pos.x * 5}deg) rotateX(${pos.y * -5}deg)`;
      if (glowRef.current)
        glowRef.current.style.transform = `translate3d(${pos.x * 36}px, ${pos.y * 28}px, 0)`;
      if (spotRef.current)
        spotRef.current.style.background = `radial-gradient(420px circle at ${spot.x * 100}% ${spot.y * 100}%, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent 60%)`;

      raf = requestAnimationFrame(tick);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [interactive]);

  // Price count-up on mount (motion-allowed only). All state writes happen
  // inside rAF callbacks (never synchronously in the effect body) so we don't
  // trigger cascading renders.
  useEffect(() => {
    const price = car?.price_per_day ?? 0;
    let raf = 0;

    // No animation: snap to the final value on the next frame.
    if (!interactive || price <= 0) {
      raf = requestAnimationFrame(() => setShownPrice(price));
      return () => cancelAnimationFrame(raf);
    }

    const start = performance.now();
    const dur = 950;
    const run = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setShownPrice(Math.round(price * eased)); // first frame ≈ 0, then counts up
      if (p < 1) raf = requestAnimationFrame(run);
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [interactive, car?.price_per_day]);

  // Per-line reveal helper: clip-wipe + rise + de-blur, staggered.
  const line = (delay: number): React.CSSProperties => ({
    transition:
      "opacity 0.8s var(--ease-out), transform 0.8s var(--ease-out), filter 0.8s var(--ease-out)",
    transitionDelay: `${delay}ms`,
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(0.5em)",
    filter: mounted ? "blur(0)" : "blur(8px)",
  });

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-[92vh] flex-col overflow-hidden bg-ink text-paper"
    >
      {/* ── Stage lighting ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 90% at 78% 8%, #1b1c22 0%, #0d0d10 46%, #070708 100%)",
        }}
      />
      {/* Accent key-light, parallaxed */}
      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none absolute -z-10 will-change-transform"
        style={{
          top: "-14%",
          right: "4%",
          width: "46rem",
          height: "46rem",
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 34%, transparent) 0%, transparent 62%)",
          filter: "blur(20px)",
          opacity: 0.5,
        }}
      />
      {/* Technical hairline grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "min(14vw, 180px) 100%",
        }}
      />
      {/* Cursor spotlight (mix-blend for a true light feel) */}
      <div
        ref={spotRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 mix-blend-screen"
      />
      {/* Film grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06] mix-blend-overlay"
        style={{ backgroundImage: `url("${GRAIN}")`, backgroundSize: "160px" }}
      />

      {/* Vertical editorial spine */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-5 top-1/2 hidden -translate-y-1/2 lg:block"
        style={{ writingMode: "vertical-rl" }}
      >
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.42em] text-white/30">
          Location Premium — Tunisie — Est. 2019
        </span>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-5 pb-16 pt-14 sm:px-10 lg:pt-20">
        <div className="grid w-full items-center gap-y-12 lg:grid-cols-12 lg:gap-x-8">
          {/* Headline block */}
          <div ref={headlineRef} className="lg:col-span-7 will-change-transform">
            <div
              className="mb-8 inline-flex items-center gap-3"
              style={line(80)}
            >
              <span className="h-px w-8 bg-white/40" />
              <span className="text-[0.66rem] font-semibold uppercase tracking-[0.3em] text-white/55">
                La liberté de rouler
              </span>
            </div>

            <h1 className="font-display font-medium leading-[0.92] tracking-[-0.03em]">
              <span
                className="block text-[clamp(3rem,8.5vw,7.5rem)]"
                style={line(160)}
              >
                La liberté
              </span>
              <span
                className="block text-[clamp(3rem,8.5vw,7.5rem)] text-transparent"
                style={{
                  ...line(280),
                  WebkitTextStroke: "1.4px rgba(246,244,240,0.62)",
                }}
              >
                de la route,
              </span>
              <span
                className="block text-[clamp(3rem,8.5vw,7.5rem)]"
                style={line(400)}
              >
                sans limites
                <span className="text-accent">.</span>
              </span>
            </h1>

            <p
              className="mt-9 max-w-md text-base leading-relaxed text-white/60"
              style={line(560)}
            >
              Une flotte récente, une réservation en ligne sans friction et une
              assistance à toute heure. Choisissez. Réservez. Roulez.
            </p>

            <div
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
              style={line(660)}
            >
              <Link href="/voitures" className="btn-accent px-8 py-4 text-[0.95rem]">
                Réservez maintenant
                <Arrow />
              </Link>
              {car && (
                <Link
                  href={`/voitures/${car.id}`}
                  className="group inline-flex items-center gap-2 px-2 py-2 text-sm text-white/70 transition-colors hover:text-white"
                >
                  <span className="border-b border-white/25 pb-0.5 transition-colors group-hover:border-white">
                    Découvrir la {car.name}
                  </span>
                  <Arrow className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              )}
            </div>
          </div>

          {/* Spotlit car panel */}
          <div className="lg:col-span-5 lg:mt-10" style={{ perspective: "1200px" }}>
            <div
              ref={stageRef}
              className="relative"
              style={{
                transition: "opacity 1s var(--ease-out), transform 1s var(--ease-out)",
                transitionDelay: "340ms",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "scale(1)" : "scale(0.94)",
              }}
            >
              {car ? (
                <>
                  <Link
                    href={`/voitures/${car.id}`}
                    ref={panelRef as React.Ref<HTMLAnchorElement>}
                    className="group relative block aspect-[5/4] overflow-hidden rounded-[14px] border border-white/12 will-change-transform sm:aspect-[16/11]"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* Bright lit panel that holds the catalog shot */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#fbfaf8] to-[#e9e6df]" />
                    {car.images?.[0] ? (
                      <Image
                        src={car.images[0]}
                        alt={`${car.brand} ${car.name}`}
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 42vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <CarSilhouette className="h-24 w-24 text-ash" />
                      </div>
                    )}
                    {/* Cinematic vignette + grain over the photo */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          "radial-gradient(120% 80% at 50% 30%, transparent 40%, rgba(7,7,8,0.28) 100%)",
                      }}
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-multiply"
                      style={{ backgroundImage: `url("${GRAIN}")`, backgroundSize: "160px" }}
                    />
                    {/* Cobalt sweep highlight on hover */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-60"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-accent) 80%, white) , transparent)",
                      }}
                    />

                    {/* Status chip */}
                    <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      Disponible
                    </span>
                  </Link>

                  {/* Info plate docked to the panel's lower edge */}
                  <div className="relative z-20 mx-4 -mt-9 flex items-center justify-between gap-4 rounded-[12px] border border-white/12 bg-ink/85 px-5 py-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:mx-6">
                    <div className="min-w-0">
                      <p className="text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-white/45">
                        {car.brand}
                      </p>
                      <p className="mt-0.5 truncate font-display text-lg font-medium text-white">
                        {car.name}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 sm:gap-5">
                      <div className="hidden text-right sm:block">
                        <p className="text-[0.55rem] uppercase tracking-[0.18em] text-white/40">
                          {car.transmission}
                        </p>
                        <p className="mt-0.5 text-xs text-white/65">
                          {car.fuel_type} · {car.seats} places
                        </p>
                      </div>
                      <div className="h-9 w-px bg-white/12" />
                      <div className="text-right">
                        <p className="text-[0.55rem] uppercase tracking-[0.18em] text-white/40">
                          Dès
                        </p>
                        <p className="font-display text-2xl leading-none text-white">
                          {shownPrice}
                          <span className="ml-1 text-xs font-normal text-white/50">
                            DT/j
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="aspect-[16/11] rounded-[14px] border border-white/12 bg-graphite" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom HUD: stats + scroll cue */}
      <div
        className="relative z-10 border-t border-white/10"
        style={{
          transition: "opacity 0.9s var(--ease-out)",
          transitionDelay: "780ms",
          opacity: mounted ? 1 : 0,
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-5 sm:px-10">
          <dl className="flex items-center gap-8 sm:gap-12">
            {[
              { k: "Flotte", v: "Récente" },
              { k: "Assistance", v: "24 / 7" },
              { k: "Réponse", v: "< 30 min" },
            ].map((s) => (
              <div key={s.k} className="flex flex-col">
                <dt className="text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-white/35">
                  {s.k}
                </dt>
                <dd className="mt-1 font-display text-sm text-white sm:text-base">
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>
          <a
            href="#how"
            className="group hidden items-center gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-white/40 transition-colors hover:text-white sm:inline-flex"
          >
            Défiler
            <svg className="h-4 w-4 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
