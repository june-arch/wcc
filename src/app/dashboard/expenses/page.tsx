// src/app/dashboard/expenses/page.tsx
import { prisma } from "@/lib/prisma";
import ExpensesClient from "@/components/ExpensesClient";
import { startOfTodayWIB, getBookingDateKeys, fromDateKey } from "@/lib/utils";
import type { AvailableOrder } from "@/types";

export const revalidate = 0;

const shortDate = (d: Date) =>
  d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export default async function ExpensesPage() {
  // Batas "hari ini" dalam WIB — jangan pakai setHours lokal server (Vercel = UTC, salah hari)
  const today = startOfTodayWIB();

  const [expenses, employees, pastBookings, pastAcrylicOrders] = await Promise.all([
    prisma.expense.findMany({
      include: { employee: true },
      orderBy: { date: "desc" },
    }),
    prisma.employee.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    }),
    prisma.booking.findMany({
      where: { startDate: { lt: today } },
      include: { pricePackage: true, bookingDates: { orderBy: { date: "asc" } } },
      orderBy: { startDate: "desc" },
    }),
    prisma.acrylicOrder.findMany({
      where: { eventDate: { lt: today } },
      orderBy: { eventDate: "desc" },
    }),
  ]);

  // Orderan yang sudah lewat dari hari ini — item multi-select "Tanggal Kerja" (gaji)
  // PER-TANGGAL: setiap booking dipecah jadi 1 entry per tanggal pengerjaan (WIB).
  // Sumber tanggal: bookingDates (asc) utama, fallback expand startDate..endDate inklusif (WIB).
  // id unik per tanggal: "<bookingId>:<YYYY-MM-DD>" — label hanya 1 tanggal: "Klien · 20 Agu 2026 · WCC".
  const availableOrders: AvailableOrder[] = [
    ...pastBookings.flatMap((b) => {
      const keys = getBookingDateKeys(b as unknown as Parameters<typeof getBookingDateKeys>[0]);
      return keys.map((key) => ({
        id: `${b.id}:${key}`,
        clientName: b.clientName,
        label: `${b.clientName} · ${shortDate(fromDateKey(key))} · WCC`,
        type: "wcc" as const,
        date: fromDateKey(key).getTime(),
      }));
    }),
    ...pastAcrylicOrders.map((o) => ({
      id: o.id,
      clientName: o.clientName,
      label: `${o.clientName} · ${shortDate(o.eventDate)} · Acrylic`,
      type: "acrylic" as const,
      date: o.eventDate.getTime(),
    })),
  ].sort((a, b) => b.date - a.date); // terbaru → terlama (per tanggal)

  return (
    <ExpensesClient
      initialExpenses={JSON.parse(JSON.stringify(expenses))}
      initialEmployees={JSON.parse(JSON.stringify(employees))}
      availableOrders={availableOrders}
    />
  );
}
