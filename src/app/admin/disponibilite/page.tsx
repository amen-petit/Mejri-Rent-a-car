"use client";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import CarGlyph from "@/components/icons/CarGlyph";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import type {
  CarAvailability,
  FleetAvailabilitySummary,
} from "@/lib/availability";
import {
  RESERVATION_STATUS_LABEL,
  RESERVATION_STATUS_COLOR,
  MS_PER_DAY,
} from "@/lib/constants";

type Mode = "date" | "range";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function formatFr(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR");
}

function getDays(start: string, end: string): number {
  return (
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / MS_PER_DAY) +
    1
  );
}

function StatCard({
  label,
  value,
  sub,
  tone = "navy",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "navy" | "emerald" | "red" | "blue";
}) {
  const valueColor =
    tone === "emerald"
      ? "text-navy"
      : tone === "red"
        ? "text-red-500"
        : tone === "blue"
          ? "text-primary"
          : "text-navy";
  return (
    <div data-reveal className="card-surface p-6 sm:p-8">
      <div className="text-xs text-slate-600 uppercase tracking-wide font-bold mb-3">
        {label}
      </div>
      <div className={`text-4xl font-bold ${valueColor}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-2">{sub}</div>}
    </div>
  );
}

function CarRow({ entry, isRange }: { entry: CarAvailability; isRange: boolean }) {
  const [open, setOpen] = useState(false);
  const { car, totalUnits, rentedUnits, availableUnits, isOffline } = entry;
  const hasReservations = entry.reservations.length > 0;

  const ratio = totalUnits > 0 ? availableUnits / totalUnits : 0;
  const barColor = isOffline
    ? "bg-slate-300"
    : availableUnits === 0
      ? "bg-red-400"
      : ratio <= 0.34
        ? "bg-yellow-400"
        : "bg-primary";

  return (
    <div
      data-reveal-visible="true"
      className="card-surface rounded-3xl bg-white border-2 border-slate-200 overflow-hidden"
    >
      <button
        onClick={() => hasReservations && setOpen((o) => !o)}
        className={`w-full text-left p-5 transition-colors ${
          hasReservations ? "hover:bg-slate-50 cursor-pointer" : "cursor-default"
        }`}
        aria-expanded={open}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Identity */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative w-14 h-14 rounded-xl border-2 border-primary overflow-hidden shrink-0 bg-primary/10">
              {car.images?.[0] ? (
                <Image
                  src={car.images[0]}
                  alt={car.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <CarGlyph className="w-7 h-7 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-navy truncate">
                {car.brand} {car.name}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {isOffline ? (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full border-2 font-bold bg-slate-100 text-slate-500 border-slate-200">
                    Hors service
                  </span>
                ) : availableUnits === 0 ? (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full border-2 font-bold bg-red-50 text-red-500 border-red-200">
                    Complet
                  </span>
                ) : (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full border-2 font-bold bg-primary/20 text-navy border-primary">
                    {availableUnits} dispo
                  </span>
                )}
                {hasReservations && (
                  <span className="text-xs text-slate-500">
                    {entry.reservations.length} réservation
                    {entry.reservations.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Numbers */}
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-center">
              <div className="text-lg font-bold text-navy">{availableUnits}</div>
              <div className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">
                Dispo
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-slate-700">{rentedUnits}</div>
              <div className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">
                {isRange ? "Pic loué" : "Loué"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-slate-700">{totalUnits}</div>
              <div className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">
                Total
              </div>
            </div>
            {hasReservations && (
              <svg
                className={`w-5 h-5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            )}
          </div>
        </div>

        {/* Capacity bar */}
        <div className="mt-4 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{
              width: `${totalUnits > 0 ? (rentedUnits / totalUnits) * 100 : 0}%`,
            }}
          />
        </div>
      </button>

      {/* Reservation details */}
      {open && hasReservations && (
        <div className="border-t border-slate-200 bg-slate-50/60 px-5 py-4 flex flex-col gap-3">
          {entry.reservations.map((r) => {
            const days = getDays(r.start_date, r.end_date);
            return (
              <div
                key={r.id}
                className="flex flex-col gap-3 rounded-2xl bg-white border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="font-bold text-sm text-navy">{r.client_name}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    {formatFr(r.start_date)}
                    {r.pickup_time ? ` ${r.pickup_time.slice(0, 5)}` : ""} →{" "}
                    {formatFr(r.end_date)}
                    {r.return_time ? ` ${r.return_time.slice(0, 5)}` : ""} ({days}j)
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{r.client_phone}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-[11px] px-3 py-1 rounded-full border-2 font-bold flex items-center gap-1.5 ${RESERVATION_STATUS_COLOR[r.status]}`}
                  >
                    {r.status === "pending" && "⏳"}
                    {r.status === "confirmed" && "✓"}
                    {RESERVATION_STATUS_LABEL[r.status]}
                  </span>
                  <a
                    href={`https://wa.me/${r.client_phone.replace(/\s/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center w-9 h-9 rounded-xl border-2 border-primary text-navy hover:bg-primary/10 transition-colors"
                    title="Contacter sur WhatsApp"
                  >
                    <WhatsAppIcon size={14} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminAvailability() {
  const [mode, setMode] = useState<Mode>("date");
  const [date, setDate] = useState(todayStr);
  const [start, setStart] = useState(todayStr);
  const [end, setEnd] = useState(todayStr);
  const [data, setData] = useState<FleetAvailabilitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    const params =
      mode === "date"
        ? new URLSearchParams({ date })
        : new URLSearchParams({ start, end });
    try {
      const res = await fetch(`/api/admin/availability?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("request failed");
      setData(await res.json());
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [mode, date, start, end]);

  useEffect(() => {
    load();
  }, [load]);

  const utilizationPct = data ? Math.round(data.utilizationRate * 100) : 0;

  return (
    <div data-reveal className="p-4 sm:p-6 lg:p-8">
      <div data-reveal className="mb-8 sm:mb-10">
        <h1 className="text-3xl font-bold text-navy sm:text-4xl">
          Disponibilité de la flotte
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Qui loue quoi, et combien de véhicules restent disponibles — à une date
          ou sur une période.
        </p>
      </div>

      {/* Date controls */}
      <div data-reveal className="card-surface p-5 sm:p-6 mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-end gap-4">
            {/* Mode toggle */}
            <div className="inline-flex rounded-2xl border-2 border-slate-200 p-1">
              {(["date", "range"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    mode === m
                      ? "btn-primary text-white shadow-soft"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {m === "date" ? "Date" : "Période"}
                </button>
              ))}
            </div>

            {mode === "date" ? (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-wide font-bold text-slate-500">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl border-2 border-slate-200 px-3 py-2 text-sm font-semibold text-navy focus:border-primary focus:outline-none"
                />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] uppercase tracking-wide font-bold text-slate-500">
                    Du
                  </label>
                  <input
                    type="date"
                    value={start}
                    max={end}
                    onChange={(e) => setStart(e.target.value)}
                    className="rounded-xl border-2 border-slate-200 px-3 py-2 text-sm font-semibold text-navy focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] uppercase tracking-wide font-bold text-slate-500">
                    Au
                  </label>
                  <input
                    type="date"
                    value={end}
                    min={start}
                    onChange={(e) => setEnd(e.target.value)}
                    className="rounded-xl border-2 border-slate-200 px-3 py-2 text-sm font-semibold text-navy focus:border-primary focus:outline-none"
                  />
                </div>
              </>
            )}

            <button
              onClick={() => {
                const t = todayStr();
                setMode("date");
                setDate(t);
              }}
              className="rounded-xl border-2 border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Aujourd&apos;hui
            </button>
          </div>

          {data && !loading && (
            <div className="text-sm text-slate-600">
              {data.isRange ? (
                <>
                  Du <span className="font-bold text-navy">{formatFr(data.windowStart)}</span>{" "}
                  au <span className="font-bold text-navy">{formatFr(data.windowEnd)}</span>
                </>
              ) : (
                <>
                  Le{" "}
                  <span className="font-bold text-navy">
                    {formatFr(data.windowStart)}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-200 rounded-3xl" />
            ))}
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-3xl" />
          ))}
        </div>
      ) : error || !data ? (
        <div className="text-center py-24 text-slate-600">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-2xl font-bold mb-2 text-navy">
            Impossible de charger la disponibilité
          </div>
          <button
            onClick={load}
            className="mt-4 btn-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-soft"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
            <StatCard
              label="Unités disponibles"
              value={data.availableUnits}
              sub={`sur ${data.totalUnits - data.offlineUnits} en service`}
              tone="emerald"
            />
            <StatCard
              label={data.isRange ? "Unités louées (pic)" : "Unités louées"}
              value={data.rentedUnits}
              sub={`${data.confirmedReservations} confirmée${data.confirmedReservations > 1 ? "s" : ""}`}
              tone="blue"
            />
            <StatCard
              label="Clients en location"
              value={data.distinctCustomers}
              sub={
                data.pendingReservations > 0
                  ? `${data.pendingReservations} demande${data.pendingReservations > 1 ? "s" : ""} en attente`
                  : "confirmés"
              }
              tone="navy"
            />
            <StatCard
              label="Taux d'utilisation"
              value={`${utilizationPct}%`}
              sub={`${data.carsFullyBooked} modèle${data.carsFullyBooked > 1 ? "s" : ""} complet${data.carsFullyBooked > 1 ? "s" : ""}`}
              tone={utilizationPct >= 80 ? "red" : "navy"}
            />
          </div>

          {/* Per-car list */}
          {data.cars.length === 0 ? (
            <div className="text-center py-24 text-slate-600">
              <div className="text-4xl mb-4">🚗</div>
              <div className="text-2xl font-bold mb-2 text-navy">
                Aucun véhicule
              </div>
              <div className="text-base">Ajoutez des véhicules pour voir leur disponibilité.</div>
            </div>
          ) : (
            <div data-reveal className="flex flex-col gap-4">
              {data.cars.map((entry) => (
                <CarRow key={entry.car.id} entry={entry} isRange={data.isRange} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
