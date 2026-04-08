"use client";
// src/components/BookingDetailPanel.tsx
import { useState } from "react";
import {
  MapPin, Calendar, Tag, CreditCard,
  Plus, Loader2, ArrowLeft, Pencil,
} from "lucide-react";
import { cn, formatDate, formatDateRange, getStatusColor, getStatusLabel, getPaymentStatus, getDaysUntil } from "@/lib/utils";
import { FormattedNumberInput } from "./ui/FormattedNumberInput";
import type { BookingWithRelations, Payment } from "@/types";
import toast from "react-hot-toast";

const EVENT_COLORS: Record<string, string> = {
  PENGAJIAN: "bg-purple-100 text-purple-700 border-purple-200",
  AKAD_MALAM: "bg-indigo-100 text-indigo-700 border-indigo-200",
  AKAD_SIANG: "bg-cyan-100 text-cyan-700 border-cyan-200",
  RESEPSI:   "bg-pink-100 text-pink-700 border-pink-200",
  TAMAT_KAJI:"bg-teal-100 text-teal-700 border-teal-200",
  LAINNYA:   "bg-stone-100 text-stone-600 border-stone-200",
};

interface Props {
  booking: BookingWithRelations;
  onClose: () => void;
  onPatch: (id: string, patch: Partial<BookingWithRelations>) => void;
}

export default function BookingDetailPanel({ booking, onClose, onPatch }: Props) {
  const [tab, setTab] = useState<"info" | "payment">("info");
  const [newPayment, setNewPayment] = useState("");
  const [addingPayment, setAddingPayment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Calculate totals from new schema
  const packagePrice = booking.pricePackage?.price || 0;
  const addOnsTotal = booking.bookingAddOns?.reduce((sum, a) => sum + a.price, 0) || 0;
  const transport = booking.transport || 0;
  const discount = booking.discount || 0;
  const totalPrice = Math.max(0, packagePrice + addOnsTotal + transport - discount);
  const totalPaid = booking.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const sisa = totalPrice - totalPaid;
  const progress = totalPrice > 0 ? Math.min(Math.round((totalPaid / totalPrice) * 100), 100) : 0;
  const pay = getPaymentStatus(totalPaid, totalPrice);

  // ─── Status ────────────────────────────────────────────────────────────────
  const handleUpdateStatus = async (status: string) => {
    if (status === booking.status || updatingStatus) return;
    // Optimistic
    onPatch(booking.id, { status });
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success("Status diperbarui");
    } catch {
      // Rollback
      onPatch(booking.id, { status: booking.status });
      toast.error("Gagal update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ─── Payments ──────────────────────────────────────────────────────────────
  const handleAddPayment = async () => {
    const amount = parseInt(newPayment);
    if (!amount || amount <= 0 || addingPayment) return;
    setAddingPayment(true);
    const newTotalPaid = totalPaid + amount;
    const newStatus = newTotalPaid >= totalPrice ? "COMPLETED" : booking.status;
    // Optimistic
    const tempPayment: Payment = {
      id: `temp-${Date.now()}`,
      bookingId: booking.id,
      amount,
      note: null,
      paidAt: new Date().toISOString(),
    };
    onPatch(booking.id, {
      payments: [tempPayment, ...(booking.payments || [])],
      status: newStatus,
    });
    setNewPayment("");
    try {
      const res = await fetch(`/api/bookings/${booking.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error();
      const saved: Payment = await res.json();
      onPatch(booking.id, {
        payments: [saved, ...(booking.payments || []).filter((p) => p.id !== tempPayment.id)],
      });
      toast.success(`Pembayaran Rp${amount.toLocaleString("id-ID")} dicatat`);
    } catch {
      // Rollback
      onPatch(booking.id, {
        payments: (booking.payments || []).filter((p) => p.id !== tempPayment.id),
        status: booking.status,
      });
      toast.error("Gagal catat pembayaran");
    } finally {
      setAddingPayment(false);
    }
  };

  return (
    <div
      className="card overflow-hidden flex flex-col h-full lg:h-auto"
      style={{ maxHeight: "calc(100vh - 140px)", position: "sticky", top: 0 }}
    >
      {/* Header */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 border-b border-stone-100 shrink-0">
        {/* Back button */}
        <button 
          onClick={onClose} 
          className="flex items-center gap-1 text-stone-500 hover:text-stone-700 text-sm font-medium mb-2 -ml-1"
        >
          <ArrowLeft size={16} />
          Kembali ke list
        </button>
        
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-stone-900 text-sm sm:text-base leading-tight truncate">
                {booking.clientName}
              </h3>
              {booking.isConfirmed && (
                <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full font-bold shrink-0">✓</span>
              )}
            </div>
            {booking.hashtag && (
              <p className="text-xs text-stone-400 mt-0.5 font-medium">{booking.hashtag}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Edit button */}
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('edit-booking', { detail: booking }))}
              className="btn btn-ghost w-8 h-8 p-0 justify-center text-stone-400 hover:text-orange-600"
              title="Edit booking"
            >
              <Pencil size={14} />
            </button>
          </div>
        </div>
        <div className="flex gap-1 mt-2 flex-wrap">
          {booking.bookingEventTypes?.map((bet) => (
            <span key={bet.eventType.id} className={cn("badge text-[10px]", EVENT_COLORS[bet.eventType.name] || "bg-stone-100 text-stone-600 border-stone-200")}>
              {bet.eventType.label}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-100 shrink-0">
        {(["info", "payment"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2.5 text-xs font-semibold transition-colors",
              tab === t
                ? "text-orange-600 border-b-2 border-orange-500"
                : "text-stone-400 hover:text-stone-600"
            )}
          >
            {t === "payment" ? "Bayar" : "Info"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="overflow-y-auto flex-1">

        {/* ── INFO TAB ──────────────────────────────────────────────────────── */}
        {tab === "info" && (
          <div className="p-4 space-y-4">
            <InfoRow icon={Calendar} label="Tanggal">
              <span className="text-sm font-medium text-stone-800">
                {formatDateRange(booking.startDate, booking.endDate)}
              </span>
            </InfoRow>

            {booking.location && (
              <InfoRow icon={MapPin} label="Lokasi">
                <span className="text-sm text-stone-700">{booking.location}</span>
              </InfoRow>
            )}

            <InfoRow icon={CreditCard} label="Paket">
              <div>
                <p className="text-sm font-bold text-stone-900">Rp {totalPrice.toLocaleString("id-ID")}</p>
                {booking.pricePackage && (
                  <p className="text-xs text-stone-500">{booking.pricePackage.name}</p>
                )}
                <div className="progress-bar mt-1.5">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className={cn("text-xs font-medium mt-1", pay.color.split(" ")[0])}>
                  {pay.label} · {progress}%
                  {sisa > 0 && ` · Sisa Rp${sisa.toLocaleString("id-ID")}`}
                </p>
              </div>
            </InfoRow>

            {booking.notes && (
              <InfoRow icon={Tag} label="Catatan">
                <p className="text-sm text-stone-700">{booking.notes}</p>
              </InfoRow>
            )}

            {/* Status picker */}
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Status</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const).map((s) => (
                  <button
                    key={s}
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(s)}
                    className={cn(
                      "text-xs py-1.5 px-2 rounded-lg font-medium border transition-all",
                      booking.status === s
                        ? getStatusColor(s) + " ring-2 ring-offset-1 ring-orange-300"
                        : "border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50"
                    )}
                  >
                    {getStatusLabel(s)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PAYMENT TAB ───────────────────────────────────────────────────── */}
        {tab === "payment" && (
          <div className="p-4 space-y-4">
            {/* Summary */}
            <div className="bg-stone-50 rounded-xl p-4 space-y-2 border border-stone-100">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Total Paket</span>
                <span className="font-semibold text-stone-900">Rp {totalPrice.toLocaleString("id-ID")}</span>
              </div>
              {booking.pricePackage && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-400 text-xs">{booking.pricePackage.name}</span>
                  <span className="text-stone-400 text-xs">Rp {packagePrice.toLocaleString("id-ID")}</span>
                </div>
              )}
              {addOnsTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-400 text-xs">Add-ons</span>
                  <span className="text-stone-400 text-xs">+Rp {addOnsTotal.toLocaleString("id-ID")}</span>
                </div>
              )}
              {transport > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-400 text-xs">Transport</span>
                  <span className="text-stone-400 text-xs">+Rp {transport.toLocaleString("id-ID")}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-400 text-xs">Diskon</span>
                  <span className="text-stone-400 text-xs">-Rp {discount.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Sudah Dibayar</span>
                <span className="font-semibold text-emerald-600">Rp {totalPaid.toLocaleString("id-ID")}</span>
              </div>
              <div className="border-t border-stone-200 pt-2 flex justify-between text-sm">
                <span className="font-semibold text-stone-600">Sisa</span>
                <span className={cn("font-bold", sisa > 0 ? "text-red-600" : "text-emerald-600")}>
                  {sisa > 0 ? `Rp ${sisa.toLocaleString("id-ID")}` : "✓ Lunas"}
                </span>
              </div>
              <div className="progress-bar mt-1">
                <div
                  className="progress-fill"
                  style={{
                    width: `${progress}%`,
                    background: progress >= 100 ? "#10b981" : "var(--brand)",
                  }}
                />
              </div>
            </div>

            {/* Add payment */}
            {sisa > 0 && (
              <div>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                  Catat Pembayaran
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium pointer-events-none z-10">Rp</span>
                    <FormattedNumberInput
                      value={parseInt(newPayment) || 0}
                      onChange={(val: number) => setNewPayment(val.toString())}
                      placeholder="0"
                      min={1}
                      className="text-sm py-1.5"
                    />
                  </div>
                  <button
                    onClick={handleAddPayment}
                    disabled={!newPayment || addingPayment}
                    className="btn btn-primary px-3 shrink-0 text-xs"
                  >
                    {addingPayment
                      ? <Loader2 size={14} className="animate-spin" />
                      : "Simpan"
                    }
                  </button>
                </div>
              </div>
            )}

            {/* Payment history */}
            {booking.payments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Riwayat</p>
                <div className="space-y-2">
                  {booking.payments.map((p) => {
                    const isTemp = p.id.startsWith("temp-");
                    return (
                      <div
                        key={p.id}
                        className={cn(
                          "flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg border border-emerald-100 transition-opacity",
                          isTemp && "opacity-60"
                        )}
                      >
                        <div>
                          <p className="text-sm font-semibold text-emerald-800">+Rp {p.amount.toLocaleString("id-ID")}</p>
                          {p.note && <p className="text-xs text-emerald-600">{p.note}</p>}
                        </div>
                        <p className="text-xs text-emerald-600">
                          {isTemp ? "Menyimpan..." : formatDate(p.paidAt)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
        <Icon size={13} className="text-stone-500" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[11px] text-stone-400 font-semibold uppercase tracking-wider mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  );
}
