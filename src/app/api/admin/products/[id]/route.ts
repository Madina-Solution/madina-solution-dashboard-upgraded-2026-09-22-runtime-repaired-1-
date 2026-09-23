import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import type { ProductOption, ProductAdminMetadata } from "@/db/schema";
import { sanitizeRichHtml } from "@/lib/sanitize-rich-html";
import { syncProductPricingTiers } from "@/lib/product-pricing";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";
const updateProductSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  slug: z.string().min(2).max(255).regex(/^[a-z0-9-]+$/).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  shortDescription: z.string().max(500).nullable().optional(),
  description: z.string().max(100000).nullable().optional(),
  basePrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  unit: z.string().max(50).optional(),
  minOrder: z.number().int().positive().optional(),
  productionDays: z.number().int().positive().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  specifications: z.record(z.string(), z.string()).optional(),
  thumbnail: z.string().url().optional().or(z.literal("")),
  gallery: z.array(z.string().url()).max(12).optional(),
  options: z.array(z.unknown()).max(30).optional(),
  fulfillmentType: z.enum(["physical", "digital", "hybrid"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  translations: z.object({
    id: z.object({ name: z.string().max(255).optional(), shortDescription: z.string().max(500).optional(), description: z.string().max(100000).optional() }).optional(),
    en: z.object({ name: z.string().max(255).optional(), shortDescription: z.string().max(500).optional(), description: z.string().max(100000).optional() }).optional(),
  }).optional(),
});

export async function GET(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "products.read")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const { id } = await context.params;
    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!product) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Produk tidak ditemukan" } }, { status: 404 });
    return NextResponse.json({ success: true, product });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}

export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "products.update")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } }, { status: 400 });
    const updateData = { ...parsed.data, ...(parsed.data.description !== undefined ? { description: sanitizeRichHtml(parsed.data.description || "") } : {}),
      ...(parsed.data.translations !== undefined ? { translations: { id: { ...(parsed.data.translations.id || {}), description: sanitizeRichHtml(parsed.data.translations.id?.description || "") }, en: { ...(parsed.data.translations.en || {}), description: sanitizeRichHtml(parsed.data.translations.en?.description || "") } } } : {}), options: parsed.data.options as ProductOption[] | undefined, updatedAt: new Date() };
    const [updated] = await db.update(products).set(updateData).where(eq(products.id, id)).returning();
    if (!updated) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Produk tidak ditemukan" } }, { status: 404 });
    if (parsed.data.metadata !== undefined) {
      await syncProductPricingTiers(id, parsed.data.metadata as ProductAdminMetadata);
    }
    await db.insert(auditLogs).values({ userId: session.userId, action: "PRODUCT_UPDATED", resource: "products", resourceId: id, metadata: parsed.data });
    return NextResponse.json({ success: true, product: updated });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "products.delete")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const { id } = await context.params;
    const [deactivated] = await db.update(products).set({ isActive: false, updatedAt: new Date() }).where(eq(products.id, id)).returning();
    if (!deactivated) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Produk tidak ditemukan" } }, { status: 404 });
    await db.insert(auditLogs).values({ userId: session.userId, action: "PRODUCT_DEACTIVATED", resource: "products", resourceId: id, metadata: { name: deactivated.name } });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
