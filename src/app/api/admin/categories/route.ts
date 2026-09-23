import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, auditLogs } from "@/db/schema";
import { eq, desc, asc, ilike } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

const createCategorySchema = z.object({
  name: z.string().min(2).max(255),
  slug: z.string().min(2).max(255).regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan dash"),
  description: z.string().max(1000).optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  image: z.string().url().optional().or(z.literal("")),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "categories.read")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }

    const list = await db.select().from(categories).orderBy(asc(categories.order), asc(categories.name));
    return NextResponse.json({ success: true, categories: list });
  } catch (error) {
    console.error("List categories error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal memuat kategori" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "categories.create")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid", details: parsed.error.issues } }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, parsed.data.slug)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ success: false, error: { code: "SLUG_EXISTS", message: "Slug sudah digunakan" } }, { status: 409 });
    }

    const [created] = await db.insert(categories).values({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      order: parsed.data.order ?? 0,
      isActive: parsed.data.isActive ?? true,
      image: parsed.data.image || null,
    }).returning();

    await db.insert(auditLogs).values({
      userId: session.userId,
      action: "CATEGORY_CREATED",
      resource: "categories",
      resourceId: created.id,
      metadata: { name: created.name, slug: created.slug },
    });

    return NextResponse.json({ success: true, category: created }, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal membuat kategori" } }, { status: 500 });
  }
}
