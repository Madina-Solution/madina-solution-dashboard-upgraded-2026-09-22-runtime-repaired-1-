import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, categories } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "products.read")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }

    const list = await db
      .select({
        id: products.id, name: products.name, slug: products.slug,
        basePrice: products.basePrice, unit: products.unit,
        isFeatured: products.isFeatured, isActive: products.isActive,
        shortDescription: products.shortDescription, thumbnail: products.thumbnail, gallery: products.gallery,
        categoryId: products.categoryId,
        createdAt: products.createdAt,
      })
      .from(products)
      .orderBy(desc(products.createdAt));

    return NextResponse.json({ success: true, products: list });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 });
  }
}
