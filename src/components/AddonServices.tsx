"use client";

/**
 * Optional booking add-on services, rendered as premium selectable option cards
 * (chauffeur, and future services from the ADDON_SERVICES catalog). Shared by
 * every booking form — the hero search card and the vehicle detail form — so the
 * option looks and behaves identically wherever a booking starts.
 *
 * Pricing/selection logic lives elsewhere; this is a controlled input: it takes
 * the selected keys and reports toggles. Themed for light and dark surfaces via
 * `tone`, matching the Select/DateField pattern.
 */
import { ADDON_SERVICES, type AddonKey } from "@/lib/addons";
import { useI18n } from "@/i18n/client";
import { interpolate } from "@/i18n/format";

function CheckMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function AddonServices({
  value,
  onChange,
  tone = "light",
  className = "",
}: {
  value: AddonKey[];
  onChange: (keys: AddonKey[]) => void;
  tone?: "light" | "dark";
  className?: string;
}) {
  const { t } = useI18n();
  const dark = tone === "dark";

  const toggle = (key: AddonKey) =>
    onChange(
      value.includes(key) ? value.filter((k) => k !== key) : [...value, key],
    );

  return (
    <div className={className}>
      <span
        className={`mb-2 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] ${
          dark ? "text-white/45" : "text-stone"
        }`}
      >
        {t.booking.optionalServices}
      </span>

      <div className="flex flex-col gap-2.5">
        {ADDON_SERVICES.map((svc) => {
          const selected = value.includes(svc.key);
          return (
            <button
              key={svc.key}
              type="button"
              role="checkbox"
              aria-checked={selected}
              onClick={() => toggle(svc.key)}
              className={`group flex w-full items-center gap-3 rounded-[var(--radius)] border p-3 text-start transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                selected
                  ? dark
                    ? "border-accent bg-accent/15"
                    : "border-accent bg-accent/[0.06]"
                  : dark
                    ? "border-white/12 bg-white/[0.03] hover:border-white/30"
                    : "border-line bg-paper hover:border-ink/40"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--radius-xs)] border-2 transition-colors duration-200 ${
                  selected
                    ? "border-accent bg-accent text-white"
                    : dark
                      ? "border-white/30"
                      : "border-line"
                }`}
              >
                <CheckMark
                  className={`transition-transform duration-200 ${
                    selected ? "scale-100" : "scale-0"
                  }`}
                />
              </span>

              <span className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
                <span
                  className={`text-sm font-medium ${dark ? "text-white" : "text-ink"}`}
                >
                  {t.addons[svc.key].label}
                </span>
                <span
                  className={`whitespace-nowrap text-xs font-semibold ${
                    dark ? "text-white/70" : "text-accent"
                  }`}
                >
                  {interpolate(t.carDetail.addonPerDay, {
                    price: svc.pricePerDay,
                  })}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
