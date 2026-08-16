// src/app/dashboard/expenses/page.tsx
import { prisma } from "@/lib/prisma";
import ExpensesClient from "@/components/ExpensesClient";
import type { AvailableOrder } from "@/types";

export const revalidate = 0;

const shortDate = (d: Date) =>
  d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

// Tanggal event + tanggal selesai kalau beda hari, dipisah koma (pola kwitansi)
const eventDateLabel = (start: Date, end: Date | null) => {
  const s = shortDate(start);
  if (!end) return s;
  const e = new Date(end);
  const sameDay =
    e.getFullYear() === start.getFullYear() &&
    e.getMonth() === start.getMonth() &&
    e.getDate() === start.getDate();
  return sameDay ? s : `${s}, ${shortDate(e)}`;
};

export default async function ExpensesPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
      include: { pricePackage: true },
      orderBy: { startDate: "desc" },
    }),
    prisma.acrylicOrder.findMany({
      where: { eventDate: { lt: today } },
      orderBy: { eventDate: "desc" },
    }),
  ]);

  // Orderan yang sudah lewat dari hari ini — item multi-select "Tanggal Kerja" (gaji)
  const availableOrders: AvailableOrder[] = [
    ...pastBookings.map((b) => ({
      id: b.id,
      label: `${b.clientName} · ${eventDateLabel(b.startDate, b.endDate)} · WCC`,
      type: "wcc" as const,
      date: b.startDate.getTime(),
    })),
    ...pastAcrylicOrders.map((o) => ({
      id: o.id,
      label: `${o.clientName} · ${shortDate(o.eventDate)} · Acrylic`,
      type: "acrylic" as const,
      date: o.eventDate.getTime(),
    })),
  ].sort((a, b) => b.date - a.date); // terbaru → terlama

  return (
    <ExpensesClient
      initialExpenses={JSON.parse(JSON.stringify(expenses))}
      initialEmployees={JSON.parse(JSON.stringify(employees))}
      availableOrders={availableOrders}
    />
  );
}
