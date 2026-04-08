// src/app/api/bookings/[id]/payments/[paymentId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// PATCH - Update a payment
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, paymentId } = await params;
    const body = await req.json();

    // Update payment
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        amount: body.amount,
        note: body.note ?? null,
      },
    });

    // Fetch booking with relations to recalculate totals and update status
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
      
      // Update status based on payment
      const newStatus = totalPaid >= totalPrice ? "COMPLETED" : 
                       (totalPaid > 0 ? "CONFIRMED" : booking.status);
      
      if (newStatus !== booking.status) {
        await prisma.booking.update({
          where: { id },
          data: { status: newStatus },
        });
      }
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete a payment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, paymentId } = await params;

    // Delete payment
    await prisma.payment.delete({
      where: { id: paymentId },
    });

    // Fetch booking with relations to recalculate totals and update status
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
      
      // Update status based on remaining payment
      const newStatus = totalPaid >= totalPrice ? "COMPLETED" : 
                       (totalPaid > 0 ? "CONFIRMED" : "PENDING");
      
      if (newStatus !== booking.status) {
        await prisma.booking.update({
          where: { id },
          data: { status: newStatus },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
