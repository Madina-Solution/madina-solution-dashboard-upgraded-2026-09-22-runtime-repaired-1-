import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { designRevisions, orders, orderStatusHistory, auditLogs, notifications } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { isValidTransition } from "@/lib/order-utils";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

// GET — list revisions for an order
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "design.read")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }

    const { id } = await context.params;
    const revisions = await db
      .select()
      .from(designRevisions)
      .where(eq(designRevisions.orderId, id))
      .orderBy(desc(designRevisions.revisionNumber));

    return NextResponse.json({ success: true, revisions });
  } catch (error) {
    console.error("Get revisions error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal memuat revisi" } }, { status: 500 });
  }
}

// POST — create new revision
const createRevisionSchema = z.object({
  notes: z.string().max(2000).optional(),
  fileUrl: z.string().url().optional(),
  previewUrl: z.string().url().optional(),
  orderItemId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "design.create")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }

    const { id: orderId } = await context.params;
    const body = await request.json();
    const parsed = createRevisionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } }, { status: 400 });
    }

    // Load order
    const orderResult = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    const order = orderResult[0];
    if (!order) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Pesanan tidak ditemukan" } }, { status: 404 });
    }

    // Get current max revision number
    const existing = await db
      .select({ revisionNumber: designRevisions.revisionNumber })
      .from(designRevisions)
      .where(eq(designRevisions.orderId, orderId))
      .orderBy(desc(designRevisions.revisionNumber))
      .limit(1);

    const nextNumber = (existing[0]?.revisionNumber || 0) + 1;

    await db.transaction(async (tx) => {
      // Create revision
      await tx.insert(designRevisions).values({
        orderId,
        orderItemId: parsed.data.orderItemId || null,
        designerId: session.userId,
        revisionNumber: nextNumber,
        status: "submitted",
        fileUrl: parsed.data.fileUrl || null,
        previewUrl: parsed.data.previewUrl || null,
        notes: parsed.data.notes || null,
        submittedAt: new Date(),
      });

      // Ensure order is in design_review
      if (order.status === "confirmed" && isValidTransition("confirmed", "design_review")) {
        await tx.update(orders).set({ status: "design_review", updatedAt: new Date() }).where(eq(orders.id, orderId));
        await tx.insert(orderStatusHistory).values({
          orderId, status: "design_review", notes: `Revisi desain #${nextNumber} disubmit`, changedBy: session.userId,
        });
      }

      // Notify customer
      if (order.userId) {
        await tx.insert(notifications).values({
          userId: order.userId,
          orderId,
          type: "design_submitted",
          title: "Desain siap direview",
          message: `Revisi desain #${nextNumber} untuk pesanan ${order.orderNumber} siap Anda review.`,
          channel: "in_app",
          status: "pending",
          sentAt: new Date(),
        });
      }

      // Audit
      await tx.insert(auditLogs).values({
        userId: session.userId,
        action: "DESIGN_REVISION_CREATED",
        resource: "design_revisions",
        resourceId: orderId,
        metadata: { revisionNumber: nextNumber, orderNumber: order.orderNumber },
      });
    });

    return NextResponse.json({ success: true, revisionNumber: nextNumber });
  } catch (error) {
    console.error("Create revision error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal membuat revisi" } }, { status: 500 });
  }
}
