// src/app/dashboard/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import PageTransition from "@/components/layout/PageTransition";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-stone-100">
      {/* Sidebar removed - mobile only */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-y-auto p-4 pb-20">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
