# Kwitansi DP Orderan WCC — Implementation Plan

> **For Hermes:** Implementasi berurutan setelah user konfirmasi. Tanpa subagent (proyek kecil, 1 dev server).

**Goal:** Saat menambah orderan WCC dengan DP, otomatis muncul kwitansi siap-print dengan nomor urut resmi (KW-2608-001) yang disimpan di DB, dan bisa dicetak ulang dari detail booking.

**Architecture:** Nomor kwitansi dibuat server-side (helper `generateReceiptNumber`) dan disimpan di kolom baru `Payment.receiptNumber` (nullable + unique → migrasi aman ke Neon prod). Frontend menampilkan modal kwitansi (komponen baru `ReceiptModal.tsx`) yang hanya menampilkan kwitansi saat `window.print()` via CSS `@media print`. Terbilang rupiah pakai helper lokal (tanpa library baru).

**Tech Stack:** Next.js 15 App Router + Prisma 5.22 + Tailwind + date-fns (tidak ada library baru).

---

## Konteks / Asumsi

- Alur tambah booking: `BookingModal.tsx` POST ke `/api/bookings` dengan `initialPayment` → server membuat `Payment` dengan note `"DP/ Pembayaran pertama"`.
- Payment tambahan: `BookingDetailPanel.tsx` POST ke `/api/bookings/[id]/payments`.
- **Tidak ada pola print/`window.print` di project ini** — perlu dibuat dari nol (pola visibility + `@media print`).
- Tidak ada folder `prisma/migrations` — project pakai `prisma db push` (lihat skill wcc). Menambah kolom nullable = aman untuk prod.
- DB = **Neon PRODUCTION** (dipakai Vercel live). Perubahan schema langsung kena prod → hanya tambah kolom nullable, tanpa drop/rename.
- Payment lama (tanpa nomor) → di-backfill satu kali lewat script node (nomor diberikan saat eksekusi).
- Format nomor: `KW-YYMM-NNN` (contoh `KW-2608-001`), increment per bulan. Unique per payment.

## Keputusan desain (sudah dikonfirmasi user → opsi 2)

- **Cetak + nomor urut**: modal kwitansi siap-print; nomor otomatis berurutan disimpan di DB.
- Print via `window.print()` + CSS print (browser default print dialog → bisa simpan PDF).
- Digital/PNG/WA share = di luar scope (bisa ditambah nanti).

---

## Step-by-step

### Task 1: Tambah kolom `receiptNumber` di Payment

**Files:**
- Modify: `prisma/schema.prisma` (model Payment, baris ~181-191)

**Step 1:** Tambah field:

```prisma
model Payment {
  id            String   @id @default(cuid())
  bookingId     String
  booking       Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  amount        Int
  note          String?
  receiptNumber String?  @unique
  paidAt        DateTime @default(now())
  createdAt     DateTime @default(now())

  @@map("payments")
}
```

**Step 2:** Push ke Neon (hati-hati prod, tapi ini cuma add nullable kolom):

```bash
npx prisma db push
```

Expected: schema sync OK, tabel `payments` dapat kolom `receiptNumber`.

### Task 2: Helper `generateReceiptNumber` + terbilang

**Files:**
- Create: `src/lib/receipt.ts`

**Step 1:** Buat helper:

```ts
// src/lib/receipt.ts
import { prisma } from "./prisma";

/** Format: KW-YYMM-NNN, increment per bulan. Contoh: KW-2608-001 */
export async function generateReceiptNumber(): Promise<string> {
  const now = new Date();
  const yymm = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prefix = `KW-${yymm}-`;
  const last = await prisma.payment.findFirst({
    where: { receiptNumber: { startsWith: prefix } },
    orderBy: { receiptNumber: "desc" },
    select: { receiptNumber: true },
  });
  const next = last ? parseInt(last.receiptNumber!.slice(-3)) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

/** 1.250.000 -> "satu juta dua ratus lima puluh ribu rupiah" */
export function terbilang(n: number): string {
  const satuan = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  const penyebut = ["", "ribu", "juta", "miliar", "triliun"];
  if (n === 0) return "nol rupiah";
  const words: string[] = [];
  const chunk = (v: number, idx: number) => {
    const c = v % 1000;
    if (c === 0) return;
    let s = "";
    if (c >= 100) {
      s += (c === 100 ? "seratus" : satuan[Math.floor(c / 100)] + " ratus") + " ";
      if (c % 100) s += "";
    }
    const d = c % 100;
    if (d >= 1 && d <= 11) s += satuan[d];
    else if (d < 20) s += satuan[d % 10] + " belas";
    else s += satuan[Math.floor(d / 10)] + " puluh" + (d % 10 ? " " + satuan[d % 10] : "");
    // ribu khusus: 1000 = "seribu"
    let p = penyebut[idx];
    if (idx === 1 && c === 1) p = "";
    words.push((s + (p ? " " + p : "")).trim());
  };
  let v = n, i = 0;
  while (v > 0) { chunk(v, i); v = Math.floor(v / 1000); i++; }
  // handle "seribu" (1000) & "satu ribu" (1001-1999)
  let res = words.reverse().join(" ");
  if (n >= 1000 && n < 2000 && res.startsWith("satu ribu")) res = "seribu" + res.slice(9);
  return res + " rupiah";
}
```

Catatan: logika `terbilang` di atas harus diverifikasi dengan test cepat (`node -e`) untuk angka 1000, 1100, 2500000, 1999 sebelum dipakai. Perbaiki edge case di task ini, jangan di task berikutnya.

**Step 2:** Verifikasi terbilang:

```bash
node -e "const {terbilang}=require('./src/lib/receipt.ts')"  # via ts-node/tsx bila perlu
```

### Task 3: Set `receiptNumber` di kedua endpoint payment

**Files:**
- Modify: `src/app/api/bookings/route.ts` (bagian `initialPayment` create, ~baris 114-122)
- Modify: `src/app/api/bookings/[id]/payments/route.ts` (payment create, ~baris 17-25)

**Step 1:** Di `route.ts` (POST bookings), sebelum `prisma.booking.create`, generate nomor:

```ts
const receiptNumber = initialPayment > 0 ? await generateReceiptNumber() : null;
// lalu di data.payments.create:
payments: {
  create: {
    amount: initialPayment,
    paidAt: new Date(),
    note: "DP/ Pembayaran pertama",
    receiptNumber,
  },
},
```

**Step 2:** Di `[id]/payments/route.ts`, sebelum `prisma.payment.create`:

```ts
const receiptNumber = await generateReceiptNumber();
// data:
data: { bookingId: id, amount: body.amount, note: body.note ?? null, paidAt: ..., receiptNumber },
```

**Step 3:** Pastikan response payment menyertakan `receiptNumber` (otomatis karena create return full row).

### Task 4: Update tipe `Payment`

**Files:**
- Modify: `src/types/index.ts` (baris 24-30)

```ts
export type Payment = {
  id: string;
  bookingId: string;
  amount: number;
  note: string | null;
  receiptNumber: string | null;
  paidAt: Date | string;
};
```

### Task 5: Komponen `ReceiptModal` (kwitansi siap-print)

**Files:**
- Create: `src/components/ui/ReceiptModal.tsx`

**Step 1:** Modal dengan pola centered (ikuti fix DayDetailModal):

```tsx
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
  purpose: string;          // misal: "DP Paket Akad & Resepsi (Hari Sama)"
  eventDate?: string | null;
  paidAt: Date | string;
  payer?: string;           // nama yang bayar (default clientName)
  receiver?: string;        // nama penerima (dari createdBy / "Riska Yulanda Saputri")
}

export default function ReceiptModal({ open, onClose, receiptNumber, clientName, amount, purpose, eventDate, paidAt, payer = clientName, receiver }: ReceiptModalProps) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div id="receipt-print" className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col animate-slide-up">
          {/* Aksi (tidak ikut tercetak) */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 shrink-0 print:hidden">
            <p className="text-sm font-semibold text-stone-700">Kwitansi Pembayaran</p>
            <div className="flex items-center gap-2">
              <button onClick={() => window.print()} className="btn btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
                <Printer size={14} /> Cetak
              </button>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400">
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
                <p className="text-sm font-semibold">{format(new Date(paidAt), "d MMMM yyyy", { locale: idLocale })}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              <p className="flex gap-2"><span className="text-stone-400 w-24 shrink-0">Telah diterima dari</span><span className="font-semibold">{payer}</span></p>
              <p className="flex gap-2"><span className="text-stone-400 w-24 shrink-0">Uang sejumlah</span><span className="font-semibold">Rp {amount.toLocaleString("id-ID")}</span></p>
              <p className="text-xs text-stone-500 italic pl-26">{terbilang(amount)}</p>
              <p className="flex gap-2"><span className="text-stone-400 w-24 shrink-0">Untuk</span><span className="font-semibold">{purpose}</span></p>
              {eventDate && <p className="flex gap-2"><span className="text-stone-400 w-24 shrink-0">Tanggal acara</span><span>{format(new Date(eventDate), "d MMMM yyyy", { locale: idLocale })}</span></p>}
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
```

### Task 6: CSS print (hanya kwitansi yang tercetak)

**Files:**
- Modify: `src/app/globals.css` (akhir file)

```css
@media print {
  body * { visibility: hidden; }
  #receipt-print, #receipt-print * { visibility: visible; }
  #receipt-print {
    position: absolute;
    left: 0; top: 0;
    width: 100%;
    max-height: none;
    box-shadow: none;
    border-radius: 0;
  }
}
```

Catatan: `print:hidden` di Tailwind sudah menangani tombol aksi; CSS di atas menangani rest of page. Verifikasi print preview di browser (Ctrl+P) — hanya kwitansi yang tampil.

### Task 7: Integrasi BookingModal — tampilkan kwitansi setelah submit + DP

**Files:**
- Modify: `src/components/BookingModal.tsx` (state + success handler, ~baris 30-45 & 131-135)

**Step 1:** Tambah state kwitansi:

```ts
const [receipt, setReceipt] = useState<{ payment: Payment } | null>(null);
```

**Step 2:** Di `handleSubmit` setelah `onSuccess(newBooking)`:

```ts
const dpPayment = newBooking.payments?.find((p) => p.note === "DP/ Pembayaran pertama");
if (dpPayment?.receiptNumber) {
  setReceipt({
    payment: dpPayment,
    // kirim data booking untuk isi kwitansi
  });
}
```

**Step 3:** Render `ReceiptModal` di akhir komponen (di luar ResponsiveModal):

```tsx
<ReceiptModal
  open={!!receipt}
  onClose={() => { setReceipt(null); onClose(); }}
  receiptNumber={receipt?.payment.receiptNumber ?? ""}
  clientName={form.clientName.trim()}
  amount={receipt?.payment.amount ?? 0}
  purpose={`DP ${selectedPackage?.name ?? "Booking"}${form.hashtag ? ` — ${form.hashtag}` : ""}`}
  eventDate={form.startDate}
  paidAt={receipt?.payment.paidAt ?? new Date()}
/>
```

Catatan: `onClose` modal kwitansi harus menutup juga form booking (atau tunda — keputusan kecil: tutup keduanya, simpel & jelas).

### Task 8: Tombol "Kwitansi" per payment di BookingDetailPanel

**Files:**
- Modify: `src/components/BookingDetailPanel.tsx` (list payment ~baris 334-350)

**Step 1:** Tambah state + handler:

```ts
const [receipt, setReceipt] = useState<{ payment: Payment; purpose: string } | null>(null);
```

**Step 2:** Di list payment, tambah tombol kecil "Kwitansi" (muncul kalau `p.receiptNumber` ada):

```tsx
{p.receiptNumber && (
  <button onClick={() => setReceipt({ payment: p, purpose: ... })} className="...">
    Kwitansi
  </button>
)}
```

**Step 3:** Render `ReceiptModal` dengan data booking (purpose = `DP ${packageName}` atau note payment; eventDate = booking.startDate; receiver = booking.createdBy?.name).

### Task 9: Backfill payment lama tanpa nomor

**Files:**
- Create: `scripts/backfill-receipt-numbers.ts` (jalankan sekali, hapus setelahnya)

**Step 1:** Script node: iterasi payment yang `receiptNumber: null` urut `paidAt`, assign `generateReceiptNumber()`.

```bash
cd 'D:\web\junearch\wcc'
npx ts-node scripts/backfill-receipt-numbers.ts
```

Expected: semua payment lama dapat nomor KW-YYMM-NNN. Verifikasi via query count null = 0.

### Task 10: Verifikasi + commit + push

**Step 1:** Build:

```bash
cd 'D:\web\junearch\wcc'
# PASTIKAN dev server dimatikan dulu, atau pakai port terpisah — build & dev berebut .next!
npx next build
```

**Step 2:** Test manual di browser (`http://localhost:3100`):
1. Login (akun debug atau user punya) → Dashboard → Booking → Tambah Booking
2. Isi form + DP > 0 → submit → kwitansi muncul dengan nomor KW-2608-XXX
3. Klik Cetak → print preview hanya menampilkan kwitansi
4. Buka booking itu → tab Bayar → tombol Kwitansi di payment DP → cetak ulang OK
5. Cek DB: `SELECT receiptNumber FROM payments ORDER BY paidAt DESC` → nomor berurutan

**Step 3:** Commit + push:

```bash
git add prisma/schema.prisma src/lib/receipt.ts src/components/ui/ReceiptModal.tsx src/components/BookingModal.tsx src/components/BookingDetailPanel.tsx src/types/index.ts src/app/api/bookings src/app/globals.css
git -c core.autocrlf=false commit -m "feat: kwitansi DP untuk orderan WCC dengan nomor urut otomatis"
git push origin master
```

---

## Files ringkas

| Aksi | File |
|---|---|
| Modify | `prisma/schema.prisma` (+receiptNumber) |
| Create | `src/lib/receipt.ts` (generateReceiptNumber + terbilang) |
| Modify | `src/app/api/bookings/route.ts`, `src/app/api/bookings/[id]/payments/route.ts` |
| Modify | `src/types/index.ts` |
| Create | `src/components/ui/ReceiptModal.tsx` |
| Modify | `src/app/globals.css` (@media print) |
| Modify | `src/components/BookingModal.tsx`, `src/components/BookingDetailPanel.tsx` |
| Create (sementara) | `scripts/backfill-receipt-numbers.ts` |

## Risiko / Tradeoff / Open Questions

- **DB prod**: `prisma db push` menambah kolom nullable → aman, tapi lakukan di jam sepi & verifikasi setelahnya. Tidak ada drop/rename.
- **Race nomor kwitansi**: 2 booking submit bersamaan bisa dapat nomor sama → unique constraint akan reject. Karena 1 admin (user sendiri), risiko rendah; kalau terjadi, retry 1x di helper.
- **`terbilang` edge case**: angka 1000 ("seribu"), 1100 ("seribu seratus"), 1999 ("seribu sembilan ratus..."), 1.000.000 ("satu juta"). WAJIB diuji dulu di Task 2 sebelum dipakai.
- **Open question kecil**: apakah kwitansi juga mau dibuat untuk payment DP **Acrylic**? (Di luar scope sekarang — WCC dulu per request.)
- **Print di HP**: `window.print()` di mobile = save as PDF; layout kwitansi A5-ish di max-w-md sudah pas.
