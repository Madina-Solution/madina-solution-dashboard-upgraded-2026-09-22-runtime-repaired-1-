import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { PaymentService } from "@/lib/payment/service";
import { hasPermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

// GET — get payment info for an order
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
    }

    const { id: orderId } = await context.params;

    // Verify ownership or an explicit payment-read permission.
    const isAdmin = hasPermission(session.role, "payments.read");

    const orderResult = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    const order = orderResult[0];
    if (!order) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Pesanan tidak ditemukan" } }, { status: 404 });
    }

    if (!isAdmin && order.userId !== session.userId) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }

    const paymentList = await db.select().from(payments).where(eq(payments.orderId, orderId)).orderBy(desc(payments.createdAt));

    return NextResponse.json({
      success: true,
      payments: paymentList.map(p => ({
        id: p.id,
        provider: p.provider,
        reference: p.reference,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        paymentMethod: p.paymentMethod,
        paidAt: p.paidAt,
        expiresAt: p.expiresAt,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get payment error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal memuat pembayaran" } }, { status: 500 });
  }
}

// POST — create payment for an order
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
    }

    const { id: orderId } = await context.params;

    // Verify ownership
    const orderResult = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    const order = orderResult[0];
    if (!order) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Pesanan tidak ditemukan" } }, { status: 404 });
    }

    const canManageOrderPayment = hasPermission(session.role, "orders.update");
    if (!canManageOrderPayment && order.userId !== session.userId) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json({ success: false, error: { code: "ALREADY_PAID", message: "Pesanan sudah dibayar" } }, { status: 409 });
    }

    const service = new PaymentService();
    const { paymentId, result } = await service.createPayment(orderId, session.userId);

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentId,
        status: result.status,
        amount: result.amount,
        reference: result.reference,
        paymentUrl: result.paymentUrl,
        expiresAt: result.expiresAt,
      },
    });
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal membuat pembayaran" } }, { status: 500 });
  }
}
