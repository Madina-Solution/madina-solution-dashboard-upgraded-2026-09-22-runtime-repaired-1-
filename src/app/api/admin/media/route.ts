import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { media, users, auditLogs } from "@/db/schema";
import { desc, eq, ilike, or, count, isNull, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "media.read")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }

    const url = request.nextUrl;
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(url.searchParams.get("limit") || "30"));
    const purpose = url.searchParams.get("purpose") || "";
    const q = url.searchParams.get("q") || "";
    const offset = (page - 1) * limit;

    const conditions = [isNull(media.deletedAt)];
    if (purpose) conditions.push(eq(media.purpose, purpose));
    if (q) conditions.push(or(ilike(media.originalFilename, `%${q}%`), ilike(media.mimeType, `%${q}%`))!);

    const whereClause = conditions.length ? and(...conditions) : undefined;
    const [totalResult] = await db.select({ value: count() }).from(media).where(whereClause);

    const list = await db.select({
      id: media.id, filename: media.originalFilename, mimeType: media.mimeType,
      size: media.size, url: media.url, purpose: media.purpose, visibility: media.visibility,
      createdAt: media.createdAt, uploaderName: users.name,
    }).from(media).leftJoin(users, eq(media.userId, users.id))
      .where(whereClause)
      .orderBy(desc(media.createdAt)).limit(limit).offset(offset);

    return NextResponse.json({
      success: true,
      media: list,
      pagination: { page, limit, total: totalResult?.value ?? 0, totalPages: Math.ceil((totalResult?.value ?? 0) / limit) },
    });
  } catch (error) {
    console.error("Media list error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 });
  }
}
