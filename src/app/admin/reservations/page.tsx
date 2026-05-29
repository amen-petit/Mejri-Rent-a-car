"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import CarGlyph from "@/components/icons/CarGlyph";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { Reservation, Car } from "@/lib/types";
import {
  RESERVATION_STATUS_LABEL,
  RESERVATION_STATUS_COLOR,
  MS_PER_DAY,
} from "@/lib/constants";

type ReservationWithCar = Reservation & { car?: Car };

export default function AdminReservations() {
  const PAGE_SIZE = 20;
  const EMPTY_COUNTS = { all: 0, pending: 0, confirmed: 0, cancelled: 0 };

  const [reservations, setReservations] = useState<ReservationWithCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "confirmed" | "cancelled"
  >("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [selected, setSelected] = useState<ReservationWithCar | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function load(targetPage = page, targetFilter = filter) {
    setLoading(true);
    const params = new URLSearchParams({
      status: targetFilter,
      page: String(targetPage),
      pageSize: String(PAGE_SIZE),
    });
    const res = await fetch(`/api/admin/reservations?${params}`, {
      cache: "no-store",
    });
    const data = res.ok
      ? await res.json()
      : { reservations: [], total: 0, counts: EMPTY_COUNTS };
    setReservations(data.reservations || []);
    setTotal(data.total || 0);
    setCounts(data.counts || EMPTY_COUNTS);
    setLoading(false);
  }

  useEffect(() => {
    load(page, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter]);

  function changeFilter(next: typeof filter) {
    setSelected(null);
    setPage(1);
    setFilter(next);
  }

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
    load(page, filter);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette réservation ?")) return;
    await fetch(`/api/admin/reservations/${id}`, { method: "DELETE" });
    setSelected(null);
    load(page, filter);
  }

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
        <h1 className="text-3xl font-bold text-navy sm:text-4xl">
          Réservations
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          {counts.all} réservation{counts.all > 1 ? "s" : ""} au total
        </p>
      </div>

      {/* Filter tabs */}
      <div data-reveal className="mb-8 flex flex-wrap gap-2">
        {(["all", "pending", "confirmed", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => changeFilter(f)}
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
      ) : reservations.length === 0 ? (
        <div className="text-center py-24 text-slate-600">
          <div className="text-4xl mb-4">📅</div>
          <div className="text-2xl font-bold mb-2 text-navy">
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
            {reservations.map((r) => {
              const days = getDays(r.start_date, r.end_date);
              const car = r.car;
              return (
                <div
                  data-reveal-visible="true"
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`card-surface relative z-10 rounded-3xl p-5 cursor-pointer transition-all bg-white ${
                    selected?.id === r.id
                      ? "border-2 border-primary bg-primary/10! shadow-soft-lg ring-2 ring-primary scale-[1.01]"
                      : "border-2 border-slate-200 hover:border-primary hover:shadow-soft"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4 sm:items-center">
                      {/* Car image */}
                      <div className="relative w-14 h-14 rounded-xl border-2 border-primary overflow-hidden shrink-0 bg-primary/10">
                        {car?.images?.[0] ? (
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

                      <div>
                        <div className="font-bold text-sm text-navy">
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
                        <div className="font-bold text-sm text-primary">
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

            {totalPages > 1 && (
              <div className="mt-2 flex items-center justify-between gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="rounded-xl border-2 border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  ← Précédent
                </button>
                <span className="text-sm font-medium text-slate-600">
                  Page {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="rounded-xl border-2 border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Suivant →
                </button>
              </div>
            )}
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
                    <h3 className="text-lg font-bold text-navy">
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
                  <div className="bg-primary/10 rounded-2xl p-4 mb-6 flex items-center gap-3 border-2 border-primary">
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
                        <CarGlyph className="w-7 h-7 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-navy">
                        {selected.car?.brand} {selected.car?.name}
                      </div>
                      <div className="text-xs text-primary font-bold mt-0.5">
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
                    <div className="bg-slate-100 rounded-xl p-3 mb-6 text-xs text-slate-700 font-medium leading-relaxed border-l-4 border-primary">
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
                      className="w-full border-2 border-primary text-navy hover:bg-primary/10 py-2.5 rounded-xl text-sm text-center font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <WhatsAppIcon size={14} />
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
