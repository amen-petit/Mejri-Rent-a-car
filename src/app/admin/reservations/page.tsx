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
    <div>
      <div className="mb-10">
        <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-medium tracking-tight text-ink">
          Réservations
        </h1>
        <p className="mt-3 text-sm text-stone">
          {counts.all} réservation{counts.all > 1 ? "s" : ""} au total
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {(["all", "pending", "confirmed", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => changeFilter(f)}
            className={`flex items-center gap-2 rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium transition-colors active:scale-[0.97] ${
              filter === f
                ? "bg-ink text-paper"
                : "border border-line text-stone hover:border-ink hover:text-ink"
            }`}
          >
            {f === "all" ? "Toutes" : RESERVATION_STATUS_LABEL[f]}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold ${
                filter === f ? "bg-white/20 text-paper" : "bg-mist text-stone"
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
            <div key={i} className="h-20 animate-pulse rounded-[var(--radius-lg)] bg-mist" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="border border-mist bg-cloud py-24 text-center">
          <div className="font-display text-2xl font-medium text-ink">
            Aucune réservation
          </div>
          <div className="mt-2 text-sm text-stone">
            Les réservations apparaîtront ici.
          </div>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          {/* List */}
          <div className="flex min-w-0 flex-col gap-3">
            {reservations.map((r) => {
              const days = getDays(r.start_date, r.end_date);
              const car = r.car;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`cursor-pointer rounded-[var(--radius-lg)] border bg-cloud p-5 transition-colors ${
                    selected?.id === r.id
                      ? "border-ink bg-ink/[0.03]"
                      : "border-mist hover:border-ink"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4 sm:items-center">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-mist bg-paper">
                        {car?.images?.[0] ? (
                          <Image src={car.images[0]} alt={car.name} fill unoptimized className="object-cover" />
                        ) : (
                          <CarGlyph className="h-7 w-7 text-ash" />
                        )}
                      </div>

                      <div>
                        <div className="text-sm font-medium text-ink">
                          {r.client_name}
                        </div>
                        <div className="mt-1 text-xs text-stone">
                          {car?.brand} {car?.name} ·{" "}
                          {new Date(r.start_date).toLocaleDateString("fr-FR")} →{" "}
                          {new Date(r.end_date).toLocaleDateString("fr-FR")} ({days}j)
                        </div>
                        <div className="text-xs text-ash">{r.client_phone}</div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                      <div className="text-left sm:text-right">
                        <div className="font-display text-base text-ink">
                          {r.total_price} DT
                        </div>
                        <div className="text-xs text-ash">
                          {days} jour{days > 1 ? "s" : ""}
                        </div>
                      </div>
                      <span
                        className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold ${RESERVATION_STATUS_COLOR[r.status]}`}
                      >
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
                  className="rounded-[var(--radius-sm)] border border-line px-4 py-2 text-sm font-medium text-stone transition-colors hover:border-ink hover:text-ink disabled:opacity-40 disabled:hover:border-line"
                >
                  ← Précédent
                </button>
                <span className="text-sm text-stone">
                  Page {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="rounded-[var(--radius-sm)] border border-line px-4 py-2 text-sm font-medium text-stone transition-colors hover:border-ink hover:text-ink disabled:opacity-40 disabled:hover:border-line"
                >
                  Suivant →
                </button>
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <>
              <div
                onClick={() => setSelected(null)}
                className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden"
              />
              <div className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(92vw,24rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overflow-x-hidden rounded-[var(--radius-lg)] lg:relative lg:left-auto lg:top-auto lg:z-auto lg:h-fit lg:w-80 lg:max-h-none lg:shrink-0 lg:translate-x-0 lg:translate-y-0">
                <div className="card-surface overflow-x-hidden p-6 lg:sticky lg:top-6">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="font-display text-lg font-medium text-ink">
                      Détails
                    </h3>
                    <button
                      onClick={() => setSelected(null)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-ash transition-colors hover:bg-ink/5 hover:text-ink"
                      title="Fermer"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Car */}
                  <div className="mb-6 flex items-center gap-3 rounded-[var(--radius)] border border-mist bg-paper p-4">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-mist bg-cloud">
                      {selected.car?.images?.[0] ? (
                        <Image src={selected.car.images[0]} alt={selected.car.name || "Voiture"} fill unoptimized className="object-cover" />
                      ) : (
                        <CarGlyph className="h-7 w-7 text-ash" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink">
                        {selected.car?.brand} {selected.car?.name}
                      </div>
                      <div className="mt-0.5 font-display text-base text-ink">
                        {selected.total_price} DT
                      </div>
                    </div>
                  </div>

                  {/* Client info */}
                  <div className="mb-6 space-y-3.5 border-b border-mist pb-6">
                    {[
                      ["Client", selected.client_name],
                      ["Téléphone", selected.client_phone],
                      ["Email", selected.client_email || "—"],
                      [
                        "Arrivée",
                        `${new Date(selected.start_date).toLocaleDateString("fr-FR")}${selected.pickup_time ? ` à ${selected.pickup_time.slice(0, 5)}` : ""}`,
                      ],
                      [
                        "Départ",
                        `${new Date(selected.end_date).toLocaleDateString("fr-FR")}${selected.return_time ? ` à ${selected.return_time.slice(0, 5)}` : ""}`,
                      ],
                      [
                        "Durée",
                        `${getDays(selected.start_date, selected.end_date)} jour${getDays(selected.start_date, selected.end_date) > 1 ? "s" : ""}`,
                      ],
                      [
                        "Demande le",
                        new Date(selected.created_at).toLocaleDateString("fr-FR"),
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-3"
                      >
                        <span className="truncate text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ash">
                          {label}
                        </span>
                        <span
                          className="min-w-0 text-right text-sm font-medium text-ink"
                          style={{ overflowWrap: "anywhere" }}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  {selected.notes && (
                    <div className="mb-6 rounded-[var(--radius-sm)] border-l-2 border-ink bg-cloud p-3 text-xs leading-relaxed text-stone">
                      <div className="mb-1.5 font-semibold uppercase tracking-[0.12em] text-ash">
                        Notes
                      </div>
                      {selected.notes}
                    </div>
                  )}

                  {/* Status */}
                  <div className="mb-6">
                    <div className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ash">
                      Statut
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${RESERVATION_STATUS_COLOR[selected.status]}`}
                    >
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
                          className="btn-primary w-full disabled:opacity-50"
                        >
                          {updating === selected.id ? "..." : "Confirmer"}
                        </button>
                        <button
                          onClick={() => updateStatus(selected.id, "cancelled")}
                          disabled={updating === selected.id}
                          className="w-full rounded-[var(--radius)] border border-red-300 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                        >
                          Annuler
                        </button>
                      </>
                    )}
                    {selected.status === "confirmed" && (
                      <button
                        onClick={() => updateStatus(selected.id, "cancelled")}
                        disabled={updating === selected.id}
                        className="w-full rounded-[var(--radius)] border border-red-300 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                      >
                        Annuler la réservation
                      </button>
                    )}
                    {selected.status === "cancelled" && (
                      <button
                        onClick={() => updateStatus(selected.id, "confirmed")}
                        disabled={updating === selected.id}
                        className="btn-primary w-full disabled:opacity-50"
                      >
                        Rétablir
                      </button>
                    )}

                    <a
                      href={`https://wa.me/${selected.client_phone.replace(/\s/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-[var(--radius)] border border-ink py-2.5 text-sm font-medium text-ink transition-colors hover:bg-[#25D366] hover:border-[#25D366] hover:text-white"
                    >
                      <WhatsAppIcon size={14} />
                      WhatsApp
                    </a>
                    <button
                      onClick={() => handleDelete(selected.id)}
                      className="w-full rounded-[var(--radius-sm)] py-2 text-xs font-medium text-ash transition-colors hover:bg-red-50 hover:text-red-500"
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
