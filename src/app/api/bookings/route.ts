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
        payments: { orderBy: { paidAt: "desc" } },
        bookingAddOns: {
          include: {
            addOn: true,
          },
        },
        bookingEventTypes: {
          include: {
            eventType: true,
          },
        },
        pricePackage: true,
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
    const { addOns, eventTypeIds, initialPayment, ...bookingData } = body;
    
    const booking = await prisma.booking.create({
      data: {
        clientName: bookingData.clientName,
        hashtag: bookingData.hashtag,
        location: bookingData.location,
        startDate: new Date(bookingData.startDate),
        endDate: bookingData.endDate ? new Date(bookingData.endDate) : null,
        status: bookingData.status,
        isConfirmed: bookingData.isConfirmed,
        notes: bookingData.notes,
        transport: bookingData.transport || 0,
        discount: bookingData.discount || 0,
        pricePackageId: bookingData.pricePackageId,
        createdById: session.user.id,
        // Create event types if provided
        ...(eventTypeIds && eventTypeIds.length > 0 && {
          bookingEventTypes: {
            create: eventTypeIds.map((eventTypeId: string) => ({
              eventTypeId,
            })),
          },
        }),
        // Create add-ons if provided
        ...(addOns && addOns.length > 0 && {
          bookingAddOns: {
            create: addOns.map((a: { addOnId: string; price: number }) => ({
              addOnId: a.addOnId,
              price: a.price,
            })),
          },
        }),
        // Create initial payment if provided
        ...(initialPayment && initialPayment > 0 && {
          payments: {
            create: {
              amount: initialPayment,
              paidAt: new Date(),
              notes: "DP/ Pembayaran pertama",
            },
          },
        }),
      },
      include: {
        payments: true,
        bookingAddOns: {
          include: {
            addOn: true,
          },
        },
        bookingEventTypes: {
          include: {
            eventType: true,
          },
        },
        pricePackage: true,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
