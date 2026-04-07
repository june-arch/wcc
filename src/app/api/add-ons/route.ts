// src/app/api/add-ons/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - List all add-ons
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const addOns = await prisma.addOn.findMany({
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json(addOns);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new add-on
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    
    const addOn = await prisma.addOn.create({
      data: {
        name: body.name,
        price: body.price,
        description: body.description || null,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(addOn, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
