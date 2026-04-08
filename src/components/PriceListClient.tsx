"use client";
// src/components/PriceListClient.tsx
import { useState } from "react";
import { Plus, Pencil, Trash2, Package, Sparkles, GripVertical, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import ResponsiveModal from "./ui/ResponsiveModal";
import ResponsiveConfirm from "./ui/ResponsiveConfirm";
import { FormattedNumberInput } from "./ui/FormattedNumberInput";
import EventTypesClient from "./EventTypesClient";
import type { PricePackage, AddOn, EventType } from "@/types";
import toast from "react-hot-toast";

const EVENT_TYPE_LABELS: Record<string, string> = {
  PENGAJIAN: "Pengajian",
  AKAD_MALAM: "Akad Malam",
  AKAD_SIANG: "Akad Siang",
  RESEPSI: "Resepsi",
  TAMAT_KAJI: "Tamat Kaji",
  LAINNYA: "Lainnya",
};

interface Props {
  initialPackages: PricePackage[];
  initialAddOns: AddOn[];
  initialEventTypes: EventType[];
}

export default function PriceListClient({ initialPackages, initialAddOns, initialEventTypes }: Props) {
  const [packages, setPackages] = useState<PricePackage[]>(initialPackages);
  const [addOns, setAddOns] = useState<AddOn[]>(initialAddOns);
  const [activeTab, setActiveTab] = useState<"packages" | "addons" | "eventtypes">("packages");
  const [savingPackage, setSavingPackage] = useState(false);
  const [savingAddOn, setSavingAddOn] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Package modal states
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PricePackage | null>(null);
  const [packageForm, setPackageForm] = useState({
    name: "",
    price: "",
    eventTypes: [] as string[],
    description: "",
    isActive: true,
    sortOrder: "0",
  });

  // Add-on modal states
  const [showAddOnModal, setShowAddOnModal] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null);
  const [addOnForm, setAddOnForm] = useState({
    name: "",
    price: "",
    description: "",
    isActive: true,
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: "package" | "addon";
    id: string;
    name: string;
  }>({ isOpen: false, type: "package", id: "", name: "" });

  const resetPackageForm = () => {
    setPackageForm({
      name: "",
      price: "",
      eventTypes: [],
      description: "",
      isActive: true,
      sortOrder: "0",
    });
    setEditingPackage(null);
  };

  const resetAddOnForm = () => {
    setAddOnForm({
      name: "",
      price: "",
      description: "",
      isActive: true,
    });
    setEditingAddOn(null);
  };

  const openEditPackage = (pkg: PricePackage) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name,
      price: pkg.price.toString(),
      eventTypes: pkg.packageEventTypes?.map(pet => pet.eventType.id) || [],
      description: pkg.description || "",
      isActive: pkg.isActive,
      sortOrder: pkg.sortOrder.toString(),
    });
    setShowPackageModal(true);
  };

  const openEditAddOn = (addon: AddOn) => {
    setEditingAddOn(addon);
    setAddOnForm({
      name: addon.name,
      price: addon.price.toString(),
      description: addon.description || "",
      isActive: addon.isActive,
    });
    setShowAddOnModal(true);
  };

  const handleSavePackage = async () => {
    if (!packageForm.name.trim() || !packageForm.price) {
      toast.error("Nama dan harga paket wajib diisi");
      return;
    }

    const data = {
      name: packageForm.name.trim(),
      price: parseInt(packageForm.price),
      description: packageForm.description.trim() || null,
      eventTypes: packageForm.eventTypes,
      isActive: packageForm.isActive,
    };

    setSavingPackage(true);
    
    try {
      if (editingPackage) {
        // Optimistic update for edit
        const originalPackages = [...packages];
        const optimisticUpdate = { ...editingPackage, ...data };
        setPackages((prev) => prev.map((p) => (p.id === editingPackage.id ? optimisticUpdate : p)));
        
        const res = await fetch(`/api/price-packages/${editingPackage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        
        if (!res.ok) {
          // Rollback on error
          setPackages(originalPackages);
          throw new Error();
        }
        
        const updated = await res.json();
        setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        toast.success("Paket diperbarui");
      } else {
        // Optimistic update for create
        const tempId = `temp-${Date.now()}`;
        const optimisticPackage = { 
          ...data, 
          id: tempId, 
          sortOrder: packages.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setPackages((prev) => [...prev, optimisticPackage]);
        
        const res = await fetch("/api/price-packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        
        if (!res.ok) {
          // Rollback on error
          setPackages((prev) => prev.filter((p) => p.id !== tempId));
          throw new Error();
        }
        
        const created = await res.json();
        setPackages((prev) => prev.map((p) => (p.id === tempId ? created : p)));
        toast.success("Paket ditambahkan");
      }
      setShowPackageModal(false);
      resetPackageForm();
    } catch {
      toast.error("Gagal menyimpan paket");
    } finally {
      setSavingPackage(false);
    }
  };

  const handleSaveAddOn = async () => {
    if (!addOnForm.name.trim()) {
      toast.error("Nama add-on wajib diisi");
      return;
    }

    const data = {
      name: addOnForm.name.trim(),
      price: parseInt(addOnForm.price) || 0,
      description: addOnForm.description.trim() || null,
      isActive: addOnForm.isActive,
    };

    setSavingAddOn(true);
    
    try {
      if (editingAddOn) {
        // Optimistic update for edit
        const originalAddOns = [...addOns];
        const optimisticUpdate = { ...editingAddOn, ...data };
        setAddOns((prev) => prev.map((a) => (a.id === editingAddOn.id ? optimisticUpdate : a)));
        
        const res = await fetch(`/api/add-ons/${editingAddOn.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        
        if (!res.ok) {
          // Rollback on error
          setAddOns(originalAddOns);
          throw new Error();
        }
        
        const updated = await res.json();
        setAddOns((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        toast.success("Add-on diperbarui");
      } else {
        // Optimistic update for create
        const tempId = `temp-${Date.now()}`;
        const optimisticAddOn = { 
          ...data, 
          id: tempId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setAddOns((prev) => [...prev, optimisticAddOn]);
        
        const res = await fetch("/api/add-ons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        
        if (!res.ok) {
          // Rollback on error
          setAddOns((prev) => prev.filter((a) => a.id !== tempId));
          throw new Error();
        }
        
        const created = await res.json();
        setAddOns((prev) => prev.map((a) => (a.id === tempId ? created : a)));
        toast.success("Add-on ditambahkan");
      }
      setShowAddOnModal(false);
      resetAddOnForm();
    } catch {
      toast.error("Gagal menyimpan add-on");
    } finally {
      setSavingAddOn(false);
    }
  };

  const handleDelete = async () => {
    const { type, id } = deleteConfirm;
    const originalPackages = [...packages];
    const originalAddOns = [...addOns];
    
    // Optimistic update
    if (type === "package") {
      setPackages((prev) => prev.filter((p) => p.id !== id));
    } else {
      setAddOns((prev) => prev.filter((a) => a.id !== id));
    }
    
    setDeletingId(id);
    setDeleteConfirm({ isOpen: false, type: "package", id: "", name: "" });
    
    try {
      const endpoint = type === "package" ? "price-packages" : "add-ons";
      const res = await fetch(`/api/${endpoint}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success(`${type === "package" ? "Paket" : "Add-on"} dihapus`);
    } catch {
      // Rollback optimistic update
      setPackages(originalPackages);
      setAddOns(originalAddOns);
      toast.error("Gagal menghapus");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleEventType = (type: string) => {
    setPackageForm((prev) => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(type)
        ? prev.eventTypes.filter((t) => t !== type)
        : [...prev.eventTypes, type],
    }));
  };

  return (
    <div className="space-y-5 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-stone-900">Master Data</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            Kelola paket harga, add-ons, dan jenis acara
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200">
        <button
          onClick={() => setActiveTab("packages")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2",
            activeTab === "packages"
              ? "text-orange-600 border-orange-500"
              : "text-stone-500 border-transparent hover:text-stone-700"
          )}
        >
          <Package size={18} />
          Paket Harga ({packages.length})
        </button>
        <button
          onClick={() => setActiveTab("addons")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2",
            activeTab === "addons"
              ? "text-orange-600 border-orange-500"
              : "text-stone-500 border-transparent hover:text-stone-700"
          )}
        >
          <Sparkles size={18} />
          Add-ons ({addOns.length})
        </button>
        <button
          onClick={() => setActiveTab("eventtypes")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2",
            activeTab === "eventtypes"
              ? "text-orange-600 border-orange-500"
              : "text-stone-500 border-transparent hover:text-stone-700"
          )}
        >
          <Database size={18} />
          Event Types
        </button>
      </div>

      {/* Content */}
      {activeTab === "eventtypes" ? (
        <EventTypesClient eventTypes={initialEventTypes} />
      ) : activeTab === "packages" ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                resetPackageForm();
                setShowPackageModal(true);
              }}
              className="btn btn-primary gap-2"
            >
              <Plus size={16} />
              Tambah Paket
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={cn(
                  "card p-4 border-2 transition-all",
                  pkg.isActive ? "border-transparent" : "border-stone-200 opacity-60"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-stone-400">
                    <GripVertical size={16} />
                    <span className="text-xs font-medium">#{pkg.sortOrder}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditPackage(pkg)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          isOpen: true,
                          type: "package",
                          id: pkg.id,
                          name: pkg.name,
                        })
                      }
                      disabled={deletingId === pkg.id}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                        deletingId === pkg.id
                          ? "text-stone-300 cursor-not-allowed"
                          : "text-stone-400 hover:text-red-600 hover:bg-red-50"
                      )}
                    >
                      {deletingId === pkg.id ? (
                        <div className="w-4 h-4 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-stone-900">{pkg.name}</h3>
                  <p className="text-xl font-bold text-orange-600 mt-1">
                    Rp {pkg.price.toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1 mt-3">
                  {pkg.packageEventTypes?.map((pet) => (
                    <span
                      key={pet.eventType.id}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-600"
                    >
                      {pet.eventType.label}
                    </span>
                  ))}
                </div>

                {pkg.description && (
                  <p className="text-xs text-stone-500 mt-2 line-clamp-2">{pkg.description}</p>
                )}

                {!pkg.isActive && (
                  <span className="inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
                    Nonaktif
                  </span>
                )}
              </div>
            ))}
          </div>

          {packages.length === 0 && (
            <div className="card py-12 text-center">
              <Package size={32} className="mx-auto text-stone-300 mb-3" />
              <p className="text-stone-500 font-medium">Belum ada paket harga</p>
              <p className="text-stone-400 text-sm mt-1">Klik tombol di atas untuk menambahkan</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                resetAddOnForm();
                setShowAddOnModal(true);
              }}
              className="btn btn-primary gap-2"
            >
              <Plus size={16} />
              Tambah Add-on
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {addOns.map((addon) => (
              <div
                key={addon.id}
                className={cn(
                  "card p-4 border-2 transition-all",
                  addon.isActive ? "border-transparent" : "border-stone-200 opacity-60"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-stone-400">
                    <Sparkles size={16} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditAddOn(addon)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          isOpen: true,
                          type: "addon",
                          id: addon.id,
                          name: addon.name,
                        })
                      }
                      disabled={deletingId === addon.id}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                        deletingId === addon.id
                          ? "text-stone-300 cursor-not-allowed"
                          : "text-stone-400 hover:text-red-600 hover:bg-red-50"
                      )}
                    >
                      {deletingId === addon.id ? (
                        <div className="w-4 h-4 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-stone-900">{addon.name}</h3>
                  <p className="text-lg font-bold text-orange-600 mt-1">
                    Rp {addon.price.toLocaleString("id-ID")}
                  </p>
                </div>

                {addon.description && (
                  <p className="text-xs text-stone-500 mt-2 line-clamp-2">{addon.description}</p>
                )}

                {!addon.isActive && (
                  <span className="inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
                    Nonaktif
                  </span>
                )}
              </div>
            ))}
          </div>

          {addOns.length === 0 && (
            <div className="card py-12 text-center">
              <Sparkles size={32} className="mx-auto text-stone-300 mb-3" />
              <p className="text-stone-500 font-medium">Belum ada add-on</p>
              <p className="text-stone-400 text-sm mt-1">Klik tombol di atas untuk menambahkan</p>
            </div>
          )}
        </div>
      )}

      {/* Package Modal */}
      <ResponsiveModal
        isOpen={showPackageModal}
        onClose={() => {
          setShowPackageModal(false);
          resetPackageForm();
        }}
        title={editingPackage ? "Edit Paket" : "Tambah Paket"}
        subtitle={editingPackage ? editingPackage.name : "Buat paket harga baru"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Nama Paket <span className="text-red-400">*</span>
            </label>
            <input
              className="input-base w-full"
              placeholder="Contoh: Akad & Resepsi"
              value={packageForm.name}
              onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Harga (Rp) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium pointer-events-none z-10">
                  Rp
                </span>
                <FormattedNumberInput
                  value={parseInt(packageForm.price) || 0}
                  onChange={(val: number) => setPackageForm({ ...packageForm, price: val.toString() })}
                  placeholder="0"
                  min={0}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Urutan</label>
              <input
                type="number"
                className="input-base w-full"
                placeholder="0"
                value={packageForm.sortOrder}
                onChange={(e) => setPackageForm({ ...packageForm, sortOrder: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Jenis Acara
            </label>
            <div className="flex gap-2 flex-wrap">
              {initialEventTypes.filter(et => et.isActive).map((eventType) => (
                <button
                  key={eventType.id}
                  type="button"
                  onClick={() => toggleEventType(eventType.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    packageForm.eventTypes.includes(eventType.id)
                      ? "bg-orange-50 border-orange-300 text-orange-700"
                      : "border-stone-200 text-stone-500 hover:border-stone-300"
                  )}
                >
                  {eventType.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Deskripsi</label>
            <textarea
              className="input-base w-full resize-none"
              rows={2}
              placeholder="Detail paket..."
              value={packageForm.description}
              onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() =>
                setPackageForm({ ...packageForm, isActive: !packageForm.isActive })
              }
              className={cn(
                "relative w-10 h-5 rounded-full transition-colors",
                packageForm.isActive ? "bg-orange-500" : "bg-stone-300"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                  packageForm.isActive ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </div>
            <span className="text-sm font-medium text-stone-700">Paket aktif</span>
          </label>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowPackageModal(false);
                resetPackageForm();
              }}
              className="btn btn-secondary flex-1 order-2 sm:order-1"
            >
              Batal
            </button>
            <button
              onClick={handleSavePackage}
              disabled={savingPackage}
              className="btn btn-primary flex-1 justify-center order-1 sm:order-2"
            >
              {savingPackage ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </div>
              ) : (
                editingPackage ? "Simpan Perubahan" : "Tambah Paket"
              )}
            </button>
          </div>
        </div>
      </ResponsiveModal>

      {/* Add-on Modal */}
      <ResponsiveModal
        isOpen={showAddOnModal}
        onClose={() => {
          setShowAddOnModal(false);
          resetAddOnForm();
        }}
        title={editingAddOn ? "Edit Add-on" : "Tambah Add-on"}
        subtitle={editingAddOn ? editingAddOn.name : "Buat add-on baru"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Nama Add-on <span className="text-red-400">*</span>
            </label>
            <input
              className="input-base w-full"
              placeholder="Contoh: Stand by full day"
              value={addOnForm.name}
              onChange={(e) => setAddOnForm({ ...addOnForm, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Harga (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium pointer-events-none z-10">
                Rp
              </span>
              <FormattedNumberInput
                value={parseInt(addOnForm.price) || 0}
                onChange={(val: number) => setAddOnForm({ ...addOnForm, price: val.toString() })}
                placeholder="0"
                min={0}
              />
            </div>
            <p className="text-xs text-stone-400 mt-1">Isi 0 jika gratis</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Deskripsi</label>
            <textarea
              className="input-base w-full resize-none"
              rows={2}
              placeholder="Detail add-on..."
              value={addOnForm.description}
              onChange={(e) => setAddOnForm({ ...addOnForm, description: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setAddOnForm({ ...addOnForm, isActive: !addOnForm.isActive })}
              className={cn(
                "relative w-10 h-5 rounded-full transition-colors",
                addOnForm.isActive ? "bg-orange-500" : "bg-stone-300"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                  addOnForm.isActive ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </div>
            <span className="text-sm font-medium text-stone-700">Add-on aktif</span>
          </label>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddOnModal(false);
                resetAddOnForm();
              }}
              className="btn btn-secondary flex-1 order-2 sm:order-1"
            >
              Batal
            </button>
            <button
              onClick={handleSaveAddOn}
              disabled={savingAddOn}
              className="btn btn-primary flex-1 justify-center order-1 sm:order-2"
            >
              {savingAddOn ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </div>
              ) : (
                editingAddOn ? "Simpan Perubahan" : "Tambah Add-on"
              )}
            </button>
          </div>
        </div>
      </ResponsiveModal>

      {/* Delete Confirmation */}
      <ResponsiveConfirm
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, type: "package", id: "", name: "" })}
        onConfirm={handleDelete}
        title="Hapus Data?"
        message={`Yakin ingin menghapus "${deleteConfirm.name}"? Data yang sudah dihapus tidak bisa dikembalikan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
