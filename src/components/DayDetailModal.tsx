"use client";
import { useEffect } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { X, CalendarDays, MapPin, Square, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { HolidayInfo } from "@/lib/utils";

interface Booking {
  id: string;
  clientName: string;
  location?: string | null;
  bookingEventTypes?: Array<{ eventType: { label: string } }>;
}

interface AcrylicOrder {
  id: string;
  clientName: string;
  acrylicText?: string | null;
}

interface DayDetailModalProps {
  date: Date;
  holidayInfo: HolidayInfo | null;
  isWeekend: boolean;
  bookings?: Booking[];
  orders?: AcrylicOrder[];
  wccBookings?: Booking[];
  acrylicOrders?: AcrylicOrder[];
  type: "wcc" | "acrylic" | "mixed";
  onClose: () => void;
  onSelectBooking?: (b: any) => void;
  onSelectOrder?: (o: any) => void;
}

export default function DayDetailModal({
  date,
  holidayInfo,
  isWeekend,
  bookings = [],
  orders = [],
  wccBookings = [],
  acrylicOrders = [],
  type,
  onClose,
  onSelectBooking,
  onSelectOrder,
}: DayDetailModalProps) {
  const allBookings = [...bookings, ...wccBookings];
  const allOrders = [...orders, ...acrylicOrders];
  const totalEvents = allBookings.length + allOrders.length;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-x-4 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-50 animate-slide-up">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={cn(
            "px-5 py-4 flex items-center sm:items-start justify-between",
            holidayInfo ? "bg-red-50" : isWeekend ? "bg-stone-100" : type === "acrylic" ? "bg-cyan-50" : "bg-orange-50"
          )}>
            <div>
              <p className={cn(
                "text-xs font-medium uppercase tracking-wide",
                holidayInfo ? "text-red-500" : isWeekend ? "text-stone-400" : type === "acrylic" ? "text-cyan-500" : "text-orange-500"
              )}>
                {format(date, "EEEE", { locale: idLocale })}
              </p>
              <h2 className={cn("text-lg font-bold mt-0.5", holidayInfo ? "text-red-700" : "text-stone-900")}>
                {format(date, "d MMMM yyyy", { locale: idLocale })}
              </h2>
              {holidayInfo && (
                <span className={cn(
                  "inline-flex items-center mt-1 text-xs font-semibold px-2 py-0.5 rounded-full",
                  holidayInfo.cutiBersama ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-600"
                )}>
                  {holidayInfo.label}
                </span>
              )}
              {isWeekend && !holidayInfo && (
                <span className="inline-flex items-center mt-1 text-xs font-medium text-stone-400 px-2 py-0.5 rounded-full bg-stone-200">
                  Akhir Pekan
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Summary */}
          <div className="px-5 py-2.5 border-b border-stone-100 flex items-center gap-3 text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={12} />
              {totalEvents} event{totalEvents !== 1 ? "s" : ""}
            </span>
            {allBookings.length > 0 && (
              <span className="flex items-center gap-1">
                <Camera size={11} className="text-orange-400" />
                {allBookings.length} WCC
              </span>
            )}
            {allOrders.length > 0 && (
              <span className="flex items-center gap-1">
                <Square size={11} className="text-cyan-400" />
                {allOrders.length} Acrylic
              </span>
            )}
          </div>

          {/* Event list */}
          <div className="max-h-80 overflow-y-auto">
            {totalEvents === 0 ? (
              <div className="px-5 py-8 text-center">
                <CalendarDays size={28} className="mx-auto text-stone-200 mb-2" />
                <p className="text-stone-400 text-sm font-medium">Tidak ada acara</p>
                {holidayInfo && <p className="text-stone-400 text-xs mt-1">{holidayInfo.label}</p>}
              </div>
            ) : (
              <div className="divide-y divide-stone-50">
                {allBookings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { onSelectBooking?.(b); onClose(); }}
                    className="w-full flex items-start gap-3 px-5 py-3 hover:bg-orange-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                      <Camera size={14} className="text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate">{b.clientName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {b.location && (
                          <span className="text-xs text-stone-400 flex items-center gap-0.5 truncate max-w-[160px]">
                            <MapPin size={10} />{b.location}
                          </span>
                        )}
                        {b.bookingEventTypes && b.bookingEventTypes.length > 0 && (
                          <span className="text-[10px] text-orange-500 font-medium truncate">
                            {b.bookingEventTypes.map(be => be.eventType.label).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full shrink-0">WCC</span>
                  </button>
                ))}

                {allOrders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => { onSelectOrder?.(o); onClose(); }}
                    className="w-full flex items-start gap-3 px-5 py-3 hover:bg-cyan-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                      <Square size={14} className="text-cyan-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate">{o.clientName}</p>
                      {o.acrylicText && (
                        <p className="text-xs text-stone-400 truncate mt-0.5">{o.acrylicText.split("\n")[0]}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full shrink-0">Acrylic</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}