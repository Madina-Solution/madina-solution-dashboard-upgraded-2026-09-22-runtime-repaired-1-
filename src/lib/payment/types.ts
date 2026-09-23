export type PaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "expired"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export type CreatePaymentInput = {
  orderId: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
  metadata?: Record<string, unknown>;
};

export type PaymentResult = {
  providerPaymentId: string;
  reference: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paymentMethod?: string;
  paymentUrl?: string; // redirect URL if applicable
  expiresAt?: Date;
  paidAt?: Date;
  metadata?: Record<string, unknown>;
};

export type WebhookEvent = {
  eventId: string;
  eventType: string;
  providerPaymentId: string;
  status: PaymentStatus;
  amount: number;
  paidAt?: Date;
  metadata?: Record<string, unknown>;
};

export interface PaymentProvider {
  readonly name: string;
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>;
  getPayment(providerPaymentId: string): Promise<PaymentResult>;
  cancelPayment(providerPaymentId: string): Promise<PaymentResult>;
  refundPayment(providerPaymentId: string, amount?: number): Promise<PaymentResult>;
  verifyWebhook(request: Request): Promise<WebhookEvent>;
}
