import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, orders, auditLogs } from "@/db/schema";
import { desc, eq, ilike, or, count, sum, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "users.read")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }

    const url = request.nextUrl;
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const q = url.searchParams.get("q") || "";
    const role = url.searchParams.get("role") || "";
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [];
    if (q) {
      const term = `%${q}%`;
      conditions.push(or(ilike(users.name, term), ilike(users.email, term)));
    }
    if (role) conditions.push(eq(users.role, role as typeof users.role.enumValues[number]));

    const where = conditions.length > 0 ? sql`${sql.join(conditions.map(c => c!), sql` AND `)}` : undefined;

    const [totalResult] = await db.select({ value: count() }).from(users).where(where);
    const list = await db.select({
      id: users.id, name: users.name, email: users.email, phone: users.phone, avatar: users.avatar,
      role: users.role, isActive: users.isActive, createdAt: users.createdAt,
    }).from(users).where(where).orderBy(desc(users.createdAt)).limit(limit).offset(offset);

    // Get order stats
    const statsResult = await db.select({ userId: orders.userId, orderCount: count(), totalSpend: sum(orders.total) }).from(orders).groupBy(orders.userId);
    const statsMap = new Map(statsResult.map(s => [s.userId, { orderCount: Number(s.orderCount), totalSpend: Number(s.totalSpend ?? 0) }]));

    const enriched = list.map(u => ({ ...u, orderCount: statsMap.get(u.id)?.orderCount || 0, totalSpend: statsMap.get(u.id)?.totalSpend || 0 }));

    return NextResponse.json({
      success: true,
      users: enriched,
      pagination: { page, limit, total: totalResult?.value ?? 0, totalPages: Math.ceil((totalResult?.value ?? 0) / limit) },
    });
  } catch (error) {
    console.error("Users list error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal memuat users" } }, { status: 500 });
  }
}
