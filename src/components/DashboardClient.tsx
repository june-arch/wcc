"use client";
// src/components/DashboardClient.tsx
import Link from "next/link";
import {
  CalendarDays, TrendingUp, CheckCircle2, Clock,
  AlertCircle, ArrowRight, Camera, Banknote, Play
} from "lucide-react";
import { formatDate, formatCurrency, getStatusColor, getStatusLabel, getDaysUntil } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { BookingWithRelations } from "@/types";

interface Props {
  stats: {
    totalBookings: number;
    monthBookings: number;
    totalRevenue: number;
    unpaidRevenue: number;
    completedCount: number;
    pendingCount: number;
  };
  upcomingBookings: BookingWithRelations[];
}

export default function DashboardClient({ stats, upcomingBookings }: Props) {
  // Filter bookings happening today (startDate <= today <= endDate)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ongoingToday = upcomingBookings.filter((b) => {
    const start = new Date(b.startDate);
    start.setHours(0, 0, 0, 0);
    const end = b.endDate ? new Date(b.endDate) : start;
    end.setHours(0, 0, 0, 0);
    return start <= today && today <= end;
  });

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
    {
      label: "Berjalan Hari Ini",
      value: ongoingToday.length,
      sub: ongoingToday.length > 0 ? `${ongoingToday.map(b => b.clientName.split(" ")[0]).join(", ")}` : "Tidak ada acara",
      icon: Play,
      color: "bg-purple-50 text-purple-600",
      border: "border-purple-100",
      highlight: ongoingToday.length > 0,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-20">
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

      {/* Stats grid - Remaining cards (3 columns for cards 3-5) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {statCards.slice(2).map((card) => (
          <div key={card.label} className={cn("card p-4 md:p-6 border", card.border, "highlight" in card && card.highlight && "ring-2 ring-purple-200")}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl md:text-3xl font-bold text-stone-900 mt-2 leading-none">{card.value}</p>
                <p className="text-sm text-stone-400 mt-2 truncate max-w-[150px]">{card.sub}</p>
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
                const totalPaid = b.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                const packagePrice = b.pricePackage?.price || 0;
                const addOnsTotal = b.bookingAddOns?.reduce((sum, a) => sum + a.price, 0) || 0;
                const transport = b.transport || 0;
                const discount = b.discount || 0;
                const totalPrice = Math.max(0, packagePrice + addOnsTotal + transport - discount);
                const sisa = totalPrice - totalPaid;
                return (
                  <Link key={b.id} href={`/dashboard/bookings?id=${b.id}`}
                    className="flex items-start sm:items-center gap-3 px-3 sm:px-5 py-3.5 hover:bg-stone-50 transition-colors">
                    {/* Date badge - smaller on mobile */}
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-orange-50 flex flex-col items-center justify-center shrink-0 border border-orange-100">
                      <span className="text-[9px] sm:text-[10px] font-bold text-orange-500 uppercase leading-none">
                        {new Date(b.startDate).toLocaleString("id-ID", { month: "short" })}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-orange-700 leading-tight">
                        {new Date(b.startDate).getDate()}
                      </span>
                    </div>
                    
                    {/* Main content - better truncation for mobile */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-stone-900 truncate">{b.clientName}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs sm:text-sm text-stone-500">
                        {b.location && (
                          <span className="truncate max-w-[120px] sm:max-w-[200px]">{b.location}</span>
                        )}
                        {b.location && (b.bookingEventTypes?.length ?? 0) > 0 && (
                          <span className="text-stone-300">·</span>
                        )}
                        {b.bookingEventTypes && b.bookingEventTypes.length > 0 && (
                          <span className="truncate max-w-[150px] sm:max-w-[250px]">
                            {b.bookingEventTypes.map((bet) => bet.eventType.label).join(", ")}
                          </span>
                        )}
                        {!b.location && (!b.bookingEventTypes || b.bookingEventTypes.length === 0) && (
                          <span>—</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Right side - stacked on mobile */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={cn(
                        "text-[10px] sm:text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full whitespace-nowrap",
                        days <= 0 ? "bg-red-50 text-red-600" :
                        days <= 7 ? "bg-amber-50 text-amber-600" :
                        "bg-stone-100 text-stone-600"
                      )}>
                        {days <= 0 ? "Hari ini" : days === 1 ? "Besok" : `${days}h`}
                      </span>
                      {sisa > 0 && (
                        <p className="text-[10px] sm:text-xs text-red-500 font-medium whitespace-nowrap">
                          Sisa Rp{sisa.toLocaleString("id-ID")}
                        </p>
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
