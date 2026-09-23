import { jwtVerify } from "jose";

export type ProxySession = {
  userId: string;
  email: string;
  name: string;
  role: string;
};

function getSecret(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function verifySessionForProxy(token: string): Promise<ProxySession | null> {
  const secret = getSecret();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string" || typeof payload.role !== "string") return null;
    return {
      userId: payload.userId,
      email: typeof payload.email === "string" ? payload.email : "",
      name: typeof payload.name === "string" ? payload.name : "",
      role: payload.role,
    };
  } catch {
    return null;
  }
}
