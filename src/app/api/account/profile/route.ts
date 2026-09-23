import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
const updateProfileSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  phone: z.string().max(20).optional(),
  avatar: z.string().url().max(2000).nullable().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
  const [user] = await db.select({ id: users.id, email: users.email, name: users.name, phone: users.phone, avatar: users.avatar, role: users.role, createdAt: users.createdAt }).from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Profil tidak ditemukan" } }, { status: 404 });
  return NextResponse.json({ success: true, user });
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
    const parsed = updateProfileSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } }, { status: 400 });
    const [updated] = await db.update(users).set({ ...parsed.data, updatedAt: new Date() }).where(eq(users.id, session.userId)).returning({ id: users.id, name: users.name, email: users.email, phone: users.phone, avatar: users.avatar, role: users.role, createdAt: users.createdAt });
    return NextResponse.json({ success: true, user: updated });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 });
  }
}
