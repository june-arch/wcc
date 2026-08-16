// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "-";
  return format(d, "dd MMM yyyy", { locale: idLocale });
}

export function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

// Awal hari ini dalam WIB (Asia/Jakarta) sebagai Date UTC.
// PENTING: Vercel server berjalan di timezone UTC — `new Date(); setHours(0,0,0,0)` di server
// menghitung "hari ini" berdasarkan UTC (bisa beda hari dengan WIB), membuat filter
// tanggal (mis. "orderan sudah lewat") salah di production. Selalu pakai helper ini
// untuk batas "hari ini" yang mengikuti zona waktu bisnis Indonesia.
export function startOfTodayWIB(): Date {
  const wib = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // "2026-08-17"
  return new Date(`${wib}T00:00:00+07:00`); // 17 Agu 00:00 WIB → UTC 16 Agu 17:00
}

export function formatEventTypes(types: string[]): string {
  return types
    .map((t) =>
      t === "TAMAT_KAJI"
        ? "Tamat Kaji"
        : t.charAt(0) + t.slice(1).toLowerCase()
    )
    .join(", ");
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: "text-amber-700 bg-amber-50 border-amber-200",
    CONFIRMED: "text-blue-700 bg-blue-50 border-blue-200",
    IN_PROGRESS: "text-purple-700 bg-purple-50 border-purple-200",
    COMPLETED: "text-emerald-700 bg-emerald-50 border-emerald-200",
    CANCELLED: "text-red-700 bg-red-50 border-red-200",
  };
  return map[status] ?? "text-gray-700 bg-gray-50 border-gray-200";
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Pending",
    CONFIRMED: "Terkonfirmasi",
    IN_PROGRESS: "Sedang Berjalan",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
  };
  return map[status] ?? status;
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    LOW: "text-gray-600 bg-gray-50",
    MEDIUM: "text-amber-600 bg-amber-50",
    HIGH: "text-red-600 bg-red-50",
  };
  return map[priority] ?? "";
}

export function getPaymentStatus(paid: number, total: number) {
  if (paid >= total) return { label: "Lunas", color: "text-emerald-600 bg-emerald-50" };
  if (paid > 0) return { label: `DP Rp ${paid.toLocaleString("id-ID")}`, color: "text-amber-600 bg-amber-50" };
  return { label: "Belum Bayar", color: "text-red-600 bg-red-50" };
}

export function getDaysUntil(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Indonesian Public Holidays & Cuti Bersama ─────────────────────────────────
// Source: date.nager.at API + estimasi kalender Hijriah 2026
// Hari libur: bg-red-50 text-red-600, tanggal merah.
// Cuti bersama: bg-orange-50 text-orange-700
// Sabtu/Minggu: bg-stone-100 text-stone-400

export type HolidayType = 'national' | 'christian' | 'islamic' | 'lebaran';

export interface HolidayInfo {
  label: string;
  type: HolidayType;
  cutiBersama?: boolean;
}

function makeHolidayMap(): Record<string, HolidayInfo> {
  const m: Record<string, HolidayInfo> = {};

  // --- 2026 ---
  // Januari
  m['2026-01-01'] = { label: 'Tahun Baru Masehi', type: 'national' };

  // Maret - April (Paskah)
  m['2026-03-03'] = { label: 'Isra Miraj', type: 'islamic' };
  m['2026-03-17'] = { label: '1 Ramadhan', type: 'islamic' };
  m['2026-03-18'] = { label: '1 Ramadhan', type: 'islamic' };
  m['2026-04-03'] = { label: 'Wafat Isa Almasih', type: 'christian' };
  m['2026-04-05'] = { label: 'Paskah', type: 'christian' };
  m['2026-04-30'] = { label: 'Kenaikan Isa Almasih', type: 'christian' };

  // Mei
  m['2026-05-01'] = { label: 'Hari Buruh Internasional', type: 'national' };
  m['2026-05-14'] = { label: 'Kenaikan Isa Almasih', type: 'christian' };
  m['2026-05-26'] = { label: 'Hari Raya Idulfitri', type: 'islamic' };
  m['2026-05-27'] = { label: 'Hari Raya Idulfitri', type: 'islamic' };
  m['2026-05-28'] = { label: 'Cuti Bersama Idulfitri', type: 'islamic', cutiBersama: true };
  m['2026-05-29'] = { label: 'Cuti Bersama Idulfitri', type: 'islamic', cutiBersama: true };

  // Juni
  m['2026-06-01'] = { label: 'Hari Lahir Pancasila', type: 'national' };
  m['2026-06-07'] = { label: 'Hari Raya Waisak', type: 'national' };
  m['2026-06-16'] = { label: '1 Dzulhijjah', type: 'islamic' };
  m['2026-06-26'] = { label: 'Hari Raya Qurban', type: 'islamic' };
  m['2026-06-27'] = { label: 'Hospirasi Qurban', type: 'islamic' };

  // Juli - Agustus
  m['2026-07-06'] = { label: '1 Muharram', type: 'islamic' };
  m['2026-08-17'] = { label: 'Hari Ulang Tahun Kemerdekaan RI', type: 'national' };
  m['2026-08-26'] = { label: 'Maulid Nabi Muhammad', type: 'islamic' };

  // September
  m['2026-09-07'] = { label: 'Teh Cin', type: 'national' };

  // Oktober - Nopember
  m['2026-10-20'] = { label: 'Hari Purnama', type: 'national' };
  m['2026-11-15'] = { label: 'Hari-deepavali', type: 'national' };

  // Desember
  m['2026-12-25'] = { label: 'Hari Raya Natal', type: 'christian' };
  m['2026-12-31'] = { label: 'Tahun Baru 2027', type: 'national' };

  // --- 2025 (fallback for past years) ---
  m['2025-01-01'] = { label: 'Tahun Baru Masehi', type: 'national' };
  m['2025-03-14'] = { label: 'Isra Miraj', type: 'islamic' };
  m['2025-03-30'] = { label: 'Minggu Paskah', type: 'christian' };
  m['2025-03-31'] = { label: 'Senin Paskah', type: 'christian' };
  m['2025-04-18'] = { label: 'Wafat Isa Almasih', type: 'christian' };
  m['2025-04-20'] = { label: 'Paskah', type: 'christian' };
  m['2025-05-01'] = { label: 'Hari Buruh Internasional', type: 'national' };
  m['2025-05-29'] = { label: 'Kenaikan Isa Almasih', type: 'christian' };
  m['2025-06-01'] = { label: 'Hari Lahir Pancasila', type: 'national' };
  m['2025-08-17'] = { label: 'Hari Ulang Tahun Kemerdekaan RI', type: 'national' };
  m['2025-12-25'] = { label: 'Hari Raya Natal', type: 'christian' };

  return m;
}

export const INDONESIA_HOLIDAYS = makeHolidayMap();

export function getHolidayInfo(date: Date): HolidayInfo | null {
  const key = format(new Date(date), 'yyyy-MM-dd');
  return INDONESIA_HOLIDAYS[key] ?? null;
}

export function isHoliday(date: Date): boolean {
  return getHolidayInfo(date) !== null;
}

export function isWeekend(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6; // Minggu atau Sabtu
}

export function getDayColor(date: Date): 'holiday' | 'weekend' | 'normal' {
  if (isHoliday(date)) return 'holiday';
  if (isWeekend(date)) return 'weekend';
  return 'normal';
}

// ─── Existing utils ─────────────────────────────────────────────────────────

export function formatDateRange(startDate: Date | string | null | undefined, endDate: Date | string | null | undefined): string {
  if (!startDate) return "-";
  const start = typeof startDate === "string" ? parseISO(startDate) : startDate;
  if (!isValid(start)) return "-";
  if (!endDate) return format(start, "dd MMM yyyy", { locale: idLocale });
  const end = typeof endDate === "string" ? parseISO(endDate) : endDate;
  if (!isValid(end)) return format(start, "dd MMM yyyy", { locale: idLocale });
  if (start.toDateString() === end.toDateString()) return format(start, "dd MMM yyyy", { locale: idLocale });
  return `${format(start, "dd MMM", { locale: idLocale })} s.d ${format(end, "dd MMM yyyy", { locale: idLocale })}`;
}
