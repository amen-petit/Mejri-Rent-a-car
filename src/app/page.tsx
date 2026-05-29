import Navbar from "@/components/Navbar";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import Link from "next/link";
import Image from "next/image";
import { getCars } from "@/lib/cars";
import type { Metadata } from "next";
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

const steps = [
  {
    num: "01",
    title: "Choisissez votre véhicule",
    desc: "Parcourez notre flotte et trouvez le véhicule adapté à votre voyage.",
  },
  {
    num: "02",
    title: "Sélectionnez vos dates",
    desc: "Vérifiez les disponibilités en temps réel et planifiez votre trajet.",
  },
  {
    num: "03",
    title: "Confirmez la réservation",
    desc: "Réservez en quelques clics et recevez une confirmation instantanée.",
  },
  {
    num: "04",
    title: "Prenez la route",
    desc: "Récupérez votre véhicule et partez serein vers votre destination.",
  },
];

const features = [
  {
    title: "Flotte Récente",
    desc: "Véhicules régulièrement renouvelés et entretenus selon les standards les plus exigeants.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
        <rect width="13" height="8" x="8" y="13" rx="2" />
        <path d="M19 17v-4" />
        <path d="M21 15h-4" />
      </svg>
    ),
  },
  {
    title: "Réservation Instantanée",
    desc: "Confirmez votre location en quelques secondes avec disponibilité en temps réel.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    title: "Support 24/7",
    desc: "Notre équipe est disponible à toute heure pour vous accompagner durant votre location.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.5 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.45 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.09a16 16 0 0 0 5.91 5.91l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    title: "Prix Transparents",
    desc: "Aucune surprise : le prix affiché est le prix final, sans frais cachés.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

const testimonials = [
  {
    name: "Ahmed B.",
    city: "Tunis",
    text: `Service exceptionnel, véhicule impeccable et livraison rapide. Je recommande vivement ${BRAND_SHORT} pour toute location en Tunisie.`,
  },
  {
    name: "Sonia M.",
    city: "Sfax",
    text: "Réservation en ligne très simple, prix transparents et voiture en parfait état. Une expérience vraiment premium.",
  },
  {
    name: "Karim L.",
    city: "Sousse",
    text: "Équipe professionnelle et réactive. Le support 24/7 m'a vraiment aidé lors de mon déplacement professionnel.",
  },
];

export default async function Home() {
  const cars = await getCars().catch(() => []);
  const availableCars = cars.filter((car) => car.is_available);
  const featuredCars = availableCars.filter((car) => car.is_featured);
  const otherAvailableCars = availableCars.filter((car) => !car.is_featured);
  const displayedCars = [...featuredCars, ...otherAvailableCars].slice(
    0,
    FEATURED_CARS_LIMIT,
  );

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
    <main className="overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />
      <Navbar />

      {/* ── 1. HERO ── */}
      <section
        className="relative flex min-h-[80dvh] flex-col overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, var(--color-navy-deep) 0%, var(--color-navy) 45%, var(--color-navy-soft) 100%)",
        }}
      >
        {/* Large gradient orbs */}
        <div className="pointer-events-none absolute -right-[5%] -top-[10%] h-[800px] w-[800px] rounded-full bg-primary/10 blur-[130px] animate-float-orb" />
        <div className="pointer-events-none absolute -bottom-[8%] -left-[8%] h-[700px] w-[700px] rounded-full bg-secondary/10 blur-[120px] animate-float-orb-reverse" />

        {/* Giant background watermark */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none"
          aria-hidden="true"
        >
          <span
            className="select-none whitespace-nowrap text-[28vw] font-black leading-none tracking-tighter"
            style={{ color: "rgba(255,255,255,0.022)" }}
          >
            {BRAND_SHORT.toUpperCase()}
          </span>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-1 items-center">
          <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
            <div className="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr] xl:gap-14">
              {/* LEFT: Editorial headline */}
              <div className="hero-col-left">
                <div className="chip mb-5">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Service Premium · Tunisie
                </div>

                <h1 className="flex flex-col">
                  <span className="font-black leading-[0.95] tracking-tight text-white text-[clamp(3rem,8vw,5.5rem)]">
                    La liberté
                  </span>
                  <span className="font-black leading-[0.95] tracking-tight text-[clamp(3rem,8vw,5.5rem)]" style={{ color: "var(--color-primary)" }}>
                    de la route,
                  </span>
                  <span
                    className="font-black leading-[0.95] tracking-tight text-[clamp(3rem,8vw,5.5rem)]"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    sans limites.
                  </span>
                </h1>

                <div
                  className="my-5 h-px w-20"
                  style={{
                    background: "linear-gradient(90deg, var(--color-primary), var(--color-secondary))",
                  }}
                />

                <p className="max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">
                  Location de voitures premium en Tunisie. Réservez rapidement,
                  conduisez sereinement avec une assistance disponible à toute
                  heure.
                </p>

                <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/voitures"
                    className="btn-primary px-8 py-4 text-base"
                  >
                    Réservez maintenant
                  </Link>
                  <Link
                    href="#how"
                    className="btn-ghost-dark px-8 py-4 text-base"
                  >
                    Comment ça marche
                  </Link>
                </div>

                <div className="mt-7 flex items-center gap-5 border-t border-white/10 pt-5">
                  <div className="flex -space-x-2.5">
                    <div className="h-9 w-9 rounded-full border-2 border-navy bg-linear-to-br from-primary to-secondary" />
                    <div className="h-9 w-9 rounded-full border-2 border-navy bg-linear-to-br from-secondary to-primary" />
                    <div className="h-9 w-9 rounded-full border-2 border-navy bg-linear-to-br from-slate-400 to-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      +200 clients satisfaits
                    </p>
                    <p className="mt-0.5 text-xs text-primary">
                      ★★★★★ · Note 4.9/5
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT: Featured car or booking steps */}
              <div className="hero-col-right">
                {displayedCars[0] ? (
                  <div className="group relative">
                    {/* Badges — outside the masked container so they stay crisp */}
                    <div className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-navy/60 px-2.5 py-1 ring-1 ring-white/10 backdrop-blur-sm">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      <span className="text-[11px] font-semibold text-white">
                        Disponible
                      </span>
                    </div>
                    <div className="absolute right-4 top-4 z-10 rounded-full bg-navy/60 px-2.5 py-1 text-[11px] font-medium text-white/60 ring-1 ring-white/10 backdrop-blur-sm">
                      {displayedCars[0].category}
                    </div>

                    {/* Image — masked fade so it bleeds into hero, no hard box */}
                    <div className="relative h-[280px] sm:h-[340px] md:h-[390px] overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-15px_rgba(0,0,0,0.45)]">
                      {displayedCars[0].images?.[0] ? (
                        <Image
                          src={displayedCars[0].images[0]}
                          alt={`${displayedCars[0].brand} ${displayedCars[0].name}`}
                          fill
                          priority
                          sizes="(max-width: 768px) 100vw, 45vw"
                          className="object-contain transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center" style={{ background: "linear-gradient(145deg, var(--color-navy-soft), var(--color-navy-soft))" }}>
                          <svg
                            className="h-20 w-20 text-slate-600"
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
                        </div>
                      )}
                    </div>

                    {/* Content sits on the hero background — truly blended */}
                    <div className="pt-5 px-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                        {displayedCars[0].brand}
                      </p>
                      <h3 className="mt-1 text-2xl font-black leading-tight text-white">
                        {displayedCars[0].name}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-white/40">
                        <span>{displayedCars[0].transmission}</span>
                        <span className="text-white/20">·</span>
                        <span>{displayedCars[0].fuel_type}</span>
                        <span className="text-white/20">·</span>
                        <span>{displayedCars[0].seats} places</span>
                      </div>

                      <div className="mt-5 flex items-end justify-between">
                        <div>
                          <p className="text-[10px] text-white/30">À partir de</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-[2.2rem] font-black leading-none text-white">
                              {displayedCars[0].price_per_day}
                            </span>
                            <span className="text-sm text-white/35">DT/jour</span>
                          </div>
                        </div>
                        <Link
                          href={`/voitures/${displayedCars[0].id}`}
                          className="btn-primary px-6 py-3 text-sm"
                        >
                          Réserver
                          <svg
                            className="ml-1.5"
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Fallback: 3-step booking guide */
                  <div className="rounded-3xl bg-[#1a2237] p-8 ring-1 ring-white/15">
                    <p className="mb-7 text-[0.65rem] font-black uppercase tracking-[0.25em] text-slate-500">
                      Réserver en 3 étapes
                    </p>
                    <div className="space-y-7">
                      {[
                        {
                          n: "01",
                          t: "Choisissez votre véhicule",
                          d: "Parcourez notre flotte en ligne.",
                        },
                        {
                          n: "02",
                          t: "Sélectionnez vos dates",
                          d: "Disponibilité vérifiée en temps réel.",
                        },
                        {
                          n: "03",
                          t: "Confirmez via WhatsApp",
                          d: "Réponse garantie en moins de 30 min.",
                        },
                      ].map((s) => (
                        <div key={s.n} className="flex gap-5">
                          <span className="w-8 shrink-0 text-right text-[1.75rem] font-black leading-none text-white/10">
                            {s.n}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-white">{s.t}</p>
                            <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                              {s.d}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrolling marquee ticker */}
        <div className="relative z-10 overflow-hidden border-t border-white/8 py-4">
          <div className="flex animate-marquee whitespace-nowrap">
            {[0, 1].map((setIdx) => (
              <div key={setIdx} className="flex shrink-0 items-center">
                {[
                  "50+ Véhicules Premium",
                  "Service 24/7",
                  "Note Client 4.9/5",
                  "8+ Villes en Tunisie",
                  "Réservation Instantanée",
                  "Prix Transparents",
                  "Flotte Récente",
                  "Assistance Dédiée",
                ].map((item) => (
                  <span
                    key={`${setIdx}-${item}`}
                    className="flex items-center gap-2.5 px-7 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
                  >
                    <span
                      className="h-1 w-1 shrink-0 rounded-full"
                      style={{
                        background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                      }}
                    />
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. FEATURED CARS ── */}
      <section className="relative overflow-hidden bg-white px-4 py-24 sm:px-6">
        {/* Background depth */}
        <div className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-primary/[0.05] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-secondary/[0.05] blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="section-label">Sélection du moment</span>
              <h2 className="mt-3 text-3xl font-semibold text-navy sm:text-4xl">
                Flotte à la une
              </h2>
            </div>
            <Link
              href="/voitures"
              className="btn-secondary hidden shrink-0 sm:inline-flex"
            >
              Voir tout →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {displayedCars.length === 0 ? (
              <div className="card-surface p-10 text-center text-slate-600 md:col-span-3">
                Aucun véhicule disponible pour le moment.
              </div>
            ) : (
              displayedCars.map((car, idx) => (
                <div
                  data-reveal
                  key={car.id}
                  className={`reveal-d${idx + 1} group relative cursor-pointer overflow-hidden rounded-2xl border border-edge bg-white shadow-[0_2px_8px_color-mix(in srgb, var(--color-navy) 6%, transparent)] transition-[transform,box-shadow,border-color] duration-500 ease-out hover:-translate-y-2 hover:border-primary/50 hover:shadow-[0_16px_40px_color-mix(in srgb, var(--color-navy) 14%, transparent)]`}
                >
                  {/* Top gradient accent line on hover */}
                  <div className="absolute left-0 right-0 top-0 z-10 h-0.5 bg-gradient-to-r from-primary to-secondary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <Link href={`/voitures/${car.id}`} className="block">
                    <div className="relative h-52 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                      {car.images?.[0] ? (
                        <Image
                          src={car.images[0]}
                          alt={`${car.brand} ${car.name}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <svg
                            className="h-16 w-16 text-slate-300"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                            />
                          </svg>
                        </div>
                      )}
                      {/* Persistent bottom gradient for badge readability */}
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
                      {/* Hover overlay with entrance animation */}
                      <div className="absolute inset-0 flex items-center justify-center bg-navy/50 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
                        <span className="flex translate-y-2 items-center gap-2 rounded-full border border-white/30 bg-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-transform duration-300 group-hover:translate-y-0">
                          Voir les détails
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                      {car.is_featured && (
                        <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-secondary px-2.5 py-1 text-xs font-bold text-navy shadow-lg shadow-primary/20">
                          <svg
                            width="9"
                            height="9"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          Vedette
                        </div>
                      )}
                      <div className="absolute bottom-3 right-3 z-10 rounded-full bg-navy/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        {car.category}
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="mb-3">
                        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                          {car.brand}
                        </p>
                        <h3 className="text-lg font-bold leading-tight text-navy">
                          {car.name}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 2v2M12 20v2M4.22 7l1.74 1M18.04 16l1.74 1M4.22 17l1.74-1M18.04 8l1.74-1" />
                          </svg>
                          {car.transmission}
                        </span>
                        <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5-2 1.6-3 3.5-3 5.5a7 7 0 0 0 7 7z" />
                          </svg>
                          {car.fuel_type}
                        </span>
                        <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          {car.seats} places
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            À partir de
                          </p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-navy">
                              {car.price_per_day}
                            </span>
                            <span className="text-xs text-slate-400">
                              DT/jour
                            </span>
                          </div>
                        </div>
                        <span className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-xs font-bold text-white shadow-md transition-shadow duration-300 group-hover:shadow-[0_6px_20px_color-mix(in srgb, var(--color-primary) 45%, transparent)]">
                          Réserver
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))
            )}
          </div>

          <Link
            href="/voitures"
            className="btn-secondary mt-8 w-full sm:hidden"
          >
            Voir tout →
          </Link>
        </div>
      </section>

      {/* ── 3. FEATURES ── */}
      <section
        id="about"
        data-reveal
        className="relative overflow-hidden scroll-mt-28 px-4 py-24 sm:px-6"
        style={{ background: "var(--color-surface)" }}
      >
        {/* Background depth */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, color-mix(in srgb, var(--color-navy) 5.5%, transparent) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <span className="section-label">Nos avantages</span>
            <h2 className="mt-3 text-3xl font-semibold text-navy sm:text-4xl">
              Pourquoi choisir {BRAND_SHORT}?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-600">
              Une expérience de location conçue pour votre confort et votre
              tranquillité d&apos;esprit.
            </p>
          </div>

          <div className="relative grid gap-x-16 gap-y-20 sm:grid-cols-2">
            {/* Vertical divider between columns */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 top-0 hidden w-px sm:block"
              style={{
                left: "50%",
                background:
                  "linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--color-navy) 10%, transparent) 15%, color-mix(in srgb, var(--color-navy) 10%, transparent) 85%, transparent 100%)",
              }}
            />
            {/* Horizontal divider between rows */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 right-0 hidden h-px sm:block"
              style={{
                top: "50%",
                background:
                  "linear-gradient(to right, transparent 0%, color-mix(in srgb, var(--color-navy) 10%, transparent) 15%, color-mix(in srgb, var(--color-navy) 10%, transparent) 85%, transparent 100%)",
              }}
            />

            {features.map((f, idx) => {
              const accent = idx % 2 === 0 ? "var(--color-primary)" : "var(--color-secondary)";
              const accentRgb =
                idx % 2 === 0 ? "137,169,241" : "166,102,148";
              return (
                <div
                  data-reveal
                  key={f.title}
                  className={`reveal-d${idx + 1} relative`}
                >
                  {/* Large watermark number */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-2 -top-2 select-none text-[6rem] font-black leading-none"
                    style={{ color: `rgba(${accentRgb},0.1)` }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="relative">
                    {/* Small number label */}
                    <p
                      className="mb-4 text-[0.6rem] font-black uppercase tracking-[0.3em]"
                      style={{ color: `rgba(${accentRgb},0.55)` }}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </p>
                    {/* Icon */}
                    <div className="mb-4" style={{ color: accent }}>
                      {f.icon}
                    </div>
                    <h3 className="text-base font-bold text-navy">
                      {f.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {f.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS ── */}
      <section
        id="how"
        data-reveal
        className="relative overflow-hidden scroll-mt-28 bg-white px-4 py-24 sm:px-6"
      >
        {/* Background depth */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full bg-secondary/[0.05] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <span className="section-label">Simple et rapide</span>
            <h2 className="mt-3 text-3xl font-semibold text-navy sm:text-4xl">
              Comment ça marche
            </h2>
          </div>

          <div className="relative grid gap-6 md:grid-cols-4">
            {/* Connector line */}
            <div
              className="absolute hidden md:block"
              style={{
                top: "2.5rem",
                left: "13%",
                right: "13%",
                height: "2px",
                background:
                  "linear-gradient(90deg, transparent, var(--color-primary) 20%, var(--color-secondary) 80%, transparent)",
              }}
            />

            {steps.map((step, idx) => (
              <div
                data-reveal
                key={step.num}
                className={`reveal-d${idx + 1} group`}
              >
                {/* Number badge */}
                <div
                  className="relative z-10 mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl text-xl font-black text-white shadow-[0_8px_24px_color-mix(in srgb, var(--color-primary) 25%, transparent)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_12px_32px_color-mix(in srgb, var(--color-primary) 40%, transparent)]"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
                  }}
                >
                  {step.num}
                </div>
                {/* Content card */}
                <div className="rounded-2xl border border-edge bg-white p-6 text-center shadow-[0_2px_8px_color-mix(in srgb, var(--color-navy) 5%, transparent)] transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-[0_8px_24px_color-mix(in srgb, var(--color-primary) 12%, transparent)]">
                  <h3 className="text-base font-bold text-navy">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. TESTIMONIALS ── */}
      <section
        data-reveal
        className="relative overflow-hidden px-4 py-24 sm:px-6"
        style={{ background: "var(--color-navy)" }}
      >
        {/* Background depth */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-80 w-[800px] -translate-x-1/2 rounded-full"
          style={{
            background:
              "conic-gradient(from 180deg at 50% 0%, color-mix(in srgb, var(--color-primary) 10%, transparent), color-mix(in srgb, var(--color-secondary) 7%, transparent), transparent 55%)",
            filter: "blur(60px)",
          }}
        />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-secondary/[0.08] blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <span className="section-label" style={{ color: "var(--color-primary)" }}>
              Avis clients
            </span>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              Ce que disent nos clients
            </h2>
          </div>

          {/* Trust stats bar */}
          <div className="mb-12 grid grid-cols-3 divide-x divide-white/8 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-sm">
            {[
              { num: "200+", label: "Clients satisfaits" },
              { num: "4.9 / 5", label: "Note moyenne" },
              { num: "8+", label: "Villes couvertes" },
            ].map((stat) => (
              <div key={stat.label} className="py-6 text-center">
                <p className="text-2xl font-black text-white">{stat.num}</p>
                <p className="mt-1 text-xs text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, idx) => (
              <div
                data-reveal
                key={t.name}
                className={`reveal-d${idx + 1} group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.05] p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:bg-white/[0.08]`}
              >
                {/* Decorative large quote mark */}
                <span
                  className="pointer-events-none absolute -right-1 -top-3 select-none font-black leading-none"
                  style={{ fontSize: "8rem", color: "color-mix(in srgb, var(--color-primary) 7%, transparent)" }}
                  aria-hidden="true"
                >
                  &ldquo;
                </span>
                {/* Amber stars */}
                <div className="mb-5 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="#FBBF24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="relative text-sm italic leading-7 text-slate-300">
                  &quot;{t.text}&quot;
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                  {/* Avatar with gradient initial */}
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
                    }}
                  >
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-white">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.city}, Tunisie</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. CTA ── */}
      <section
        data-reveal
        className="relative overflow-hidden bg-white px-4 py-24 sm:px-6"
      >
        {/* Background depth */}
        <div className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-primary/[0.05] blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-secondary/[0.04] blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <div
            className="relative overflow-hidden rounded-3xl px-8 py-12 text-center sm:px-16 sm:py-14"
            style={{
              background:
                "linear-gradient(135deg, var(--color-navy-deep) 0%, var(--color-navy) 45%, var(--color-navy-soft) 100%)",
            }}
          >
            {/* Decorative orbs */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
            <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/6 blur-[80px]" />

            {/* Top gradient line */}
            <div
              className="pointer-events-none absolute left-0 right-0 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, var(--color-primary) 35%, var(--color-secondary) 65%, transparent 100%)",
              }}
            />

            <div className="relative">
              {/* Chip */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  Départ dès aujourd&apos;hui
                </span>
              </div>

              {/* Headline */}
              <h2 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-[3.75rem]">
                Prêt pour votre
                <br />
                <span style={{ color: "var(--color-primary)" }}>prochaine aventure?</span>
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-300">
                Réservez votre véhicule en quelques clics et partez
                l&apos;esprit tranquille avec notre service premium 24/7.
              </p>

              {/* CTA buttons */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/voitures"
                  className="btn-primary px-10 py-4 text-sm"
                >
                  Réservez maintenant
                  <svg
                    className="ml-2"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <a
                  href={`tel:+${WHATSAPP_NUMBER}`}
                  className="btn-ghost-dark px-10 py-4 text-sm"
                >
                  <svg
                    className="mr-2"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.5 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.45 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.09a16 16 0 0 0 5.91 5.91l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Appeler
                </a>
              </div>

              {/* Trust pills */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                {[
                  "Disponible 24/7",
                  "Confirmation instantanée",
                  "Aucun frais caché",
                ].map((badge) => (
                  <span
                    key={badge}
                    className="flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-white/10"
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. CONTACT & PRIVACY ── */}
      <section
        id="contact"
        className="relative overflow-hidden scroll-mt-28 px-4 py-24 sm:px-6"
        style={{ background: "var(--color-surface)" }}
      >
        {/* Background depth */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, color-mix(in srgb, var(--color-navy) 5.5%, transparent) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-secondary/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary/[0.05] blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          {/* Contact card */}
          <div
            data-reveal="left"
            className="card-surface relative overflow-hidden p-8 sm:p-10"
          >
            {/* Decorative top gradient strip */}
            <div
              className="absolute left-0 top-0 h-1 w-full"
              style={{
                background: "linear-gradient(90deg, var(--color-primary), var(--color-secondary))",
              }}
            />
            <span className="section-label">Contact</span>
            <h3 className="mt-4 text-2xl font-semibold text-navy sm:text-3xl">
              Parlons de votre prochaine location
            </h3>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base sm:leading-relaxed">
              Notre équipe répond rapidement pour les demandes de réservation,
              les tarifs longue durée et l&apos;assistance avant départ.
            </p>

            {/* Response time badge */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700">
                Répond en moins de 30 min
              </span>
            </div>

            <div className="mt-8 space-y-4">
              {/* Phone row */}
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/10 text-primary ring-1 ring-primary/20">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.5 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.45 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.09a16 16 0 0 0 5.91 5.91l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Téléphone
                  </p>
                  <p className="text-sm font-bold text-navy">
                    {PHONE_DISPLAY}
                  </p>
                </div>
              </div>
              {/* Location row */}
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/10 text-primary ring-1 ring-primary/20">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Adresse</p>
                  <p className="text-sm font-bold text-navy">
                    Tunis, Tunisie
                  </p>
                </div>
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 flex cursor-pointer items-center justify-center gap-2.5 rounded-2xl border-2 border-[#25D366] bg-[#25D366]/8 px-5 py-3.5 text-sm font-bold text-[#25D366] transition-all duration-200 hover:bg-[#25D366] hover:text-white"
            >
              <WhatsAppIcon size={18} />
              Contacter via WhatsApp
            </a>
          </div>

          {/* Privacy card */}
          <div
            id="privacy"
            data-reveal="right"
            className="card-surface relative scroll-mt-28 overflow-hidden p-8 sm:p-10"
          >
            {/* Decorative top gradient strip */}
            <div
              className="absolute left-0 top-0 h-1 w-full"
              style={{
                background: "linear-gradient(90deg, var(--color-secondary), var(--color-primary))",
              }}
            />
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary/15 to-primary/10 text-secondary ring-1 ring-secondary/20">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="section-label">Confidentialité</span>
            <h3 className="mt-4 text-2xl font-semibold text-navy sm:text-3xl">
              Vos données restent protégées
            </h3>
            <div className="mt-6 space-y-4">
              {[
                "Données utilisées uniquement pour gérer vos réservations.",
                "Aucune information vendue ou partagée avec des tiers.",
                "Modification ou suppression possible à tout moment.",
                "Connexion sécurisée (HTTPS) sur toutes les pages.",
              ].map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/12">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--color-primary)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
