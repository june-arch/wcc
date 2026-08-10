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
  startDate?: Date | string;
  transport?: number;
  discount?: number;
  pricePackage?: { price: number } | null;
  bookingAddOns?: Array<{ price: number }>;
  payments?: Array<{ amount: number }>;
  bookingEventTypes?: Array<{ eventType: { label: string } }>;
}

interface AcrylicOrder {
  id: string;
  clientName: string;
  acrylicText?: string | null;
  totalPrice?: number;
  payments?: Array<{ amount: number }>;
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

  // hitung total & sudah dibayar per booking WCC
  const bookingPayment = (b: Booking) => {
    const total =
      (b.pricePackage?.price ?? 0) +
      (b.bookingAddOns?.reduce((s, a) => s + a.price, 0) ?? 0) +
      (b.transport ?? 0) -
      (b.discount ?? 0);
    const paid = b.payments?.reduce((s, p) => s + p.amount, 0) ?? 0;
    return { total: Math.max(0, total), paid };
  };

  // hitung sudah dibayar per order acrylic
  const orderPaid = (o: AcrylicOrder) => o.payments?.reduce((s, p) => s + p.amount, 0) ?? 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[60] animate-fade-in" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col animate-slide-up">
          {/* Header */}
          <div className={cn(
            "px-5 py-4 flex items-center sm:items-start justify-between shrink-0",
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
          <div className="px-5 py-2.5 border-b border-stone-100 flex items-center gap-3 text-xs text-stone-500 shrink-0">
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
          <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
            {totalEvents === 0 ? (
              <div className="px-5 py-8 text-center">
                <CalendarDays size={28} className="mx-auto text-stone-200 mb-2" />
                <p className="text-stone-400 text-sm font-medium">Tidak ada acara</p>
                {holidayInfo && <p className="text-stone-400 text-xs mt-1">{holidayInfo.label}</p>}
              </div>
            ) : (
              <div className="divide-y divide-stone-50">
                {allBookings.map((b) => {
                  const { total, paid } = bookingPayment(b);
                  const sisa = Math.max(0, total - paid);
                  const isLunas = total > 0 && paid >= total;
                  return (
                    <button
                      key={b.id}
                      onClick={() => { onSelectBooking?.(b); onClose(); }}
                      className="w-full flex items-start gap-3 px-5 py-3 hover:bg-orange-50 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                        <Camera size={14} className="text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-stone-900 truncate">{b.clientName}</p>
                          {total > 0 && (
                            <span className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                              isLunas ? "bg-emerald-100 text-emerald-700" : paid > 0 ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-500"
                            )}>
                              {isLunas ? "Lunas" : paid > 0 ? "DP" : "Belum"}
                            </span>
                          )}
                        </div>
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
                        {total > 0 && (
                          <p className="text-[10px] text-stone-500 mt-1">
                            <span className="font-semibold text-emerald-600">Bayar Rp {paid.toLocaleString("id-ID")}</span>
                            {sisa > 0 && <span className="text-stone-400"> · Sisa Rp {sisa.toLocaleString("id-ID")}</span>}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full shrink-0">WCC</span>
                    </button>
                  );
                })}

                {allOrders.map((o) => {
                  const paid = orderPaid(o);
                  const total = o.totalPrice ?? 0;
                  const sisa = Math.max(0, total - paid);
                  const isLunas = total > 0 && paid >= total;
                  return (
                    <button
                      key={o.id}
                      onClick={() => { onSelectOrder?.(o); onClose(); }}
                      className="w-full flex items-start gap-3 px-5 py-3 hover:bg-cyan-50 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                        <Square size={14} className="text-cyan-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-stone-900 truncate">{o.clientName}</p>
                          {total > 0 && (
                            <span className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                              isLunas ? "bg-emerald-100 text-emerald-700" : paid > 0 ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-500"
                            )}>
                              {isLunas ? "Lunas" : paid > 0 ? "DP" : "Belum"}
                            </span>
                          )}
                        </div>
                        {o.acrylicText && (
                          <p className="text-xs text-stone-400 truncate mt-0.5">{o.acrylicText.split("\n")[0]}</p>
                        )}
                        {total > 0 && (
                          <p className="text-[10px] text-stone-500 mt-1">
                            <span className="font-semibold text-cyan-600">Bayar Rp {paid.toLocaleString("id-ID")}</span>
                            {sisa > 0 && <span className="text-stone-400"> · Sisa Rp {sisa.toLocaleString("id-ID")}</span>}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full shrink-0">Acrylic</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}