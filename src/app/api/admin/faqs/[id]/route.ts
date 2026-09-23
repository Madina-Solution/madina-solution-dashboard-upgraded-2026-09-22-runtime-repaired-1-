import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { faqs, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

type Ctx = { params: Promise<{ id: string }> };

const faqPatchSchema = z.object({
  question: z.string().min(3).optional(),
  answer: z.string().min(3).optional(),
  category: z.string().optional(),
  order: z.number().optional(),
  translations: z.object({ id: z.object({ question: z.string().optional(), answer: z.string().optional(), category: z.string().optional() }).optional(), en: z.object({ question: z.string().optional(), answer: z.string().optional(), category: z.string().optional() }).optional() }).optional(),
});


export const dynamic = "force-dynamic";
export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.update")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const { id } = await context.params;
    const body = await request.json();
    const parsed = faqPatchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } }, { status: 400 });
    const [updated] = await db.update(faqs).set({ ...parsed.data, updatedAt: new Date() }).where(eq(faqs.id, id)).returning();
    if (!updated) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Tidak ditemukan" } }, { status: 404 });
    await db.insert(auditLogs).values({ userId: session.userId, action: "FAQ_UPDATED", resource: "faqs", resourceId: id, metadata: body });
    return NextResponse.json({ success: true, faq: updated });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.delete")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const { id } = await context.params;
    await db.delete(faqs).where(eq(faqs.id, id));
    await db.insert(auditLogs).values({ userId: session.userId, action: "FAQ_DELETED", resource: "faqs", resourceId: id });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
