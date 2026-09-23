import { db } from "@/db";
import { payments, paymentEvents, orders, auditLogs, notifications, financeCategories, financeTransactions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { PaymentProvider, CreatePaymentInput, PaymentResult } from "./types";
import { MockPaymentProvider } from "./mock-provider";
import { MidtransProvider } from "./midtrans-provider";
import { XenditProvider } from "./xendit-provider";

function getProvider(): PaymentProvider {
  const provider = (process.env.PAYMENT_PROVIDER || "mock").toLowerCase();
  if (provider === "midtrans") {
    if (!process.env.MIDTRANS_SERVER_KEY) throw new Error("MIDTRANS_SERVER_KEY is required when PAYMENT_PROVIDER=midtrans");
    return new MidtransProvider();
  }
  if (provider === "xendit") {
    if (!process.env.XENDIT_SECRET_KEY) throw new Error("XENDIT_SECRET_KEY is required when PAYMENT_PROVIDER=xendit");
    return new XenditProvider();
  }
  if (provider === "mock" && process.env.NODE_ENV !== "production") return new MockPaymentProvider();
  throw new Error("Production payment requires PAYMENT_PROVIDER=midtrans or xendit with valid credentials");
}

export class PaymentService {
  private provider?: PaymentProvider;

  private get providerInstance(): PaymentProvider {
    if (!this.provider) this.provider = getProvider();
    return this.provider;
  }

  /**
   * Create a payment for an order. Amount is derived from database, never client.
   */
  async createPayment(orderId: string, actorId?: string): Promise<{ paymentId: string; result: PaymentResult }> {
    // Load order — authoritative amount
    const orderResult = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    const order = orderResult[0];
    if (!order) throw new Error("Order not found");

    const amount = Number(order.total);
    if (amount <= 0) throw new Error("Invalid order total");

    const input: CreatePaymentInput = {
      orderId,
      amount,
      currency: "IDR",
      customerEmail: order.guestEmail || undefined,
      customerName: order.guestName || undefined,
      description: `Pembayaran ${order.orderNumber}`,
      metadata: { orderNumber: order.orderNumber },
    };

    const provider = this.providerInstance;
    const result = await provider.createPayment(input);

    // Create payment record
    const [payment] = await db.insert(payments).values({
      orderId,
      provider: provider.name,
      providerPaymentId: result.providerPaymentId,
      reference: result.reference,
      amount: String(amount),
      currency: result.currency,
      status: result.status,
      paymentMethod: result.paymentMethod || null,
      expiresAt: result.expiresAt || null,
      metadata: result.metadata || {},
    }).returning();

    // Audit
    if (actorId) {
      await db.insert(auditLogs).values({
        userId: actorId,
        action: "PAYMENT_CREATED",
        resource: "payments",
        resourceId: payment.id,
        metadata: { orderId, amount, provider: provider.name },
      });
    }

    return { paymentId: payment.id, result };
  }


  /**
   * Process a webhook event idempotently.
   */
  async processWebhook(request: Request): Promise<{ processed: boolean }> {
    const provider = this.providerInstance;
    const event = await provider.verifyWebhook(request);

    // Idempotency check
    const existing = await db.select({ id: paymentEvents.id }).from(paymentEvents)
      .where(and(eq(paymentEvents.provider, provider.name), eq(paymentEvents.eventId, event.eventId)))
      .limit(1);

    if (existing.length > 0) {
      return { processed: false }; // Already processed
    }

    // Find payment
    const paymentResult = await db.select().from(payments)
      .where(eq(payments.providerPaymentId, event.providerPaymentId))
      .limit(1);

    const payment = paymentResult[0];
    if (!payment) {
      throw new Error("Payment not found for webhook");
    }

    if (Math.round(Number(payment.amount)) !== Math.round(event.amount)) {
      throw new Error("Webhook amount mismatch");
    }

    // Transactional update
    await db.transaction(async (tx) => {
      // Record event
      await tx.insert(paymentEvents).values({
        paymentId: payment.id,
        provider: provider.name,
        eventId: event.eventId,
        eventType: event.eventType,
        payload: event.metadata || {},
        processed: true,
        processedAt: new Date(),
      });

      // Update payment status
      await tx.update(payments).set({
        status: event.status,
        paidAt: event.paidAt || null,
        updatedAt: new Date(),
      }).where(eq(payments.id, payment.id));

      // Map to order payment status
      let orderPaymentStatus: "unpaid" | "partial" | "paid" | "refunded" = "unpaid";
      if (event.status === "paid") orderPaymentStatus = "paid";
      else if (event.status === "refunded" || event.status === "partially_refunded") orderPaymentStatus = "refunded";

      if (event.status === "paid" || event.status === "refunded" || event.status === "partially_refunded") {
        await tx.update(orders).set({
          paymentStatus: orderPaymentStatus,
          updatedAt: new Date(),
        }).where(eq(orders.id, payment.orderId));
      }

      if (event.status === "paid") {
        const [orderForLedger] = await tx.select({ orderNumber: orders.orderNumber }).from(orders).where(eq(orders.id, payment.orderId)).limit(1);
        const [existingLedger] = await tx.select({ id: financeTransactions.id }).from(financeTransactions).where(and(eq(financeTransactions.paymentId, payment.id), eq(financeTransactions.type, "income"), eq(financeTransactions.status, "posted"))).limit(1);
        if (orderForLedger && !existingLedger) {
          const categoryName = payment.paymentMethod?.toLowerCase().includes("bank") ? "Transfer Bank" : "Penjualan / Order";
          const [category] = await tx.select({ id: financeCategories.id }).from(financeCategories).where(and(eq(financeCategories.name, categoryName), eq(financeCategories.isActive, true))).limit(1);
          await tx.insert(financeTransactions).values({
            type: "income", status: "posted", categoryId: category?.id ?? null, orderId: payment.orderId, paymentId: payment.id,
            reference: orderForLedger.orderNumber, description: `Pembayaran pesanan ${orderForLedger.orderNumber}`, amount: String(Number(payment.amount)), currency: "IDR",
            paymentMethod: payment.paymentMethod || null, transactionDate: event.paidAt || new Date(),
          });
        }
      }

      // Audit
      await tx.insert(auditLogs).values({
        action: `PAYMENT_${event.status.toUpperCase()}`,
        resource: "payments",
        resourceId: payment.id,
        metadata: { eventId: event.eventId, eventType: event.eventType, orderId: payment.orderId },
      });

      // Notify order owner
      const order = await tx.select({ userId: orders.userId, orderNumber: orders.orderNumber }).from(orders).where(eq(orders.id, payment.orderId)).limit(1);
      if (order[0]?.userId) {
        const title = event.status === "paid" ? "Pembayaran berhasil" : `Status pembayaran: ${event.status}`;
        await tx.insert(notifications).values({
          userId: order[0].userId,
          orderId: payment.orderId,
          type: `payment_${event.status}`,
          title,
          message: `Pembayaran untuk pesanan ${order[0].orderNumber} ${event.status === "paid" ? "telah berhasil" : `berstatus ${event.status}`}.`,
          channel: "in_app",
          status: "pending",
          sentAt: new Date(),
        });
      }
    });

    return { processed: true };
  }

  /**
   * Mark payment as paid manually (admin only).
   */
  async confirmManual(paymentId: string, actorId: string, reason: string): Promise<void> {
    const paymentResult = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    const payment = paymentResult[0];
    if (!payment) throw new Error("Payment not found");

    if (payment.status === "paid") throw new Error("Payment already confirmed");

    await db.transaction(async (tx) => {
      const paidAt = new Date();
      await tx.update(payments).set({ status: "paid", paidAt, updatedAt: paidAt }).where(eq(payments.id, paymentId));
      const [order] = await tx.select({ orderNumber: orders.orderNumber, total: orders.total }).from(orders).where(eq(orders.id, payment.orderId)).limit(1);
      const paidRows = await tx.select({ amount: payments.amount }).from(payments).where(and(eq(payments.orderId, payment.orderId), eq(payments.status, "paid")));
      const paidTotal = paidRows.reduce((total, row) => total + Number(row.amount || 0), 0);
      const paymentStatus = order && paidTotal >= Number(order.total || 0) ? "paid" : "partial";
      await tx.update(orders).set({ paymentStatus, updatedAt: paidAt }).where(eq(orders.id, payment.orderId));
      if (order) {
        const [existingLedger] = await tx.select({ id: financeTransactions.id }).from(financeTransactions).where(and(eq(financeTransactions.paymentId, paymentId), eq(financeTransactions.type, "income"), eq(financeTransactions.status, "posted"))).limit(1);
        if (!existingLedger) {
          const categoryName = payment.paymentMethod?.toLowerCase().includes("bank") ? "Transfer Bank" : "Penjualan / Order";
          const [category] = await tx.select({ id: financeCategories.id }).from(financeCategories).where(and(eq(financeCategories.name, categoryName), eq(financeCategories.isActive, true))).limit(1);
          await tx.insert(financeTransactions).values({
            type: "income", status: "posted", categoryId: category?.id ?? null, orderId: payment.orderId, paymentId,
            reference: order.orderNumber, description: `Pembayaran pesanan ${order.orderNumber}`, amount: String(Number(payment.amount)), currency: "IDR",
            paymentMethod: payment.paymentMethod || null, transactionDate: paidAt, createdBy: actorId,
          });
        }
      }
      await tx.insert(auditLogs).values({
        userId: actorId,
        action: "PAYMENT_MANUAL_CONFIRMED",
        resource: "payments",
        resourceId: paymentId,
        metadata: { orderId: payment.orderId, reason },
      });

      const [orderOwner] = await tx.select({ userId: orders.userId, orderNumber: orders.orderNumber }).from(orders).where(eq(orders.id, payment.orderId)).limit(1);
      if (orderOwner?.userId) {
        await tx.insert(notifications).values({
          userId: orderOwner.userId,
          orderId: payment.orderId,
          type: "payment_manual_confirmed",
          title: paymentStatus === "paid" ? "Pembayaran telah dikonfirmasi" : "Pembayaran sebagian telah dikonfirmasi",
          message: `Pembayaran untuk pesanan ${orderOwner.orderNumber} telah dikonfirmasi oleh tim${paymentStatus === "paid" ? " dan tagihan dinyatakan lunas" : ". Sisa tagihan masih dapat dilihat pada halaman keuangan akun Anda"}.`,
          channel: "in_app",
          status: "pending",
          sentAt: new Date(),
        });
      }
    });
  }
}
