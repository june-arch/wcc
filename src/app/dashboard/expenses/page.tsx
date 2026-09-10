// src/app/dashboard/expenses/page.tsx
import { prisma } from "@/lib/prisma";
import ExpensesClient from "@/components/ExpensesClient";
import { startOfTodayWIB, getBookingDateKeys, formatBookingDates } from "@/lib/utils";
import type { AvailableOrder } from "@/types";

export const revalidate = 0;

const shortDate = (d: Date) =>
  d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

// Tanggal event + tanggal selesai kalau beda hari, dipisah koma (pola kwitansi)
// Untuk multi-tanggal pakai formatBookingDates (koma).
const eventDateLabelFromBooking = (b: { bookingDates?: { date: Date | string }[] | null; startDate: Date; endDate: Date | null }) => {
  if (b.bookingDates && b.bookingDates.length > 0) return formatBookingDates(b as unknown as Parameters<typeof formatBookingDates>[0]);
  const s = shortDate(b.startDate);
  if (!b.endDate) return s;
  const e = new Date(b.endDate);
  const sameDay =
    e.getFullYear() === b.startDate.getFullYear() &&
    e.getMonth() === b.startDate.getMonth() &&
    e.getDate() === b.startDate.getDate();
  return sameDay ? s : `${s}, ${shortDate(e)}`;
};

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
  const availableOrders: AvailableOrder[] = [
    ...pastBookings.map((b) => ({
      id: b.id,
      label: `${b.clientName} · ${eventDateLabelFromBooking(b)} · WCC`,
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
