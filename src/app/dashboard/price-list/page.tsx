// src/app/dashboard/price-list/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import PriceListClient from "@/components/PriceListClient";

export const revalidate = 0;

export default async function PriceListPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [pricePackages, addOns, eventTypes] = await Promise.all([
    prisma.pricePackage.findMany({
      include: {
        packageEventTypes: { include: { eventType: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.addOn.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.eventType.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <PriceListClient
      initialPackages={JSON.parse(JSON.stringify(pricePackages))}
      initialAddOns={JSON.parse(JSON.stringify(addOns))}
      initialEventTypes={JSON.parse(JSON.stringify(eventTypes))}
    />
  );
}
