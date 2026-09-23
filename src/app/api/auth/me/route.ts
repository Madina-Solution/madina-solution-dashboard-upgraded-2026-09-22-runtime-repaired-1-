import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: true, user: null });
    const [user] = await db.select({ id: users.id, email: users.email, name: users.name, phone: users.phone, avatar: users.avatar, role: users.role, createdAt: users.createdAt, isActive: users.isActive }).from(users).where(eq(users.id, session.userId)).limit(1);
    if (!user || !user.isActive) return NextResponse.json({ success: true, user: null });
    return NextResponse.json({ success: true, user });
  } catch { return NextResponse.json({ success: true, user: null }); }
}
