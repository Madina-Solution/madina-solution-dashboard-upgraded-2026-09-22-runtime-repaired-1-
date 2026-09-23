import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { designRevisions, orders } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string; revisionId: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
  const { id, revisionId } = await context.params;
  const [row] = await db.select({ fileUrl: designRevisions.fileUrl, orderId: orders.id, paymentStatus: orders.paymentStatus, status: orders.status }).from(designRevisions).innerJoin(orders, eq(designRevisions.orderId, orders.id)).where(and(eq(designRevisions.id, revisionId), eq(orders.id, id), eq(orders.userId, session.userId))).limit(1);
  if (!row) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "File revisi tidak ditemukan" } }, { status: 404 });
  if (row.paymentStatus !== "paid" || row.status !== "completed" || !row.fileUrl) return NextResponse.json({ success: false, error: { code: "FILE_LOCKED", message: "File final belum tersedia" } }, { status: 403 });
  return NextResponse.redirect(row.fileUrl, 302);
}
