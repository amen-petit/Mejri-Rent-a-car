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
import Navbar from "@/components/Navbar";
import DateField from "@/components/ui/DateField";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/Feedback";
import CarGlyph from "@/components/icons/CarGlyph";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { getCarById } from "@/lib/cars";
import { getActivePromotionForCar } from "@/lib/promotions-data";
import { computePromotionSavings } from "@/lib/promotions";
import PromoBadge from "@/components/PromoBadge";
import AddonServices from "@/components/AddonServices";
import { Car, Promotion } from "@/lib/types";
import {
  WHATSAPP_NUMBER,
  BOOKING_TIME_SLOTS,
  DEFAULT_PICKUP_TIME,
  DEFAULT_RETURN_TIME,
  PICKUP_LEAD_MINUTES,
  RENTAL_LOCATIONS,
  DEFAULT_RENTAL_LOCATION,
  type RentalLocation,
} from "@/lib/constants";
import { computeBookingQuote } from "@/lib/pricing";
import { type AddonKey } from "@/lib/addons";
import { parseBookingSearch } from "@/lib/booking-search";
import { isPickupInPast, nowInTimezone, timeToMinutes } from "@/lib/time";
import { useI18n } from "@/i18n/client";
import { formatDate, interpolate, plural } from "@/i18n/format";

/** Parse "YYYY-MM-DD" to a LOCAL-midnight Date. */
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

/** True if ANY day in the [start, end] range is fully booked. Keeps the same
 *  availability guarantee the old calendar enforced, without the calendar UI. */
function rangeHasUnavailable(
  startStr: string,
  endStr: string,
  reservations: { start_date: string; end_date: string }[],
  quantity = 1,
): boolean {
  const start = parseLocalYmd(startStr);
  const end = parseLocalYmd(endStr);
  if (!start || !end || end < start) return false;
  const cur = new Date(start);
  while (cur <= end) {
    if (isDateUnavailable(new Date(cur), reservations, quantity)) return true;
    cur.setDate(cur.getDate() + 1);
  }
  return false;
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

  // Search carried over from the hero/results (dates + times + locations),
  // parsed once. It's the initial reservation intent; fully editable here.
  const presetSearch = useMemo(
    () => parseBookingSearch((key) => searchParams.get(key)),
    [searchParams],
  );

  const [car, setCar] = useState<Car | null>(null);
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState<
    { start_date: string; end_date: string }[]
  >([]);
  const [activeImage, setActiveImage] = useState(0);

  // ── Reservation state — the single source of truth. Dates are "YYYY-MM-DD"
  // strings (what DateField, the pricing engine and the API all speak). ──
  const [start, setStart] = useState(presetSearch?.start ?? "");
  const [end, setEnd] = useState(presetSearch?.end ?? "");
  const [pickupTime, setPickupTime] = useState(
    presetSearch?.startTime ?? DEFAULT_PICKUP_TIME,
  );
  const [returnTime, setReturnTime] = useState(
    presetSearch?.endTime ?? DEFAULT_RETURN_TIME,
  );
  const [pickupLocation, setPickupLocation] = useState<RentalLocation>(
    presetSearch?.pickup ?? DEFAULT_RENTAL_LOCATION,
  );
  const [returnLocation, setReturnLocation] = useState<RentalLocation>(
    presetSearch?.return ?? presetSearch?.pickup ?? DEFAULT_RENTAL_LOCATION,
  );
  // Optional add-on services (chauffeur, …). An array so more services drop in;
  // pre-filled from the search when the visitor already chose one in the hero.
  const [addonKeys, setAddonKeys] = useState<AddonKey[]>(
    presetSearch?.addons ?? [],
  );

  // Contact form (collected in the confirm modal).
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
      getActivePromotionForCar(id).catch(() => null),
    ])
      .then(([carData, unavailData, promoData]) => {
        setCar(carData);
        setUnavailable(unavailData);
        setPromotion(promoData);
      })
      .catch(() => setCar(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadCar();
  }, [loadCar]);

  // ── Pricing — authoritative quote, recomputed from the selected range. Cheap
  // and pure; the server recomputes and validates it on submit (single source
  // of truth for the amount). The user only ever sees the final total. ──
  const quote =
    car && start && end
      ? computeBookingQuote(car, start, end, promotion, addonKeys)
      : null;
  const totalDays = quote?.totalDays ?? 0;
  // Grand total (vehicle + add-ons) is what the customer pays.
  const totalPrice = quote?.grandTotal ?? 0;
  const vehicleTotal = quote?.vehicleTotal ?? 0;
  const addonLines = quote?.addons ?? [];

  // ── Time / availability validation (mirrors the server so the customer can't
  // pick something that will be rejected on submit). ──
  const isSameDay = !!start && !!end && start === end;
  const timeOrderInvalid = isSameDay && returnTime <= pickupTime;

  const agencyNow = nowInTimezone();
  const startIsToday = !!start && start === agencyNow.dateStr;
  const pickupSlots = startIsToday
    ? BOOKING_TIME_SLOTS.filter(
        (slot) => timeToMinutes(slot) > agencyNow.minutes + PICKUP_LEAD_MINUTES,
      )
    : BOOKING_TIME_SLOTS;
  const noPickupSlotsToday = startIsToday && pickupSlots.length === 0;
  const pickupInPast =
    !!start &&
    isPickupInPast(start, pickupTime, { bufferMinutes: PICKUP_LEAD_MINUTES });
  const rangeUnavailable = useMemo(
    () => rangeHasUnavailable(start, end, unavailable, car?.quantity),
    [start, end, unavailable, car?.quantity],
  );

  // If the pickup time falls out of the still-valid window (e.g. time passed
  // while the page was open), snap to the first available slot.
  useEffect(() => {
    if (!startIsToday) return;
    const valid = BOOKING_TIME_SLOTS.filter(
      (slot) => timeToMinutes(slot) > agencyNow.minutes + PICKUP_LEAD_MINUTES,
    );
    if (valid.length > 0 && !valid.includes(pickupTime)) {
      setPickupTime(valid[0]);
    }
  }, [startIsToday, agencyNow.minutes, pickupTime]);

  const datesSelected = !!start && !!end;
  const bookingReady =
    datesSelected &&
    !timeOrderInvalid &&
    !pickupInPast &&
    !noPickupSlotsToday &&
    !rangeUnavailable;
  const validationMessage = !datesSelected
    ? t.booking.errSelectDates
    : rangeUnavailable
      ? t.carDetail.unavailableRange
      : timeOrderInvalid
        ? t.carDetail.timeOrderInvalid
        : noPickupSlotsToday || pickupInPast
          ? t.carDetail.noSlotsToday
          : null;

  // Inline contact-form validation.
  const emailInvalid =
    form.email.trim() !== "" && !EMAIL_RE.test(form.email.trim());
  const phoneInvalid =
    form.phone.trim() !== "" && form.phone.replace(/\D/g, "").length < 6;
  const formValid =
    !!form.name.trim() && !!form.phone.trim() && !emailInvalid && !phoneInvalid;

  function handlePickupDate(value: string) {
    setStart(value);
    if (value && end && end < value) setEnd(value); // keep return on/after pickup
    setSubmitError(null);
  }

  // Confirm modal: focus first field on open, Escape to close, restore focus.
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
    if (!car || !start || !end || !formValid) return;
    setSubmitError(null);

    if (timeOrderInvalid) {
      toast(t.carDetail.toastReturnAfterPickup, "error");
      return;
    }
    if (pickupInPast || noPickupSlotsToday) {
      toast(t.carDetail.toastSlotPassed, "error");
      return;
    }
    if (rangeUnavailable) {
      toast(t.carDetail.unavailableRange, "error");
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
          start_date: start,
          end_date: end,
          pickup_time: pickupTime,
          return_time: returnTime,
          pickup_location: pickupLocation,
          return_location: returnLocation,
          addons: addonKeys,
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
          <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
            <div className="space-y-4">
              <div className="aspect-[4/3] rounded-[var(--radius-lg)] bg-mist" />
              <div className="h-3 w-24 rounded bg-mist" />
              <div className="h-9 w-3/4 rounded bg-mist" />
            </div>
            <div className="h-96 rounded-[var(--radius-lg)] bg-mist" />
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

  const specs: [string, string][] = [
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
  const timeOption = (slots: string[]) =>
    slots.map((slot) => ({ value: slot, label: slot }));

  const startDate = start ? parseLocalYmd(start) : null;
  const endDate = end ? parseLocalYmd(end) : null;

  const summaryLine = (
    label: string,
    dateObj: Date | null,
    time: string,
    location: RentalLocation,
  ) => (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[0.62rem] uppercase tracking-[0.16em] text-white/45">
        {label}
      </span>
      <div className="text-end">
        <div className="text-sm font-medium text-white">
          {dateObj ? `${formatDate(dateObj, locale)} · ${time}` : "—"}
        </div>
        <div className="mt-0.5 text-xs text-white/45">
          {t.booking.locations[location] ?? location}
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-paper">
      <Navbar />

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-1.5 text-sm font-medium text-stone transition-colors hover:text-ink"
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

        {/* Title — category and name: the page's main heading, centred above
            the two-column layout for a stronger hierarchy. */}
        <div data-reveal className="mb-10 text-center sm:mb-12">
          <span className="eyebrow">
            {t.enums.category[car.category] ?? car.category}
          </span>
          <h1 className="mt-4 text-balance font-display text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05] tracking-tight text-ink">
            {car.brand} {car.name}
          </h1>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            TWO INDEPENDENT COLUMNS
            Left: vehicle showcase (gallery → price/specs → features/desc).
            Right: the booking experience (form+summary → note → WhatsApp).
            Each column stacks to its OWN content height — no shared grid
            rows forcing a shorter card to stretch and leave dead space.
            Scan order (all breakpoints): vehicle info → booking → confirm.
            ════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 xl:grid-cols-[1.4fr_1.8fr] xl:gap-12">
          {/* ── LEFT: vehicle showcase ── */}
          <div className="flex flex-col lg:h-full">
            <div className="flex flex-col gap-8">
              {/* Gallery */}
              <div data-reveal="left" className="reveal-d1">
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-mist bg-cloud">
                  {car.images?.[activeImage] ? (
                    <Image
                      src={car.images[activeImage]}
                      alt={car.name}
                      fill
                      priority
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 44vw"
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
                        aria-label={`${car.name} ${i + 1}`}
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
              </div>

              {/* Price & specs */}
              <div data-reveal="left" className="reveal-d2">
                {promotion ? (
                  (() => {
                    const s = computePromotionSavings(
                      car.price_per_day,
                      promotion,
                    );
                    return (
                      <div>
                        <PromoBadge promotion={promotion} className="mb-2" />
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <span className="font-display text-2xl text-ash line-through">
                            {s.original}
                          </span>
                          <span className="font-display text-5xl text-ink tracking-tight">
                            {s.discounted}
                            <span className="ms-2 text-lg font-normal tracking-normal text-stone">
                              {t.common.perDayFull}
                            </span>
                          </span>
                          <span className="rounded-full bg-[var(--color-warm)] px-2.5 py-1 text-xs font-semibold text-ink">
                            −{s.savingsAmount} DT ({s.savingsPct}%)
                          </span>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="font-display text-5xl text-ink tracking-tight">
                    {car.price_per_day}
                    <span className="ms-2 text-lg font-normal tracking-normal text-stone">
                      {t.common.perDayFull}
                    </span>
                  </div>
                )}

                <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2">
                  {specs.map(([label, value], i) => (
                    <div
                      key={label}
                      className={`flex items-baseline gap-2.5${i > 0 ? " border-l border-mist pl-6" : ""}`}
                    >
                      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-ash">
                        {label}
                      </span>
                      <span className="font-display text-base text-ink">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features & description */}
              {(car.features?.length > 0 || car.description) && (
                <div data-reveal="left" className="reveal-d3">
                  {car.features?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {car.features.map((f) => (
                        <span key={f} className="chip">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}

                  {car.description && (
                    <p className="mt-6 text-sm leading-7 text-stone">
                      {car.description}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* WhatsApp CTA — follows the vehicle info it refers to. Pinned to
                the bottom so it lines up with the note opposite it, once both
                columns are stretched to the same row height. */}
            <div
              data-reveal="left"
              className="reveal-d4 mt-8 lg:mt-auto lg:pt-8"
            >
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  interpolate(t.carDetail.whatsappInterest, {
                    brand: car.brand,
                    name: car.name,
                  }),
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-[var(--radius)] border border-ink py-3.5 text-sm font-medium text-ink transition-colors duration-200 hover:border-[#25D366] hover:bg-[#25D366] hover:text-white active:scale-[0.98]"
              >
                <WhatsAppIcon size={16} />
                {t.carDetail.contactWhatsapp}
              </a>
            </div>
          </div>

          {/* ── RIGHT: booking experience ── */}
          <div className="flex flex-col lg:h-full">
            <div className="flex flex-col gap-6">
              {/* Form + summary: paired side by side from xl, one connected step */}
              <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
                <div data-reveal="right" className="reveal-d1">
                  <div className="flex flex-col rounded-[var(--radius-lg)] border border-mist bg-cloud p-5 sm:p-6 lg:p-7">
                    <div className="mb-5 flex items-center gap-2.5 border-b border-mist pb-4">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      <span className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-stone">
                        {t.booking.cardTitle}
                      </span>
                    </div>

                    <div className="flex flex-col gap-4">
                      {/* Pickup date + time */}
                      <div>
                        <span className="mb-2 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">
                          {t.booking.pickupDate}
                        </span>
                        <div className="flex gap-2">
                          <div className="min-w-0 flex-1">
                            <DateField
                              value={start}
                              onChange={handlePickupDate}
                              min={agencyNow.dateStr}
                              ariaLabel={t.booking.pickupDate}
                            />
                          </div>
                          <div className="w-[5.5rem] shrink-0">
                            <Select
                              options={timeOption(pickupSlots)}
                              value={pickupTime}
                              onChange={setPickupTime}
                              ariaLabel={t.booking.pickupTime}
                              align="right"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Return date + time */}
                      <div>
                        <span className="mb-2 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">
                          {t.booking.returnDate}
                        </span>
                        <div className="flex gap-2">
                          <div className="min-w-0 flex-1">
                            <DateField
                              value={end}
                              onChange={(value) => {
                                setEnd(value);
                                setSubmitError(null);
                              }}
                              min={start || agencyNow.dateStr}
                              ariaLabel={t.booking.returnDate}
                            />
                          </div>
                          <div className="w-[5.5rem] shrink-0">
                            <Select
                              options={timeOption(BOOKING_TIME_SLOTS)}
                              value={returnTime}
                              onChange={setReturnTime}
                              ariaLabel={t.booking.returnTime}
                              align="right"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Pickup location */}
                      <div>
                        <span className="mb-2 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">
                          {t.booking.pickupLocation}
                        </span>
                        <Select
                          options={locationOptions}
                          value={pickupLocation}
                          onChange={(v) =>
                            setPickupLocation(v as RentalLocation)
                          }
                          ariaLabel={t.booking.pickupLocation}
                        />
                      </div>

                      {/* Return location */}
                      <div>
                        <span className="mb-2 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">
                          {t.booking.returnLocation}
                        </span>
                        <Select
                          options={locationOptions}
                          value={returnLocation}
                          onChange={(v) =>
                            setReturnLocation(v as RentalLocation)
                          }
                          ariaLabel={t.booking.returnLocation}
                        />
                      </div>

                      {/* Optional services */}
                      <AddonServices
                        value={addonKeys}
                        onChange={setAddonKeys}
                        tone="light"
                      />
                    </div>
                  </div>
                </div>

                <div data-reveal="right" className="reveal-d2">
                  <div className="flex flex-col rounded-[var(--radius-lg)] bg-ink p-5 text-paper sm:p-6 lg:p-7">
                    <div className="space-y-5 border-b border-white/10 pb-6">
                      {summaryLine(
                        t.carDetail.pickup,
                        startDate,
                        pickupTime,
                        pickupLocation,
                      )}
                      {summaryLine(
                        t.carDetail.return,
                        endDate,
                        returnTime,
                        returnLocation,
                      )}
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-[0.62rem] uppercase tracking-[0.16em] text-white/45">
                          {t.carDetail.duration}
                        </span>
                        <span className="text-base font-medium text-white">
                          {totalDays > 0
                            ? `${totalDays} ${plural(totalDays, t.units.day, locale)}`
                            : "—"}
                        </span>
                      </div>
                    </div>

                    {/* Pricing → total → CTA: one continuous block, spaced by its own
                        content rather than stretched to match the neighbouring columns. */}
                    <div className="pt-7">
                      {totalDays > 0 && (
                        <div className="mb-6 space-y-3.5 border-b border-white/10 pb-5">
                          {/* Vehicle line (with promo strikethrough) */}
                          <div className="flex items-baseline justify-between gap-4">
                            <span className="text-sm text-white/55">
                              {t.carDetail.vehicleRental}
                            </span>
                            <span className="text-base text-white">
                              {promotion &&
                                quote &&
                                quote.originalTotal > vehicleTotal && (
                                  <span className="me-2 text-white/40 line-through">
                                    {quote.originalTotal}
                                  </span>
                                )}
                              {vehicleTotal} {t.common.currency}
                            </span>
                          </div>
                          {/* Add-on lines */}
                          {addonLines.map((line) => (
                            <div
                              key={line.key}
                              className="flex items-baseline justify-between gap-4"
                            >
                              <span className="text-sm text-white/55">
                                {t.addons[line.key].label}
                                <span className="ms-1.5 text-white/35">
                                  {line.days} × {line.daily_rate}{" "}
                                  {t.common.currency}
                                </span>
                              </span>
                              <span className="whitespace-nowrap text-base text-white">
                                {line.total} {t.common.currency}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-[0.62rem] uppercase tracking-[0.16em] text-white/45">
                        {t.carDetail.totalEstimate}
                      </p>
                      <p className="mt-2 font-display text-4xl text-white">
                        {totalDays > 0
                          ? `${totalPrice} ${t.common.currency}`
                          : "—"}
                      </p>

                      <div className="mt-8">
                        <button
                          onClick={() => setShowForm(true)}
                          disabled={!bookingReady}
                          className="btn-accent w-full py-4 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {totalDays > 0
                            ? interpolate(t.carDetail.confirmDays, {
                                days: totalDays,
                                unit: plural(totalDays, t.units.day, locale),
                              })
                            : t.carDetail.confirm}
                        </button>

                        {validationMessage && (
                          <p className="mt-3 text-center text-xs text-white/55">
                            {validationMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Flexible pricing note — pinned to the bottom so it lines up
                with the WhatsApp CTA opposite it, once both columns are
                stretched to the same row height. Same trailing gap (pt-8) as
                the left column, so the vertical rhythm matches on both sides. */}
            <div
              data-reveal="right"
              className="reveal-d3 mt-8 lg:mt-auto lg:pt-8"
            >
              <div className="flex items-start gap-4 rounded-[var(--radius-lg)] border border-mist bg-cloud p-6">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
                  </svg>
                </span>
                <div className="max-w-md">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">
                    {t.carDetail.flexiblePricingTitle}
                  </p>
                  <p className="mt-1.5 text-xs leading-6 text-stone">
                    {t.carDetail.flexiblePricingDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                setStart("");
                setEnd("");
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8 xl:grid-cols-[1.4fr_0.9fr_0.9fr] xl:gap-7">
          <div className="aspect-[4/3] rounded-[var(--radius-lg)] bg-mist" />
          <div className="h-80 rounded-[var(--radius-lg)] bg-mist" />
          <div className="h-80 rounded-[var(--radius-lg)] bg-mist" />
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
