import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { z } from "zod";
import type { ProductOption } from "@/db/schema";

const updateServiceSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  slug: z.string().min(2).max(255).regex(/^[a-z0-9-]+$/).optional(),
  shortDescription: z.string().max(500).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  startingPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  estimatedDays: z.number().int().positive().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  translations: z.object({
    id: z.object({ name: z.string().max(255).optional(), shortDescription: z.string().max(500).optional(), description: z.string().max(100000).optional(), features: z.array(z.string()).optional(), deliverables: z.array(z.string()).optional() }).optional(),
    en: z.object({ name: z.string().max(255).optional(), shortDescription: z.string().max(500).optional(), description: z.string().max(100000).optional(), features: z.array(z.string()).optional(), deliverables: z.array(z.string()).optional() }).optional(),
  }).optional(),
  thumbnail: z.string().url().optional().or(z.literal("")),
  gallery: z.array(z.string().url()).max(12).optional(),
  options: z.array(z.unknown()).max(30).optional(),
  fulfillmentType: z.enum(["physical", "digital", "hybrid"]).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";
export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.update")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateServiceSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } }, { status: 400 });
    const updateData = { ...parsed.data, options: parsed.data.options as ProductOption[] | undefined, updatedAt: new Date() };
    const [updated] = await db.update(services).set(updateData).where(eq(services.id, id)).returning();
    if (!updated) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Tidak ditemukan" } }, { status: 404 });
    await db.insert(auditLogs).values({ userId: session.userId, action: "SERVICE_UPDATED", resource: "services", resourceId: id, metadata: body });
    return NextResponse.json({ success: true, service: updated });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.delete")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const { id } = await context.params;
    const [deactivated] = await db.update(services).set({ isActive: false, updatedAt: new Date() }).where(eq(services.id, id)).returning();
    if (!deactivated) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Tidak ditemukan" } }, { status: 404 });
    await db.insert(auditLogs).values({ userId: session.userId, action: "SERVICE_DEACTIVATED", resource: "services", resourceId: id });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
