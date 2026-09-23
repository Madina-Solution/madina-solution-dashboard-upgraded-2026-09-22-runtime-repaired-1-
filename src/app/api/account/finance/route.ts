import { NextResponse } from "next/server";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
    }

    const [customerOrders, customerPayments, allCustomerOrders, allCustomerPayments] = await Promise.all([
      db.select({ id: orders.id, orderNumber: orders.orderNumber, total: orders.total, paymentStatus: orders.paymentStatus, status: orders.status, createdAt: orders.createdAt })
        .from(orders).where(eq(orders.userId, session.userId)).orderBy(desc(orders.createdAt)).limit(100),
      db.select({ id: payments.id, orderId: payments.orderId, orderNumber: orders.orderNumber, amount: payments.amount, currency: payments.currency, status: payments.status, paymentMethod: payments.paymentMethod, reference: payments.reference, paidAt: payments.paidAt, createdAt: payments.createdAt })
        .from(payments).innerJoin(orders, eq(payments.orderId, orders.id)).where(eq(orders.userId, session.userId)).orderBy(desc(payments.createdAt)).limit(100),
      db.select({ id: orders.id, total: orders.total, status: orders.status })
        .from(orders).where(and(eq(orders.userId, session.userId), ne(orders.status, "cancelled"), ne(orders.status, "draft"))),
      db.select({ orderId: payments.orderId, amount: payments.amount, status: payments.status })
        .from(payments).innerJoin(orders, eq(payments.orderId, orders.id)).where(and(eq(orders.userId, session.userId), ne(orders.status, "cancelled"), ne(orders.status, "draft"))),
    ]);

    const activeOrderTotals = new Map(allCustomerOrders.map((order) => [order.id, Number(order.total || 0)]));
    const paidByOrder = new Map<string, number>();
    for (const payment of allCustomerPayments) {
      if (payment.status === "paid" && activeOrderTotals.has(payment.orderId)) paidByOrder.set(payment.orderId, (paidByOrder.get(payment.orderId) || 0) + Number(payment.amount || 0));
    }
    const billedTotal = Array.from(activeOrderTotals.values()).reduce((sum, amount) => sum + amount, 0);
    const paidTotal = Array.from(paidByOrder.values()).reduce((sum, amount) => sum + amount, 0);
    const outstanding = Array.from(activeOrderTotals.entries()).reduce((sum, [orderId, total]) => sum + Math.max(0, total - (paidByOrder.get(orderId) || 0)), 0);
    const pendingVerification = allCustomerPayments.filter((payment) => payment.status === "pending_verification" && activeOrderTotals.has(payment.orderId)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    return NextResponse.json({ success: true, summary: { billedTotal, paidTotal, outstanding, pendingVerification }, orders: customerOrders, payments: customerPayments });
  } catch (error) {
    console.error("Account finance GET error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal memuat riwayat keuangan" } }, { status: 500 });
  }
}
