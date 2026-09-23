import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, financeTransactions } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { z } from "zod";

export const dynamic = "force-dynamic";
const patchSchema = z.object({ status: z.literal("void"), reason: z.string().trim().min(5).max(500) });

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "finance.manage")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ke modul keuangan ditolak" } }, { status: 403 });
    }
    const { id } = await context.params;
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data void transaksi tidak valid" } }, { status: 400 });

    const [transaction] = await db.select().from(financeTransactions).where(eq(financeTransactions.id, id)).limit(1);
    if (!transaction) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Transaksi tidak ditemukan" } }, { status: 404 });
    if (transaction.status === "void") return NextResponse.json({ success: false, error: { code: "ALREADY_VOID", message: "Transaksi sudah dibatalkan" } }, { status: 400 });
    if (transaction.paymentId) return NextResponse.json({ success: false, error: { code: "SYSTEM_LEDGER", message: "Pemasukan pembayaran otomatis tidak dapat di-void dari buku kas. Koreksi harus melalui alur pembayaran." } }, { status: 409 });

    const [updated] = await db.update(financeTransactions).set({ status: "void", notes: [transaction.notes, `VOID: ${parsed.data.reason}`].filter(Boolean).join("\n"), updatedAt: new Date() }).where(eq(financeTransactions.id, id)).returning();
    await db.insert(auditLogs).values({ userId: session.userId, action: "FINANCE_TRANSACTION_VOIDED", resource: "finance_transactions", resourceId: id, metadata: { reason: parsed.data.reason } });

    return NextResponse.json({ success: true, transaction: updated });
  } catch (error) {
    console.error("Admin finance PATCH error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal membatalkan transaksi" } }, { status: 500 });
  }
}
