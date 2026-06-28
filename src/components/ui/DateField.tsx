"use client";

/**
 * Accessible custom date input. The native date picker's calendar popup can't
 * be styled, so we render our own editorial calendar popover. Value is a
 * "YYYY-MM-DD" string (or "" when empty); min/max bound the selectable range.
 */
import { useEffect, useRef, useState } from "react";
import { MONTHS_FR, DAYS_FR } from "@/lib/constants";

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DateField({
  value,
  onChange,
  min,
  max,
  ariaLabel,
  placeholder = "jj/mm/aaaa",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = parseDate(value);
  const minDate = parseDate(min);
  const maxDate = parseDate(max);

  const initial = selected ?? new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
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
    ? selected.toLocaleDateString("fr-FR")
    : placeholder;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-line bg-paper px-3 text-sm transition-colors hover:border-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
      >
        <span className={selected ? "text-ink" : "text-ash"}>{label}</span>
        <svg className="h-4 w-4 shrink-0 text-ash" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <rect x="3" y="4.5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 2.5v4M16 2.5v4" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={ariaLabel}
          className="absolute z-30 mt-1.5 w-[18rem] rounded-[var(--radius)] border border-mist bg-paper p-3 shadow-md"
        >
          {/* Month nav */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Mois précédent"
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-mist text-ink transition-colors hover:border-ink"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <span className="font-display text-sm font-medium text-ink">
              {MONTHS_FR[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Mois suivant"
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-mist text-ink transition-colors hover:border-ink"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>

          {/* Weekday header */}
          <div className="mb-1 grid grid-cols-7">
            {DAYS_FR.map((d) => (
              <div key={d} className="py-1 text-center text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-ash">
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
                    onChange(toStr(date));
                    setOpen(false);
                  }}
                  className={`flex aspect-square items-center justify-center rounded-[var(--radius-sm)] text-sm transition-colors ${
                    isSelected
                      ? "bg-ink font-medium text-paper"
                      : disabled
                        ? "cursor-not-allowed text-ash/50"
                        : "text-ink hover:bg-ink/[0.06]"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-2 flex items-center justify-between border-t border-mist pt-2">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-xs font-medium text-stone transition-colors hover:text-ink"
            >
              Effacer
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-stone transition-colors hover:text-ink"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
