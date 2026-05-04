// src/lib/portal_prisma.ts
// Prisma client for portal_auth database (SSO session validation)
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  portal_prisma: PrismaClient | undefined;
};

export const portal_prisma =
  globalForPrisma.portal_prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.PORTAL_AUTH_DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.portal_prisma = portal_prisma;
