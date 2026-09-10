// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateReceiptNumber } from "@/lib/receipt";

function parseDatesInput(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const cleaned = (raw as unknown[])
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
  if (cleaned.length === 0) return null;
  // validate YYYY-MM-DD
  for (const s of cleaned) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || isNaN(new Date(`${s}T12:00:00+07:00`).getTime())) {
      return null;
    }
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
      include: bookingInclude,
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
    const { addOns, eventTypeIds, initialPayment, dates, ...bookingData } = body;

    // ── Derive startDate/endDate dari dates[] (multi-tanggal) atau fallback legacy ──
    let derivedStart: Date | null = null;
    let derivedEnd: Date | null = null;
    let derivedKeys: string[] | null = null;
    const parsedKeys = parseDatesInput(dates);
    if (parsedKeys && parsedKeys.length > 0) {
      derivedKeys = parsedKeys;
      derivedStart = toWIBDate(parsedKeys[0]);
      derivedEnd = parsedKeys.length > 1 ? toWIBDate(parsedKeys[parsedKeys.length - 1]) : null;
    } else if (bookingData.startDate) {
      derivedStart = new Date(bookingData.startDate);
      derivedEnd = bookingData.endDate ? new Date(bookingData.endDate) : null;
      // jangan buat derivedKeys bila tidak ada dates (legacy) — tapi tetap buat fallback expanded untuk bookingDates
    }

    if (!derivedStart || isNaN(derivedStart.getTime())) {
      return NextResponse.json({ error: "Tanggal wajib diisi (dates min 1 atau startDate)" }, { status: 400 });
    }
    if (parsedKeys && parsedKeys.length === 0) {
      return NextResponse.json({ error: "Pilih minimal 1 tanggal" }, { status: 400 });
    }
    // Jika dates dikirim tapi ada yang invalid, parseDatesInput return null → tolak
    if (dates !== undefined && !parsedKeys) {
      return NextResponse.json({ error: "Format dates tidak valid (YYYY-MM-DD min 1)" }, { status: 400 });
    }

    // Jika tidak ada dates, bangun bookingDates dari range start..end (agar konsisten meskipun lama kirim legacy)
    if (!derivedKeys) {
      const sKey = `${derivedStart.getFullYear()}-${String(derivedStart.getMonth() + 1).padStart(2, "0")}-${String(derivedStart.getDate()).padStart(2, "0")}`;
      // gunakan helper expand via WIB
      const eKey = derivedEnd
        ? `${derivedEnd.getFullYear()}-${String(derivedEnd.getMonth() + 1).padStart(2, "0")}-${String(derivedEnd.getDate()).padStart(2, "0")}`
        : sKey;
      if (sKey === eKey) derivedKeys = [sKey];
      else {
        const out: string[] = [];
        let cur = new Date(`${sKey}T12:00:00+07:00`);
        const endD = new Date(`${eKey}T12:00:00+07:00`);
        for (let i = 0; i < 366 && cur.getTime() <= endD.getTime(); i++) {
          const k = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
          out.push(k);
          cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
        }
        derivedKeys = out;
      }
    }

    // Convert event type names to UUIDs if provided
    let eventTypeIdMap: Map<string, string> = new Map();
    if (eventTypeIds && eventTypeIds.length > 0) {
      const eventTypes = await prisma.eventType.findMany({
        where: { name: { in: eventTypeIds } },
        select: { id: true, name: true },
      });
      eventTypeIdMap = new Map(eventTypes.map(et => [et.name, et.id]));
    }

    const booking = await prisma.booking.create({
      data: {
        clientName: bookingData.clientName,
        hashtag: bookingData.hashtag,
        location: bookingData.location,
        startDate: derivedStart,
        endDate: derivedEnd,
        status: bookingData.status,
        isConfirmed: bookingData.isConfirmed,
        notes: bookingData.notes,
        transport: bookingData.transport || 0,
        discount: bookingData.discount || 0,
        pricePackageId: bookingData.pricePackageId,
        createdById: session.user.id,
        ...(derivedKeys && derivedKeys.length > 0 && {
          bookingDates: {
            create: derivedKeys.map((k) => ({ date: toWIBDate(k) })),
          },
        }),
        // Create event types if provided
        ...(eventTypeIds && eventTypeIds.length > 0 && {
          bookingEventTypes: {
            create: eventTypeIds
              .map((name: string) => {
                const uuid = eventTypeIdMap.get(name);
                return uuid ? { eventTypeId: uuid } : null;
              })
              .filter(Boolean) as { eventTypeId: string }[],
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
              note: "DP/ Pembayaran pertama",
              receiptNumber: await generateReceiptNumber(),
            },
          },
        }),
      },
      include: bookingInclude,
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
