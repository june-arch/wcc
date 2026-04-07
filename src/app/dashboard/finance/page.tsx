// src/app/dashboard/finance/page.tsx
import { prisma } from "@/lib/prisma";
import FinanceClient from "@/components/FinanceClient";

export const revalidate = 0;

export default async function FinancePage() {
  const bookings = await prisma.booking.findMany({
    include: { payments: { orderBy: { paidAt: "desc" } } },
    orderBy: { startDate: "asc" },
  });

  return <FinanceClient bookings={JSON.parse(JSON.stringify(bookings))} />;
}
