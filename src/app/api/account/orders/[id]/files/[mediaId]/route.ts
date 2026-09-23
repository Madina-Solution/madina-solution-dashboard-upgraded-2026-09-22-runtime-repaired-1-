import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { media, orders } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string; mediaId: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
  const { id, mediaId } = await context.params;
  const [order] = await db.select({ id: orders.id, paymentStatus: orders.paymentStatus, status: orders.status }).from(orders).where(and(eq(orders.id, id), eq(orders.userId, session.userId))).limit(1);
  if (!order) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Pesanan tidak ditemukan" } }, { status: 404 });
  if (order.paymentStatus !== "paid" || order.status !== "completed") return NextResponse.json({ success: false, error: { code: "FILE_LOCKED", message: "File tersedia setelah pembayaran terverifikasi dan pesanan selesai" } }, { status: 403 });
  const [item] = await db.select({ url: media.url, mimeType: media.mimeType, filename: media.originalFilename }).from(media).where(and(eq(media.id, mediaId), eq(media.orderId, id), isNull(media.deletedAt))).limit(1);
  if (!item) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "File tidak ditemukan" } }, { status: 404 });
  return NextResponse.redirect(item.url, 302);
}
