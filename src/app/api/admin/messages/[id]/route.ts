import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";
export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "messages.manage")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const { id } = await context.params;
    const body = await request.json();
    const updates: { isRead?: boolean; content?: string } = {};
    if (typeof body.isRead === "boolean") updates.isRead = body.isRead;
    if (typeof body.content === "string") {
      const content = body.content.trim();
      if (!content || content.length > 2000) {
        return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Isi pesan tidak valid" } }, { status: 400 });
      }
      updates.content = content;
    }
    const [updated] = await db.update(messages).set(updates).where(eq(messages.id, id)).returning();
    if (!updated) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Tidak ditemukan" } }, { status: 404 });
    if (updates.content) {
      await db.insert(auditLogs).values({ userId: session.userId, action: "MESSAGE_EDITED", resource: "messages", resourceId: id });
    }
    return NextResponse.json({ success: true, item: updated });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "messages.manage")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const { id } = await context.params;
    await db.delete(messages).where(eq(messages.id, id));
    await db.insert(auditLogs).values({ userId: session.userId, action: "MESSAGE_DELETED", resource: "messages", resourceId: id });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
