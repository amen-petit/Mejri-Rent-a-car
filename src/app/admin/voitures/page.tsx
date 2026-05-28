"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
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
    <div className="p-4 sm:p-6 lg:p-8">
      <div
        data-reveal
        className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-navy-500 sm:text-4xl">
            Véhicules
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            {cars.length} véhicule{cars.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <button
          onClick={openAdd}
          className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-2.5 text-sm font-medium shadow-soft hover:shadow-soft-lg sm:w-auto"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Ajouter un véhicule
        </button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-48 bg-slate-200 rounded-3xl animate-pulse"
            />
          ))}
        </div>
      ) : cars.length === 0 ? (
        <div className="text-center py-24 text-slate-600">
          <div className="text-4xl mb-4">🚗</div>
          <div className="text-2xl font-bold mb-2 text-navy-500">
            Aucun véhicule
          </div>
          <div className="text-base">
            Commencez par ajouter votre premier véhicule.
          </div>
        </div>
      ) : (
        <div data-reveal className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cars.map((car) => (
            <div
              data-reveal
              key={car.id}
              className="card-surface rounded-3xl overflow-hidden hover:shadow-soft-lg transition-all duration-250"
            >
              {/* Image */}
              <div className="relative h-40 bg-[#89a9f1]/10 border-b border-slate-200 flex items-center justify-center overflow-hidden group">
                {car.images?.[0] ? (
                  <Image
                    src={car.images[0]}
                    alt={car.name}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <svg
                    className="w-16 h-16 text-[#89a9f1]"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                  </svg>
                )}
                {/* Available toggle */}
                <button
                  onClick={() => toggleAvailable(car)}
                  className={`absolute top-3 right-3 text-xs px-4 py-2 rounded-full border-2 font-bold transition-all shadow-soft ${
                    car.is_available
                      ? "bg-[#89a9f1] text-[#1F2430] border-[#89a9f1] hover:bg-[#89a9f1]/90 hover:shadow-soft-lg"
                      : "bg-red-500 text-white border-red-600 hover:bg-red-600 hover:shadow-soft-lg"
                  }`}
                >
                  {car.is_available ? "✓ Disponible" : "✗ Indisponible"}
                </button>
                {car.is_featured && (
                  <div className="absolute top-3 left-3 text-[11px] px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 font-bold">
                    À la une
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="text-xs text-[#1F2430] uppercase tracking-wide font-bold mb-2">
                  {car.category}
                </div>
                <div className="text-lg font-bold text-navy-500 mb-1">
                  {car.brand} {car.name}
                </div>
                <div className="mb-2 text-xs font-semibold text-slate-600">
                  Quantité: {car.quantity ?? 1}
                </div>
                <div className="text-base font-bold text-[#89a9f1] mb-4">
                  {car.price_per_day}{" "}
                  <span className="text-xs text-slate-600 font-normal">
                    DT / jour
                  </span>
                </div>
                {(car.pricing_tiers?.length || 0) > 0 && (
                  <div className="mb-4 rounded-xl border border-[#1F2430]/20 bg-[#1F2430]/5 px-3 py-2 text-[11px] text-[#1F2430] font-medium">
                    Tarification durée active: {car.pricing_tiers?.length}{" "}
                    palier
                    {(car.pricing_tiers?.length || 0) > 1 ? "s" : ""}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(car)}
                    className="flex-1 border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 py-2 rounded-lg text-xs font-medium transition-colors"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(car.id)}
                    disabled={deletingId === car.id}
                    className="flex-1 border-2 border-red-200 text-red-500 hover:bg-red-50 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-6 sm:py-8">
          <div className="my-auto w-full max-w-[calc(100vw-1rem)] rounded-3xl p-5 shadow-soft-xl card-surface sm:max-w-xl sm:p-8">
            <h3 className="text-2xl font-bold text-navy-500 mb-8">
              {editing ? "Modifier le véhicule" : "Ajouter un véhicule"}
            </h3>

            <div className="flex flex-col gap-6">
              {/* Name + Brand */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-600 uppercase tracking-wide font-bold mb-2 block">
                    Marque *
                  </label>
                  <input
                    type="text"
                    placeholder="Volkswagen"
                    value={form.brand}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, brand: e.target.value }))
                    }
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 uppercase tracking-wide font-bold mb-2 block">
                    Modèle *
                  </label>
                  <input
                    type="text"
                    placeholder="Polo"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="input-premium w-full"
                  />
                </div>
              </div>

              {/* Category + Price + Quantity */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs text-slate-600 uppercase tracking-wide font-bold mb-2 block">
                    Catégorie
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value }))
                    }
                    className="input-premium w-full appearance-none bg-white"
                  >
                    {CAR_CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600 uppercase tracking-wide font-bold mb-2 block">
                    Prix / jour (DT) *
                  </label>
                  <input
                    type="number"
                    placeholder="85"
                    value={form.price_per_day}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price_per_day: e.target.value }))
                    }
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 uppercase tracking-wide font-bold mb-2 block">
                    Quantité *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="1"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, quantity: e.target.value }))
                    }
                    className="input-premium w-full"
                  />
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label className="text-xs text-slate-600 uppercase tracking-wide font-bold block">
                    Tarification par durée (optionnel)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setPricingTiers((rows) => [...rows, emptyTierRow()])
                    }
                    className="rounded-lg border border-[#1F2430]/25 bg-white px-3 py-1.5 text-[11px] font-semibold text-[#1F2430] hover:bg-[#1F2430]/10 transition-colors"
                  >
                    + Ajouter un palier
                  </button>
                </div>

                {pricingTiers.length === 0 ? (
                  <p className="text-xs text-slate-500 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    Aucun palier défini. Le prix standard par jour sera utilisé.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pricingTiers.map((tier, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                      >
                        <input
                          type="number"
                          min="1"
                          placeholder="Min jours"
                          value={tier.min_days}
                          onChange={(e) =>
                            setPricingTiers((rows) =>
                              rows.map((row, rowIndex) =>
                                rowIndex === index
                                  ? { ...row, min_days: e.target.value }
                                  : row,
                              ),
                            )
                          }
                          className="input-premium w-full"
                        />
                        <input
                          type="number"
                          min="1"
                          placeholder="Max jours"
                          value={tier.max_days}
                          onChange={(e) =>
                            setPricingTiers((rows) =>
                              rows.map((row, rowIndex) =>
                                rowIndex === index
                                  ? { ...row, max_days: e.target.value }
                                  : row,
                              ),
                            )
                          }
                          className="input-premium w-full"
                        />
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          placeholder="Prix / jour"
                          value={tier.price_per_day}
                          onChange={(e) =>
                            setPricingTiers((rows) =>
                              rows.map((row, rowIndex) =>
                                rowIndex === index
                                  ? { ...row, price_per_day: e.target.value }
                                  : row,
                              ),
                            )
                          }
                          className="input-premium w-full"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPricingTiers((rows) =>
                              rows.filter((_, rowIndex) => rowIndex !== index),
                            )
                          }
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
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
                  <label className="text-xs text-slate-600 uppercase tracking-wide font-bold mb-2 block">
                    Transmission
                  </label>
                  <select
                    value={form.transmission}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, transmission: e.target.value }))
                    }
                    className="input-premium w-full appearance-none bg-white"
                  >
                    {TRANSMISSION_OPTIONS.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600 uppercase tracking-wide font-bold mb-2 block">
                    Carburant
                  </label>
                  <select
                    value={form.fuel_type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fuel_type: e.target.value }))
                    }
                    className="input-premium w-full appearance-none bg-white"
                  >
                    {FUEL_TYPES.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600 uppercase tracking-wide font-bold mb-2 block">
                    Places
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="9"
                    value={form.seats}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, seats: e.target.value }))
                    }
                    className="input-premium w-full"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-slate-600 uppercase tracking-wide font-bold mb-2 block">
                  Description
                </label>
                <textarea
                  placeholder="Description du véhicule..."
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={3}
                  className="input-premium w-full resize-none"
                />
              </div>

              {/* Features */}
              <div>
                <label className="text-xs text-slate-600 uppercase tracking-wide font-bold mb-2 block">
                  Équipements{" "}
                  <span className="normal-case font-normal text-slate-500">
                    (séparés par une virgule)
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Climatisation, GPS, Bluetooth..."
                  value={form.features}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, features: e.target.value }))
                  }
                  className="input-premium w-full"
                />
              </div>

              {/* Images */}
              <div>
                <label className="text-xs text-slate-600 uppercase tracking-wide font-bold mb-2 block">
                  Photos
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setImages(e.target.files)}
                  className="input-premium w-full"
                />
                {/* Existing images */}
                {editing && editing.images?.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {editing.images.map((url, i) => (
                      <div key={i} className="relative">
                        <Image
                          src={url}
                          alt={`Photo ${i + 1} de ${editing.brand} ${editing.name}`}
                          width={64}
                          height={64}
                          unoptimized
                          className="w-16 h-16 object-cover rounded-xl border-2 border-slate-200"
                        />
                        <button
                          onClick={() => removeImage(editing, url)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-[11px] flex items-center justify-center font-bold hover:bg-red-600 transition-colors shadow-soft"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="flex gap-8 py-2">
                <label className="flex items-center gap-3 text-sm cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.is_available}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, is_available: e.target.checked }))
                    }
                    className="accent-blue-600 w-4 h-4"
                  />
                  Disponible
                </label>
                <label className="flex items-center gap-3 text-sm cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, is_featured: e.target.checked }))
                    }
                    className="accent-blue-600 w-4 h-4"
                  />
                  Mettre à la une
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border-2 border-slate-200 text-slate-600 py-3 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
              >
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
                className="flex-1 btn-primary py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50 shadow-soft hover:shadow-soft-lg"
              >
                {saving
                  ? "Enregistrement..."
                  : editing
                    ? "Enregistrer"
                    : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
