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

  const [allBookings, monthBookings, pendingTasks] = await Promise.all([
    prisma.booking.findMany({
      include: { tasks: true, payments: true },
      orderBy: { startDate: "asc" },
    }),
    prisma.booking.findMany({
      where: { startDate: { gte: startOfMonth, lte: endOfMonth } },
    }),
    prisma.task.findMany({
      where: { status: { not: "DONE" } },
      include: { booking: { select: { clientName: true, startDate: true } } },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 10,
    }),
  ]);

  const totalRevenue = allBookings.reduce((s, b) => s + b.paid, 0);
  const unpaidRevenue = allBookings.reduce((s, b) => s + (b.package - b.paid), 0);
  const completedCount = allBookings.filter((b) => b.status === "COMPLETED").length;
  const upcomingBookings = allBookings
    .filter((b) => new Date(b.startDate) >= now)
    .slice(0, 5);

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
      pendingTasks={pendingTasks}
    />
  );
}
