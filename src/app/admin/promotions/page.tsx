"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast, useConfirm } from "@/components/Feedback";
import Select from "@/components/ui/Select";
import SegmentedControl from "@/components/ui/SegmentedControl";
import DateField from "@/components/ui/DateField";
import type {
  Car,
  Promotion,
  PromotionType,
  PromotionBadgeStyle,
} from "@/lib/types";
import { computePromotionSavings, isPromotionActive } from "@/lib/promotions";

type FormState = {
  car_id: string;
  discount_type: PromotionType;
  discount_value: string;
  label: string;
  badge_style: PromotionBadgeStyle;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

const today = new Date().toISOString().slice(0, 10);

const emptyForm: FormState = {
  car_id: "",
  discount_type: "percentage",
  discount_value: "",
  label: "",
  badge_style: "warm",
  start_date: today,
  end_date: today,
  is_active: true,
};

const fieldLabel =
  "mb-2 block text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-stone";

const BADGE_STYLE_OPTIONS = [
  { value: "warm", label: "Doré" },
  { value: "accent", label: "Cobalt" },
  { value: "ink", label: "Encre" },
];

function frDate(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

export default function AdminPromotions() {
  const toast = useToast();
  const confirm = useConfirm();
  const [cars, setCars] = useState<Car[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [carsRes, promosRes] = await Promise.all([
        fetch("/api/admin/cars", { cache: "no-store" }),
        fetch("/api/admin/promotions", { cache: "no-store" }),
      ]);
      if (!carsRes.ok || !promosRes.ok) throw new Error("request failed");
      const carsData = await carsRes.json();
      const promosData = await promosRes.json();
      setCars(carsData.cars || []);
      setPromotions(promosData.promotions || []);
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const carsById = useMemo(
    () => new Map(cars.map((c) => [c.id, c])),
    [cars],
  );
  const carOptions = useMemo(
    () =>
      cars.map((c) => ({
        value: c.id,
        label: `${c.brand} ${c.name} — ${c.price_per_day} DT/j`,
      })),
    [cars],
  );

  const selectedCar = form.car_id ? carsById.get(form.car_id) : undefined;
  const valueNum = Number(form.discount_value);

  // Live discounted-price preview against the selected car's base price.
  const preview =
    selectedCar && Number.isFinite(valueNum) && valueNum > 0
      ? computePromotionSavings(selectedCar.price_per_day, {
          id: "",
          car_id: selectedCar.id,
          discount_type: form.discount_type,
          discount_value: valueNum,
          label: null,
          badge_style: form.badge_style,
          start_date: form.start_date,
          end_date: form.end_date,
          is_active: true,
          created_at: "",
        })
      : null;

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(promo: Promotion) {
    setEditing(promo);
    setForm({
      car_id: promo.car_id,
      discount_type: promo.discount_type,
      discount_value: String(promo.discount_value),
      label: promo.label ?? "",
      badge_style: promo.badge_style,
      start_date: promo.start_date,
      end_date: promo.end_date,
      is_active: promo.is_active,
    });
    setShowForm(true);
  }

  // Client-side guards mirror the server so users get instant feedback.
  function validate(): string | null {
    if (!form.car_id) return "Choisissez un véhicule.";
    if (!Number.isFinite(valueNum) || valueNum <= 0)
      return "La valeur de la réduction doit être positive.";
    if (form.discount_type === "percentage" && valueNum > 100)
      return "Une réduction en pourcentage ne peut pas dépasser 100.";
    if (
      form.discount_type === "fixed" &&
      selectedCar &&
      valueNum >= selectedCar.price_per_day
    )
      return "La réduction doit être inférieure au prix du véhicule.";
    if (!form.start_date || !form.end_date)
      return "Renseignez les dates de début et de fin.";
    if (form.end_date < form.start_date)
      return "La date de fin doit être postérieure à la date de début.";
    return null;
  }

  async function handleSave() {
    const error = validate();
    if (error) {
      toast(error, "error");
      return;
    }
    setSaving(true);
    const payload = {
      car_id: form.car_id,
      discount_type: form.discount_type,
      discount_value: valueNum,
      label: form.label.trim() || null,
      badge_style: form.badge_style,
      start_date: form.start_date,
      end_date: form.end_date,
      is_active: form.is_active,
    };
    try {
      const res = await fetch(
        editing
          ? `/api/admin/promotions/${editing.id}`
          : "/api/admin/promotions",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) {
        toast(
          editing ? "Promotion mise à jour." : "Promotion créée.",
          "success",
        );
        setShowForm(false);
        await load();
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast(data.error || "Échec de l'enregistrement.", "error");
      }
    } catch {
      toast("Problème de connexion. Réessayez.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(promo: Promotion) {
    const ok = await confirm({
      title: "Supprimer la promotion ?",
      message: "Cette action est définitive.",
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    setDeletingId(promo.id);
    try {
      const res = await fetch(`/api/admin/promotions/${promo.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast("Promotion supprimée.", "success");
        await load();
      } else {
        toast("Échec de la suppression.", "error");
      }
    } catch {
      toast("Problème de connexion. Réessayez.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  function summariseDiscount(promo: Promotion): string {
    return promo.discount_type === "percentage"
      ? `-${promo.discount_value}%`
      : `-${promo.discount_value} DT/j`;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium text-ink">
            Promotions
          </h1>
          <p className="mt-2 text-sm text-stone">
            Lancez des campagnes qui s&apos;appliquent automatiquement sur tout
            le site pendant leur période de validité.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex w-fit items-center gap-2 rounded-[var(--radius)] bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-graphite"
        >
          + Nouvelle promotion
        </button>
      </div>

      {loading ? (
        <div className="mt-10 animate-pulse space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 rounded-[var(--radius-lg)] bg-mist/60"
            />
          ))}
        </div>
      ) : loadFailed ? (
        <div className="mt-10 rounded-[var(--radius-lg)] border border-mist bg-cloud p-8 text-center text-sm text-stone">
          Impossible de charger les promotions.
          <button
            onClick={load}
            className="ms-2 font-medium text-ink underline"
          >
            Réessayer
          </button>
        </div>
      ) : promotions.length === 0 ? (
        <div className="mt-10 rounded-[var(--radius-lg)] border border-mist bg-cloud p-12 text-center text-sm text-stone">
          Aucune promotion pour le moment.
        </div>
      ) : (
        <ul className="mt-10 space-y-3">
          {promotions.map((promo) => {
            const car = carsById.get(promo.car_id);
            const live = isPromotionActive(promo);
            return (
              <li
                key={promo.id}
                className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-mist bg-cloud p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-display text-lg font-medium text-ink">
                      {car ? `${car.brand} ${car.name}` : "Véhicule supprimé"}
                    </span>
                    <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-paper">
                      {summariseDiscount(promo)}
                    </span>
                    {promo.label && (
                      <span className="text-xs text-stone">{promo.label}</span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-ash">
                    {frDate(promo.start_date)} → {frDate(promo.end_date)}
                    <span
                      className={`ms-3 inline-flex items-center gap-1.5 font-medium ${
                        live
                          ? "text-emerald-600"
                          : promo.is_active
                            ? "text-amber-600"
                            : "text-ash"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          live
                            ? "bg-emerald-500"
                            : promo.is_active
                              ? "bg-amber-500"
                              : "bg-ash"
                        }`}
                      />
                      {live
                        ? "En cours"
                        : promo.is_active
                          ? "Programmée / expirée"
                          : "Désactivée"}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => openEdit(promo)}
                    className="rounded-[var(--radius-sm)] border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(promo)}
                    disabled={deletingId === promo.id}
                    className="rounded-[var(--radius-sm)] border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                  >
                    {deletingId === promo.id ? "…" : "Supprimer"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Add / edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm sm:p-8">
          <div className="my-auto w-full max-w-lg rounded-[var(--radius-lg)] border border-mist bg-paper p-6 shadow-[var(--shadow-md)] sm:p-8">
            <h2 className="font-display text-2xl font-medium text-ink">
              {editing ? "Modifier la promotion" : "Nouvelle promotion"}
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label className={fieldLabel}>Véhicule</label>
                <Select
                  value={form.car_id}
                  onChange={(v) => setForm((f) => ({ ...f, car_id: v }))}
                  options={carOptions}
                  ariaLabel="Véhicule"
                />
              </div>

              <div>
                <label className={fieldLabel}>Type de réduction</label>
                <SegmentedControl<PromotionType>
                  value={form.discount_type}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, discount_type: v }))
                  }
                  options={[
                    { value: "percentage", label: "Pourcentage (%)" },
                    { value: "fixed", label: "Montant (DT/j)" },
                  ]}
                  ariaLabel="Type de réduction"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={fieldLabel}>
                    {form.discount_type === "percentage"
                      ? "Réduction (%)"
                      : "Réduction (DT / jour)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.discount_value}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, discount_value: e.target.value }))
                    }
                    className="h-10 w-full rounded-[var(--radius-sm)] border border-line bg-paper px-3 text-sm text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                    placeholder={form.discount_type === "percentage" ? "20" : "15"}
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Style du badge</label>
                  <Select
                    value={form.badge_style}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        badge_style: v as PromotionBadgeStyle,
                      }))
                    }
                    options={BADGE_STYLE_OPTIONS}
                    ariaLabel="Style du badge"
                  />
                </div>
              </div>

              <div>
                <label className={fieldLabel}>Libellé (optionnel)</label>
                <input
                  type="text"
                  maxLength={80}
                  value={form.label}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, label: e.target.value }))
                  }
                  className="h-10 w-full rounded-[var(--radius-sm)] border border-line bg-paper px-3 text-sm text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                  placeholder="Ex : Soldes d'été"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={fieldLabel}>Début</label>
                  <DateField
                    value={form.start_date}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        start_date: v,
                        end_date: f.end_date < v ? v : f.end_date,
                      }))
                    }
                    ariaLabel="Date de début"
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Fin</label>
                  <DateField
                    value={form.end_date}
                    min={form.start_date}
                    onChange={(v) => setForm((f) => ({ ...f, end_date: v }))}
                    ariaLabel="Date de fin"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_active: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-line text-ink focus:ring-ink/20"
                />
                Promotion active
              </label>

              {/* Live discounted-price preview */}
              {preview && selectedCar && (
                <div className="rounded-[var(--radius)] border border-mist bg-cloud px-4 py-3">
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-stone">
                    Aperçu du prix / jour
                  </p>
                  <p className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-sm text-ash line-through">
                      {preview.original} DT
                    </span>
                    <span className="font-display text-2xl font-medium text-ink">
                      {preview.discounted} DT
                    </span>
                    <span className="text-xs font-medium text-emerald-600">
                      −{preview.savingsAmount} DT ({preview.savingsPct}%)
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="rounded-[var(--radius)] border border-line px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-[var(--radius)] bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-graphite disabled:opacity-60"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
