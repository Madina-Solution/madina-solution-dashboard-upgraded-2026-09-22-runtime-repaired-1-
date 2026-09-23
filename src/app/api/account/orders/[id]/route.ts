import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, orderStatusHistory, products, services, designRevisions, media } from "@/db/schema";
import { eq, and, desc, isNull, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Silakan login" } }, { status: 401 });
    }

    const { id } = await context.params;

    // Fetch order — verify ownership
    const orderResult = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.userId, session.userId)))
      .limit(1);

    const order = orderResult[0];
    if (!order) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Pesanan tidak ditemukan" } }, { status: 404 });
    }

    // Fetch items
    const items = await db.select({ id: orderItems.id, name: orderItems.name, quantity: orderItems.quantity, unitPrice: orderItems.unitPrice, subtotal: orderItems.subtotal, configuration: orderItems.configuration, designFiles: orderItems.designFiles, fulfillmentType: orderItems.fulfillmentType, notes: orderItems.notes, productThumbnail: products.thumbnail, productSlug: products.slug, serviceThumbnail: services.thumbnail, serviceSlug: services.slug }).from(orderItems).leftJoin(products, eq(orderItems.productId, products.id)).leftJoin(services, eq(orderItems.serviceId, services.id)).where(eq(orderItems.orderId, id));

    // Fetch timeline — only customer-visible info
    const history = await db
      .select({
        id: orderStatusHistory.id,
        status: orderStatusHistory.status,
        notes: orderStatusHistory.notes,
        createdAt: orderStatusHistory.createdAt,
      })
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, id))
      .orderBy(desc(orderStatusHistory.createdAt));

    const revisions = await db.select({ id: designRevisions.id, orderItemId: designRevisions.orderItemId, revisionNumber: designRevisions.revisionNumber, status: designRevisions.status, fileUrl: designRevisions.fileUrl, previewUrl: designRevisions.previewUrl, notes: designRevisions.notes, createdAt: designRevisions.createdAt, submittedAt: designRevisions.submittedAt, approvedAt: designRevisions.approvedAt }).from(designRevisions).where(eq(designRevisions.orderId, id)).orderBy(desc(designRevisions.revisionNumber));

    const downloadableMedia = order.paymentStatus === "paid" && order.status === "completed"
      ? await db.select({ id: media.id, filename: media.originalFilename, url: media.url, mimeType: media.mimeType, size: media.size, purpose: media.purpose, orderId: media.orderId, revisionId: media.revisionId }).from(media).where(and(eq(media.orderId, id), isNull(media.deletedAt), inArray(media.purpose, ["order_asset", "design_revision", "production_asset"]), eq(media.status, "uploaded")))
      : [];

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        shippingCost: Number(order.shippingCost),
        total: Number(order.total),
        deliveryMethod: order.deliveryMethod,
        shippingAddress: order.shippingAddress,
        notes: order.notes,
        createdAt: order.createdAt,
        completedAt: order.completedAt,
        items: items.map(i => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          subtotal: Number(i.subtotal),
          configuration: i.configuration,
          notes: i.notes, designFiles: i.designFiles || [], fulfillmentType: i.fulfillmentType, productThumbnail: i.productThumbnail || i.serviceThumbnail, productSlug: i.productSlug || i.serviceSlug,
        })),
        timeline: history.map(h => ({
          id: h.id, status: h.status, notes: h.notes, createdAt: h.createdAt,
        })),
        revisions,
        downloadableMedia: downloadableMedia.map((file) => ({ ...file, downloadUrl: `/api/account/orders/${order.id}/files/${file.id}` })),
      },
    });
  } catch (error) {
    console.error("Order detail error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal memuat pesanan" } }, { status: 500 });
  }
}
