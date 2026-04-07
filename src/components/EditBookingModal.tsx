"use client";
// src/components/EditBookingModal.tsx
import { useState, useEffect } from "react";
import { Loader2, Package, Check, Sparkles, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import ResponsiveModal from "./ui/ResponsiveModal";
import type { BookingWithRelations, PricePackage, AddOn } from "@/types";
import toast from "react-hot-toast";

interface Props {
  booking: BookingWithRelations;
  onClose: () => void;
  onSuccess: (updated: BookingWithRelations) => void;
}

const EVENT_TYPES = ["PENGAJIAN", "AKAD", "RESEPSI", "TAMAT_KAJI", "LAINNYA"] as const;
const EVENT_TYPE_LABELS: Record<string, string> = {
  PENGAJIAN: "Pengajian",
  AKAD: "Akad",
  RESEPSI: "Resepsi",
  TAMAT_KAJI: "Tamat Kaji",
  LAINNYA: "Lainnya",
};

export default function EditBookingModal({ booking, onClose, onSuccess }: Props) {
  const formatDateForInput = (date: string | Date | null | undefined) => {
    if (!date) return "";
    const d = typeof date === "string" ? date : date.toISOString();
    return d.split("T")[0];
  };

  const [form, setForm] = useState({
    clientName: booking.clientName,
    hashtag: booking.hashtag ?? "",
    location: booking.location ?? "",
    startDate: formatDateForInput(booking.startDate),
    endDate: formatDateForInput(booking.endDate),
    eventType: booking.eventType,
    package: booking.package,
    paid: booking.paid,
    isConfirmed: booking.isConfirmed,
    notes: booking.notes ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [pricePackages, setPricePackages] = useState<PricePackage[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [showPackageSelector, setShowPackageSelector] = useState(false);
  const [showAddOnSelector, setShowAddOnSelector] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PricePackage | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);

  // Calculate total price
  const basePrice = selectedPackage?.price || 0;
  const addOnsTotal = selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
  const totalPrice = basePrice + addOnsTotal;

  // Fetch price packages and add-ons
  useEffect(() => {
    // Fetch packages
    fetch("/api/price-packages")
      .then((res) => res.json())
      .then((data) => {
        const active = data.filter((p: PricePackage) => p.isActive);
        setPricePackages(active);
        // Find if current booking has a matching package by price
        const matching = active.find((p: PricePackage) => p.price === Number(booking.package));
        if (matching) {
          setSelectedPackage(matching);
          console.log("✅ Auto-selected package:", matching.name);
        } else {
          console.log("ℹ️ No matching package for price:", booking.package);
        }
      })
      .catch(() => toast.error("Gagal memuat paket harga"));
    
    // Fetch add-ons
    fetch("/api/add-ons")
      .then((res) => res.json())
      .then((data) => {
        const active = data.filter((a: AddOn) => a.isActive);
        setAddOns(active);
        // Pre-select existing add-ons from booking
        if (booking.bookingAddOns && booking.bookingAddOns.length > 0) {
          const existing = booking.bookingAddOns.map((ba) => ba.addOn);
          setSelectedAddOns(existing);
        }
      })
      .catch(() => toast.error("Gagal memuat add-ons"));
  }, [booking.package, booking.bookingAddOns]);

  const toggleEventType = (et: string) => {
    setForm((prev) => ({
      ...prev,
      eventType: prev.eventType.includes(et)
        ? prev.eventType.filter((t) => t !== et)
        : [...prev.eventType, et],
    }));
  };

  const applyPackage = (pkg: PricePackage) => {
    setSelectedPackage(pkg);
    setForm((f) => ({
      ...f,
      package: pkg.price,
      eventType: pkg.eventTypes.length > 0 ? pkg.eventTypes : f.eventType,
    }));
    setShowPackageSelector(false);
  };

  const toggleAddOn = (addon: AddOn) => {
    setSelectedAddOns((prev) => {
      const exists = prev.find((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      }
      return [...prev, addon];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName.trim() || form.eventType.length === 0) {
      toast.error("Nama klien dan jenis acara wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          package: totalPrice, // Use calculated total price
          paid: Number(form.paid),
          pricePackageId: selectedPackage?.id || null,
          addOns: selectedAddOns.map((a) => ({ addOnId: a.id, price: a.price })),
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      toast.success("Booking diperbarui");
      onSuccess(updated);
    } catch {
      toast.error("Gagal memperbarui booking");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Yakin ingin menghapus booking ini? Semua data terkait akan hilang.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Booking dihapus");
      onClose();
      window.location.reload();
    } catch {
      toast.error("Gagal menghapus booking");
      setLoading(false);
    }
  };

  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      title="Edit Booking"
      subtitle={booking.clientName}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nama klien */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">
            Nama Klien <span className="text-red-400">*</span>
          </label>
          <input
            className="input-base w-full"
            placeholder="Contoh: Sari & Budi"
            value={form.clientName}
            onChange={(e) => setForm({ ...form, clientName: e.target.value })}
          />
        </div>

        {/* Hashtag */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Hashtag</label>
          <input
            className="input-base w-full"
            placeholder="#SariBudiWedding"
            value={form.hashtag}
            onChange={(e) => setForm({ ...form, hashtag: e.target.value })}
          />
        </div>

        {/* Lokasi */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Lokasi</label>
          <input
            className="input-base w-full"
            placeholder="Hotel / Gedung / Alamat"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>

        {/* Tanggal */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Tanggal Mulai <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              className="input-base w-full"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Tanggal Selesai</label>
            <input
              type="date"
              className="input-base w-full"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
        </div>

        {/* Jenis acara */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">
            Jenis Acara <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {EVENT_TYPES.map((et) => (
              <button
                key={et}
                type="button"
                onClick={() => toggleEventType(et)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  form.eventType.includes(et)
                    ? "bg-orange-50 border-orange-300 text-orange-700"
                    : "border-stone-200 text-stone-500 hover:border-stone-300"
                )}
              >
                {EVENT_TYPE_LABELS[et]}
              </button>
            ))}
          </div>
        </div>

        {/* Paket & Dibayar */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Total Paket (ribu)</label>
            {/* Package selector button */}
            {pricePackages.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPackageSelector(true)}
                className="mb-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-200 hover:border-orange-300 hover:bg-orange-50 transition-all text-left"
              >
                <Package size={16} className="text-orange-500" />
                <span className="text-sm text-stone-600">
                  {selectedPackage ? selectedPackage.name : "Pilih dari paket..."}
                </span>
              </button>
            )}
            <input
              type="number"
              min="0"
              className="input-base w-full bg-stone-50"
              value={form.package}
              disabled
              title="Pilih paket dari tombol di atas"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Sudah Dibayar (ribu)</label>
            <input
              type="number"
              min="0"
              className="input-base w-full"
              value={form.paid}
              onChange={(e) => setForm({ ...form, paid: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* Add-ons & Total */}
        <div className="space-y-3">
          {/* Selected Add-ons */}
          {selectedAddOns.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedAddOns.map((addon) => (
                <span
                  key={addon.id}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium"
                >
                  {addon.name}
                  {addon.price > 0 && ` (+${addon.price}K)`}
                  <button
                    type="button"
                    onClick={() => toggleAddOn(addon)}
                    className="hover:text-orange-900"
                  >
                    <Minus size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
          
          {/* Add Add-ons Button */}
          {addOns.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAddOnSelector(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-200 hover:border-orange-300 hover:bg-orange-50 transition-all text-left"
            >
              <Sparkles size={16} className="text-orange-500" />
              <span className="text-sm text-stone-600">
                {selectedAddOns.length > 0 ? `${selectedAddOns.length} add-on dipilih` : "Tambah add-ons..."}
              </span>
            </button>
          )}

          {/* Total Price Breakdown */}
          <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Paket {selectedPackage?.name || "-"}</span>
              <span className="font-medium">Rp {basePrice.toLocaleString("id-ID")}K</span>
            </div>
            {selectedAddOns.map((addon) => (
              <div key={addon.id} className="flex justify-between text-sm">
                <span className="text-stone-500">{addon.name}</span>
                <span className="font-medium">+{addon.price}K</span>
              </div>
            ))}
            <div className="border-t border-stone-200 pt-1 mt-1">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-stone-700">Total</span>
                <span className="text-orange-600">Rp {totalPrice.toLocaleString("id-ID")}K</span>
              </div>
            </div>
          </div>
        </div>

        {/* Catatan */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Catatan</label>
          <textarea
            className="input-base w-full min-h-[80px] resize-none"
            placeholder="Catatan tambahan..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 pb-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="btn btn-danger flex-1 justify-center order-3 sm:order-1"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : "Hapus"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary flex-1 order-2"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex-1 justify-center order-1 sm:order-3"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</>
              : "Simpan Perubahan"
            }
          </button>
        </div>
      </form>
        {/* Add-on Selector Modal */}
        <ResponsiveModal
          isOpen={showAddOnSelector}
          onClose={() => setShowAddOnSelector(false)}
          title="Pilih Add-ons"
          subtitle="Tambahan layanan untuk booking"
        >
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {addOns.map((addon) => {
              const isSelected = selectedAddOns.some((a) => a.id === addon.id);
              return (
                <button
                  key={addon.id}
                  onClick={() => toggleAddOn(addon)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3",
                    isSelected
                      ? "border-orange-500 bg-orange-50"
                      : "border-stone-200 hover:border-orange-300 hover:bg-orange-50"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                    isSelected ? "bg-orange-500 border-orange-500" : "border-stone-300"
                  )}>
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className={cn("font-medium text-sm", isSelected ? "text-orange-900" : "text-stone-900")}>
                        {addon.name}
                      </h3>
                      <span className={cn("text-sm font-semibold", isSelected ? "text-orange-600" : "text-stone-600")}>
                        {addon.price === 0 ? "Free" : `+${addon.price}K`}
                      </span>
                    </div>
                    {addon.description && (
                      <p className={cn("text-xs mt-0.5", isSelected ? "text-orange-700" : "text-stone-500")}>
                        {addon.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
            
            <button
              onClick={() => setShowAddOnSelector(false)}
              className="w-full p-3 mt-2 text-center text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Selesai ({selectedAddOns.length} dipilih)
            </button>
          </div>
        </ResponsiveModal>

        {/* Package Selector Modal */}
        <ResponsiveModal
          isOpen={showPackageSelector}
          onClose={() => setShowPackageSelector(false)}
          title="Pilih Paket"
          subtitle="Pilih paket harga yang tersedia"
        >
          <div className="space-y-3">
            {pricePackages.map((pkg) => {
              const isSelected = selectedPackage?.id === pkg.id;
              return (
                <button
                  key={pkg.id}
                  onClick={() => applyPackage(pkg)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all relative",
                    isSelected
                      ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200"
                      : "border-stone-200 hover:border-orange-300 hover:bg-orange-50"
                  )}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                  <div className="flex items-start justify-between pr-8">
                    <div>
                      <h3 className={cn("font-semibold", isSelected ? "text-orange-900" : "text-stone-900")}>
                        {pkg.name}
                      </h3>
                      <p className={cn("text-lg font-bold mt-1", isSelected ? "text-orange-600" : "text-orange-600")}>
                        Rp {pkg.price.toLocaleString("id-ID")}K
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {pkg.eventTypes.slice(0, 2).map((et) => (
                        <span
                          key={et}
                          className={cn(
                            "text-[10px] font-medium px-2 py-0.5 rounded-full",
                            isSelected
                              ? "bg-orange-200 text-orange-700"
                              : "bg-stone-100 text-stone-600"
                          )}
                        >
                          {EVENT_TYPE_LABELS[et] || et}
                        </span>
                      ))}
                    </div>
                  </div>
                  {pkg.description && (
                    <p className={cn("text-xs mt-2 line-clamp-2", isSelected ? "text-orange-700" : "text-stone-500")}>
                      {pkg.description}
                    </p>
                  )}
                </button>
              );
            })}
            
            <button
              onClick={() => setShowPackageSelector(false)}
              className="w-full p-3 text-center text-sm text-stone-500 hover:text-stone-700"
            >
              Isi harga manual
            </button>
          </div>
        </ResponsiveModal>
    </ResponsiveModal>
  );
}
