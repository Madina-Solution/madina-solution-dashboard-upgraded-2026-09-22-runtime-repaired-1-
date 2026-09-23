import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, auditLogs } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

const updateCategorySchema = z.object({
  name: z.string().min(2).max(255).optional(),
  slug: z.string().min(2).max(255).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(1000).nullable().optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  image: z.string().url().optional().or(z.literal("")),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "categories.update")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } }, { status: 400 });
    }

    // Slug uniqueness check if updating slug
    if (parsed.data.slug) {
      const existing = await db.select({ id: categories.id }).from(categories)
        .where(and(eq(categories.slug, parsed.data.slug), ne(categories.id, id)))
        .limit(1);
      if (existing.length > 0) {
        return NextResponse.json({ success: false, error: { code: "SLUG_EXISTS", message: "Slug sudah digunakan" } }, { status: 409 });
      }
    }

    const [updated] = await db.update(categories)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Kategori tidak ditemukan" } }, { status: 404 });
    }

    await db.insert(auditLogs).values({
      userId: session.userId, action: "CATEGORY_UPDATED", resource: "categories", resourceId: id, metadata: parsed.data,
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal memperbarui kategori" } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "categories.delete")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }

    const { id } = await context.params;

    const [deleted] = await db.update(categories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Kategori tidak ditemukan" } }, { status: 404 });
    }

    await db.insert(auditLogs).values({
      userId: session.userId, action: "CATEGORY_DEACTIVATED", resource: "categories", resourceId: id, metadata: { name: deleted.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal menghapus kategori" } }, { status: 500 });
  }
}
