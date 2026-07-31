import { SignJWT, jwtVerify } from "jose";
import "./load-env";

export const SESSION_COOKIE = "novacart-session";

// 7 days, in seconds
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type SessionPayload = {
  userId: string;
  name: string;
  email: string;
  role: "customer" | "admin";
};

// Read lazily so a missing secret fails at request time with a clear message
// rather than crashing the build.
function getKey() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("Please define the JWT_SECRET environment variable");
  }

  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getKey());
}

export async function verifySession(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: ["HS256"],
    });

    return {
      userId: String(payload.userId),
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role === "admin" ? "admin" : "customer",
    };
  } catch {
    // Expired, tampered with, or signed by a different secret.
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
