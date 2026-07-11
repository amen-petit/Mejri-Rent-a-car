/**
 * Server-side admin helper: detect a conflicting promotion. Takes a Supabase
 * client (the caller passes the service-role admin client) so this stays a pure
 * query helper reused by both the create and edit routes — the overlap rule
 * lives in exactly one place.
 *
 * Two enabled promotions conflict when they cover the same car and their
 * inclusive date ranges intersect (`existing.start <= new.end` AND
 * `existing.end >= new.start`), regardless of "today" — a future campaign that
 * overlaps another future campaign is still a conflict.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export async function hasOverlappingActivePromotion(
  supabase: SupabaseClient,
  carId: string,
  startDate: string,
  endDate: string,
  excludeId?: string,
): Promise<boolean> {
  let query = supabase
    .from("promotions")
    .select("id")
    .eq("car_id", carId)
    .eq("is_active", true)
    .lte("start_date", endDate)
    .gte("end_date", startDate);

  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query.limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
