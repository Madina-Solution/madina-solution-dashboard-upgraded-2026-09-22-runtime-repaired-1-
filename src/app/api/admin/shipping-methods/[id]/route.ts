import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shippingMethods, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  courier: z.string().max(60).optional().or(z.literal("")),
  cost: z.number().min(0).optional(),
  estimatedDaysMin: z.number().int().min(0).optional(),
  estimatedDaysMax: z.number().int().min(0).optional(),
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
    const { cost, ...rest } = parsed.data;
    const [updated] = await db.update(shippingMethods).set({ ...rest, ...(cost !== undefined ? { cost: String(cost) } : {}), updatedAt: new Date() }).where(eq(shippingMethods.id, id)).returning();
    if (!updated) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Tidak ditemukan" } }, { status: 404 });
    await db.insert(auditLogs).values({ userId: session.userId, action: "SHIPPING_METHOD_UPDATED", resource: "shipping_methods", resourceId: id, metadata: parsed.data });
    return NextResponse.json({ success: true, shippingMethod: updated });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal memperbarui metode pengiriman" } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "settings.update")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }
    const { id } = await context.params;
    await db.delete(shippingMethods).where(eq(shippingMethods.id, id));
    await db.insert(auditLogs).values({ userId: session.userId, action: "SHIPPING_METHOD_DELETED", resource: "shipping_methods", resourceId: id });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal menghapus metode pengiriman" } }, { status: 500 });
  }
}
