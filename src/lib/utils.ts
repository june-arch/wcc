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
