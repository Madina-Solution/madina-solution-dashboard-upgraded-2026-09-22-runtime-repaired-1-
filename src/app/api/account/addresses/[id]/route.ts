import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
    const { id } = await context.params;
    const body = await request.json();
    const [updated] = await db.update(addresses).set({ ...body, updatedAt: new Date() }).where(and(eq(addresses.id, id), eq(addresses.userId, session.userId))).returning();
    if (!updated) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Alamat tidak ditemukan" } }, { status: 404 });
    return NextResponse.json({ success: true, address: updated });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
    const { id } = await context.params;
    const result = await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, session.userId))).returning();
    if (result.length === 0) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Alamat tidak ditemukan" } }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
