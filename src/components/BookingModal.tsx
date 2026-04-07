"use client";
// src/components/BookingModal.tsx
import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingWithRelations } from "@/types";
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
  /** Called with the newly created booking object */
  onSuccess: (booking: BookingWithRelations) => void;
}

export default function BookingModal({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
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
    status: "PENDING",
    isConfirmed: false,
  });

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
          package: parseInt(form.package),
          dp: parseInt(form.dp) || 0,
          paid: parseInt(form.dp) || 0,
          location: form.location.trim() || null,
          eventType: form.eventType,
          startDate: form.startDate,
          endDate: form.endDate || null,
          notes: form.notes.trim() || null,
          status: form.status,
          isConfirmed: form.isConfirmed,
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
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div>
            <h2 className="font-bold text-stone-900">Tambah Booking Baru</h2>
            <p className="text-xs text-stone-400 mt-0.5">Isi data booking wedding</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost w-8 h-8 p-0 justify-center">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nama klien */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Nama Klien <span className="text-red-400">*</span>
            </label>
            <input
              className="input-base"
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
              className="input-base"
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
                className="input-base"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Tanggal Selesai</label>
              <input
                type="date"
                className="input-base"
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
              className="input-base"
              placeholder="Sungai Baung, GOR Panti, dll."
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          {/* Harga & DP */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Paket (Rp ribu) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium">Rp</span>
                <input
                  type="number"
                  className="input-base pl-8"
                  placeholder="800"
                  min="0"
                  value={form.package}
                  onChange={(e) => setForm({ ...form, package: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">DP (Rp ribu)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium">Rp</span>
                <input
                  type="number"
                  className="input-base pl-8"
                  placeholder="300"
                  min="0"
                  value={form.dp}
                  onChange={(e) => setForm({ ...form, dp: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Catatan</label>
            <textarea
              className="input-base resize-none"
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

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Batal
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center">
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</>
                : "Simpan Booking"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
