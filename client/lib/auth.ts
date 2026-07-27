import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SessionPayload,
  verifySession,
} from "./session";

/**
 * Session for Server Components / pages.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/**
 * Session for Route Handlers, which receive the request directly.
 */
export async function getSessionFromRequest(
  req: NextRequest
): Promise<SessionPayload | null> {
  return verifySession(req.cookies.get(SESSION_COOKIE)?.value);
}

/**
 * Guard for admin-only Route Handlers.
 *
 * Returns a ready-to-send error response when the caller is not an admin,
 * otherwise returns the session. Usage:
 *
 *   const guard = await requireAdmin(req);
 *   if (guard instanceof NextResponse) return guard;
 */
export async function requireAdmin(
  req: NextRequest
): Promise<SessionPayload | NextResponse> {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return NextResponse.json(
      { message: "You must be logged in" },
      { status: 401 }
    );
  }

  if (session.role !== "admin") {
    return NextResponse.json(
      { message: "Admin access required" },
      { status: 403 }
    );
  }

  return session;
}

/**
 * Guard for routes that only require a logged-in customer.
 */
export async function requireUser(
  req: NextRequest
): Promise<SessionPayload | NextResponse> {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return NextResponse.json(
      { message: "You must be logged in" },
      { status: 401 }
    );
  }

  return session;
}
