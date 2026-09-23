import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
    }

    // Fetch orders for this user
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, session.userId))
      .orderBy(desc(orders.createdAt));

    // Fetch items for each order
    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: Number(order.total),
          deliveryMethod: order.deliveryMethod,
          createdAt: order.createdAt,
          itemCount: items.length,
          itemNames: items.map(i => i.name).join(", "),
        };
      })
    );

    return NextResponse.json({ success: true, orders: ordersWithItems });
  } catch (error) {
    console.error("Account orders error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal memuat pesanan" } }, { status: 500 });
  }
}
