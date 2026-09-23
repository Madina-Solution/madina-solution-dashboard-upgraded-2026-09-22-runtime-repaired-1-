import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews, orders, orderItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: true, review: null });

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const serviceId = searchParams.get("serviceId");
    if (!productId && !serviceId) return NextResponse.json({ success: true, review: null });

    const where = productId
      ? and(eq(reviews.productId, productId), eq(reviews.userId, session.userId))
      : and(eq(reviews.serviceId, serviceId!), eq(reviews.userId, session.userId));
    const [review] = await db.select({ rating: reviews.rating, comment: reviews.comment }).from(reviews).where(where).limit(1);
    return NextResponse.json({ success: true, review: review ?? null });
  } catch {
    return NextResponse.json({ success: true, review: null });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login untuk memberi ulasan" } }, { status: 401 });
    }

    const body = await request.json();
    const productId = typeof body.productId === "string" ? body.productId : null;
    const serviceId = typeof body.serviceId === "string" ? body.serviceId : null;
    const rating = Number(body.rating);
    const comment = typeof body.comment === "string" ? body.comment.trim() : null;

    if ((!productId && !serviceId) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Rating (1-5) dan produk/layanan wajib diisi" } }, { status: 400 });
    }
    if (comment && comment.length > 1000) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Komentar maksimal 1000 karakter" } }, { status: 400 });
    }

    // Verified purchase: does this customer have a completed order containing this product?
    let isVerified = false;
    if (productId) {
      const [purchase] = await db
        .select({ id: orders.id })
        .from(orders)
        .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
        .where(and(eq(orders.userId, session.userId), eq(orders.status, "completed"), eq(orderItems.productId, productId)))
        .limit(1);
      isVerified = !!purchase;
    }

    // One review per customer per product/service — resubmitting updates the existing one
    // (and sends it back to the moderation queue, since the content changed).
    const existingWhere = productId
      ? and(eq(reviews.userId, session.userId), eq(reviews.productId, productId))
      : and(eq(reviews.userId, session.userId), eq(reviews.serviceId, serviceId!));
    const [existing] = await db.select({ id: reviews.id }).from(reviews).where(existingWhere).limit(1);

    if (existing) {
      const [updated] = await db
        .update(reviews)
        .set({ rating, comment, isVerified, isApproved: false, updatedAt: new Date() })
        .where(eq(reviews.id, existing.id))
        .returning();
      return NextResponse.json({ success: true, item: updated, message: "Ulasan diperbarui dan menunggu persetujuan admin" });
    }

    const [created] = await db
      .insert(reviews)
      .values({ userId: session.userId, productId, serviceId, rating, comment, isVerified, isApproved: false })
      .returning();
    return NextResponse.json({ success: true, item: created, message: "Terima kasih! Ulasan Anda menunggu persetujuan admin" }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal mengirim ulasan" } }, { status: 500 });
  }
}
