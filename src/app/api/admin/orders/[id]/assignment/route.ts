import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, users, auditLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

const assignmentSchema = z.object({
  designerId: z.string().uuid().nullable().optional(),
  productionId: z.string().uuid().nullable().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  estimatedCompletion: z.string().datetime().nullable().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "orders.assign")) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = assignmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } },
        { status: 400 }
      );
    }

    // Verify order exists
    const orderResult = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, id)).limit(1);
    if (!orderResult[0]) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Pesanan tidak ditemukan" } }, { status: 404 });
    }

    const data = parsed.data;
    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    const metadata: Record<string, unknown> = {};

    // Validate designer role if assigning
    if (data.designerId !== undefined) {
      if (data.designerId) {
        const designer = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, data.designerId)).limit(1);
        if (!designer[0] || !["designer", "admin", "super_admin"].includes(designer[0].role)) {
          return NextResponse.json({ success: false, error: { code: "INVALID_ROLE", message: "User bukan designer" } }, { status: 400 });
        }
      }
      updateFields.assignedDesigner = data.designerId;
      metadata.assignedDesigner = data.designerId;
    }

    // Validate production role if assigning
    if (data.productionId !== undefined) {
      if (data.productionId) {
        const prod = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, data.productionId)).limit(1);
        if (!prod[0] || !["production", "admin", "super_admin"].includes(prod[0].role)) {
          return NextResponse.json({ success: false, error: { code: "INVALID_ROLE", message: "User bukan production" } }, { status: 400 });
        }
      }
      updateFields.assignedProduction = data.productionId;
      metadata.assignedProduction = data.productionId;
    }

    if (data.priority) {
      updateFields.priority = data.priority;
      metadata.priority = data.priority;
    }

    if (data.estimatedCompletion !== undefined) {
      updateFields.estimatedCompletion = data.estimatedCompletion ? new Date(data.estimatedCompletion) : null;
      metadata.estimatedCompletion = data.estimatedCompletion;
    }

    await db.transaction(async (tx) => {
      await tx.update(orders).set(updateFields).where(eq(orders.id, id));
      await tx.insert(auditLogs).values({
        userId: session.userId,
        action: "ORDER_ASSIGNMENT_UPDATED",
        resource: "orders",
        resourceId: id,
        metadata,
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Assignment error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal memperbarui assignment" } }, { status: 500 });
  }
}
