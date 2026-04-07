// src/app/dashboard/bookings/page.tsx
import { prisma } from "@/lib/prisma";
import BookingsClient from "@/components/BookingsClient";

export const revalidate = 0;

export default async function BookingsPage() {
  const bookings = await prisma.booking.findMany({
    include: {
      tasks: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { paidAt: "desc" } },
      createdBy: { select: { name: true, email: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return <BookingsClient initialBookings={JSON.parse(JSON.stringify(bookings))} />;
}
