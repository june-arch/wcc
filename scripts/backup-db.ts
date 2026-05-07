// scripts/backup-db.ts
// Usage: npx ts-node scripts/backup-db.ts
// Exports all tables to JSON backup file

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function backup() {
  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const backupPath = path.join(backupDir, `backup-${timestamp}.json`);

  console.log("📦 Backing up WCC database...");

  const [users, sessions, accounts, bookings, payments, pricePackages, eventTypes,
    bookingEventTypes, packageEventTypes, addOns, bookingAddOns] = await Promise.all([
    prisma.user.findMany(),
    prisma.session.findMany(),
    prisma.account.findMany(),
    prisma.booking.findMany({
      include: {
        payments: true,
        pricePackage: true,
        bookingAddOns: { include: { addOn: true } },
        bookingEventTypes: { include: { eventType: true } },
      },
    }),
    prisma.payment.findMany(),
    prisma.pricePackage.findMany({ include: { packageEventTypes: { include: { eventType: true } } } }),
    prisma.eventType.findMany(),
    prisma.bookingEventType.findMany(),
    prisma.packageEventType.findMany(),
    prisma.addOn.findMany(),
    prisma.bookingAddOn.findMany(),
  ]);

  const backup = {
    timestamp,
    version: "wcc-standalone-backup",
    tables: {
      users,
      sessions,
      accounts,
      bookings,
      payments,
      pricePackages,
      eventTypes,
      bookingEventTypes,
      packageEventTypes,
      addOns,
      bookingAddOns,
    },
  };

  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), "utf-8");

  const stats = {
    users: users.length,
    bookings: bookings.length,
    payments: payments.length,
    pricePackages: pricePackages.length,
    eventTypes: eventTypes.length,
    addOns: addOns.length,
  };

  console.log(`✅ Backup saved to: backups/backup-${timestamp}.json`);
  console.log(`📊 Stats:`, stats);

  await prisma.$disconnect();
}

backup().catch((e) => {
  console.error("❌ Backup failed:", e);
  process.exit(1);
});
