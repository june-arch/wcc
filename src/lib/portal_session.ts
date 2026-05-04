// src/lib/portal_session.ts
// Validate SSO sessions from portal_auth database
// NOTE: Uses raw Prisma queries - types defined manually since schema differs from WCC
import { portal_prisma } from "./portal_prisma";

export interface PortalUser {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  role: string;
}

export async function getPortalSession(token: string): Promise<PortalUser | null> {
  if (!token) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await (portal_prisma as any).session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            role: true,
          },
        },
      },
    });

    if (!session) return null;

    // Check expiration
    if (session.expiresAt < new Date()) {
      // Optionally delete expired session
      await (portal_prisma as any).session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      emailVerified: session.user.emailVerified,
      role: session.user.role,
    };
  } catch (error) {
    console.error("[portal_session] Failed to validate session:", error);
    return null;
  }
}

export async function getPortalSessionFromCookies(
  cookieHeader: string | null
): Promise<PortalUser | null> {
  if (!cookieHeader) return null;

  // Parse better-auth.session_token cookie
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...val] = c.trim().split("=");
      return [key, val.join("=")];
    })
  );

  const token = cookies["better-auth.session_token"];
  if (!token) return null;

  return getPortalSession(token);
}
