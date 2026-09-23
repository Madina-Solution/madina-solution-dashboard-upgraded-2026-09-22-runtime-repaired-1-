import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ensureRuntimeSchema } from "@/db/ensure-runtime-schema";
import { articles, auditLogs } from "@/db/schema";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { sanitizeRichHtml } from "@/lib/sanitize-rich-html";
export const dynamic = "force-dynamic";
const articleTranslationSchema = z.object({
  title: z.string().max(255).optional(), excerpt: z.string().max(1000).optional(), content: z.string().max(100000).optional(),
  category: z.string().max(100).optional(), tags: z.array(z.string()).max(20).optional(),
  seo: z.object({ title: z.string().max(255).optional(), description: z.string().max(320).optional(), keywords: z.array(z.string()).max(20).optional(), canonicalUrl: z.string().max(500).optional(), ogTitle: z.string().max(255).optional(), ogDescription: z.string().max(320).optional(), twitterTitle: z.string().max(255).optional(), twitterDescription: z.string().max(320).optional() }).optional(),
});
const translationsSchema = z.object({ id: articleTranslationSchema.optional(), en: articleTranslationSchema.optional() }).optional();

export async function GET() {
  try {
    await ensureRuntimeSchema();
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.read")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    return NextResponse.json({ success: true, articles: await db.select().from(articles).orderBy(desc(articles.createdAt)) });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  try {
    await ensureRuntimeSchema();
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.create")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const body = await request.json();
    const parsed = z.object({
      title: z.string().min(2), slug: z.string().min(2).regex(/^[a-z0-9-]+$/), excerpt: z.string().max(1000).optional(),
      content: z.string().max(100000).optional(), category: z.string().optional(), thumbnail: z.string().url().optional().or(z.literal("")),
      tags: z.array(z.string()).optional(), translations: translationsSchema, metadata: z.record(z.string(), z.unknown()).optional(), isPublished: z.boolean().optional()
    }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } }, { status: 400 });
    const translations = parsed.data.translations ? { ...parsed.data.translations, id: parsed.data.translations.id ? { ...parsed.data.translations.id, content: sanitizeRichHtml(parsed.data.translations.id.content || "") } : undefined, en: parsed.data.translations.en ? { ...parsed.data.translations.en, content: sanitizeRichHtml(parsed.data.translations.en.content || "") } : undefined } : {};
    const [created] = await db.insert(articles).values({ ...parsed.data, translations, content: sanitizeRichHtml(parsed.data.content || ""), authorId: session.userId, tags: parsed.data.tags || [], isPublished: parsed.data.isPublished ?? false, publishedAt: parsed.data.isPublished ? new Date() : null }).returning();
    await db.insert(auditLogs).values({ userId: session.userId, action: "ARTICLE_CREATED", resource: "articles", resourceId: created.id, metadata: { title: created.title } });
    return NextResponse.json({ success: true, article: created }, { status: 201 });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
