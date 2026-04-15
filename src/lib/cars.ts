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

export async function getUnavailableDates(carId: string): Promise<
  {
    start_date: string;
    end_date: string;
    reservation_count?: number;
  }[]
> {
  const { data, error } = await supabase
    .from("reservations")
    .select("start_date, end_date")
    .eq("car_id", carId)
    .eq("status", "confirmed");

  if (error) return [];
  return data || [];
}

// Get cars that are fully booked today
export async function getFullyBookedCarIds(): Promise<string[]> {
  const today = new Date().toISOString().split("T")[0];

  const { data: carsData, error: carsError } = await supabase
    .from("cars")
    .select("id, quantity");

  if (carsError) return [];

  const { data: reservationData, error: reservationError } = await supabase
    .from("reservations")
    .select("car_id")
    .eq("status", "confirmed")
    .lte("start_date", today)
    .gte("end_date", today);

  if (reservationError) return [];

  const reservationCounts = new Map<string, number>();
  for (const reservation of reservationData || []) {
    reservationCounts.set(
      reservation.car_id,
      (reservationCounts.get(reservation.car_id) || 0) + 1,
    );
  }

  // Return cars that are fully booked (reservation count >= quantity)
  return (carsData || [])
    .filter((car) => {
      const count = reservationCounts.get(car.id) || 0;
      return count >= car.quantity;
    })
    .map((car) => car.id);
}
