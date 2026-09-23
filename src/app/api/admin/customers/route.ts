import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, orders } from "@/db/schema";
import { and, eq, desc, count, sum } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "customers.read")) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });

    const customerList = await db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, avatar: users.avatar, role: users.role, isActive: users.isActive, createdAt: users.createdAt }).from(users).where(eq(users.role, "customer")).orderBy(desc(users.createdAt));

    const orderStats = await db.select({ userId: orders.userId, orderCount: count(), totalSpend: sum(orders.total) }).from(orders).where(and(eq(orders.paymentStatus, "paid"), eq(orders.status, "completed"))).groupBy(orders.userId);
    const statsMap = new Map(orderStats.map(s => [s.userId, { orderCount: Number(s.orderCount), totalSpend: Number(s.totalSpend ?? 0) }]));

    const customers = customerList.map(c => ({ ...c, orderCount: statsMap.get(c.id)?.orderCount || 0, totalSpend: statsMap.get(c.id)?.totalSpend || 0 }));

    return NextResponse.json({ success: true, customers });
  } catch { return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 }); }
}
