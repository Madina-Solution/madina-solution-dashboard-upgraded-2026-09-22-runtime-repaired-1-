import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getSession } from "@/lib/auth/session";
import { orders, orderItems, orderStatusHistory, products, services, media, auditLogs, paymentMethods, shippingMethods, users, addresses, payments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { checkoutSchema } from "@/lib/validations/checkout";
import { generateOrderNumber } from "@/lib/order-number";
import type { ProductOption } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validate payload
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Data tidak valid", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const session = await getSession();

    // Authenticated checkout uses the current account profile and an owned saved address when selected.
    const accountUser = session?.userId
      ? (await db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone }).from(users).where(eq(users.id, session.userId)).limit(1))[0]
      : null;
    let resolvedAddress = data.deliveryMethod === "delivery" ? data.address : null;
    let resolvedAddressId: string | null = null;
    if (session?.userId && data.addressId) {
      const saved = (await db.select().from(addresses).where(and(eq(addresses.id, data.addressId), eq(addresses.userId, session.userId))).limit(1))[0];
      if (!saved) {
        return NextResponse.json({ success: false, error: { code: "INVALID_ADDRESS", message: "Alamat tersimpan tidak ditemukan" } }, { status: 400 });
      }
      resolvedAddressId = saved.id;
      if (data.deliveryMethod === "delivery") {
        resolvedAddress = {
          recipientName: saved.recipientName,
          phone: saved.phone,
          address: saved.address,
          city: saved.city,
          province: saved.province,
          district: saved.district || undefined,
          postalCode: saved.postalCode || undefined,
        };
      }
    }

    // 2. Load and validate all products, calculate trusted prices
    const validatedItems: {
      productId: string | null;
      serviceId: string | null;
      name: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      configuration: Record<string, unknown>;
      notes: string | undefined;
      designFiles: string[];
      fulfillmentType: "physical" | "digital" | "hybrid";
    }[] = [];

    for (const item of data.items) {
      if (item.productId) {
        const productResult = await db.select().from(products).where(and(eq(products.id, item.productId), eq(products.isActive, true))).limit(1);
        const product = productResult[0];
        if (!product) return NextResponse.json({ success: false, error: { code: "PRODUCT_NOT_FOUND", message: "Produk tidak ditemukan atau tidak aktif" } }, { status: 400 });

        const minOrder = product.minOrder || 1;
        if (item.quantity < minOrder) return NextResponse.json({ success: false, error: { code: "QUANTITY_ERROR", message: `${product.name}: Minimal order ${minOrder} ${product.unit}` } }, { status: 400 });

        let unitPrice = Number(product.basePrice);
        const productOptions = (product.options || []) as ProductOption[];
        const designFiles: string[] = [];

        for (const option of productOptions) {
          if (option.required && !item.selectedOptions[option.key]) return NextResponse.json({ success: false, error: { code: "OPTION_REQUIRED", message: `${product.name}: ${option.name} wajib dipilih` } }, { status: 400 });
          if ((option.type === "select" || option.type === "radio") && option.values) {
            const selectedValue = item.selectedOptions[option.key];
            if (selectedValue) {
              const optionVal = option.values.find((v) => v.value === selectedValue);
              if (!optionVal) return NextResponse.json({ success: false, error: { code: "INVALID_OPTION", message: `${product.name}: Opsi ${option.name} tidak valid` } }, { status: 400 });
              if (optionVal.priceModifier) unitPrice += optionVal.priceModifier;
            }
          }
          if (option.type === "file" && item.selectedOptions[option.key]) designFiles.push(item.selectedOptions[option.key]);
        }

        if (designFiles.length > 0 && session) {
          const owned = await db.select({ url: media.url }).from(media).where(and(eq(media.userId, session.userId), eq(media.purpose, "customer_upload"), eq(media.status, "uploaded")));
          const allowed = new Set(owned.map((m) => m.url));
          if (designFiles.some((url) => !allowed.has(url))) return NextResponse.json({ success: false, error: { code: "INVALID_UPLOAD_REFERENCE", message: "Salah satu file lampiran tidak valid atau bukan milik akun Anda" } }, { status: 400 });
        }

        const subtotal = unitPrice * item.quantity;
        validatedItems.push({ productId: product.id, serviceId: null, name: product.name, quantity: item.quantity, unitPrice, subtotal, configuration: item.selectedOptions, notes: item.notes, designFiles, fulfillmentType: (product.fulfillmentType || "physical") as "physical" | "digital" | "hybrid" });
      } else if (item.serviceId) {
        const serviceResult = await db.select().from(services).where(and(eq(services.id, item.serviceId), eq(services.isActive, true))).limit(1);
        const service = serviceResult[0];
        if (!service) return NextResponse.json({ success: false, error: { code: "SERVICE_NOT_FOUND", message: "Layanan tidak ditemukan atau tidak aktif" } }, { status: 400 });

        let unitPrice = Number(service.startingPrice || 0);
        const serviceOptions = (service.options || []) as ProductOption[];
        const designFiles: string[] = [];
        for (const option of serviceOptions) {
          if (option.required && !item.selectedOptions[option.key]) return NextResponse.json({ success: false, error: { code: "OPTION_REQUIRED", message: `${service.name}: ${option.name} wajib diisi` } }, { status: 400 });
          if ((option.type === "select" || option.type === "radio") && option.values) {
            const selectedValue = item.selectedOptions[option.key];
            if (selectedValue) {
              const optionVal = option.values.find((v) => v.value === selectedValue);
              if (!optionVal) return NextResponse.json({ success: false, error: { code: "INVALID_OPTION", message: `${service.name}: Opsi ${option.name} tidak valid` } }, { status: 400 });
              if (optionVal.priceModifier) unitPrice += optionVal.priceModifier;
            }
          }
          if (option.type === "file" && item.selectedOptions[option.key]) designFiles.push(item.selectedOptions[option.key]);
        }
        if (designFiles.length > 0 && session) {
          const owned = await db.select({ url: media.url }).from(media).where(and(eq(media.userId, session.userId), eq(media.purpose, "customer_upload"), eq(media.status, "uploaded")));
          const allowed = new Set(owned.map((m) => m.url));
          if (designFiles.some((url) => !allowed.has(url))) return NextResponse.json({ success: false, error: { code: "INVALID_UPLOAD_REFERENCE", message: "Salah satu file lampiran tidak valid atau bukan milik akun Anda" } }, { status: 400 });
        }
        const subtotal = unitPrice * item.quantity;
        validatedItems.push({ productId: null, serviceId: service.id, name: service.name, quantity: item.quantity, unitPrice, subtotal, configuration: item.selectedOptions, notes: item.notes, designFiles, fulfillmentType: (service.fulfillmentType || "physical") as "physical" | "digital" | "hybrid" });
      }
    }

    const orderSubtotal = validatedItems.reduce((sum, i) => sum + i.subtotal, 0);

    // 2b. Validate payment method (always required) and shipping method
    // (required only for delivery). Cost/existence is always re-read from
    // the database here — the client's selection is only ever an id.
    const [paymentMethod] = await db.select().from(paymentMethods).where(and(eq(paymentMethods.id, data.paymentMethodId), eq(paymentMethods.isActive, true))).limit(1);
    if (!paymentMethod) {
      return NextResponse.json({ success: false, error: { code: "PAYMENT_METHOD_INVALID", message: "Metode pembayaran tidak ditemukan atau tidak aktif" } }, { status: 400 });
    }

    let shippingCost = 0;
    let resolvedShippingMethodId: string | null = null;
    if (data.deliveryMethod === "delivery") {
      const [shippingMethod] = await db.select().from(shippingMethods).where(and(eq(shippingMethods.id, data.shippingMethodId!), eq(shippingMethods.isActive, true))).limit(1);
      if (!shippingMethod) {
        return NextResponse.json({ success: false, error: { code: "SHIPPING_METHOD_INVALID", message: "Metode pengiriman tidak ditemukan atau tidak aktif" } }, { status: 400 });
      }
      shippingCost = Number(shippingMethod.cost);
      resolvedShippingMethodId = shippingMethod.id;
    }

    // Apply coupon if provided
    let orderDiscount = 0;
    let couponId: string | null = null;
    if (data.couponCode) {
      const { coupons: couponsTable } = await import("@/db/schema");
      const { eq: eqOp, and: andOp } = await import("drizzle-orm");
      const [coupon] = await db.select().from(couponsTable).where(andOp(eqOp(couponsTable.code, data.couponCode.toUpperCase()), eqOp(couponsTable.isActive, true))).limit(1);
      if (coupon) {
        if (coupon.discountType === "percentage") {
          orderDiscount = (orderSubtotal * Number(coupon.discountValue)) / 100;
          if (coupon.maxDiscount) orderDiscount = Math.min(orderDiscount, Number(coupon.maxDiscount));
        } else {
          orderDiscount = Number(coupon.discountValue);
        }
        orderDiscount = Math.min(orderDiscount, orderSubtotal);
        couponId = coupon.id;
        // Increment usage
        await db.update(couponsTable).set({ usageCount: (coupon.usageCount || 0) + 1 }).where(eqOp(couponsTable.id, coupon.id));
      }
    }

    const orderTotal = orderSubtotal - orderDiscount + shippingCost;

    // 3. Create order transactionally
    const orderNumber = await generateOrderNumber();

    const result = await db.transaction(async (tx) => {
      // Create order
      const [newOrder] = await tx
        .insert(orders)
        .values({
          orderNumber,
          userId: session?.userId || null,
          guestName: accountUser?.name || data.customer.name,
          guestEmail: accountUser?.email || data.customer.email,
          guestPhone: accountUser?.phone || data.customer.phone,
          guestWhatsapp: data.customer.whatsapp || accountUser?.phone || data.customer.phone,
          addressId: resolvedAddressId,
          shippingAddress: resolvedAddress ? {
            recipientName: resolvedAddress.recipientName,
            phone: resolvedAddress.phone,
            address: resolvedAddress.address,
            city: resolvedAddress.city,
            province: resolvedAddress.province,
            district: resolvedAddress.district,
            postalCode: resolvedAddress.postalCode,
          } : null,
          deliveryMethod: data.deliveryMethod,
          status: "pending",
          paymentStatus: "unpaid",
          paymentMethodId: paymentMethod.id,
          shippingMethodId: resolvedShippingMethodId,
          subtotal: String(orderSubtotal),
          discount: String(orderDiscount),
          shippingCost: String(shippingCost),
          total: String(orderTotal),
          couponId,
          notes: data.notes,
        })
        .returning();

      // Manual bank-transfer orders get a first-class payment row immediately.
      // This is what makes proof verification and finance reconciliation possible.
      if (paymentMethod.type === "bank_transfer") {
        await tx.insert(payments).values({
          orderId: newOrder.id,
          provider: "manual",
          providerPaymentId: `manual-${newOrder.id}`,
          reference: newOrder.orderNumber,
          amount: String(orderTotal),
          currency: "IDR",
          status: "pending",
          paymentMethod: paymentMethod.name,
          metadata: { paymentMethodId: paymentMethod.id, accountNumber: paymentMethod.accountNumber || null },
        });
      }

      // Create order items
      for (const item of validatedItems) {
        await tx.insert(orderItems).values({
          orderId: newOrder.id,
          productId: item.productId,
          serviceId: item.serviceId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          subtotal: String(item.subtotal),
          configuration: item.configuration,
          designFiles: item.designFiles,
          fulfillmentType: item.fulfillmentType,
          notes: item.notes,
        });
      }

      // Create status history
      await tx.insert(orderStatusHistory).values({
        orderId: newOrder.id,
        status: "pending",
        notes: "Pesanan dibuat",
      });

      // Create audit log
      await tx.insert(auditLogs).values({
        action: "ORDER_CREATED",
        resource: "orders",
        resourceId: newOrder.id,
        userId: session?.userId || undefined,
        metadata: {
          orderNumber,
          itemCount: validatedItems.length,
          total: orderTotal,
          customerEmail: data.customer.email,
        },
      });

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      order: {
        id: result.id,
        orderNumber: result.orderNumber,
        status: result.status,
        total: Number(result.total),
        shippingCost: Number(result.shippingCost),
        createdAt: result.createdAt,
      },
      paymentMethod: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        name: paymentMethod.name,
        bankName: paymentMethod.bankName,
        accountNumber: paymentMethod.accountNumber,
        accountHolder: paymentMethod.accountHolder,
        instructions: paymentMethod.instructions,
      },
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Gagal membuat pesanan. Silakan coba lagi." } },
      { status: 500 }
    );
  }
}
