import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { faqs, auditLogs } from "@/db/schema";
import { asc } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.read")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const list = await db.select().from(faqs).orderBy(asc(faqs.order));
    return NextResponse.json({ success: true, faqs: list });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.create")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const body = await request.json();
    const parsed = z.object({ translations: z.object({ id: z.object({ question: z.string().optional(), answer: z.string().optional(), category: z.string().optional() }).optional(), en: z.object({ question: z.string().optional(), answer: z.string().optional(), category: z.string().optional() }).optional() }).optional(), question: z.string().min(3), answer: z.string().min(3), category: z.string().optional(), order: z.number().optional() }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } }, { status: 400 });
    const [created] = await db.insert(faqs).values({ translations: parsed.data.translations || {}, question: parsed.data.question, answer: parsed.data.answer, category: parsed.data.category || null, order: parsed.data.order ?? 0 }).returning();
    await db.insert(auditLogs).values({ userId: session.userId, action: "FAQ_CREATED", resource: "faqs", resourceId: created.id, metadata: { question: created.question } });
    return NextResponse.json({ success: true, faq: created }, { status: 201 });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
