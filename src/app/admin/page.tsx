"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Reservation, Car } from "@/lib/types";

const MONTHS_FR = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

function StatCard({
  label,
  value,
  sub,
  color = "emerald",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div data-reveal className="card-surface p-8">
      <div className="text-xs text-slate-600 uppercase tracking-wide font-bold mb-3">
        {label}
      </div>
      <div
        className={`text-4xl font-bold ${color === "blue" ? "text-[#89a9f1]" : color === "red" ? "text-red-500" : color === "purple" ? "text-[#a66694]" : "text-navy-500"}`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-slate-500 mt-2">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [reservations, setReservations] = useState<
    (Reservation & { car?: Car })[]
  >([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: resData }, { data: carData }] = await Promise.all([
        supabase
          .from("reservations")
          .select("*, car:cars(*)")
          .order("created_at", { ascending: false }),
        supabase.from("cars").select("*"),
      ]);
      setReservations(resData || []);
      setCars(carData || []);
      setLoading(false);
    }
    load();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const confirmed = reservations.filter((r) => r.status === "confirmed");
  const pending = reservations.filter((r) => r.status === "pending");
  const activeNow = confirmed.filter(
    (r) => r.start_date <= todayStr && r.end_date >= todayStr,
  );
  const revenue = confirmed.reduce((sum, r) => sum + Number(r.total_price), 0);
  const available = cars.filter((c) => c.is_available).length;

  // Calendar — current month
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  const firstDay = new Date(calYear, calMonth, 1);
  const lastDay = new Date(calYear, calMonth + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const calDays: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from(
      { length: lastDay.getDate() },
      (_, i) => new Date(calYear, calMonth, i + 1),
    ),
  ];

  function getReservationsForDate(date: Date) {
    const ds = date.toISOString().split("T")[0];
    return confirmed.filter((r) => r.start_date <= ds && r.end_date >= ds);
  }

  const recent = reservations.slice(0, 5);

  const statusLabel: Record<string, string> = {
    pending: "En attente",
    confirmed: "Confirmée",
    cancelled: "Annulée",
  };
  const statusColor: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    confirmed: "bg-[#89a9f1]/20 text-[#1F2430] border-[#89a9f1]",
    cancelled: "bg-red-50 text-red-500 border-red-200",
  };

  if (loading)
    return (
      <div className="space-y-6 p-4 animate-pulse sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-3xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-3xl" />
      </div>
    );

  return (
    <div data-reveal className="p-4 sm:p-6 lg:p-8">
      <div data-reveal className="mb-10 sm:mb-12">
        <h1 className="text-3xl font-bold text-navy-500 sm:text-4xl">
          Tableau de bord
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Bienvenue — voici un aperçu de votre activité.
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:mb-12 xl:grid-cols-4 xl:gap-6">
        <StatCard
          label="Locations actives"
          value={activeNow.length}
          sub="aujourd'hui"
          color="emerald"
        />
        <StatCard
          label="En attente"
          value={pending.length}
          sub="à confirmer"
          color="blue"
        />
        <StatCard
          label="Véhicules dispo"
          value={`${available}/${cars.length}`}
          sub="disponibles"
          color="navy"
        />
        <StatCard
          label="Revenus confirmés"
          value={`${revenue.toLocaleString()} DT`}
          sub="total"
          color="emerald"
        />
      </div>

      <div data-reveal className="grid gap-8 lg:grid-cols-2">
        {/* Calendar */}
        <div data-reveal="left" className="card-surface p-5 sm:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold text-navy-500">Calendrier</h2>
            <div className="flex items-center gap-3 text-base">
              <button
                onClick={() => {
                  if (calMonth === 0) {
                    setCalMonth(11);
                    setCalYear((y) => y - 1);
                  } else setCalMonth((m) => m - 1);
                }}
                className="text-slate-600 hover:text-navy-500 font-bold transition-colors"
              >
                ←
              </button>
              <span className="text-base font-bold w-32 text-center text-navy-500">
                {MONTHS_FR[calMonth]} {calYear}
              </span>
              <button
                onClick={() => {
                  if (calMonth === 11) {
                    setCalMonth(0);
                    setCalYear((y) => y + 1);
                  } else setCalMonth((m) => m + 1);
                }}
                className="text-slate-600 hover:text-navy-500 font-bold transition-colors"
              >
                →
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7">
            {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map((d) => (
              <div
                key={d}
                className="text-center text-xs text-slate-600 font-bold uppercase py-2"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calDays.map((date, i) => {
              if (!date) return <div key={i} />;
              const rsvs = getReservationsForDate(date);
              const isToday = date.toDateString() === today.toDateString();
              return (
                <div
                  key={i}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs relative transition-all duration-250 font-semibold
                  ${isToday ? "bg-[#89a9f1] text-[#1F2430] shadow-soft" : rsvs.length > 0 ? "bg-[#89a9f1]/20 text-[#1F2430]" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  {date.getDate()}
                  {rsvs.length > 0 && !isToday && (
                    <div className="w-1 h-1 rounded-full bg-[#89a9f1] mt-0.5" />
                  )}
                  {rsvs.length > 0 && isToday && (
                    <div className="w-1 h-1 rounded-full bg-white mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[#89a9f1]" />
              <span>Aujourd&apos;hui</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[#89a9f1]/20 border-2 border-[#89a9f1]" />
              <span>Location active</span>
            </div>
          </div>
        </div>

        {/* Recent reservations */}
        <div data-reveal="right" className="card-surface p-5 sm:p-8">
          <h2 className="mb-8 text-2xl font-bold text-navy-500">
            Dernières réservations
          </h2>
          {recent.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-base">
              Aucune réservation pour le moment.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {recent.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-4 px-4 border-b border-slate-200 last:border-0 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <div>
                    <div className="text-base font-semibold text-navy-500">
                      {r.client_name}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {r.car
                        ? `${r.car.brand} ${r.car.name} · `
                        : "Véhicule inconnu · "}
                      {new Date(r.start_date).toLocaleDateString("fr-FR")} →{" "}
                      {new Date(r.end_date).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-base font-bold text-[#89a9f1]">
                      {r.total_price} DT
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full border-2 font-bold flex items-center gap-1.5 ${statusColor[r.status]}`}
                    >
                      {r.status === "pending" && "⏳"}
                      {r.status === "confirmed" && "✓"}
                      {r.status === "cancelled" && "✕"}
                      {statusLabel[r.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
