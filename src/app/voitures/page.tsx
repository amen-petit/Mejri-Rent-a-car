"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import Navbar from "@/components/Navbar";
import { getCars } from "@/lib/cars";
import { Car } from "@/lib/types";

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

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
        const data = await getCars();
        setCars(data);
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
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#231F20]">
        {label}
      </label>
      <div className="rounded-2xl border border-[#231F20]/20 bg-white/80 p-2">
        <div className="flex flex-wrap gap-2">
          {options.map((item) => {
            const isActive = selected === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onSelect(item)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "text-white shadow-soft"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-[#2B2E4A] hover:text-[#231F20]"
                }`}
                style={
                  isActive
                    ? {
                        background:
                          "linear-gradient(135deg, #231F20 0%, #2B2E4A 100%)",
                      }
                    : undefined
                }
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const filterPanel = (
    <div className="card-surface border border-[#231F20]/15 bg-[linear-gradient(180deg,rgba(35,31,32,0.06)_0%,rgba(212,175,55,0.08)_100%)] p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-[#231F20]">Filtres</h2>

      <div className="mt-6 space-y-6">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#231F20]">
            Recherche
          </label>
          <input
            type="text"
            placeholder="Marque ou modele"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-premium"
          />
        </div>

        {renderOptionGroup("Categorie", categories, category, setCategory)}

        {renderOptionGroup(
          "Transmission",
          transmissions,
          transmission,
          setTransmission,
        )}

        {renderOptionGroup("Carburant", fuels, fuel, setFuel)}

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#231F20]">
            Prix max: {maxPrice} DT
          </label>
          <input
            type="range"
            min={50}
            max={maxCollectionPrice}
            step={10}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-[#2B2E4A]"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>50</span>
            <span>{maxCollectionPrice}</span>
          </div>
        </div>

        <button
          onClick={resetFilters}
          className="w-full rounded-xl border border-[#231F20]/25 bg-white px-4 py-2.5 text-sm font-semibold text-[#231F20] transition-colors hover:bg-[#231F20]/10"
        >
          Reinitialiser
        </button>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <Navbar />

      <section className="pb-8 pt-24 sm:pb-10 sm:pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="section-label">Notre flotte</span>
          <h1 className="mt-3 text-3xl font-bold text-navy-500 sm:text-4xl">
            Trouvez votre vehicule ideal
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Filtrez par categorie, carburant et prix pour trouver rapidement la
            voiture qui vous convient.
          </p>
        </div>
      </section>

      <section className="pb-12">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 xl:grid-cols-[280px_1fr]">
          <div className="xl:hidden">
            <div className="card-surface mb-4 flex items-center justify-between border border-[#231F20]/15 bg-[linear-gradient(180deg,rgba(35,31,32,0.05)_0%,rgba(212,175,55,0.08)_100%)] p-4">
              <p className="text-sm font-medium text-[#231F20]">Filtres</p>
              <button
                onClick={() => setFiltersOpen((open) => !open)}
                className="rounded-lg border border-[#231F20]/25 bg-white px-4 py-2 text-xs font-semibold text-[#231F20] transition-colors hover:bg-[#231F20]/10"
              >
                {filtersOpen ? "Masquer" : "Afficher"}
              </button>
            </div>
            {filtersOpen ? <div className="mb-4">{filterPanel}</div> : null}
          </div>

          <aside className="hidden xl:block">
            <div className="sticky top-28">{filterPanel}</div>
          </aside>

          <div>
            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="card-surface overflow-hidden">
                    <div className="h-44 animate-pulse bg-slate-200" />
                    <div className="space-y-3 p-5">
                      <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                      <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                      <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCars.length === 0 ? (
              <div className="card-surface p-10 text-center">
                <h2 className="text-xl font-semibold text-navy-500">
                  Aucun vehicule trouve
                </h2>
                <p className="mt-2 text-slate-600">
                  Essayez d ajuster vos filtres.
                </p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-slate-600">
                  {filteredCars.length} vehicule
                  {filteredCars.length > 1 ? "s" : ""}
                </p>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredCars.map((car) => {
                    return (
                      <article
                        key={car.id}
                        className="card-surface overflow-hidden"
                      >
                        <div className="relative h-44 bg-slate-200">
                          {car.images?.[0] ? (
                            <Image
                              src={car.images[0]}
                              alt={`${car.brand} ${car.name}`}
                              fill
                              unoptimized
                              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                              className="object-cover"
                            />
                          ) : null}
                        </div>

                        <div className="p-5">
                          <p className="text-xs uppercase tracking-wide text-[#231F20]">
                            {car.category}
                          </p>
                          <h2 className="mt-1 text-lg font-semibold text-navy-500">
                            {car.brand} {car.name}
                          </h2>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">
                              {car.transmission}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">
                              {car.fuel_type}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">
                              {car.seats} places
                            </span>
                          </div>

                          <div className="mt-5 flex items-center justify-between">
                            <p className="text-base font-bold text-navy-500">
                              {car.price_per_day} DT
                              <span className="ml-1 text-xs font-normal text-slate-600">
                                / jour
                              </span>
                            </p>
                            <Link
                              href={`/voitures/${car.id}`}
                              className="btn-outline px-4 py-2 text-sm"
                            >
                              Details
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
