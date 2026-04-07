"use client";
// src/components/BookingsClient.tsx
import { useState, useMemo, useCallback } from "react";
import {
  LayoutList, CalendarDays, Plus, Search,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn, formatDate, getStatusColor, getStatusLabel, getPaymentStatus, getDaysUntil } from "@/lib/utils";
import type { BookingWithRelations, ViewMode, FilterStatus } from "@/types";
import BookingModal from "./BookingModal";
import BookingDetailPanel from "./BookingDetailPanel";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, format, addMonths, subMonths
} from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface Props {
  initialBookings: BookingWithRelations[];
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  PENGAJIAN: "bg-purple-100 text-purple-700",
  AKAD: "bg-blue-100 text-blue-700",
  RESEPSI: "bg-pink-100 text-pink-700",
  TAMAT_KAJI: "bg-teal-100 text-teal-700",
  LAINNYA: "bg-stone-100 text-stone-600",
};

export default function BookingsClient({ initialBookings }: Props) {
  const [bookings, setBookings] = useState<BookingWithRelations[]>(initialBookings);
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<BookingWithRelations | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // ─── Filtered list ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        !search ||
        b.clientName.toLowerCase().includes(search.toLowerCase()) ||
        (b.hashtag ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (b.location ?? "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "ALL" || b.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [bookings, search, filterStatus]);

  // ─── Calendar grid ───────────────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calendarDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(calendarDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [calendarDate]);

  const getBookingsForDay = useCallback(
    (day: Date) =>
      filtered.filter((b) => {
        const s = new Date(b.startDate);
        const e = b.endDate ? new Date(b.endDate) : s;
        const dayMs = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
        const sMs = new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime();
        const eMs = new Date(e.getFullYear(), e.getMonth(), e.getDate()).getTime();
        return dayMs >= sMs && dayMs <= eMs;
      }),
    [filtered]
  );

  // ─── Update helpers ──────────────────────────────────────────────────────────
  // Patch a booking in the list AND keep selectedBooking panel in sync
  const patchBooking = useCallback((id: string, patch: Partial<BookingWithRelations>) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    setSelectedBooking((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
  }, []);

  // Full server refresh — used after add booking (need fresh IDs/relations)
  const refreshAll = useCallback(async () => {
    const res = await fetch("/api/bookings");
    if (!res.ok) return;
    const fresh: BookingWithRelations[] = await res.json();
    setBookings(fresh);
    setSelectedBooking((prev) => (prev ? (fresh.find((b) => b.id === prev.id) ?? null) : null));
  }, []);

  const statusOptions: { value: FilterStatus; label: string }[] = [
    { value: "ALL", label: "Semua" },
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Konfirmasi" },
    { value: "IN_PROGRESS", label: "Berjalan" },
    { value: "COMPLETED", label: "Selesai" },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Booking</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {filtered.length} dari {bookings.length} booking
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary gap-2 shrink-0">
          <Plus size={16} />
          <span className="hidden sm:inline">Tambah Booking</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="input-base pl-9 py-2 text-sm"
            placeholder="Cari nama, hashtag, lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                filterStatus === opt.value
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-stone-100 rounded-lg p-1 gap-1">
          <button
            onClick={() => setView("list")}
            className={cn(
              "p-1.5 rounded-md transition-all",
              view === "list" ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
            )}
            title="List view"
          >
            <LayoutList size={15} />
          </button>
          <button
            onClick={() => setView("calendar")}
            className={cn(
              "p-1.5 rounded-md transition-all",
              view === "calendar" ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
            )}
            title="Calendar view"
          >
            <CalendarDays size={15} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-5">
        <div className={cn("flex-1 min-w-0", selectedBooking && "hidden lg:block")}>
          {view === "list" ? (
            <ListView
              bookings={filtered}
              selectedId={selectedBooking?.id}
              onSelect={setSelectedBooking}
              EVENT_TYPE_COLORS={EVENT_TYPE_COLORS}
            />
          ) : (
            <CalendarView
              days={calendarDays}
              calendarDate={calendarDate}
              onPrev={() => setCalendarDate(subMonths(calendarDate, 1))}
              onNext={() => setCalendarDate(addMonths(calendarDate, 1))}
              onToday={() => setCalendarDate(new Date())}
              getBookingsForDay={getBookingsForDay}
              onSelectBooking={setSelectedBooking}
              selectedId={selectedBooking?.id}
            />
          )}
        </div>

        {selectedBooking && (
          <div className="w-full lg:w-96 shrink-0 animate-slide-in">
            <BookingDetailPanel
              booking={selectedBooking}
              onClose={() => setSelectedBooking(null)}
              onPatch={patchBooking}
            />
          </div>
        )}
      </div>

      {showAddModal && (
        <BookingModal
          onClose={() => setShowAddModal(false)}
          onSuccess={async (newBooking) => {
            setShowAddModal(false);
            await refreshAll();
            setSelectedBooking(newBooking);
          }}
        />
      )}
    </div>
  );
}

/* ─── List View ──────────────────────────────────────────────────────────────── */
function ListView({
  bookings, selectedId, onSelect, EVENT_TYPE_COLORS,
}: {
  bookings: BookingWithRelations[];
  selectedId?: string;
  onSelect: (b: BookingWithRelations) => void;
  EVENT_TYPE_COLORS: Record<string, string>;
}) {
  if (bookings.length === 0) {
    return (
      <div className="card py-16 text-center">
        <CalendarDays size={32} className="mx-auto text-stone-300 mb-3" />
        <p className="text-stone-500 font-medium">Tidak ada booking</p>
        <p className="text-stone-400 text-sm mt-1">Coba ubah filter atau tambah booking baru</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="divide-y divide-stone-100">
        {bookings.map((b) => {
          const days = getDaysUntil(b.startDate);
          const pay = getPaymentStatus(b.paid, b.package);
          const doneTasks = b.tasks.filter((t) => t.status === "DONE").length;
          const totalTasks = b.tasks.length;
          const isSelected = b.id === selectedId;

          return (
            <button
              key={b.id}
              onClick={() => onSelect(b)}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 text-left transition-colors border-l-2",
                isSelected
                  ? "bg-orange-50 border-l-orange-400"
                  : "hover:bg-stone-50 border-l-transparent"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border",
                isToday(new Date(b.startDate))
                  ? "bg-orange-500 border-orange-400"
                  : "bg-stone-50 border-stone-200"
              )}>
                <span className={cn(
                  "text-[10px] font-bold uppercase leading-none",
                  isToday(new Date(b.startDate)) ? "text-orange-100" : "text-stone-400"
                )}>
                  {format(new Date(b.startDate), "MMM", { locale: idLocale })}
                </span>
                <span className={cn(
                  "text-lg font-bold leading-tight",
                  isToday(new Date(b.startDate)) ? "text-white" : "text-stone-800"
                )}>
                  {new Date(b.startDate).getDate()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-stone-900 text-sm">{b.clientName}</span>
                  {b.isConfirmed && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">✓</span>
                  )}
                  {b.hashtag && (
                    <span className="text-[11px] text-stone-400 font-medium truncate max-w-32">{b.hashtag}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {b.eventType.map((et) => (
                    <span
                      key={et}
                      className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", EVENT_TYPE_COLORS[et] ?? "bg-stone-100 text-stone-600")}
                    >
                      {et === "TAMAT_KAJI" ? "Tamat Kaji" : et.charAt(0) + et.slice(1).toLowerCase()}
                    </span>
                  ))}
                  {b.location && <span className="text-xs text-stone-400">📍 {b.location}</span>}
                </div>
                {totalTasks > 0 && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="progress-bar w-24">
                      <div className="progress-fill" style={{ width: `${(doneTasks / totalTasks) * 100}%` }} />
                    </div>
                    <span className="text-[11px] text-stone-400">{doneTasks}/{totalTasks} task</span>
                  </div>
                )}
              </div>

              <div className="text-right shrink-0 space-y-1">
                <span className={cn("badge text-[10px]", getStatusColor(b.status))}>
                  {getStatusLabel(b.status)}
                </span>
                <div>
                  <p className="text-sm font-bold text-stone-900">Rp {b.package.toLocaleString()}k</p>
                  <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded-full", pay.color)}>
                    {pay.label}
                  </span>
                </div>
                {days >= 0 && days <= 30 && (
                  <p className={cn(
                    "text-[11px] font-medium",
                    days === 0 ? "text-red-500" : days <= 3 ? "text-amber-500" : "text-stone-400"
                  )}>
                    {days === 0 ? "Hari ini!" : `${days}h lagi`}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Calendar View ──────────────────────────────────────────────────────────── */
function CalendarView({
  days, calendarDate, onPrev, onNext, onToday,
  getBookingsForDay, onSelectBooking, selectedId,
}: {
  days: Date[];
  calendarDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  getBookingsForDay: (d: Date) => BookingWithRelations[];
  onSelectBooking: (b: BookingWithRelations) => void;
  selectedId?: string;
}) {
  const dayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
        <h2 className="font-bold text-stone-900">
          {format(calendarDate, "MMMM yyyy", { locale: idLocale })}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={onToday} className="btn btn-secondary text-xs py-1.5 px-3">Hari ini</button>
          <button onClick={onPrev} className="btn btn-ghost w-8 h-8 p-0 justify-center">
            <ChevronLeft size={15} />
          </button>
          <button onClick={onNext} className="btn btn-ghost w-8 h-8 p-0 justify-center">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 bg-stone-50 border-b border-stone-100">
        {dayLabels.map((d) => (
          <div key={d} className="text-center py-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayBookings = getBookingsForDay(day);
          const inCurrentMonth = isSameMonth(day, calendarDate);
          const todayFlag = isToday(day);

          return (
            <div
              key={idx}
              className={cn(
                "calendar-cell",
                !inCurrentMonth && "opacity-40",
                todayFlag && "calendar-today"
              )}
            >
              <div className="mb-1">
                <span className={cn(
                  "text-xs font-semibold w-6 h-6 inline-flex items-center justify-center rounded-full",
                  todayFlag ? "bg-orange-500 text-white" : "text-stone-500"
                )}>
                  {day.getDate()}
                </span>
              </div>
              <div className="space-y-0.5">
                {dayBookings.slice(0, 3).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onSelectBooking(b)}
                    className={cn(
                      "w-full text-left text-[10px] font-semibold px-1.5 py-0.5 rounded truncate transition-colors",
                      b.id === selectedId
                        ? "bg-orange-400 text-white"
                        : "bg-orange-100 text-orange-800 hover:bg-orange-200"
                    )}
                  >
                    {b.clientName.split(" ")[0]}
                  </button>
                ))}
                {dayBookings.length > 3 && (
                  <p className="text-[10px] text-stone-400 px-1">+{dayBookings.length - 3} lagi</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
