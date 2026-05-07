// src/app/api/acrylic/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/acrylic/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const order = await prisma.acrylicOrder.findUnique({
    where: { id },
    include: { payments: { orderBy: { paidAt: "asc" } } },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

// PATCH /api/acrylic/[id] — full update
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.acrylicOrder.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { clientName, acrylicText, address, eventDate, eventTime, panelTypes, totalPrice, status, notes } = body;

  const updated = await prisma.acrylicOrder.update({
    where: { id },
    data: {
      ...(clientName !== undefined && { clientName }),
      ...(acrylicText !== undefined && { acrylicText }),
      ...(address !== undefined && { address }),
      ...(eventDate !== undefined && { eventDate: new Date(eventDate) }),
      ...(eventTime !== undefined && { eventTime: eventTime || null }),
      ...(panelTypes !== undefined && { panelTypes }),
      ...(totalPrice !== undefined && { totalPrice: Number(totalPrice) }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
    },
    include: { payments: { orderBy: { paidAt: "asc" } } },
  });

  return NextResponse.json(updated);
}

// DELETE /api/acrylic/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.acrylicOrder.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.acrylicOrder.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
