"use client";
import Image from "next/image";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import TimeSlotPicker from "@/components/TimeSlotPicker";
import Navbar from "@/components/Navbar";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { useToast } from "@/components/Feedback";
import CarGlyph from "@/components/icons/CarGlyph";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { getCarById } from "@/lib/cars";
import { Car } from "@/lib/types";
import {
  WHATSAPP_NUMBER,
  BOOKING_TIME_SLOTS,
  DEFAULT_PICKUP_TIME,
  DEFAULT_RETURN_TIME,
  PICKUP_LEAD_MINUTES,
  RENTAL_LOCATIONS,
  DEFAULT_RENTAL_LOCATION,
  getAlternateRentalLocation,
  type RentalLocation,
} from "@/lib/constants";
import { computeQuote, normalizePricingTiers } from "@/lib/pricing";
import { formatDateOnly } from "@/lib/dates";
import { parseBookingSearch } from "@/lib/booking-search";
import { isPickupInPast, nowInTimezone, timeToMinutes } from "@/lib/time";
import { useI18n } from "@/i18n/client";
import {
  formatDate,
  interpolate,
  monthName,
  plural,
  weekdayLabels,
} from "@/i18n/format";

/** Parse "YYYY-MM-DD" to a LOCAL-midnight Date (the calendar works in local time). */
function parseLocalYmd(value: string): Date | null {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return date;
}

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

// Lightweight email shape check — good enough to catch typos without rejecting
// valid-but-unusual addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function CarDetailPageContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { t, locale } = useI18n();

  // Search carried over from the hero/results (dates + locations). Used to
  // pre-fill the calendar and location choices; still fully editable here.
  const presetSearch = useMemo(
    () => parseBookingSearch((key) => searchParams.get(key)),
    [searchParams],
  );

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
  const [pickupTime, setPickupTime] = useState<string>(
    presetSearch?.startTime ?? DEFAULT_PICKUP_TIME,
  );
  const [returnTime, setReturnTime] = useState<string>(
    presetSearch?.endTime ?? DEFAULT_RETURN_TIME,
  );

  // Pickup / return locations (prefilled from the search, editable here).
  const [pickupLocation, setPickupLocation] = useState<RentalLocation>(
    presetSearch?.pickup ?? DEFAULT_RENTAL_LOCATION,
  );
  const [differentReturn, setDifferentReturn] = useState(
    !!presetSearch && presetSearch.return !== presetSearch.pickup,
  );
  const presetAppliedRef = useRef(false);

  // Booking form
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });

  // Modal focus management.
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const loadCar = useCallback(() => {
    if (!id) return;
    Promise.all([
      getCarById(id),
      fetch(`/api/cars/${id}/availability`)
        .then((r) => r.json())
        .then(
          (d) =>
            (d.unavailable ?? []) as { start_date: string; end_date: string }[],
        )
        .catch(() => [] as { start_date: string; end_date: string }[]),
    ])
      .then(([carData, unavailData]) => {
        setCar(carData);
        setUnavailable(unavailData);
      })
      .catch(() => setCar(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadCar();
  }, [loadCar]);

  // Prefill the calendar from the search (once). The results page already
  // guaranteed this car is available for that window, so the dates are safe.
  useEffect(() => {
    if (presetAppliedRef.current || !presetSearch) return;
    const start = parseLocalYmd(presetSearch.start);
    const end = parseLocalYmd(presetSearch.end);
    if (start && end) {
      setStartDate(start);
      setEndDate(end);
      setViewYear(start.getFullYear());
      setViewMonth(start.getMonth());
    }
    presetAppliedRef.current = true;
  }, [presetSearch]);

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
    if (isPast) return "text-ash cursor-not-allowed line-through";
    if (isUnavail) return "text-ash cursor-not-allowed line-through";
    return "hover:bg-ink/[0.05] cursor-pointer text-ink";
  }

  // Authoritative quote shared with the server (single source of truth for
  // pricing). Recomputed from the selected range; cheap, pure, no need to memo.
  const quote =
    car && startDate && endDate
      ? computeQuote(car, formatDateOnly(startDate), formatDateOnly(endDate))
      : null;
  const totalDays = quote?.totalDays ?? 0;
  const pricingTiers = normalizePricingTiers(car?.pricing_tiers);
  const activeTier = quote?.tier ?? null;
  const appliedDailyRate = quote?.dailyRate ?? car?.price_per_day ?? 0;
  const totalPrice = quote?.totalPrice ?? 0;

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
  const startDateStr = startDate ? formatDateOnly(startDate) : null;
  const startIsToday = startDateStr === agencyNow.dateStr;
  const pickupSlots = startIsToday
    ? BOOKING_TIME_SLOTS.filter(
        (slot) => timeToMinutes(slot) > agencyNow.minutes + PICKUP_LEAD_MINUTES,
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
      (slot) => timeToMinutes(slot) > agencyNow.minutes + PICKUP_LEAD_MINUTES,
    );
    if (valid.length > 0 && !valid.includes(pickupTime)) {
      setPickupTime(valid[0]);
    }
  }, [startIsToday, agencyNow.minutes, pickupTime]);

  const bookingBlocked = timeOrderInvalid || pickupInPast || noPickupSlotsToday;

  const selectionHelp = !startDate
    ? t.carDetail.selectStart
    : !endDate
      ? t.carDetail.selectEnd
      : t.carDetail.confirmStep;

  // Inline form validation (shown next to the fields, not via blocking dialogs).
  const emailInvalid =
    form.email.trim() !== "" && !EMAIL_RE.test(form.email.trim());
  const phoneInvalid =
    form.phone.trim() !== "" && form.phone.replace(/\D/g, "").length < 6;
  const formValid =
    !!form.name.trim() && !!form.phone.trim() && !emailInvalid && !phoneInvalid;

  // Booking modal: focus the first field on open, Escape to close, restore focus
  // to the trigger on close.
  useEffect(() => {
    if (!showForm) return;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    const focusId = requestAnimationFrame(() => {
      setSubmitError(null);
      firstFieldRef.current?.focus();
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) setShowForm(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(focusId);
      window.removeEventListener("keydown", onKey);
      lastFocusedRef.current?.focus?.();
    };
  }, [showForm, submitting]);

  async function handleSubmit() {
    if (!car || !startDate || !endDate || !formValid) return;
    setSubmitError(null);

    if (timeOrderInvalid) {
      toast(t.carDetail.toastReturnAfterPickup, "error");
      return;
    }
    if (pickupInPast || noPickupSlotsToday) {
      toast(t.carDetail.toastSlotPassed, "error");
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
          client_name: form.name.trim(),
          client_phone: form.phone.trim(),
          client_email: form.email.trim() || null,
          start_date: formatDateOnly(startDate),
          end_date: formatDateOnly(endDate),
          pickup_time: pickupTime,
          return_time: returnTime,
          pickup_location: pickupLocation,
          return_location: differentReturn
            ? getAlternateRentalLocation(pickupLocation)
            : pickupLocation,
          notes: form.notes.trim() || null,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setShowForm(false);
        toast(t.carDetail.toastRequestSent, "success");
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        const message =
          res.status === 429
            ? t.carDetail.toastRateLimited
            : data.error || t.carDetail.toastSaveFailed;
        setSubmitError(message);
        toast(message, "error");
      }
    } catch {
      const message = t.carDetail.toastConnection;
      setSubmitError(message);
      toast(message, "error");
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
        <div className="mx-auto max-w-md px-5 py-28 text-center">
          <span className="eyebrow">{t.carDetail.unavailableEyebrow}</span>
          <h1 className="mt-4 font-display text-3xl font-medium text-ink">
            {t.carDetail.notFoundTitle}
          </h1>
          <p className="mt-3 text-sm leading-7 text-stone">
            {t.carDetail.notFoundDesc}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={() => {
                setLoading(true);
                loadCar();
              }}
              className="btn-primary px-6 py-3"
            >
              {t.common.retry}
            </button>
            <button
              onClick={() => router.push("/voitures")}
              className="btn-outline px-6 py-3"
            >
              {t.carDetail.viewVehicles}
            </button>
          </div>
        </div>
      </main>
    );

  const specStrip: [string, string][] = [
    [
      t.carDetail.transmission,
      t.enums.transmission[car.transmission] ?? car.transmission,
    ],
    [t.carDetail.fuel, t.enums.fuel[car.fuel_type] ?? car.fuel_type],
    [t.carDetail.seats, `${car.seats}`],
  ];

  const locationOptions = RENTAL_LOCATIONS.map((value) => ({
    value,
    label: t.booking.locations[value] ?? value,
  }));
  const alternateReturnLocation = getAlternateRentalLocation(pickupLocation);
  const differentReturnLabel = interpolate(t.booking.differentReturnTo, {
    location:
      t.booking.locations[alternateReturnLocation] ?? alternateReturnLocation,
  });
  const effectiveReturnLocation = differentReturn
    ? alternateReturnLocation
    : pickupLocation;

  return (
    <main className="min-h-screen bg-paper">
      <Navbar />

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <button
          onClick={() => router.back()}
          className="mb-10 flex items-center gap-1.5 text-sm font-medium text-stone transition-colors hover:text-ink"
        >
          <svg
            className="h-4 w-4 rtl:rotate-180"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {t.carDetail.back}
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
              {specStrip.map(([label, value]) => (
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
            <span className="eyebrow">
              {t.enums.category[car.category] ?? car.category}
            </span>
            <h1 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05] tracking-tight text-ink">
              {car.brand} {car.name}
            </h1>
            <div className="mt-3 font-display text-3xl text-ink">
              {car.price_per_day}
              <span className="ms-1.5 text-base font-normal text-stone">
                {t.common.perDayFull}
              </span>
            </div>

            {pricingTiers.length > 0 && (
              <div className="mt-7 rounded-[var(--radius)] border border-mist bg-cloud p-5">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">
                  {t.carDetail.pricingTiers}
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
                          {tier.max_days === null
                            ? interpolate(t.carDetail.daysAndUp, {
                                min: tier.min_days,
                              })
                            : interpolate(t.carDetail.daysRange, {
                                min: tier.min_days,
                                max: tier.max_days,
                              })}
                        </span>
                        <span className="font-display text-ink">
                          {tier.price_per_day} {t.carDetail.perDayFull}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-ash">{t.carDetail.tierNote}</p>
              </div>
            )}

            {car.description && (
              <p className="mt-7 text-sm leading-7 text-stone">
                {car.description}
              </p>
            )}

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                interpolate(t.carDetail.whatsappInterest, {
                  brand: car.brand,
                  name: car.name,
                }),
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-[var(--radius)] border border-ink py-3.5 text-sm font-medium text-ink transition-colors duration-200 hover:border-[#25D366] hover:bg-[#25D366] hover:text-white active:scale-[0.98]"
            >
              <WhatsAppIcon size={16} />
              {t.carDetail.contactWhatsapp}
            </a>
          </div>
        </div>

        {/* Booking */}
        <div className="mt-20 border-t border-mist pt-16">
          <div className="mb-12 max-w-2xl">
            <span className="eyebrow">{t.carDetail.availabilityEyebrow}</span>
            <h2 className="mt-4 font-display text-[clamp(1.8rem,3.5vw,2.5rem)] font-medium tracking-tight text-ink">
              {t.carDetail.chooseDates}
            </h2>
            <p className="mt-3 text-sm text-stone">
              {t.carDetail.greyedBooked}
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
                  aria-label={t.carDetail.prevMonth}
                  className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-mist text-ink transition-colors hover:border-ink"
                >
                  <svg
                    className="h-4 w-4 rtl:rotate-180"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <span className="font-display text-lg font-medium capitalize text-ink">
                  {monthName(viewYear, viewMonth, locale)} {viewYear}
                </span>
                <button
                  onClick={() => {
                    if (viewMonth === 11) {
                      setViewMonth(0);
                      setViewYear((y) => y + 1);
                    } else setViewMonth((m) => m + 1);
                  }}
                  aria-label={t.carDetail.nextMonth}
                  className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-mist text-ink transition-colors hover:border-ink"
                >
                  <svg
                    className="h-4 w-4 rtl:rotate-180"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>

              <div className="mb-2 grid grid-cols-7">
                {weekdayLabels(locale).map((d, i) => (
                  <div
                    key={i}
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
                  <span>{t.common.available}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-[3px] bg-ink" />
                  <span>{t.common.selected}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-[3px] bg-mist" />
                  <span>{t.common.unavailable}</span>
                </div>
              </div>
            </div>

            {/* Booking rail */}
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="rounded-[var(--radius)] border border-mist bg-cloud p-5">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">
                  {t.carDetail.howToBook}
                </p>
                <div className="mt-4 space-y-2.5">
                  {t.carDetail.bookSteps.map((step) => (
                    <div
                      key={step}
                      className="border-s border-mist ps-3 text-xs text-stone"
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
                  {t.carDetail.pickupReturnTime}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <TimeSlotPicker
                    id="pickup-time"
                    label={t.carDetail.pickup}
                    value={pickupTime}
                    slots={pickupSlots}
                    onChange={setPickupTime}
                    disabled={noPickupSlotsToday}
                  />
                  <TimeSlotPicker
                    id="return-time"
                    label={t.carDetail.return}
                    value={returnTime}
                    slots={BOOKING_TIME_SLOTS}
                    onChange={setReturnTime}
                  />
                </div>
                {timeOrderInvalid && (
                  <p className="mt-3 text-xs font-medium text-red-600">
                    {t.carDetail.timeOrderInvalid}
                  </p>
                )}
                {noPickupSlotsToday && (
                  <p className="mt-3 text-xs font-medium text-red-600">
                    {t.carDetail.noSlotsToday}
                  </p>
                )}
              </div>

              {/* Pickup / return locations */}
              <div className="rounded-[var(--radius)] border border-mist bg-cloud p-5">
                <p className="mb-4 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">
                  {t.booking.locationsLabel}
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-stone">
                      {t.booking.pickupLocation}
                    </label>
                    <SegmentedControl
                      options={locationOptions}
                      value={pickupLocation}
                      onChange={(value) => {
                        setPickupLocation(value);
                      }}
                      ariaLabel={t.booking.pickupLocation}
                    />
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-stone">
                    <input
                      type="checkbox"
                      checked={differentReturn}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setDifferentReturn(on);
                      }}
                      className="h-4 w-4 accent-[var(--color-ink)]"
                    />
                    {differentReturnLabel}
                  </label>
                </div>
              </div>

              {/* Summary — ink band */}
              <div className="rounded-[var(--radius-lg)] bg-ink p-6 text-paper">
                <div className="space-y-4 border-b border-white/10 pb-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[0.62rem] uppercase tracking-[0.16em] text-white/45">
                      {t.carDetail.start}
                    </span>
                    <span className="text-sm font-medium text-white">
                      {startDate
                        ? `${formatDate(startDate, locale)} · ${pickupTime}`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[0.62rem] uppercase tracking-[0.16em] text-white/45">
                      {t.carDetail.end}
                    </span>
                    <span className="text-sm font-medium text-white">
                      {endDate
                        ? `${formatDate(endDate, locale)} · ${returnTime}`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[0.62rem] uppercase tracking-[0.16em] text-white/45">
                      {t.booking.locationsLabel}
                    </span>
                    <span className="text-end text-sm font-medium text-white">
                      {t.booking.locations[pickupLocation] ?? pickupLocation}
                      {effectiveReturnLocation !== pickupLocation
                        ? ` → ${t.booking.locations[effectiveReturnLocation] ?? effectiveReturnLocation}`
                        : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-4 pt-5">
                  <div>
                    <p className="text-[0.62rem] uppercase tracking-[0.16em] text-white/45">
                      {t.carDetail.totalEstimate}
                    </p>
                    <p className="mt-1 font-display text-3xl text-white">
                      {totalDays > 0
                        ? `${totalPrice} ${t.common.currency}`
                        : "—"}
                    </p>
                    {totalDays > 0 && (
                      <p className="mt-1 text-[0.7rem] text-white/50">
                        {interpolate(t.carDetail.perDayRate, {
                          rate: appliedDailyRate,
                        })}
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
                    {interpolate(t.carDetail.confirmDays, {
                      days: totalDays,
                      unit: plural(totalDays, t.units.day, locale),
                    })}
                  </button>
                ) : (
                  <p className="mt-5 text-xs text-white/55">
                    {t.carDetail.chooseEndToActivate}
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
                {t.carDetail.totalEstimate}
              </p>
              <p className="truncate font-display text-lg text-white">
                {totalDays > 0
                  ? `${totalPrice} ${t.common.currency}`
                  : t.carDetail.chooseEnd}
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              disabled={!endDate || bookingBlocked}
              className="btn-accent px-5 py-2.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t.carDetail.confirm}
            </button>
          </div>
        </div>
      )}

      {/* Booking form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-form-title"
          onClick={() => !submitting && setShowForm(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-[calc(100vw-1rem)] overflow-y-auto rounded-[var(--radius-lg)] border border-mist bg-paper p-6 shadow-md sm:max-w-md sm:p-9"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="booking-form-title"
              className="font-display text-2xl font-medium text-ink"
            >
              {t.carDetail.yourInfo}
            </h3>
            <p className="mt-1.5 text-sm text-stone">
              {t.carDetail.weWillContact}
            </p>

            <div className="mt-7 flex flex-col gap-4">
              <div>
                <label
                  htmlFor="booking-name"
                  className="mb-2 block text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-stone"
                >
                  {t.carDetail.fullName}
                </label>
                <input
                  id="booking-name"
                  ref={firstFieldRef}
                  type="text"
                  placeholder={t.carDetail.yourName}
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="input-premium"
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="booking-phone"
                  className="mb-2 block text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-stone"
                >
                  {t.carDetail.phone}
                </label>
                <input
                  id="booking-phone"
                  type="tel"
                  placeholder={t.carDetail.phonePlaceholder}
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="input-premium"
                  autoComplete="tel"
                  dir="ltr"
                  aria-invalid={phoneInvalid}
                  aria-describedby={
                    phoneInvalid ? "booking-phone-error" : undefined
                  }
                  required
                />
                {phoneInvalid && (
                  <p
                    id="booking-phone-error"
                    className="mt-1.5 text-xs font-medium text-red-600"
                  >
                    {t.carDetail.phoneInvalid}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="booking-email"
                  className="mb-2 block text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-stone"
                >
                  {t.carDetail.email}
                </label>
                <input
                  id="booking-email"
                  type="email"
                  placeholder={t.carDetail.emailPlaceholder}
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="input-premium"
                  autoComplete="email"
                  dir="ltr"
                  aria-invalid={emailInvalid}
                  aria-describedby={
                    emailInvalid ? "booking-email-error" : undefined
                  }
                />
                {emailInvalid && (
                  <p
                    id="booking-email-error"
                    className="mt-1.5 text-xs font-medium text-red-600"
                  >
                    {t.carDetail.emailInvalid}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="booking-notes"
                  className="mb-2 block text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-stone"
                >
                  {t.carDetail.notes}
                </label>
                <textarea
                  id="booking-notes"
                  placeholder={t.carDetail.notesPlaceholder}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={3}
                  className="input-premium resize-none"
                />
              </div>
            </div>

            {submitError && (
              <div
                role="alert"
                className="mt-5 rounded-[var(--radius)] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {submitError}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setShowForm(false)}
                disabled={submitting}
                className="btn-ghost flex-1 disabled:opacity-40"
              >
                {t.carDetail.cancel}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !formValid}
                className="btn-primary flex-1 disabled:opacity-40"
              >
                {submitting ? t.carDetail.submitting : t.carDetail.submit}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success modal */}
      {success && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-success-title"
        >
          <div className="w-full max-w-[calc(100vw-1rem)] rounded-[var(--radius-lg)] border border-mist bg-paper p-8 text-center shadow-md sm:max-w-sm sm:p-10">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-ink">
              <svg
                className="h-6 w-6 text-ink"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3
              id="booking-success-title"
              className="font-display text-2xl font-medium text-ink"
            >
              {t.carDetail.requestSentTitle}
            </h3>
            <p className="mt-3 text-sm leading-7 text-stone">
              {t.carDetail.requestSentDesc}
            </p>
            <button
              onClick={() => {
                setSuccess(false);
                setSubmitError(null);
                setStartDate(null);
                setEndDate(null);
              }}
              className="btn-primary mt-7 w-full"
              autoFocus
            >
              {t.carDetail.backToVehicle}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// useSearchParams() (for the carried-over booking search) requires a Suspense
// boundary. The fallback shows the same branded loading frame as the page.
function CarDetailFallback() {
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
}

export default function CarDetailPage() {
  return (
    <Suspense fallback={<CarDetailFallback />}>
      <CarDetailPageContent />
    </Suspense>
  );
}
