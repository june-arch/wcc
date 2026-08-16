// src/app/dashboard/finance/page.tsx
import { prisma } from "@/lib/prisma";
import FinanceClient from "@/components/FinanceClient";

export const revalidate = 0;

export default async function FinancePage() {
  const [bookings, expenses] = await Promise.all([
    prisma.booking.findMany({
      include: {
        payments: { orderBy: { paidAt: "desc" } },
        pricePackage: true,
        bookingAddOns: { include: { addOn: true } },
        bookingEventTypes: { include: { eventType: true } },
      },
      orderBy: { startDate: "asc" },
    }),
    prisma.expense.findMany({
      include: { employee: true },
      orderBy: { date: "desc" },
    }),
  ]);

  return (
    <FinanceClient
      bookings={JSON.parse(JSON.stringify(bookings))}
      expenses={JSON.parse(JSON.stringify(expenses))}
    />
  );
}
