import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import type { ProductOption } from "@/db/schema";

export const dynamic = "force-dynamic";

const validateCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  selectedOptions: z.record(z.string(), z.string()),
});

const validateCartSchema = z.object({
  items: z.array(validateCartItemSchema),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = validateCartSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const validatedItems = [];

    for (const item of parsed.data.items) {
      // Load product from database
      const productResult = await db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          basePrice: products.basePrice,
          unit: products.unit,
          minOrder: products.minOrder,
          options: products.options,
          isActive: products.isActive,
        })
        .from(products)
        .where(and(eq(products.id, item.productId), eq(products.isActive, true)))
        .limit(1);

      const product = productResult[0];

      if (!product) {
        return NextResponse.json(
          { error: `Produk tidak ditemukan: ${item.productId}` },
          { status: 400 }
        );
      }

      // Validate quantity
      const minOrder = product.minOrder || 1;
      if (item.quantity < minOrder) {
        return NextResponse.json(
          { error: `${product.name}: Minimum order adalah ${minOrder} ${product.unit}` },
          { status: 400 }
        );
      }

      // Calculate trusted price
      const productOptions = (product.options || []) as ProductOption[];
      let unitPrice = Number(product.basePrice);

      // Validate required options
      for (const option of productOptions) {
        if (option.required) {
          const value = item.selectedOptions[option.key];
          if (!value) {
            return NextResponse.json(
              { error: `${product.name}: ${option.name} wajib dipilih` },
              { status: 400 }
            );
          }
        }

        // Calculate price modifiers
        if (
          (option.type === "select" || option.type === "radio") &&
          option.values
        ) {
          const selectedValue = item.selectedOptions[option.key];
          if (selectedValue) {
            const optionVal = option.values.find(
              (v) => v.value === selectedValue
            );
            if (!optionVal) {
              return NextResponse.json(
                {
                  error: `${product.name}: Nilai ${option.name} tidak valid`,
                },
                { status: 400 }
              );
            }
            if (optionVal.priceModifier) {
              unitPrice += optionVal.priceModifier;
            }
          }
        }
      }

      const subtotal = unitPrice * item.quantity;

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        unit: product.unit || "pcs",
        quantity: item.quantity,
        unitPrice,
        subtotal,
        selectedOptions: item.selectedOptions,
      });
    }

    const total = validatedItems.reduce((sum, item) => sum + item.subtotal, 0);

    return NextResponse.json({
      valid: true,
      items: validatedItems,
      subtotal: total,
      total,
    });
  } catch (error) {
    console.error("Cart validation error:", error);
    return NextResponse.json(
      { error: "Validasi gagal. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
