import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { testimonials, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { z } from "zod";
export const dynamic = "force-dynamic";
const updateTestimonialSchema = z.object({ name: z.string().min(2).optional(), role: z.string().optional(), company: z.string().optional(), avatar: z.string().url().optional().or(z.literal("")), content: z.string().min(5).optional(), rating: z.number().int().min(1).max(5).optional(), isFeatured: z.boolean().optional(), isActive: z.boolean().optional() });
type Ctx = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.update")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateTestimonialSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } }, { status: 400 });
    const [updated] = await db.update(testimonials).set(body).where(eq(testimonials.id, id)).returning();
    if (!updated) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Tidak ditemukan" } }, { status: 404 });
    await db.insert(auditLogs).values({ userId: session.userId, action: "TESTIMONIAL_UPDATED", resource: "testimonials", resourceId: id, metadata: body });
    return NextResponse.json({ success: true, testimonial: updated });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
export async function DELETE(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.delete")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const { id } = await context.params;
    await db.delete(testimonials).where(eq(testimonials.id, id));
    await db.insert(auditLogs).values({ userId: session.userId, action: "TESTIMONIAL_DELETED", resource: "testimonials", resourceId: id });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
