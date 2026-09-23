import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { portfolio, auditLogs } from "@/db/schema";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.read")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const list = await db.select().from(portfolio).orderBy(desc(portfolio.createdAt));
    return NextResponse.json({ success: true, portfolio: list });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.create")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const body = await request.json();
    const parsed = z.object({ translations: z.object({ id: z.object({ title: z.string().optional(), description: z.string().optional(), category: z.string().optional(), client: z.string().optional(), tags: z.array(z.string()).optional() }).optional(), en: z.object({ title: z.string().optional(), description: z.string().optional(), category: z.string().optional(), client: z.string().optional(), tags: z.array(z.string()).optional() }).optional() }).optional(), title: z.string().min(2), slug: z.string().min(2).regex(/^[a-z0-9-]+$/), description: z.string().optional(), category: z.string().optional(), client: z.string().optional(), tags: z.array(z.string()).optional(), thumbnail: z.string().url().optional().or(z.literal("")), images: z.array(z.string().url()).max(20).optional(), isFeatured: z.boolean().optional(), isActive: z.boolean().optional() }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } }, { status: 400 });
    const [created] = await db.insert(portfolio).values({ ...parsed.data, translations: parsed.data.translations || {}, tags: parsed.data.tags || [], isActive: parsed.data.isActive ?? true, isFeatured: parsed.data.isFeatured ?? false }).returning();
    await db.insert(auditLogs).values({ userId: session.userId, action: "PORTFOLIO_CREATED", resource: "portfolio", resourceId: created.id, metadata: { title: created.title } });
    return NextResponse.json({ success: true, portfolio: created }, { status: 201 });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
