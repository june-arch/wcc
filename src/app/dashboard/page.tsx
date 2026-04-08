// src/app/dashboard/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import DashboardClient from "@/components/DashboardClient";

export const revalidate = 0;

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user.id;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [allBookings, monthBookings] = await Promise.all([
    prisma.booking.findMany({
      include: {
        payments: true,
        pricePackage: true,
        bookingAddOns: { include: { addOn: true } },
        bookingEventTypes: { include: { eventType: true } },
      },
      orderBy: { startDate: "asc" },
    }),
    prisma.booking.findMany({
      where: { startDate: { gte: startOfMonth, lte: endOfMonth } },
      include: {
        pricePackage: true,
        bookingAddOns: true,
      },
    }),
  ]);

  // Calculate totals using new schema
  const totalRevenue = allBookings.reduce((s, b) => {
    const packagePrice = b.pricePackage?.price || 0;
    const addOnsTotal = b.bookingAddOns?.reduce((sum, a) => sum + a.price, 0) || 0;
    const transport = b.transport || 0;
    const discount = b.discount || 0;
    return s + Math.max(0, packagePrice + addOnsTotal + transport - discount);
  }, 0);

  const paidRevenue = allBookings.reduce((s, b) => {
    const totalPaid = b.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    return s + totalPaid;
  }, 0);

  const unpaidRevenue = totalRevenue - paidRevenue;
  const completedCount = allBookings.filter((b) => b.status === "COMPLETED").length;
  const upcomingBookings = allBookings
    .filter((b) => new Date(b.startDate) >= now)
    .slice(0, 5)
    .map((b) => ({
      ...b,
      payments: b.payments || [],
      pricePackage: b.pricePackage,
      bookingAddOns: b.bookingAddOns || [],
      bookingEventTypes: b.bookingEventTypes || [],
    }));

  return (
    <DashboardClient
      stats={{
        totalBookings: allBookings.length,
        monthBookings: monthBookings.length,
        totalRevenue,
        unpaidRevenue,
        completedCount,
        pendingCount: allBookings.filter((b) => b.status === "PENDING").length,
      }}
      upcomingBookings={upcomingBookings}
    />
  );
}
