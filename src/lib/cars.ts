import { unstable_cache } from "next/cache";
import { supabase } from "./supabase";
import { Car } from "./types";
import {
  CARS_CACHE_TAG,
  CARS_CACHE_REVALIDATE_SECONDS,
  PROMOS_CACHE_TAG,
} from "./constants";
import { getActivePromotions } from "./promotions-data";

export async function getCars(): Promise<Car[]> {
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Cached fleet read for hot public pages (the home fleet). The car list only
 * changes when an admin mutates a car, so we serve it from Next's data cache
 * rather than querying Supabase on every request, and bust `CARS_CACHE_TAG` on
 * every admin car write. The revalidate window is a bounded-staleness safety net.
 *
 * Safe to cache: the result feeds display only — bookings are still validated
 * against live availability by the atomic RPC, so a briefly-stale card can never
 * cause an overbooking. Must NOT read cookies/headers inside this scope
 * (`unstable_cache` forbids uncached request data); the anon query is fine.
 */
export const getCachedCars = unstable_cache(getCars, ["cars-list"], {
  tags: [CARS_CACHE_TAG],
  revalidate: CARS_CACHE_REVALIDATE_SECONDS,
});

/**
 * Cached read of currently-active promotions for the public pages. Same tag/
 * window rationale as `getCachedCars`; busted whenever an admin mutates a
 * promotion. Server-only (uses `unstable_cache`) — the home Server Component
 * merges this with the fleet; client pages use the anon fetches in
 * `promotions-data.ts` instead.
 */
export const getCachedActivePromotions = unstable_cache(
  getActivePromotions,
  ["active-promotions"],
  { tags: [PROMOS_CACHE_TAG], revalidate: CARS_CACHE_REVALIDATE_SECONDS },
);

export async function getCarById(id: string): Promise<Car | null> {
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}
