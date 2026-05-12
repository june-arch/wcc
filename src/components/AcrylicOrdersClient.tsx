"use client";
// src/components/AcrylicOrdersClient.tsx
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  LayoutList, CalendarDays, Plus, Search,
  ChevronLeft, ChevronRight, Pencil, Trash2, Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn, formatDate, getStatusColor, getStatusLabel, getDaysUntil, getHolidayInfo, isWeekend, getDayColor } from "@/lib/utils";
import type { AcrylicOrderWithRelations, ViewMode } from "@/types";
import AcrylicOrderModal from "./AcrylicOrderModal";
import AcrylicDetailPanel from "./AcrylicDetailPanel";
import ResponsiveConfirm from "./ui/ResponsiveConfirm";
import DayDetailModal from "./DayDetailModal";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, format, addMonths, subMonths
} from "date-fns";
import { id as idLocale } from "date-fns/locale";

const STATUS_OPTIONS = [
  { value: "ALL", label: "Semua" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Dikonfirmasi" },
  { value: "COMPLETED", label: "Lunas" },
  { value: "CANCELLED", label: "Batal" },
];

export default function AcrylicOrdersClient({ initialOrders }: { initialOrders: AcrylicOrderWithRelations[] }) {
  const [orders, setOrders] = useState<AcrylicOrderWithRelations[]>(initialOrders);
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedOrder, setSelectedOrder] = useState<AcrylicOrderWithRelations | null>(null);
  const [editingOrder, setEditingOrder] = useState<AcrylicOrderWithRelations | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; orderId: string | null }>({ isOpen: false, orderId: null });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Listen for edit event from detail panel
  useEffect(() => {
    const handleEdit = (e: CustomEvent<AcrylicOrderWithRelations>) => {
      setEditingOrder(e.detail);
      setShowEditModal(true);
    };
    window.addEventListener('edit-acrylic', handleEdit as EventListener);
    return () => window.removeEventListener('edit-acrylic', handleEdit as EventListener);
  }, []);

  // ─── Filtered list ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        !search ||
        o.clientName.toLowerCase().includes(search.toLowerCase()) ||
        o.acrylicText.toLowerCase().includes(search.toLowerCase()) ||
        o.address.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "ALL" || o.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [orders, search, filterStatus]);

  // ─── Calendar grid ───────────────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calendarDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(calendarDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [calendarDate]);

  const getOrdersForDay = useCallback(
    (day: Date) =>
      filtered.filter((o) => {
        const s = new Date(o.eventDate);
        const dayMs = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
        const sMs = new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime();
        return dayMs === sMs;
      }),
    [filtered]
  );

  // ─── Update helpers ──────────────────────────────────────────────────────────
  const patchOrder = useCallback((id: string, patch: Partial<AcrylicOrderWithRelations>) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    setSelectedOrder((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
  }, []);

  const handleUpdate = useCallback((updated: AcrylicOrderWithRelations) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setShowEditModal(false);
    setEditingOrder(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm.orderId) return;

    const orderId = deleteConfirm.orderId;
    const originalOrders = [...orders];
    const originalSelected = selectedOrder;

    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (selectedOrder?.id === orderId) setSelectedOrder(null);
    setDeletingId(orderId);
    setDeleteConfirm({ isOpen: false, orderId: null });

    try {
      const res = await fetch(`/api/acrylic/${orderId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Order berhasil dihapus");
    } catch {
      setOrders(originalOrders);
      setSelectedOrder(originalSelected);
      toast.error("Gagal menghapus order");
    } finally {
      setDeletingId(null);
    }
  }, [deleteConfirm.orderId, selectedOrder, orders]);

  // Full server refresh
  const refreshAll = useCallback(async () => {
    const res = await fetch("/api/acrylic");
    if (!res.ok) return;
    const fresh: AcrylicOrderWithRelations[] = await res.json();
    setOrders(fresh);
    setSelectedOrder((prev) => (prev ? (fresh.find((o) => o.id === prev.id) ?? null) : null));
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-stone-900">Order Acrylic</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {filtered.length} dari {orders.length} order
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary gap-2 shrink-0 justify-center w-full sm:w-auto">
          <Plus size={16} />
          <span className="hidden sm:inline">Tambah Order</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="input-base pl-9 py-2 text-sm w-full"
            placeholder="Cari nama, teks ucapan, alamat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1 overflow-x-auto">
          {STATUS_OPTIONS.map((opt) => (
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
        <div className={cn("flex-1 min-w-0", selectedOrder && "hidden lg:block")}>
          {view === "list" ? (
            <ListView
              orders={filtered}
              selectedId={selectedOrder?.id}
              onSelect={setSelectedOrder}
              onEdit={(o) => { setEditingOrder(o); setShowEditModal(true); }}
              onDelete={(id) => setDeleteConfirm({ isOpen: true, orderId: id })}
              deletingId={deletingId}
            />
          ) : (
            <CalendarView
              days={calendarDays}
              calendarDate={calendarDate}
              onPrev={() => setCalendarDate(subMonths(calendarDate, 1))}
              onNext={() => setCalendarDate(addMonths(calendarDate, 1))}
              onToday={() => setCalendarDate(new Date())}
              getOrdersForDay={getOrdersForDay}
              onSelectOrder={setSelectedOrder}
              onSelectDay={(day) => setSelectedDay(day)}
              selectedId={selectedOrder?.id}
            />
          )}
        </div>

        {selectedOrder && (
          <div className="w-full shrink-0 animate-slide-in fixed inset-0 z-40 bg-white">
            <div className="h-full overflow-y-auto">
              <AcrylicDetailPanel
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
                onPatch={patchOrder}
                onDelete={(id) => setDeleteConfirm({ isOpen: true, orderId: id })}
              />
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AcrylicOrderModal
          onClose={() => setShowAddModal(false)}
          onSuccess={async (newOrder) => {
            setShowAddModal(false);
            await refreshAll();
            setSelectedOrder(newOrder);
          }}
        />
      )}

      {showEditModal && editingOrder && (
        <AcrylicOrderModal
          onClose={() => { setShowEditModal(false); setEditingOrder(null); }}
          onSuccess={handleUpdate}
        />
      )}

      <ResponsiveConfirm
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, orderId: null })}
        onConfirm={handleDelete}
        title="Hapus Order Acrylic?"
        message="Yakin ingin menghapus order ini? Semua data terkait akan hilang dan tidak bisa dikembalikan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />

      {selectedDay && (
        <DayDetailModal
          date={selectedDay}
          holidayInfo={getHolidayInfo(selectedDay)}
          isWeekend={isWeekend(selectedDay)}
          orders={getOrdersForDay(selectedDay)}
          type="acrylic"
          onClose={() => setSelectedDay(null)}
          onSelectOrder={(o) => { setSelectedOrder(o); setSelectedDay(null); }}
        />
      )}
    </div>
  );
}

/* ─── List View ──────────────────────────────────────────────────────────────── */
function ListView({
  orders, selectedId, onSelect, onEdit, onDelete, deletingId,
}: {
  orders: AcrylicOrderWithRelations[];
  selectedId?: string;
  onSelect: (o: AcrylicOrderWithRelations) => void;
  onEdit: (o: AcrylicOrderWithRelations) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  if (orders.length === 0) {
    return (
      <div className="card py-16 text-center mb-6">
        <CalendarDays size={32} className="mx-auto text-stone-300 mb-3" />
        <p className="text-stone-500 font-medium">Tidak ada order</p>
        <p className="text-stone-400 text-sm mt-1">Coba ubah filter atau tambah order baru</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 pb-20">
      {orders.map((o) => {
        const days = getDaysUntil(o.eventDate);
        const totalPaid = o.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const sisa = o.totalPrice - totalPaid;
        const isSelected = o.id === selectedId;

        return (
          <div
            key={o.id}
            className={cn(
              "w-full flex flex-col sm:flex-row gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4 text-left transition-colors border rounded-xl bg-white",
              isSelected
                ? "bg-cyan-50 border-cyan-200 ring-1 ring-cyan-200"
                : "border-stone-200 hover:border-stone-300"
            )}
          >
            {/* Date card */}
            <div className="shrink-0">
              <div className={cn(
                "w-14 h-14 rounded-lg flex flex-col items-center justify-center border transition-all",
                isToday(new Date(o.eventDate))
                  ? "bg-gradient-to-br from-cyan-500 to-cyan-600 border-cyan-400 shadow-lg"
                  : "bg-gradient-to-br from-stone-50 to-stone-100 border-stone-200 shadow-md"
              )}>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider leading-none",
                  isToday(new Date(o.eventDate)) ? "text-cyan-100" : "text-stone-500"
                )}>
                  {format(new Date(o.eventDate), "MMM", { locale: idLocale })}
                </span>
                <span className={cn(
                  "text-base font-bold leading-none",
                  isToday(new Date(o.eventDate)) ? "text-white" : "text-stone-900"
                )}>
                  {new Date(o.eventDate).getDate()}
                </span>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-stone-900 text-sm">{o.clientName}</span>
                {o.panelTypes?.map((pt, i) => (
                  <span key={i} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-cyan-50 text-cyan-600 border border-cyan-100">
                    {pt}
                  </span>
                ))}
              </div>
              <p className="text-xs text-stone-400 mt-1 line-clamp-1">{o.address}</p>
              <p className="text-xs text-stone-400 line-clamp-1 font-mono mt-0.5">
                {o.acrylicText.split("\n")[0]}
              </p>
            </div>

            {/* Right side */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <span className={cn("badge text-[10px]", getStatusColor(o.status))}>
                  {getStatusLabel(o.status)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelect(o); }}
                    className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Lihat Detail"
                  >
                    <Eye size={14} className="sm:w-4 sm:h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(o); }}
                    className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={14} className="sm:w-4 sm:h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(o.id); }}
                    disabled={deletingId === o.id}
                    className={cn(
                      "w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg transition-colors",
                      deletingId === o.id ? "text-stone-300 cursor-not-allowed" : "text-stone-400 hover:text-red-600 hover:bg-red-50"
                    )}
                    title="Hapus"
                  >
                    {deletingId === o.id ? (
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={14} className="sm:w-4 sm:h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-0">
                <p className="text-sm font-bold text-stone-900">
                  Rp {o.totalPrice.toLocaleString("id-ID")}
                </p>
                {sisa > 0 ? (
                  <p className="text-[11px] text-red-400 font-medium">Unpaid Rp{sisa.toLocaleString("id-ID")}</p>
                ) : (
                  <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Lunas</span>
                )}
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
  getOrdersForDay, onSelectOrder, onSelectDay, selectedId,
}: {
  days: Date[];
  calendarDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  getOrdersForDay: (d: Date) => AcrylicOrderWithRelations[];
  onSelectOrder: (o: AcrylicOrderWithRelations) => void;
  onSelectDay: (d: Date) => void;
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
          const dayOrders = getOrdersForDay(day);
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
                <button
                  onClick={() => onSelectDay(day)}
                  className={cn(
                    "text-xs font-semibold w-6 h-6 inline-flex items-center justify-center rounded-full transition-all hover:scale-110",
                    todayFlag ? "bg-cyan-500 text-white hover:bg-cyan-600" :
                    holidayInfo ? "text-red-500 hover:bg-red-100" :
                    isWeekendDay ? "text-stone-400 hover:bg-stone-200" :
                    "text-stone-500 hover:bg-stone-200"
                  )}
                >
                  {day.getDate()}
                </button>
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
                {dayOrders.slice(0, 3).map((o) => (
                  <button
                    key={o.id}
                    onClick={() => onSelectOrder(o)}
                    className={cn(
                      "w-full text-left text-[10px] font-semibold px-1.5 py-0.5 rounded truncate transition-colors",
                      o.id === selectedId
                        ? "bg-cyan-400 text-white"
                        : "bg-cyan-100 text-cyan-800 hover:bg-cyan-200"
                    )}
                  >
                    {o.clientName.split(" ")[0]}
                  </button>
                ))}
                {dayOrders.length > 3 && (
                  <p className="text-[10px] text-stone-400 px-1">+{dayOrders.length - 3} lagi</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
