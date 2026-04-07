"use client";
// src/components/FinanceClient.tsx
import { useMemo } from "react";
import { TrendingUp, TrendingDown, Banknote, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn, formatDate, getPaymentStatus } from "@/lib/utils";

type BookingFinance = {
  id: string;
  clientName: string;
  hashtag: string | null;
  package: number;
  paid: number;
  startDate: string;
  status: string;
  eventType: string[];
  payments: { id: string; amount: number; note: string | null; paidAt: string }[];
};

export default function FinanceClient({ bookings }: { bookings: BookingFinance[] }) {
  const stats = useMemo(() => {
    const totalPackage = bookings.reduce((s, b) => s + b.package, 0);
    const totalPaid = bookings.reduce((s, b) => s + b.paid, 0);
    const totalUnpaid = totalPackage - totalPaid;
    const lunas = bookings.filter((b) => b.paid >= b.package).length;
    const belumLunas = bookings.filter((b) => b.paid < b.package).length;

    // Month breakdown
    const byMonth: Record<string, { package: number; paid: number; count: number }> = {};
    bookings.forEach((b) => {
      const key = new Date(b.startDate).toLocaleDateString("id-ID", { year: "numeric", month: "long" });
      if (!byMonth[key]) byMonth[key] = { package: 0, paid: 0, count: 0 };
      byMonth[key].package += b.package;
      byMonth[key].paid += b.paid;
      byMonth[key].count++;
    });

    return { totalPackage, totalPaid, totalUnpaid, lunas, belumLunas, byMonth };
  }, [bookings]);

  const statCards = [
    {
      label: "Total Nilai Kontrak",
      value: `Rp ${stats.totalPackage.toLocaleString("id-ID")}k`,
      icon: Banknote,
      color: "bg-stone-100 text-stone-600",
      border: "border-stone-200",
    },
    {
      label: "Sudah Diterima",
      value: `Rp ${stats.totalPaid.toLocaleString("id-ID")}k`,
      icon: TrendingUp,
      color: "bg-emerald-100 text-emerald-600",
      border: "border-emerald-200",
      pct: Math.round((stats.totalPaid / stats.totalPackage) * 100),
    },
    {
      label: "Belum Dibayar",
      value: `Rp ${stats.totalUnpaid.toLocaleString("id-ID")}k`,
      icon: AlertCircle,
      color: "bg-red-100 text-red-500",
      border: "border-red-200",
      pct: Math.round((stats.totalUnpaid / stats.totalPackage) * 100),
    },
    {
      label: "Lunas",
      value: `${stats.lunas} booking`,
      icon: CheckCircle2,
      color: "bg-blue-100 text-blue-600",
      border: "border-blue-200",
      sub: `${stats.belumLunas} belum lunas`,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Keuangan</h1>
        <p className="text-stone-500 text-sm mt-0.5">Ringkasan pendapatan & pembayaran</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={cn("card p-4 md:p-5 border", card.border)}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">{card.label}</p>
                <p className="text-lg md:text-xl font-bold text-stone-900 mt-1 leading-tight">{card.value}</p>
                {card.pct !== undefined && (
                  <p className="text-xs text-stone-400 mt-1">{card.pct}% dari total</p>
                )}
                {card.sub && <p className="text-xs text-stone-400 mt-1">{card.sub}</p>}
              </div>
              <div className={cn("w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center shrink-0", card.color)}>
                <card.icon size={16} className="md:w-[17px] md:h-[17px]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* By month */}
        <div className="card">
          <div className="px-4 sm:px-5 py-4 border-b border-stone-100">
            <h2 className="font-bold text-stone-900 text-sm">Per Bulan</h2>
          </div>
          <div className="divide-y divide-stone-50">
            {Object.entries(stats.byMonth).map(([month, data]) => {
              const pct = Math.round((data.paid / data.package) * 100);
              return (
                <div key={month} className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="text-sm font-semibold text-stone-800 capitalize">{month}</span>
                      <span className="text-xs text-stone-400 ml-2">{data.count} booking</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">Rp {data.paid.toLocaleString()}k</p>
                      <p className="text-xs text-stone-400">dari Rp {data.package.toLocaleString()}k</p>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${pct}%`, background: pct === 100 ? "#10b981" : "var(--brand)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per booking table */}
        <div className="card overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-stone-100">
            <h2 className="font-bold text-stone-900 text-sm">Detail Per Booking</h2>
          </div>
          <div className="overflow-x-auto -mx-px">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-stone-400 uppercase tracking-wider">Klien</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-stone-400 uppercase tracking-wider">Paket</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-stone-400 uppercase tracking-wider">Dibayar</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-stone-400 uppercase tracking-wider">Sisa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {bookings.map((b) => {
                  const sisa = b.package - b.paid;
                  return (
                    <tr key={b.id} className="table-row">
                      <td className="px-4 py-3">
                        <p className="font-medium text-stone-900 truncate max-w-32">{b.clientName}</p>
                        <p className="text-xs text-stone-400">{formatDate(b.startDate)}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-stone-700 font-medium">
                        {b.package.toLocaleString()}k
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                        {b.paid.toLocaleString()}k
                      </td>
                      <td className="px-4 py-3 text-right">
                        {sisa > 0 ? (
                          <span className="text-red-500 font-semibold">{sisa.toLocaleString()}k</span>
                        ) : (
                          <span className="text-emerald-500 font-bold">✓ Lunas</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-stone-50 border-t-2 border-stone-200">
                  <td className="px-4 py-3 font-bold text-stone-700 text-sm">TOTAL</td>
                  <td className="px-4 py-3 text-right font-bold text-stone-900">{stats.totalPackage.toLocaleString()}k</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">{stats.totalPaid.toLocaleString()}k</td>
                  <td className="px-4 py-3 text-right font-bold text-red-500">{stats.totalUnpaid.toLocaleString()}k</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
