"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import CarGlyph from "@/components/icons/CarGlyph";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { getCarById } from "@/lib/cars";
import { Car, PricingTier } from "@/lib/types";
import {
  MONTHS_FR,
  DAYS_FR,
  MS_PER_DAY,
  WHATSAPP_NUMBER,
} from "@/lib/constants";

function isDateInRange(date: Date, start: Date, end: Date) {
  return date >= start && date <= end;
}

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

function isDateUnavailable(
  date: Date,
  reservations: { start_date: string; end_date: string }[],
  quantity = 1,
): boolean {
  return countReservationsForDate(date, reservations) >= quantity;
}

function getDaysBetween(start: Date, end: Date) {
  return Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
}

// Format a Date as YYYY-MM-DD using LOCAL parts (not UTC), so the calendar date
// the user picked is preserved regardless of timezone.
function toDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
    Promise.all([
      getCarById(id),
      fetch(`/api/cars/${id}/availability`)
        .then((r) => r.json())
        .then(
          (d) => (d.unavailable ?? []) as { start_date: string; end_date: string }[],
        )
        .catch(() => [] as { start_date: string; end_date: string }[]),
    ])
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
      return "bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-secondary)_100%)] text-navy rounded-lg font-semibold shadow-sm";
    if (isInRange) return "bg-primary/12 text-navy";
    if (isPast)
      return "bg-slate-100/40 text-slate-300 cursor-not-allowed line-through";
    if (isUnavail)
      return "bg-slate-100/40 text-slate-300 cursor-not-allowed line-through";
    return "hover:bg-primary/8 cursor-pointer text-navy";
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

    // Price and availability are validated and computed on the server.
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          car_id: car.id,
          client_name: form.name,
          client_phone: form.phone,
          client_email: form.email || null,
          start_date: toDateOnly(startDate),
          end_date: toDateOnly(endDate),
          notes: form.notes || null,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setShowForm(false);
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        alert(data.error || "La réservation a échoué. Veuillez réessayer.");
      }
    } catch {
      alert("Erreur réseau. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
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
            className="text-sm text-primary mt-4 hover:text-primary/80 font-medium"
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
        <button
          onClick={() => router.back()}
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors mb-8 flex items-center gap-1 font-medium"
        >
          ← Retour
        </button>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div data-reveal="left" className="reveal-d1">
            <div className="relative mb-4 flex h-64 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-primary/10 shadow-soft sm:h-80">
              {car.images?.[activeImage] ? (
                <Image
                  src={car.images[activeImage]}
                  alt={car.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <CarGlyph className="w-32 h-32 text-primary" />
              )}
            </div>
            {car.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {car.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all duration-250 ${activeImage === i ? "border-primary shadow-soft" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <Image
                      src={img}
                      alt={`${car.name} ${i + 1}`}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

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
                  <div className="text-base font-semibold text-navy">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {car.features?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {car.features.map((f) => (
                  <span
                    key={f}
                    className="rounded-2xl border border-primary bg-primary/20 px-4 py-2 text-xs font-medium text-navy"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div data-reveal="right" className="reveal-d2">
            <span className="section-label">{car.category}</span>
            <h1 className="mt-3 mb-2 text-3xl font-bold text-navy sm:text-4xl">
              {car.brand} {car.name}
            </h1>
            <div className="mb-2 text-2xl font-bold text-primary sm:text-3xl">
              {car.price_per_day}{" "}
              <span className="text-lg text-slate-600 font-normal">
                DT / jour
              </span>
            </div>

            {pricingTiers.length > 0 && (
              <div className="mb-6 rounded-2xl border border-navy/15 bg-navy/5 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-navy">
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
                            ? "border-primary bg-primary/15 text-navy"
                            : "border-navy/15 bg-white text-slate-700"
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

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Bonjour, je suis intéressé par la ${car.brand} ${car.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full border-2 border-primary text-navy hover:bg-primary hover:text-navy transition-all duration-250 rounded-2xl py-3 text-base font-semibold mb-3 shadow-soft"
            >
              <WhatsAppIcon size={16} />
              Contacter sur WhatsApp
            </a>
          </div>
        </div>

        <div
          data-reveal
          className="mt-16 border-t border-slate-200 pt-12 sm:mt-20 sm:pt-16"
        >
          <div className="mb-10 text-center sm:mb-12">
            <span className="section-label">Disponibilités</span>
            <h2 className="mt-3 text-2xl font-bold text-navy sm:text-3xl">
              Choisissez vos dates
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Les dates grisées sont déjà réservées.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.45fr_0.95fr] lg:items-start">
            <div className="rounded-3xl border border-navy/12 bg-white p-4 shadow-soft sm:p-6">
              <div className="mb-6 flex items-center justify-between sm:mb-8">
                <button
                  onClick={() => {
                    if (viewMonth === 0) {
                      setViewMonth(11);
                      setViewYear((y) => y - 1);
                    } else setViewMonth((m) => m - 1);
                  }}
                  className="rounded-lg border border-transparent p-2 font-bold text-navy transition-colors hover:border-navy/20 hover:bg-navy/8"
                >
                  ←
                </button>
                <span className="text-base font-bold text-navy sm:text-lg">
                  {MONTHS_FR[viewMonth]} {viewYear}
                </span>
                <button
                  onClick={() => {
                    if (viewMonth === 11) {
                      setViewMonth(0);
                      setViewYear((y) => y + 1);
                    } else setViewMonth((m) => m + 1);
                  }}
                  className="rounded-lg border border-transparent p-2 font-bold text-navy transition-colors hover:border-navy/20 hover:bg-navy/8"
                >
                  →
                </button>
              </div>

              <div className="mb-3 grid grid-cols-7">
                {DAYS_FR.map((d) => (
                  <div
                    key={d}
                    className="py-2 text-center text-[10px] font-bold uppercase text-navy/80 sm:py-3 sm:text-xs"
                  >
                    {d}
                  </div>
                ))}
              </div>

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

              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-navy/75">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-white border border-navy/35 shadow-[0_1px_4px_color-mix(in srgb, var(--color-primary) 15%, transparent)]" />
                  <span>Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-secondary)_100%)]" />
                  <span>Sélectionné</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-slate-300" />
                  <span>Indisponible</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="rounded-2xl border border-navy/20 bg-[linear-gradient(135deg,color-mix(in srgb, var(--color-primary) 6%, transparent)_0%,color-mix(in srgb, var(--color-secondary) 8%, transparent)_100%)] p-4 sm:p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-navy">
                  Comment réserver
                </p>
                <div className="mt-3 grid gap-2">
                  <div className="rounded-xl border border-navy/15 bg-white/90 px-3 py-2 text-xs text-navy shadow-[0_2px_10px_color-mix(in srgb, var(--color-primary) 6%, transparent)]">
                    1. Sélectionnez le début
                  </div>
                  <div className="rounded-xl border border-navy/15 bg-white/90 px-3 py-2 text-xs text-navy shadow-[0_2px_10px_color-mix(in srgb, var(--color-primary) 6%, transparent)]">
                    2. Sélectionnez la fin
                  </div>
                  <div className="rounded-xl border border-navy/15 bg-white/90 px-3 py-2 text-xs text-navy shadow-[0_2px_10px_color-mix(in srgb, var(--color-primary) 6%, transparent)]">
                    3. Confirmez
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium text-navy">
                  {selectionHelp}
                </p>
              </div>

              <div className="rounded-2xl border border-primary/40 bg-[linear-gradient(135deg,var(--color-navy)_0%,var(--color-navy)_65%,var(--color-navy)_100%)] p-4 text-white shadow-soft backdrop-blur sm:p-5">
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
                    className="hidden w-full bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-secondary)_100%)] hover:brightness-95 text-navy py-3 rounded-xl text-sm font-semibold transition-all sm:block"
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
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/35 bg-[linear-gradient(135deg,var(--color-navy)_0%,var(--color-navy)_70%,var(--color-navy)_100%)] p-3 shadow-soft-lg backdrop-blur sm:hidden">
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
              className="rounded-xl bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-secondary)_100%)] px-4 py-2.5 text-xs font-semibold text-navy transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirmer
            </button>
          </div>
        </div>
      )}

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
                  placeholder="+216 00 000 000"
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

      {success && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-[calc(100vw-1rem)] rounded-3xl bg-white p-6 text-center shadow-soft-xl card-surface sm:max-w-sm sm:p-10">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-primary">
              <svg
                className="w-8 h-8 text-primary"
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
            <h3 className="mb-3 text-2xl font-bold text-navy">
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
