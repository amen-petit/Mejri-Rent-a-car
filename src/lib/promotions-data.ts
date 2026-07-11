/**
 * Public promotion reads via the anon Supabase client. RLS only exposes
 * currently-active rows to anon, so these can never leak an expired or disabled
 * promotion to the client. Any failure degrades gracefully to "no promotion"
 * (the site falls back to the normal price). No server-only imports here, so
 * client components (listing, detail) can import this directly.
 */
import { supabase } from "./supabase";
import type { Promotion } from "./types";
import { getActivePromotion } from "./promotions";

export async function getActivePromotions(): Promise<Promotion[]> {
  const { data, error } = await supabase.from("promotions").select("*");
  if (error) return [];
  return (data as Promotion[]) ?? [];
}

export async function getActivePromotionForCar(
  carId: string,
): Promise<Promotion | null> {
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("car_id", carId);
  if (error) return null;
  return getActivePromotion((data as Promotion[]) ?? [], carId);
}
