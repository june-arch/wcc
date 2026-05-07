// src/app/dashboard/acrylic/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import AcrylicOrdersClient from "@/components/AcrylicOrdersClient";

export const revalidate = 0;

export default async function AcrylicPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const orders = await prisma.acrylicOrder.findMany({
    include: { payments: { orderBy: { paidAt: "asc" } } },
    orderBy: { eventDate: "asc" },
  });

  return <AcrylicOrdersClient initialOrders={orders} />;
}
