"use client";
// src/components/DashboardClient.tsx
import Link from "next/link";
import {
  CalendarDays, CheckCircle2, Clock,
  ArrowRight, Camera, Banknote, Square
} from "lucide-react";
import { formatDate, getStatusColor, getStatusLabel, getDaysUntil, cn, getHolidayInfo, isWeekend, getDayColor } from "@/lib/utils";
import { BookingWithRelations } from "@/types";
import { AcrylicOrderWithRelations } from "@/types";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, format, addMonths, subMonths
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useState } from "react";

interface Stats {
  totalBookings: number;
  monthBookings: number;
  totalRevenue: number;
  unpaidRevenue: number;
  completedCount: number;
  pendingCount: number;
  totalAcrylicOrders: number;
  monthAcrylicOrders: number;
  acrylicTotalRevenue: number;
  acrylicPaidRevenue: number;
  acrylicUnpaidRevenue: number;
}

interface Props {
  stats: Stats;
  upcomingBookings: (BookingWithRelations & { _type?: "acrylic"; panelTypes?: string[] })[];
  allBookings: BookingWithRelations[];
  allAcrylicOrders: AcrylicOrderWithRelations[];
}

export default function DashboardClient({ stats, upcomingBookings, allBookings, allAcrylicOrders }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ongoingToday = upcomingBookings.filter((b: any) => {
    const d = new Date(b._type === "acrylic" ? b.eventDate : b.startDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const filteredUpcoming = upcomingBookings.filter((b: any) => {
    const d = new Date(b._type === "acrylic" ? b.eventDate : b.startDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime() > today.getTime();
  });

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight">Dashboard</h1>
        <p className="text-stone-500 text-sm md:text-base mt-1">Ringkasan aktivitas WCC Oranye Capture</p>
      </div>

      {/* ─── Stat Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        {/* Total Pendapatan — full width */}
        <div className="card p-4 md:p-6 border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Total Pendapatan</p>
              <p className="text-2xl md:text-3xl font-bold text-stone-900 mt-2 leading-none">
                Rp {stats.totalRevenue.toLocaleString("id-ID")}
              </p>
              <p className="text-sm text-emerald-600 mt-1">Paid: Rp {(stats.totalRevenue - stats.unpaidRevenue).toLocaleString("id-ID")}</p>
              <p className="text-sm text-red-500">Unpaid: Rp {stats.unpaidRevenue.toLocaleString("id-ID")}</p>
            </div>
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600">
              <Banknote size={18} className="md:w-5 md:h-5" />
            </div>
          </div>
        </div>

        {/* WCC */}
        <div className="card p-4 md:p-6 border border-orange-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Booking WCC</p>
              <p className="text-2xl md:text-3xl font-bold text-stone-900 mt-2 leading-none">
                {stats.totalBookings}
              </p>
              <p className="text-sm text-stone-400 mt-1">{stats.monthBookings} bulan ini</p>
            </div>
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center bg-orange-100 text-orange-600">
              <Camera size={18} className="md:w-5 md:h-5" />
            </div>
          </div>
        </div>

        {/* Acrylic */}
        <div className="card p-4 md:p-6 border border-cyan-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Order Acrylic</p>
              <p className="text-2xl md:text-3xl font-bold text-stone-900 mt-2 leading-none">
                {stats.totalAcrylicOrders}
              </p>
              <p className="text-sm text-stone-400 mt-1">{stats.monthAcrylicOrders} bulan ini</p>
            </div>
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center bg-cyan-100 text-cyan-600">
              <Square size={18} className="md:w-5 md:h-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="card p-4 md:p-6 border border-blue-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Selesai</p>
              <p className="text-2xl md:text-3xl font-bold text-stone-900 mt-2 leading-none">{stats.completedCount}</p>
              <p className="text-sm text-stone-400 mt-1">WCC + Acrylic</p>
            </div>
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
              <CheckCircle2 size={18} className="md:w-5 md:h-5" />
            </div>
          </div>
        </div>

        <div className="card p-4 md:p-6 border border-amber-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Menunggu</p>
              <p className="text-2xl md:text-3xl font-bold text-stone-900 mt-2 leading-none">{stats.pendingCount}</p>
              <p className="text-sm text-stone-400 mt-1">WCC pending</p>
            </div>
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center bg-amber-100 text-amber-600">
              <Clock size={18} className="md:w-5 md:h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Unified Calendar ────────────────────────────────────── */}
      <UnifiedCalendar allBookings={allBookings} allAcrylicOrders={allAcrylicOrders} />

      {/* ─── Ongoing Today ───────────────────────────────────────── */}
      {ongoingToday.length > 0 && (
        <div className="card border-purple-200 ring-2 ring-purple-100 bg-purple-50/20">
          <div className="p-4 md:p-6">
            <div className="mb-4">
              <h2 className="font-semibold text-stone-900 text-base md:text-lg">Sedang Berlangsung Hari Ini</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ongoingToday.map((b: any) => {
                const isAcrylic = b._type === "acrylic";
                const totalPaid = b.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
                const totalPrice = isAcrylic ? b.totalPrice : (b.pricePackage?.price || 0) +
                  (b.bookingAddOns?.reduce((s: number, a: any) => s + a.price, 0) || 0) +
                  (b.transport || 0) - (b.discount || 0);
                const sisa = totalPrice - totalPaid;
                return (
                  <Link
                    key={b.id}
                    href={isAcrylic ? `/dashboard/acrylic?id=${b.id}` : `/dashboard/bookings?id=${b.id}`}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-purple-100 hover:border-purple-300 hover:shadow-sm transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex flex-col items-center justify-center shrink-0 border border-purple-100">
                      <span className="text-[10px] font-bold text-purple-500 uppercase">
                        {format(new Date(b.eventDate || b.startDate), "MMM", { locale: idLocale })}
                      </span>
                      <span className="text-sm font-bold text-purple-700 leading-tight">
                        {new Date(b.eventDate || b.startDate).getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-900 text-sm truncate">{b.clientName}</p>
                      <p className="text-[10px] text-emerald-600">Paid Rp{totalPaid.toLocaleString("id-ID")}</p>
                      {sisa > 0 && <p className="text-[10px] text-red-500">Unpaid Rp{sisa.toLocaleString("id-ID")}</p>}
                    </div>
                    <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full whitespace-nowrap">
                      {isAcrylic ? "Acrylic" : "WCC"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Upcoming ─────────────────────────────────────────────── */}
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
          {filteredUpcoming.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                <CalendarDays size={20} className="text-stone-400" />
              </div>
              <p className="text-stone-500 text-sm font-medium">Tidak ada booking mendatang</p>
            </div>
          ) : (
            filteredUpcoming.slice(0, 6).map((b: any) => {
              const isAcrylic = b._type === "acrylic";
              const days = getDaysUntil(b.eventDate || b.startDate);
              const totalPaid = b.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
              const totalPrice = isAcrylic ? b.totalPrice : (b.pricePackage?.price || 0) +
                (b.bookingAddOns?.reduce((s: number, a: any) => s + a.price, 0) || 0) +
                (b.transport || 0) - (b.discount || 0);
              const sisa = totalPrice - totalPaid;
              const date = new Date(b.eventDate || b.startDate);

              return (
                <Link
                  key={b.id}
                  href={isAcrylic ? `/dashboard/acrylic?id=${b.id}` : `/dashboard/bookings?id=${b.id}`}
                  className="flex items-start sm:items-center gap-3 px-3 sm:px-5 py-3.5 hover:bg-stone-50 transition-colors"
                >
                  <div className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex flex-col items-center justify-center shrink-0 border",
                    isAcrylic ? "bg-cyan-50 border-cyan-100" : "bg-orange-50 border-orange-100"
                  )}>
                    <span className={cn(
                      "text-[9px] sm:text-[10px] font-bold uppercase leading-none",
                      isAcrylic ? "text-cyan-500" : "text-orange-500"
                    )}>
                      {format(date, "MMM", { locale: idLocale })}
                    </span>
                    <span className={cn(
                      "text-sm sm:text-base font-bold leading-tight",
                      isAcrylic ? "text-cyan-700" : "text-orange-700"
                    )}>
                      {date.getDate()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-stone-900 truncate">
                      {b.clientName}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-stone-500">
                      {isAcrylic ? (
                        <>
                          <Square size={10} className="text-cyan-400" />
                          <span className="text-cyan-600 font-medium">Acrylic</span>
                          {b.address && <span className="truncate max-w-[150px]">· {b.address}</span>}
                        </>
                      ) : (
                        <>
                          <span className="truncate max-w-[120px] sm:max-w-[200px]">{b.location || "—"}</span>
                          {(b.bookingEventTypes?.length ?? 0) > 0 && (
                            <span className="text-stone-300">·</span>
                          )}
                          {b.bookingEventTypes && b.bookingEventTypes.length > 0 && (
                            <span className="truncate max-w-[150px] sm:max-w-[250px]">
                              {b.bookingEventTypes.map((bet: any) => bet.eventType.label).join(", ")}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={cn(
                      "text-[10px] sm:text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full whitespace-nowrap",
                      days <= 0 ? "bg-red-50 text-red-600" :
                      days <= 7 ? "bg-amber-50 text-amber-600" :
                      "bg-stone-100 text-stone-600"
                    )}>
                      {days <= 0 ? "Hari ini" : days === 1 ? "Besok" : `${days}h`}
                    </span>
                    <p className="text-[10px] sm:text-xs text-emerald-600 font-medium whitespace-nowrap">
                      Rp{totalPaid.toLocaleString("id-ID")}
                    </p>
                    {sisa > 0 && (
                      <p className="text-[10px] sm:text-xs text-red-500 font-medium whitespace-nowrap">
                        Rp{sisa.toLocaleString("id-ID")}
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
  );
}

/* ─── Unified Calendar ──────────────────────────────────────────────────────── */
function UnifiedCalendar({
  allBookings,
  allAcrylicOrders,
}: {
  allBookings: BookingWithRelations[];
  allAcrylicOrders: AcrylicOrderWithRelations[];
}) {
  const [calendarDate, setCalendarDate] = useState(new Date());

  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(calendarDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(calendarDate), { weekStartsOn: 1 }),
  });

  const dayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  const getEventsForDay = (day: Date) => {
    const dayMs = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();

    const wcc = allBookings.filter((b) => {
      const start = new Date(b.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(b.endDate || b.startDate);
      end.setHours(23, 59, 59, 999);
      return dayMs >= start.getTime() && dayMs <= end.getTime();
    });

    const acrylic = allAcrylicOrders.filter((o) => {
      const d = new Date(o.eventDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === dayMs;
    });

    return [...wcc.map(b => ({ ...b, _type: "wcc" as const })), ...acrylic.map(o => ({ ...o, _type: "acrylic" as const }))];
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-row items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-stone-100 gap-2">
        <h2 className="font-bold text-stone-900 text-sm shrink-0">
          {format(calendarDate, "MMMM yyyy", { locale: idLocale })}
        </h2>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button onClick={() => setCalendarDate(new Date())} className="btn btn-secondary text-xs py-1.5 px-2 sm:px-3">Hari ini</button>
          <button onClick={() => setCalendarDate(subMonths(calendarDate, 1))} className="btn btn-primary w-9 h-9 p-0 flex items-center justify-center shrink-0" aria-label="Previous">
            <span className="flex items-center justify-center text-white">‹</span>
          </button>
          <button onClick={() => setCalendarDate(addMonths(calendarDate, 1))} className="btn btn-primary w-9 h-9 p-0 flex items-center justify-center shrink-0" aria-label="Next">
            <span className="flex items-center justify-center text-white">›</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 bg-stone-50 border-b border-stone-100">
        {dayLabels.map((d) => (
          <div key={d} className="text-center py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-stone-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          const events = getEventsForDay(day);
          const inCurrentMonth = isSameMonth(day, calendarDate);
          const todayFlag = isToday(day);
          const holidayInfo = getHolidayInfo(day);
          const isWeekendDay = isWeekend(day);
          const dayColor = getDayColor(day);

          return (
            <div
              key={idx}
              className={cn(
                "calendar-cell",
                !inCurrentMonth && "opacity-40",
                todayFlag && "calendar-today",
                dayColor === 'holiday' && "bg-red-50/40",
                dayColor === 'weekend' && !todayFlag && "bg-stone-50"
              )}
            >
              <div className="mb-0.5 flex items-center justify-between gap-1">
                <span className={cn(
                  "text-xs font-semibold w-6 h-6 inline-flex items-center justify-center rounded-full",
                  todayFlag ? "bg-orange-500 text-white" :
                  holidayInfo ? "text-red-500 font-bold" :
                  isWeekendDay ? "text-stone-400" :
                  "text-stone-500"
                )}>
                  {day.getDate()}
                </span>
                {holidayInfo && (
                  <span className={cn(
                    "text-[8px] font-medium leading-none shrink-0",
                    holidayInfo.cutiBersama ? "text-orange-500" : "text-red-500"
                  )}>
                    {holidayInfo.label.length > 10
                      ? holidayInfo.label.slice(0, 9) + '…'
                      : holidayInfo.label}
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                {events.slice(0, 3).map((e: any) => (
                  <Link
                    key={e.id}
                    href={e._type === "acrylic" ? `/dashboard/acrylic?id=${e.id}` : `/dashboard/bookings?id=${e.id}`}
                    className={cn(
                      "w-full text-left text-[10px] font-semibold px-1.5 py-0.5 rounded truncate transition-colors block",
                      e._type === "acrylic"
                        ? "bg-cyan-100 text-cyan-800 hover:bg-cyan-200"
                        : "bg-orange-100 text-orange-800 hover:bg-orange-200"
                    )}
                  >
                    {e.clientName.split(" ")[0]}
                  </Link>
                ))}
                {events.length > 3 && (
                  <p className="text-[10px] text-stone-400 px-1">+{events.length - 3}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
