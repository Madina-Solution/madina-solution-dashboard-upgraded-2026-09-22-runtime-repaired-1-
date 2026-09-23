import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, designRevisions, orderStatusHistory, notifications, auditLogs } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { isValidTransition } from "@/lib/order-utils";

export const dynamic = "force-dynamic";

const reviewSchema = z.object({
  revisionId: z.string().uuid(),
  action: z.enum(["approve", "request_revision"]),
  feedback: z.string().max(2000).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
    }

    const { id: orderId } = await context.params;
    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } }, { status: 400 });
    }

    // Verify ownership
    const orderResult = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, session.userId)))
      .limit(1);

    const order = orderResult[0];
    if (!order) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Pesanan tidak ditemukan" } }, { status: 404 });
    }

    // Verify revision belongs to this order
    const revisionResult = await db
      .select()
      .from(designRevisions)
      .where(and(eq(designRevisions.id, parsed.data.revisionId), eq(designRevisions.orderId, orderId)))
      .limit(1);

    const revision = revisionResult[0];
    if (!revision) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Revisi tidak ditemukan" } }, { status: 404 });
    }

    const { action, feedback } = parsed.data;

    await db.transaction(async (tx) => {
      if (action === "approve") {
        // Update revision
        await tx.update(designRevisions).set({
          status: "approved",
          customerFeedback: feedback || "Disetujui",
          approvedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(designRevisions.id, revision.id));

        // Move order to design_approved
        if (order.status === "design_review" && isValidTransition("design_review", "design_approved")) {
          await tx.update(orders).set({ status: "design_approved", updatedAt: new Date() }).where(eq(orders.id, orderId));
          await tx.insert(orderStatusHistory).values({
            orderId, status: "design_approved", notes: `Desain revisi #${revision.revisionNumber} disetujui oleh pelanggan`, changedBy: session.userId,
          });
        }

        // Notify designer
        if (order.assignedDesigner) {
          await tx.insert(notifications).values({
            userId: order.assignedDesigner,
            orderId,
            type: "design_approved",
            title: "Desain disetujui",
            message: `Pelanggan menyetujui desain revisi #${revision.revisionNumber} untuk ${order.orderNumber}`,
            channel: "in_app",
            status: "pending",
            sentAt: new Date(),
          });
        }
      } else {
        // Request revision
        await tx.update(designRevisions).set({
          status: "revision_requested",
          customerFeedback: feedback || "Perlu perbaikan",
          updatedAt: new Date(),
        }).where(eq(designRevisions.id, revision.id));

        // Notify designer
        if (order.assignedDesigner) {
          await tx.insert(notifications).values({
            userId: order.assignedDesigner,
            orderId,
            type: "design_revision_requested",
            title: "Revisi diminta",
            message: `Pelanggan meminta revisi untuk ${order.orderNumber}: ${feedback || "Perlu perbaikan"}`,
            channel: "in_app",
            status: "pending",
            sentAt: new Date(),
          });
        }
      }

      // Audit
      await tx.insert(auditLogs).values({
        userId: session.userId,
        action: action === "approve" ? "DESIGN_APPROVED" : "DESIGN_REVISION_REQUESTED",
        resource: "design_revisions",
        resourceId: revision.id,
        metadata: { orderNumber: order.orderNumber, revisionNumber: revision.revisionNumber, feedback },
      });
    });

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error("Design review error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal memproses review" } }, { status: 500 });
  }
}
