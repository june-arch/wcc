"use client";
// src/components/AcrylicDetailPanel.tsx
import { useState } from "react";
import {
  MapPin, Calendar, Clock, Package, CreditCard,
  Plus, Loader2, ArrowLeft, Pencil, Trash2,
} from "lucide-react";
import { cn, formatDate, getStatusColor, getStatusLabel, getDaysUntil } from "@/lib/utils";
import { FormattedNumberInput } from "./ui/FormattedNumberInput";
import type { AcrylicOrderWithRelations, AcrylicPayment } from "@/types";
import toast from "react-hot-toast";

interface Props {
  order: AcrylicOrderWithRelations;
  onClose: () => void;
  onPatch: (id: string, patch: Partial<AcrylicOrderWithRelations>) => void;
  onDelete?: (id: string) => void;
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Dikonfirmasi" },
  { value: "COMPLETED", label: "Lunas" },
  { value: "CANCELLED", label: "Batal" },
];

export default function AcrylicDetailPanel({ order, onClose, onPatch, onDelete }: Props) {
  const [tab, setTab] = useState<"info" | "payment">("info");
  const [newPayment, setNewPayment] = useState("");
  const [addingPayment, setAddingPayment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  const totalPaid = order.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const sisa = order.totalPrice - totalPaid;
  const progress = order.totalPrice > 0 ? Math.min(Math.round((totalPaid / order.totalPrice) * 100), 100) : 0;

  const getPaymentLabel = () => {
    if (progress >= 100) return { label: "Lunas", color: "bg-emerald-100 text-emerald-700" };
    if (progress > 0) return { label: `DP ${progress}%`, color: "bg-amber-100 text-amber-700" };
    return { label: "Belum Bayar", color: "bg-stone-100 text-stone-600" };
  };
  const pay = getPaymentLabel();

  const handleAddPayment = async () => {
    const amount = parseInt(newPayment);
    if (!amount || amount <= 0 || addingPayment) return;
    setAddingPayment(true);

    const tempPayment: AcrylicPayment = {
      id: `temp-${Date.now()}`,
      acrylicOrderId: order.id,
      amount,
      note: null,
      paidAt: new Date().toISOString(),
    };

    // Optimistic
    onPatch(order.id, {
      payments: [tempPayment, ...(order.payments || [])],
    });
    setNewPayment("");

    try {
      const res = await fetch(`/api/acrylic/${order.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error();
      const saved: AcrylicPayment = await res.json();

      // Refetch order to get updated status
      const refreshed = await fetch(`/api/acrylic/${order.id}`);
      const refreshedOrder: AcrylicOrderWithRelations = await refreshed.json();

      onPatch(order.id, {
        payments: [saved, ...(order.payments || []).filter((p) => !p.id.startsWith("temp-"))],
        status: refreshedOrder.status,
      });

      toast.success(`Pembayaran Rp${amount.toLocaleString("id-ID")} dicatat`);
    } catch {
      // Rollback
      onPatch(order.id, { payments: order.payments });
      toast.error("Gagal mencatat pembayaran");
    } finally {
      setAddingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (deletingPaymentId) return;
    setDeletingPaymentId(paymentId);

    const paymentToDelete = order.payments?.find((p) => p.id === paymentId);
    // Optimistic
    onPatch(order.id, {
      payments: (order.payments || []).filter((p) => p.id !== paymentId),
    });

    try {
      const res = await fetch(`/api/acrylic/${order.id}/payments/${paymentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();

      // Refetch for correct status
      const refreshed = await fetch(`/api/acrylic/${order.id}`);
      const refreshedOrder: AcrylicOrderWithRelations = await refreshed.json();
      onPatch(order.id, { status: refreshedOrder.status });

      toast.success("Pembayaran dihapus");
    } catch {
      // Rollback
      if (paymentToDelete) {
        onPatch(order.id, { payments: [paymentToDelete, ...(order.payments || [])] });
      }
      toast.error("Gagal hapus pembayaran");
    } finally {
      setDeletingPaymentId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-stone-200">
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
          <ArrowLeft size={20} className="text-stone-500" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-stone-900 truncate">{order.clientName}</h2>
          <p className="text-xs text-stone-500">Order Acrylic</p>
        </div>
        <span className={cn("badge", getStatusColor(order.status))}>
          {getStatusLabel(order.status)}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200">
        {(["info", "payment"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === t ? "text-orange-600 border-orange-600" : "text-stone-400 border-transparent hover:text-stone-600"
            )}
          >
            {t === "info" ? "Info" : "Pembayaran"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "info" ? (
          <div className="p-4 space-y-5">
            {/* Ucapan / acrylic text */}
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Teks Ucapan</p>
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                <pre className="text-sm text-stone-700 whitespace-pre-wrap font-mono leading-relaxed">
                  {order.acrylicText}
                </pre>
              </div>
            </div>

            {/* Info grid */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-cyan-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-stone-500">Alamat</p>
                  <p className="text-sm font-medium text-stone-900">{order.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-cyan-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-stone-500">Tanggal & Jam</p>
                  <p className="text-sm font-medium text-stone-900">
                    {formatDate(order.eventDate)}
                    {order.eventTime && ` — ${order.eventTime}`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package size={16} className="text-cyan-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-stone-500">Jenis Papan</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {order.panelTypes?.map((pt, i) => (
                      <span key={i} className="text-xs font-medium px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                        {pt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {order.notes && (
                <div className="flex items-start gap-3">
                  <div className="text-stone-400 mt-0.5">📝</div>
                  <div>
                    <p className="text-xs text-stone-500">Catatan</p>
                    <p className="text-sm text-stone-700">{order.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-cyan-700">Total Harga</span>
                <span className="text-xl font-bold text-cyan-700">
                  Rp {order.totalPrice.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-cyan-600">Sudah Dibayar</span>
                <span className="text-sm font-bold text-emerald-600">
                  Rp {totalPaid.toLocaleString("id-ID")}
                </span>
              </div>
              {sisa > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-cyan-600">Sisa</span>
                  <span className="text-sm font-bold text-red-500">
                    Rp {sisa.toLocaleString("id-ID")}
                  </span>
                </div>
              )}
              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-cyan-600">Progress</span>
                  <span className="font-medium text-cyan-700">{progress}%</span>
                </div>
                <div className="h-2 bg-cyan-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="text-center">
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", pay.color)}>
                  {pay.label}
                </span>
              </div>
            </div>

            {/* Status change */}
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Ubah Status</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {}}
                    disabled={order.status === opt.value}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                      order.status === opt.value
                        ? "bg-cyan-500 text-white border-cyan-500"
                        : "bg-white text-stone-600 border-stone-200 hover:border-cyan-300"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Add payment */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Tambah Pembayaran
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium">Rp</span>
                  <FormattedNumberInput
                    value={newPayment}
                    onChange={(val: number) => setNewPayment(val.toString())}
                    placeholder="Nominal"
                    min={1}
                  />
                </div>
                <button
                  onClick={handleAddPayment}
                  disabled={!newPayment || addingPayment}
                  className="btn btn-primary gap-1.5 shrink-0"
                >
                  {addingPayment ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Bayar
                </button>
              </div>
            </div>

            {/* Payment history */}
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                Riwayat Pembayaran ({order.payments?.length || 0})
              </p>
              {(order.payments || []).length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard size={32} className="mx-auto text-stone-300 mb-2" />
                  <p className="text-sm text-stone-400">Belum ada pembayaran</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(order.payments || []).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                      <div>
                        <p className="text-sm font-semibold text-stone-900">
                          Rp {p.amount.toLocaleString("id-ID")}
                        </p>
                        <p className="text-xs text-stone-400">
                          {formatDate(p.paidAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeletePayment(p.id)}
                        disabled={deletingPaymentId === p.id}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          deletingPaymentId === p.id
                            ? "text-stone-300"
                            : "text-stone-400 hover:text-red-500 hover:bg-red-50"
                        )}
                      >
                        {deletingPaymentId === p.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
