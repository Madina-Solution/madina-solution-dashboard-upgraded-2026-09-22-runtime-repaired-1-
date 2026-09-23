import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/db";
import { users, passwordResetTokens, auditLogs } from "@/db/schema";
import { and, eq, gt, isNull } from "drizzle-orm";
import { checkRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";
const schema = z.object({ token: z.string().length(64), password: z.string().min(8).max(128) });

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await checkRateLimit(`reset:${ip}`, { windowMs: 15 * 60 * 1000, maxRequests: 10 });
    if (!rl.allowed) return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Terlalu banyak percobaan" } }, { status: 429 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: { code: "INVALID_TOKEN", message: "Token reset tidak valid" } }, { status: 400 });
    const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
    const [row] = await db.select().from(passwordResetTokens).where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, new Date()))).limit(1);
    if (!row) return NextResponse.json({ success: false, error: { code: "INVALID_TOKEN", message: "Token reset sudah tidak valid atau telah kedaluwarsa" } }, { status: 400 });
    const hash = await bcrypt.hash(parsed.data.password, 12);
    await db.transaction(async (tx) => {
      await tx.update(users).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(users.id, row.userId));
      await tx.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, row.id));
      await tx.update(passwordResetTokens).set({ usedAt: new Date() }).where(and(eq(passwordResetTokens.userId, row.userId), isNull(passwordResetTokens.usedAt)));
      await tx.insert(auditLogs).values({ userId: row.userId, action: "PASSWORD_RESET", resource: "users", resourceId: row.userId, ipAddress: ip, userAgent: request.headers.get("user-agent") || undefined });
    });
    return NextResponse.json({ success: true, message: "Password berhasil diubah" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal mengubah password" } }, { status: 500 });
  }
}
