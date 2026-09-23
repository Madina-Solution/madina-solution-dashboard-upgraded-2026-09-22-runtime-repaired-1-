import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, isNull, desc, count } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
    }

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.userId))
      .orderBy(desc(notifications.createdAt))
      .limit(30);

    const unreadResult = await db
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, session.userId), isNull(notifications.readAt)));

    return NextResponse.json({
      success: true,
      notifications: userNotifications,
      unreadCount: unreadResult[0]?.value ?? 0,
    });
  } catch (error) {
    console.error("Notifications error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal memuat notifikasi" } }, { status: 500 });
  }
}
