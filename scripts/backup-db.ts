// scripts/backup-db.ts — Full JSON backup of all WCC tables (safe, read-only)
// Usage: npx ts-node scripts/backup-db.ts
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  const tables = {
    users: () => prisma.user.findMany(),
    sessions: () => prisma.session.findMany(),
    accounts: () => prisma.account.findMany(),
    verifications: () => prisma.verification.findMany(),
    bookings: () => prisma.booking.findMany(),
    payments: () => prisma.payment.findMany(),
    eventTypes: () => prisma.eventType.findMany(),
    pricePackages: () => prisma.pricePackage.findMany(),
    bookingEventTypes: () => prisma.bookingEventType.findMany(),
    packageEventTypes: () => prisma.packageEventType.findMany(),
    addOns: () => prisma.addOn.findMany(),
    bookingAddOns: () => prisma.bookingAddOn.findMany(),
    panelTypes: () => prisma.panelType.findMany(),
    acrylicOrders: () => prisma.acrylicOrder.findMany(),
    acrylicPayments: () => prisma.acrylicPayment.findMany(),
  };

  const result: Record<string, unknown[]> = {};
  for (const [name, fn] of Object.entries(tables)) {
    result[name] = await fn();
  }

  const now = new Date();
  const ts = now.toISOString().replace(/\.\d{3}Z$/, "Z").replace(/[:]/g, "-").replace("T", "T");
  const backup = {
    timestamp: ts,
    version: "wcc-standalone-backup",
    tables: result,
  };

  const dir = path.join(process.cwd(), "backups");
  const file = path.join(dir, `backup-${ts}.json`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(backup, null, 2), "utf-8");

  console.log(`✅ Backup tersimpan: ${file}`);
  for (const [name, rows] of Object.entries(result)) {
    console.log(`   ${name}: ${rows.length} rows`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Backup gagal:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
