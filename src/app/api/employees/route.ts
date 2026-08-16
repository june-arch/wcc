// src/app/api/employees/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/employees — list semua karyawan
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const includeInactive = searchParams.get("includeInactive") === "true";

  const employees = await prisma.employee.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return NextResponse.json(employees);
}

// POST /api/employees — tambah karyawan baru
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, position, phone, salary, isActive } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Nama karyawan wajib diisi" }, { status: 400 });
  }

  const employee = await prisma.employee.create({
    data: {
      name: name.trim(),
      position: position?.trim() || null,
      phone: phone?.trim() || null,
      salary: salary != null && salary !== "" ? Number(salary) : null,
      isActive: isActive !== false,
    },
  });

  return NextResponse.json(employee, { status: 201 });
}
