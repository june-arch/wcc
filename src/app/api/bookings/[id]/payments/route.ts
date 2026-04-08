// src/app/api/bookings/[id]/payments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId: id,
        amount: body.amount,
        note: body.note ?? null,
        paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
      },
    });

    // Fetch booking with relations to calculate totals
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        pricePackage: true,
        bookingAddOns: true,
        payments: true,
      },
    });

    if (booking) {
      // Calculate totals
      const packagePrice = booking.pricePackage?.price || 0;
      const addOnsTotal = booking.bookingAddOns?.reduce((sum, a) => sum + a.price, 0) || 0;
      const transport = booking.transport || 0;
      const discount = booking.discount || 0;
      const totalPrice = Math.max(0, packagePrice + addOnsTotal + transport - discount);
      
      const totalPaid = booking.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      
      // Update status if fully paid
      await prisma.booking.update({
        where: { id },
        data: {
          status: totalPaid >= totalPrice ? "COMPLETED" : booking.status,
        },
      });
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
