"use client";
// src/components/ui/ReceiptModal.tsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Printer, X, FileDown, ImageDown } from "lucide-react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import toast from "react-hot-toast";
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
  const [exporting, setExporting] = useState<"png" | "pdf" | null>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  // Nama file dasar: kwitansi-<nama order>-<tanggal>
  const baseFileName = () => {
    const safeName = (clientName || payer)
      .replace(/[^\w\s-]/g, "") // buang karakter aneh (&, /, dll)
      .trim()
      .replace(/\s+/g, "-");
    const dateStr = format(new Date(paidAt), "yyyy-MM-dd");
    return `kwitansi-${safeName}-${dateStr}`;
  };

  // Set document.title sementara agar file PDF hasil unduh bernama
  // kwitansi-<nama order>-<tanggal>.pdf (Chrome pakai title sebagai nama file default)
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = baseFileName();
    const restore = () => {
      document.title = originalTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  };

  // Render isi kwitansi (watermark + konten, TANPA bar aksi) jadi PNG.
  // Batasan tinggi (max-h / overflow) dibuka sementara supaya SELURUH isi
  // ke-capture, bukan hanya area yang terlihat di modal (scrollable).
  const captureReceipt = async () => {
    const print = document.getElementById("receipt-print");
    const capture = document.getElementById("receipt-capture");
    const content = document.getElementById("receipt-content");
    if (!capture || !content) throw new Error("receipt element not found");

    const prevStyles = [print, capture, content]
      .filter((el): el is HTMLElement => !!el)
      .map((el) => ({ el, css: el.getAttribute("style") || "" }));
    print?.style.setProperty("max-height", "none");
    capture?.style.setProperty("max-height", "none");
    capture?.style.setProperty("height", "auto");
    content?.style.setProperty("max-height", "none");
    content?.style.setProperty("overflow", "visible");

    try {
      // Paksa rasio canvas = rasio kertas kwitansi (125:185 → 185/125 = 1.48).
      // Konten tetap di atas (natural), ruang putih di bawah — sama seperti hasil
      // print-to-PDF (@page 125mm 185mm). PDF jadi penuh tanpa white bar/distorsi.
      // Kalau konten lebih tinggi dari rasio, biarkan natural (jarang terjadi).
      // PENTING: pakai min-height, BUKAN height — capture wrapper adalah flex item
      // (flex-1 → flex-basis 0%), jadi height inline diabaikan oleh flex algorithm.
      const pageRatio = 185 / 125;
      const width = capture.offsetWidth;
      const targetH = Math.max(width * pageRatio, content.scrollHeight);
      if (capture.offsetHeight !== Math.round(targetH)) {
        capture.style.setProperty("min-height", `${Math.round(targetH)}px`);
      }
      await document.fonts?.ready;
      return await toPng(capture, {
        pixelRatio: 3, // tajam: modal 448px → ±1344px lebar
        backgroundColor: "#ffffff",
        cacheBust: true,
      });
    } finally {
      prevStyles.forEach(({ el, css }) => {
        if (css) el.setAttribute("style", css);
        else el.removeAttribute("style");
      });
    }
  };

  const handleDownloadPng = async () => {
    try {
      setExporting("png");
      const dataUrl = await captureReceipt();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${baseFileName()}.png`;
      a.click();
      toast.success("Kwitansi PNG terunduh");
    } catch (err) {
      console.error("PNG export failed:", err);
      toast.error("Gagal membuat PNG. Coba tombol Cetak.");
    } finally {
      setExporting(null);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setExporting("pdf");
      const dataUrl = await captureReceipt();
      const img = new Image();
      img.src = dataUrl;
      await img.decode();

      // PDF ukuran REAL kwitansi 125×185mm (sama dengan @page print, bukan A4)
      const pageW = 125;
      const pageH = 185;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pageW, pageH],
      });
      // contain + center: gambar diskalakan agar muat penuh tanpa terpotong/terdistorsi
      const ratio = img.width / img.height;
      let w = pageW;
      let h = w / ratio;
      if (h > pageH) {
        h = pageH;
        w = h * ratio;
      }
      pdf.addImage(dataUrl, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h);
      pdf.save(`${baseFileName()}.pdf`);
      toast.success("Kwitansi PDF terunduh");
    } catch (err) {
      console.error("PDF export failed:", err);
      toast.error("Gagal membuat PDF. Coba tombol Cetak.");
    } finally {
      setExporting(null);
    }
  };

  if (!open) return null;

  // Portal ke document.body — keluar dari stacking context
  // (PageTransition motion.div & BookingDetailPanel sticky) agar modal
  // selalu di atas BottomNav (z-50) di halaman mana pun.
  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/40 z-[60] animate-fade-in" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div
          id="receipt-print"
          className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col animate-slide-up relative"
        >
          {/* Aksi (tidak ikut tercetak / terunduh) */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 shrink-0 print:hidden relative z-10">
            <p className="text-sm font-semibold text-stone-700">Kwitansi Pembayaran</p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPng}
                disabled={exporting !== null}
                className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <ImageDown size={14} /> {exporting === "png" ? "Menyiapkan..." : "PNG"}
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={exporting !== null}
                className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <FileDown size={14} /> {exporting === "pdf" ? "Menyiapkan..." : "PDF"}
              </button>
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

          {/* Isi kwitansi — yang tercetak & diexport (watermark + konten) */}
          <div id="receipt-capture" className="relative flex-1 flex flex-col min-h-0">
            {/* Watermark logo — absolute di level capture; fixed saat print agar selalu di tengah halaman */}
            <div
              id="receipt-watermark"
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

            <div
              id="receipt-content"
              className="px-5 py-5 flex-1 overflow-y-auto overscroll-contain min-h-0 text-stone-900 relative z-10"
            >
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
                  <span className="text-stone-400 w-32 shrink-0 whitespace-nowrap">Telah diterima dari</span>
                  <span className="font-semibold">{payer}</span>
                </p>
                <p className="flex gap-2">
                  <span className="text-stone-400 w-32 shrink-0">Uang sejumlah</span>
                  <span className="font-semibold">Rp {amount.toLocaleString("id-ID")}</span>
                </p>
                <p className="text-xs text-stone-500 italic pl-32">{terbilang(amount)}</p>
                <p className="flex gap-2">
                  <span className="text-stone-400 w-32 shrink-0">Untuk</span>
                  <span className="font-semibold">{purpose}</span>
                </p>
                {eventDate && (
                  <p className="flex gap-2">
                    <span className="text-stone-400 w-32 shrink-0">Tanggal acara</span>
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
                    <span className="text-stone-400 w-32 shrink-0">Sisa</span>
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
                {/* Kiri: Yang menyerahkan */}
                <div>
                  <p className="text-stone-400 mb-2">Yang menyerahkan,</p>
                  {/* Spacer setinggi TTD agar nama sejajar dengan kolom kanan */}
                  <div className="h-16 flex items-end justify-center mb-1" aria-hidden="true" />
                  <p className="font-bold -mt-3">{clientName}</p>
                </div>
                {/* Kanan: Penerima */}
                <div>
                  <p className="text-stone-400 mb-2">Penerima,</p>
                  {/* TTD + stempel: inline-block agar stempel nempel di sisi kiri TTD */}
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/ttd-riska.png"
                      alt="Tanda tangan"
                      className="h-16 w-auto object-contain"
                    />
                    {/* Stempel nempel kiri TTD, setengah nutup — z tertinggi (di atas TTD & nama) */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/stempel-wcc.png"
                      alt="Stempel"
                      className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[4.5rem] w-[4.5rem] object-contain opacity-90 z-20"
                    />
                    {/* Nama penerima — absolute di bawah TTD, nimpa sedikit */}
                    <p className="absolute left-1/2 -translate-x-1/2 top-full -mt-3 font-bold whitespace-nowrap z-10">
                      {receiver || "Riska Yulanda Saputri"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
