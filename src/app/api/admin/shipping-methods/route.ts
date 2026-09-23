import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shippingMethods, auditLogs } from "@/db/schema";
import { asc } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(2).max(120),
  courier: z.string().max(60).optional().or(z.literal("")),
  cost: z.number().min(0),
  estimatedDaysMin: z.number().int().min(0).optional(),
  estimatedDaysMax: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "settings.read")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }
    const items = await db.select().from(shippingMethods).orderBy(asc(shippingMethods.sortOrder), asc(shippingMethods.createdAt));
    return NextResponse.json({ success: true, shippingMethods: items });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal memuat metode pengiriman" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "settings.update")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } }, { status: 400 });
    }
    const [created] = await db.insert(shippingMethods).values({
      ...parsed.data,
      cost: String(parsed.data.cost),
      isActive: parsed.data.isActive ?? true,
      sortOrder: parsed.data.sortOrder ?? 0,
    }).returning();
    await db.insert(auditLogs).values({ userId: session.userId, action: "SHIPPING_METHOD_CREATED", resource: "shipping_methods", resourceId: created.id, metadata: { name: created.name } });
    return NextResponse.json({ success: true, shippingMethod: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal membuat metode pengiriman" } }, { status: 500 });
  }
}
