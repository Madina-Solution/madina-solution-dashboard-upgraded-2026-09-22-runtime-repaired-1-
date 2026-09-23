import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
    }

    await db
      .update(notifications)
      .set({ readAt: new Date(), status: "read" })
      .where(and(eq(notifications.userId, session.userId), isNull(notifications.readAt)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Read all error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 });
  }
}
