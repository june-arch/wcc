// src/app/api/expenses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/expenses — list semua pengeluaran (opsional filter ?category= & ?month=YYYY-MM)
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const month = searchParams.get("month");

  const where: Record<string, unknown> = {};
  if (category && category !== "ALL") where.category = category;
  if (month) {
    const [y, m] = month.split("-").map(Number);
    where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: { employee: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(expenses);
}

// POST /api/expenses — catat pengeluaran baru
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { date, amount, category, employeeId, note, workOrders } = body;

  if (!date || amount == null || amount === "") {
    return NextResponse.json({ error: "Tanggal dan nominal wajib diisi" }, { status: 400 });
  }

  const cat = category || "OTHER";
  if (cat === "SALARY" && !employeeId) {
    return NextResponse.json({ error: "Pilih karyawan untuk gaji" }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      date: new Date(date),
      workOrders: Array.isArray(workOrders) ? workOrders.map((w: string) => w.trim()).filter(Boolean) : [],
      amount: Number(amount),
      category: cat,
      employeeId: cat === "SALARY" ? employeeId : null,
      note: note?.trim() || null,
    },
    include: { employee: true },
  });

  return NextResponse.json(expense, { status: 201 });
}
