// src/app/api/expenses/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateSalaryReceiptNumber } from "@/lib/receipt";

type Params = { params: Promise<{ id: string }> };

// PUT /api/expenses/[id] — update pengeluaran
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { date, amount, category, employeeId, note, workOrders } = body;

  if (!date || amount == null || amount === "") {
    return NextResponse.json({ error: "Tanggal dan nominal wajib diisi" }, { status: 400 });
  }

  const cat = category || "OTHER";
  if (cat === "SALARY" && !employeeId) {
    return NextResponse.json({ error: "Pilih karyawan untuk gaji" }, { status: 400 });
  }

  // Preserve receiptNumber yang sudah ada — jangan hapus/timpa
  const existing = await prisma.expense.findUnique({ where: { id }, select: { receiptNumber: true, category: true } });

  let receiptNumberUpdate: string | undefined = undefined;
  if (existing?.receiptNumber) {
    // sudah bernomor → biarkan, jangan ubah
    receiptNumberUpdate = undefined;
  } else if (cat === "SALARY" && employeeId) {
    // belum bernomor tapi sekarang jadi SALARY → generate baru
    receiptNumberUpdate = await generateSalaryReceiptNumber();
  } else {
    // non-SALARY atau SALARY tanpa employee → tetap null (jangan set)
    receiptNumberUpdate = undefined;
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      date: new Date(date),
      workOrders: Array.isArray(workOrders) ? workOrders.map((w: string) => w.trim()).filter(Boolean) : [],
      amount: Number(amount),
      category: cat,
      employeeId: cat === "SALARY" ? employeeId : null,
      note: note?.trim() || null,
      ...(receiptNumberUpdate ? { receiptNumber: receiptNumberUpdate } : {}),
    },
    include: { employee: true },
  });

  return NextResponse.json(expense);
}

// PATCH /api/expenses/[id] — alias PUT (preserve receiptNumber)
export async function PATCH(req: NextRequest, { params }: Params) {
  return PUT(req, { params });
}

// DELETE /api/expenses/[id] — hapus pengeluaran
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.expense.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
