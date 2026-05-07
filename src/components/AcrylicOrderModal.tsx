"use client";
// src/components/AcrylicOrderModal.tsx
import { useState, useEffect } from "react";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import ResponsiveModal from "./ui/ResponsiveModal";
import { FormattedNumberInput } from "./ui/FormattedNumberInput";
import type { PanelType } from "@/types";
import type { AcrylicOrderWithRelations } from "@/types";
import toast from "react-hot-toast";

const TERM_CONDITIONS = [
  "Harga berlaku untuk 1 hari",
  "Wajib memberikan uang muka / DP minimum 50%",
  "Pelunasan paling lambat saat pengantaran",
  "Pengambilan papan H+1 acara",
  "Apabila terjadi kerusakan atau lainnya menjadi tanggung jawab penyewa, mohon dijaga dengan baik",
];

interface Props {
  onClose: () => void;
  onSuccess: (order: AcrylicOrderWithRelations) => void;
}

export default function AcrylicOrderModal({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [panelTypes, setPanelTypes] = useState<PanelType[]>([]);

  const [form, setForm] = useState({
    clientName: "",
    acrylicText: "",
    address: "",
    eventDate: "",
    eventTime: "",
    selectedPanels: [] as string[],
    totalPrice: "",
    initialPayment: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/panel-types")
      .then((res) => res.json())
      .then((data) => setPanelTypes(data))
      .catch(() => toast.error("Gagal memuat jenis papan"));
  }, []);

  const togglePanel = (name: string) => {
    setForm((f) => ({
      ...f,
      selectedPanels: f.selectedPanels.includes(name)
        ? f.selectedPanels.filter((p) => p !== name)
        : [...f.selectedPanels, name],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.clientName.trim()) { toast.error("Nama klien wajib diisi"); return; }
    if (!form.acrylicText.trim()) { toast.error("Teks ucapan wajib diisi"); return; }
    if (!form.address.trim()) { toast.error("Alamat wajib diisi"); return; }
    if (!form.eventDate) { toast.error("Tanggal acara wajib diisi"); return; }
    if (!form.totalPrice || parseInt(form.totalPrice) <= 0) { toast.error("Harga total wajib diisi"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/acrylic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: form.clientName.trim(),
          acrylicText: form.acrylicText.trim(),
          address: form.address.trim(),
          eventDate: form.eventDate,
          eventTime: form.eventTime.trim() || null,
          panelTypes: form.selectedPanels,
          totalPrice: parseInt(form.totalPrice),
          notes: form.notes.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();

      const newOrder: AcrylicOrderWithRelations = await res.json();

      // If initial payment provided, add payment too
      if (form.initialPayment && parseInt(form.initialPayment) > 0) {
        await fetch(`/api/acrylic/${newOrder.id}/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: parseInt(form.initialPayment),
            note: "DP",
          }),
        });
      }

      // Refetch to get updated order with payments
      const refreshed = await fetch(`/api/acrylic/${newOrder.id}`);
      const refreshedOrder: AcrylicOrderWithRelations = await refreshed.json();

      toast.success(`Order Acrylic ${newOrder.clientName} berhasil ditambahkan!`);
      onSuccess(refreshedOrder);
    } catch {
      toast.error("Gagal menambah order acrylic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      title="Order Acrylic Baru"
      subtitle="Form order papan acrylic"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nama klien */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">
            Nama Klien <span className="text-red-400">*</span>
          </label>
          <input
            className="input-base w-full"
            placeholder="Contoh: Keyza Amisya Putri M"
            value={form.clientName}
            onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            autoFocus
          />
        </div>

        {/* Teks Ucapan */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">
            Teks Ucapan <span className="text-red-400">*</span>
          </label>
          <textarea
            className="input-base w-full resize-none font-mono text-sm"
            rows={6}
            placeholder={"Happy Graduation\nKeyza Amisya Putri. M\nfinally you did it\nsemoga ilmunya berkah dan bermanfaat,\nproud of you kakak\n\nfrom : mama dan papa"}
            value={form.acrylicText}
            onChange={(e) => setForm({ ...form, acrylicText: e.target.value })}
          />
        </div>

        {/* Alamat */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">
            Alamat <span className="text-red-400">*</span>
          </label>
          <input
            className="input-base w-full"
            placeholder="Contoh: SMAN 7 SAROLANGUN"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        {/* Tanggal & Jam */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Tanggal Acara <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              className="input-base w-full"
              value={form.eventDate}
              onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Jam Acara</label>
            <input
              type="time"
              className="input-base w-full"
              value={form.eventTime}
              onChange={(e) => setForm({ ...form, eventTime: e.target.value })}
            />
          </div>
        </div>

        {/* Jenis Papan — multi-select */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Jenis Papan</label>
          <div className="flex gap-2 flex-wrap">
            {panelTypes.map((pt) => (
              <button
                key={pt.id}
                type="button"
                onClick={() => togglePanel(pt.name)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  form.selectedPanels.includes(pt.name)
                    ? "bg-cyan-500 text-white border-cyan-500"
                    : "bg-white text-stone-600 border-stone-200 hover:border-cyan-300"
                )}
              >
                {form.selectedPanels.includes(pt.name) && (
                  <Check size={12} className="inline mr-1" />
                )}
                {pt.name}
              </button>
            ))}
          </div>
        </div>

        {/* Harga & DP */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Harga Total (Rp) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium pointer-events-none z-10">Rp</span>
              <FormattedNumberInput
                value={form.totalPrice}
                onChange={(val: number) => setForm({ ...form, totalPrice: val.toString() })}
                placeholder="0"
                min={0}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">DP / Bayar Sekarang (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium pointer-events-none z-10">Rp</span>
              <FormattedNumberInput
                value={form.initialPayment}
                onChange={(val: number) => setForm({ ...form, initialPayment: val.toString() })}
                placeholder="Opsional"
                min={0}
              />
            </div>
          </div>
        </div>

        {/* Total Price Summary */}
        {form.totalPrice && parseInt(form.totalPrice) > 0 && (
          <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-cyan-700">Total Harga</span>
              <span className="text-lg font-bold text-cyan-700">
                Rp {parseInt(form.totalPrice || "0").toLocaleString("id-ID")}
              </span>
            </div>
            {form.initialPayment && parseInt(form.initialPayment) > 0 && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-medium text-cyan-700">Sisa Bayar</span>
                <span className="text-sm font-bold text-cyan-600">
                  Rp {Math.max(0, parseInt(form.totalPrice) - parseInt(form.initialPayment)).toLocaleString("id-ID")}
                </span>
              </div>
            )}
          </div>
        )}

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

        {/* Term & Conditions */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
          <p className="text-xs font-bold text-stone-600 uppercase tracking-wide mb-2">Term & Conditions</p>
          {TERM_CONDITIONS.map((term, i) => (
            <p key={i} className="text-xs text-stone-500 flex gap-2">
              <span className="text-stone-400 font-medium">{i + 1}.</span>
              {term}
            </p>
          ))}
          <p className="text-xs text-stone-400 mt-2 italic">segera kirim bukti pembayaran, trimakasih ☺️</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 pb-2">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
            Batal
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary flex-1">
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</>
              : "Simpan Order"
            }
          </button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
