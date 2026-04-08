// src/app/api/price-packages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - List all price packages
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const packages = await prisma.pricePackage.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        packageEventTypes: {
          include: {
            eventType: true,
          },
        },
      },
    });

    return NextResponse.json(packages);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new price package
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { eventTypeIds, ...packageData } = body;
    
    const pkg = await prisma.pricePackage.create({
      data: {
        name: packageData.name,
        price: packageData.price,
        description: packageData.description || null,
        isActive: packageData.isActive ?? true,
        sortOrder: packageData.sortOrder ?? 0,
        // Create event type relations if provided
        ...(eventTypeIds && eventTypeIds.length > 0 && {
          packageEventTypes: {
            create: eventTypeIds.map((eventTypeId: string) => ({
              eventTypeId,
            })),
          },
        }),
      },
      include: {
        packageEventTypes: {
          include: {
            eventType: true,
          },
        },
      },
    });

    return NextResponse.json(pkg, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
