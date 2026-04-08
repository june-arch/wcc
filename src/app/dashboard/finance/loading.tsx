// src/app/dashboard/finance/loading.tsx
import { Wallet } from "lucide-react";

export default function FinanceLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center animate-pulse">
          <Wallet size={32} className="text-emerald-500" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
      <p className="mt-4 text-sm text-stone-500 font-medium animate-pulse">
        Memuat data keuangan...
      </p>
    </div>
  );
}
