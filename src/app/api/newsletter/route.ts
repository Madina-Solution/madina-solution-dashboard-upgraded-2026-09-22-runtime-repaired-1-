import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

const newsletterSchema = z.object({
  email: z.string().email("Format email tidak valid").max(255),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rl = await checkRateLimit(`newsletter:${ip}`, { windowMs: 60000, maxRequests: 3 });
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Coba lagi nanti" } }, { status: 429 });
    }

    const body = await request.json();
    const parsed = newsletterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Email tidak valid" } }, { status: 400 });
    }

    // Check duplicate
    const existing = await db.select({ id: subscribers.id }).from(subscribers).where(eq(subscribers.email, parsed.data.email.toLowerCase())).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ success: true, message: "Email sudah terdaftar" });
    }

    await db.insert(subscribers).values({ email: parsed.data.email.toLowerCase() });

    return NextResponse.json({ success: true, message: "Berhasil berlangganan!" }, { status: 201 });
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 });
  }
}
