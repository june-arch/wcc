// src/app/dashboard/event-types/loading.tsx
import { CalendarDays } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="relative">
        <div className="w-16 h-16 rounded-xl bg-orange-100 flex items-center justify-center">
          <CalendarDays className="w-8 h-8 text-orange-500" />
        </div>
        <div className="absolute inset-0 rounded-xl border-2 border-orange-200 animate-pulse" />
      </div>
      <p className="mt-4 text-stone-500 font-medium">Memuat data event types...</p>
      <div className="mt-3 w-32 h-1 bg-stone-200 rounded-full overflow-hidden">
        <div className="h-full bg-orange-500 animate-[shimmer_1.4s_infinite]" style={{ backgroundSize: "200% 100%" }} />
      </div>
    </div>
  );
}
