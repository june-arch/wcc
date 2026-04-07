"use client";
// src/components/PriceListClient.tsx
import { useState } from "react";
import { Plus, Pencil, Trash2, Package, Sparkles, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import ResponsiveModal from "./ui/ResponsiveModal";
import ResponsiveConfirm from "./ui/ResponsiveConfirm";
import type { PricePackage, AddOn } from "@/types";
import toast from "react-hot-toast";

const EVENT_TYPE_LABELS: Record<string, string> = {
  PENGAJIAN: "Pengajian",
  AKAD: "Akad",
  RESEPSI: "Resepsi",
  TAMAT_KAJI: "Tamat Kaji",
  LAINNYA: "Lainnya",
};

interface Props {
  initialPackages: PricePackage[];
  initialAddOns: AddOn[];
}

export default function PriceListClient({ initialPackages, initialAddOns }: Props) {
  const [packages, setPackages] = useState<PricePackage[]>(initialPackages);
  const [addOns, setAddOns] = useState<AddOn[]>(initialAddOns);
  const [activeTab, setActiveTab] = useState<"packages" | "addons">("packages");

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
      eventTypes: pkg.eventTypes,
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
      eventTypes: packageForm.eventTypes,
      description: packageForm.description.trim() || null,
      isActive: packageForm.isActive,
      sortOrder: parseInt(packageForm.sortOrder) || 0,
    };

    try {
      if (editingPackage) {
        const res = await fetch(`/api/price-packages/${editingPackage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setPackages((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p)).sort((a, b) => a.sortOrder - b.sortOrder)
        );
        toast.success("Paket diperbarui");
      } else {
        const res = await fetch("/api/price-packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        setPackages((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder));
        toast.success("Paket ditambahkan");
      }
      setShowPackageModal(false);
      resetPackageForm();
    } catch {
      toast.error("Gagal menyimpan paket");
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

    try {
      if (editingAddOn) {
        const res = await fetch(`/api/add-ons/${editingAddOn.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setAddOns((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        toast.success("Add-on diperbarui");
      } else {
        const res = await fetch("/api/add-ons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        setAddOns((prev) => [...prev, created]);
        toast.success("Add-on ditambahkan");
      }
      setShowAddOnModal(false);
      resetAddOnForm();
    } catch {
      toast.error("Gagal menyimpan add-on");
    }
  };

  const handleDelete = async () => {
    try {
      const endpoint = deleteConfirm.type === "package" ? "price-packages" : "add-ons";
      const res = await fetch(`/api/${endpoint}/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();

      if (deleteConfirm.type === "package") {
        setPackages((prev) => prev.filter((p) => p.id !== deleteConfirm.id));
      } else {
        setAddOns((prev) => prev.filter((a) => a.id !== deleteConfirm.id));
      }
      toast.success("Data dihapus");
    } catch {
      toast.error("Gagal menghapus");
    } finally {
      setDeleteConfirm({ isOpen: false, type: "package", id: "", name: "" });
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
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-stone-900">Master Data Price List</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            Kelola paket harga dan add-ons untuk booking
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
      </div>

      {/* Content */}
      {activeTab === "packages" ? (
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
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-stone-900">{pkg.name}</h3>
                  <p className="text-xl font-bold text-orange-600 mt-1">
                    Rp {pkg.price.toLocaleString("id-ID")}K
                  </p>
                </div>

                <div className="flex flex-wrap gap-1 mt-3">
                  {pkg.eventTypes.map((et) => (
                    <span
                      key={et}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-600"
                    >
                      {EVENT_TYPE_LABELS[et] || et}
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
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-stone-900">{addon.name}</h3>
                  <p className="text-lg font-bold text-orange-600 mt-1">
                    Rp {addon.price.toLocaleString("id-ID")}K
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
                Harga (ribu) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium">
                  Rp
                </span>
                <input
                  type="number"
                  className="input-base w-full pl-8"
                  placeholder="750"
                  value={packageForm.price}
                  onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
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
              {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleEventType(key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    packageForm.eventTypes.includes(key)
                      ? "bg-orange-50 border-orange-300 text-orange-700"
                      : "border-stone-200 text-stone-500 hover:border-stone-300"
                  )}
                >
                  {label}
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
              className="btn btn-primary flex-1 justify-center order-1 sm:order-2"
            >
              {editingPackage ? "Simpan Perubahan" : "Tambah Paket"}
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
              Harga (ribu)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium">
                Rp
              </span>
              <input
                type="number"
                className="input-base w-full pl-8"
                placeholder="0"
                value={addOnForm.price}
                onChange={(e) => setAddOnForm({ ...addOnForm, price: e.target.value })}
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
              className="btn btn-primary flex-1 justify-center order-1 sm:order-2"
            >
              {editingAddOn ? "Simpan Perubahan" : "Tambah Add-on"}
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
