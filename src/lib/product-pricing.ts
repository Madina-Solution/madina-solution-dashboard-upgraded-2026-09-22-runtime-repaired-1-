import { db } from "@/db";
import { productPricingTiers } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { ProductAdminMetadata } from "@/db/schema";
import { ensureRuntimeSchema } from "@/db/ensure-runtime-schema";

export async function syncProductPricingTiers(productId: string, metadata: ProductAdminMetadata | null | undefined) {
  await ensureRuntimeSchema();
  const tiers = [...(metadata?.pricing?.wholesaleTiers || [])]
    .map((tier, index) => ({
      minQuantity: Math.max(1, Number(tier.minQuantity) || 1),
      maxQuantity: tier.maxQuantity ? Math.max(1, Number(tier.maxQuantity) || 1) : undefined,
      label: tier.label?.trim() || undefined,
      unitPrice: String(tier.unitPrice || "0"),
      sortOrder: index,
    }))
    .filter((tier) => /^\d+(\.\d{1,2})?$/.test(tier.unitPrice) && Number(tier.unitPrice) >= 0);

  await db.delete(productPricingTiers).where(eq(productPricingTiers.productId, productId));
  if (!tiers.length) return;

  await db.insert(productPricingTiers).values(
    tiers.map((tier) => ({
      productId,
      minQuantity: tier.minQuantity,
      maxQuantity: tier.maxQuantity,
      unitPrice: tier.unitPrice,
      label: tier.label,
      sortOrder: tier.sortOrder,
      isActive: true,
    }))
  );
}
