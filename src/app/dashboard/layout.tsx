// src/app/dashboard/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getPortalSessionFromCookies } from "@/lib/portal_session";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import PageTransition from "@/components/layout/PageTransition";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check local session first (WCC native login)
  const session = await auth.api.getSession({ headers: await headers() });

  // If no local session, check portal SSO session
  if (!session) {
    const cookieHeader = await headers().then((h) => h.get("cookie"));
    const portalUser = await getPortalSessionFromCookies(cookieHeader);

    if (portalUser) {
      // Create a virtual session-like object for portal SSO users
      // The session.user shape matches what Header/BottomNav expect
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const virtualSession = {
        user: {
          id: portalUser.id,
          name: portalUser.name,
          email: portalUser.email,
          image: null,
          emailVerified: portalUser.emailVerified,
          role: portalUser.role,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
        session: null,
      };
      return (
        <div className="flex h-screen overflow-hidden bg-stone-100">
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header user={virtualSession.user} />
            <main className="flex-1 overflow-y-auto p-4 pb-20">
              <PageTransition>{children}</PageTransition>
            </main>
            <BottomNav />
          </div>
        </div>
      );
    }
  }

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
