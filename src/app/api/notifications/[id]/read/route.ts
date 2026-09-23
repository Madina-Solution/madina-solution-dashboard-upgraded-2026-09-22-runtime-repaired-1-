import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
    }

    const { id } = await context.params;

    // Only mark own notifications as read
    const result = await db
      .update(notifications)
      .set({ readAt: new Date(), status: "read" })
      .where(and(eq(notifications.id, id), eq(notifications.userId, session.userId)))
      .returning({ id: notifications.id });

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Notifikasi tidak ditemukan" } }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 });
  }
}
