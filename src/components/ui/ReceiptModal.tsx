"use client";
// src/components/ui/ReceiptModal.tsx
import { useEffect } from "react";
import { Printer, X } from "lucide-react";
import { terbilang } from "@/lib/receipt";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  receiptNumber: string;
  clientName: string;
  amount: number;
  purpose: string; // misal: "DP Paket Akad & Resepsi (Hari Sama)"
  eventDate?: string | null;
  paidAt: Date | string;
  payer?: string; // nama yang bayar (default clientName)
  receiver?: string; // nama penerima (dari createdBy / "WCC Oranye Capture")
}

export default function ReceiptModal({
  open,
  onClose,
  receiptNumber,
  clientName,
  amount,
  purpose,
  eventDate,
  paidAt,
  payer = clientName,
  receiver,
}: ReceiptModalProps) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          id="receipt-print"
          className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col animate-slide-up"
        >
          {/* Aksi (tidak ikut tercetak) */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 shrink-0 print:hidden">
            <p className="text-sm font-semibold text-stone-700">Kwitansi Pembayaran</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="btn btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <Printer size={14} /> Cetak
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Isi kwitansi (yang tercetak) */}
          <div className="px-5 py-5 flex-1 overflow-y-auto min-h-0 bg-white text-stone-900">
            {/* Kop */}
            <div className="text-center border-b-2 border-dashed border-stone-300 pb-3 mb-4">
              <h1 className="text-lg font-bold tracking-tight">WCC Oranye Capture</h1>
              <p className="text-xs text-stone-500">Acrylic Oranye Craft</p>
            </div>

            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-stone-400 font-medium">No. Kwitansi</p>
                <p className="font-mono text-sm font-bold text-orange-600">{receiptNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-stone-400 font-medium">Tanggal</p>
                <p className="text-sm font-semibold">
                  {format(new Date(paidAt), "d MMMM yyyy", { locale: idLocale })}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              <p className="flex gap-2">
                <span className="text-stone-400 w-24 shrink-0">Telah diterima dari</span>
                <span className="font-semibold">{payer}</span>
              </p>
              <p className="flex gap-2">
                <span className="text-stone-400 w-24 shrink-0">Uang sejumlah</span>
                <span className="font-semibold">Rp {amount.toLocaleString("id-ID")}</span>
              </p>
              <p className="text-xs text-stone-500 italic pl-26">{terbilang(amount)}</p>
              <p className="flex gap-2">
                <span className="text-stone-400 w-24 shrink-0">Untuk</span>
                <span className="font-semibold">{purpose}</span>
              </p>
              {eventDate && (
                <p className="flex gap-2">
                  <span className="text-stone-400 w-24 shrink-0">Tanggal acara</span>
                  <span>{format(new Date(eventDate), "d MMMM yyyy", { locale: idLocale })}</span>
                </p>
              )}
            </div>

            {/* TTD */}
            <div className="mt-8 grid grid-cols-2 gap-4 text-center text-xs">
              <div>
                <p className="text-stone-400 mb-10">Yang menyerahkan,</p>
                <p className="font-bold">{clientName}</p>
              </div>
              <div>
                <p className="text-stone-400 mb-10">Penerima,</p>
                <p className="font-bold">{receiver || "WCC Oranye Capture"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
