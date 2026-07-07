"use client";

/**
 * Accessible segmented control (single choice). Rendered as an ARIA radiogroup:
 * click or arrow-key to select. Direction-agnostic (works in LTR and RTL) and
 * themed with the editorial tokens. Reused for pickup/return location choices.
 */
import { useRef } from "react";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className = "",
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
}) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function move(current: number, delta: number) {
    const next = (current + delta + options.length) % options.length;
    onChange(options[next].value);
    btnRefs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex w-full rounded-[var(--radius)] border border-line bg-cloud p-1 ${className}`}
    >
      {options.map((option, i) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                move(i, 1);
              } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                move(i, -1);
              }
            }}
            className={`flex-1 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors duration-200 active:scale-[0.98] ${
              active
                ? "bg-ink text-paper shadow-sm"
                : "text-stone hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
