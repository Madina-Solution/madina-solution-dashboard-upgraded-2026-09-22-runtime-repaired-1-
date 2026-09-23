import { SignJWT, jwtVerify } from "jose";
import { verifySessionForProxy } from "@/lib/auth/proxy-session";
import { cookies } from "next/headers";

const SESSION_COOKIE = "madina_session";
function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET is required in production");
    }
    return new TextEncoder().encode("dev-only-local-secret-min-32-chars-do-not-use-in-prod");
  }
  return new TextEncoder().encode(secret);
}

// Lazy — evaluated on first use, not at import time
let _secret: Uint8Array | null = null;
function SECRET(): Uint8Array {
  if (!_secret) _secret = getSecret();
  return _secret;
}

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: string;
};

export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return token;
}


export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  return verifySessionForProxy(token);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET());
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// Server-side authorization helpers
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireRole(
  ...roles: string[]
): Promise<SessionPayload> {
  const session = await requireAuth();
  if (!roles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
