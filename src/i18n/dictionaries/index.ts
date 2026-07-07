import type { Locale } from "../config";
import { fr, type Messages } from "./fr";
import { en } from "./en";
import { ar } from "./ar";

/** All dictionaries keyed by locale. Plain data — safe to import on both sides. */
export const dictionaries: Record<Locale, Messages> = { fr, en, ar };

export type { Messages };

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}
