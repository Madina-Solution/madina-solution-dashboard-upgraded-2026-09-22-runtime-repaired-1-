import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services, auditLogs } from "@/db/schema";
import { asc, desc } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import type { ProductOption } from "@/db/schema";

export const dynamic = "force-dynamic";
const serviceSchema = z.object({
  name: z.string().min(2).max(255),
  slug: z.string().min(2).max(255).regex(/^[a-z0-9-]+$/),
  shortDescription: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  startingPrice: z.string().optional(),
  estimatedDays: z.number().int().positive().optional(),
  features: z.array(z.string()).optional(),
  deliverables: z.array(z.string()).optional(),
  thumbnail: z.string().url().optional().or(z.literal("")),
  gallery: z.array(z.string().url()).max(12).optional(),
  options: z.array(z.unknown()).max(30).optional(),
  fulfillmentType: z.enum(["physical", "digital", "hybrid"]).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  translations: z.object({
    id: z.object({ name: z.string().max(255).optional(), shortDescription: z.string().max(500).optional(), description: z.string().max(100000).optional(), features: z.array(z.string()).optional(), deliverables: z.array(z.string()).optional() }).optional(),
    en: z.object({ name: z.string().max(255).optional(), shortDescription: z.string().max(500).optional(), description: z.string().max(100000).optional(), features: z.array(z.string()).optional(), deliverables: z.array(z.string()).optional() }).optional(),
  }).optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.read")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const list = await db.select().from(services).orderBy(desc(services.createdAt));
    return NextResponse.json({ success: true, services: list });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.create")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const body = await request.json();
    const parsed = serviceSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } }, { status: 400 });
    const [created] = await db.insert(services).values({
      name: parsed.data.name, slug: parsed.data.slug,
      shortDescription: parsed.data.shortDescription || null, description: parsed.data.description || null,
      startingPrice: parsed.data.startingPrice || null, estimatedDays: parsed.data.estimatedDays || 7,
      features: parsed.data.features || [], deliverables: parsed.data.deliverables || [],
      thumbnail: parsed.data.thumbnail || null, gallery: parsed.data.gallery || [],
      options: (parsed.data.options || []) as ProductOption[],
      fulfillmentType: parsed.data.fulfillmentType || "physical",
      isFeatured: parsed.data.isFeatured ?? false, isActive: parsed.data.isActive ?? true,
      translations: parsed.data.translations || {},
    }).returning();
    await db.insert(auditLogs).values({ userId: session.userId, action: "SERVICE_CREATED", resource: "services", resourceId: created.id, metadata: { name: created.name } });
    return NextResponse.json({ success: true, service: created }, { status: 201 });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
