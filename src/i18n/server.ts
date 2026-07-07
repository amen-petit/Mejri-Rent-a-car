import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, resolveLocale, type Locale } from "./config";
import { getMessages, type Messages } from "./dictionaries";

/**
 * Read the active locale from the request cookie inside Server Components. The
 * cookie is written client-side by the language switcher, so SSR renders the
 * same language the visitor last chose — no flash on navigation.
 */
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  return resolveLocale(store.get(LOCALE_COOKIE)?.value);
}

/** Convenience: locale + its dictionary for a Server Component. */
export async function getServerI18n(): Promise<{
  locale: Locale;
  t: Messages;
}> {
  const locale = await getServerLocale();
  return { locale, t: getMessages(locale) };
}
