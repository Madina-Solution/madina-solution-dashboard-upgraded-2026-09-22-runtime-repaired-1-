import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth/session";
import { verifyFirebaseIdToken } from "@/lib/auth/firebase-server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await checkRateLimit(`firebase-login:${ip}`, RATE_LIMITS.auth);
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Terlalu banyak percobaan. Silakan coba lagi nanti." } }, { status: 429 });
    }

    const body = await request.json();
    const idToken = typeof body?.idToken === "string" ? body.idToken : "";
    const provider = body?.provider === "google" || body?.provider === "facebook" ? body.provider : null;
    if (!idToken || !provider) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Token dan provider wajib diisi" } }, { status: 400 });
    }

    const identity = await verifyFirebaseIdToken(idToken);

    const byUid = await db.select().from(users).where(eq(users.firebaseUid, identity.uid)).limit(1);
    let user = byUid[0];

    if (!user) {
      const byEmail = await db.select().from(users).where(eq(users.email, identity.email)).limit(1);
      const existing = byEmail[0];
      if (existing) {
        if (existing.firebaseUid && existing.firebaseUid !== identity.uid) {
          return NextResponse.json({ success: false, error: { code: "ACCOUNT_LINK_REQUIRED", message: "Email ini sudah terhubung ke akun sosial lain. Masuk dengan metode sebelumnya untuk menghubungkan akun." } }, { status: 409 });
        }

        const [updated] = await db.update(users).set({
          firebaseUid: identity.uid,
          name: identity.name || existing.name,
          avatar: identity.picture || existing.avatar,
          updatedAt: new Date(),
        }).where(and(eq(users.id, existing.id), eq(users.email, identity.email))).returning();
        user = updated;
      } else {
        const [created] = await db.insert(users).values({
          firebaseUid: identity.uid,
          email: identity.email,
          name: identity.name,
          avatar: identity.picture,
          passwordHash: null,
          role: "customer",
          isActive: true,
        }).returning();
        user = created;
      }
    }

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: { code: "ACCOUNT_DISABLED", message: "Akun tidak dapat digunakan" } }, { status: 403 });
    }

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar, phone: user.phone },
    });
  } catch (error) {
    console.error("Firebase auth error:", error);
    return NextResponse.json({ success: false, error: { code: "INVALID_FIREBASE_TOKEN", message: "Login sosial tidak dapat diverifikasi. Silakan coba lagi." } }, { status: 401 });
  }
}
