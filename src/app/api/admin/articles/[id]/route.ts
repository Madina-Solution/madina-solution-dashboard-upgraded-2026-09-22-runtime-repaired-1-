import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ensureRuntimeSchema } from "@/db/ensure-runtime-schema";
import { articles, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { sanitizeRichHtml } from "@/lib/sanitize-rich-html";
import { z } from "zod";
export const dynamic = "force-dynamic";
const articleTranslationSchema = z.object({
  title: z.string().max(255).optional(), excerpt: z.string().max(1000).optional(), content: z.string().max(100000).optional(),
  category: z.string().max(100).optional(), tags: z.array(z.string()).max(20).optional(),
  seo: z.object({ title: z.string().max(255).optional(), description: z.string().max(320).optional(), keywords: z.array(z.string()).max(20).optional(), canonicalUrl: z.string().max(500).optional(), ogTitle: z.string().max(255).optional(), ogDescription: z.string().max(320).optional(), twitterTitle: z.string().max(255).optional(), twitterDescription: z.string().max(320).optional() }).optional(),
});
const translationsSchema = z.object({ id: articleTranslationSchema.optional(), en: articleTranslationSchema.optional() }).optional();

const updateArticleSchema = z.object({
  title: z.string().min(2).optional(), slug: z.string().regex(/^[a-z0-9-]+$/).optional(), excerpt: z.string().max(1000).optional(),
  content: z.string().max(100000).optional(), category: z.string().optional(), thumbnail: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(), translations: translationsSchema, metadata: z.record(z.string(), z.unknown()).optional(), isPublished: z.boolean().optional()
});
type Ctx = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    await ensureRuntimeSchema();
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.update")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateArticleSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid", details: parsed.error.issues } }, { status: 400 });
    const updateData = {
      ...parsed.data,
      ...(parsed.data.content !== undefined ? { content: sanitizeRichHtml(parsed.data.content || "") } : {}),
      ...(parsed.data.isPublished === true ? { publishedAt: new Date() } : parsed.data.isPublished === false ? { publishedAt: null } : {}),
      updatedAt: new Date()
    };
    const [updated] = await db.update(articles).set(updateData).where(eq(articles.id, id)).returning();
    if (!updated) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Tidak ditemukan" } }, { status: 404 });
    await db.insert(auditLogs).values({ userId: session.userId, action: "ARTICLE_UPDATED", resource: "articles", resourceId: id, metadata: body });
    return NextResponse.json({ success: true, article: updated });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
export async function DELETE(request: NextRequest, context: Ctx) {
  try {
    await ensureRuntimeSchema();
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.delete")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const { id } = await context.params;
    await db.delete(articles).where(eq(articles.id, id));
    await db.insert(auditLogs).values({ userId: session.userId, action: "ARTICLE_DELETED", resource: "articles", resourceId: id });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
