import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { paymentMethods, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  type: z.enum(["bank_transfer", "gateway"]).optional(),
  name: z.string().min(2).max(120).optional(),
  bankName: z.string().max(120).optional().or(z.literal("")),
  accountNumber: z.string().max(60).optional().or(z.literal("")),
  accountHolder: z.string().max(120).optional().or(z.literal("")),
  logo: z.string().url().optional().or(z.literal("")),
  instructions: z.string().max(1000).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "settings.update")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } }, { status: 400 });
    }
    const [updated] = await db.update(paymentMethods).set({ ...parsed.data, updatedAt: new Date() }).where(eq(paymentMethods.id, id)).returning();
    if (!updated) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Tidak ditemukan" } }, { status: 404 });
    await db.insert(auditLogs).values({ userId: session.userId, action: "PAYMENT_METHOD_UPDATED", resource: "payment_methods", resourceId: id, metadata: parsed.data });
    return NextResponse.json({ success: true, paymentMethod: updated });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal memperbarui metode pembayaran" } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "settings.update")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }
    const { id } = await context.params;
    await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
    await db.insert(auditLogs).values({ userId: session.userId, action: "PAYMENT_METHOD_DELETED", resource: "payment_methods", resourceId: id });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal menghapus metode pembayaran" } }, { status: 500 });
  }
}
