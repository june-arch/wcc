"use client";
// src/components/FinanceClient.tsx
import { useMemo } from "react";
import { TrendingUp, TrendingDown, Banknote, AlertCircle, CheckCircle2, Wallet, PieChart, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn, formatBookingDates, formatCurrency } from "@/lib/utils";

import type { BookingWithRelations, Expense } from "@/types";

interface Props {
  bookings: BookingWithRelations[];
  expenses: Expense[];
}

// Key "YYYY-MM" agar bisa diurutkan kronologis, label untuk ditampilkan
const monthInfo = (d: Date | string) => {
  const date = new Date(d);
  return {
    key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    label: date.toLocaleDateString("id-ID", { year: "numeric", month: "long" }),
  };
};

export default function FinanceClient({ bookings, expenses }: Props) {
  const stats = useMemo(() => {
    // Calculate totals using new schema
    let totalPackage = 0;
    let totalPaid = 0;
    let lunas = 0;
    let belumLunas = 0;

    bookings.forEach((b) => {
      const packagePrice = b.pricePackage?.price || 0;
      const addOnsTotal = b.bookingAddOns?.reduce((sum, a) => sum + a.price, 0) || 0;
      const transport = b.transport || 0;
      const discount = b.discount || 0;
      const totalPrice = Math.max(0, packagePrice + addOnsTotal + transport - discount);
      const totalPaidBooking = b.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      totalPackage += totalPrice;
      totalPaid += totalPaidBooking;

      if (totalPaidBooking >= totalPrice) {
        lunas++;
      } else {
        belumLunas++;
      }
    });

    const totalUnpaid = totalPackage - totalPaid;

    // Month breakdown (pemasukan)
    const byMonth: Record<string, { label: string; package: number; paid: number; count: number }> = {};
    bookings.forEach((b) => {
      const { key, label } = monthInfo(b.startDate);
      if (!byMonth[key]) byMonth[key] = { label, package: 0, paid: 0, count: 0 };

      const packagePrice = b.pricePackage?.price || 0;
      const addOnsTotal = b.bookingAddOns?.reduce((sum, a) => sum + a.price, 0) || 0;
      const transport = b.transport || 0;
      const discount = b.discount || 0;
      const totalPrice = Math.max(0, packagePrice + addOnsTotal + transport - discount);
      const totalPaidBooking = b.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      byMonth[key].package += totalPrice;
      byMonth[key].paid += totalPaidBooking;
      byMonth[key].count++;
    });

    // Expenses
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const byExpenseMonth: Record<string, { label: string; total: number; salary: number; fuel: number; other: number; count: number }> = {};
    expenses.forEach((e) => {
      const { key, label } = monthInfo(e.date);
      if (!byExpenseMonth[key]) byExpenseMonth[key] = { label, total: 0, salary: 0, fuel: 0, other: 0, count: 0 };
      byExpenseMonth[key].total += e.amount;
      byExpenseMonth[key][e.category.toLowerCase() as "salary" | "fuel" | "other"] += e.amount;
      byExpenseMonth[key].count++;
    });

    // Semua bulan (punya pemasukan dan/atau pengeluaran), urut kronologis
    const months = Array.from(
      new Set([...Object.keys(byMonth), ...Object.keys(byExpenseMonth)])
    ).sort();

    const netProfit = totalPaid - totalExpenses;

    return { totalPackage, totalPaid, totalUnpaid, lunas, belumLunas, byMonth, months, totalExpenses, byExpenseMonth, netProfit };
  }, [bookings, expenses]);

  const pctOf = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);
  const signedCurrency = (amount: number) => (amount < 0 ? `- ${formatCurrency(Math.abs(amount))}` : formatCurrency(amount));

  const statCards = [
    {
      label: "Total Nilai Kontrak",
      value: formatCurrency(stats.totalPackage),
      icon: Banknote,
      color: "bg-stone-100 text-stone-600",
      border: "border-stone-200",
      sub: `${bookings.length} booking`,
    },
    {
      label: "Sudah Diterima",
      value: formatCurrency(stats.totalPaid),
      icon: TrendingUp,
      color: "bg-emerald-100 text-emerald-600",
      border: "border-emerald-200",
      pct: pctOf(stats.totalPaid, stats.totalPackage),
    },
    {
      label: "Belum Dibayar",
      value: formatCurrency(stats.totalUnpaid),
      icon: AlertCircle,
      color: "bg-red-100 text-red-500",
      border: "border-red-200",
      pct: pctOf(stats.totalUnpaid, stats.totalPackage),
    },
    {
      label: "Lunas",
      value: `${stats.lunas} booking`,
      icon: CheckCircle2,
      color: "bg-blue-100 text-blue-600",
      border: "border-blue-200",
      sub: `${stats.belumLunas} belum lunas`,
    },
    {
      label: "Total Pengeluaran",
      value: formatCurrency(stats.totalExpenses),
      icon: TrendingDown,
      color: "bg-red-100 text-red-500",
      border: "border-red-200",
      sub: `${expenses.length} catatan`,
    },
    {
      label: "Laba Bersih",
      value: signedCurrency(stats.netProfit),
      icon: Wallet,
      color: stats.netProfit >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500",
      border: stats.netProfit >= 0 ? "border-emerald-200" : "border-red-200",
      valueColor: stats.netProfit >= 0 ? "text-stone-900" : "text-red-600",
      sub: "pemasukan − pengeluaran",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Keuangan</h1>
        <p className="text-stone-500 text-sm mt-0.5">Ringkasan pendapatan, pengeluaran & pembayaran</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={cn("card p-4 md:p-5 border", card.border)}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{card.label}</p>
                <p className={cn("text-lg md:text-xl font-bold mt-1 leading-tight tabular-nums", card.valueColor ?? "text-stone-900")}>
                  {card.value}
                </p>
                {card.pct !== undefined && (
                  <p className="text-xs text-stone-500 mt-1 tabular-nums">{card.pct}% dari total</p>
                )}
                {card.sub && <p className="text-xs text-stone-500 mt-1">{card.sub}</p>}
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
            <h2 className="font-bold text-stone-900 text-sm">Pemasukan Per Bulan</h2>
            <p className="text-xs text-stone-500 mt-0.5">Masuk, keluar & laba bersih tiap bulan</p>
          </div>
          <div className="divide-y divide-stone-100">
            {stats.months.length === 0 && (
              <div className="px-5 py-8 text-center">
                <PieChart size={24} className="mx-auto text-stone-300 mb-2" />
                <p className="text-stone-500 text-sm font-medium">Belum ada data pemasukan</p>
              </div>
            )}
            {stats.months.map((month) => {
              const data = stats.byMonth[month];
              const expense = stats.byExpenseMonth[month];
              const label = data?.label || expense?.label || "";
              const paid = data?.paid ?? 0;
              const packageTotal = data?.package ?? 0;
              const count = data?.count ?? 0;
              const expenseTotal = expense?.total ?? 0;
              const net = paid - expenseTotal;
              const pct = packageTotal > 0 ? Math.min(100, Math.round((paid / packageTotal) * 100)) : 0;
              return (
                <div key={month} className="px-4 sm:px-5 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    {/* Identitas bulan */}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-900">{label}</p>
                      <p className="text-xs text-stone-500 mt-0.5 tabular-nums">
                        {count > 0 ? `${count} booking` : "tanpa booking"}
                      </p>
                      <p className="text-xs text-stone-500 tabular-nums">tagihan {formatCurrency(packageTotal)}</p>
                    </div>

                    {/* Ledger: angka rata kanan + tabular supaya deret digit sejajar antar bulan */}
                    <div className="shrink-0 text-right tabular-nums">
                      <div className="flex items-baseline justify-end gap-2">
                        <span className="text-[11px] font-medium text-stone-500">Masuk</span>
                        <span className="w-28 text-sm font-semibold text-emerald-600">{formatCurrency(paid)}</span>
                      </div>
                      <div className="flex items-baseline justify-end gap-2 mt-0.5">
                        <span className="text-[11px] font-medium text-stone-500">Keluar</span>
                        <span className="w-28 text-sm font-semibold text-red-500">{formatCurrency(expenseTotal)}</span>
                      </div>
                      <div className="flex items-baseline justify-end gap-2 mt-1 pt-1.5 border-t border-stone-200">
                        <span className="text-[11px] font-semibold text-stone-600">Laba</span>
                        <span className={cn("w-28 text-sm font-bold", net >= 0 ? "text-stone-900" : "text-red-600")}>
                          {signedCurrency(net)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progres penerimaan */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-stone-500">Penerimaan</span>
                      <span className="text-[11px] font-semibold text-stone-600 tabular-nums">
                        {pct >= 100 ? "Lunas" : `${pct}%`}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${pct}%`, background: pct >= 100 ? "#10b981" : "var(--brand)" }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total pemasukan - pengeluaran */}
          {stats.months.length > 0 && (
            <div className="px-4 sm:px-5 py-4 bg-stone-50 border-t-2 border-stone-200">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-2">
                Total keseluruhan
              </p>
              <div className="tabular-nums">
                <div className="flex items-baseline justify-end gap-2">
                  <span className="text-[11px] font-medium text-stone-500">Masuk</span>
                  <span className="w-28 text-sm font-bold text-emerald-600">{formatCurrency(stats.totalPaid)}</span>
                </div>
                <div className="flex items-baseline justify-end gap-2 mt-0.5">
                  <span className="text-[11px] font-medium text-stone-500">Keluar</span>
                  <span className="w-28 text-sm font-bold text-red-500">{formatCurrency(stats.totalExpenses)}</span>
                </div>
                <div className="flex items-baseline justify-end gap-2 mt-1 pt-1.5 border-t border-stone-300">
                  <span className="text-[11px] font-semibold text-stone-600">Laba bersih</span>
                  <span className={cn("w-28 text-sm font-bold", stats.netProfit >= 0 ? "text-stone-900" : "text-red-600")}>
                    {signedCurrency(stats.netProfit)}
                  </span>
                </div>
              </div>
            </div>
          )}
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
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">Klien</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">Paket</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">Dibayar</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">Sisa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {bookings.map((b) => {
                  const packagePrice = b.pricePackage?.price || 0;
                  const addOnsTotal = b.bookingAddOns?.reduce((sum, a) => sum + a.price, 0) || 0;
                  const transport = b.transport || 0;
                  const discount = b.discount || 0;
                  const totalPrice = Math.max(0, packagePrice + addOnsTotal + transport - discount);
                  const totalPaid = b.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                  const sisa = totalPrice - totalPaid;

                  return (
                    <tr key={b.id} className="table-row">
                      <td className="px-4 py-3">
                        <p className="font-medium text-stone-900 truncate max-w-32">{b.clientName}</p>
                        <p className="text-xs text-stone-500">{formatBookingDates(b as unknown as Parameters<typeof formatBookingDates>[0])}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-stone-700 font-medium tabular-nums">
                        {totalPrice.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600 tabular-nums">
                        {totalPaid.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {sisa > 0 ? (
                          <span className="text-red-500 font-semibold">{sisa.toLocaleString("id-ID")}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                            <CheckCircle2 size={13} strokeWidth={2.5} /> Lunas
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-stone-50 border-t-2 border-stone-200">
                  <td className="px-4 py-3 font-bold text-stone-700 text-sm">TOTAL</td>
                  <td className="px-4 py-3 text-right font-bold text-stone-900 tabular-nums">{stats.totalPackage.toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600 tabular-nums">{stats.totalPaid.toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-500 tabular-nums">{stats.totalUnpaid.toLocaleString("id-ID")}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Pengeluaran section */}
      <div className="card overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-stone-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-stone-900 text-sm">Pengeluaran</h2>
            <p className="text-xs text-stone-500 mt-0.5">Gaji karyawan, bensin mobil & lainnya</p>
          </div>
          <Link href="/dashboard/expenses" className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 shrink-0">
            Kelola <ArrowRight size={14} />
          </Link>
        </div>

        {expenses.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <PieChart size={24} className="mx-auto text-stone-300 mb-2" />
            <p className="text-stone-500 text-sm font-medium">Belum ada pengeluaran tercatat</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {stats.months
              .filter((month) => stats.byExpenseMonth[month])
              .map((month) => {
                const data = stats.byExpenseMonth[month];
                const parts: string[] = [];
                if (data.salary > 0) parts.push(`Gaji ${formatCurrency(data.salary)}`);
                if (data.fuel > 0) parts.push(`Bensin ${formatCurrency(data.fuel)}`);
                if (data.other > 0) parts.push(`Lainnya ${formatCurrency(data.other)}`);
                return (
                  <div key={month} className="px-4 sm:px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-900">{data.label}</p>
                        <p className="text-xs text-stone-500 mt-0.5 tabular-nums">{data.count} catatan</p>
                      </div>
                      <div className="text-right tabular-nums">
                        <p className="text-sm font-semibold text-red-500">{formatCurrency(data.total)}</p>
                        <p className="text-xs text-stone-500 mt-0.5">{parts.join(" · ")}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            <div className="px-4 sm:px-5 py-3.5 bg-stone-50 flex items-center justify-between gap-3 tabular-nums">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">Total pengeluaran</span>
              <span className="text-sm font-bold text-red-500">{formatCurrency(stats.totalExpenses)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
