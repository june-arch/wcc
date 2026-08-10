// scripts/backfill-receipt-numbers.ts — assign receiptNumber ke payment lama yang null
// Usage: npx ts-node scripts/backfill-receipt-numbers.ts
// Format: KW-YYMM-NNN (berdasarkan bulan paidAt, bukan bulan sekarang)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const nulls = await prisma.payment.findMany({
    where: { receiptNumber: null },
    orderBy: { paidAt: "asc" },
    select: { id: true, paidAt: true, amount: true },
  });

  if (nulls.length === 0) {
    console.log("Tidak ada payment tanpa nomor kwitansi ✅");
    return;
  }

  console.log(`Ditemukan ${nulls.length} payment tanpa nomor. Proses backfill...`);

  // Kelompokkan per bulan untuk nomor berurutan per bulan
  const perMonth = new Map<string, typeof nulls>();
  for (const p of nulls) {
    const d = new Date(p.paidAt);
    const key = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!perMonth.has(key)) perMonth.set(key, []);
    perMonth.get(key)!.push(p);
  }

  let updated = 0;
  for (const [yymm, rows] of perMonth) {
    const prefix = `KW-${yymm}-`;
    // cek nomor terakhir yang sudah ada di bulan ini (dari payment ber-nomor)
    const existing = await prisma.payment.findMany({
      where: { receiptNumber: { startsWith: prefix } },
      select: { receiptNumber: true },
    });
    let next = existing.length;
    for (const p of rows) {
      next += 1;
      const num = `${prefix}${String(next).padStart(3, "0")}`;
      await prisma.payment.update({ where: { id: p.id }, data: { receiptNumber: num } });
      updated++;
      console.log(`  ${p.id.slice(0, 8)}... -> ${num} (Rp ${p.amount.toLocaleString("id-ID")})`);
    }
  }

  console.log(`\nSelesai: ${updated} payment di-backfill ✅`);
}

main()
  .catch((e) => {
    console.error("❌ Gagal:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
