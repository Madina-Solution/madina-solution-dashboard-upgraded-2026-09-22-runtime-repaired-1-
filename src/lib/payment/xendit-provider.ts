import type { PaymentProvider, CreatePaymentInput, PaymentResult, WebhookEvent } from "./types";

const API_BASE = "https://api.xendit.co";

function auth(secret: string) { return `Basic ${Buffer.from(`${secret}:`).toString("base64")}`; }
function mapStatus(status: string): PaymentResult["status"] {
  if (["PAID", "SETTLED"].includes(status)) return "paid";
  if (["EXPIRED"].includes(status)) return "expired";
  if (["INACTIVE"].includes(status)) return "cancelled";
  return "pending";
}

export class XenditProvider implements PaymentProvider {
  readonly name = "xendit";
  private readonly secret = process.env.XENDIT_SECRET_KEY!;

  private async request(path: string, init?: RequestInit) {
    if (!this.secret) throw new Error("XENDIT_SECRET_KEY is required");
    const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { Authorization: auth(this.secret), "Content-Type": "application/json", ...(init?.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error((data as { message?: string }).message || `Xendit error ${response.status}`);
    return data as Record<string, unknown>;
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const externalId = String(input.metadata?.orderNumber || input.orderId);
    const data = await this.request("/v2/invoices", { method: "POST", body: JSON.stringify({ external_id: externalId, amount: Math.round(input.amount), payer_email: input.customerEmail, description: input.description || `Pembayaran ${externalId}`, invoice_duration: 86400 }) });
    return { providerPaymentId: String(data.id), reference: externalId, status: mapStatus(String(data.status)), amount: Number(data.amount || input.amount), currency: "IDR", paymentUrl: data.invoice_url as string | undefined, expiresAt: data.expiry_date ? new Date(String(data.expiry_date)) : undefined, metadata: data };
  }

  async getPayment(providerPaymentId: string): Promise<PaymentResult> {
    const data = await this.request(`/v2/invoices/${encodeURIComponent(providerPaymentId)}`, { method: "GET" });
    return { providerPaymentId, reference: String(data.external_id || providerPaymentId), status: mapStatus(String(data.status)), amount: Number(data.amount || 0), currency: "IDR", paymentUrl: data.invoice_url as string | undefined, expiresAt: data.expiry_date ? new Date(String(data.expiry_date)) : undefined, paidAt: ["PAID", "SETTLED"].includes(String(data.status)) && data.paid_at ? new Date(String(data.paid_at)) : undefined, metadata: data };
  }

  async cancelPayment(providerPaymentId: string): Promise<PaymentResult> {
    const data = await this.request(`/invoices/${encodeURIComponent(providerPaymentId)}/expire!`, { method: "POST" });
    return { providerPaymentId, reference: String(data.external_id || providerPaymentId), status: "expired", amount: Number(data.amount || 0), currency: "IDR", metadata: data };
  }

  async refundPayment(): Promise<PaymentResult> {
    throw new Error("Xendit invoice refund requires a payment/refund API integration specific to the chosen Xendit product");
  }

  async verifyWebhook(request: Request): Promise<WebhookEvent> {
    const body = (await request.json()) as Record<string, unknown>;
    const callbackToken = request.headers.get("x-callback-token");
    if (!callbackToken || callbackToken !== this.secret) throw new Error("Invalid Xendit callback token");
    const status = mapStatus(String(body.status || ""));
    const providerPaymentId = String(body.id || "");
    return { eventId: String(body.event_id || `${providerPaymentId}:${String(body.status || "")}:${String(body.paid_at || body.updated || "")}`), eventType: String(body.status || "invoice.update"), providerPaymentId, status, amount: Number(body.amount || 0), paidAt: status === "paid" && body.paid_at ? new Date(String(body.paid_at)) : undefined, metadata: body };
  }
}
