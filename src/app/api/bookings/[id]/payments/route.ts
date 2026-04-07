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

    // Update paid total on booking
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (booking) {
      const newPaid = booking.paid + body.amount;
      await prisma.booking.update({
        where: { id },
        data: {
          paid: newPaid,
          status: newPaid >= booking.package ? "COMPLETED" : booking.status,
        },
      });
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
