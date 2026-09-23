import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { favorites, products } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
    const list = await db.select({ id: favorites.id, productId: favorites.productId, createdAt: favorites.createdAt, productName: products.name, productSlug: products.slug, productPrice: products.basePrice, productUnit: products.unit, productThumbnail: products.thumbnail }).from(favorites).leftJoin(products, eq(favorites.productId, products.id)).where(eq(favorites.userId, session.userId)).orderBy(desc(favorites.createdAt));
    return NextResponse.json({ success: true, favorites: list });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
    const body = await request.json();
    const parsed = z.object({ productId: z.string().uuid() }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Product ID wajib" } }, { status: 400 });
    // Check if already favorited
    const existing = await db.select({ id: favorites.id }).from(favorites).where(and(eq(favorites.userId, session.userId), eq(favorites.productId, parsed.data.productId))).limit(1);
    if (existing.length > 0) return NextResponse.json({ success: true, message: "Sudah di favorit" });
    await db.insert(favorites).values({ userId: session.userId, productId: parsed.data.productId });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
