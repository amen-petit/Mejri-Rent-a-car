"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import CarGlyph from "@/components/icons/CarGlyph";
import { Car, PricingTier } from "@/lib/types";
import {
  CAR_CATEGORIES,
  TRANSMISSION_OPTIONS,
  FUEL_TYPES,
} from "@/lib/constants";

type FormState = {
  name: string;
  brand: string;
  category: string;
  price_per_day: string;
  quantity: string;
  transmission: string;
  fuel_type: string;
  seats: string;
  description: string;
  features: string;
  is_available: boolean;
  is_featured: boolean;
};

const emptyForm: FormState = {
  name: "",
  brand: "",
  category: CAR_CATEGORIES[0],
  price_per_day: "",
  quantity: "1",
  transmission: TRANSMISSION_OPTIONS[0],
  fuel_type: FUEL_TYPES[0],
  seats: "5",
  description: "",
  features: "",
  is_available: true,
  is_featured: false,
};

type TierFormRow = {
  min_days: string;
  max_days: string;
  price_per_day: string;
};

const emptyTierRow = (): TierFormRow => ({
  min_days: "",
  max_days: "",
  price_per_day: "",
});

// Shared label style for the form fields.
const fieldLabel =
  "mb-2 block text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-stone";

export default function AdminVoitures() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Car | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [images, setImages] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pricingTiers, setPricingTiers] = useState<TierFormRow[]>([]);

  async function load() {
    const res = await fetch("/api/admin/cars", { cache: "no-store" });
    const data = res.ok ? await res.json() : { cars: [] };
    setCars(data.cars || []);
    setLoading(false);
  }

  useEffect(() => {
    // Initial fetch on mount. load() only sets state after awaiting fetch,
    // so there is no synchronous render cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setPricingTiers([]);
    setImages(null);
    setShowForm(true);
  }

  function openEdit(car: Car) {
    setEditing(car);
    setForm({
      name: car.name,
      brand: car.brand,
      category: car.category,
      price_per_day: String(car.price_per_day),
      quantity: String(car.quantity ?? 1),
      transmission: car.transmission,
      fuel_type: car.fuel_type,
      seats: String(car.seats),
      description: car.description || "",
      features: car.features?.join(", ") || "",
      is_available: car.is_available,
      is_featured: car.is_featured,
    });
    setPricingTiers(
      (car.pricing_tiers || []).map((tier) => ({
        min_days: String(tier.min_days),
        max_days: String(tier.max_days),
        price_per_day: String(tier.price_per_day),
      })),
    );
    setImages(null);
    setShowForm(true);
  }

  async function uploadImages(carId: string): Promise<void> {
    if (!images || images.length === 0) return;
    const fd = new FormData();
    for (let i = 0; i < images.length; i++) {
      fd.append("files", images[i]);
    }
    await fetch(`/api/admin/cars/${carId}/images`, {
      method: "POST",
      body: fd,
    });
  }

  async function handleSave() {
    if (!form.name || !form.brand || !form.price_per_day || !form.quantity)
      return;

    const parsedQuantity = Number(form.quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) return;

    const hasTierInput = pricingTiers.some(
      (tier) => tier.min_days || tier.max_days || tier.price_per_day,
    );

    const normalizedTiers: PricingTier[] = [];
    if (hasTierInput) {
      for (const tier of pricingTiers) {
        if (!tier.min_days || !tier.max_days || !tier.price_per_day) {
          alert(
            "Complétez tous les champs des paliers de durée, ou supprimez les lignes incomplètes.",
          );
          return;
        }

        const minDays = Number(tier.min_days);
        const maxDays = Number(tier.max_days);
        const tierPrice = Number(tier.price_per_day);

        if (
          !Number.isInteger(minDays) ||
          !Number.isInteger(maxDays) ||
          minDays < 1 ||
          maxDays < minDays ||
          !Number.isFinite(tierPrice) ||
          tierPrice <= 0
        ) {
          alert(
            "Chaque palier doit avoir des jours valides (min <= max) et un prix > 0.",
          );
          return;
        }

        normalizedTiers.push({
          min_days: minDays,
          max_days: maxDays,
          price_per_day: tierPrice,
        });
      }

      normalizedTiers.sort((a, b) => a.min_days - b.min_days);

      for (let i = 1; i < normalizedTiers.length; i++) {
        const prev = normalizedTiers[i - 1];
        const current = normalizedTiers[i];
        if (current.min_days <= prev.max_days) {
          alert(
            "Les paliers se chevauchent. Ajustez les intervalles de durée.",
          );
          return;
        }
      }
    }

    setSaving(true);

    const featuresArray = form.features
      ? form.features
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean)
      : [];

    const payload = {
      name: form.name,
      brand: form.brand,
      category: form.category,
      price_per_day: Number(form.price_per_day),
      quantity: parsedQuantity,
      transmission: form.transmission,
      fuel_type: form.fuel_type,
      seats: Number(form.seats),
      description: form.description || null,
      features: featuresArray,
      is_available: form.is_available,
      is_featured: form.is_featured,
      pricing_tiers: normalizedTiers.length > 0 ? normalizedTiers : null,
    };

    if (editing) {
      const res = await fetch(`/api/admin/cars/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        alert(`Erreur lors de la sauvegarde: ${data.error || res.status}`);
        setSaving(false);
        return;
      }

      if (images && images.length > 0) {
        await uploadImages(editing.id);
      }
    } else {
      const res = await fetch("/api/admin/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        alert(`Erreur lors de la création: ${data.error || res.status}`);
        setSaving(false);
        return;
      }

      const { id } = (await res.json()) as { id: string };
      if (id && images && images.length > 0) {
        await uploadImages(id);
      }
    }

    setSaving(false);
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce véhicule ?")) return;
    setDeletingId(id);
    await fetch(`/api/admin/cars/${id}`, { method: "DELETE" });
    setDeletingId(null);
    load();
  }

  async function toggleAvailable(car: Car) {
    await fetch(`/api/admin/cars/${car.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_available: !car.is_available }),
    });
    load();
  }

  async function removeImage(car: Car, url: string) {
    const updated = car.images.filter((i) => i !== url);
    await fetch(`/api/admin/cars/${car.id}/images`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    load();
    if (editing) setEditing({ ...car, images: updated });
  }

  return (
    <div>
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-medium tracking-tight text-ink">
            Véhicules
          </h1>
          <p className="mt-3 text-sm text-stone">
            {cars.length} véhicule{cars.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary w-full sm:w-auto">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un véhicule
        </button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-[var(--radius-lg)] bg-mist" />
          ))}
        </div>
      ) : cars.length === 0 ? (
        <div className="border border-mist bg-cloud py-24 text-center">
          <div className="font-display text-2xl font-medium text-ink">
            Aucun véhicule
          </div>
          <div className="mt-2 text-sm text-stone">
            Commencez par ajouter votre premier véhicule.
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cars.map((car) => (
            <div
              key={car.id}
              className="group overflow-hidden rounded-[var(--radius-lg)] border border-mist bg-cloud transition-colors hover:border-ink"
            >
              {/* Image */}
              <div className="relative flex h-44 items-center justify-center overflow-hidden border-b border-mist bg-paper">
                {car.images?.[0] ? (
                  <Image
                    src={car.images[0]}
                    alt={car.name}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                ) : (
                  <CarGlyph className="h-16 w-16 text-ash" />
                )}
                {/* Available toggle */}
                <button
                  onClick={() => toggleAvailable(car)}
                  className={`absolute right-3 top-3 rounded-full border px-3 py-1.5 text-[0.65rem] font-semibold backdrop-blur-sm transition-colors ${
                    car.is_available
                      ? "border-ink/10 bg-paper/85 text-ink hover:bg-paper"
                      : "border-red-300 bg-red-500 text-white hover:bg-red-600"
                  }`}
                >
                  {car.is_available ? "Disponible" : "Indisponible"}
                </button>
                {car.is_featured && (
                  <div className="absolute left-3 top-3 rounded-full bg-ink px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-paper">
                    À la une
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-stone">
                  {car.category}
                </div>
                <div className="mt-1.5 font-display text-lg font-medium text-ink">
                  {car.brand} {car.name}
                </div>
                <div className="mt-1 text-xs text-ash">
                  Quantité : {car.quantity ?? 1}
                </div>
                <div className="mt-3 font-display text-xl text-ink">
                  {car.price_per_day}
                  <span className="ml-1 text-xs font-normal text-stone">DT / jour</span>
                </div>
                {(car.pricing_tiers?.length || 0) > 0 && (
                  <div className="mt-4 rounded-[var(--radius-sm)] border border-mist bg-paper px-3 py-2 text-[0.7rem] text-stone">
                    Tarification durée : {car.pricing_tiers?.length} palier
                    {(car.pricing_tiers?.length || 0) > 1 ? "s" : ""}
                  </div>
                )}
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => openEdit(car)}
                    className="flex-1 rounded-[var(--radius-sm)] border border-line py-2 text-xs font-medium text-ink transition-colors hover:border-ink"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(car.id)}
                    disabled={deletingId === car.id}
                    className="flex-1 rounded-[var(--radius-sm)] border border-red-200 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === car.id ? "..." : "Supprimer"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 px-4 py-6 backdrop-blur-sm sm:py-10">
          <div className="card-surface my-auto w-full max-w-[calc(100vw-1rem)] p-6 sm:max-w-xl sm:p-9">
            <h3 className="mb-8 font-display text-2xl font-medium text-ink">
              {editing ? "Modifier le véhicule" : "Ajouter un véhicule"}
            </h3>

            <div className="flex flex-col gap-6">
              {/* Name + Brand */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={fieldLabel}>Marque *</label>
                  <input type="text" placeholder="Volkswagen" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} className="input-premium" />
                </div>
                <div>
                  <label className={fieldLabel}>Modèle *</label>
                  <input type="text" placeholder="Polo" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-premium" />
                </div>
              </div>

              {/* Category + Price + Quantity */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={fieldLabel}>Catégorie</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input-premium appearance-none">
                    {CAR_CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={fieldLabel}>Prix / jour (DT) *</label>
                  <input type="number" placeholder="85" value={form.price_per_day} onChange={(e) => setForm((f) => ({ ...f, price_per_day: e.target.value }))} className="input-premium" />
                </div>
                <div>
                  <label className={fieldLabel}>Quantité *</label>
                  <input type="number" min="1" step="1" placeholder="1" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} className="input-premium" />
                </div>
              </div>

              {/* Pricing tiers */}
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label className={`${fieldLabel} mb-0`}>
                    Tarification par durée (optionnel)
                  </label>
                  <button
                    type="button"
                    onClick={() => setPricingTiers((rows) => [...rows, emptyTierRow()])}
                    className="rounded-[var(--radius-sm)] border border-line px-3 py-1.5 text-[0.7rem] font-medium text-ink transition-colors hover:border-ink"
                  >
                    + Ajouter un palier
                  </button>
                </div>

                {pricingTiers.length === 0 ? (
                  <p className="rounded-[var(--radius-sm)] border border-mist bg-paper px-3 py-2 text-xs text-ash">
                    Aucun palier défini. Le prix standard par jour sera utilisé.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pricingTiers.map((tier, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 gap-2 rounded-[var(--radius-sm)] border border-mist bg-paper p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                      >
                        <input type="number" min="1" placeholder="Min jours" value={tier.min_days} onChange={(e) => setPricingTiers((rows) => rows.map((row, ri) => (ri === index ? { ...row, min_days: e.target.value } : row)))} className="input-premium" />
                        <input type="number" min="1" placeholder="Max jours" value={tier.max_days} onChange={(e) => setPricingTiers((rows) => rows.map((row, ri) => (ri === index ? { ...row, max_days: e.target.value } : row)))} className="input-premium" />
                        <input type="number" min="1" step="0.01" placeholder="Prix / jour" value={tier.price_per_day} onChange={(e) => setPricingTiers((rows) => rows.map((row, ri) => (ri === index ? { ...row, price_per_day: e.target.value } : row)))} className="input-premium" />
                        <button
                          type="button"
                          onClick={() => setPricingTiers((rows) => rows.filter((_, ri) => ri !== index))}
                          className="rounded-[var(--radius-sm)] border border-red-200 px-3 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                        >
                          Suppr.
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Transmission + Fuel + Seats */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={fieldLabel}>Transmission</label>
                  <select value={form.transmission} onChange={(e) => setForm((f) => ({ ...f, transmission: e.target.value }))} className="input-premium appearance-none">
                    {TRANSMISSION_OPTIONS.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={fieldLabel}>Carburant</label>
                  <select value={form.fuel_type} onChange={(e) => setForm((f) => ({ ...f, fuel_type: e.target.value }))} className="input-premium appearance-none">
                    {FUEL_TYPES.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={fieldLabel}>Places</label>
                  <input type="number" min="2" max="9" value={form.seats} onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))} className="input-premium" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={fieldLabel}>Description</label>
                <textarea placeholder="Description du véhicule..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="input-premium resize-none" />
              </div>

              {/* Features */}
              <div>
                <label className={fieldLabel}>
                  Équipements{" "}
                  <span className="font-normal normal-case text-ash">
                    (séparés par une virgule)
                  </span>
                </label>
                <input type="text" placeholder="Climatisation, GPS, Bluetooth..." value={form.features} onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))} className="input-premium" />
              </div>

              {/* Images */}
              <div>
                <label className={fieldLabel}>Photos</label>
                <input type="file" multiple accept="image/*" onChange={(e) => setImages(e.target.files)} className="input-premium" />
                {editing && editing.images?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {editing.images.map((url, i) => (
                      <div key={i} className="relative">
                        <Image
                          src={url}
                          alt={`Photo ${i + 1} de ${editing.brand} ${editing.name}`}
                          width={64}
                          height={64}
                          unoptimized
                          className="h-16 w-16 rounded-[var(--radius-sm)] border border-mist object-cover"
                        />
                        <button
                          onClick={() => removeImage(editing, url)}
                          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[0.65rem] font-bold text-white transition-colors hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="flex gap-8 py-1">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-ink">
                  <input type="checkbox" checked={form.is_available} onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))} className="h-4 w-4 accent-ink" />
                  Disponible
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-ink">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} className="h-4 w-4 accent-ink" />
                  Mettre à la une
                </label>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={() => setShowForm(false)} className="btn-ghost flex-1">
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={
                  saving ||
                  !form.name ||
                  !form.brand ||
                  !form.price_per_day ||
                  !form.quantity ||
                  Number(form.quantity) < 1
                }
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {saving ? "Enregistrement..." : editing ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
