"use client";
// src/components/MultiDateCalendar.tsx — kalender bulanan multi-select tanpa dep baru
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { getHolidayInfo, isWeekend, cn } from "@/lib/utils";

function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface Props {
  value: string[]; // YYYY-MM-DD
  onChange: (next: string[]) => void;
}

export default function MultiDateCalendar({ value, onChange }: Props) {
  const [cursor, setCursor] = useState(() => {
    if (value.length > 0) {
      const first = value.slice().sort()[0];
      return new Date(`${first}T12:00:00+07:00`);
    }
    return new Date();
  });

  const set = useMemo(() => new Set(value), [value]);
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
          const selected = set.has(k);
          const inMonth = isSameMonth(d, cursor);
          const today = isToday(d);
          const holiday = getHolidayInfo(d);
          const weekend = isWeekend(d);
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
      <p className="px-3 py-2 text-[11px] text-stone-400">Klik tanggal untuk pilih/hapus. Bisa lompat (mis. 12 & 15 tanpa 13-14).</p>
    </div>
  );
}
