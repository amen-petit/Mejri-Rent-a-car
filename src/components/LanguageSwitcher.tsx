"use client";

/**
 * Language switcher. Two presentations from one source of truth:
 *  - "dropdown" (default): compact popover for the navbar bar.
 *  - "inline": full-width segmented control for the mobile menu.
 *
 * Selecting a language persists it (cookie + localStorage) and flips RTL/LTR via
 * the I18n context — see `setLocale`.
 */
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { LOCALES, LOCALE_META, type Locale } from "@/i18n/config";

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  );
}

export default function LanguageSwitcher({
  variant = "dropdown",
  onSelect,
}: {
  variant?: "dropdown" | "inline";
  onSelect?: () => void;
}) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  function choose(next: Locale) {
    setLocale(next);
    setOpen(false);
    onSelect?.();
  }

  if (variant === "inline") {
    return (
      <div>
        <p className="mb-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">
          {t.nav.language}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {LOCALES.map((code) => {
            const active = code === locale;
            return (
              <button
                key={code}
                type="button"
                onClick={() => choose(code)}
                aria-pressed={active}
                className={`flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border px-3 py-2.5 text-sm font-medium transition-colors active:scale-[0.97] ${
                  active
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-stone hover:border-ink hover:text-ink"
                }`}
              >
                <span aria-hidden>{LOCALE_META[code].flag}</span>
                {LOCALE_META[code].short}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t.nav.language}
        className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-sm)] border border-mist px-2.5 text-sm text-ink transition-colors duration-200 hover:border-ink"
      >
        <GlobeIcon className="text-stone" />
        <span className="font-medium">{LOCALE_META[locale].short}</span>
        <svg
          className={`h-3.5 w-3.5 text-ash transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t.nav.language}
          className="absolute end-0 z-50 mt-1.5 w-40 overflow-hidden rounded-[var(--radius)] border border-mist bg-paper p-1 shadow-md"
        >
          {LOCALES.map((code) => {
            const active = code === locale;
            return (
              <li key={code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => choose(code)}
                  className={`flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm transition-colors ${
                    active
                      ? "bg-ink text-paper"
                      : "text-ink hover:bg-ink/[0.04]"
                  }`}
                >
                  <span aria-hidden className="text-base leading-none">
                    {LOCALE_META[code].flag}
                  </span>
                  <span className="flex-1 text-start">
                    {LOCALE_META[code].label}
                  </span>
                  {active && (
                    <svg
                      className="h-3.5 w-3.5"
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
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
