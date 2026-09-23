import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await deleteSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Gagal logout" } },
      { status: 500 }
    );
  }
}
