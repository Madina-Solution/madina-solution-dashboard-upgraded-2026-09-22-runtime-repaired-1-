import crypto from "crypto";
import type { PaymentProvider, CreatePaymentInput, PaymentResult, WebhookEvent, PaymentStatus } from "./types";

const API_BASE = "https://app.midtrans.com";

function authHeader(serverKey: string) {
  return `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;
}

function mapStatus(transactionStatus: string, fraudStatus?: string): PaymentStatus {
  if (transactionStatus === "settlement" || transactionStatus === "capture" && fraudStatus !== "challenge") return "paid";
  if (transactionStatus === "pending") return "pending";
  if (transactionStatus === "expire") return "expired";
  if (transactionStatus === "cancel" || transactionStatus === "deny") return "cancelled";
  if (transactionStatus === "refund") return "refunded";
  if (transactionStatus === "partial_refund") return "partially_refunded";
  return "failed";
}

export class MidtransProvider implements PaymentProvider {
  readonly name = "midtrans";
  private readonly serverKey = process.env.MIDTRANS_SERVER_KEY!;

  private async request(path: string, init?: RequestInit) {
    if (!this.serverKey) throw new Error("MIDTRANS_SERVER_KEY is required");
    const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { Authorization: authHeader(this.serverKey), "Content-Type": "application/json", ...(init?.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error((data as { status_message?: string }).status_message || `Midtrans error ${response.status}`);
    return data as Record<string, unknown>;
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const orderId = String(input.metadata?.orderNumber || input.orderId);
    const gross = Math.round(input.amount);
    const data = await this.request("/snap/v1/transactions", { method: "POST", body: JSON.stringify({ transaction_details: { order_id: orderId, gross_amount: gross }, customer_details: { first_name: input.customerName, email: input.customerEmail }, item_details: [{ id: input.orderId, price: gross, quantity: 1, name: input.description || `Pembayaran ${orderId}` }] }) });
    return { providerPaymentId: orderId, reference: orderId, status: "pending", amount: gross, currency: "IDR", paymentMethod: input.paymentMethod, paymentUrl: data.redirect_url as string | undefined, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), metadata: { token: data.token, ...input.metadata } };
  }

  async getPayment(providerPaymentId: string): Promise<PaymentResult> {
    const data = await this.request(`/v2/${encodeURIComponent(providerPaymentId)}/status`, { method: "GET" });
    return { providerPaymentId, reference: providerPaymentId, status: mapStatus(String(data.transaction_status), String(data.fraud_status || "")), amount: Number(data.gross_amount || 0), currency: "IDR", paymentMethod: data.payment_type as string | undefined, paidAt: ["settlement", "capture"].includes(String(data.transaction_status)) ? new Date() : undefined, metadata: data };
  }

  async cancelPayment(providerPaymentId: string): Promise<PaymentResult> {
    const data = await this.request(`/v2/${encodeURIComponent(providerPaymentId)}/cancel`, { method: "POST" });
    return { providerPaymentId, reference: providerPaymentId, status: "cancelled", amount: Number(data.gross_amount || 0), currency: "IDR", metadata: data };
  }

  async refundPayment(providerPaymentId: string, amount?: number): Promise<PaymentResult> {
    const body = amount ? JSON.stringify({ refund_key: `refund-${Date.now()}`, amount: Math.round(amount), reason: "Customer refund" }) : JSON.stringify({ refund_key: `refund-${Date.now()}`, reason: "Customer refund" });
    const data = await this.request(`/v2/${encodeURIComponent(providerPaymentId)}/refund`, { method: "POST", body });
    return { providerPaymentId, reference: providerPaymentId, status: amount ? "partially_refunded" : "refunded", amount: Number((data as any).refund_amount || amount || 0), currency: "IDR", metadata: data };
  }

  async verifyWebhook(request: Request): Promise<WebhookEvent> {
    if (!this.serverKey) throw new Error("MIDTRANS_SERVER_KEY is required");
    const body = (await request.json()) as Record<string, unknown>;
    const orderId = String(body.order_id || "");
    const statusCode = String(body.status_code || "");
    const grossAmount = String(body.gross_amount || "");
    const signature = String(body.signature_key || "");
    const expected = crypto.createHash("sha512").update(`${orderId}${statusCode}${grossAmount}${this.serverKey}`).digest("hex");
    const received = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (!signature || received.length !== expectedBuffer.length || !crypto.timingSafeEqual(received, expectedBuffer)) throw new Error("Invalid Midtrans signature");
    const status = mapStatus(String(body.transaction_status || ""), String(body.fraud_status || ""));
    return { eventId: `${orderId}:${String(body.transaction_id || "")}:${String(body.transaction_status || "")}`, eventType: String(body.transaction_status || "unknown"), providerPaymentId: orderId, status, amount: Number(grossAmount), paidAt: status === "paid" ? new Date() : undefined, metadata: body };
  }
}
