import Navbar from "@/components/Navbar";
import Link from "next/link";
import Image from "next/image";
import { getCars } from "@/lib/cars";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Accueil",
  description:
    "Royal Car: location de voitures en Tunisie avec réservation en ligne simple, flotte moderne et assistance 24/7.",
  alternates: {
    canonical: "/",
  },
};

const stats = [
  {
    icon: "/icons/voiture-musclee.svg",
    num: "50+",
    label: "Véhicules disponibles",
  },
  { icon: "/icons/telephone.svg", num: "24/7", label: "Support continu" },
  { icon: "/icons/star.svg", num: "4.9", label: "Note moyenne" },
  { icon: "/icons/adresse.svg", num: "8", label: "Villes desservies" },
];

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

export default async function Home() {
  const cars = await getCars().catch(() => []);
  const availableCars = cars.filter((car) => car.is_available);
  const featuredCars = availableCars.filter((car) => car.is_featured);
  const otherAvailableCars = availableCars.filter((car) => !car.is_featured);
  const displayedCars = [...featuredCars, ...otherAvailableCars].slice(0, 3);

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "CarRental",
    name: "Royal Car",
    url: siteUrl,
    image: `${siteUrl}/Untitled%20design.png`,
    telephone: "+216 90 241 281",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Tunis",
      addressCountry: "TN",
    },
    areaServed: "Tunisie",
    priceRange: "$$",
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />
      <Navbar />

      <section
        data-reveal
        className="relative overflow-hidden px-4 py-20 text-white sm:px-6 sm:py-24 lg:py-28"
        style={{
          background: "linear-gradient(180deg, #18559d 0%, #dfc830 100%)",
        }}
      >
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#dfc830]/20 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div data-reveal="left" className="relative z-10 reveal-d1">
            <span className="section-label text-[#dfc830]">
              Location de voitures en Tunisie
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              La route vous attend,{" "}
              <span className="text-[#dfc830]">Royal Car</span> s&apos;occupe du
              reste.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-100 sm:mt-8 sm:text-lg sm:leading-8">
              Réservez rapidement une voiture moderne, récupérez-la facilement
              et partez en toute sérénité.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:mt-12 sm:flex-row">
              <Link href="/voitures" className="btn-primary w-full sm:w-auto">
                Réservez maintenant
              </Link>
              <Link
                href="#how"
                className="inline-flex w-full items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10 px-7 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-250 hover:border-white/50 hover:bg-white/20 sm:w-auto"
              >
                Comment ça marche
              </Link>
            </div>
          </div>

          <div
            data-reveal="right"
            className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 shadow-soft-lg backdrop-blur-xl reveal-d2 sm:p-8 lg:p-10"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[#dfc830]/20 blur-3xl" />
            <div className="relative space-y-6">
              <div className="space-y-4 rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm sm:p-6">
                <p className="text-xs uppercase tracking-widest text-[#dfc830] font-semibold">
                  Service premium
                </p>
                <h2 className="text-xl font-bold sm:text-2xl">
                  Véhicules fiables, service personnalisé
                </h2>
                <p className="text-sm text-slate-100 leading-7">
                  Notre flotte est entretenue avec soin et disponible dans
                  plusieurs villes de Tunisie.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Assistance 24/7", "Support dédié"],
                  ["Prise en main rapide", "Disponibilité garantie"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/30 bg-white/15 px-5 py-4 backdrop-blur-sm sm:px-6"
                  >
                    <p className="text-xs uppercase tracking-widest text-[#dfc830] font-semibold">
                      {label}
                    </p>
                    <p className="mt-3 text-base font-bold text-white sm:text-lg">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="about"
        data-reveal
        className="scroll-mt-28 px-4 py-20 sm:px-6 sm:py-24"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div
              data-reveal
              key={item.label}
              className="card-surface flex items-center gap-4 p-6 sm:p-7"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dfc830]/10 shrink-0">
                <Image
                  src={item.icon}
                  alt={item.label}
                  width={32}
                  height={32}
                  className="h-8 w-8 text-navy-500"
                  style={{ color: "#000000" }}
                />
              </div>
              <div>
                <div className="text-3xl font-bold text-navy-500">
                  {item.num}
                </div>
                <p className="mt-1 text-sm text-slate-600">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section data-reveal className="bg-slate-50 px-4 py-20 sm:px-6 sm:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex flex-col gap-4 md:mb-14 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="section-label">Sélection du moment</span>
              <h2 className="mt-3 text-3xl font-bold text-navy-500 sm:text-4xl">
                Flotte disponible
              </h2>
            </div>
            <Link href="/voitures" className="btn-secondary">
              Voir tout
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {displayedCars.length === 0 ? (
              <div className="md:col-span-3 card-surface p-10 text-center text-slate-600">
                Aucun véhicule disponible pour le moment.
              </div>
            ) : (
              displayedCars.map((car) => (
                <div
                  data-reveal
                  key={car.id}
                  className="card-surface overflow-hidden group"
                >
                  <div className="relative h-48 bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center border-b border-slate-200 group-hover:from-slate-200 group-hover:to-slate-300 transition-all duration-300">
                    {car.images?.[0] ? (
                      <Image
                        src={car.images[0]}
                        alt={`${car.brand} ${car.name}`}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-7xl text-slate-300">🚗</span>
                    )}
                  </div>
                  <div className="p-7">
                    <div className="text-xs uppercase tracking-widest text-[#dfc830] font-bold mb-2">
                      {car.category}
                    </div>
                    <h3 className="text-xl font-bold text-navy-500 mb-4">
                      {car.brand} {car.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-6 text-xs text-slate-600">
                      {[
                        car.transmission,
                        car.fuel_type,
                        `${car.seats} places`,
                      ].map((spec) => (
                        <span
                          key={spec}
                          className="rounded-full bg-[#dfc830]/10 px-3 py-1.5 font-medium"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-5 border-t border-slate-200">
                      <div className="text-lg font-bold text-navy-500">
                        {car.price_per_day} DT/j
                      </div>
                      <Link
                        href={`/voitures/${car.id}`}
                        className="btn-outline text-xs px-4 py-2"
                      >
                        Réserver
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section
        id="how"
        data-reveal
        className="relative scroll-mt-28 px-4 py-20 sm:px-6 sm:py-24"
      >
        <div className="absolute -left-20 top-12 h-48 w-48 rounded-full bg-[#dfc830]/10 blur-3xl" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">Simple et rapide</span>
            <h2 className="mt-3 text-3xl font-bold text-navy-500 sm:text-4xl">
              Comment ça marche
            </h2>
          </div>
          <div className="relative">
            <div className="absolute top-1/3 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-blue-300 to-transparent hidden lg:block" />
            <div className="grid gap-6 md:grid-cols-4 relative">
              {steps.map((step) => (
                <div
                  data-reveal
                  key={step.num}
                  className="card-surface p-7 text-center relative"
                >
                  <div
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-soft"
                    style={{
                      background:
                        "linear-gradient(135deg, #18559d 0%, #dfc830 100%)",
                    }}
                  >
                    {step.num}
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-navy-500">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        data-reveal
        className="overflow-hidden px-4 py-20 text-white sm:px-6 sm:py-24"
        style={{
          background: "linear-gradient(180deg, #18559d 0%, #dfc830 100%)",
        }}
      >
        <div className="absolute right-0 top-8 h-48 w-48 rounded-full bg-[#dfc830]/15 blur-3xl" />
        <div
          className="relative mx-auto max-w-6xl rounded-3xl border border-[#dfc830]/30 p-6 shadow-soft-lg sm:p-10 lg:p-16"
          style={{
            background: "linear-gradient(135deg, #18559d 0%, #dfc830 100%)",
          }}
        >
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-block text-xs uppercase tracking-widest font-bold text-[#dfc830] mb-4">
                Départ dès aujourd&apos;hui
              </span>
              <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
                Réservez votre véhicule premium en quelques clics.
              </h2>
              <p className="mt-5 text-base leading-7 text-white sm:mt-6 sm:text-lg sm:leading-8">
                Notre équipe vous accompagne à chaque étape pour une location
                simple et sécurisée.
              </p>
            </div>
            <Link
              href="/voitures"
              className="btn-primary w-full shrink-0 sm:w-auto"
            >
              Réservez maintenant
            </Link>
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="scroll-mt-28 bg-slate-50 px-4 py-20 sm:px-6 sm:py-24"
      >
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div className="card-surface p-6 sm:p-10">
            <p className="section-label">Contact</p>
            <h3 className="mt-4 text-2xl font-bold text-navy-500 sm:text-3xl">
              Parlons de votre prochaine location
            </h3>
            <p className="mt-6 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
              Notre équipe répond rapidement pour les demandes de réservation,
              les tarifs longue durée et l&apos;assistance avant départ.
            </p>
            <div className="mt-8 space-y-3 text-sm font-medium text-navy-500 sm:text-base">
              <p>Téléphone: +216 90 241 281</p>
              <p>Adresse: Tunis, Tunisie</p>
            </div>
          </div>

          <div id="privacy" className="card-surface scroll-mt-28 p-6 sm:p-10">
            <p className="section-label">Confidentialité</p>
            <h3 className="mt-4 text-2xl font-bold text-navy-500 sm:text-3xl">
              Vos données restent protégées
            </h3>
            <p className="mt-6 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
              Nous utilisons vos informations uniquement pour gérer vos
              réservations et améliorer votre expérience. Aucune donnée
              n&apos;est vendue à des tiers.
            </p>
            <p className="mt-6 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
              Vous pouvez demander la modification ou la suppression de vos
              informations à tout moment via notre service client.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
