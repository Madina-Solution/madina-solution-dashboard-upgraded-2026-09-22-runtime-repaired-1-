import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { testimonials, auditLogs } from "@/db/schema";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.read")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    return NextResponse.json({ success: true, testimonials: await db.select().from(testimonials).orderBy(desc(testimonials.createdAt)) });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.create")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const body = await request.json();
    const parsed = z.object({ name: z.string().min(2), role: z.string().optional(), company: z.string().optional(), avatar: z.string().url().optional().or(z.literal("")), content: z.string().min(5), rating: z.number().int().min(1).max(5).optional(), isFeatured: z.boolean().optional() }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } }, { status: 400 });
    const [created] = await db.insert(testimonials).values({ ...parsed.data, rating: parsed.data.rating ?? 5, isFeatured: parsed.data.isFeatured ?? false }).returning();
    await db.insert(auditLogs).values({ userId: session.userId, action: "TESTIMONIAL_CREATED", resource: "testimonials", resourceId: created.id, metadata: { name: created.name } });
    return NextResponse.json({ success: true, testimonial: created }, { status: 201 });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
