// src/app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
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
    });

    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(booking);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { addOns, eventTypeIds, ...bookingData } = body;

    const updateData: Record<string, unknown> = {};
    
    // Only include valid fields
    if (bookingData.clientName) updateData.clientName = bookingData.clientName;
    if (bookingData.hashtag !== undefined) updateData.hashtag = bookingData.hashtag;
    if (bookingData.location !== undefined) updateData.location = bookingData.location;
    if (bookingData.startDate) updateData.startDate = new Date(bookingData.startDate);
    if (bookingData.endDate !== undefined) updateData.endDate = bookingData.endDate ? new Date(bookingData.endDate) : null;
    if (bookingData.status) updateData.status = bookingData.status;
    if (bookingData.isConfirmed !== undefined) updateData.isConfirmed = bookingData.isConfirmed;
    if (bookingData.notes !== undefined) updateData.notes = bookingData.notes;
    if (bookingData.transport !== undefined) updateData.transport = bookingData.transport;
    if (bookingData.discount !== undefined) updateData.discount = bookingData.discount;
    if (bookingData.pricePackageId !== undefined) updateData.pricePackageId = bookingData.pricePackageId;

    // Handle event types update if provided
    if (eventTypeIds !== undefined) {
      // Delete existing event types
      await prisma.bookingEventType.deleteMany({
        where: { bookingId: id },
      });
      
      // Create new event types
      if (eventTypeIds.length > 0) {
        // Find event type UUIDs by name (frontend sends enum names like "PENGAJIAN")
        const eventTypes = await prisma.eventType.findMany({
          where: { name: { in: eventTypeIds } },
          select: { id: true, name: true },
        });
        
        const validEventTypeMap = new Map(eventTypes.map(et => [et.name, et.id]));
        
        // Create relations with valid UUIDs
        const validRelations = eventTypeIds
          .map((name: string) => {
            const uuid = validEventTypeMap.get(name);
            return uuid ? { bookingId: id, eventTypeId: uuid } : null;
          })
          .filter(Boolean) as { bookingId: string; eventTypeId: string }[];
        
        if (validRelations.length > 0) {
          await prisma.bookingEventType.createMany({
            data: validRelations,
          });
        }
      }
    }

    // Handle add-ons update if provided
    if (addOns !== undefined) {
      // Delete existing add-ons
      await prisma.bookingAddOn.deleteMany({
        where: { bookingId: id },
      });
      
      // Create new add-ons
      if (addOns.length > 0) {
        await prisma.bookingAddOn.createMany({
          data: addOns.map((a: { addOnId: string; price: number }) => ({
            bookingId: id,
            addOnId: a.addOnId,
            price: a.price,
          })),
        });
      }
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(booking);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.booking.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
