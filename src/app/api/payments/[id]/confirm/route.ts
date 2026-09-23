import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { PaymentService } from "@/lib/payment/service";
import { hasPermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

const confirmSchema = z.object({
  reason: z.string().min(3, "Alasan wajib diisi").max(500),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "payments.confirm")) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Hanya admin yang dapat mengkonfirmasi pembayaran manual" } },
        { status: 403 }
      );
    }

    const { id: paymentId } = await context.params;
    const body = await request.json();
    const parsed = confirmSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Alasan wajib diisi" } },
        { status: 400 }
      );
    }

    const service = new PaymentService();
    await service.confirmManual(paymentId, session.userId, parsed.data.reason);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Manual confirm error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Gagal mengkonfirmasi pembayaran" } },
      { status: 500 }
    );
  }
}
