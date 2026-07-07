/**
 * Locale-aware formatting + string interpolation helpers. Pure functions, safe
 * to use in server and client components alike.
 */
import { LOCALE_META, type Locale } from "./config";

type Vars = Record<string, string | number>;

/**
 * Replace `{key}` placeholders in a template with the provided values. Unknown
 * placeholders are left untouched so a typo is visible rather than silent.
 */
export function interpolate(template: string, vars: Vars = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

/** Pick the singular/plural word form for a count in the given locale. */
export function plural(
  count: number,
  forms: { one: string; other: string },
  locale: Locale,
): string {
  // Latin locales inflect on count === 1; Arabic uses a single collective form
  // here (its full plural system is beyond what this UI needs).
  if (locale === "ar") return forms.other;
  return count === 1 ? forms.one : forms.other;
}

/** Suffix for adjective agreement (e.g. FR "disponible" → "disponibles"). */
export function pluralSuffix(count: number, locale: Locale): string {
  return locale === "fr" && count > 1 ? "s" : "";
}

/** Format a Date/ISO string using the locale's conventions (dd/mm/yyyy etc.). */
export function formatDate(
  value: string | Date,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString(LOCALE_META[locale].tag, options);
}

/** Format a number using the locale's conventions (grouping, digits). */
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_META[locale].tag).format(value);
}

/** Localized long month name for the calendar header. */
export function monthName(
  year: number,
  monthIndex: number,
  locale: Locale,
): string {
  return new Intl.DateTimeFormat(LOCALE_META[locale].tag, {
    month: "long",
  }).format(new Date(year, monthIndex, 1));
}

/**
 * Short weekday labels starting on Monday, in the given locale, for calendar
 * column headers.
 */
export function weekdayLabels(locale: Locale): string[] {
  const fmt = new Intl.DateTimeFormat(LOCALE_META[locale].tag, {
    weekday: "short",
  });
  // 2024-01-01 is a Monday — walk seven days from it.
  return Array.from({ length: 7 }, (_, i) =>
    fmt.format(new Date(2024, 0, 1 + i)),
  );
}
