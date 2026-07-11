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
} from "@/lib/constants";
import { getDaysBetweenStrings, formatDateFr } from "@/lib/dates";

type Mode = "date" | "range";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "navy" | "emerald" | "red" | "blue";
}) {
  return (
    <div className="card-surface p-6 sm:p-7">
      <div className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">
        {label}
      </div>
      <div className="mt-4 font-display text-4xl font-medium text-ink">{value}</div>
      {sub && <div className="mt-2 text-xs text-ash">{sub}</div>}
    </div>
  );
}

function CarRow({ entry, isRange }: { entry: CarAvailability; isRange: boolean }) {
  const [open, setOpen] = useState(false);
  const { car, totalUnits, rentedUnits, availableUnits, isOffline } = entry;
  const hasReservations = entry.reservations.length > 0;

  const ratio = totalUnits > 0 ? availableUnits / totalUnits : 0;
  const barColor = isOffline
    ? "bg-mist"
    : availableUnits === 0
      ? "bg-red-400"
      : ratio <= 0.34
        ? "bg-yellow-400"
        : "bg-ink";

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-mist bg-cloud">
      <button
        onClick={() => hasReservations && setOpen((o) => !o)}
        className={`w-full p-5 text-left transition-colors ${
          hasReservations ? "cursor-pointer hover:bg-ink/[0.02]" : "cursor-default"
        }`}
        aria-expanded={open}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Identity */}
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-mist bg-paper">
              {car.images?.[0] ? (
                <Image src={car.images[0]} alt={car.name} fill sizes="56px" className="object-cover" />
              ) : (
                <CarGlyph className="h-7 w-7 text-ash" />
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-ink">
                {car.brand} {car.name}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {isOffline ? (
                  <span className="rounded-full border border-mist bg-paper px-2.5 py-0.5 text-[0.65rem] font-semibold text-stone">
                    Hors service
                  </span>
                ) : availableUnits === 0 ? (
                  <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[0.65rem] font-semibold text-red-500">
                    Complet
                  </span>
                ) : (
                  <span className="rounded-full border border-ink/15 bg-ink/[0.05] px-2.5 py-0.5 text-[0.65rem] font-semibold text-ink">
                    {availableUnits} dispo
                  </span>
                )}
                {hasReservations && (
                  <span className="text-xs text-ash">
                    {entry.reservations.length} réservation
                    {entry.reservations.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Numbers */}
          <div className="flex shrink-0 items-center gap-6">
            {[
              [availableUnits, "Dispo"],
              [rentedUnits, isRange ? "Pic loué" : "Loué"],
              [totalUnits, "Total"],
            ].map(([n, l], idx) => (
              <div key={idx} className="text-center">
                <div className="font-display text-lg text-ink">{n}</div>
                <div className="text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-ash">
                  {l}
                </div>
              </div>
            ))}
            {hasReservations && (
              <svg
                className={`h-5 w-5 text-ash transition-transform ${open ? "rotate-180" : ""}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            )}
          </div>
        </div>

        {/* Capacity bar */}
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-mist">
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
        <div className="flex flex-col gap-3 border-t border-mist bg-paper px-5 py-4">
          {entry.reservations.map((r) => {
            const days = getDaysBetweenStrings(r.start_date, r.end_date);
            return (
              <div
                key={r.id}
                className="flex flex-col gap-3 rounded-[var(--radius)] border border-mist bg-cloud p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink">{r.client_name}</div>
                  <div className="mt-1 text-xs text-stone">
                    {formatDateFr(r.start_date)}
                    {r.pickup_time ? ` ${r.pickup_time.slice(0, 5)}` : ""} →{" "}
                    {formatDateFr(r.end_date)}
                    {r.return_time ? ` ${r.return_time.slice(0, 5)}` : ""} ({days}j)
                  </div>
                  <div className="mt-0.5 text-xs text-ash">{r.client_phone}</div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold ${RESERVATION_STATUS_COLOR[r.status]}`}
                  >
                    {RESERVATION_STATUS_LABEL[r.status]}
                  </span>
                  <a
                    href={`https://wa.me/${r.client_phone.replace(/\s/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-ink text-ink transition-colors hover:bg-[#25D366] hover:border-[#25D366] hover:text-white"
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

  const dateInputCls =
    "rounded-[var(--radius-sm)] border border-line bg-cloud px-3 py-2 text-sm font-medium text-ink focus:border-ink focus:outline-none";

  return (
    <div>
      <div className="mb-9">
        <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-medium tracking-tight text-ink">
          Disponibilité de la flotte
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-stone">
          Qui loue quoi, et combien de véhicules restent disponibles — à une date
          ou sur une période.
        </p>
      </div>

      {/* Date controls */}
      <div className="card-surface mb-8 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-end gap-4">
            {/* Mode toggle */}
            <div className="inline-flex rounded-[var(--radius)] border border-line p-1">
              {(["date", "range"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium transition-colors ${
                    mode === m ? "bg-ink text-paper" : "text-stone hover:text-ink"
                  }`}
                >
                  {m === "date" ? "Date" : "Période"}
                </button>
              ))}
            </div>

            {mode === "date" ? (
              <div className="flex flex-col gap-1">
                <label className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ash">
                  Date
                </label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={dateInputCls} />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ash">
                    Du
                  </label>
                  <input type="date" value={start} max={end} onChange={(e) => setStart(e.target.value)} className={dateInputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ash">
                    Au
                  </label>
                  <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} className={dateInputCls} />
                </div>
              </>
            )}

            <button
              onClick={() => {
                const t = todayStr();
                setMode("date");
                setDate(t);
              }}
              className="rounded-[var(--radius-sm)] border border-line px-4 py-2 text-sm font-medium text-stone transition-colors hover:border-ink hover:text-ink"
            >
              Aujourd&apos;hui
            </button>
          </div>

          {data && !loading && (
            <div className="text-sm text-stone">
              {data.isRange ? (
                <>
                  Du <span className="font-medium text-ink">{formatDateFr(data.windowStart)}</span>{" "}
                  au <span className="font-medium text-ink">{formatDateFr(data.windowEnd)}</span>
                </>
              ) : (
                <>
                  Le <span className="font-medium text-ink">{formatDateFr(data.windowStart)}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-[var(--radius-lg)] bg-mist" />
            ))}
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-[var(--radius-lg)] bg-mist" />
          ))}
        </div>
      ) : error || !data ? (
        <div className="border border-mist bg-cloud py-24 text-center">
          <div className="font-display text-2xl font-medium text-ink">
            Impossible de charger la disponibilité
          </div>
          <button onClick={load} className="btn-primary mt-6">
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
            />
            <StatCard
              label={data.isRange ? "Unités louées (pic)" : "Unités louées"}
              value={data.rentedUnits}
              sub={`${data.confirmedReservations} confirmée${data.confirmedReservations > 1 ? "s" : ""}`}
            />
            <StatCard
              label="Clients en location"
              value={data.distinctCustomers}
              sub={
                data.pendingReservations > 0
                  ? `${data.pendingReservations} demande${data.pendingReservations > 1 ? "s" : ""} en attente`
                  : "confirmés"
              }
            />
            <StatCard
              label="Taux d'utilisation"
              value={`${utilizationPct}%`}
              sub={`${data.carsFullyBooked} modèle${data.carsFullyBooked > 1 ? "s" : ""} complet${data.carsFullyBooked > 1 ? "s" : ""}`}
            />
          </div>

          {/* Per-car list */}
          {data.cars.length === 0 ? (
            <div className="border border-mist bg-cloud py-24 text-center">
              <div className="font-display text-2xl font-medium text-ink">
                Aucun véhicule
              </div>
              <div className="mt-2 text-sm text-stone">
                Ajoutez des véhicules pour voir leur disponibilité.
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
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
