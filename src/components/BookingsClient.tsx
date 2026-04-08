"use client";
// src/components/BookingsClient.tsx
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  LayoutList, CalendarDays, Plus, Search,
  ChevronLeft, ChevronRight, Pencil, Trash2, Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn, formatDate, formatDateRange, getStatusColor, getStatusLabel, getPaymentStatus, getDaysUntil } from "@/lib/utils";
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
  AKAD_MALAM: "bg-indigo-100 text-indigo-700",
  AKAD_SIANG: "bg-cyan-100 text-cyan-700",
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
  const [editingBooking, setEditingBooking] = useState<BookingWithRelations | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; bookingId: string | null }>({ isOpen: false, bookingId: null });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Listen for edit event from detail panel
  useEffect(() => {
    const handleEdit = (e: CustomEvent<BookingWithRelations>) => {
      setEditingBooking(e.detail);
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
    setShowEditModal(false);
    setEditingBooking(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm.bookingId) return;
    
    const bookingId = deleteConfirm.bookingId;
    const originalBookings = [...bookings];
    const originalSelected = selectedBooking;
    
    // Optimistic update
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    if (selectedBooking?.id === bookingId) setSelectedBooking(null);
    setDeletingId(bookingId);
    setDeleteConfirm({ isOpen: false, bookingId: null });
    
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Booking berhasil dihapus");
    } catch {
      // Rollback optimistic update
      setBookings(originalBookings);
      setSelectedBooking(originalSelected);
      toast.error("Gagal menghapus booking");
    } finally {
      setDeletingId(null);
    }
  }, [deleteConfirm.bookingId, selectedBooking, bookings]);

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
              onEdit={(b) => { setEditingBooking(b); setShowEditModal(true); }}
              onDelete={(id) => setDeleteConfirm({ isOpen: true, bookingId: id })}
              EVENT_TYPE_COLORS={EVENT_TYPE_COLORS}
              deletingId={deletingId}
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
          <div className="w-full shrink-0 animate-slide-in fixed inset-0 z-40 bg-white">
            <div className="h-full overflow-y-auto">
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

      {showEditModal && editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          onClose={() => { setShowEditModal(false); setEditingBooking(null); }}
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
  bookings, selectedId, onSelect, onEdit, onDelete, EVENT_TYPE_COLORS, deletingId,
}: {
  bookings: BookingWithRelations[];
  selectedId?: string;
  onSelect: (b: BookingWithRelations) => void;
  onEdit: (b: BookingWithRelations) => void;
  onDelete: (id: string) => void;
  EVENT_TYPE_COLORS: Record<string, string>;
  deletingId: string | null;
}) {
  if (bookings.length === 0) {
    return (
      <div className="card py-16 text-center mb-6">
        <CalendarDays size={32} className="mx-auto text-stone-300 mb-3" />
        <p className="text-stone-500 font-medium">Tidak ada booking</p>
        <p className="text-stone-400 text-sm mt-1">Coba ubah filter atau tambah booking baru</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 pb-20">
      {bookings.map((b) => {
        const days = getDaysUntil(b.startDate);
        const packagePrice = b.pricePackage?.price || 0;
        const totalPaid = b.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const pay = getPaymentStatus(totalPaid, packagePrice);
        const isSelected = b.id === selectedId;
        const eventTypes = b.bookingEventTypes?.map(bet => bet.eventType) || [];

        return (
          <div
            key={b.id}
            className={cn(
              "w-full flex flex-col sm:flex-row gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4 text-left transition-colors border rounded-xl bg-white",
              isSelected
                ? "bg-orange-50 border-orange-200 ring-1 ring-orange-200"
                : "border-stone-200 hover:border-stone-300"
            )}
          >
              {/* Date card with enhanced hover states and smooth transitions */}
              <div className="flex items-start gap-3 sm:block sm:shrink-0">
                <div className={cn(
                  "w-auto min-w-16 h-14 sm:w-auto sm:min-w-14 sm:h-14 rounded-lg flex items-center justify-center gap-2 px-3 shrink-0 border transition-all duration-300 ease-in-out transform hover:scale-105 cursor-pointer",
                  isToday(new Date(b.startDate))
                    ? "bg-gradient-to-br from-brand-500 to-brand-600 border-brand-400 shadow-lg"
                    : "bg-gradient-to-br from-stone-50 to-stone-100 border-stone-200 shadow-md hover:shadow-lg hover:from-stone-50 hover:to-stone-200"
                )}>
                  {(() => {
                    const startDate = new Date(b.startDate);
                    const endDate = b.endDate ? new Date(b.endDate) : null;
                    const isSameDate = endDate && startDate.toDateString() === endDate.toDateString();
                    
                    return (
                      <div className="flex flex-col items-center">
                        <span className={cn(
                          "text-xs font-bold uppercase tracking-wider leading-none transition-colors duration-200 mb-1",
                          isToday(startDate) ? "text-brand-100" : "text-stone-600"
                        )}>
                          {format(startDate, "MMM", { locale: idLocale })}
                        </span>
                        <span className={cn(
                          "text-base font-bold leading-none tracking-tight transition-colors duration-200",
                          isToday(startDate) ? "text-white" : "text-stone-900"
                        )}>
                          {isSameDate ? startDate.getDate() : `${startDate.getDate()}-${endDate?.getDate()}`}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Main content - shown inline on mobile next to date */}
                <div className="flex-1 min-w-0 sm:hidden">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-stone-900 text-sm">{b.clientName}</span>
                    {b.isConfirmed && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">✓</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {eventTypes.slice(0, 2).map((et) => (
                      <span
                        key={et.id}
                        className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", EVENT_TYPE_COLORS[et.name] ?? "bg-stone-100 text-stone-600")}
                      >
                        {et.label}
                      </span>
                    ))}
                    {eventTypes.length > 2 && (
                      <span className="text-[10px] text-stone-400">+{eventTypes.length - 2}</span>
                    )}
                    {b.location && <span className="text-xs text-stone-400">📍 {b.location}</span>}
                    {b.hashtag && (
                      <span className="text-[11px] text-stone-400 font-medium truncate max-w-24">{b.hashtag}</span>
                    )}
                  </div>
                </div>
              </div>

                <div className="hidden sm:block flex-1 min-w-0">
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
                  {eventTypes.map((et) => (
                    <span
                      key={et.id}
                      className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", EVENT_TYPE_COLORS[et.name] ?? "bg-stone-100 text-stone-600")}
                    >
                      {et.label}
                    </span>
                  ))}
                  {b.location && <span className="text-xs text-stone-400">📍 {b.location}</span>}
                </div>
              </div>

              {/* Right side - status, price, actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                {/* Top row on mobile: status + actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <span className={cn("badge text-[10px]", getStatusColor(b.status))}>
                    {getStatusLabel(b.status)}
                  </span>
                  {/* View/Edit/Delete buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelect(b); }}
                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye size={14} className="sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(b); }}
                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} className="sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(b.id); }}
                      disabled={deletingId === b.id}
                      className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg transition-colors",
                        deletingId === b.id 
                          ? "text-stone-300 cursor-not-allowed" 
                          : "text-stone-400 hover:text-red-600 hover:bg-red-50"
                      )}
                      title="Hapus"
                    >
                      {deletingId === b.id ? (
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={14} className="sm:w-4 sm:h-4" />
                      )}
                    </button>
                  </div>
                </div>
                {/* Bottom: price and payment status */}
                <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-0">
                  <p className="text-sm font-bold text-stone-900">Rp {packagePrice.toLocaleString("id-ID")}</p>
                  <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded-full", pay.color)}>
                    {pay.label}
                  </span>
                  {days >= 0 && days <= 30 && (
                    <p className={cn(
                      "text-[11px] font-medium sm:mt-0.5",
                      days === 0 ? "text-red-500" : days <= 3 ? "text-amber-500" : "text-stone-400"
                    )}>
                      {days === 0 ? "Hari ini!" : days === 1 ? "Besok" : `${days}h lagi`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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
      <div className="flex flex-row items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-stone-100 gap-2">
        <h2 className="font-bold text-stone-900 text-sm shrink-0">
          {format(calendarDate, "MMMM yyyy", { locale: idLocale })}
        </h2>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button onClick={onToday} className="btn btn-secondary text-xs py-1.5 px-2 sm:px-3">Hari ini</button>
          <button onClick={onPrev} className="btn btn-primary w-9 h-9 p-0 flex items-center justify-center shrink-0" aria-label="Previous month">
            <span className="flex items-center justify-center text-white"><ChevronLeft size={20} strokeWidth={2.5} /></span>
          </button>
          <button onClick={onNext} className="btn btn-primary w-9 h-9 p-0 flex items-center justify-center shrink-0" aria-label="Next month">
            <span className="flex items-center justify-center text-white"><ChevronRight size={20} strokeWidth={2.5} /></span>
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
