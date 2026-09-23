import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { media, auditLogs, users } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getStorageProvider } from "@/lib/media/storage";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "media.read")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }
    const { id } = await context.params;
    const [item] = await db.select({
      id: media.id, filename: media.originalFilename, mimeType: media.mimeType, size: media.size, url: media.url,
      purpose: media.purpose, visibility: media.visibility, status: media.status, storageProvider: media.storageProvider,
      storageKey: media.storageKey, metadata: media.metadata, createdAt: media.createdAt, uploaderName: users.name,
    }).from(media).leftJoin(users, eq(media.userId, users.id)).where(and(eq(media.id, id), isNull(media.deletedAt))).limit(1);
    if (!item) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Media tidak ditemukan" } }, { status: 404 });
    return NextResponse.json({ success: true, media: item });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal mengambil media" } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: Ctx) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "media.delete")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ditolak" } }, { status: 403 });
    }

    const { id } = await context.params;

    const [item] = await db.select({ id: media.id, filename: media.originalFilename, storageKey: media.storageKey, deletedAt: media.deletedAt })
      .from(media).where(and(eq(media.id, id), isNull(media.deletedAt))).limit(1);
    if (!item) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "File tidak ditemukan" } }, { status: 404 });

    const storage = await getStorageProvider();
    try { await storage.delete(item.storageKey); } catch (error) {
      console.error("Media storage delete error:", error);
      return NextResponse.json({ success: false, error: { code: "STORAGE_DELETE_FAILED", message: "File belum dapat dihapus dari storage" } }, { status: 502 });
    }

    const [deleted] = await db.update(media).set({ deletedAt: new Date(), status: "deleted" }).where(and(eq(media.id, id), isNull(media.deletedAt))).returning({ id: media.id, filename: media.originalFilename });
    if (!deleted) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "File tidak ditemukan" } }, { status: 404 });

    await db.insert(auditLogs).values({
      userId: session.userId, action: "MEDIA_DELETED", resource: "media", resourceId: id,
      metadata: { filename: deleted.filename },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal" } }, { status: 500 });
  }
}
