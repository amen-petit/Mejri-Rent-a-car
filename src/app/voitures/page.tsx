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
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-navy-500">
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
              className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "text-white shadow-soft"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-[#89a9f1]/50 hover:text-navy-500"
              }`}
              style={
                isActive
                  ? {
                      background:
                        "linear-gradient(135deg, #89a9f1 0%, #a66694 100%)",
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
  );

  const filterPanel = (
    <div className="card-surface p-5 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-base font-bold text-navy-500">Filtres</h2>
        <button
          onClick={resetFilters}
          className="cursor-pointer text-xs font-semibold text-[#a66694] hover:text-[#89a9f1] transition-colors"
        >
          Réinitialiser
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-navy-500">
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
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-navy-500">
            Prix max:{" "}
            <span className="font-bold text-[#89a9f1]">{maxPrice} DT</span>
          </label>
          <input
            type="range"
            min={50}
            max={maxCollectionPrice}
            step={10}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-[#89a9f1]"
          />
          <div className="mt-1.5 flex justify-between text-xs text-slate-400">
            <span>50 DT</span>
            <span>{maxCollectionPrice} DT</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50">
      <Navbar />

      {/* Header */}
      <section
        className="relative overflow-hidden pb-6 pt-8 sm:pb-8 sm:pt-10"
        style={{
          background:
            "linear-gradient(160deg, #252D41 0%, #1F2430 60%, #1A1E2A 100%)",
        }}
      >
        {/* Ambient orbs */}
        <div className="pointer-events-none absolute -right-[8%] -top-[20%] h-[360px] w-[360px] rounded-full bg-[#89a9f1]/[0.08] blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-[5%] -left-[5%] h-[280px] w-[280px] rounded-full bg-[#a66694]/[0.07] blur-[80px]" />

        {/* Background watermark — centered */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none"
          aria-hidden="true"
        >
          <span
            className="select-none whitespace-nowrap font-black leading-none tracking-tighter"
            style={{ fontSize: "18vw", color: "rgba(255,255,255,0.018)" }}
          >
            FLOTTE
          </span>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-12">
            {/* Left: title block */}
            <div className="min-w-0 flex-1">
              <span className="section-label" style={{ color: "#89a9f1" }}>
                Notre flotte
              </span>
              <h1
                className="mt-1.5 font-black leading-tight tracking-tight text-white"
                style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
              >
                Trouvez votre voiture
              </h1>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
                Véhicules récents, prix transparents, réservation instantanée.
              </p>
              <div
                className="mt-3 h-px w-12"
                style={{ background: "linear-gradient(90deg, #89a9f1, transparent)" }}
              />
            </div>

            {/* Right: stats as prose, separated by a vertical rule */}
            <div className="hidden shrink-0 sm:flex sm:items-stretch sm:gap-8">
              {/* Vertical separator */}
              <div
                className="w-px self-stretch"
                style={{ background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.12), transparent)" }}
              />

              <div className="flex flex-col justify-center gap-3.5">
                {/* Live indicator */}
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  <span className="text-[0.6rem] font-black uppercase tracking-[0.25em] text-emerald-400">
                    En direct
                  </span>
                </div>

                {loading ? (
                  <div className="space-y-2">
                    <div className="h-3 w-36 animate-pulse rounded bg-white/5" />
                    <div className="h-3 w-28 animate-pulse rounded bg-white/5" />
                  </div>
                ) : (
                  (() => {
                    const totalUnits = cars.reduce((s, c) => s + (c.quantity ?? 1), 0);
                    const availableUnits = cars
                      .filter((c) => c.is_available)
                      .reduce((s, c) => s + Math.max(0, (c.quantity ?? 1) - (rentedToday[c.id] ?? 0)), 0);
                    return (
                      <div className="space-y-2.5">
                        <p className="text-sm text-slate-400">
                          <span className="font-semibold text-white">{availableUnits}</span>{" "}
                          véhicules disponibles sur{" "}
                          <span className="text-slate-500">{totalUnits}</span>
                        </p>
                        <p className="text-sm text-slate-400">
                          Tarifs dès{" "}
                          <span className="font-semibold" style={{ color: "#89a9f1" }}>
                            {Math.min(...cars.map((c) => c.price_per_day))} DT
                          </span>
                          {" "}/ jour
                        </p>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </div>

          {/* Mobile stats — inline below title */}
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-400 sm:hidden">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              En direct
            </span>
            {!loading && cars.length > 0 && (() => {
              const availableUnits = cars
                .filter((c) => c.is_available)
                .reduce((s, c) => s + Math.max(0, (c.quantity ?? 1) - (rentedToday[c.id] ?? 0)), 0);
              return (
                <>
                  <span className="text-white/20">·</span>
                  <span>
                    <span className="font-semibold text-white">{availableUnits}</span>{" "}
                    disponibles
                  </span>
                  <span className="text-white/20">·</span>
                  <span>
                    dès{" "}
                    <span className="font-semibold" style={{ color: "#89a9f1" }}>
                      {Math.min(...cars.map((c) => c.price_per_day))} DT
                    </span>
                  </span>
                </>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="pb-16 pt-8">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 xl:grid-cols-[280px_1fr]">
          {/* Mobile filter toggle */}
          <div className="xl:hidden">
            <button
              onClick={() => setFiltersOpen((open) => !open)}
              className="card-surface mb-4 flex w-full cursor-pointer items-center justify-between p-4 transition-colors hover:border-[#89a9f1]"
            >
              <div className="flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#89a9f1"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="8" y1="12" x2="20" y2="12" />
                  <line x1="12" y1="18" x2="20" y2="18" />
                </svg>
                <span className="text-sm font-semibold text-navy-500">
                  Filtres
                </span>
              </div>
              <span className="text-xs font-semibold text-[#89a9f1]">
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
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, idx) => (
                  <div
                    key={idx}
                    className="overflow-hidden rounded-2xl border border-[#dce5f7] bg-white shadow-[0_2px_8px_rgba(31,36,48,0.06)]"
                  >
                    <div className="h-52 animate-pulse bg-slate-200" />
                    <div className="p-5">
                      <div className="mb-3 space-y-1.5">
                        <div className="h-2 w-12 animate-pulse rounded-full bg-slate-200" />
                        <div className="h-5 w-36 animate-pulse rounded bg-slate-200" />
                      </div>
                      <div className="flex gap-1.5">
                        <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
                        <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
                        <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                        <div className="space-y-1">
                          <div className="h-2 w-14 animate-pulse rounded bg-slate-200" />
                          <div className="h-7 w-20 animate-pulse rounded bg-slate-200" />
                        </div>
                        <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-200" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCars.length === 0 ? (
              <div className="card-surface p-14 text-center">
                <svg
                  className="mx-auto mb-4 h-12 w-12 text-slate-300"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803m10.607 0A7.5 7.5 0 0 1 5.196 15.803"
                  />
                </svg>
                <h2 className="text-xl font-bold text-navy-500">
                  Aucun véhicule trouvé
                </h2>
                <p className="mt-2 text-slate-500">
                  Essayez d&apos;ajuster vos filtres.
                </p>
                <button
                  onClick={resetFilters}
                  className="btn-primary mt-6 px-6 py-2.5 text-sm"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <>
                <p className="mb-6 text-sm font-medium text-slate-500">
                  <span className="font-bold text-[#1F2430]">
                    {filteredCars.length}
                  </span>{" "}
                  véhicule{filteredCars.length > 1 ? "s" : ""} disponible
                  {filteredCars.length > 1 ? "s" : ""}
                </p>

                {/* ── Hero card — first result, landscape layout ── */}
                <article className="group mb-5 cursor-pointer overflow-hidden rounded-2xl border border-[#dce5f7] bg-white shadow-[0_4px_20px_rgba(31,36,48,0.08)] transition-all duration-500 hover:shadow-[0_24px_64px_rgba(31,36,48,0.16)]">
                  <Link
                    href={`/voitures/${filteredCars[0].id}`}
                    className="flex flex-col sm:flex-row sm:h-[300px]"
                  >
                    {/* Image — 55% left on desktop */}
                    <div className="relative h-60 shrink-0 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 sm:h-full sm:w-[55%]">
                      {filteredCars[0].images?.[0] ? (
                        <Image
                          src={filteredCars[0].images[0]}
                          alt={`${filteredCars[0].brand} ${filteredCars[0].name}`}
                          fill
                          priority
                          sizes="(max-width: 640px) 100vw, 55vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <svg className="h-20 w-20 text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                          </svg>
                        </div>
                      )}
                      {/* Desktop: fade image edge into white content area */}
                      <div
                        className="absolute inset-y-0 right-0 hidden w-20 sm:block"
                        style={{ background: "linear-gradient(to right, transparent, white)" }}
                      />
                      {/* Mobile: darken bottom for readability */}
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/40 to-transparent sm:hidden" />
                      {filteredCars[0].is_featured && (
                        <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-[#89a9f1] to-[#a66694] px-2.5 py-1 text-xs font-bold text-[#1F2430] shadow-lg">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          Vedette
                        </div>
                      )}
                    </div>

                    {/* Content — right 45% */}
                    <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#89a9f1]">
                              {filteredCars[0].brand}
                            </p>
                            <h2 className="mt-1 text-2xl font-black leading-tight text-[#1F2430] sm:text-[1.75rem]">
                              {filteredCars[0].name}
                            </h2>
                          </div>
                          <span
                            className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-[#1F2430]"
                            style={{ background: "rgba(31,36,48,0.07)" }}
                          >
                            {filteredCars[0].category}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {filteredCars[0].transmission}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {filteredCars[0].fuel_type}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {filteredCars[0].seats} places
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-5">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            À partir de
                          </p>
                          <div className="mt-0.5 flex items-baseline gap-1.5">
                            <span className="text-[2.5rem] font-black leading-none text-[#1F2430]">
                              {filteredCars[0].price_per_day}
                            </span>
                            <span className="text-sm text-slate-400">DT/jour</span>
                          </div>
                        </div>
                        <span className="btn-primary px-6 py-3 text-sm">
                          Réserver
                          <svg className="ml-1.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>

                {/* ── Regular grid — remaining cars ── */}
                {filteredCars.length > 1 && (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredCars.slice(1).map((car) => (
                      <article
                        key={car.id}
                        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[#dce5f7] bg-white shadow-[0_2px_8px_rgba(31,36,48,0.06)] transition-all duration-300 hover:-translate-y-2 hover:border-[#89a9f1]/50 hover:shadow-[0_16px_40px_rgba(31,36,48,0.14)]"
                      >
                        <div className="absolute left-0 right-0 top-0 z-10 h-0.5 bg-gradient-to-r from-[#89a9f1] to-[#a66694] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <Link href={`/voitures/${car.id}`} className="block">
                          <div className="relative h-52 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                            {car.images?.[0] ? (
                              <Image
                                src={car.images[0]}
                                alt={`${car.brand} ${car.name}`}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <svg className="h-14 w-14 text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                                </svg>
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
                            <div className="absolute inset-0 flex items-center justify-center bg-[#1F2430]/50 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
                              <span className="flex translate-y-2 items-center gap-2 rounded-full border border-white/30 bg-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-transform duration-300 group-hover:translate-y-0">
                                Voir les détails
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                              </span>
                            </div>
                            {car.is_featured && (
                              <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-[#89a9f1] to-[#a66694] px-2.5 py-1 text-xs font-bold text-[#1F2430] shadow-lg shadow-[#89a9f1]/20">
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                Vedette
                              </div>
                            )}
                            <div className="absolute bottom-3 right-3 z-10 rounded-full bg-[#1F2430]/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                              {car.category}
                            </div>
                          </div>
                          <div className="p-5">
                            <div className="mb-3">
                              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-[#89a9f1]">
                                {car.brand}
                              </p>
                              <h2 className="text-lg font-bold leading-tight text-[#1F2430]">
                                {car.name}
                              </h2>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="3" />
                                  <path d="M12 2v2M12 20v2M4.22 7l1.74 1M18.04 16l1.74 1M4.22 17l1.74-1M18.04 8l1.74-1" />
                                </svg>
                                {car.transmission}
                              </span>
                              <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5-2 1.6-3 3.5-3 5.5a7 7 0 0 0 7 7z" />
                                </svg>
                                {car.fuel_type}
                              </span>
                              <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                                  <span className="text-2xl font-black text-[#1F2430]">
                                    {car.price_per_day}
                                  </span>
                                  <span className="text-xs text-slate-400">DT/jour</span>
                                </div>
                              </div>
                              <span className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#89a9f1] to-[#a66694] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-shadow duration-300 group-hover:shadow-[0_6px_20px_rgba(137,169,241,0.45)]">
                                Réserver
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                              </span>
                            </div>
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
