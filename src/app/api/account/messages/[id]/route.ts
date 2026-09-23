import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
    const { id } = await context.params;
    const body = await request.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content || content.length > 2000) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Isi pesan tidak valid" } }, { status: 400 });
    }
    const [existing] = await db.select({ senderId: messages.senderId }).from(messages).where(eq(messages.id, id)).limit(1);
    if (!existing) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Pesan tidak ditemukan" } }, { status: 404 });
    if (existing.senderId !== session.userId) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Anda hanya bisa mengubah pesan Anda sendiri" } }, { status: 403 });
    }
    const [updated] = await db.update(messages).set({ content }).where(eq(messages.id, id)).returning();
    return NextResponse.json({ success: true, item: updated });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal mengubah pesan" } }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
    const { id } = await context.params;
    const [existing] = await db.select({ senderId: messages.senderId }).from(messages).where(eq(messages.id, id)).limit(1);
    if (!existing) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Pesan tidak ditemukan" } }, { status: 404 });
    if (existing.senderId !== session.userId) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Anda hanya bisa menghapus pesan Anda sendiri" } }, { status: 403 });
    }
    await db.delete(messages).where(eq(messages.id, id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal menghapus pesan" } }, { status: 500 });
  }
}
