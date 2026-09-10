// scripts/backfill-booking-dates.ts — expand startDate..endDate (inklusif, per hari WIB) jadi BookingDate rows
// Idempotent: skip row yang sudah ada (@@unique [bookingId, date]).
// PENTING: JANGAN dijalankan otomatis terhadap PROD tanpa konfirmasi.
// Cara pakai:
//   npx ts-node scripts/backfill-booking-dates.ts          # default dry-run? tidak, langsung tulis tapi aman idempotent
//   DATABASE_URL="..." npx ts-node scripts/backfill-booking-dates.ts   # pakai DB tertentu
//   DRY_RUN=1 npx ts-node scripts/backfill-booking-dates.ts            # hanya log, tidak tulis
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function expandKeys(start: Date, end: Date | null): string[] {
  const sKey = toDateKey(start);
  const eKey = end ? toDateKey(end) : sKey;
  if (sKey === eKey) return [sKey];
  const out: string[] = [];
  let cur = new Date(`${sKey}T12:00:00+07:00`);
  const endD = new Date(`${eKey}T12:00:00+07:00`);
  for (let i = 0; i < 366 && cur.getTime() <= endD.getTime(); i++) {
    out.push(toDateKey(cur));
    cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
  }
  return out;
}

async function main() {
  const dryRun = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
  if (dryRun) console.log("🔍 DRY RUN — tidak menulis ke DB\n");

  const bookings = await prisma.booking.findMany({
    select: {
      id: true,
      clientName: true,
      startDate: true,
      endDate: true,
      bookingDates: { select: { date: true } },
    },
    orderBy: { startDate: "asc" },
  });

  console.log(`Ditemukan ${bookings.length} booking. Memeriksa BookingDate...\n`);

  let createdTotal = 0;
  let skippedTotal = 0;

  for (const b of bookings) {
    const keys = expandKeys(new Date(b.startDate), b.endDate ? new Date(b.endDate) : null);
    const existing = new Set(
      b.bookingDates.map((bd) => toDateKey(new Date(bd.date)))
    );
    const missing = keys.filter((k) => !existing.has(k));

    if (missing.length === 0) {
      skippedTotal += keys.length;
      continue;
    }

    console.log(
      `${b.clientName} (${b.id.slice(0, 8)}): ${keys.length} hari [${keys.join(", ")}] → ${missing.length} baru, ${existing.size} sudah ada`
    );

    if (!dryRun) {
      // createMany skipDuplicates tidak fully support di PG dengan @unique([bookingId,date])? pakai createMany lalu catch.
      // idempotent: coba createMany, Prisma 5 akan skipDuplicates bila flag true.
      await prisma.bookingDate.createMany({
        data: missing.map((k) => ({
          bookingId: b.id,
          date: new Date(`${k}T12:00:00+07:00`),
        })),
        skipDuplicates: true,
      });
    }
    createdTotal += missing.length;
  }

  console.log(`\n— Selesai —`);
  console.log(`  Dibuat : ${createdTotal}`);
  console.log(`  Sudah ada (skip): ${skippedTotal}`);
  if (dryRun) console.log(`  (dry-run, tidak ada yang tertulis)`);
  else console.log(`  Idempotent — jalankan ulang aman.`);
}

main()
  .catch((e) => {
    console.error("❌ Gagal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
