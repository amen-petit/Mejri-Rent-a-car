"use client";
import { useEffect, useRef } from "react";

type Props = {
  id: string;
  label: string;
  value: string;
  slots: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

const ITEM_H = 40; // px — must match h-10 in JSX

export default function TimeSlotPicker({
  id,
  label,
  value,
  slots,
  onChange,
  disabled = false,
}: Props) {
  const listRef   = useRef<HTMLUListElement>(null);
  const fromProps = useRef(false); // true while we're scrolling due to a prop change
  const debounce  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep stable refs to avoid stale closures inside the debounce callback
  const slotsRef    = useRef(slots);
  const valueRef    = useRef(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => { slotsRef.current    = slots;    }, [slots]);
  useEffect(() => { valueRef.current    = value;    }, [value]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // When the prop value changes, scroll to it without triggering onChange.
  useEffect(() => {
    const idx = slots.indexOf(value);
    if (idx === -1 || !listRef.current) return;
    fromProps.current = true;
    listRef.current.scrollTop = idx * ITEM_H;
    // Release the guard after the browser has processed the scroll
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fromProps.current = false;
    }));
  }, [value, slots]);

  function handleScroll() {
    if (disabled || fromProps.current || !listRef.current) return;
    if (debounce.current) clearTimeout(debounce.current);

    debounce.current = setTimeout(() => {
      if (!listRef.current) return;
      const idx     = Math.round(listRef.current.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, slotsRef.current.length - 1));

      // Snap to the nearest slot position
      fromProps.current = true;
      listRef.current.scrollTop = clamped * ITEM_H;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        fromProps.current = false;
      }));

      if (slotsRef.current[clamped] !== valueRef.current) {
        onChangeRef.current(slotsRef.current[clamped]);
      }
    }, 120);
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-40" : ""}>
      <label
        htmlFor={id}
        className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500"
      >
        {label}
      </label>

      {/* Fixed-height drum — clips to 3 visible rows */}
      <div className="relative h-[120px] overflow-hidden rounded-2xl border border-navy/12 bg-surface shadow-[inset_0_2px_8px_color-mix(in_srgb,var(--color-navy)_6%,transparent)]">

        {/* Top fade */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-surface to-transparent" />
        {/* Bottom fade */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-surface to-transparent" />
        {/* Active-slot highlight stripe */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-2 top-1/2 z-10 h-10 -translate-y-1/2 rounded-xl border border-primary/25
                     bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_13%,transparent),color-mix(in_srgb,var(--color-secondary)_9%,transparent))]"
        />

        <ul
          ref={listRef}
          id={id}
          role="listbox"
          aria-label={label}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-scroll overscroll-contain"
          style={{
            scrollbarWidth: "none",
            scrollSnapType: "y mandatory",
          }}
        >
          {/* Leading spacer so the first slot can sit in the centre */}
          <li aria-hidden className="h-10 shrink-0" style={{ scrollSnapAlign: "none" }} />

          {slots.map((slot) => {
            const selected = slot === value;
            return (
              <li
                key={slot}
                role="option"
                aria-selected={selected}
                onClick={() => !disabled && onChange(slot)}
                style={{ scrollSnapAlign: "center" }}
                className={`h-10 flex cursor-pointer select-none items-center justify-center text-sm font-semibold transition-colors duration-100 ${
                  selected ? "text-primary" : "text-navy/40 hover:text-navy/65"
                }`}
              >
                {slot}
              </li>
            );
          })}

          {/* Trailing spacer */}
          <li aria-hidden className="h-10 shrink-0" style={{ scrollSnapAlign: "none" }} />
        </ul>
      </div>
    </div>
  );
}
