/**
 * Internationalization configuration — the single source of truth for which
 * locales the site supports and how each one behaves (text direction, the BCP-47
 * tag used for date/number formatting, and the label shown in the switcher).
 *
 * To add a language later: add an entry here and a matching dictionary in
 * `src/i18n/dictionaries/`. TypeScript then forces the new dictionary to cover
 * every key, so nothing can be left untranslated.
 */

export const LOCALES = ["fr", "en", "ar"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

/** Cookie that persists the chosen locale so the server can render it directly. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** localStorage key mirroring the cookie (redundant client-side persistence). */
export const LOCALE_STORAGE_KEY = "preferred-locale";

/** One year, in seconds — how long the locale preference is remembered. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type LocaleMeta = {
  /** Native name shown in the language switcher. */
  label: string;
  /** Short code shown in the compact (mobile) switcher. */
  short: string;
  /** Emoji flag used as an affordance in the switcher. */
  flag: string;
  /** Text direction driving the `dir` attribute on <html>. */
  dir: "ltr" | "rtl";
  /** BCP-47 tag for Intl date/number formatting. */
  tag: string;
};

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  fr: { label: "Français", short: "FR", flag: "🇫🇷", dir: "ltr", tag: "fr-FR" },
  en: { label: "English", short: "EN", flag: "🇬🇧", dir: "ltr", tag: "en-GB" },
  ar: { label: "العربية", short: "AR", flag: "🇹🇳", dir: "rtl", tag: "ar-TN" },
};

/** Narrow an untrusted string (cookie value, query param) to a valid Locale. */
export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function getDir(locale: Locale): "ltr" | "rtl" {
  return LOCALE_META[locale].dir;
}
