"use client";
// src/components/DashboardClient.tsx
import Link from "next/link";
import {
  CalendarDays, TrendingUp, CheckCircle2, Clock,
  AlertCircle, ArrowRight, Camera, Banknote
} from "lucide-react";
import { formatDate, formatCurrency, getStatusColor, getStatusLabel, getDaysUntil } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  stats: {
    totalBookings: number;
    monthBookings: number;
    totalRevenue: number;
    unpaidRevenue: number;
    completedCount: number;
    pendingCount: number;
  };
  upcomingBookings: Array<{
    id: string;
    clientName: string;
    startDate: Date | string;
    endDate: Date | string | null;
    status: string;
    package: number;
    paid: number;
    location: string | null;
    eventType: string[];
  }>;
}

export default function DashboardClient({ stats, upcomingBookings }: Props) {
  const statCards = [
    {
      label: "Total Booking",
      value: stats.totalBookings,
      sub: `${stats.monthBookings} bulan ini`,
      icon: Camera,
      color: "bg-orange-50 text-orange-600",
      border: "border-orange-100",
    },
    {
      label: "Total Pendapatan",
      value: `Rp ${stats.totalRevenue.toLocaleString("id-ID")}`,
      sub: `Sisa Rp ${stats.unpaidRevenue.toLocaleString("id-ID")}`,
      icon: Banknote,
      color: "bg-emerald-50 text-emerald-600",
      border: "border-emerald-100",
    },
    {
      label: "Selesai",
      value: stats.completedCount,
      sub: `dari ${stats.totalBookings} booking`,
      icon: CheckCircle2,
      color: "bg-blue-50 text-blue-600",
      border: "border-blue-100",
    },
    {
      label: "Menunggu",
      value: stats.pendingCount,
      sub: "perlu tindak lanjut",
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
      border: "border-amber-100",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight">Dashboard</h1>
        <p className="text-stone-500 text-sm md:text-base mt-1">Ringkasan aktivitas WCC Oranye Capture</p>
      </div>

      {/* Stats grid - Total Pendapatan & Total Booking in one row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {statCards.slice(0, 2).map((card) => (
          <div key={card.label} className={cn("card p-4 md:p-6 border", card.border)}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl md:text-3xl font-bold text-stone-900 mt-2 leading-none">{card.value}</p>
                <p className="text-sm text-stone-400 mt-2">{card.sub}</p>
              </div>
              <div className={cn("w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center", card.color)}>
                <card.icon size={18} className="md:w-5 md:h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats grid - Remaining cards */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 md:gap-4">
        {statCards.slice(2).map((card) => (
          <div key={card.label} className={cn("card p-4 md:p-6 border", card.border)}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl md:text-3xl font-bold text-stone-900 mt-2 leading-none">{card.value}</p>
                <p className="text-sm text-stone-400 mt-2">{card.sub}</p>
              </div>
              <div className={cn("w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center", card.color)}>
                <card.icon size={18} className="md:w-5 md:h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-1 gap-6">
        {/* Upcoming bookings */}
        <div className="card">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-stone-900 text-base md:text-lg">Booking Mendatang</h2>
              <p className="text-sm text-stone-500 mt-0.5">Jadwal yang akan datang</p>
            </div>
            <Link href="/dashboard/bookings" className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
              Lihat semua <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-stone-50">
            {upcomingBookings.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                  <CalendarDays size={20} className="text-stone-400" />
                </div>
                <p className="text-stone-500 text-sm font-medium">Tidak ada booking mendatang</p>
              </div>
            ) : (
              upcomingBookings.map((b) => {
                const days = getDaysUntil(b.startDate);
                const sisa = b.package - b.paid;
                return (
                  <Link key={b.id} href={`/dashboard/bookings?id=${b.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex flex-col items-center justify-center shrink-0 border border-orange-100">
                      <span className="text-[10px] font-bold text-orange-500 uppercase leading-none">
                        {new Date(b.startDate).toLocaleString("id-ID", { month: "short" })}
                      </span>
                      <span className="text-base font-bold text-orange-700 leading-tight">
                        {new Date(b.startDate).getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-stone-900 truncate">{b.clientName}</p>
                      <p className="text-sm text-stone-500 truncate">
                        {b.location ?? "—"} · {b.eventType.map(e => e.charAt(0) + e.slice(1).toLowerCase()).join(", ")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={cn(
                        "text-xs font-medium px-2.5 py-1 rounded-full",
                        days <= 0 ? "bg-red-50 text-red-600" :
                        days <= 7 ? "bg-amber-50 text-amber-600" :
                        "bg-stone-100 text-stone-600"
                      )}>
                        {days <= 0 ? "Hari ini" : days === 1 ? "Besok" : `${days}h lagi`}
                      </span>
                      {sisa > 0 && (
                        <p className="text-xs text-red-500 mt-1 font-medium">Sisa Rp{sisa.toLocaleString("id-ID")}</p>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
