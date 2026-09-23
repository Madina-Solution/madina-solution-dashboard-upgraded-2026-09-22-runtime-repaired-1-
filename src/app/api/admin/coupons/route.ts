import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { coupons, auditLogs } from "@/db/schema";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "coupons.read")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    return NextResponse.json({ success: true, coupons: await db.select().from(coupons).orderBy(desc(coupons.createdAt)) });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "coupons.create")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    const body = await request.json();
    const parsed = z.object({ code: z.string().min(3).max(50), description: z.string().optional(), discountType: z.enum(["percentage", "fixed"]), discountValue: z.string(), minPurchase: z.string().optional(), maxDiscount: z.string().optional(), usageLimit: z.number().int().positive().optional(), startDate: z.string().optional(), endDate: z.string().optional(), isActive: z.boolean().optional() }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } }, { status: 400 });
    const [created] = await db.insert(coupons).values({ ...parsed.data, code: parsed.data.code.toUpperCase(), startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null, endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null, isActive: parsed.data.isActive ?? true }).returning();
    await db.insert(auditLogs).values({ userId: session.userId, action: "COUPON_CREATED", resource: "coupons", resourceId: created.id, metadata: { code: created.code } });
    return NextResponse.json({ success: true, coupon: created }, { status: 201 });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
