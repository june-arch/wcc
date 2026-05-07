// src/app/api/acrylic/[id]/payments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// POST /api/acrylic/[id]/payments — add payment
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { amount, note } = body;

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const order = await prisma.acrylicOrder.findUnique({
    where: { id },
    include: { payments: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const payment = await prisma.acrylicPayment.create({
    data: {
      acrylicOrderId: id,
      amount: Number(amount),
      note: note || null,
    },
  });

  // Check if fully paid — auto-complete status
  const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0) + Number(amount);
  if (totalPaid >= order.totalPrice) {
    await prisma.acrylicOrder.update({
      where: { id },
      data: { status: "COMPLETED" },
    });
  } else if (totalPaid > 0) {
    await prisma.acrylicOrder.update({
      where: { id },
      data: { status: "CONFIRMED" },
    });
  }

  return NextResponse.json(payment, { status: 201 });
}
