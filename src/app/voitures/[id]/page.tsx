"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TimeSlotPicker from "@/components/TimeSlotPicker";
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
  BOOKING_TIME_SLOTS,
  DEFAULT_PICKUP_TIME,
  DEFAULT_RETURN_TIME,
} from "@/lib/constants";
import { isPickupInPast, nowInTimezone, timeToMinutes } from "@/lib/time";

// Matches the server's lead buffer in src/app/api/reservations/route.ts.
const PICKUP_LEAD_MINUTES = 30;

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
  const [pickupTime, setPickupTime] = useState<string>(DEFAULT_PICKUP_TIME);
  const [returnTime, setReturnTime] = useState<string>(DEFAULT_RETURN_TIME);

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
      return "bg-ink text-paper rounded-[var(--radius-sm)] font-medium";
    if (isInRange) return "bg-ink/[0.07] text-ink";
    if (isPast)
      return "text-ash cursor-not-allowed line-through";
    if (isUnavail)
      return "text-ash cursor-not-allowed line-through";
    return "hover:bg-ink/[0.05] cursor-pointer text-ink";
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

  // On a single-day rental the return time must be strictly after the pickup.
  const isSameDay =
    !!startDate &&
    !!endDate &&
    startDate.toDateString() === endDate.toDateString();
  const timeOrderInvalid = isSameDay && returnTime <= pickupTime;

  // When the start day is today (in the agency timezone), only offer pickup
  // slots that are still ahead by the lead buffer. Mirrors the server check so
  // the customer can't pick a time that will be rejected on submit.
  const agencyNow = nowInTimezone();
  const startDateStr = startDate ? toDateOnly(startDate) : null;
  const startIsToday = startDateStr === agencyNow.dateStr;
  const pickupSlots = startIsToday
    ? BOOKING_TIME_SLOTS.filter(
        (t) => timeToMinutes(t) > agencyNow.minutes + PICKUP_LEAD_MINUTES,
      )
    : BOOKING_TIME_SLOTS;
  const noPickupSlotsToday = startIsToday && pickupSlots.length === 0;
  const pickupInPast =
    !!startDateStr &&
    isPickupInPast(startDateStr, pickupTime, {
      bufferMinutes: PICKUP_LEAD_MINUTES,
    });

  // If the selected pickup time falls out of the still-valid window (e.g. time
  // passed while the page was open), snap to the first available slot. Deps are
  // primitives so this only re-runs when the minute or selection actually
  // changes, not on every render (pickupSlots is a fresh array each render).
  useEffect(() => {
    if (!startIsToday) return;
    const valid = BOOKING_TIME_SLOTS.filter(
      (t) => timeToMinutes(t) > agencyNow.minutes + PICKUP_LEAD_MINUTES,
    );
    if (valid.length > 0 && !valid.includes(pickupTime)) {
      setPickupTime(valid[0]);
    }
  }, [startIsToday, agencyNow.minutes, pickupTime]);

  const bookingBlocked = timeOrderInvalid || pickupInPast || noPickupSlotsToday;

  const selectionHelp = !startDate
    ? "Étape 1: Choisissez une date de début disponible."
    : !endDate
      ? "Étape 2: Choisissez une date de fin disponible."
      : "Étape 3: Vérifiez le total, puis confirmez la réservation.";

  async function handleSubmit() {
    if (!car || !startDate || !endDate || !form.name || !form.phone) return;
    if (timeOrderInvalid) {
      alert("L'heure de retour doit être après l'heure de prise en charge.");
      return;
    }
    if (pickupInPast || noPickupSlotsToday) {
      alert("L'heure de prise en charge est déjà passée. Choisissez un créneau plus tard.");
      return;
    }
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
          pickup_time: pickupTime,
          return_time: returnTime,
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
      <main className="min-h-screen bg-paper">
        <Navbar />
        <div className="mx-auto max-w-7xl animate-pulse px-5 pt-16 sm:px-8 sm:pt-20">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="aspect-[4/3] rounded-[var(--radius-lg)] bg-mist" />
            <div className="space-y-4 pt-4">
              <div className="h-3 w-24 rounded bg-mist" />
              <div className="h-9 w-3/4 rounded bg-mist" />
              <div className="h-4 w-full rounded bg-mist" />
              <div className="h-4 w-2/3 rounded bg-mist" />
            </div>
          </div>
        </div>
      </main>
    );

  if (!car)
    return (
      <main className="min-h-screen bg-paper">
        <Navbar />
        <div className="px-5 py-28 text-center">
          <div className="mb-3 font-display text-3xl font-medium text-ink">
            Véhicule introuvable
          </div>
          <button
            onClick={() => router.push("/voitures")}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-stone underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            ← Retour aux véhicules
          </button>
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-paper">
      <Navbar />

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <button
          onClick={() => router.back()}
          className="mb-10 flex items-center gap-1.5 text-sm font-medium text-stone transition-colors hover:text-ink"
        >
          ← Retour
        </button>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <div data-reveal="left" className="reveal-d1">
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-mist bg-cloud">
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
                <CarGlyph className="h-28 w-28 text-ash" />
              )}
            </div>
            {car.images?.length > 1 && (
              <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
                {car.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border transition-colors duration-200 ${activeImage === i ? "border-ink" : "border-mist hover:border-line"}`}
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

            {/* Spec strip */}
            <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-[var(--radius)] border border-mist bg-mist">
              {[
                ["Transmission", car.transmission],
                ["Carburant", car.fuel_type],
                ["Places", `${car.seats}`],
              ].map(([label, value]) => (
                <div key={label} className="bg-paper px-4 py-4">
                  <div className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-ash">
                    {label}
                  </div>
                  <div className="mt-1.5 font-display text-base text-ink">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {car.features?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {car.features.map((f) => (
                  <span key={f} className="chip">
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div data-reveal="right" className="reveal-d2">
            <span className="eyebrow">{car.category}</span>
            <h1 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05] tracking-tight text-ink">
              {car.brand} {car.name}
            </h1>
            <div className="mt-3 font-display text-3xl text-ink">
              {car.price_per_day}
              <span className="ml-1.5 text-base font-normal text-stone">
                DT / jour
              </span>
            </div>

            {pricingTiers.length > 0 && (
              <div className="mt-7 rounded-[var(--radius)] border border-mist bg-cloud p-5">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">
                  Tarifs par durée
                </p>
                <div className="mt-4 space-y-2">
                  {pricingTiers.map((tier) => {
                    const isActive =
                      !!activeTier &&
                      activeTier.min_days === tier.min_days &&
                      activeTier.max_days === tier.max_days &&
                      totalDays > 0;

                    return (
                      <div
                        key={`${tier.min_days}-${tier.max_days}-${tier.price_per_day}`}
                        className={`flex items-center justify-between rounded-[var(--radius-sm)] border px-3.5 py-2.5 text-sm transition-colors ${
                          isActive
                            ? "border-ink bg-ink/[0.04] text-ink"
                            : "border-mist bg-paper text-stone"
                        }`}
                      >
                        <span>
                          {tier.min_days}–{tier.max_days} jours
                        </span>
                        <span className="font-display text-ink">
                          {tier.price_per_day} DT / jour
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-ash">
                  Le tarif appliqué dépend de la durée totale sélectionnée.
                </p>
              </div>
            )}

            {car.description && (
              <p className="mt-7 text-sm leading-7 text-stone">
                {car.description}
              </p>
            )}

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Bonjour, je suis intéressé par la ${car.brand} ${car.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-[var(--radius)] border border-ink py-3.5 text-sm font-medium text-ink transition-colors duration-200 hover:border-[#25D366] hover:bg-[#25D366] hover:text-white active:scale-[0.98]"
            >
              <WhatsAppIcon size={16} />
              Contacter sur WhatsApp
            </a>
          </div>
        </div>

        {/* Booking */}
        <div className="mt-20 border-t border-mist pt-16">
          <div className="mb-12 max-w-2xl">
            <span className="eyebrow">Disponibilités</span>
            <h2 className="mt-4 font-display text-[clamp(1.8rem,3.5vw,2.5rem)] font-medium tracking-tight text-ink">
              Choisissez vos dates
            </h2>
            <p className="mt-3 text-sm text-stone">
              Les dates grisées sont déjà réservées.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.45fr_0.95fr] lg:items-start">
            {/* Calendar */}
            <div className="rounded-[var(--radius-lg)] border border-mist bg-cloud p-5 sm:p-7">
              <div className="mb-7 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (viewMonth === 0) {
                      setViewMonth(11);
                      setViewYear((y) => y - 1);
                    } else setViewMonth((m) => m - 1);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-mist text-ink transition-colors hover:border-ink"
                >
                  ←
                </button>
                <span className="font-display text-lg font-medium text-ink">
                  {MONTHS_FR[viewMonth]} {viewYear}
                </span>
                <button
                  onClick={() => {
                    if (viewMonth === 11) {
                      setViewMonth(0);
                      setViewYear((y) => y + 1);
                    } else setViewMonth((m) => m + 1);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-mist text-ink transition-colors hover:border-ink"
                >
                  →
                </button>
              </div>

              <div className="mb-2 grid grid-cols-7">
                {DAYS_FR.map((d) => (
                  <div
                    key={d}
                    className="py-2 text-center text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ash"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calDays.map((date, i) => (
                  <div
                    key={i}
                    className="flex aspect-square items-center justify-center"
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
                        className={`flex h-full w-full items-center justify-center rounded-[var(--radius-sm)] text-sm transition-colors ${getDayClass(date)}`}
                      >
                        {date.getDate()}
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-mist pt-5 text-xs text-stone">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-[3px] border border-line bg-paper" />
                  <span>Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-[3px] bg-ink" />
                  <span>Sélectionné</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-[3px] bg-mist" />
                  <span>Indisponible</span>
                </div>
              </div>
            </div>

            {/* Booking rail */}
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="rounded-[var(--radius)] border border-mist bg-cloud p-5">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">
                  Comment réserver
                </p>
                <div className="mt-4 space-y-2.5">
                  {[
                    "1. Sélectionnez le début",
                    "2. Sélectionnez la fin",
                    "3. Confirmez",
                  ].map((step) => (
                    <div
                      key={step}
                      className="border-l border-mist pl-3 text-xs text-stone"
                    >
                      {step}
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm font-medium text-ink">
                  {selectionHelp}
                </p>
              </div>

              <div className="rounded-[var(--radius)] border border-mist bg-cloud p-5">
                <p className="mb-4 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">
                  Heure de prise en charge &amp; retour
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <TimeSlotPicker
                    id="pickup-time"
                    label="Prise en charge"
                    value={pickupTime}
                    slots={pickupSlots}
                    onChange={setPickupTime}
                    disabled={noPickupSlotsToday}
                  />
                  <TimeSlotPicker
                    id="return-time"
                    label="Retour"
                    value={returnTime}
                    slots={BOOKING_TIME_SLOTS}
                    onChange={setReturnTime}
                  />
                </div>
                {timeOrderInvalid && (
                  <p className="mt-3 text-xs font-medium text-red-600">
                    Pour une location d&apos;une journée, l&apos;heure de retour
                    doit être après l&apos;heure de prise en charge.
                  </p>
                )}
                {noPickupSlotsToday && (
                  <p className="mt-3 text-xs font-medium text-red-600">
                    Plus de créneau disponible aujourd&apos;hui. Choisissez une
                    autre date.
                  </p>
                )}
              </div>

              {/* Summary — ink band */}
              <div className="rounded-[var(--radius-lg)] bg-ink p-6 text-paper">
                <div className="space-y-4 border-b border-white/10 pb-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[0.62rem] uppercase tracking-[0.16em] text-white/45">
                      Début
                    </span>
                    <span className="text-sm font-medium text-white">
                      {startDate
                        ? `${startDate.toLocaleDateString("fr-FR")} · ${pickupTime}`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[0.62rem] uppercase tracking-[0.16em] text-white/45">
                      Fin
                    </span>
                    <span className="text-sm font-medium text-white">
                      {endDate
                        ? `${endDate.toLocaleDateString("fr-FR")} · ${returnTime}`
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-4 pt-5">
                  <div>
                    <p className="text-[0.62rem] uppercase tracking-[0.16em] text-white/45">
                      Total estimé
                    </p>
                    <p className="mt-1 font-display text-3xl text-white">
                      {totalDays > 0 ? `${totalPrice} DT` : "—"}
                    </p>
                    {totalDays > 0 && (
                      <p className="mt-1 text-[0.7rem] text-white/50">
                        {appliedDailyRate} DT / jour
                      </p>
                    )}
                  </div>
                </div>

                {endDate ? (
                  <button
                    onClick={() => setShowForm(true)}
                    disabled={bookingBlocked}
                    className="btn-accent mt-5 hidden w-full py-3 disabled:cursor-not-allowed disabled:opacity-40 sm:flex"
                  >
                    Confirmer — {totalDays} jour{totalDays > 1 ? "s" : ""}
                  </button>
                ) : (
                  <p className="mt-5 text-xs text-white/55">
                    Choisissez une date de fin pour activer la confirmation.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky confirm bar */}
      {startDate && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink p-3 sm:hidden">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.62rem] uppercase tracking-[0.14em] text-white/45">
                Total estimé
              </p>
              <p className="truncate font-display text-lg text-white">
                {totalDays > 0 ? `${totalPrice} DT` : "Choisissez une fin"}
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              disabled={!endDate || bookingBlocked}
              className="btn-accent px-5 py-2.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Confirmer
            </button>
          </div>
        </div>
      )}

      {/* Booking form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-[calc(100vw-1rem)] overflow-y-auto rounded-[var(--radius-lg)] border border-mist bg-paper p-6 shadow-md sm:max-w-md sm:p-9">
            <h3 className="font-display text-2xl font-medium text-ink">
              Vos informations
            </h3>
            <p className="mt-1.5 text-sm text-stone">
              Nous vous contacterons pour confirmer la réservation.
            </p>

            <div className="mt-7 flex flex-col gap-4">
              {[
                { key: "name", label: "Nom complet *", type: "text", ph: "Votre nom" },
                { key: "phone", label: "Téléphone *", type: "tel", ph: "+216 00 000 000" },
                { key: "email", label: "Email", type: "email", ph: "votre@email.com" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="mb-2 block text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-stone">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    placeholder={field.ph}
                    value={form[field.key as keyof typeof form]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [field.key]: e.target.value }))
                    }
                    className="input-premium"
                  />
                </div>
              ))}
              <div>
                <label className="mb-2 block text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-stone">
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
                className="btn-ghost flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.name || !form.phone}
                className="btn-primary flex-1 disabled:opacity-40"
              >
                {submitting ? "Envoi..." : "Envoyer la demande"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success modal */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[calc(100vw-1rem)] rounded-[var(--radius-lg)] border border-mist bg-paper p-8 text-center shadow-md sm:max-w-sm sm:p-10">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-ink">
              <svg className="h-6 w-6 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-display text-2xl font-medium text-ink">
              Demande envoyée
            </h3>
            <p className="mt-3 text-sm leading-7 text-stone">
              Nous vous contacterons dans les plus brefs délais pour confirmer
              votre réservation.
            </p>
            <button
              onClick={() => {
                setSuccess(false);
                setStartDate(null);
                setEndDate(null);
              }}
              className="btn-primary mt-7 w-full"
            >
              Retour au véhicule
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
