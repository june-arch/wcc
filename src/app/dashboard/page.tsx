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

  const [allBookings, monthBookings, allAcrylicOrders, monthAcrylicOrders] = await Promise.all([
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
    prisma.acrylicOrder.findMany({
      include: { payments: true },
      orderBy: { eventDate: "asc" },
    }),
    prisma.acrylicOrder.findMany({
      where: { eventDate: { gte: startOfMonth, lte: endOfMonth } },
    }),
  ]);

  // WCC total
  const wccTotalRevenue = allBookings.reduce((s, b) => {
    const packagePrice = b.pricePackage?.price || 0;
    const addOnsTotal = b.bookingAddOns?.reduce((sum, a) => sum + a.price, 0) || 0;
    const transport = b.transport || 0;
    const discount = b.discount || 0;
    return s + Math.max(0, packagePrice + addOnsTotal + transport - discount);
  }, 0);
  const wccPaidRevenue = allBookings.reduce((s, b) => {
    const totalPaid = b.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    return s + totalPaid;
  }, 0);

  // Acrylic total
  const acrylicTotalRevenue = allAcrylicOrders.reduce((s, o) => s + o.totalPrice, 0);
  const acrylicPaidRevenue = allAcrylicOrders.reduce((s, o) => {
    const totalPaid = o.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    return s + totalPaid;
  }, 0);

  // Combined
  const totalRevenue = wccTotalRevenue + acrylicTotalRevenue;
  const paidRevenue = wccPaidRevenue + acrylicPaidRevenue;
  const unpaidRevenue = totalRevenue - paidRevenue;
  const completedCount = allBookings.filter((b) => b.status === "COMPLETED").length +
    allAcrylicOrders.filter((o) => o.status === "COMPLETED").length;

  // Upcoming — combine both, sort by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingBookings = [...allBookings, ...allAcrylicOrders.map(o => ({
    ...o,
    _type: "acrylic" as const,
    payments: o.payments || [],
  }))]
    .filter((b: any) => {
      const d = new Date(b._type === "acrylic" ? b.eventDate : b.startDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() >= today.getTime();
    })
    .sort((a: any, b: any) => new Date(a._type === "acrylic" ? a.eventDate : a.startDate).getTime() -
                        new Date(b._type === "acrylic" ? b.eventDate : b.startDate).getTime())
    .slice(0, 6)
    .map((b: any) => ({
      ...b,
      pricePackage: b.pricePackage ?? null,
      bookingAddOns: b.bookingAddOns ?? [],
      bookingEventTypes: b.bookingEventTypes ?? [],
      panelTypes: b.panelTypes ?? [],
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
        // Acrylic
        totalAcrylicOrders: allAcrylicOrders.length,
        monthAcrylicOrders: monthAcrylicOrders.length,
        acrylicTotalRevenue,
        acrylicPaidRevenue,
        acrylicUnpaidRevenue: acrylicTotalRevenue - acrylicPaidRevenue,
      }}
      upcomingBookings={upcomingBookings}
      allBookings={allBookings}
      allAcrylicOrders={allAcrylicOrders}
    />
  );
}
