// src/app/dashboard/bookings/page.tsx
import { prisma } from "@/lib/prisma";
import BookingsClient from "@/components/BookingsClient";

export const revalidate = 0;

export default async function BookingsPage() {
  const bookings = await prisma.booking.findMany({
    include: {
      payments: { orderBy: { paidAt: "desc" } },
      pricePackage: true,
      bookingAddOns: { include: { addOn: true } },
      bookingEventTypes: { include: { eventType: true } },
      createdBy: { select: { name: true, email: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return <BookingsClient initialBookings={JSON.parse(JSON.stringify(bookings))} />;
}
