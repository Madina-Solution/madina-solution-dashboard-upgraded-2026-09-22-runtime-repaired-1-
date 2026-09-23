import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, subscribers, auditLogs } from "@/db/schema";
import { z } from "zod";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

const contactSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional(),
  subject: z.string().max(255).optional(),
  message: z.string().min(5).max(5000),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rl = await checkRateLimit(`contact:${ip}`, { windowMs: 60000, maxRequests: 3 });
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Terlalu banyak pesan. Coba lagi nanti." } }, { status: 429 });
    }

    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } }, { status: 400 });
    }

    // Store as audit log entry (no sender user required)
    await db.insert(auditLogs).values({
      action: "CONTACT_FORM_SUBMITTED",
      resource: "contact",
      metadata: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        subject: parsed.data.subject,
        message: parsed.data.message,
      },
    });

    return NextResponse.json({ success: true, message: "Pesan berhasil dikirim" });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal mengirim pesan" } }, { status: 500 });
  }
}
