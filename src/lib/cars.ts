import { supabase } from "./supabase";
import { Car } from "./types";

export async function getCars(): Promise<Car[]> {
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getCarById(id: string): Promise<Car | null> {
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function getUnavailableDates(
  carId: string,
): Promise<{ start_date: string; end_date: string }[]> {
  const { data, error } = await supabase
    .from("reservations")
    .select("start_date, end_date")
    .eq("car_id", carId)
    .eq("status", "confirmed");

  if (error) return [];
  return data || [];
}
