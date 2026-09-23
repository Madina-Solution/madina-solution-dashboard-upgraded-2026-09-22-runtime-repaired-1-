import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { navigationItems, auditLogs } from "@/db/schema";
import { asc } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { QUICK_NAV_ICON_KEYS } from "@/lib/navigation";

export const dynamic = "force-dynamic";

const navigationItemSchema = z.object({
  group: z.enum(["services", "products", "explore"]),
  name: z.string().trim().min(2).max(120),
  href: z.string().trim().min(1).max(255),
  icon: z.enum(QUICK_NAV_ICON_KEYS as [string, ...string[]]),
  description: z.string().trim().max(160).optional().nullable(),
  translations: z.object({ id: z.object({ name: z.string().max(120).optional(), description: z.string().max(160).optional().nullable() }).optional(), en: z.object({ name: z.string().max(120).optional(), description: z.string().max(160).optional().nullable() }).optional() }).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.read")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }
    const list = await db.select().from(navigationItems).orderBy(asc(navigationItems.group), asc(navigationItems.sortOrder));
    return NextResponse.json({ success: true, items: list });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal memuat data navigasi" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "content.create")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }
    const body = await request.json();
    const parsed = navigationItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid" } }, { status: 400 });
    }
    const [created] = await db
      .insert(navigationItems)
      .values({
        group: parsed.data.group,
        name: parsed.data.name,
        href: parsed.data.href,
        icon: parsed.data.icon,
        description: parsed.data.description || null,
        translations: parsed.data.translations || {},
        sortOrder: parsed.data.sortOrder ?? 0,
        isActive: parsed.data.isActive ?? true,
      })
      .returning();
    await db.insert(auditLogs).values({ userId: session.userId, action: "NAVIGATION_ITEM_CREATED", resource: "navigation_items", resourceId: created.id, metadata: { name: created.name, group: created.group } });
    return NextResponse.json({ success: true, item: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal menyimpan menu" } }, { status: 500 });
  }
}
