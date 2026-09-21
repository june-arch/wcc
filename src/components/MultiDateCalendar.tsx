"use client";
// src/components/MultiDateCalendar.tsx — kalender bulanan multi-select tanpa dep baru
// Extended: mode order (gaji) — tampilkan dot WCC/Acrylic, disable hari tanpa orderan
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { getHolidayInfo, isWeekend, cn } from "@/lib/utils";
import type { AvailableOrder } from "@/types";

function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface Props {
  value: string[]; // YYYY-MM-DD
  onChange: (next: string[]) => void;
  // Mode order: dipakai ExpensesClient untuk kalender gaji
  ordersByDate?: Map<string, AvailableOrder[]>;
  selectedOrderIds?: string[];
  onToggleOrderId?: (id: string) => void;
  activeDateKey?: string | null;
  onActiveDateChange?: (key: string | null) => void;
}

export default function MultiDateCalendar({ value, onChange, ordersByDate, selectedOrderIds, onToggleOrderId, activeDateKey, onActiveDateChange }: Props) {
  const isOrderMode = !!ordersByDate;
  const [cursor, setCursor] = useState(() => {
    if (!isOrderMode && value.length > 0) {
      const first = value.slice().sort()[0];
      return new Date(`${first}T12:00:00+07:00`);
    }
    return new Date();
  });

  const set = useMemo(() => new Set(value), [value]);
  const selectedOrderSet = useMemo(() => new Set(selectedOrderIds ?? []), [selectedOrderIds]);
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const toggle = (d: Date) => {
    const k = toKey(d);
    const next = set.has(k) ? value.filter((x) => x !== k) : [...value, k];
    next.sort();
    onChange(next);
  };

  const handleOrderDayClick = (d: Date) => {
    if (!ordersByDate || !onToggleOrderId) return;
    const k = toKey(d);
    const list = ordersByDate.get(k);
    if (!list || list.length === 0) return;
    if (list.length === 1) {
      onToggleOrderId(list[0].id);
      // keep active highlight on that day for feedback
      if (onActiveDateChange) onActiveDateChange(k);
    } else {
      if (onActiveDateChange) onActiveDateChange(activeDateKey === k ? null : k);
    }
  };

  const dayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden bg-white">
      <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100">
        <p className="text-sm font-bold text-stone-800">{format(cursor, "MMMM yyyy", { locale: idLocale })}</p>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setCursor(subMonths(cursor, 1))} className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500" aria-label="Bulan sebelumnya">
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={() => setCursor(new Date())} className="text-[10px] font-semibold px-2 py-1 rounded-lg border border-stone-200 hover:bg-stone-50">Hari ini</button>
          <button type="button" onClick={() => setCursor(addMonths(cursor, 1))} className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500" aria-label="Bulan berikutnya">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 bg-stone-50 border-b border-stone-100">
        {dayLabels.map((d) => (
          <div key={d} className="text-center py-1.5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-stone-100 p-px">
        {days.map((d) => {
          const k = toKey(d);
          const inMonth = isSameMonth(d, cursor);
          const today = isToday(d);
          const holiday = getHolidayInfo(d);
          const weekend = isWeekend(d);

          if (isOrderMode) {
            const list = ordersByDate!.get(k);
            const hasOrders = !!list && list.length > 0;
            const wccCount = list ? list.filter((o) => o.type === "wcc").length : 0;
            const acrCount = list ? list.filter((o) => o.type === "acrylic").length : 0;
            const hasSelected = list ? list.some((o) => selectedOrderSet.has(o.id)) : false;
            const isActive = activeDateKey === k;
            const disabled = !hasOrders;
            return (
              <button
                key={k + d.toISOString()}
                type="button"
                disabled={disabled}
                onClick={() => handleOrderDayClick(d)}
                className={cn(
                  "h-9 min-h-[36px] text-xs font-semibold flex flex-col items-center justify-center relative bg-white transition-colors select-none",
                  !inMonth && "text-stone-300 bg-stone-50/60",
                  disabled && "bg-white text-stone-300 cursor-not-allowed opacity-60",
                  !disabled && !hasSelected && "hover:bg-stone-50 text-stone-700",
                  hasSelected && "bg-orange-500 text-white hover:bg-orange-600",
                  isActive && !hasSelected && hasOrders && "ring-2 ring-inset ring-orange-300",
                  !hasSelected && today && hasOrders && "ring-1 ring-inset ring-orange-200",
                  !hasSelected && holiday && hasOrders && "text-red-600",
                  !hasSelected && weekend && !holiday && hasOrders && "text-stone-600"
                )}
                title={hasOrders ? list!.map((o) => o.label).join(" | ") + (holiday ? ` · ${holiday.label}` : "") : holiday ? holiday.label : undefined}
                aria-label={`${k}${hasOrders ? ` — ${list!.length} orderan` : ""}`}
              >
                <span className={cn("leading-none", hasSelected && "text-white")}>{d.getDate()}</span>
                {hasOrders && (
                  <span className="flex items-center gap-0.5 mt-0.5">
                    {wccCount > 0 && <span className={cn("w-1.5 h-1.5 rounded-full", hasSelected ? "bg-white" : "bg-orange-500")} />}
                    {acrCount > 0 && <span className={cn("w-1.5 h-1.5 rounded-full", hasSelected ? "bg-white/90" : "bg-cyan-500")} />}
                    {list!.length > 1 && (
                      <span className={cn("text-[8px] font-bold leading-none ml-0.5", hasSelected ? "text-white" : wccCount && acrCount ? "text-stone-600" : wccCount ? "text-orange-600" : "text-cyan-600")}>
                        ×{list!.length}
                      </span>
                    )}
                  </span>
                )}
                {!hasOrders && holiday && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-300" />}
              </button>
            );
          }

          const selected = set.has(k);
          return (
            <button
              key={k + d.toISOString()}
              type="button"
              onClick={() => toggle(d)}
              className={cn(
                "h-9 text-xs font-semibold flex items-center justify-center relative bg-white hover:bg-stone-50 transition-colors",
                !inMonth && "text-stone-300 bg-stone-50/60",
                selected && "bg-orange-500 text-white hover:bg-orange-600",
                !selected && today && "ring-1 ring-inset ring-orange-300",
                !selected && holiday && "text-red-500",
                !selected && weekend && !holiday && "text-stone-400"
              )}
              title={holiday ? holiday.label : undefined}
            >
              {d.getDate()}
              {!selected && holiday && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-400" />}
            </button>
          );
        })}
      </div>
      {isOrderMode ? (
        <div className="px-3 py-2 border-t border-stone-100 bg-stone-50/50">
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> WCC</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500" /> Acrylic</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500" /> Terpilih</span>
            <span className="ml-auto text-[10px]">Hari tanpa orderan tidak bisa dipilih</span>
          </div>
        </div>
      ) : (
        <p className="px-3 py-2 text-[11px] text-stone-400">Klik tanggal untuk pilih/hapus. Bisa lompat (mis. 12 & 15 tanpa 13-14).</p>
      )}
    </div>
  );
}
