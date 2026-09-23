import { NextResponse } from "next/server";
import { getSiteSettingsMap } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSiteSettingsMap();
  const raw = settings.adsense_publisher_id;
  const publisherId = raw && typeof raw === "object" && "value" in raw ? (raw as { value?: unknown }).value : raw;
  if (typeof publisherId !== "string" || !publisherId.trim()) return new NextResponse("# AdSense publisher ID belum dikonfigurasi\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const normalized = publisherId.trim().replace(/^pub-/, "");
  return new NextResponse(`google.com, pub-${normalized}, DIRECT, f08c47fec0942fa0\n`, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
