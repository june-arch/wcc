"use client";
// src/components/BookingModal.tsx
import { useState, useEffect } from "react";
import { Loader2, Package, Check, Plus, Minus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import ResponsiveModal from "./ui/ResponsiveModal";
import { FormattedNumberInput } from "./ui/FormattedNumberInput";
import type { BookingWithRelations, PricePackage, AddOn } from "@/types";
import toast from "react-hot-toast";

const EVENT_TYPES = ["PENGAJIAN", "AKAD", "RESEPSI", "TAMAT_KAJI", "LAINNYA"];
const EVENT_TYPE_LABELS: Record<string, string> = {
  PENGAJIAN: "Pengajian",
  AKAD: "Akad",
  RESEPSI: "Resepsi",
  TAMAT_KAJI: "Tamat Kaji",
  LAINNYA: "Lainnya",
};

interface Props {
  onClose: () => void;
  onSuccess: (booking: BookingWithRelations) => void;
}

export default function BookingModal({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [pricePackages, setPricePackages] = useState<PricePackage[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PricePackage | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [showPackageSelector, setShowPackageSelector] = useState(false);
  const [showAddOnSelector, setShowAddOnSelector] = useState(false);

  const [form, setForm] = useState({
    clientName: "",
    hashtag: "",
    package: "",
    dp: "",
    location: "",
    eventType: [] as string[],
    startDate: "",
    endDate: "",
    notes: "",
    transport: "",
    discount: "",
    status: "PENDING",
    isConfirmed: false,
  });

  // Fetch price packages and add-ons on mount
  useEffect(() => {
    fetch("/api/price-packages")
      .then((res) => res.json())
      .then((data) => setPricePackages(data.filter((p: PricePackage) => p.isActive)))
      .catch(() => toast.error("Gagal memuat paket harga"));
    
    fetch("/api/add-ons")
      .then((res) => res.json())
      .then((data) => setAddOns(data.filter((a: AddOn) => a.isActive)))
      .catch(() => toast.error("Gagal memuat add-ons"));
  }, []);

  // Calculate total price
  const basePrice = selectedPackage?.price || parseInt(form.package) || 0;
  const addOnsTotal = selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
  const transport = parseInt(form.transport) || 0;
  const discount = parseInt(form.discount) || 0;
  const totalPrice = Math.max(0, basePrice + addOnsTotal + transport - discount);

  const applyPackage = (pkg: PricePackage) => {
    setSelectedPackage(pkg);
    setForm((f) => ({
      ...f,
      package: pkg.price.toString(),
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

  const toggleEventType = (et: string) => {
    setForm((f) => ({
      ...f,
      eventType: f.eventType.includes(et)
        ? f.eventType.filter((e) => e !== et)
        : [...f.eventType, et],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName.trim()) { toast.error("Nama klien wajib diisi"); return; }
    if (!form.package) { toast.error("Harga paket wajib diisi"); return; }
    if (!form.startDate) { toast.error("Tanggal mulai wajib diisi"); return; }
    if (form.eventType.length === 0) { toast.error("Pilih minimal 1 jenis acara"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: form.clientName.trim(),
          hashtag: form.hashtag.trim() || null,
          package: totalPrice, // Use calculated total price
          dp: parseInt(form.dp) || 0,
          paid: parseInt(form.dp) || 0,
          transport: parseInt(form.transport) || 0,
          discount: parseInt(form.discount) || 0,
          location: form.location.trim() || null,
          eventType: form.eventType,
          startDate: form.startDate,
          endDate: form.endDate || null,
          notes: form.notes.trim() || null,
          status: form.status,
          isConfirmed: form.isConfirmed,
          pricePackageId: selectedPackage?.id || null,
          addOns: selectedAddOns.map((a) => ({ addOnId: a.id, price: a.price })),
        }),
      });
      if (!res.ok) throw new Error();
      const newBooking: BookingWithRelations = await res.json();
      toast.success(`Booking ${newBooking.clientName} berhasil ditambahkan!`);
      onSuccess(newBooking);
    } catch {
      toast.error("Gagal menambah booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      title="Tambah Booking Baru"
      subtitle="Isi data booking wedding"
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
            autoFocus
          />
        </div>

        {/* Hashtag */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Hashtag</label>
          <input
            className="input-base w-full"
            placeholder="#SariBudiForever"
            value={form.hashtag}
            onChange={(e) => setForm({ ...form, hashtag: e.target.value })}
          />
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
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  form.eventType.includes(et)
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-stone-600 border-stone-200 hover:border-orange-300"
                )}
              >
                {EVENT_TYPE_LABELS[et]}
              </button>
            ))}
          </div>
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
              min={form.startDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
        </div>

        {/* Lokasi */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Lokasi</label>
          <input
            className="input-base w-full"
            placeholder="Sungai Baung, GOR Panti, dll."
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>

        {/* Harga, DP, Transport & Diskon */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Paket (Rp) <span className="text-red-400">*</span>
            </label>
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
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium pointer-events-none z-10">Rp</span>
              <FormattedNumberInput
                value={parseInt(form.package) || 0}
                onChange={() => {}} // disabled, controlled by package selector
                placeholder="0"
                min={0}
                disabled
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">DP (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium pointer-events-none z-10">Rp</span>
              <FormattedNumberInput
                value={form.dp}
                onChange={(val: number) => setForm({ ...form, dp: val.toString() })}
                placeholder="0"
                min={0}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Transport (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium pointer-events-none z-10">Rp</span>
              <FormattedNumberInput
                value={form.transport}
                onChange={(val: number) => setForm({ ...form, transport: val.toString() })}
                placeholder="0"
                min={0}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Diskon (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium pointer-events-none z-10">-Rp</span>
              <FormattedNumberInput
                value={form.discount}
                onChange={(val: number) => setForm({ ...form, discount: val.toString() })}
                placeholder="0"
                min={0}
              />
            </div>
          </div>
        </div>

        {/* Catatan */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Catatan</label>
          <textarea
            className="input-base w-full resize-none"
            rows={2}
            placeholder="Catatan tambahan..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        {/* Konfirmasi toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => setForm({ ...form, isConfirmed: !form.isConfirmed })}
            className={cn(
              "relative w-10 h-5 rounded-full transition-colors",
              form.isConfirmed ? "bg-orange-500" : "bg-stone-300"
            )}
          >
            <div className={cn(
              "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
              form.isConfirmed ? "translate-x-5" : "translate-x-0.5"
            )} />
          </div>
          <span className="text-sm font-medium text-stone-700">Booking sudah dikonfirmasi</span>
        </label>

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
                  {addon.price > 0 && ` (+${addon.price.toLocaleString("id-ID")})`}
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
              <span className="text-stone-500">
                Paket {selectedPackage?.name || (parseInt(form.package) > 0 ? "(Custom)" : "-")}
              </span>
              <span className="font-medium">Rp {basePrice.toLocaleString("id-ID")}</span>
            </div>
            {selectedAddOns.map((addon) => (
              <div key={addon.id} className="flex justify-between text-sm">
                <span className="text-stone-500">{addon.name}</span>
                <span className="font-medium">+{addon.price.toLocaleString("id-ID")}</span>
              </div>
            ))}
            {transport > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Transport</span>
                <span className="font-medium">+{transport.toLocaleString("id-ID")}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Diskon</span>
                <span className="font-medium text-emerald-600">-{discount.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="border-t border-stone-200 pt-1 mt-1">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-stone-700">Total</span>
                <span className="text-orange-600">Rp {totalPrice.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 pb-2">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1 order-2 sm:order-1">
            Batal
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center order-1 sm:order-2">
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</>
              : "Simpan Booking"
            }
          </button>
        </div>
      </form>

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
                      Rp {pkg.price.toLocaleString("id-ID")}
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
                      {addon.price === 0 ? "Free" : `+${addon.price.toLocaleString("id-ID")}`}
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
    </ResponsiveModal>
  );
}
