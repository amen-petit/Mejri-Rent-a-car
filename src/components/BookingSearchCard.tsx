"use client";

/**
 * The booking/search card that turns the hero into the entry point of the
 * reservation flow. Collects pickup/return dates and locations, validates
 * client-side, then routes to /voitures with the search encoded in the URL so
 * results are shareable and the back button behaves.
 *
 * Availability isn't computed here — the results page asks the server (which is
 * authoritative). This component only gathers and validates intent.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DateField from "@/components/ui/DateField";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { useI18n } from "@/i18n/client";
import { nowInTimezone } from "@/lib/time";
import {
  RENTAL_LOCATIONS,
  DEFAULT_RENTAL_LOCATION,
  type RentalLocation,
} from "@/lib/constants";
import {
  buildBookingSearchParams,
  validateBookingDates,
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
}: {
  /** Pre-fill (used when editing an existing search). */
  initial?: Partial<BookingSearch>;
  className?: string;
  /** "hero" floats on the dark hero; "plain" is a bordered card for light bg. */
  variant?: "hero" | "plain";
}) {
  const { t, locale } = useI18n();
  const router = useRouter();

  const today = useMemo(() => nowInTimezone().dateStr, []);

  const [start, setStart] = useState(initial?.start ?? "");
  const [end, setEnd] = useState(initial?.end ?? "");
  const [pickup, setPickup] = useState<RentalLocation>(
    initial?.pickup ?? DEFAULT_RENTAL_LOCATION,
  );
  const [differentReturn, setDifferentReturn] = useState(
    !!initial?.return && initial.return !== (initial.pickup ?? DEFAULT_RENTAL_LOCATION),
  );
  const [returnLocation, setReturnLocation] = useState<RentalLocation>(
    initial?.return ?? initial?.pickup ?? DEFAULT_RENTAL_LOCATION,
  );
  const [error, setError] = useState<BookingSearchError | null>(null);

  const locationOptions = RENTAL_LOCATIONS.map((value) => ({
    value,
    label: t.booking.locations[value] ?? value,
  }));

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
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateBookingDates(start, end);
    if (validationError) {
      setError(validationError);
      return;
    }
    const search: BookingSearch = {
      start,
      end,
      pickup,
      return: differentReturn ? returnLocation : pickup,
    };
    router.push(`/voitures?${buildBookingSearchParams(search)}`);
  }

  const shell =
    variant === "hero"
      ? "border border-white/12 bg-paper/95 text-ink shadow-[0_30px_80px_-30px_rgba(0,0,0,0.75)] backdrop-blur-xl"
      : "border border-mist bg-paper text-ink shadow-sm";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={t.booking.cardTitle}
      className={`rounded-[var(--radius-lg)] p-5 sm:p-6 ${shell} ${className}`}
    >
      <div className="mb-5 flex items-center gap-2.5">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-stone">
          {t.booking.cardTitle}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr_auto] lg:items-end">
        <div>
          <FieldLabel>{t.booking.pickupDate}</FieldLabel>
          <DateField
            value={start}
            onChange={handlePickupDate}
            min={today}
            ariaLabel={t.booking.pickupDate}
          />
        </div>

        <div>
          <FieldLabel>{t.booking.returnDate}</FieldLabel>
          <DateField
            value={end}
            onChange={(value) => {
              setEnd(value);
              setError(null);
            }}
            min={start || today}
            ariaLabel={t.booking.returnDate}
          />
        </div>

        <div>
          <FieldLabel>{t.booking.pickupLocation}</FieldLabel>
          <SegmentedControl
            options={locationOptions}
            value={pickup}
            onChange={(value) => {
              setPickup(value);
              if (!differentReturn) setReturnLocation(value);
            }}
            ariaLabel={t.booking.pickupLocation}
          />
        </div>

        <button
          type="submit"
          className="btn-accent h-[2.75rem] w-full whitespace-nowrap px-6 lg:w-auto"
        >
          {t.booking.search}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-stone">
          <input
            type="checkbox"
            checked={differentReturn}
            onChange={(e) => {
              const on = e.target.checked;
              setDifferentReturn(on);
              if (!on) setReturnLocation(pickup);
            }}
            className="h-4 w-4 accent-[var(--color-ink)]"
          />
          {t.booking.differentReturn}
        </label>
      </div>

      {differentReturn && (
        <div className="mt-4 max-w-md">
          <FieldLabel>{t.booking.returnLocation}</FieldLabel>
          <SegmentedControl
            options={locationOptions}
            value={returnLocation}
            onChange={setReturnLocation}
            ariaLabel={t.booking.returnLocation}
          />
        </div>
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
