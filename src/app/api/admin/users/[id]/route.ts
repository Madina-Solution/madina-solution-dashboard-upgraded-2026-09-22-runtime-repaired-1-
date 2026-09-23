import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { hasPermission, canAssignRole } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "users.update")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const requestedRole = body.role ? z.enum(["super_admin", "admin", "manager", "staff", "designer", "production", "customer"]).safeParse(body.role) : null;
    if (body.role && !requestedRole?.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Role tidak valid" } }, { status: 400 });
    }

    if (body.role && !hasPermission(session.role, "users.manage")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Tidak memiliki izin mengelola role" } }, { status: 403 });
    }

    // Prevent self-demotion for super_admin
    if (id === session.userId && body.role && body.role !== session.role) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Tidak dapat mengubah role sendiri" } }, { status: 403 });
    }

    // Role escalation prevention
    if (body.role && !canAssignRole(session.role, body.role)) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Tidak dapat menetapkan role tersebut" } }, { status: 403 });
    }

    const allowed: Record<string, unknown> = {};
    if (typeof body.isActive === "boolean") allowed.isActive = body.isActive;
    if (body.role) allowed.role = body.role;
    if (body.name) allowed.name = body.name;
    if (body.phone !== undefined) allowed.phone = body.phone;

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Tidak ada perubahan" } }, { status: 400 });
    }

    const [updated] = await db.update(users).set({ ...allowed, updatedAt: new Date() }).where(eq(users.id, id)).returning({
      id: users.id, name: users.name, email: users.email, role: users.role, isActive: users.isActive,
    });

    if (!updated) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "User tidak ditemukan" } }, { status: 404 });

    await db.insert(auditLogs).values({
      userId: session.userId,
      action: body.role ? "USER_ROLE_CHANGED" : "USER_UPDATED",
      resource: "users",
      resourceId: id,
      metadata: { changes: allowed, actor: session.email },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 });
  }
}
