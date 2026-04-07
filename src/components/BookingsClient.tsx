"use client";
// src/components/BookingsClient.tsx
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  LayoutList, CalendarDays, Plus, Search,
  ChevronLeft, ChevronRight, Pencil, Trash2,
} from "lucide-react";
import { cn, formatDate, getStatusColor, getStatusLabel, getPaymentStatus, getDaysUntil } from "@/lib/utils";
import type { BookingWithRelations, ViewMode, FilterStatus } from "@/types";
import BookingModal from "./BookingModal";
import EditBookingModal from "./EditBookingModal";
import BookingDetailPanel from "./BookingDetailPanel";
import ResponsiveConfirm from "./ui/ResponsiveConfirm";
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; bookingId: string | null }>({ isOpen: false, bookingId: null });

  // Listen for edit event from detail panel
  useEffect(() => {
    const handleEdit = (e: CustomEvent<BookingWithRelations>) => {
      setSelectedBooking(e.detail);
      setShowEditModal(true);
    };
    window.addEventListener('edit-booking', handleEdit as EventListener);
    return () => window.removeEventListener('edit-booking', handleEdit as EventListener);
  }, []);

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

  const handleUpdate = useCallback((updated: BookingWithRelations) => {
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setSelectedBooking(updated);
    setShowEditModal(false);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm.bookingId) return;
    try {
      const res = await fetch(`/api/bookings/${deleteConfirm.bookingId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setBookings((prev) => prev.filter((b) => b.id !== deleteConfirm.bookingId));
      if (selectedBooking?.id === deleteConfirm.bookingId) setSelectedBooking(null);
      setDeleteConfirm({ isOpen: false, bookingId: null });
    } catch {
      alert("Gagal menghapus booking");
    }
  }, [deleteConfirm.bookingId, selectedBooking]);

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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-stone-900">Booking</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {filtered.length} dari {bookings.length} booking
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary gap-2 shrink-0 justify-center w-full sm:w-auto">
          <Plus size={16} />
          <span className="hidden sm:inline">Tambah Booking</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="input-base pl-9 py-2 text-sm w-full"
            placeholder="Cari nama, hashtag, lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1 overflow-x-auto">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={cn(
                "px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                filterStatus === opt.value
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-stone-100 rounded-lg p-1 gap-1 shrink-0">
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
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-5">
        <div className={cn("flex-1 min-w-0", selectedBooking && "hidden lg:block")}>
          {view === "list" ? (
            <ListView
              bookings={filtered}
              selectedId={selectedBooking?.id}
              onSelect={setSelectedBooking}
              onEdit={(b) => { setSelectedBooking(b); setShowEditModal(true); }}
              onDelete={(id) => setDeleteConfirm({ isOpen: true, bookingId: id })}
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
          <div className="w-full lg:w-80 xl:w-96 shrink-0 animate-slide-in fixed inset-0 z-40 lg:static lg:z-auto bg-white lg:bg-transparent">
            <div className="h-full lg:h-auto overflow-y-auto">
              <BookingDetailPanel
                booking={selectedBooking}
                onClose={() => setSelectedBooking(null)}
                onPatch={patchBooking}
              />
            </div>
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

      {showEditModal && selectedBooking && (
        <EditBookingModal
          booking={selectedBooking}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleUpdate}
        />
      )}

      {/* Delete Confirmation */}
      <ResponsiveConfirm
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, bookingId: null })}
        onConfirm={handleDelete}
        title="Hapus Booking?"
        message="Yakin ingin menghapus booking ini? Semua data terkait akan hilang dan tidak bisa dikembalikan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}

/* ─── List View ──────────────────────────────────────────────────────────────── */
function ListView({
  bookings, selectedId, onSelect, onEdit, onDelete, EVENT_TYPE_COLORS,
}: {
  bookings: BookingWithRelations[];
  selectedId?: string;
  onSelect: (b: BookingWithRelations) => void;
  onEdit: (b: BookingWithRelations) => void;
  onDelete: (id: string) => void;
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
          const isSelected = b.id === selectedId;

          return (
            <div
              key={b.id}
              className={cn(
                "w-full flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 text-left transition-colors border-l-2 group",
                isSelected
                  ? "bg-orange-50 border-l-orange-400"
                  : "hover:bg-stone-50 border-l-transparent"
              )}
            >
              {/* Date block */}
              <button onClick={() => onSelect(b)} className="shrink-0">
                <div className={cn(
                  "w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border",
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
                    "text-base sm:text-lg font-bold leading-tight",
                    isToday(new Date(b.startDate)) ? "text-white" : "text-stone-800"
                  )}>
                    {new Date(b.startDate).getDate()}
                  </span>
                </div>
              </button>

              {/* Main content - clickable to select */}
              <button onClick={() => onSelect(b)} className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-stone-900 text-sm">{b.clientName}</span>
                  {b.isConfirmed && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">✓</span>
                  )}
                  {b.hashtag && (
                    <span className="text-[11px] text-stone-400 font-medium truncate max-w-24 sm:max-w-32">{b.hashtag}</span>
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
              </button>

              {/* Right side - status, price, actions */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center sm:text-right shrink-0 gap-2 sm:gap-1 sm:space-y-1 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                <div className="flex items-center gap-2">
                  <span className={cn("badge text-[10px]", getStatusColor(b.status))}>
                    {getStatusLabel(b.status)}
                  </span>
                  {/* Edit/Delete buttons - always visible on mobile, hover on desktop */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(b); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(b.id); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="text-right">
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
                    {days === 0 ? "Hari ini!" : days === 1 ? "Besok" : `${days}h lagi`}
                  </p>
                )}
              </div>
            </div>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-stone-100 gap-3">
        <h2 className="font-bold text-stone-900 text-sm">
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
          <div key={d} className="text-center py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-stone-400 uppercase tracking-wider">
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
