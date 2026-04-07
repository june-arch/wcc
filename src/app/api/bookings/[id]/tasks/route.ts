// src/app/api/bookings/[id]/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const task = await prisma.task.create({
      data: {
        bookingId: id,
        title: body.title,
        description: body.description ?? null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        status: body.status ?? "TODO",
        priority: body.priority ?? "MEDIUM",
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
