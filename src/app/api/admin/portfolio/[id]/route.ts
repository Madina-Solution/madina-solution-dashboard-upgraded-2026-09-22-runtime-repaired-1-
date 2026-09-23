import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { portfolio, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { z } from "zod";
export const dynamic = "force-dynamic";
const updatePortfolioSchema = z.object({ translations: z.object({ id: z.object({ title: z.string().optional(), description: z.string().optional(), category: z.string().optional(), client: z.string().optional(), tags: z.array(z.string()).optional() }).optional(), en: z.object({ title: z.string().optional(), description: z.string().optional(), category: z.string().optional(), client: z.string().optional(), tags: z.array(z.string()).optional() }).optional() }).optional(), title: z.string().min(2).optional(), slug: z.string().regex(/^[a-z0-9-]+$/).optional(), description: z.string().optional(), category: z.string().optional(), client: z.string().optional(), tags: z.array(z.string()).optional(), thumbnail: z.string().url().optional().or(z.literal("")), images: z.array(z.string().url()).max(20).optional(), isFeatured: z.boolean().optional(), isActive: z.boolean().optional() });
type Ctx = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.update")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updatePortfolioSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } }, { status: 400 });
    const [updated] = await db.update(portfolio).set({ ...parsed.data, updatedAt: new Date() }).where(eq(portfolio.id, id)).returning();
    if (!updated) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Tidak ditemukan" } }, { status: 404 });
    await db.insert(auditLogs).values({ userId: session.userId, action: "PORTFOLIO_UPDATED", resource: "portfolio", resourceId: id, metadata: body });
    return NextResponse.json({ success: true, portfolio: updated });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
export async function DELETE(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.delete")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const { id } = await context.params;
    await db.update(portfolio).set({ isActive: false, updatedAt: new Date() }).where(eq(portfolio.id, id));
    await db.insert(auditLogs).values({ userId: session.userId, action: "PORTFOLIO_DEACTIVATED", resource: "portfolio", resourceId: id });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
