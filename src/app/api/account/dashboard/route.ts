import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, notifications } from "@/db/schema";
import { eq, and, count, sum, isNull, or, ne } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });

    const uid = session.userId;

    const [totalResult] = await db.select({ value: count() }).from(orders).where(and(eq(orders.userId, uid), ne(orders.status, "draft")));
    const [pendingResult] = await db.select({ value: count() }).from(orders).where(and(eq(orders.userId, uid), or(eq(orders.status, "pending"), eq(orders.status, "confirmed"))));
    const [activeResult] = await db.select({ value: count() }).from(orders).where(and(eq(orders.userId, uid), or(eq(orders.status, "production"), eq(orders.status, "design_review"), eq(orders.status, "design_approved"), eq(orders.status, "quality_control"))));
    const [completedResult] = await db.select({ value: count() }).from(orders).where(and(eq(orders.userId, uid), eq(orders.status, "completed")));
    const [unpaidResult] = await db.select({ value: count() }).from(orders).where(and(eq(orders.userId, uid), ne(orders.status, "cancelled"), ne(orders.status, "draft"), or(eq(orders.paymentStatus, "unpaid"), eq(orders.paymentStatus, "partial"))));
    const [spendResult] = await db.select({ value: sum(orders.total) }).from(orders).where(and(eq(orders.userId, uid), ne(orders.status, "cancelled"), ne(orders.status, "draft"), eq(orders.paymentStatus, "paid")));
    const [unreadResult] = await db.select({ value: count() }).from(notifications).where(and(eq(notifications.userId, uid), isNull(notifications.readAt)));

    return NextResponse.json({
      success: true,
      stats: {
        totalOrders: totalResult?.value ?? 0,
        pendingOrders: pendingResult?.value ?? 0,
        activeOrders: activeResult?.value ?? 0,
        completedOrders: completedResult?.value ?? 0,
        unpaidOrders: unpaidResult?.value ?? 0,
        totalSpend: Number(spendResult?.value ?? 0),
        unreadNotifications: unreadResult?.value ?? 0,
      },
    });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
