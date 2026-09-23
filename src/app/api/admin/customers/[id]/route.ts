import { NextRequest, NextResponse } from "next/server";
import { and, count, desc, eq, ne, or, sum } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, messages, orders, payments, users } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { hasPermission, ROLE_LABELS } from "@/lib/auth/permissions";

type Ctx = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "customers.read")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }
    const { id } = await context.params;
    const [customer] = await db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, avatar: users.avatar, role: users.role, isActive: users.isActive, createdAt: users.createdAt, updatedAt: users.updatedAt }).from(users).where(eq(users.id, id)).limit(1);
    if (!customer || customer.role !== "customer") {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Pelanggan tidak ditemukan" } }, { status: 404 });
    }

    const [orderCountRow, billedRow, spendRow, paidRow, unreadRow, recentMessages, recentOrders, pendingPaymentRow] = await Promise.all([
      db.select({ value: count() }).from(orders).where(and(eq(orders.userId, id), ne(orders.status, "cancelled"), ne(orders.status, "draft"))),
      db.select({ value: sum(orders.total) }).from(orders).where(and(eq(orders.userId, id), ne(orders.status, "cancelled"), ne(orders.status, "draft"))),
      db.select({ value: sum(orders.total) }).from(orders).where(and(eq(orders.userId, id), eq(orders.status, "completed"), eq(orders.paymentStatus, "paid"))),
      db.select({ value: sum(payments.amount) }).from(payments).innerJoin(orders, eq(payments.orderId, orders.id)).where(and(eq(orders.userId, id), ne(orders.status, "cancelled"), ne(orders.status, "draft"), eq(payments.status, "paid"))),
      db.select({ value: count() }).from(messages).where(and(eq(messages.senderId, id), eq(messages.isRead, false))),
      db.select({ id: messages.id, content: messages.content, senderId: messages.senderId, isRead: messages.isRead, createdAt: messages.createdAt, orderId: messages.orderId, orderNumber: orders.orderNumber }).from(messages).leftJoin(orders, eq(messages.orderId, orders.id)).where(or(eq(messages.senderId, id), eq(messages.receiverId, id))).orderBy(desc(messages.createdAt)).limit(10),
      db.select({ id: orders.id, orderNumber: orders.orderNumber, total: orders.total, status: orders.status, paymentStatus: orders.paymentStatus, createdAt: orders.createdAt }).from(orders).where(eq(orders.userId, id)).orderBy(desc(orders.createdAt)).limit(12),
      db.select({ value: sum(payments.amount) }).from(payments).innerJoin(orders, eq(payments.orderId, orders.id)).where(and(eq(orders.userId, id), ne(orders.status, "cancelled"), ne(orders.status, "draft"), eq(payments.status, "pending_verification"))),
    ]);

    return NextResponse.json({
      success: true,
      customer: { ...customer, roleLabel: ROLE_LABELS[customer.role] || customer.role },
      summary: {
        orderCount: Number(orderCountRow[0]?.value || 0),
        totalSpend: Number(spendRow[0]?.value || 0),
        outstanding: Math.max(0, Number(billedRow[0]?.value || 0) - Number(paidRow[0]?.value || 0)),
        paidTotal: Number(paidRow[0]?.value || 0),
        pendingVerification: Number(pendingPaymentRow[0]?.value || 0),
        unreadMessages: Number(unreadRow[0]?.value || 0),
      },
      recentOrders,
      recentMessages: recentMessages.map((message) => ({ ...message, isFromCustomer: message.senderId === id })),
    });
  } catch (error) {
    console.error("Admin customer detail GET error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal memuat profil pelanggan" } }, { status: 500 });
  }
}


export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "customers.update")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }
    const { id } = await context.params;
    const [customer] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, id)).limit(1);
    if (!customer || customer.role !== "customer") {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Pelanggan tidak ditemukan" } }, { status: 404 });
    }
    const body = await request.json();
    const allowed: Record<string, unknown> = {};
    if (typeof body.isActive === "boolean") allowed.isActive = body.isActive;
    if (Object.keys(allowed).length === 0) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Tidak ada perubahan" } }, { status: 400 });
    const [updated] = await db.update(users).set({ ...allowed, updatedAt: new Date() }).where(eq(users.id, id)).returning({ id: users.id, name: users.name, role: users.role, isActive: users.isActive });
    if (!updated) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Pelanggan tidak ditemukan" } }, { status: 404 });
    await db.insert(auditLogs).values({ userId: session.userId, action: "USER_UPDATED", resource: "users", resourceId: id, metadata: allowed });
    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("Admin customer detail PATCH error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal memperbarui pelanggan" } }, { status: 500 });
  }
}
