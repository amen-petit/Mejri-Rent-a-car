"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Reservation, Car } from "@/lib/types";
import {
  RESERVATION_STATUS_LABEL,
  RESERVATION_STATUS_COLOR,
  MS_PER_DAY,
} from "@/lib/constants";

type ReservationWithCar = Reservation & { car?: Car };

export default function AdminReservations() {
  const [reservations, setReservations] = useState<ReservationWithCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "confirmed" | "cancelled"
  >("all");
  const [selected, setSelected] = useState<ReservationWithCar | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/reservations", { cache: "no-store" });
    const data = res.ok ? await res.json() : { reservations: [] };
    setReservations(data.reservations || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: "confirmed" | "cancelled") {
    setUpdating(id);
    // Status change + customer email are handled server-side.
    await fetch(`/api/admin/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(null);
    if (selected?.id === id) setSelected((s) => (s ? { ...s, status } : null));
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette réservation ?")) return;
    await fetch(`/api/admin/reservations/${id}`, { method: "DELETE" });
    setSelected(null);
    load();
  }

  const filtered = reservations.filter(
    (r) => filter === "all" || r.status === filter,
  );

  const counts = {
    all: reservations.length,
    pending: reservations.filter((r) => r.status === "pending").length,
    confirmed: reservations.filter((r) => r.status === "confirmed").length,
    cancelled: reservations.filter((r) => r.status === "cancelled").length,
  };

  function getDays(start: string, end: string) {
    return (
      Math.ceil(
        (new Date(end).getTime() - new Date(start).getTime()) / MS_PER_DAY,
      ) + 1
    );
  }

  return (
    <div data-reveal className="p-4 sm:p-6 lg:p-8">
      <div data-reveal className="mb-10 sm:mb-12">
        <h1 className="text-3xl font-bold text-navy-500 sm:text-4xl">
          Réservations
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          {reservations.length} réservation{reservations.length > 1 ? "s" : ""}{" "}
          au total
        </p>
      </div>

      {/* Filter tabs */}
      <div data-reveal className="mb-8 flex flex-wrap gap-2">
        {(["all", "pending", "confirmed", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              filter === f
                ? "btn-primary text-white shadow-soft"
                : "border-2 border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f === "all" ? "Toutes" : RESERVATION_STATUS_LABEL[f]}
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                filter === f
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-slate-200 rounded-3xl animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-slate-600">
          <div className="text-4xl mb-4">📅</div>
          <div className="text-2xl font-bold mb-2 text-navy-500">
            Aucune réservation
          </div>
          <div className="text-base">Les réservations apparaîtront ici.</div>
        </div>
      ) : (
        <div
          data-reveal
          className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
        >
          {/* List */}
          <div className="min-w-0 flex flex-col gap-4">
            {filtered.map((r) => {
              const days = getDays(r.start_date, r.end_date);
              const car = r.car;
              return (
                <div
                  data-reveal-visible="true"
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`card-surface relative z-10 rounded-3xl p-5 cursor-pointer transition-all bg-white ${
                    selected?.id === r.id
                      ? "border-2 border-[#89a9f1] bg-[#89a9f1]/10! shadow-soft-lg ring-2 ring-[#89a9f1] scale-[1.01]"
                      : "border-2 border-slate-200 hover:border-[#89a9f1] hover:shadow-soft"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4 sm:items-center">
                      {/* Car image */}
                      <div className="relative w-14 h-14 rounded-xl border-2 border-[#89a9f1] overflow-hidden shrink-0 bg-[#89a9f1]/10">
                        {car?.images?.[0] ? (
                          <Image
                            src={car.images[0]}
                            alt={car.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <svg
                            className="w-7 h-7 text-[#89a9f1]"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                          </svg>
                        )}
                      </div>

                      <div>
                        <div className="font-bold text-sm text-navy-500">
                          {r.client_name}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          {car?.brand} {car?.name} ·{" "}
                          {new Date(r.start_date).toLocaleDateString("fr-FR")} →{" "}
                          {new Date(r.end_date).toLocaleDateString("fr-FR")} (
                          {days}j)
                        </div>
                        <div className="text-xs text-slate-500">
                          {r.client_phone}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 shrink-0 sm:justify-end">
                      <div className="text-left sm:text-right">
                        <div className="font-bold text-sm text-[#89a9f1]">
                          {r.total_price} DT
                        </div>
                        <div className="text-xs text-slate-600">
                          {days} jour{days > 1 ? "s" : ""}
                        </div>
                      </div>
                      <span
                        className={`text-[11px] px-3 py-1 rounded-full border-2 font-bold flex items-center gap-1.5 ${RESERVATION_STATUS_COLOR[r.status]}`}
                      >
                        {r.status === "pending" && "⏳"}
                        {r.status === "confirmed" && "✓"}
                        {r.status === "cancelled" && "✕"}
                        {RESERVATION_STATUS_LABEL[r.status]}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail panel */}
          {selected && (
            <>
              {/* Mobile modal backdrop */}
              <div
                onClick={() => setSelected(null)}
                className="fixed inset-0 lg:hidden z-40 bg-black/40 backdrop-blur-sm"
              />
              {/* Detail panel */}
              <div
                data-reveal="right"
                className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,24rem)] max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-3xl lg:relative lg:left-auto lg:translate-x-0 lg:top-auto lg:translate-y-0 lg:w-80 lg:max-h-none lg:z-auto lg:h-fit lg:shrink-0"
              >
                <div className="card-surface rounded-3xl p-5 sm:p-6 lg:sticky lg:top-6 shadow-soft-xl overflow-x-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-navy-500">
                      Détails de réservation
                    </h3>
                    <button
                      onClick={() => setSelected(null)}
                      className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                      title="Fermer"
                    >
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Car */}
                  <div className="bg-[#89a9f1]/10 rounded-2xl p-4 mb-6 flex items-center gap-3 border-2 border-[#89a9f1]">
                    <div className="relative w-14 h-14 rounded-lg border-2 border-slate-200 overflow-hidden shrink-0 bg-slate-50">
                      {selected.car?.images?.[0] ? (
                        <Image
                          src={selected.car.images[0]}
                          alt={selected.car.name || "Voiture"}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <svg
                          className="w-7 h-7 text-[#89a9f1]"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-navy-500">
                        {selected.car?.brand} {selected.car?.name}
                      </div>
                      <div className="text-xs text-[#89a9f1] font-bold mt-0.5">
                        {selected.total_price} DT total
                      </div>
                    </div>
                  </div>

                  {/* Client info */}
                  <div className="space-y-3.5 mb-6 pb-6 border-b border-slate-200">
                    {[
                      ["Client", selected.client_name],
                      ["Téléphone", selected.client_phone],
                      ["Email", selected.client_email || "—"],
                      [
                        "Arrivée",
                        new Date(selected.start_date).toLocaleDateString(
                          "fr-FR",
                        ),
                      ],
                      [
                        "Départ",
                        new Date(selected.end_date).toLocaleDateString("fr-FR"),
                      ],
                      [
                        "Durée",
                        `${getDays(selected.start_date, selected.end_date)} jour${getDays(selected.start_date, selected.end_date) > 1 ? "s" : ""}`,
                      ],
                      [
                        "Demande le",
                        new Date(selected.created_at).toLocaleDateString(
                          "fr-FR",
                        ),
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-3"
                      >
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-500 truncate">
                          {label}
                        </span>
                        <span
                          className="font-semibold text-slate-800 text-sm text-right min-w-0"
                          style={{ overflowWrap: "anywhere" }}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  {selected.notes && (
                    <div className="bg-slate-100 rounded-xl p-3 mb-6 text-xs text-slate-700 font-medium leading-relaxed border-l-4 border-[#89a9f1]">
                      <div className="font-bold text-slate-600 mb-1.5">
                        Notes:
                      </div>
                      {selected.notes}
                    </div>
                  )}

                  {/* Status */}
                  <div className="mb-6">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                      Statut
                    </div>
                    <span
                      className={`text-xs px-3 py-2 rounded-full border-2 font-bold inline-flex items-center gap-1.5 ${RESERVATION_STATUS_COLOR[selected.status]}`}
                    >
                      {selected.status === "pending" && (
                        <span className="text-sm">⏳</span>
                      )}
                      {selected.status === "confirmed" && (
                        <span className="text-sm">✓</span>
                      )}
                      {selected.status === "cancelled" && (
                        <span className="text-sm">✕</span>
                      )}
                      {RESERVATION_STATUS_LABEL[selected.status]}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2.5">
                    {selected.status === "pending" && (
                      <>
                        <button
                          onClick={() => updateStatus(selected.id, "confirmed")}
                          disabled={updating === selected.id}
                          className="w-full btn-primary text-white py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-soft hover:shadow-soft-lg"
                        >
                          {updating === selected.id ? "..." : "✓ Confirmer"}
                        </button>
                        <button
                          onClick={() => updateStatus(selected.id, "cancelled")}
                          disabled={updating === selected.id}
                          className="w-full border-2 border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          Annuler
                        </button>
                      </>
                    )}
                    {selected.status === "confirmed" && (
                      <button
                        onClick={() => updateStatus(selected.id, "cancelled")}
                        disabled={updating === selected.id}
                        className="w-full border-2 border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Annuler la réservation
                      </button>
                    )}
                    {selected.status === "cancelled" && (
                      <button
                        onClick={() => updateStatus(selected.id, "confirmed")}
                        disabled={updating === selected.id}
                        className="w-full btn-primary text-white py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-soft hover:shadow-soft-lg"
                      >
                        Rétablir
                      </button>
                    )}

                    <a
                      href={`https://wa.me/${selected.client_phone.replace(/\s/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full border-2 border-[#89a9f1] text-[#1F2430] hover:bg-[#89a9f1]/10 py-2.5 rounded-xl text-sm text-center font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      WhatsApp
                    </a>
                    <button
                      onClick={() => handleDelete(selected.id)}
                      className="w-full text-xs text-slate-400 hover:text-red-500 font-medium transition-colors py-2 hover:bg-red-50 rounded-lg"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
