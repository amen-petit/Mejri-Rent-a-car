"use client";

/**
 * Accessible custom date input. The native date picker's calendar popup can't
 * be styled, so we render our own editorial calendar popover. Value is a
 * "YYYY-MM-DD" string (or "" when empty); min/max bound the selectable range.
 *
 * The popover is rendered in a PORTAL with fixed positioning so it can never be
 * clipped by an ancestor's `overflow-hidden` (e.g. the hero section) or trapped
 * behind a sibling's stacking context. It follows the trigger on scroll/resize.
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatDateOnly } from "@/lib/dates";
import { useI18n } from "@/i18n/client";
import { formatDate, monthName, weekdayLabels } from "@/i18n/format";

// Parse a YYYY-MM-DD string to a LOCAL midnight Date — the calendar renders in
// the user's own timezone, which is what a date picker should show.
function parseLocalDate(value?: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return date;
}

const POPOVER_WIDTH = 288; // px (18rem)
const POPOVER_EST_HEIGHT = 380; // px, only to decide whether to flip upward

export default function DateField({
  value,
  onChange,
  min,
  max,
  ariaLabel,
  placeholder,
  className = "",
  tone = "light",
}: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  /** "dark" restyles the field + calendar popover for dark surfaces. */
  tone?: "light" | "dark";
}) {
  const { t, locale } = useI18n();
  const dark = tone === "dark";
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selected = parseLocalDate(value);
  const minDate = parseLocalDate(min);
  const maxDate = parseLocalDate(max);

  const initial = selected ?? new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  // Position the portalled popover under (or above) the trigger, clamped to the
  // viewport, and keep it attached while open. Measures the popover's REAL
  // height (it's rendered hidden until positioned) so a flipped-up calendar sits
  // flush above the field instead of floating with a gap. Re-runs when the month
  // changes, since a 5-row vs 6-row month is a different height.
  useEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const gap = 6;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const height = popoverRef.current?.offsetHeight || POPOVER_EST_HEIGHT;
      const width = Math.min(POPOVER_WIDTH, vw - 16);
      let left = Math.min(rect.left, vw - width - 8);
      left = Math.max(8, left);
      // Prefer opening below; flip above (bottom flush to the field) when there
      // isn't room, using the measured height so there's no dangling gap.
      let top = rect.bottom + gap;
      if (top + height > vh - 8) {
        top = rect.top - gap - height;
      }
      top = Math.max(8, Math.min(top, vh - height - 8));
      setCoords({ top, left });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, viewYear, viewMonth]);

  // Close on outside click (accounting for the portalled popover) / Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Sync the visible month to the selection each time we open.
  useEffect(() => {
    if (!open) return;
    const base = selected ?? new Date();
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    // selected is derived from value; only react to open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday-based
  const calDays: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from(
      { length: lastDay.getDate() },
      (_, i) => new Date(viewYear, viewMonth, i + 1),
    ),
  ];

  function isDisabled(d: Date): boolean {
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  const label = selected
    ? formatDate(selected, locale)
    : (placeholder ?? t.booking.datePlaceholder);

  const popover = open
    ? createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label={ariaLabel}
            style={{
              position: "fixed",
              top: coords?.top ?? 0,
              left: coords?.left ?? 0,
              width: POPOVER_WIDTH,
              // Rendered but invisible until measured + positioned (no flash,
              // and offsetHeight is readable for accurate flip-up placement).
              visibility: coords ? "visible" : "hidden",
            }}
            className={`z-[60] max-w-[calc(100vw-1rem)] rounded-[var(--radius)] border p-3 ${
              dark
                ? "border-white/10 bg-[#1c1d24] shadow-[0_24px_60px_-16px_rgba(0,0,0,0.9)]"
                : "border-mist bg-paper shadow-md"
            }`}
          >
            {/* Month nav */}
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={prevMonth}
                aria-label={t.carDetail.prevMonth}
                className={`flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border transition-colors ${
                  dark
                    ? "border-white/12 text-white hover:border-white/30"
                    : "border-mist text-ink hover:border-ink"
                }`}
              >
                <svg className="h-4 w-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <span
                className={`font-display text-sm font-medium capitalize ${
                  dark ? "text-white" : "text-ink"
                }`}
              >
                {monthName(viewYear, viewMonth, locale)} {viewYear}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                aria-label={t.carDetail.nextMonth}
                className={`flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border transition-colors ${
                  dark
                    ? "border-white/12 text-white hover:border-white/30"
                    : "border-mist text-ink hover:border-ink"
                }`}
              >
                <svg className="h-4 w-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>

            {/* Weekday header */}
            <div className="mb-1 grid grid-cols-7">
              {weekdayLabels(locale).map((d, i) => (
                <div
                  key={i}
                  className={`py-1 text-center text-[0.55rem] font-semibold uppercase tracking-[0.08em] ${
                    dark ? "text-white/40" : "text-ash"
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-0.5">
              {calDays.map((date, i) => {
                if (!date) return <span key={i} />;
                const isSelected =
                  selected && date.toDateString() === selected.toDateString();
                const disabled = isDisabled(date);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange(formatDateOnly(date));
                      setOpen(false);
                    }}
                    className={`flex aspect-square items-center justify-center rounded-[var(--radius-sm)] text-sm transition-colors ${
                      isSelected
                        ? dark
                          ? "bg-accent font-medium text-white"
                          : "bg-ink font-medium text-paper"
                        : disabled
                          ? dark
                            ? "cursor-not-allowed text-white/25"
                            : "cursor-not-allowed text-ash/50"
                          : dark
                            ? "text-white/85 hover:bg-white/[0.08]"
                            : "text-ink hover:bg-ink/[0.06]"
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div
              className={`mt-2 flex items-center justify-between border-t pt-2 ${
                dark ? "border-white/10" : "border-mist"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className={`text-xs font-medium transition-colors ${
                  dark
                    ? "text-white/50 hover:text-white"
                    : "text-stone transition-colors hover:text-ink"
                }`}
              >
                {t.booking.clear}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={`text-xs font-medium transition-colors ${
                  dark
                    ? "text-white/50 hover:text-white"
                    : "text-stone transition-colors hover:text-ink"
                }`}
              >
                {t.booking.close}
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] border px-3 text-sm transition-colors focus:outline-none focus:ring-2 ${
          dark
            ? "border-white/12 bg-white/[0.04] hover:border-white/25 focus:border-accent focus:ring-accent/30"
            : "border-line bg-paper hover:border-ink focus:border-ink focus:ring-ink/10"
        }`}
      >
        <span
          className={
            selected
              ? dark
                ? "text-white"
                : "text-ink"
              : dark
                ? "text-white/40"
                : "text-ash"
          }
        >
          {label}
        </span>
        <svg className={`h-4 w-4 shrink-0 ${dark ? "text-white/45" : "text-ash"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <rect x="3" y="4.5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 2.5v4M16 2.5v4" />
        </svg>
      </button>

      {popover}
    </div>
  );
}
