// src/app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

function parseDatesInput(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const cleaned = (raw as unknown[]).map((v) => (typeof v === "string" ? v.trim() : "")).filter(Boolean);
  if (cleaned.length === 0) return null;
  for (const s of cleaned) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || isNaN(new Date(`${s}T12:00:00+07:00`).getTime())) return null;
  }
  return [...new Set(cleaned)].sort();
}
function toWIBDate(key: string): Date {
  return new Date(`${key}T12:00:00+07:00`);
}
const bookingInclude = {
  payments: { orderBy: { paidAt: "desc" as const } },
  bookingAddOns: { include: { addOn: true } },
  bookingEventTypes: { include: { eventType: true } },
  bookingDates: { orderBy: { date: "asc" as const } },
  pricePackage: true,
  createdBy: { select: { name: true, email: true } },
} as const;

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
      include: bookingInclude,
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
    const { addOns, eventTypeIds, dates, ...bookingData } = body;

    const updateData: Record<string, unknown> = {};

    // Only include valid fields
    if (bookingData.clientName) updateData.clientName = bookingData.clientName;
    if (bookingData.hashtag !== undefined) updateData.hashtag = bookingData.hashtag;
    if (bookingData.location !== undefined) updateData.location = bookingData.location;
    // dates (multi) punya prioritas — derive start/end; fallback legacy
    let derivedKeys: string[] | null = null;
    if (dates !== undefined) {
      const parsed = parseDatesInput(dates);
      if (!parsed) {
        return NextResponse.json({ error: "Format dates tidak valid (YYYY-MM-DD min 1)" }, { status: 400 });
      }
      if (parsed.length === 0) {
        return NextResponse.json({ error: "Pilih minimal 1 tanggal" }, { status: 400 });
      }
      derivedKeys = parsed;
      updateData.startDate = toWIBDate(parsed[0]);
      updateData.endDate = parsed.length > 1 ? toWIBDate(parsed[parsed.length - 1]) : null;
    } else {
      if (bookingData.startDate) updateData.startDate = new Date(bookingData.startDate);
      if (bookingData.endDate !== undefined) updateData.endDate = bookingData.endDate ? new Date(bookingData.endDate) : null;
      // Jika patch legacy membawa start/end tanpa dates, sync bookingDates dari range itu agar konsisten
      if (bookingData.startDate || bookingData.endDate !== undefined) {
        const cur = await prisma.booking.findUnique({ where: { id }, select: { startDate: true, endDate: true } });
        const s = updateData.startDate ? (updateData.startDate as Date) : cur?.startDate ? new Date(cur.startDate as Date) : null;
        const eRaw = updateData.endDate !== undefined ? (updateData.endDate as Date | null) : cur?.endDate ? new Date(cur.endDate as Date) : null;
        if (s) {
          const sK = `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, "0")}-${String(s.getDate()).padStart(2, "0")}`;
          const eK = eRaw ? `${eRaw.getFullYear()}-${String(eRaw.getMonth() + 1).padStart(2, "0")}-${String(eRaw.getDate()).padStart(2, "0")}` : sK;
          if (sK === eK) derivedKeys = [sK];
          else {
            const out: string[] = [];
            let curD = new Date(`${sK}T12:00:00+07:00`);
            const endD = new Date(`${eK}T12:00:00+07:00`);
            for (let i = 0; i < 366 && curD.getTime() <= endD.getTime(); i++) {
              out.push(`${curD.getFullYear()}-${String(curD.getMonth() + 1).padStart(2, "0")}-${String(curD.getDate()).padStart(2, "0")}`);
              curD = new Date(curD.getTime() + 24 * 60 * 60 * 1000);
            }
            derivedKeys = out;
          }
        }
      }
    }
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

    // Sync bookingDates bila ada derivedKeys (dari dates atau legacy start/end)
    if (derivedKeys) {
      await prisma.bookingDate.deleteMany({ where: { bookingId: id } });
      if (derivedKeys.length > 0) {
        await prisma.bookingDate.createMany({
          data: derivedKeys.map((k) => ({ bookingId: id, date: toWIBDate(k) })),
          skipDuplicates: true,
        });
      }
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: bookingInclude,
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
