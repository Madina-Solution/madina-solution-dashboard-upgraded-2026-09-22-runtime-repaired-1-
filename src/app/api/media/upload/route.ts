import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { media, auditLogs, orders, designRevisions } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getStorageProvider } from "@/lib/media/storage";
import { validateFile, sanitizeFilename } from "@/lib/media/validation";
import type { MediaPurpose, MediaVisibility } from "@/lib/media/types";

export const dynamic = "force-dynamic";

const VALID_PURPOSES: MediaPurpose[] = ["order_asset", "design_revision", "customer_upload", "production_asset", "portfolio", "avatar", "product_image", "service_image", "category_image", "article_image", "content_image", "testimonial_avatar", "site_hero", "site_logo"];
const CONTENT_PURPOSES = new Set<MediaPurpose>(["product_image", "service_image", "category_image", "article_image", "content_image", "portfolio", "testimonial_avatar", "site_hero", "site_logo"]);

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const purpose = (formData.get("purpose") as string) || "order_asset";
    const orderId = formData.get("orderId") as string | null;
    const revisionId = formData.get("revisionId") as string | null;
    const visibility = (formData.get("visibility") as string) || "private";

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: "NO_FILE", message: "File wajib diupload" } },
        { status: 400 }
      );
    }

    if (!VALID_PURPOSES.includes(purpose as MediaPurpose)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_PURPOSE", message: "Purpose tidak valid" } },
        { status: 400 }
      );
    }

    if (purpose === "site_logo" || purpose === "site_hero") {
      if (!hasPermission(session.role, "settings.update")) {
        return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Role ini tidak memiliki akses untuk mengubah branding situs" } }, { status: 403 });
      }
    } else if (CONTENT_PURPOSES.has(purpose as MediaPurpose) && !hasPermission(session.role, "media.upload")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Role ini tidak memiliki akses upload konten" } }, { status: 403 });
    }

    // Ownership / role checks for contextual uploads. Never trust orderId or revisionId from the client.
    if (orderId) {
      const [order] = await db.select({
        id: orders.id,
        userId: orders.userId,
        assignedDesigner: orders.assignedDesigner,
        assignedProduction: orders.assignedProduction,
      }).from(orders).where(eq(orders.id, orderId)).limit(1);
      if (!order) {
        return NextResponse.json({ success: false, error: { code: "ORDER_NOT_FOUND", message: "Pesanan tidak ditemukan" } }, { status: 404 });
      }
      const isOwner = order.userId === session.userId;
      const isAssignedDesigner = order.assignedDesigner === session.userId;
      const isAssignedProduction = order.assignedProduction === session.userId;
      const hasOperationalAccess = hasPermission(session.role, "orders.read");
      if (!isOwner && !isAssignedDesigner && !isAssignedProduction && !hasOperationalAccess) {
        return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Anda tidak memiliki akses ke pesanan ini" } }, { status: 403 });
      }
      if ((purpose === "customer_upload" || purpose === "order_asset") && !isOwner && !hasPermission(session.role, "orders.update")) {
        return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Upload aset pesanan hanya untuk pemilik atau operator yang berwenang" } }, { status: 403 });
      }
      if (purpose === "design_revision" && !isAssignedDesigner && !hasPermission(session.role, "design.create")) {
        return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Tidak memiliki akses membuat revisi desain untuk pesanan ini" } }, { status: 403 });
      }
      if (purpose === "production_asset" && !isAssignedProduction && !hasPermission(session.role, "production.update")) {
        return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Tidak memiliki akses aset produksi untuk pesanan ini" } }, { status: 403 });
      }
    }

    // Revision-scoped uploads must belong to the supplied order (when present) and be editable by the current actor.
    if (revisionId) {
      const [revision] = await db.select({
        id: designRevisions.id,
        orderId: designRevisions.orderId,
        designerId: designRevisions.designerId,
      }).from(designRevisions).where(eq(designRevisions.id, revisionId)).limit(1);
      if (!revision) {
        return NextResponse.json({ success: false, error: { code: "REVISION_NOT_FOUND", message: "Revisi desain tidak ditemukan" } }, { status: 404 });
      }
      if (orderId && revision.orderId !== orderId) {
        return NextResponse.json({ success: false, error: { code: "INVALID_CONTEXT", message: "Revisi tidak terkait dengan pesanan yang dipilih" } }, { status: 400 });
      }
      if (purpose === "design_revision" && revision.designerId && revision.designerId !== session.userId && !hasPermission(session.role, "design.create")) {
        return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Tidak memiliki akses ke revisi desain ini" } }, { status: 403 });
      }
    }

    // Validate file
    const validation = validateFile(file.type, file.size, file.name);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_FILE", message: validation.error } },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = sanitizeFilename(file.name);

    // Upload via storage provider
    const storage = await getStorageProvider();
    const result = await storage.upload(buffer, safeName, file.type, {
      purpose: purpose as MediaPurpose,
      visibility: visibility as MediaVisibility,
      orderId: orderId || undefined,
      revisionId: revisionId || undefined,
    });

    // Create DB record
    const [mediaRecord] = await db
      .insert(media)
      .values({
        userId: session.userId,
        orderId: orderId || null,
        revisionId: revisionId || null,
        filename: result.filename,
        originalFilename: file.name,
        mimeType: file.type,
        size: result.size,
        storageProvider: storage.name,
        storageKey: result.storageKey,
        url: result.url,
        purpose,
        visibility,
        status: "uploaded",
      })
      .returning();

    // Audit
    await db.insert(auditLogs).values({
      userId: session.userId,
      action: "MEDIA_UPLOADED",
      resource: "media",
      resourceId: mediaRecord.id,
      metadata: {
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        purpose,
        orderId,
      },
    });

    return NextResponse.json({
      success: true,
      media: {
        id: mediaRecord.id,
        filename: mediaRecord.originalFilename,
        url: mediaRecord.url,
        size: mediaRecord.size,
        mimeType: mediaRecord.mimeType,
        purpose: mediaRecord.purpose,
      },
    });
  } catch (error) {
    console.error("Media upload error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Gagal mengupload file" } },
      { status: 500 }
    );
  }
}
