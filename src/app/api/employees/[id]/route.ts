// src/app/api/employees/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type Params = { params: Promise<{ id: string }> };

// PUT /api/employees/[id] — update karyawan
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, position, phone, salary, isActive } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Nama karyawan wajib diisi" }, { status: 400 });
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      name: name.trim(),
      position: position?.trim() || null,
      phone: phone?.trim() || null,
      salary: salary != null && salary !== "" ? Number(salary) : null,
      isActive: isActive !== false,
    },
  });

  return NextResponse.json(employee);
}

// DELETE /api/employees/[id] — hapus karyawan
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Hapus karyawan; expense terkait jadi employeeId null (onDelete: SetNull)
  await prisma.employee.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
