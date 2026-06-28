"use client";
import { useEffect, useState } from "react";
import { Reservation, Car } from "@/lib/types";
import {
  MONTHS_FR_SHORT,
  DAYS_FR,
  RESERVATION_STATUS_LABEL,
  RESERVATION_STATUS_COLOR,
} from "@/lib/constants";
import { formatDateFr } from "@/lib/dates";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div data-reveal className="card-surface p-7">
      <div className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">
        {label}
      </div>
      <div className="mt-4 font-display text-4xl font-medium text-ink">
        {value}
      </div>
      {sub && <div className="mt-2 text-xs text-ash">{sub}</div>}
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
      const [resRes, carRes] = await Promise.all([
        fetch("/api/admin/reservations", { cache: "no-store" }),
        fetch("/api/admin/cars", { cache: "no-store" }),
      ]);
      const resData = resRes.ok ? (await resRes.json()).reservations : [];
      const carData = carRes.ok ? (await carRes.json()).cars : [];
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


  if (loading)
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-[var(--radius-lg)] bg-mist" />
          ))}
        </div>
        <div className="h-64 rounded-[var(--radius-lg)] bg-mist" />
      </div>
    );

  return (
    <div>
      <div className="mb-12">
        <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-medium tracking-tight text-ink">
          Tableau de bord
        </h1>
        <p className="mt-3 text-sm text-stone">
          Bienvenue — voici un aperçu de votre activité.
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
        <StatCard label="Locations actives" value={activeNow.length} sub="aujourd'hui" />
        <StatCard label="En attente" value={pending.length} sub="à confirmer" />
        <StatCard label="Véhicules dispo" value={`${available}/${cars.length}`} sub="disponibles" />
        <StatCard label="Revenus confirmés" value={`${revenue.toLocaleString()} DT`} sub="total" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Calendar */}
        <div className="card-surface p-6 sm:p-8">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-2xl font-medium text-ink">Calendrier</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (calMonth === 0) {
                    setCalMonth(11);
                    setCalYear((y) => y - 1);
                  } else setCalMonth((m) => m - 1);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-mist text-ink transition-colors hover:border-ink"
              >
                ←
              </button>
              <span className="w-28 text-center font-display text-base text-ink">
                {MONTHS_FR_SHORT[calMonth]} {calYear}
              </span>
              <button
                onClick={() => {
                  if (calMonth === 11) {
                    setCalMonth(0);
                    setCalYear((y) => y + 1);
                  } else setCalMonth((m) => m + 1);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-mist text-ink transition-colors hover:border-ink"
              >
                →
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7">
            {DAYS_FR.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ash"
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
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-[var(--radius-sm)] text-xs font-medium transition-colors
                  ${isToday ? "bg-ink text-paper" : rsvs.length > 0 ? "bg-ink/[0.07] text-ink" : "text-stone hover:bg-ink/[0.05]"}`}
                >
                  {date.getDate()}
                  {rsvs.length > 0 && (
                    <div className={`mt-0.5 h-1 w-1 rounded-full ${isToday ? "bg-paper" : "bg-ink"}`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-mist pt-5 text-xs text-stone">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-[3px] bg-ink" />
              <span>Aujourd&apos;hui</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-[3px] bg-ink/[0.12]" />
              <span>Location active</span>
            </div>
          </div>
        </div>

        {/* Recent reservations */}
        <div className="card-surface p-6 sm:p-8">
          <h2 className="mb-6 font-display text-2xl font-medium text-ink">
            Dernières réservations
          </h2>
          {recent.length === 0 ? (
            <div className="py-12 text-center text-sm text-stone">
              Aucune réservation pour le moment.
            </div>
          ) : (
            <div className="flex flex-col">
              {recent.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between border-b border-mist py-4 last:border-0"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink">
                      {r.client_name}
                    </div>
                    <div className="mt-1 truncate text-xs text-ash">
                      {r.car
                        ? `${r.car.brand} ${r.car.name} · `
                        : "Véhicule inconnu · "}
                      {formatDateFr(r.start_date)} →{" "}
                      {formatDateFr(r.end_date)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 pl-3">
                    <div className="font-display text-base text-ink">
                      {r.total_price} DT
                    </div>
                    <span
                      className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold ${RESERVATION_STATUS_COLOR[r.status]}`}
                    >
                      {RESERVATION_STATUS_LABEL[r.status]}
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
