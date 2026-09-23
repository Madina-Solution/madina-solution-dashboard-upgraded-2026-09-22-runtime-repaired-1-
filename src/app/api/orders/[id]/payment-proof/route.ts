import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, media, auditLogs, payments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const proofSchema = z.object({ proofUrl: z.string().url() });

type Ctx = { params: Promise<{ id: string }> };

// PATCH — attach a bank-transfer proof-of-payment image to an order.
// Proof upload requires an account (src/app/api/media/upload always requires
// a session), so this endpoint is only reachable for logged-in customers or
// admins. Guest checkouts are shown the bank details + a WhatsApp instruction
// instead, consistent with how shipping cost coordination already works.
export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login untuk mengunggah bukti transfer" } }, { status: 401 });
    }

    const { id: orderId } = await context.params;
    const body = await request.json();
    const parsed = proofSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "URL bukti transfer tidak valid" } }, { status: 400 });
    }

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Pesanan tidak ditemukan" } }, { status: 404 });
    }

    const isAdmin = hasPermission(session.role, "orders.update");
    if (!isAdmin && order.userId !== session.userId) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }

    // The proof must be a file this account actually uploaded (same
    // ownership check used for design-file attachments in /api/orders).
    const owned = await db.select({ url: media.url }).from(media).where(and(eq(media.userId, session.userId), eq(media.purpose, "customer_upload"), eq(media.status, "uploaded")));
    const allowed = new Set(owned.map((m) => m.url));
    if (!isAdmin && !allowed.has(parsed.data.proofUrl)) {
      return NextResponse.json({ success: false, error: { code: "INVALID_UPLOAD_REFERENCE", message: "File tidak valid atau bukan milik akun Anda" } }, { status: 400 });
    }

    const uploadedAt = new Date();
    const [updated] = await db.update(orders).set({ paymentProof: parsed.data.proofUrl, updatedAt: uploadedAt }).where(eq(orders.id, orderId)).returning();

    const [existingPayment] = await db.select().from(payments).where(and(eq(payments.orderId, orderId), eq(payments.provider, "manual"))).orderBy(payments.createdAt).limit(1);
    if (existingPayment) {
      if (existingPayment.status !== "paid") {
        await db.update(payments).set({
          status: "pending_verification",
          updatedAt: uploadedAt,
          metadata: { ...(existingPayment.metadata || {}), proofUrl: parsed.data.proofUrl, proofUploadedAt: uploadedAt.toISOString() },
        }).where(eq(payments.id, existingPayment.id));
      }
    } else {
      await db.insert(payments).values({
        orderId,
        provider: "manual",
        providerPaymentId: `manual-${orderId}`,
        reference: order.orderNumber,
        amount: String(order.total),
        currency: "IDR",
        status: "pending_verification",
        paymentMethod: "Bank Transfer",
        metadata: { proofUrl: parsed.data.proofUrl, proofUploadedAt: uploadedAt.toISOString() },
      });
    }

    await db.insert(auditLogs).values({ userId: session.userId, action: "ORDER_PAYMENT_PROOF_UPLOADED", resource: "orders", resourceId: orderId, metadata: { orderNumber: order.orderNumber, proofUrl: parsed.data.proofUrl } });

    return NextResponse.json({ success: true, order: { id: updated.id, paymentProof: updated.paymentProof } });
  } catch (error) {
    console.error("Attach payment proof error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal menyimpan bukti transfer" } }, { status: 500 });
  }
}
