"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getCarById, getUnavailableDates } from "@/lib/cars";
import { Car, PricingTier } from "@/lib/types";
import { supabase } from "@/lib/supabase";

function isDateInRange(date: Date, start: Date, end: Date) {
  return date >= start && date <= end;
}

// Count how many confirmed reservations cover a specific date
function countReservationsForDate(
  date: Date,
  reservations: { start_date: string; end_date: string }[],
): number {
  return reservations.filter(({ start_date, end_date }) => {
    const s = new Date(start_date);
    const e = new Date(end_date);
    s.setHours(0, 0, 0, 0);
    e.setHours(23, 59, 59, 999);
    return isDateInRange(date, s, e);
  }).length;
}

// Check if a date is unavailable based on quantity
function isDateUnavailable(
  date: Date,
  reservations: { start_date: string; end_date: string }[],
  quantity: number = 1, // Default to 1 if quantity not provided (backward compat)
): boolean {
  const count = countReservationsForDate(date, reservations);
  return count >= quantity;
}

function getDaysBetween(start: Date, end: Date) {
  return (
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
}

function normalizePricingTiers(tiers?: PricingTier[] | null): PricingTier[] {
  return (tiers || [])
    .filter(
      (tier) =>
        Number.isFinite(tier.min_days) &&
        Number.isFinite(tier.max_days) &&
        Number.isFinite(tier.price_per_day) &&
        tier.min_days >= 1 &&
        tier.max_days >= tier.min_days &&
        tier.price_per_day > 0,
    )
    .sort((a, b) => a.min_days - b.min_days);
}

function getDailyRateForDuration(
  durationDays: number,
  defaultRate: number,
  tiers?: PricingTier[] | null,
): number {
  const normalized = normalizePricingTiers(tiers);
  if (durationDays <= 0 || normalized.length === 0) return defaultRate;

  const exactMatch = normalized.find(
    (tier) => durationDays >= tier.min_days && durationDays <= tier.max_days,
  );
  if (exactMatch) return exactMatch.price_per_day;

  const lowerTier = [...normalized]
    .reverse()
    .find((tier) => durationDays >= tier.min_days);
  if (lowerTier) return lowerTier.price_per_day;

  return normalized[0].price_per_day;
}

function getMatchingTierForDuration(
  durationDays: number,
  tiers?: PricingTier[] | null,
): PricingTier | null {
  if (durationDays <= 0) return null;
  const normalized = normalizePricingTiers(tiers);
  if (normalized.length === 0) return null;

  const exactMatch = normalized.find(
    (tier) => durationDays >= tier.min_days && durationDays <= tier.max_days,
  );
  if (exactMatch) return exactMatch;

  const lowerTier = [...normalized]
    .reverse()
    .find((tier) => durationDays >= tier.min_days);
  if (lowerTier) return lowerTier;

  return normalized[0];
}

const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];
const DAYS_FR = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState<
    { start_date: string; end_date: string }[]
  >([]);
  const [activeImage, setActiveImage] = useState(0);

  // Calendar
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // Booking form
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });

  useEffect(() => {
    if (!id) return;
    Promise.all([getCarById(id), getUnavailableDates(id)])
      .then(([carData, unavailData]) => {
        setCar(carData);
        setUnavailable(unavailData);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Build calendar days
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  // Monday-based offset
  const startOffset = (firstDay.getDay() + 6) % 7;
  const calDays: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from(
      { length: lastDay.getDate() },
      (_, i) => new Date(viewYear, viewMonth, i + 1),
    ),
  ];

  function handleDayClick(date: Date) {
    if (date < today || isDateUnavailable(date, unavailable, car?.quantity))
      return;
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else {
      if (date < startDate) {
        setStartDate(date);
        setEndDate(null);
        return;
      }
      // Check if any date in range would exceed quantity
      const hasConflict = (() => {
        const cur = new Date(startDate);
        while (cur <= date) {
          if (isDateUnavailable(new Date(cur), unavailable, car?.quantity)) {
            return true;
          }
          cur.setDate(cur.getDate() + 1);
        }
        return false;
      })();
      if (hasConflict) {
        setStartDate(date);
        setEndDate(null);
        return;
      }
      setEndDate(date);
    }
  }

  function getDayClass(date: Date) {
    const isPast = date < today;
    const isUnavail = isDateUnavailable(date, unavailable, car?.quantity);
    const isStart =
      startDate && date.toDateString() === startDate.toDateString();
    const isEnd = endDate && date.toDateString() === endDate.toDateString();
    const effectiveEnd = endDate || hoverDate;
    const isInRange =
      startDate && effectiveEnd && !endDate
        ? date > startDate && date <= effectiveEnd
        : startDate && endDate
          ? date > startDate && date < endDate
          : false;

    if (isStart || isEnd)
      return "bg-[linear-gradient(135deg,#231F20_0%,#231F20_100%)] text-[#f7e8ad] rounded-lg font-semibold shadow-sm";
    if (isInRange) return "bg-[#231F20]/12 text-[#231F20]";
    if (isPast)
      return "bg-slate-100/40 text-slate-300 cursor-not-allowed line-through";
    if (isUnavail)
      return "bg-slate-100/40 text-slate-300 cursor-not-allowed line-through";
    return "hover:bg-[#231F20]/8 cursor-pointer text-[#231F20]";
  }

  const totalDays =
    startDate && endDate ? getDaysBetween(startDate, endDate) : 0;
  const pricingTiers = normalizePricingTiers(car?.pricing_tiers);
  const activeTier = getMatchingTierForDuration(totalDays, pricingTiers);
  const appliedDailyRate =
    car && totalDays > 0
      ? getDailyRateForDuration(totalDays, car.price_per_day, pricingTiers)
      : (car?.price_per_day ?? 0);
  const totalPrice = car && totalDays > 0 ? totalDays * appliedDailyRate : 0;
  const selectionHelp = !startDate
    ? "Étape 1: Choisissez une date de début disponible."
    : !endDate
      ? "Étape 2: Choisissez une date de fin disponible."
      : "Étape 3: Vérifiez le total, puis confirmez la réservation.";

  async function handleSubmit() {
    if (!car || !startDate || !endDate || !form.name || !form.phone) return;
    setSubmitting(true);
    const payload = {
      car_id: car.id,
      client_name: form.name,
      client_phone: form.phone,
      client_email: form.email || null,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      total_price: totalPrice,
      notes: form.notes || null,
      status: "pending" as const,
    };

    const { error } = await supabase.from("reservations").insert(payload);

    if (!error) {
      void fetch("/api/reservations/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          carName: car.name,
          carBrand: car.brand,
          clientName: form.name,
          clientPhone: form.phone,
          clientEmail: form.email || null,
          startDate: startDate.toLocaleDateString("fr-FR"),
          endDate: endDate.toLocaleDateString("fr-FR"),
          totalPrice,
          notes: form.notes || null,
        }),
      }).catch((notifyError) => {
        console.error(
          "Failed to send reservation email notification:",
          notifyError,
        );
      });

      setSuccess(true);
      setShowForm(false);
    }
    setSubmitting(false);
  }

  if (loading)
    return (
      <main className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 pt-24 animate-pulse sm:px-6 sm:pt-28">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="h-96 bg-slate-200 rounded-3xl" />
            <div className="space-y-4">
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="h-8 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-full" />
            </div>
          </div>
        </div>
      </main>
    );

  if (!car)
    return (
      <main className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="py-24 pt-24 text-center text-slate-500 sm:pt-28">
          <div className="text-2xl font-bold mb-2">Véhicule introuvable</div>
          <button
            onClick={() => router.push("/voitures")}
            className="text-sm text-[#D4AF37] mt-4 hover:text-[#D4AF37]/80 font-medium"
          >
            ← Retour aux véhicules
          </button>
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <div
        data-reveal
        className="mx-auto max-w-7xl px-4 py-8 pt-24 sm:px-6 sm:py-10 sm:pt-28"
      >
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors mb-8 flex items-center gap-1 font-medium"
        >
          ← Retour
        </button>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left — images */}
          <div data-reveal="left" className="reveal-d1">
            <div className="relative mb-4 flex h-64 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-[#D4AF37]/10 shadow-soft sm:h-80">
              {car.images?.[activeImage] ? (
                <Image
                  src={car.images[activeImage]}
                  alt={car.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <svg
                  className="w-32 h-32 text-[#D4AF37]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                </svg>
              )}
            </div>
            {car.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {car.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all duration-250 ${activeImage === i ? "border-[#D4AF37] shadow-soft" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <Image
                      src={img}
                      alt={`${car.name} ${i + 1}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Quick specs */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ["Transmission", car.transmission],
                ["Carburant", car.fuel_type],
                ["Places", `${car.seats} places`],
              ].map(([label, value]) => (
                <div key={label} className="card-surface rounded-2xl px-5 py-4">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    {label}
                  </div>
                  <div className="text-base font-semibold text-navy-500">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Features */}
            {car.features?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {car.features.map((f) => (
                  <span
                    key={f}
                    className="rounded-2xl border border-[#D4AF37] bg-[#D4AF37]/20 px-4 py-2 text-xs font-medium text-[#231F20]"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right — info */}
          <div data-reveal="right" className="reveal-d2">
            <span className="section-label">{car.category}</span>
            <h1 className="mt-3 mb-2 text-3xl font-bold text-navy-500 sm:text-4xl">
              {car.brand} {car.name}
            </h1>
            <div className="mb-2 text-2xl font-bold text-[#D4AF37] sm:text-3xl">
              {car.price_per_day}{" "}
              <span className="text-lg text-slate-600 font-normal">
                DT / jour
              </span>
            </div>

            {pricingTiers.length > 0 && (
              <div className="mb-6 rounded-2xl border border-[#231F20]/15 bg-[#231F20]/5 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#231F20]">
                  Tarifs par durée
                </p>
                <div className="mt-3 space-y-2">
                  {pricingTiers.map((tier) => {
                    const isActive =
                      !!activeTier &&
                      activeTier.min_days === tier.min_days &&
                      activeTier.max_days === tier.max_days &&
                      totalDays > 0;

                    return (
                      <div
                        key={`${tier.min_days}-${tier.max_days}-${tier.price_per_day}`}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#231F20]"
                            : "border-[#231F20]/15 bg-white text-slate-700"
                        }`}
                      >
                        <span className="font-medium">
                          {tier.min_days} à {tier.max_days} jours
                        </span>
                        <span className="font-semibold">
                          {tier.price_per_day} DT / jour
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Le tarif appliqué dépend de la durée totale sélectionnée.
                </p>
              </div>
            )}

            {car.description && (
              <p className="text-base text-slate-600 leading-8 mt-6 mb-8">
                {car.description}
              </p>
            )}

            {/* WhatsApp */}

            <a
              href={`https://wa.me/21624786189?text=Bonjour, je suis intéressé par la ${car.brand} ${car.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full border-2 border-[#D4AF37] text-[#231F20] hover:bg-[#D4AF37] hover:text-[#231F20] transition-all duration-250 rounded-2xl py-3 text-base font-semibold mb-3 shadow-soft"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Contacter sur WhatsApp
            </a>
          </div>
        </div>

        {/* Calendar */}
        <div
          data-reveal
          className="mt-16 border-t border-slate-200 pt-12 sm:mt-20 sm:pt-16"
        >
          <div className="mb-10 text-center sm:mb-12">
            <span className="section-label">Disponibilités</span>
            <h2 className="mt-3 text-2xl font-bold text-navy-500 sm:text-3xl">
              Choisissez vos dates
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Les dates grisées sont déjà réservées.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.45fr_0.95fr] lg:items-start">
            <div className="rounded-3xl border border-[#231F20]/12 bg-white p-4 shadow-soft sm:p-6">
              {/* Month nav */}
              <div className="mb-6 flex items-center justify-between sm:mb-8">
                <button
                  onClick={() => {
                    if (viewMonth === 0) {
                      setViewMonth(11);
                      setViewYear((y) => y - 1);
                    } else setViewMonth((m) => m - 1);
                  }}
                  className="rounded-lg border border-transparent p-2 font-bold text-[#231F20] transition-colors hover:border-[#231F20]/20 hover:bg-[#231F20]/8"
                >
                  ←
                </button>
                <span className="text-base font-bold text-[#231F20] sm:text-lg">
                  {MONTHS_FR[viewMonth]} {viewYear}
                </span>
                <button
                  onClick={() => {
                    if (viewMonth === 11) {
                      setViewMonth(0);
                      setViewYear((y) => y + 1);
                    } else setViewMonth((m) => m + 1);
                  }}
                  className="rounded-lg border border-transparent p-2 font-bold text-[#231F20] transition-colors hover:border-[#231F20]/20 hover:bg-[#231F20]/8"
                >
                  →
                </button>
              </div>

              {/* Day headers */}
              <div className="mb-3 grid grid-cols-7">
                {DAYS_FR.map((d) => (
                  <div
                    key={d}
                    className="py-2 text-center text-[10px] font-bold uppercase text-[#231F20]/80 sm:py-3 sm:text-xs"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {calDays.map((date, i) => (
                  <div
                    key={i}
                    className="aspect-square flex items-center justify-center"
                  >
                    {date ? (
                      <button
                        onClick={() => handleDayClick(date)}
                        onMouseEnter={() =>
                          startDate && !endDate && setHoverDate(date)
                        }
                        onMouseLeave={() => setHoverDate(null)}
                        disabled={
                          date < today ||
                          isDateUnavailable(date, unavailable, car?.quantity)
                        }
                        className={`w-full h-full flex items-center justify-center text-sm transition-colors rounded-lg ${getDayClass(date)}`}
                      >
                        {date.getDate()}
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-[#231F20]/75">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-white border border-[#231F20]/35 shadow-[0_1px_4px_rgba(35,31,32,0.15)]" />
                  <span>Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[linear-gradient(135deg,#231F20_0%,#231F20_100%)]" />
                  <span>Sélectionné</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-slate-300" />
                  <span>Indisponible</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="rounded-2xl border border-[#231F20]/20 bg-[linear-gradient(135deg,rgba(35,31,32,0.06)_0%,rgba(212,175,55,0.08)_100%)] p-4 sm:p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[#231F20]">
                  Comment réserver
                </p>
                <div className="mt-3 grid gap-2">
                  <div className="rounded-xl border border-[#231F20]/15 bg-white/90 px-3 py-2 text-xs text-[#231F20] shadow-[0_2px_10px_rgba(35,31,32,0.06)]">
                    1. Sélectionnez le début
                  </div>
                  <div className="rounded-xl border border-[#231F20]/15 bg-white/90 px-3 py-2 text-xs text-[#231F20] shadow-[0_2px_10px_rgba(35,31,32,0.06)]">
                    2. Sélectionnez la fin
                  </div>
                  <div className="rounded-xl border border-[#231F20]/15 bg-white/90 px-3 py-2 text-xs text-[#231F20] shadow-[0_2px_10px_rgba(35,31,32,0.06)]">
                    3. Confirmez
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium text-[#231F20]">
                  {selectionHelp}
                </p>
              </div>

              <div className="rounded-2xl border border-[#D4AF37]/40 bg-[linear-gradient(135deg,#231F20_0%,#231F20_65%,#231F20_100%)] p-4 text-white shadow-soft backdrop-blur sm:p-5">
                <div className="mb-4 grid grid-cols-1 gap-3 sm:mb-5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-1">
                  <div>
                    <div className="mb-1 text-xs text-white/75">
                      Date de début
                    </div>
                    <div className="font-medium text-sm">
                      {startDate ? startDate.toLocaleDateString("fr-FR") : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-white/75">
                      Date de fin
                    </div>
                    <div className="font-medium text-sm">
                      {endDate ? endDate.toLocaleDateString("fr-FR") : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-white/75">
                      Total estimé
                    </div>
                    <div className="font-semibold text-sm text-[#f4e39b]">
                      {totalDays > 0 ? `${totalPrice} DT` : "—"}
                    </div>
                    {totalDays > 0 && (
                      <div className="mt-1 text-[11px] text-white/75">
                        Tarif appliqué: {appliedDailyRate} DT / jour
                      </div>
                    )}
                  </div>
                </div>
                {endDate ? (
                  <button
                    onClick={() => setShowForm(true)}
                    className="hidden w-full bg-[linear-gradient(135deg,#D4AF37_0%,#D4AF37_100%)] hover:brightness-95 text-[#231F20] py-3 rounded-xl text-sm font-semibold transition-all sm:block"
                  >
                    Confirmer la réservation — {totalDays} jour
                    {totalDays > 1 ? "s" : ""}
                  </button>
                ) : (
                  <p className="text-xs text-white/80">
                    Choisissez maintenant une date de fin pour activer la
                    confirmation.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {startDate && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D4AF37]/35 bg-[linear-gradient(135deg,#231F20_0%,#231F20_70%,#231F20_100%)] p-3 shadow-soft-lg backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-white/75">
                Total estimé
              </p>
              <p className="truncate text-sm font-semibold text-[#f4e39b]">
                {totalDays > 0
                  ? `${totalPrice} DT`
                  : "Choisissez une date de fin"}
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              disabled={!endDate}
              className="rounded-xl bg-[linear-gradient(135deg,#D4AF37_0%,#D4AF37_100%)] px-4 py-2.5 text-xs font-semibold text-[#231F20] transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirmer
            </button>
          </div>
        </div>
      )}

      {/* Booking form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="max-h-[90vh] w-full max-w-[calc(100vw-1rem)] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:max-w-md sm:p-8">
            <h3 className="mb-1 font-serif text-2xl font-medium">
              Vos informations
            </h3>
            <p className="mb-6 text-xs text-gray-400">
              Nous vous contacterons pour confirmer la réservation.
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-slate-700 uppercase tracking-wide font-bold mb-2 block">
                  Nom complet *
                </label>
                <input
                  type="text"
                  placeholder="Votre nom"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="input-premium"
                />
              </div>
              <div>
                <label className="text-xs text-slate-700 uppercase tracking-wide font-bold mb-2 block">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  placeholder="24 786 189"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="input-premium"
                />
              </div>
              <div>
                <label className="text-xs text-slate-700 uppercase tracking-wide font-bold mb-2 block">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="input-premium"
                />
              </div>
              <div>
                <label className="text-xs text-slate-700 uppercase tracking-wide font-bold mb-2 block">
                  Notes
                </label>
                <textarea
                  placeholder="Demandes particulières..."
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={3}
                  className="input-premium resize-none"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 btn-ghost"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.name || !form.phone}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {submitting ? "Envoi..." : "Envoyer la demande"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-[calc(100vw-1rem)] rounded-3xl bg-white p-6 text-center shadow-soft-xl card-surface sm:max-w-sm sm:p-10">
            <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[#D4AF37]">
              <svg
                className="w-8 h-8 text-[#D4AF37]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="mb-3 text-2xl font-bold text-navy-500">
              Demande envoyée !
            </h3>
            <p className="mb-8 text-base text-slate-600">
              Nous vous contacterons dans les plus brefs délais pour confirmer
              votre réservation.
            </p>
            <button
              onClick={() => {
                setSuccess(false);
                setStartDate(null);
                setEndDate(null);
              }}
              className="w-full btn-primary"
            >
              Retour au véhicule
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
