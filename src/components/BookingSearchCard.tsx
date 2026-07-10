"use client";

/**
 * The booking/search card that turns the hero into the entry point of the
 * reservation flow. Collects pickup/return date + time and locations, validates
 * client-side, then routes to /voitures with the search encoded in the URL so
 * results are shareable and the back button behaves.
 *
 * One component, two arrangements: `layout="stacked"` is the tall vertical card
 * used in the hero; `layout="bar"` is the horizontal command bar used on the
 * results page. Both share identical state, validation and submit logic — only
 * the field arrangement differs.
 *
 * Availability isn't computed here — the results page asks the server (which is
 * authoritative). This component only gathers and validates intent.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DateField from "@/components/ui/DateField";
import Select from "@/components/ui/Select";
import { useI18n } from "@/i18n/client";
import { interpolate } from "@/i18n/format";
import { nowInTimezone } from "@/lib/time";
import {
  RENTAL_LOCATIONS,
  DEFAULT_RENTAL_LOCATION,
  getAlternateRentalLocation,
  BOOKING_TIME_SLOTS,
  DEFAULT_PICKUP_TIME,
  DEFAULT_RETURN_TIME,
  type RentalLocation,
} from "@/lib/constants";
import {
  buildBookingSearchParams,
  validateBookingSearch,
  type BookingSearch,
  type BookingSearchError,
} from "@/lib/booking-search";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">
      {children}
    </span>
  );
}

export default function BookingSearchCard({
  initial,
  className = "",
  variant = "hero",
  layout = "bar",
}: {
  /** Pre-fill (used when editing an existing search). */
  initial?: Partial<BookingSearch>;
  className?: string;
  /** "hero" floats on the dark hero; "plain" is a bordered card for light bg. */
  variant?: "hero" | "plain";
  /** "stacked" is the vertical hero card; "bar" is the horizontal results bar. */
  layout?: "stacked" | "bar";
}) {
  const { t, locale } = useI18n();
  const router = useRouter();

  const today = useMemo(() => nowInTimezone().dateStr, []);

  const [start, setStart] = useState(initial?.start ?? "");
  const [end, setEnd] = useState(initial?.end ?? "");
  const [startTime, setStartTime] = useState(
    initial?.startTime ?? DEFAULT_PICKUP_TIME,
  );
  const [endTime, setEndTime] = useState(initial?.endTime ?? DEFAULT_RETURN_TIME);
  const [pickup, setPickup] = useState<RentalLocation>(
    initial?.pickup ?? DEFAULT_RENTAL_LOCATION,
  );
  const [differentReturn, setDifferentReturn] = useState(
    !!initial?.return &&
      initial.return !== (initial.pickup ?? DEFAULT_RENTAL_LOCATION),
  );
  const [error, setError] = useState<BookingSearchError | null>(null);

  const locationOptions = RENTAL_LOCATIONS.map((value) => ({
    value,
    label: t.booking.locations[value] ?? value,
  }));
  const timeOptions = useMemo(
    () => BOOKING_TIME_SLOTS.map((slot) => ({ value: slot, label: slot })),
    [],
  );
  const alternateReturnLocation = getAlternateRentalLocation(pickup);
  const differentReturnLabel = interpolate(t.booking.differentReturnTo, {
    location:
      t.booking.locations[alternateReturnLocation] ?? alternateReturnLocation,
  });

  function handlePickupDate(value: string) {
    setStart(value);
    // Keep the return on/after the pickup.
    if (value && end && end < value) setEnd(value);
    setError(null);
  }

  const errorMessage: Record<BookingSearchError, string> = {
    select: t.booking.errSelectDates,
    order: t.booking.errReturnBeforePickup,
    past: t.booking.errPastDate,
    timeOrder: t.booking.errTimeOrder,
    pastTime: t.booking.errPastTime,
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateBookingSearch(start, end, startTime, endTime);
    if (validationError) {
      setError(validationError);
      return;
    }
    const search: BookingSearch = {
      start,
      end,
      startTime,
      endTime,
      pickup,
      return: differentReturn ? alternateReturnLocation : pickup,
    };
    router.push(`/voitures?${buildBookingSearchParams(search)}`);
  }

  // ── Fields (defined once, arranged per layout) ──────────────────────────
  // A pickup/return "group" pairs the date (flexible) with a narrow time slot.
  const dateTimeGroup = (
    label: string,
    date: React.ReactNode,
    time: React.ReactNode,
  ) => (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">{date}</div>
        <div className="w-[5.5rem] shrink-0">{time}</div>
      </div>
    </div>
  );

  const pickupGroup = dateTimeGroup(
    t.booking.pickupDate,
    <DateField
      value={start}
      onChange={handlePickupDate}
      min={today}
      ariaLabel={t.booking.pickupDate}
    />,
    <Select
      options={timeOptions}
      value={startTime}
      onChange={(value) => {
        setStartTime(value);
        setError(null);
      }}
      ariaLabel={t.booking.pickupTime}
      align="right"
    />,
  );

  const returnGroup = dateTimeGroup(
    t.booking.returnDate,
    <DateField
      value={end}
      onChange={(value) => {
        setEnd(value);
        setError(null);
      }}
      min={start || today}
      ariaLabel={t.booking.returnDate}
    />,
    <Select
      options={timeOptions}
      value={endTime}
      onChange={(value) => {
        setEndTime(value);
        setError(null);
      }}
      ariaLabel={t.booking.returnTime}
      align="right"
    />,
  );

  const locationGroup = (
    <div>
      <FieldLabel>{t.booking.pickupLocation}</FieldLabel>
      <Select
        options={locationOptions}
        value={pickup}
        onChange={(value) => setPickup(value as RentalLocation)}
        ariaLabel={t.booking.pickupLocation}
      />
    </div>
  );

  const submitButton = (
    <button
      type="submit"
      className={`btn-accent h-11 w-full whitespace-nowrap px-6 ${
        layout === "bar" ? "lg:w-auto" : ""
      }`}
    >
      {t.booking.search}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="rtl:rotate-180"
        aria-hidden="true"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </button>
  );

  const differentReturnToggle = (
    <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-stone">
      <input
        type="checkbox"
        checked={differentReturn}
        onChange={(e) => setDifferentReturn(e.target.checked)}
        className="h-4 w-4 accent-[var(--color-ink)]"
      />
      {differentReturnLabel}
    </label>
  );

  // Solid surfaces, no glass. The hero variant carries a deep, brand-tinted
  // shadow so it reads as a floating command card on the dark stage.
  const shell =
    variant === "hero"
      ? "border border-mist bg-paper text-ink shadow-[0_36px_90px_-42px_rgba(0,0,0,0.62)]"
      : "border border-mist bg-paper text-ink shadow-sm";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={t.booking.cardTitle}
      className={`rounded-[var(--radius-lg)] p-5 ${
        layout === "stacked" ? "sm:p-7" : "sm:p-6"
      } ${shell} ${layout === "stacked" ? "flex h-full flex-col" : ""} ${className}`}
    >
      <div className="mb-5 flex items-center gap-2.5 border-b border-mist pb-4">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-stone">
          {t.booking.cardTitle}
        </span>
      </div>

      {layout === "stacked" ? (
        // Fields at top, CTA anchored to the bottom via mt-auto: this stretches
        // to fill whatever height the grid row ends up being (set by the car
        // showcase next to it) instead of leaving dead space under the button.
        <div className="flex flex-1 flex-col">
          <div className="flex flex-col gap-5">
            {pickupGroup}
            {returnGroup}
            {locationGroup}
          </div>
          <div className="mt-auto flex flex-col gap-4 pt-8">
            {differentReturnToggle}
            {submitButton}
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            {pickupGroup}
            {returnGroup}
            {locationGroup}
            {submitButton}
          </div>
          <div className="mt-4">{differentReturnToggle}</div>
        </>
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 text-xs font-medium text-red-600"
          lang={locale}
        >
          {errorMessage[error]}
        </p>
      )}
    </form>
  );
}
