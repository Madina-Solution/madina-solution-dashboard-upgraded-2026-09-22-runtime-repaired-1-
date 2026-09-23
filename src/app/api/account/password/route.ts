import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Password lama wajib diisi"),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });

    const body = await request.json();
    const parsed = passwordSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message || "Data tidak valid" } }, { status: 400 });

    const [user] = await db.select({ id: users.id, passwordHash: users.passwordHash }).from(users).where(eq(users.id, session.userId)).limit(1);
    if (!user || !user.passwordHash) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "User tidak ditemukan" } }, { status: 404 });

    const isValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!isValid) return NextResponse.json({ success: false, error: { code: "INVALID_PASSWORD", message: "Password lama salah" } }, { status: 400 });

    const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await db.update(users).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(users.id, session.userId));

    await db.insert(auditLogs).values({ userId: session.userId, action: "PASSWORD_CHANGED", resource: "users", resourceId: session.userId });

    return NextResponse.json({ success: true, message: "Password berhasil diubah" });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal mengubah password" } }, { status: 500 }); }
}
