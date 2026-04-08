"use client";
// src/components/EditBookingModal.tsx
import { useState, useEffect } from "react";
import { Loader2, Package, Check, Sparkles, Minus, Wallet, Plus, Pencil, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import ResponsiveModal from "./ui/ResponsiveModal";
import { FormattedNumberInput } from "./ui/FormattedNumberInput";
import type { BookingWithRelations, PricePackage, AddOn } from "@/types";
import toast from "react-hot-toast";

interface Props {
  booking: BookingWithRelations;
  onClose: () => void;
  onSuccess: (updated: BookingWithRelations) => void;
}

const EVENT_TYPES = ["PENGAJIAN", "AKAD_MALAM", "AKAD_SIANG", "RESEPSI", "TAMAT_KAJI", "LAINNYA"] as const;
const EVENT_TYPE_LABELS: Record<string, string> = {
  PENGAJIAN: "Pengajian",
  AKAD_MALAM: "Akad Malam",
  AKAD_SIANG: "Akad Siang",
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

  // Calculate base package price
  const transportCost = booking.transport || 0;
  const discountCost = booking.discount || 0;
  const addOnsCost = booking.bookingAddOns?.reduce((sum, ba) => sum + ba.price, 0) || 0;
  const basePackagePrice = (booking.pricePackage?.price || 0);
  
  // Calculate total paid from payments
  const totalPaid = booking.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

  // Debug: log booking event types
  console.log("Booking event types:", booking.bookingEventTypes);
  
  const initialEventTypeIds = booking.bookingEventTypes?.map(bet => {
    const name = bet.eventType?.name;
    console.log("Event type mapping:", { id: bet.eventTypeId, eventType: bet.eventType, name });
    return name || bet.eventTypeId;
  }) || [];
  console.log("Initial eventTypeIds:", initialEventTypeIds);

  const [form, setForm] = useState({
    clientName: booking.clientName,
    hashtag: booking.hashtag ?? "",
    location: booking.location ?? "",
    startDate: formatDateForInput(booking.startDate),
    endDate: formatDateForInput(booking.endDate),
    eventTypeIds: initialEventTypeIds,
    package: basePackagePrice,
    transport: booking.transport ?? 0,
    discount: booking.discount ?? 0,
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
  const basePrice = selectedPackage?.price || form.package;
  const addOnsTotal = selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
  const transport = form.transport || 0;
  const discount = form.discount || 0;
  const totalPrice = Math.max(0, basePrice + addOnsTotal + transport - discount);

  // Payment state (after totalPrice)
  const [newPaymentAmount, setNewPaymentAmount] = useState("");
  const [newPaymentNote, setNewPaymentNote] = useState("");
  const [addingPayment, setAddingPayment] = useState(false);
  const [payments, setPayments] = useState(booking.payments || []);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState("");
  const [editPaymentNote, setEditPaymentNote] = useState("");
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  // Calculate payment totals
  const currentTotalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, totalPrice - currentTotalPaid);

  const handleAddPayment = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    const amount = parseInt(newPaymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Masukkan jumlah pembayaran yang valid");
      return;
    }
    if (amount > remaining) {
      toast.error(`Jumlah melebihi sisa pembayaran (Rp ${remaining.toLocaleString("id-ID")})`);
      return;
    }
    
    setAddingPayment(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          paidAt: new Date().toISOString(),
          note: newPaymentNote.trim() || "Pembayaran",
        }),
      });
      
      if (!res.ok) throw new Error();
      
      const newPayment = await res.json();
      setPayments((prev) => [...prev, newPayment]);
      setNewPaymentAmount("");
      setNewPaymentNote("");
      toast.success(`Pembayaran Rp ${amount.toLocaleString("id-ID")} berhasil ditambahkan`);
    } catch {
      toast.error("Gagal menambahkan pembayaran");
    } finally {
      setAddingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Yakin ingin menghapus pembayaran ini?")) return;
    
    setDeletingPaymentId(paymentId);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/payments/${paymentId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) throw new Error();
      
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      toast.success("Pembayaran dihapus");
    } catch {
      toast.error("Gagal menghapus pembayaran");
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const handleUpdatePayment = async (paymentId: string) => {
    const amount = parseInt(editPaymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Masukkan jumlah yang valid");
      return;
    }
    
    // Calculate what total would be after this edit
    const otherPaymentsTotal = payments
      .filter((p) => p.id !== paymentId)
      .reduce((sum, p) => sum + p.amount, 0);
    const newTotalPaid = otherPaymentsTotal + amount;
    
    if (newTotalPaid > totalPrice) {
      toast.error(`Total pembayaran tidak boleh melebihi tagihan (Rp ${totalPrice.toLocaleString("id-ID")})`);
      return;
    }
    
    try {
      const res = await fetch(`/api/bookings/${booking.id}/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          note: editPaymentNote.trim() || undefined,
        }),
      });
      
      if (!res.ok) throw new Error();
      
      const updated = await res.json();
      setPayments((prev) => prev.map((p) => (p.id === paymentId ? updated : p)));
      setEditingPaymentId(null);
      setEditPaymentAmount("");
      toast.success("Pembayaran diperbarui");
    } catch {
      toast.error("Gagal memperbarui pembayaran");
    }
  };

  const startEditPayment = (payment: { id: string; amount: number; note?: string | null }) => {
    setEditingPaymentId(payment.id);
    setEditPaymentAmount(payment.amount.toString());
    setEditPaymentNote(payment.note || "");
  };

  const cancelEditPayment = () => {
    setEditingPaymentId(null);
    setEditPaymentAmount("");
    setEditPaymentNote("");
  };

  // Fetch price packages and add-ons
  useEffect(() => {
    // Fetch packages
    fetch("/api/price-packages")
      .then((res) => res.json())
      .then((data) => {
        const active = data.filter((p: PricePackage) => p.isActive);
        setPricePackages(active);
        // Calculate base package price by using the relational data
        const basePackagePrice = booking.pricePackage?.price || 0;
        
        // Find package by ID if available, otherwise by price
        let matching = null;
        if (booking.pricePackageId) {
          matching = active.find((p: PricePackage) => p.id === booking.pricePackageId);
        }
        if (!matching) {
          matching = active.find((p: PricePackage) => p.price === basePackagePrice);
        }
        if (matching) {
          setSelectedPackage(matching);
          // Apply package event types to form if package has event types
          if (matching.packageEventTypes && matching.packageEventTypes.length > 0) {
            const packageEventNames = matching.packageEventTypes.map(
              (pet: { eventType?: { name: string }; eventTypeId: string }) => pet.eventType?.name || pet.eventTypeId
            );
            setForm((prev) => ({
              ...prev,
              eventTypeIds: packageEventNames,
            }));
            console.log("Applied package event types:", packageEventNames);
          }
          console.log("Auto-selected package:", matching.name, "Base price:", basePackagePrice);
        } else {
          console.log("No matching package for calculated base price:", basePackagePrice);
          // Fallback: try to find closest package
          const closest = active.reduce((prev: PricePackage, curr: PricePackage) => {
            return Math.abs(curr.price - basePackagePrice) < Math.abs(prev.price - basePackagePrice) ? curr : prev;
          });
          if (closest && Math.abs(closest.price - basePackagePrice) <= 100000) { // Within 100k tolerance
            setSelectedPackage(closest);
            // Apply closest package event types
            if (closest.packageEventTypes && closest.packageEventTypes.length > 0) {
              const packageEventNames = closest.packageEventTypes.map(
                (pet: { eventType?: { name: string }; eventTypeId: string }) => pet.eventType?.name || pet.eventTypeId
              );
              setForm((prev) => ({
                ...prev,
                eventTypeIds: packageEventNames,
              }));
            }
            console.log("Auto-selected closest package:", closest.name);
          }
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
  }, [booking.pricePackage, booking.bookingAddOns]);

  const toggleEventType = (et: string) => {
    setForm((prev) => ({
      ...prev,
      eventTypeIds: prev.eventTypeIds.includes(et)
        ? prev.eventTypeIds.filter((t) => t !== et)
        : [...prev.eventTypeIds, et],
    }));
  };

  const applyPackage = (pkg: PricePackage) => {
    setSelectedPackage(pkg);
    setForm((f) => {
      return {
        ...f,
        package: pkg.price,
        eventTypeIds: pkg.packageEventTypes?.map((pet: { eventType?: { name: string }; eventTypeId: string }) => pet.eventType?.name || pet.eventTypeId) || f.eventTypeIds,
      };
    });
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
    
    // Debug log
    console.log("Submitting form:", { clientName: form.clientName, eventTypeIds: form.eventTypeIds });
    
    if (!form.clientName?.trim()) {
      toast.error("Nama klien wajib diisi");
      return;
    }
    if (form.eventTypeIds.length === 0) {
      toast.error("Jenis acara wajib dipilih minimal satu");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: form.clientName,
          hashtag: form.hashtag,
          location: form.location,
          startDate: form.startDate,
          endDate: form.endDate,
          eventTypeIds: form.eventTypeIds,
          isConfirmed: form.isConfirmed,
          notes: form.notes,
          transport: Number(form.transport),
          discount: form.discount || 0,
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
                  form.eventTypeIds.includes(et)
                    ? "bg-orange-50 border-orange-300 text-orange-700"
                    : "border-stone-200 text-stone-500 hover:border-stone-300"
                )}
              >
                {EVENT_TYPE_LABELS[et]}
              </button>
            ))}
          </div>
        </div>

        {/* Paket, Dibayar & Diskon */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Total Paket (Rp)</label>
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
                value={form.package}
                onChange={() => {}} // disabled, controlled by package selector
                placeholder="0"
                min={0}
                disabled
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Transport (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium pointer-events-none z-10">Rp</span>
              <FormattedNumberInput
                value={form.transport}
                onChange={(val: number) => setForm({ ...form, transport: val })}
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
                onChange={(val: number) => setForm({ ...form, discount: val })}
                placeholder="0"
                min={0}
              />
            </div>
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
                Paket {selectedPackage?.name || (form.package > 0 ? "(Custom)" : "-")}
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

        {/* Payment Section */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
          <div className="flex items-center gap-2 text-stone-700">
            <Wallet size={18} className="text-orange-500" />
            <span className="font-semibold text-sm">Pembayaran</span>
          </div>
          
          {/* Payment Summary */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Total Tagihan</span>
              <span className="font-medium">Rp {totalPrice.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Sudah Dibayar</span>
              <span className="font-medium text-emerald-600">Rp {currentTotalPaid.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-stone-700">Sisa Pembayaran</span>
              <span className={remaining > 0 ? "text-orange-600" : "text-emerald-600"}>
                Rp {remaining.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Payment List */}
          {payments.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-stone-200">
              <div className="flex text-xs text-stone-500 border-b border-stone-100 pb-1">
                <span className="w-6">No</span>
                <span className="w-20">Tanggal</span>
                <span className="flex-1">Keterangan</span>
                <span className="w-24 text-right">Jumlah</span>
                <span className="w-14"></span>
              </div>
              {payments.map((payment, idx) => (
                <div key={payment.id} className="flex items-center gap-1 text-sm py-1">
                  <span className="text-stone-500 text-xs w-6">{idx + 1}.</span>
                  <span className="text-stone-500 text-xs w-20 shrink-0">{new Date(payment.paidAt).toLocaleDateString("id-ID")}</span>
                  
                  {editingPaymentId === payment.id ? (
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-stone-400">Rp</span>
                          <FormattedNumberInput
                            value={editPaymentAmount}
                            onChange={(val: number) => setEditPaymentAmount(val.toString())}
                            placeholder="Jumlah"
                            min={0}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleUpdatePayment(payment.id);
                          }}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            cancelEditPayment();
                          }}
                          className="p-1 text-stone-400 hover:bg-stone-100 rounded"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <textarea
                        className="input-base w-full text-xs min-h-[40px] resize-none"
                        placeholder="Keterangan (opsional)..."
                        value={editPaymentNote}
                        onChange={(e) => setEditPaymentNote(e.target.value)}
                        rows={2}
                      />
                    </div>
                  ) : (
                    <>
                      <span className="text-stone-600 text-xs flex-1 truncate" title={payment.note || "-"}>
                        {payment.note || "-"}
                      </span>
                      <span className="font-medium text-emerald-600 w-24 text-right shrink-0">
                        +Rp {payment.amount.toLocaleString("id-ID")}
                      </span>
                      <div className="flex items-center gap-1 w-14 shrink-0 justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            startEditPayment({
                              id: payment.id,
                              amount: payment.amount,
                              note: payment.note,
                            });
                          }}
                          disabled={deletingPaymentId === payment.id}
                          className="p-1 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeletePayment(payment.id);
                          }}
                          disabled={deletingPaymentId === payment.id}
                          className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          {deletingPaymentId === payment.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Payment Input */}
          {remaining > 0 && (
            <div className="space-y-2 pt-2 border-t border-stone-200">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium">Rp</span>
                  <FormattedNumberInput
                    value={newPaymentAmount}
                    onChange={(val: number) => setNewPaymentAmount(val.toString())}
                    placeholder={`Max Rp ${remaining.toLocaleString("id-ID")}`}
                    min={0}
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => handleAddPayment(e)}
                  disabled={addingPayment || !newPaymentAmount}
                  className="btn btn-primary px-3 py-2"
                >
                  {addingPayment ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                </button>
              </div>
              <textarea
                className="input-base w-full text-xs min-h-[50px] resize-none"
                placeholder="Keterangan pembayaran (opsional)..."
                value={newPaymentNote}
                onChange={(e) => setNewPaymentNote(e.target.value)}
                rows={2}
              />
            </div>
          )}
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
        <div className="flex gap-3 pt-4 pb-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary flex-1"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex-1"
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
                      {pkg.packageEventTypes?.slice(0, 2).map((pet: { eventType: { name: string; label: string } }) => (
                        <span
                          key={pet.eventType.name}
                          className={cn(
                            "text-[10px] font-medium px-2 py-0.5 rounded-full",
                            isSelected
                              ? "bg-orange-200 text-orange-700"
                              : "bg-stone-100 text-stone-600"
                          )}
                        >
                          {pet.eventType.label}
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
