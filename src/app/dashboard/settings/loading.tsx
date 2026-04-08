// src/app/dashboard/settings/loading.tsx
import { Settings } from "lucide-react";

export default function SettingsLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center animate-pulse">
          <Settings size={32} className="text-stone-500" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-stone-500 rounded-full flex items-center justify-center">
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
      <p className="mt-4 text-sm text-stone-500 font-medium animate-pulse">
        Memuat pengaturan...
      </p>
    </div>
  );
}
