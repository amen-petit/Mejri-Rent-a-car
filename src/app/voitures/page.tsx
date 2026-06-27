"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import Navbar from "@/components/Navbar";
import { getCars } from "@/lib/cars";
import { Car } from "@/lib/types";

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

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // car_id -> number of units rented today
  const [rentedToday, setRentedToday] = useState<Record<string, number>>({});

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tous");
  const [transmission, setTransmission] = useState("Tous");
  const [fuel, setFuel] = useState("Tous");
  const [maxPrice, setMaxPrice] = useState(500);

  const maxCollectionPrice = useMemo(() => {
    if (!cars.length) return 500;
    return Math.max(...cars.map((car) => car.price_per_day));
  }, [cars]);

  const categories = useMemo(
    () => ["Tous", ...new Set(cars.map((car) => car.category).filter(Boolean))],
    [cars],
  );
  const transmissions = useMemo(
    () => [
      "Tous",
      ...new Set(cars.map((car) => car.transmission).filter(Boolean)),
    ],
    [cars],
  );
  const fuels = useMemo(
    () => [
      "Tous",
      ...new Set(cars.map((car) => car.fuel_type).filter(Boolean)),
    ],
    [cars],
  );

  useEffect(() => {
    const loadCars = async () => {
      try {
        const [carsData, availability] = await Promise.all([
          getCars(),
          fetch("/api/availability/today")
            .then((r) => r.json())
            .catch(() => ({ counts: {} as Record<string, number> })),
        ]);

        setCars(carsData);
        setRentedToday(availability.counts ?? {});
      } finally {
        setLoading(false);
      }
    };
    loadCars();
  }, []);

  useEffect(() => {
    setMaxPrice(maxCollectionPrice);
  }, [maxCollectionPrice]);

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const searchValue = search.trim().toLowerCase();
      const matchesSearch =
        searchValue.length === 0 ||
        car.name.toLowerCase().includes(searchValue) ||
        car.brand.toLowerCase().includes(searchValue);
      const matchesCategory =
        category === "Tous" ||
        car.category.toLowerCase() === category.toLowerCase();
      const matchesTransmission =
        transmission === "Tous" || car.transmission === transmission;
      const matchesFuel = fuel === "Tous" || car.fuel_type === fuel;
      const matchesPrice = car.price_per_day <= maxPrice;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesTransmission &&
        matchesFuel &&
        matchesPrice
      );
    });
  }, [cars, category, fuel, maxPrice, search, transmission]);

  const resetFilters = () => {
    setSearch("");
    setCategory("Tous");
    setTransmission("Tous");
    setFuel("Tous");
    setMaxPrice(maxCollectionPrice);
  };

  const renderOptionGroup = (
    label: string,
    options: string[],
    selected: string,
    onSelect: (value: string) => void,
  ) => (
    <div>
      <label className="mb-2.5 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((item) => {
          const isActive = selected === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-colors duration-200 active:scale-[0.97] ${
                isActive
                  ? "bg-ink text-paper"
                  : "border border-line text-stone hover:border-ink hover:text-ink"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );

  const filterPanel = (
    <div className="card-surface p-6">
      <div className="mb-6 flex items-center justify-between border-b border-mist pb-4">
        <h2 className="font-display text-lg font-medium text-ink">Filtres</h2>
        <button
          onClick={resetFilters}
          className="text-xs font-medium text-stone underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          Réinitialiser
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-2.5 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">
            Recherche
          </label>
          <input
            type="text"
            placeholder="Marque ou modèle"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-premium"
          />
        </div>

        {renderOptionGroup("Catégorie", categories, category, setCategory)}
        {renderOptionGroup(
          "Transmission",
          transmissions,
          transmission,
          setTransmission,
        )}
        {renderOptionGroup("Carburant", fuels, fuel, setFuel)}

        <div>
          <label className="mb-2.5 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">
            Prix max — <span className="font-display text-sm text-ink">{maxPrice} DT</span>
          </label>
          <input
            type="range"
            min={50}
            max={maxCollectionPrice}
            step={10}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-ink"
          />
          <div className="mt-1.5 flex justify-between text-xs text-ash">
            <span>50 DT</span>
            <span>{maxCollectionPrice} DT</span>
          </div>
        </div>
      </div>
    </div>
  );

  const totalUnits = cars.reduce((s, c) => s + (c.quantity ?? 1), 0);
  const availableUnits = cars
    .filter((c) => c.is_available)
    .reduce(
      (s, c) => s + Math.max(0, (c.quantity ?? 1) - (rentedToday[c.id] ?? 0)),
      0,
    );
  const minPrice = cars.length ? Math.min(...cars.map((c) => c.price_per_day)) : 0;

  return (
    <main className="min-h-screen overflow-x-hidden bg-paper">
      <Navbar />

      {/* Header */}
      <section className="border-b border-mist">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="eyebrow">Notre flotte</span>
              <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,3.5rem)] font-medium tracking-tight text-ink">
                Trouvez votre voiture
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-stone">
                Véhicules récents, prix transparents, réservation instantanée.
              </p>
            </div>

            {/* Live availability — hairline-separated stats */}
            <div className="flex items-stretch gap-8 border-t border-mist pt-6 lg:border-t-0 lg:pt-0">
              <div className="flex flex-col justify-end">
                <span className="inline-flex items-center gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-stone">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  En direct
                </span>
              </div>
              {loading ? (
                <div className="space-y-2 self-center">
                  <div className="h-3 w-32 animate-pulse rounded bg-mist" />
                  <div className="h-3 w-24 animate-pulse rounded bg-mist" />
                </div>
              ) : (
                <>
                  <div className="border-l border-mist pl-8">
                    <p className="font-display text-2xl text-ink">{availableUnits}</p>
                    <p className="mt-1 text-[0.62rem] uppercase tracking-[0.16em] text-stone">
                      Disponibles / {totalUnits}
                    </p>
                  </div>
                  <div className="border-l border-mist pl-8">
                    <p className="font-display text-2xl text-ink">{minPrice} DT</p>
                    <p className="mt-1 text-[0.62rem] uppercase tracking-[0.16em] text-stone">
                      Dès / jour
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="pb-20 pt-10">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 xl:grid-cols-[280px_1fr]">
          {/* Mobile filter toggle */}
          <div className="xl:hidden">
            <button
              onClick={() => setFiltersOpen((open) => !open)}
              className="mb-4 flex w-full items-center justify-between rounded-[var(--radius)] border border-line px-4 py-3.5 text-sm transition-colors hover:border-ink"
            >
              <span className="flex items-center gap-2 font-medium text-ink">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="8" y1="12" x2="20" y2="12" />
                  <line x1="12" y1="18" x2="20" y2="18" />
                </svg>
                Filtres
              </span>
              <span className="text-xs text-stone">
                {filtersOpen ? "Masquer ↑" : "Afficher ↓"}
              </span>
            </button>
            {filtersOpen && <div className="mb-4">{filterPanel}</div>}
          </div>

          {/* Desktop sidebar */}
          <aside className="hidden xl:block">
            <div className="sticky top-28">{filterPanel}</div>
          </aside>

          {/* Car grid */}
          <div>
            {loading ? (
              <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx}>
                    <div className="aspect-[4/3] animate-pulse rounded-[var(--radius-lg)] bg-mist" />
                    <div className="mt-5 space-y-2">
                      <div className="h-2.5 w-16 animate-pulse rounded bg-mist" />
                      <div className="h-5 w-32 animate-pulse rounded bg-mist" />
                      <div className="h-3 w-40 animate-pulse rounded bg-mist" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCars.length === 0 ? (
              <div className="border border-mist bg-cloud p-16 text-center">
                <CarSilhouette className="mx-auto mb-5 h-12 w-12 text-ash" />
                <h2 className="font-display text-2xl font-medium text-ink">
                  Aucun véhicule trouvé
                </h2>
                <p className="mt-2 text-sm text-stone">
                  Essayez d&apos;ajuster vos filtres.
                </p>
                <button onClick={resetFilters} className="btn-primary mt-7">
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <>
                <p className="mb-8 text-sm text-stone">
                  <span className="font-display text-base text-ink">
                    {filteredCars.length}
                  </span>{" "}
                  véhicule{filteredCars.length > 1 ? "s" : ""} disponible
                  {filteredCars.length > 1 ? "s" : ""}
                </p>

                <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredCars.map((car) => (
                    <Link
                      href={`/voitures/${car.id}`}
                      key={car.id}
                      className="group block"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border border-mist bg-cloud transition-colors duration-300 group-hover:border-ink">
                        {car.images?.[0] ? (
                          <Image
                            src={car.images[0]}
                            alt={`${car.brand} ${car.name}`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <CarSilhouette className="h-14 w-14 text-ash" />
                          </div>
                        )}
                        <span className="absolute right-3 top-3 rounded-full border border-ink/10 bg-paper/85 px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] text-stone backdrop-blur-sm">
                          {car.category}
                        </span>
                        {car.is_featured && (
                          <span className="absolute left-3 top-3 rounded-full bg-ink px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-paper">
                            Vedette
                          </span>
                        )}
                      </div>

                      <div className="mt-5">
                        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-stone">
                          {car.brand}
                        </p>
                        <h2 className="mt-1.5 font-display text-xl font-medium text-ink">
                          {car.name}
                        </h2>
                        <p className="mt-2 text-xs text-ash">
                          {car.transmission} · {car.fuel_type} · {car.seats} places
                        </p>

                        <div className="mt-5 flex items-end justify-between border-t border-mist pt-4">
                          <p className="font-display text-2xl text-ink">
                            {car.price_per_day}
                            <span className="ml-1 text-sm text-ash">DT/jour</span>
                          </p>
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors duration-200 group-hover:text-accent">
                            Réserver
                            <Arrow className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
