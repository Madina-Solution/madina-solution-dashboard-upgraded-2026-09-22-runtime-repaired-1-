import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ALLOWED_SETTING_KEYS = new Set([
  "site_name", "site_tagline", "site_logo", "site_icon", "site_email", "site_phone", "site_address", "site_whatsapp", "site_url",
  "seo_title", "seo_description", "seo_keywords", "seo_og_image", "seo_twitter_handle",
  "topbar_enabled", "topbar_text",
  "hero_badge", "hero_title", "hero_description", "hero_image", "hero_image_alt", "cta_title", "cta_description",
  "maps_embed_url",
  "adsense_enabled", "adsense_client", "adsense_publisher_id", "adsense_slot_top", "adsense_slot_footer", "adsense_slot_product", "adsense_slot_article",
  "privacy_policy_version", "cookie_policy_version",
]);

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "settings.read")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }

    const list = await db.select().from(settings);
    const map: Record<string, unknown> = {};
    list.forEach(s => { map[s.key] = s.value; });

    // Merge with env-based status (never expose actual secrets)
    map._integrations = {
      payment: process.env.PAYMENT_PROVIDER || "mock",
      storage: process.env.CLOUDINARY_CLOUD_NAME ? "cloudinary" : "local",
      email: process.env.EMAIL_PROVIDER === "resend" && process.env.RESEND_API_KEY && process.env.EMAIL_FROM ? "configured" : "not_configured",
      firebase: process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "configured" : "not_configured",
      database: "connected",
    };

    return NextResponse.json({ success: true, settings: map });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "settings.update")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }

    const body = await request.json();
    const parsed = z.record(z.string(), z.unknown()).safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Format pengaturan tidak valid" } }, { status: 400 });
    const entries = Object.entries(parsed.data).filter(([k]) => !k.startsWith("_"));
    const unknownKeys = entries.map(([key]) => key).filter((key) => !ALLOWED_SETTING_KEYS.has(key));
    if (unknownKeys.length) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: `Pengaturan tidak dikenal: ${unknownKeys.join(", ")}` } }, { status: 400 });
    const mapValue = entries.find(([k]) => k === "maps_embed_url");
    if (mapValue) {
      const raw = mapValue[1] && typeof mapValue[1] === "object" && "value" in (mapValue[1] as Record<string, unknown>) ? (mapValue[1] as Record<string, unknown>).value : mapValue[1];
      if (typeof raw !== "string" || (raw && !/^https:\/\/www\.google\.com\/maps\/embed/i.test(raw))) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "URL Google Maps embed tidak valid" } }, { status: 400 });
    }

    for (const [key, value] of entries) {
      const existing = await db.select({ id: settings.id }).from(settings).where(eq(settings.key, key)).limit(1);
      if (existing.length > 0) {
        const storedValue = value && typeof value === "object" && "value" in (value as Record<string, unknown>) ? value : { value };
        await db.update(settings).set({ value: storedValue as Record<string, unknown>, updatedAt: new Date() }).where(eq(settings.key, key));
      } else {
        const storedValue = value && typeof value === "object" && "value" in (value as Record<string, unknown>) ? value : { value };
        await db.insert(settings).values({ key, value: storedValue as Record<string, unknown> });
      }
    }

    await db.insert(auditLogs).values({
      userId: session.userId, action: "SETTINGS_UPDATED", resource: "settings",
      metadata: { keys: Object.keys(body).filter(k => !k.startsWith("_")) },
    });

    return NextResponse.json({ success: true, message: "Pengaturan disimpan" });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal menyimpan" } }, { status: 500 });
  }
}
