import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { paymentMethods, auditLogs } from "@/db/schema";
import { asc } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  type: z.enum(["bank_transfer", "gateway"]),
  name: z.string().min(2).max(120),
  bankName: z.string().max(120).optional().or(z.literal("")),
  accountNumber: z.string().max(60).optional().or(z.literal("")),
  accountHolder: z.string().max(120).optional().or(z.literal("")),
  logo: z.string().url().optional().or(z.literal("")),
  instructions: z.string().max(1000).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "settings.read")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }
    const items = await db.select().from(paymentMethods).orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.createdAt));
    return NextResponse.json({ success: true, paymentMethods: items });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal memuat metode pembayaran" } }, { status: 500 });
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
    const [created] = await db.insert(paymentMethods).values({
      ...parsed.data,
      isActive: parsed.data.isActive ?? true,
      sortOrder: parsed.data.sortOrder ?? 0,
    }).returning();
    await db.insert(auditLogs).values({ userId: session.userId, action: "PAYMENT_METHOD_CREATED", resource: "payment_methods", resourceId: created.id, metadata: { name: created.name } });
    return NextResponse.json({ success: true, paymentMethod: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal membuat metode pembayaran" } }, { status: 500 });
  }
}
