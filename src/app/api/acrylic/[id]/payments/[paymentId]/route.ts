// src/app/api/acrylic/[id]/payments/[paymentId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// DELETE /api/acrylic/[id]/payments/[paymentId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, paymentId } = await params;

  const payment = await prisma.acrylicPayment.findFirst({
    where: { id: paymentId, acrylicOrderId: id },
  });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  await prisma.acrylicPayment.delete({ where: { id: paymentId } });

  // Recalculate status based on remaining payments
  const order = await prisma.acrylicOrder.findUnique({
    where: { id },
    include: { payments: true },
  });

  if (order) {
    const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
    let newStatus: "PENDING" | "CONFIRMED" | "COMPLETED" = "PENDING";
    if (totalPaid >= order.totalPrice) newStatus = "COMPLETED";
    else if (totalPaid > 0) newStatus = "CONFIRMED";

    await prisma.acrylicOrder.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  return NextResponse.json({ success: true });
}
