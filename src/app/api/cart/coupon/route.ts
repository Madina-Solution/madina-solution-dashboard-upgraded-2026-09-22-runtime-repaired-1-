import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const couponSchema = z.object({
  code: z.string().min(1).max(50),
  subtotal: z.number().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = couponSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Kode kupon wajib diisi" } }, { status: 400 });

    const [coupon] = await db.select().from(coupons).where(and(eq(coupons.code, parsed.data.code.toUpperCase()), eq(coupons.isActive, true))).limit(1);

    if (!coupon) return NextResponse.json({ success: false, error: { code: "INVALID_COUPON", message: "Kupon tidak ditemukan atau tidak aktif" } }, { status: 404 });

    // Check expiry
    if (coupon.endDate && new Date(coupon.endDate) < new Date()) {
      return NextResponse.json({ success: false, error: { code: "EXPIRED", message: "Kupon sudah kedaluwarsa" } }, { status: 400 });
    }

    // Check usage limit
    if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
      return NextResponse.json({ success: false, error: { code: "LIMIT_REACHED", message: "Kupon sudah mencapai batas penggunaan" } }, { status: 400 });
    }

    // Check minimum purchase
    if (coupon.minPurchase && parsed.data.subtotal < Number(coupon.minPurchase)) {
      return NextResponse.json({ success: false, error: { code: "MIN_PURCHASE", message: `Minimum pembelian ${coupon.minPurchase}` } }, { status: 400 });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = (parsed.data.subtotal * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
    } else {
      discount = Number(coupon.discountValue);
    }

    discount = Math.min(discount, parsed.data.subtotal);

    return NextResponse.json({
      success: true,
      coupon: { id: coupon.id, code: coupon.code, discountType: coupon.discountType, discountValue: Number(coupon.discountValue), discount },
    });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal validasi kupon" } }, { status: 500 }); }
}
