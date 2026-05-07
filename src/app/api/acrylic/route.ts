// src/app/api/acrylic/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/acrylic — list all acrylic orders
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where = status ? { status: status as "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" } : {};

  const orders = await prisma.acrylicOrder.findMany({
    where,
    include: { payments: { orderBy: { paidAt: "asc" } } },
    orderBy: { eventDate: "asc" },
  });

  return NextResponse.json(orders);
}

// POST /api/acrylic — create new acrylic order
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { clientName, acrylicText, address, eventDate, eventTime, panelTypes, totalPrice, notes } = body;

  if (!clientName || !acrylicText || !address || !eventDate || !totalPrice) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const order = await prisma.acrylicOrder.create({
    data: {
      clientName,
      acrylicText,
      address,
      eventDate: new Date(eventDate),
      eventTime: eventTime || null,
      panelTypes: panelTypes || [],
      totalPrice: Number(totalPrice),
      notes: notes || null,
      createdById: session.user.id,
    },
    include: { payments: true },
  });

  return NextResponse.json(order, { status: 201 });
}
