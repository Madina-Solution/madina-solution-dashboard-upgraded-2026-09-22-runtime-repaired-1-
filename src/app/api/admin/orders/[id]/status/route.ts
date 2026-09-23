import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderStatusHistory, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { isValidTransition } from "@/lib/order-utils";
import { notify } from "@/lib/notifications/service";

export const dynamic = "force-dynamic";

const statusUpdateSchema = z.object({
  status: z.string(),
  notes: z.string().max(1000).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // Auth check
    const session = await getSession();
    if (!session || !hasPermission(session.role, "orders.update")) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = statusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } },
        { status: 400 }
      );
    }

    const { status: newStatus, notes } = parsed.data;

    // Load order
    const orderResult = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    const order = orderResult[0];

    if (!order) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Pesanan tidak ditemukan" } },
        { status: 404 }
      );
    }

    // Validate transition
    if (!isValidTransition(order.status, newStatus)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_TRANSITION", message: `Tidak dapat mengubah status dari "${order.status}" ke "${newStatus}"` } },
        { status: 400 }
      );
    }

    // Perform transactional update
    await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({
          status: newStatus as typeof order.status,
          updatedAt: new Date(),
          ...(newStatus === "completed" ? { completedAt: new Date() } : {}),
        })
        .where(eq(orders.id, id));

      await tx.insert(orderStatusHistory).values({
        orderId: id,
        status: newStatus as typeof order.status,
        notes: notes || `Status diubah oleh ${session.name}`,
        changedBy: session.userId,
      });

      await tx.insert(auditLogs).values({
        userId: session.userId,
        action: "ORDER_STATUS_CHANGED",
        resource: "orders",
        resourceId: id,
        metadata: {
          orderNumber: order.orderNumber,
          from: order.status,
          to: newStatus,
          notes,
        },
      });
    });

    if (order.userId) {
      const statusLabel = newStatus.replaceAll("_", " ");
      await notify({
        userId: order.userId,
        orderId: id,
        event: "ORDER_STATUS_CHANGED",
        title: `Status pesanan ${order.orderNumber} diperbarui`,
        message: `Pesanan ${order.orderNumber} sekarang berstatus ${statusLabel}.${notes ? ` ${notes}` : ""}`,
      });
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Gagal memperbarui status" } },
      { status: 500 }
    );
  }
}
