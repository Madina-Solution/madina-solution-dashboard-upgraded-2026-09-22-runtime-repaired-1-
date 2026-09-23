import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/lib/payment/service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const service = new PaymentService();
    const { processed } = await service.processWebhook(request);
    return NextResponse.json({ success: true, processed });
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Invalid/suspicious provider payloads must not be retried forever, while
    // transient database/provider failures should remain retryable.
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    const permanent = /signature|invalid|unauthor|forbidden|malformed|unsupported|not found/.test(message);
    return NextResponse.json(
      { success: false, error: permanent ? "Invalid webhook payload" : "Webhook processing temporarily unavailable" },
      { status: permanent ? 400 : 503 }
    );
  }
}
