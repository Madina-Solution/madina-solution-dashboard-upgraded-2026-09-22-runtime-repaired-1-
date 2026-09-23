import type { PaymentProvider, CreatePaymentInput, PaymentResult, WebhookEvent } from "./types";

/**
 * Mock payment provider for development and testing.
 * Simulates a payment gateway without external dependencies.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const id = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      providerPaymentId: id,
      reference: `REF-${id}`,
      status: "pending",
      amount: input.amount,
      currency: input.currency || "IDR",
      paymentMethod: input.paymentMethod || "bank_transfer",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      metadata: input.metadata,
    };
  }

  async getPayment(providerPaymentId: string): Promise<PaymentResult> {
    return {
      providerPaymentId,
      reference: `REF-${providerPaymentId}`,
      status: "pending",
      amount: 0,
      currency: "IDR",
    };
  }

  async cancelPayment(providerPaymentId: string): Promise<PaymentResult> {
    return {
      providerPaymentId,
      reference: `REF-${providerPaymentId}`,
      status: "cancelled",
      amount: 0,
      currency: "IDR",
    };
  }

  async refundPayment(providerPaymentId: string, amount?: number): Promise<PaymentResult> {
    return {
      providerPaymentId,
      reference: `REF-${providerPaymentId}`,
      status: "refunded",
      amount: amount || 0,
      currency: "IDR",
    };
  }

  async verifyWebhook(request: Request): Promise<WebhookEvent> {
    const body = await request.json();
    return {
      eventId: body.event_id || `evt_${Date.now()}`,
      eventType: body.event_type || "payment.success",
      providerPaymentId: body.provider_payment_id || "",
      status: body.status || "paid",
      amount: body.amount || 0,
      paidAt: body.status === "paid" ? new Date() : undefined,
    };
  }
}
