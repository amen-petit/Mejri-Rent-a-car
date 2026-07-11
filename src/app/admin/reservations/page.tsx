"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import CarGlyph from "@/components/icons/CarGlyph";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { useToast, useConfirm } from "@/components/Feedback";
import Select from "@/components/ui/Select";
import DateField from "@/components/ui/DateField";
import { Reservation, Car } from "@/lib/types";
import {
  RESERVATION_STATUS_LABEL,
  RESERVATION_STATUS_COLOR,
} from "@/lib/constants";
import { getDaysBetweenStrings, formatDateFr } from "@/lib/dates";
import { fr } from "@/i18n/dictionaries/fr";

/** French label for a stored pickup/return location (admin is French-only). */
function locationLabel(value?: string | null): string {
  if (!value) return "—";
  return fr.booking.locations[value] ?? value;
}

type ReservationWithCar = Reservation & { car?: Car };
type StatusFilter = "all" | "pending" | "confirmed" | "cancelled";
type Counts = { all: number; pending: number; confirmed: number; cancelled: number };

const EMPTY_COUNTS: Counts = { all: 0, pending: 0, confirmed: 0, cancelled: 0 };
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const SEARCH_DEBOUNCE_MS = 300;

// UI sort presets → (column, direction). Keeps the control simple while the
// server validates the underlying field against its own whitelist.
const SORT_OPTIONS = [
  { key: "recent", label: "Plus récentes", field: "created_at", dir: "desc" },
  { key: "oldest", label: "Plus anciennes", field: "created_at", dir: "asc" },
  { key: "start", label: "Date de début", field: "start_date", dir: "asc" },
  { key: "price", label: "Prix (élevé → bas)", field: "total_price", dir: "desc" },
  { key: "name", label: "Nom du client (A → Z)", field: "client_name", dir: "asc" },
] as const;
type SortKey = (typeof SORT_OPTIONS)[number]["key"];

// Shared control styling for the filter toolbar — uniform height, hairline
// border, ink focus ring. Keeps every field visually aligned.
const controlCls =
  "h-10 rounded-[var(--radius-sm)] border border-line bg-paper px-3 text-sm text-ink transition-colors focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10";
const capCls =
  "text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-ash";

export default function AdminReservations() {
  const toast = useToast();
  const confirm = useConfirm();

  const [reservations, setReservations] = useState<ReservationWithCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters / query state
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); // debounced value sent to the API
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [pageSize, setPageSize] = useState<number>(20);
  const [page, setPage] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);

  // Server response state
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS);

  // Interaction state
  const [selected, setSelected] = useState<ReservationWithCar | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  // Concurrency guards: ignore out-of-order responses + abort superseded fetches.
  const reqIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  // Signature of the inputs the tab counts depend on (NOT status/sort/page/size).
  // We only re-request the 4 count queries when this changes; updated once a
  // response carrying counts is applied, so it's robust to strict-mode double
  // effects and out-of-order responses.
  const countsSigRef = useRef<string | null>(null);

  const sort = useMemo(
    () => SORT_OPTIONS.find((o) => o.key === sortKey) ?? SORT_OPTIONS[0],
    [sortKey],
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const hasActiveFilters =
    filter !== "all" ||
    search !== "" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    sortKey !== "recent";

  // Debounce the search box so we don't fire a request on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  // What the tab counts depend on (search + date window + manual refresh). They
  // are independent of status/sort/page/pageSize, so switching tabs or paging
  // never needs the 4 extra count queries.
  const countsSig = JSON.stringify({ search, dateFrom, dateTo, refreshTick });
  // Everything that should trigger a refetch of the list page.
  const fetchSig = JSON.stringify({
    filter,
    search,
    dateFrom,
    dateTo,
    sortKey,
    pageSize,
    page,
    refreshTick,
  });

  useEffect(() => {
    const includeCounts = countsSigRef.current !== countsSig;

    const reqId = ++reqIdRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(false);

    const params = new URLSearchParams({
      status: filter,
      page: String(page),
      pageSize: String(pageSize),
      sort: sort.field,
      dir: sort.dir,
    });
    if (search) params.set("q", search);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    if (includeCounts) params.set("includeCounts", "1");

    fetch(`/api/admin/reservations?${params}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("request failed");
        return res.json();
      })
      .then((data) => {
        if (reqId !== reqIdRef.current) return; // a newer request won
        setReservations(data.reservations || []);
        setTotal(data.total || 0);
        if (data.counts) {
          setCounts(data.counts);
          countsSigRef.current = countsSig; // counts now match this filter context
        }
      })
      .catch((err) => {
        if (controller.signal.aborted || reqId !== reqIdRef.current) return;
        if (err?.name === "AbortError") return;
        setError(true);
      })
      .finally(() => {
        if (reqId === reqIdRef.current) setLoading(false);
      });

    return () => controller.abort();
    // fetchSig/countsSig encode all the inputs read above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchSig]);

  function changeFilter(next: StatusFilter) {
    setSelected(null);
    setPage(1);
    setFilter(next);
  }

  function resetFilters() {
    setFilter("all");
    setSearchInput("");
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setSortKey("recent");
    setPage(1);
  }

  async function updateStatus(id: string, status: "confirmed" | "cancelled") {
    setUpdating(id);
    // Status change + customer email are handled server-side.
    try {
      const res = await fetch(`/api/admin/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("update failed");
      if (selected?.id === id) setSelected((s) => (s ? { ...s, status } : null));
      toast(
        status === "confirmed"
          ? "Réservation confirmée. Le client a été notifié."
          : "Réservation annulée. Le client a été notifié.",
        "success",
      );
      setRefreshTick((t) => t + 1);
    } catch {
      toast("La mise à jour a échoué. Veuillez réessayer.", "error");
    } finally {
      setUpdating(null);
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: "Supprimer cette réservation ?",
      message: "Cette action est définitive et ne peut pas être annulée.",
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/reservations/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete failed");
      setSelected(null);
      toast("Réservation supprimée.", "success");
      setRefreshTick((t) => t + 1);
    } catch {
      toast("La suppression a échoué. Veuillez réessayer.", "error");
    }
  }


  // Skeleton only on the very first load (no data yet); later refetches keep the
  // current list visible under a subtle busy overlay so the view doesn't flash.
  const showSkeleton = loading && reservations.length === 0 && !error;
  const showBusy = loading && reservations.length > 0;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-medium tracking-tight text-ink">
            Réservations
          </h1>
          <p className="mt-3 text-sm text-stone">
            {counts.all} réservation{counts.all > 1 ? "s" : ""} au total
          </p>
        </div>
        <button
          onClick={() => setRefreshTick((t) => t + 1)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-line px-3.5 py-2 text-sm font-medium text-stone transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
        >
          <svg
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          Actualiser
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="card-surface mb-6 p-4 sm:p-5">
        {/* Search — prominent, full width */}
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ash"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher un client, un téléphone, un email…"
            aria-label="Rechercher une réservation"
            className={`${controlCls} h-11 w-full pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden`}
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              aria-label="Effacer la recherche"
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ash transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Controls row */}
        <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-4">
          {/* Period */}
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <span className={capCls}>Période · du</span>
              <DateField
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(v) => {
                  setDateFrom(v);
                  setPage(1);
                }}
                ariaLabel="Date de début de la période"
                className="w-36"
              />
            </div>
            <span className="pb-2.5 text-ash">→</span>
            <div className="flex flex-col gap-1.5">
              <span className={capCls}>Au</span>
              <DateField
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(v) => {
                  setDateTo(v);
                  setPage(1);
                }}
                ariaLabel="Date de fin de la période"
                className="w-36"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="hidden h-10 w-px self-end bg-mist sm:block" />

          {/* Sort */}
          <div className="flex flex-col gap-1.5">
            <span className={capCls}>Trier par</span>
            <Select
              value={sortKey}
              onChange={(v) => {
                setSortKey(v as SortKey);
                setPage(1);
              }}
              options={SORT_OPTIONS.map((o) => ({ value: o.key, label: o.label }))}
              ariaLabel="Trier les réservations"
              className="w-52"
            />
          </div>

          {/* Page size */}
          <div className="flex flex-col gap-1.5">
            <span className={capCls}>Par page</span>
            <Select
              value={String(pageSize)}
              onChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
              options={PAGE_SIZE_OPTIONS.map((n) => ({
                value: String(n),
                label: String(n),
              }))}
              ariaLabel="Réservations par page"
              className="w-24"
            />
          </div>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="ml-auto inline-flex h-10 items-center gap-1.5 self-end rounded-[var(--radius-sm)] px-3 text-xs font-medium text-stone transition-colors hover:bg-ink/[0.04] hover:text-ink"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(["all", "pending", "confirmed", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => changeFilter(f)}
            aria-pressed={filter === f}
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

      {/* Result summary */}
      {!showSkeleton && !error && total > 0 && (
        <p className="mb-4 text-xs text-ash" aria-live="polite">
          {rangeStart}–{rangeEnd} sur {total}
        </p>
      )}

      {showSkeleton ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-[var(--radius-lg)] bg-mist" />
          ))}
        </div>
      ) : error ? (
        <div className="border border-mist bg-cloud py-24 text-center">
          <div className="font-display text-2xl font-medium text-ink">
            Impossible de charger les réservations
          </div>
          <div className="mt-2 text-sm text-stone">
            Une erreur est survenue. Vérifiez votre connexion, puis réessayez.
          </div>
          <button
            onClick={() => setRefreshTick((t) => t + 1)}
            className="btn-primary mt-7"
          >
            Réessayer
          </button>
        </div>
      ) : reservations.length === 0 ? (
        <div className="border border-mist bg-cloud py-24 text-center">
          <div className="font-display text-2xl font-medium text-ink">
            {hasActiveFilters
              ? "Aucune réservation trouvée"
              : "Aucune réservation"}
          </div>
          <div className="mt-2 text-sm text-stone">
            {hasActiveFilters
              ? "Essayez d'ajuster votre recherche ou vos filtres."
              : "Les réservations apparaîtront ici."}
          </div>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="btn-outline mt-7">
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          {/* List */}
          <div
            className={`flex min-w-0 flex-col gap-3 transition-opacity ${
              showBusy ? "pointer-events-none opacity-60" : "opacity-100"
            }`}
            aria-busy={showBusy}
          >
            {reservations.map((r) => {
              const days = getDaysBetweenStrings(r.start_date, r.end_date);
              const car = r.car;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelected(r)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(r);
                    }
                  }}
                  className={`cursor-pointer rounded-[var(--radius-lg)] border bg-cloud p-5 transition-colors focus:outline-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/20 ${
                    selected?.id === r.id
                      ? "border-ink bg-ink/[0.03]"
                      : "border-mist hover:border-ink"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4 sm:items-center">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-mist bg-paper">
                        {car?.images?.[0] ? (
                          <Image src={car.images[0]} alt={car.name} fill sizes="56px" className="object-cover" />
                        ) : (
                          <CarGlyph className="h-7 w-7 text-ash" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink">
                          {r.client_name || "Client inconnu"}
                        </div>
                        <div className="mt-1 text-xs text-stone">
                          {car ? `${car.brand} ${car.name}` : "Véhicule supprimé"}{" "}
                          ·{" "}
                          {formatDateFr(r.start_date)} →{" "}
                          {formatDateFr(r.end_date)} ({days}j)
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
                      aria-label="Fermer les détails"
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
                        <Image src={selected.car.images[0]} alt={selected.car.name || "Voiture"} fill sizes="56px" className="object-cover" />
                      ) : (
                        <CarGlyph className="h-7 w-7 text-ash" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink">
                        {selected.car
                          ? `${selected.car.brand} ${selected.car.name}`
                          : "Véhicule supprimé"}
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
                        `${formatDateFr(selected.start_date)}${selected.pickup_time ? ` à ${selected.pickup_time.slice(0, 5)}` : ""}`,
                      ],
                      [
                        "Départ",
                        `${formatDateFr(selected.end_date)}${selected.return_time ? ` à ${selected.return_time.slice(0, 5)}` : ""}`,
                      ],
                      ["Lieu de départ", locationLabel(selected.pickup_location)],
                      ["Lieu de retour", locationLabel(selected.return_location)],
                      [
                        "Durée",
                        `${getDaysBetweenStrings(selected.start_date, selected.end_date)} jour${getDaysBetweenStrings(selected.start_date, selected.end_date) > 1 ? "s" : ""}`,
                      ],
                      [
                        "Demande le",
                        formatDateFr(selected.created_at),
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
