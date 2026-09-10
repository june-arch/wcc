// scripts/backfill-salary-receipt-numbers.ts — assign receiptNumber KG-YYMM-NNN ke Expense SALARY lama yang null
// Usage:
//   DRY_RUN (default, cek tanpa tulis):  npx ts-node scripts/backfill-salary-receipt-numbers.ts
//   Atau eksplisit:                       DRY_RUN=true npx ts-node scripts/backfill-salary-receipt-numbers.ts
//   Eksekusi tulis:                       DRY_RUN=false npx ts-node scripts/backfill-salary-receipt-numbers.ts
//   Atau via tsx:                         npx tsx scripts/backfill-salary-receipt-numbers.ts
//
// Format: KG-YYMM-NNN (berdasarkan bulan expense.date, urut date asc, increment per bulan)
// Idempotent: skip yang sudah bernomor, seri terpisah dari KW booking
// ⚠️ JANGAN dijalankan ke PROD tanpa review — cek DRY_RUN dulu

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DRY_RUN = process.env.DRY_RUN !== "false"; // default true (dry run)

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY_RUN (tidak menulis DB)" : "WRITE (akan update DB)"}\n`);

  const nulls = await prisma.expense.findMany({
    where: { category: "SALARY", receiptNumber: null },
    orderBy: [{ date: "asc" }, { id: "asc" }],
    select: { id: true, date: true, amount: true, employeeId: true, employee: { select: { name: true } } },
  });

  if (nulls.length === 0) {
    console.log("Tidak ada Expense SALARY tanpa nomor kwitansi ✅");
    return;
  }

  console.log(`Ditemukan ${nulls.length} Expense SALARY tanpa nomor. Proses backfill...`);

  // Kelompokkan per bulan YYMM dari expense.date
  const perMonth = new Map<string, typeof nulls>();
  for (const e of nulls) {
    const d = new Date(e.date);
    const yymm = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!perMonth.has(yymm)) perMonth.set(yymm, []);
    perMonth.get(yymm)!.push(e);
  }

  let updated = 0;
  let wouldUpdate = 0;

  // Urutkan perMonth by key (YYMM asc) agar nomor deterministik
  const sortedMonths = [...perMonth.entries()].sort(([a], [b]) => a.localeCompare(b));

  for (const [yymm, rows] of sortedMonths) {
    const prefix = `KG-${yymm}-`;
    // cek nomor terakhir yang sudah ada di bulan ini (yang sudah bernomor)
    const existing = await prisma.expense.findMany({
      where: { receiptNumber: { startsWith: prefix } },
      select: { receiptNumber: true },
    });
    // hitung next dari max suffix, bukan count (hindari gap duplikasi bila ada hole)
    let maxN = 0;
    for (const ex of existing) {
      const n = parseInt(ex.receiptNumber!.slice(-3), 10);
      if (!isNaN(n) && n > maxN) maxN = n;
    }
    let next = maxN;
    for (const e of rows) {
      next += 1;
      const num = `${prefix}${String(next).padStart(3, "0")}`;
      const dStr = new Date(e.date).toISOString().slice(0, 10);
      const emp = e.employee?.name || e.employeeId || "-";
      if (DRY_RUN) {
        console.log(`  [DRY] ${e.id.slice(0, 8)}... | ${dStr} | ${emp} | Rp ${e.amount.toLocaleString("id-ID")} -> ${num}`);
        wouldUpdate++;
      } else {
        await prisma.expense.update({ where: { id: e.id }, data: { receiptNumber: num } });
        updated++;
        console.log(`  ${e.id.slice(0, 8)}... -> ${num} | ${dStr} | ${emp} | Rp ${e.amount.toLocaleString("id-ID")}`);
      }
    }
  }

  if (DRY_RUN) {
    console.log(`\n[DRY_RUN] ${wouldUpdate} Expense akan di-backfill. Jalankan DRY_RUN=false untuk eksekusi.`);
  } else {
    console.log(`\nSelesai: ${updated} Expense SALARY di-backfill ✅`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Gagal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
