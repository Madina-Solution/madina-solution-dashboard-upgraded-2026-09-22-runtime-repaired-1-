import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens, auditLogs } from "@/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import crypto from "crypto";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getEmailProvider } from "@/lib/notifications/email-provider";

export const dynamic = "force-dynamic";

const requestSchema = z.object({ email: z.string().trim().email().max(255) });

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await checkRateLimit(`forgot:${ip}`, { windowMs: 15 * 60 * 1000, maxRequests: 5 });
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Terlalu banyak percobaan. Coba lagi nanti." } }, { status: 429 });
    }

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Email tidak valid" } }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const generic = { success: true, message: "Jika email terdaftar, instruksi reset password akan dikirim." };
    const [user] = await db.select({ id: users.id, email: users.email, name: users.name, isActive: users.isActive })
      .from(users).where(eq(users.email, email)).limit(1);

    if (!user || !user.isActive) return NextResponse.json(generic);

    await db.update(passwordResetTokens).set({ usedAt: new Date() })
      .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, new Date())));

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await db.insert(passwordResetTokens).values({ userId: user.id, tokenHash, expiresAt });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(rawToken)}`;
    const provider = getEmailProvider();
    await provider.send({
      to: user.email,
      subject: "Reset Password — Madina Solution",
      text: `Halo ${user.name}, gunakan tautan berikut untuk mengatur ulang password Anda. Tautan berlaku 30 menit: ${resetUrl}`,
      html: `<p>Halo ${user.name},</p><p>Klik tombol berikut untuk mengatur ulang password Anda. Tautan berlaku 30 menit.</p><p><a href="${resetUrl}">Reset Password</a></p><p>Jika Anda tidak meminta reset password, abaikan email ini.</p>`,
    });

    await db.insert(auditLogs).values({
      userId: user.id,
      action: "PASSWORD_RESET_REQUESTED",
      resource: "users",
      resourceId: user.id,
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(generic);
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ success: true, message: "Jika email terdaftar, instruksi reset password akan dikirim." });
  }
}
