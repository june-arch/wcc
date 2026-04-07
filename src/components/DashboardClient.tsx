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
  pendingTasks: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    booking: { clientName: string; startDate: Date | string };
  }>;
}

export default function DashboardClient({ stats, upcomingBookings, pendingTasks }: Props) {
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
      value: `Rp ${stats.totalRevenue.toLocaleString("id-ID")}k`,
      sub: `Sisa Rp ${stats.unpaidRevenue.toLocaleString("id-ID")}k`,
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
        <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
        <p className="text-stone-500 text-sm mt-0.5">Ringkasan aktivitas WCC Oranye Capture</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={cn("card p-4 md:p-5 border", card.border)}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">{card.label}</p>
                <p className="text-xl md:text-2xl font-bold text-stone-900 mt-1 leading-none">{card.value}</p>
                <p className="text-xs text-stone-400 mt-1.5">{card.sub}</p>
              </div>
              <div className={cn("w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center", card.color)}>
                <card.icon size={16} className="md:w-[18px] md:h-[18px]" />
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
              <h2 className="font-semibold text-stone-900 text-sm">Booking Mendatang</h2>
              <p className="text-xs text-stone-400 mt-0.5">Jadwal yang akan datang</p>
            </div>
            <Link href="/dashboard/bookings" className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
              Lihat semua <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-stone-50">
            {upcomingBookings.length === 0 ? (
              <div className="px-5 py-8 text-center text-stone-400 text-sm">Tidak ada booking mendatang</div>
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
                      <p className="text-sm font-semibold text-stone-900 truncate">{b.clientName}</p>
                      <p className="text-xs text-stone-400 truncate">
                        {b.location ?? "—"} · {b.eventType.map(e => e.charAt(0) + e.slice(1).toLowerCase()).join(", ")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        days <= 0 ? "bg-red-50 text-red-600" :
                        days <= 7 ? "bg-amber-50 text-amber-600" :
                        "bg-stone-100 text-stone-500"
                      )}>
                        {days <= 0 ? "Hari ini" : days === 1 ? "Besok" : `${days}h lagi`}
                      </span>
                      {sisa > 0 && (
                        <p className="text-[11px] text-red-500 mt-0.5">Sisa Rp{sisa}k</p>
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
