// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const month = searchParams.get("month"); // YYYY-MM
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") where.status = status;
    if (month) {
      const [year, m] = month.split("-").map(Number);
      where.startDate = {
        gte: new Date(year, m - 1, 1),
        lt: new Date(year, m, 1),
      };
    }
    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: "insensitive" } },
        { hashtag: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        tasks: { orderBy: { createdAt: "asc" } },
        payments: { orderBy: { paidAt: "desc" } },
        createdBy: { select: { name: true, email: true } },
      },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const booking = await prisma.booking.create({
      data: {
        ...body,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        createdById: session.user.id,
      },
      include: {
        tasks: true,
        payments: true,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
