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
  eventDate?: string | null; // tanggal mulai acara
  eventDateEnd?: string | null; // tanggal akhir acara (untuk acara 2 hari)
  totalAmount?: number; // total harga booking
  totalPaid?: number; // total sudah dibayar (untuk hitung sisa)
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
  eventDateEnd,
  totalAmount,
  totalPaid,
  paidAt,
  payer = clientName,
  receiver,
}: ReceiptModalProps) {
  // sisa pembayaran (kalau masih DP)
  const sisa =
    typeof totalAmount === "number" && typeof totalPaid === "number"
      ? Math.max(0, totalAmount - totalPaid)
      : 0;
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  // Set document.title sementara agar file PDF hasil unduh bernama
  // kwitansi-<nama order>-<tanggal>.pdf (Chrome pakai title sebagai nama file default)
  const handlePrint = () => {
    const originalTitle = document.title;
    const safeName = (clientName || payer)
      .replace(/[^\w\s-]/g, "") // buang karakter aneh (&, /, dll)
      .trim()
      .replace(/\s+/g, "-");
    const dateStr = format(new Date(paidAt), "yyyy-MM-dd");
    document.title = `kwitansi-${safeName}-${dateStr}`;
    const restore = () => {
      document.title = originalTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          id="receipt-print"
          className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col animate-slide-up relative"
        >
          {/* Watermark logo — absolute di level card, fixed saat print agar selalu di tengah halaman */}
          <div
            className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
            aria-hidden="true"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-kwitansi.png"
              alt=""
              className="w-64 h-64 opacity-[0.06] mix-blend-multiply select-none"
            />
          </div>
          {/* Aksi (tidak ikut tercetak) */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 shrink-0 print:hidden">
            <p className="text-sm font-semibold text-stone-700">Kwitansi Pembayaran</p>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
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
          <div className="px-5 py-5 flex-1 overflow-y-auto min-h-0 bg-white text-stone-900 relative z-10">

            {/* Kop */}
            <div className="text-center border-b-2 border-dashed border-stone-300 pb-3 mb-4 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-kwitansi.png"
                alt="WCC Oranye Capture"
                className="h-14 w-auto mx-auto mb-2 object-contain"
              />
              <h1 className="text-lg font-bold tracking-tight">WCC Oranye Capture</h1>
              <p className="text-xs text-stone-500">Kwitansi Pembayaran</p>
            </div>

            <div className="flex items-start justify-between gap-3 mb-4 relative">
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

            <div className="space-y-2.5 text-sm relative">
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
                  <span className="font-semibold">
                    {format(new Date(eventDate), "d MMMM yyyy", { locale: idLocale })}
                    {eventDateEnd && format(new Date(eventDateEnd), "yyyy-MM-dd") !== format(new Date(eventDate), "yyyy-MM-dd") && (
                      <>, {format(new Date(eventDateEnd), "d MMMM yyyy", { locale: idLocale })}</>
                    )}
                  </span>
                </p>
              )}
              {/* Sisa pembayaran — hanya muncul kalau masih DP */}
              {sisa > 0 && (
                <p className="flex gap-2">
                  <span className="text-stone-400 w-24 shrink-0">Sisa</span>
                  <span className="font-semibold text-red-600">
                    Rp {sisa.toLocaleString("id-ID")}
                  </span>
                </p>
              )}
              {/* Pelunasan wajib setelah acara selesai */}
              {eventDateEnd && (
                <p className="text-[11px] text-stone-500 border-t border-dashed border-stone-200 pt-2 mt-1">
                  * Pelunasan wajib setelah acara selesai, paling lambat tanggal{" "}
                  <span className="font-semibold text-stone-700">
                    {format(new Date(eventDateEnd), "d MMMM yyyy", { locale: idLocale })}
                  </span>
                </p>
              )}
            </div>

            {/* TTD */}
            <div className="mt-6 grid grid-cols-2 gap-4 text-center text-xs relative z-10">
              <div>
                <p className="text-stone-400 mb-10">Yang menyerahkan,</p>
                <p className="font-bold">{clientName}</p>
              </div>
              <div>
                <p className="text-stone-400 mb-1">Penerima,</p>
                {/* TTD dengan stempel menimpa di atasnya */}
                <div className="relative inline-block mb-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/ttd-riska.png"
                    alt="Tanda tangan"
                    className="h-12 w-auto object-contain"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/stempel-wcc.png"
                    alt="Stempel"
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 object-contain opacity-90"
                  />
                </div>
                <p className="font-bold">{receiver || "Riska Yulanda Saputri"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
