import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { navigationItems, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { QUICK_NAV_ICON_KEYS } from "@/lib/navigation";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

const navigationItemUpdateSchema = z.object({
  group: z.enum(["services", "products", "explore"]).optional(),
  name: z.string().trim().min(2).max(120).optional(),
  href: z.string().trim().min(1).max(255).optional(),
  icon: z.enum(QUICK_NAV_ICON_KEYS as [string, ...string[]]).optional(),
  description: z.string().trim().max(160).optional().nullable(),
  translations: z.object({ id: z.object({ name: z.string().max(120).optional(), description: z.string().max(160).optional().nullable() }).optional(), en: z.object({ name: z.string().max(120).optional(), description: z.string().max(160).optional().nullable() }).optional() }).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.update")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }
    const { id } = await context.params;
    const body = await request.json();
    const parsed = navigationItemUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } }, { status: 400 });
    }
    const [updated] = await db
      .update(navigationItems)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(navigationItems.id, id))
      .returning();
    if (!updated) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Tidak ditemukan" } }, { status: 404 });
    }
    await db.insert(auditLogs).values({ userId: session.userId, action: "NAVIGATION_ITEM_UPDATED", resource: "navigation_items", resourceId: id, metadata: parsed.data });
    return NextResponse.json({ success: true, item: updated });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal memperbarui menu" } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.delete")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }
    const { id } = await context.params;
    await db.delete(navigationItems).where(eq(navigationItems.id, id));
    await db.insert(auditLogs).values({ userId: session.userId, action: "NAVIGATION_ITEM_DELETED", resource: "navigation_items", resourceId: id });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal menghapus menu" } }, { status: 500 });
  }
}
