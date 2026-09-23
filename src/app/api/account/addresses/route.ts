import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const addressSchema = z.object({
  label: z.string().max(50).optional(),
  recipientName: z.string().min(2).max(255),
  phone: z.string().min(8).max(20),
  province: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  district: z.string().max(100).optional(),
  postalCode: z.string().max(10).optional(),
  address: z.string().min(5).max(500),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
    const list = await db.select().from(addresses).where(eq(addresses.userId, session.userId)).orderBy(desc(addresses.createdAt));
    return NextResponse.json({ success: true, addresses: list });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
    const body = await request.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } }, { status: 400 });
    const [created] = await db.insert(addresses).values({ ...parsed.data, userId: session.userId, district: parsed.data.district || null, postalCode: parsed.data.postalCode || null, isDefault: parsed.data.isDefault ?? false }).returning();
    return NextResponse.json({ success: true, address: created }, { status: 201 });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
