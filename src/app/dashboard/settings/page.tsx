// src/app/dashboard/settings/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import SettingsClient from "@/components/SettingsClient";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  return <SettingsClient user={session!.user} />;
}
