// src/app/api/expenses/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type Params = { params: Promise<{ id: string }> };

// PUT /api/expenses/[id] — update pengeluaran
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { date, amount, category, employeeId, note } = body;

  if (!date || amount == null || amount === "") {
    return NextResponse.json({ error: "Tanggal dan nominal wajib diisi" }, { status: 400 });
  }

  const cat = category || "OTHER";
  if (cat === "SALARY" && !employeeId) {
    return NextResponse.json({ error: "Pilih karyawan untuk gaji" }, { status: 400 });
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      date: new Date(date),
      amount: Number(amount),
      category: cat,
      employeeId: cat === "SALARY" ? employeeId : null,
      note: note?.trim() || null,
    },
    include: { employee: true },
  });

  return NextResponse.json(expense);
}

// DELETE /api/expenses/[id] — hapus pengeluaran
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.expense.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
