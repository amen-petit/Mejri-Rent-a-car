"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import Navbar from "@/components/Navbar";
import Arrow from "@/components/icons/Arrow";
import CarSilhouette from "@/components/icons/CarSilhouette";
import BookingSearchCard from "@/components/BookingSearchCard";
import { getCars } from "@/lib/cars";
import { Car } from "@/lib/types";
import { useI18n } from "@/i18n/client";
import { interpolate, plural, pluralSuffix } from "@/i18n/format";
import {
  buildBookingSearchParams,
  parseBookingSearch,
} from "@/lib/booking-search";

// Internal sentinel for the "all" filter option. Kept language-independent so
// filter logic never depends on the displayed (translated) label.
const ALL = "__all__";

function CarsPageContent() {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();

  // When the hero booking card routes here, the URL carries a validated
  // date+location search. Its presence switches the page into "search mode":
  // results come from the availability endpoint and links carry the search
  // forward into the car detail page.
  const bookingSearch = useMemo(
    () => parseBookingSearch((key) => searchParams.get(key)),
    [searchParams],
  );
  const linkSuffix = bookingSearch
    ? `?${buildBookingSearchParams(bookingSearch)}`
    : "";

  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // car_id -> number of units rented today
  const [rentedToday, setRentedToday] = useState<Record<string, number>>({});

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);
  const [transmission, setTransmission] = useState(ALL);
  const [fuel, setFuel] = useState(ALL);
  const [maxPrice, setMaxPrice] = useState(500);

  const maxCollectionPrice = useMemo(() => {
    if (!cars.length) return 500;
    return Math.max(...cars.map((car) => car.price_per_day));
  }, [cars]);

  const categories = useMemo(
    () => [ALL, ...new Set(cars.map((car) => car.category).filter(Boolean))],
    [cars],
  );
  const transmissions = useMemo(
    () => [
      ALL,
      ...new Set(cars.map((car) => car.transmission).filter(Boolean)),
    ],
    [cars],
  );
  const fuels = useMemo(
    () => [ALL, ...new Set(cars.map((car) => car.fuel_type).filter(Boolean))],
    [cars],
  );

  const loadCars = useCallback(async () => {
    setLoadFailed(false);
    setLoading(true);
    try {
      if (bookingSearch) {
        // Search mode: the server returns only cars bookable for the window,
        // using the same (pending+confirmed) semantics as the booking guard.
        const res = await fetch(
          `/api/cars/search?start=${bookingSearch.start}&end=${bookingSearch.end}`,
        );
        if (!res.ok) throw new Error("search_failed");
        const data = (await res.json()) as { cars?: Car[] };
        setCars(data.cars ?? []);
        setRentedToday({});
      } else {
        const [carsData, availability] = await Promise.all([
          getCars(),
          fetch("/api/availability/today")
            .then((r) => r.json())
            .catch(() => ({ counts: {} as Record<string, number> })),
        ]);
        setCars(carsData);
        setRentedToday(availability.counts ?? {});
      }
    } catch {
      // Distinguish a real failure from a genuinely empty catalog so we can show
      // a "try again" message instead of the misleading "no results" state.
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [bookingSearch]);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

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
        category === ALL ||
        car.category.toLowerCase() === category.toLowerCase();
      const matchesTransmission =
        transmission === ALL || car.transmission === transmission;
      const matchesFuel = fuel === ALL || car.fuel_type === fuel;
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
    setCategory(ALL);
    setTransmission(ALL);
    setFuel(ALL);
    setMaxPrice(maxCollectionPrice);
  };

  const renderOptionGroup = (
    label: string,
    options: string[],
    selected: string,
    onSelect: (value: string) => void,
    translateValue: (value: string) => string,
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
              {item === ALL ? t.cars.all : translateValue(item)}
            </button>
          );
        })}
      </div>
    </div>
  );

  const filterPanel = (
    <div className="card-surface p-6">
      <div className="mb-6 flex items-center justify-between border-b border-mist pb-4">
        <h2 className="font-display text-lg font-medium text-ink">
          {t.cars.filters}
        </h2>
        <button
          onClick={resetFilters}
          className="text-xs font-medium text-stone underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          {t.cars.reset}
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-2.5 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">
            {t.cars.search}
          </label>
          <input
            type="text"
            placeholder={t.cars.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-premium"
          />
        </div>

        {renderOptionGroup(
          t.cars.category,
          categories,
          category,
          setCategory,
          (v) => t.enums.category[v] ?? v,
        )}
        {renderOptionGroup(
          t.cars.transmission,
          transmissions,
          transmission,
          setTransmission,
          (v) => t.enums.transmission[v] ?? v,
        )}
        {renderOptionGroup(
          t.cars.fuel,
          fuels,
          fuel,
          setFuel,
          (v) => t.enums.fuel[v] ?? v,
        )}

        <div>
          <label className="mb-2.5 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">
            {t.cars.maxPrice} —{" "}
            <span className="font-display text-sm text-ink">
              {maxPrice} {t.common.currency}
            </span>
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
            <span>50 {t.common.currency}</span>
            <span>
              {maxCollectionPrice} {t.common.currency}
            </span>
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
              <span className="eyebrow">{t.cars.eyebrow}</span>
              <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,3.5rem)] font-medium tracking-tight text-ink">
                {t.cars.title}
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-stone">
                {t.cars.subtitle}
              </p>
            </div>

            {/* Live availability — hidden in search mode, where window-specific
                results replace today's fleet snapshot. */}
            {!bookingSearch && (
            <div className="flex items-stretch gap-8 border-t border-mist pt-6 lg:border-t-0 lg:pt-0">
              <div className="flex flex-col justify-end">
                <span className="inline-flex items-center gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-stone">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {t.cars.live}
                </span>
              </div>
              {loading ? (
                <div className="space-y-2 self-center">
                  <div className="h-3 w-32 animate-pulse rounded bg-mist" />
                  <div className="h-3 w-24 animate-pulse rounded bg-mist" />
                </div>
              ) : (
                <>
                  <div className="border-s border-mist ps-8">
                    <p className="font-display text-2xl text-ink">{availableUnits}</p>
                    <p className="mt-1 text-[0.62rem] uppercase tracking-[0.16em] text-stone">
                      {interpolate(t.cars.availableOf, { total: totalUnits })}
                    </p>
                  </div>
                  <div className="border-s border-mist ps-8">
                    <p className="font-display text-2xl text-ink">
                      {minPrice} {t.common.currency}
                    </p>
                    <p className="mt-1 text-[0.62rem] uppercase tracking-[0.16em] text-stone">
                      {t.cars.fromPerDay}
                    </p>
                  </div>
                </>
              )}
            </div>
            )}
          </div>
        </div>
      </section>

      {bookingSearch && (
        <section className="border-b border-mist bg-cloud">
          <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
            <span className="eyebrow">{t.booking.resultsEyebrow}</span>
            <div className="mt-4">
              <BookingSearchCard variant="plain" initial={bookingSearch} />
            </div>
          </div>
        </section>
      )}

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
                {t.cars.filters}
              </span>
              <span className="text-xs text-stone">
                {filtersOpen ? t.cars.hideFilters : t.cars.showFilters}
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
            ) : loadFailed ? (
              <div className="border border-mist bg-cloud p-16 text-center">
                <CarSilhouette className="mx-auto mb-5 h-12 w-12 text-ash" />
                <h2 className="font-display text-2xl font-medium text-ink">
                  {t.cars.loadFailedTitle}
                </h2>
                <p className="mt-2 text-sm text-stone">{t.cars.loadFailedDesc}</p>
                <button
                  onClick={() => {
                    setLoading(true);
                    loadCars();
                  }}
                  className="btn-primary mt-7"
                >
                  {t.common.retry}
                </button>
              </div>
            ) : filteredCars.length === 0 ? (
              bookingSearch && cars.length === 0 ? (
                <div className="border border-mist bg-cloud p-16 text-center">
                  <CarSilhouette className="mx-auto mb-5 h-12 w-12 text-ash" />
                  <h2 className="font-display text-2xl font-medium text-ink">
                    {t.booking.emptyTitle}
                  </h2>
                  <p className="mt-2 text-sm text-stone">{t.booking.emptyDesc}</p>
                  <Link href="/voitures" className="btn-primary mt-7">
                    {t.booking.seeAllFleet}
                  </Link>
                </div>
              ) : (
                <div className="border border-mist bg-cloud p-16 text-center">
                  <CarSilhouette className="mx-auto mb-5 h-12 w-12 text-ash" />
                  <h2 className="font-display text-2xl font-medium text-ink">
                    {t.cars.noResultsTitle}
                  </h2>
                  <p className="mt-2 text-sm text-stone">{t.cars.noResultsDesc}</p>
                  <button onClick={resetFilters} className="btn-primary mt-7">
                    {t.cars.resetFilters}
                  </button>
                </div>
              )
            ) : (
              <>
                <p className="mb-8 text-sm text-stone">
                  {interpolate(t.cars.countAvailable, {
                    count: filteredCars.length,
                    unit: plural(filteredCars.length, t.units.vehicle, locale),
                    plural: pluralSuffix(filteredCars.length, locale),
                  })}
                </p>

                <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredCars.map((car) => (
                    <Link
                      href={`/voitures/${car.id}${linkSuffix}`}
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
                        <span className="absolute end-3 top-3 rounded-full border border-ink/10 bg-paper/85 px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] text-stone backdrop-blur-sm">
                          {t.enums.category[car.category] ?? car.category}
                        </span>
                        {car.is_featured && (
                          <span className="absolute start-3 top-3 rounded-full bg-ink px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-paper">
                            {t.fleet.featured}
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
                          {t.enums.transmission[car.transmission] ??
                            car.transmission}{" "}
                          · {t.enums.fuel[car.fuel_type] ?? car.fuel_type} ·{" "}
                          {car.seats} {t.common.seats}
                        </p>

                        <div className="mt-5 flex items-end justify-between border-t border-mist pt-4">
                          <p className="font-display text-2xl text-ink">
                            {car.price_per_day}
                            <span className="ms-1 text-sm text-ash">
                              {t.common.perDay}
                            </span>
                          </p>
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors duration-200 group-hover:text-accent">
                            {t.cars.book}
                            <Arrow className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
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

// useSearchParams() requires a Suspense boundary; the fallback keeps the navbar
// and page frame stable while the client reads the URL search.
function CarsPageFallback() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-paper">
      <Navbar />
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="h-8 w-56 animate-pulse rounded bg-mist" />
        <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="aspect-[4/3] animate-pulse rounded-[var(--radius-lg)] bg-mist" />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function CarsPage() {
  return (
    <Suspense fallback={<CarsPageFallback />}>
      <CarsPageContent />
    </Suspense>
  );
}
