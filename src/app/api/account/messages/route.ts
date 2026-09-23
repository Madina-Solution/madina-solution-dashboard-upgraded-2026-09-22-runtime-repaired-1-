import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, users, orders } from "@/db/schema";
import { and, asc, eq, inArray, or } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { notify } from "@/lib/notifications/service";

export const dynamic = "force-dynamic";

async function resolveSupportUserId(): Promise<string | null> {
  const [admin] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.isActive, true), inArray(users.role, ["super_admin", "admin", "manager", "staff"])))
    .orderBy(asc(users.createdAt))
    .limit(1);
  return admin?.id ?? null;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
    }

    const thread = await db
      .select({
        id: messages.id,
        content: messages.content,
        senderId: messages.senderId,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        orderId: messages.orderId,
        orderNumber: orders.orderNumber,
      })
      .from(messages)
      .leftJoin(orders, eq(messages.orderId, orders.id))
      .where(or(eq(messages.senderId, session.userId), eq(messages.receiverId, session.userId)))
      .orderBy(asc(messages.createdAt));

    // Mark messages sent TO the customer as read now that they've opened the thread.
    const unreadIncoming = thread.filter((m) => m.senderId !== session.userId && !m.isRead);
    if (unreadIncoming.length > 0) {
      await Promise.all(unreadIncoming.map((m) => db.update(messages).set({ isRead: true }).where(eq(messages.id, m.id))));
    }

    return NextResponse.json({
      success: true,
      messages: thread.map((m) => ({ ...m, isMine: m.senderId === session.userId })),
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal memuat pesan" } }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
    }
    await db.delete(messages).where(or(eq(messages.senderId, session.userId), eq(messages.receiverId, session.userId)));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal menghapus percakapan" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
    }
    const body = await request.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content || content.length > 2000) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Pesan tidak boleh kosong (maks 2000 karakter)" } }, { status: 400 });
    }
    const orderId = typeof body.orderId === "string" ? body.orderId : null;
    if (orderId) {
      const [ownedOrder] = await db.select({ id: orders.id }).from(orders).where(and(eq(orders.id, orderId), eq(orders.userId, session.userId))).limit(1);
      if (!ownedOrder) return NextResponse.json({ success: false, error: { code: "ORDER_INVALID", message: "Pesanan tidak terkait dengan akun Anda" } }, { status: 400 });
    }

    const supportUserId = await resolveSupportUserId();
    if (!supportUserId) {
      return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Tim support belum tersedia" } }, { status: 503 });
    }

    const [created] = await db
      .insert(messages)
      .values({ senderId: session.userId, receiverId: supportUserId, orderId, content })
      .returning();

    await notify({
      userId: supportUserId,
      orderId: orderId || undefined,
      event: "MESSAGE_RECEIVED",
      title: "Pesan baru dari pelanggan",
      message: content.length > 140 ? `${content.slice(0, 137)}…` : content,
    });

    return NextResponse.json({ success: true, item: { ...created, isMine: true } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal mengirim pesan" } }, { status: 500 });
  }
}
