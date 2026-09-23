import { sql } from "drizzle-orm";
import { db } from "@/db";

let ensured: Promise<void> | null = null;

/**
 * Keeps older deployments compatible with additive JSON metadata columns.
 * Safe to call before reads/writes; IF NOT EXISTS never removes or changes
 * existing article data.
 */
export function ensureRuntimeSchema() {
  if (!ensured) {
    ensured = (async () => {
      await db.execute(sql`ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb`);
      await db.execute(sql`ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "translations" jsonb DEFAULT '{}'::jsonb`);
      await db.execute(sql`UPDATE "categories" SET "translations" = jsonb_build_object('id', jsonb_build_object('name', "name", 'description', COALESCE("description", ''))) WHERE "translations" IS NULL OR "translations" = '{}'::jsonb`);
      await db.execute(sql`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "translations" jsonb DEFAULT '{}'::jsonb`);
      await db.execute(sql`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "translations" jsonb DEFAULT '{}'::jsonb`);
      await db.execute(sql`ALTER TABLE "portfolio" ADD COLUMN IF NOT EXISTS "translations" jsonb DEFAULT '{}'::jsonb`);
      await db.execute(sql`ALTER TABLE "faqs" ADD COLUMN IF NOT EXISTS "translations" jsonb DEFAULT '{}'::jsonb`);
      // articles + navigation_items were missing from this self-healing list —
      // the public blog detail/listing pages select articles.translations
      // directly, so without this an unmigrated DB throws "column does not
      // exist" on every article page.
      await db.execute(sql`ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "translations" jsonb DEFAULT '{}'::jsonb`);
      await db.execute(sql`ALTER TABLE "navigation_items" ADD COLUMN IF NOT EXISTS "translations" jsonb DEFAULT '{}'::jsonb`);
      await db.execute(sql`UPDATE "articles" SET "translations" = jsonb_build_object('id', jsonb_build_object('title', "title", 'excerpt', COALESCE("excerpt", ''), 'content', COALESCE("content", ''), 'category', COALESCE("category", ''), 'tags', COALESCE("tags", '[]'::jsonb))) WHERE "translations" IS NULL OR "translations" = '{}'::jsonb`);
      // Repair legacy publication metadata and empty card excerpts without exposing drafts.
      await db.execute(sql`UPDATE "articles" SET "is_published" = true WHERE "published_at" IS NOT NULL AND "is_published" = false`);
      await db.execute(sql`UPDATE "articles" SET "published_at" = COALESCE("published_at", "created_at") WHERE "is_published" = true AND "published_at" IS NULL`);
      await db.execute(sql`
        UPDATE "articles"
        SET "excerpt" = LEFT(
          regexp_replace(regexp_replace(COALESCE("content", ''), '<[^>]+>', ' ', 'g'), '\\s+', ' ', 'g'),
          220
        )
        WHERE COALESCE(trim("excerpt"), '') = '' AND COALESCE(trim("content"), '') <> ''
      `);      await db.execute(sql`UPDATE "navigation_items" SET "translations" = jsonb_build_object('id', jsonb_build_object('name', "name", 'description', COALESCE("description", ''))) WHERE "translations" IS NULL OR "translations" = '{}'::jsonb`);
      await db.execute(sql`UPDATE "products" SET "translations" = jsonb_build_object('id', jsonb_build_object('name', "name", 'shortDescription', COALESCE("short_description", ''), 'description', COALESCE("description", ''), 'specifications', COALESCE("specifications", '{}'::jsonb))) WHERE "translations" IS NULL OR "translations" = '{}'::jsonb`);
      await db.execute(sql`UPDATE "services" SET "translations" = jsonb_build_object('id', jsonb_build_object('name', "name", 'shortDescription', COALESCE("short_description", ''), 'description', COALESCE("description", ''), 'features', COALESCE("features", '[]'::jsonb), 'deliverables', COALESCE("deliverables", '[]'::jsonb))) WHERE "translations" IS NULL OR "translations" = '{}'::jsonb`);
      await db.execute(sql`UPDATE "portfolio" SET "translations" = jsonb_build_object('id', jsonb_build_object('title', "title", 'description', COALESCE("description", ''), 'category', COALESCE("category", ''), 'client', COALESCE("client", ''), 'tags', COALESCE("tags", '[]'::jsonb))) WHERE "translations" IS NULL OR "translations" = '{}'::jsonb`);
      await db.execute(sql`UPDATE "faqs" SET "translations" = jsonb_build_object('id', jsonb_build_object('question', "question", 'answer', "answer", 'category', COALESCE("category", ''))) WHERE "translations" IS NULL OR "translations" = '{}'::jsonb`);
      await db.execute(sql`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb`);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "product_pricing_tiers" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
          "min_quantity" integer NOT NULL,
          "max_quantity" integer,
          "unit_price" numeric(12,2) NOT NULL,
          "label" varchar(120),
          "sort_order" integer NOT NULL DEFAULT 0,
          "is_active" boolean NOT NULL DEFAULT true,
          "created_at" timestamp NOT NULL DEFAULT now(),
          "updated_at" timestamp NOT NULL DEFAULT now(),
          CONSTRAINT "product_pricing_tiers_product_min_quantity_unique" UNIQUE ("product_id", "min_quantity")
        )
      `);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS "product_pricing_tiers_product_id_idx" ON "product_pricing_tiers" ("product_id")`);
      await db.execute(sql`
        INSERT INTO "product_pricing_tiers" ("product_id", "min_quantity", "unit_price", "sort_order")
        SELECT p.id, (tier->>'minQuantity')::integer, (tier->>'unitPrice')::numeric(12,2),
          (row_number() OVER (PARTITION BY p.id ORDER BY (tier->>'minQuantity')::integer) - 1)::integer
        FROM "products" p
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE WHEN jsonb_typeof(p.metadata #> '{pricing,wholesaleTiers}') = 'array'
          THEN p.metadata #> '{pricing,wholesaleTiers}' ELSE '[]'::jsonb END
        ) AS tier
        WHERE COALESCE(tier->>'minQuantity','') ~ '^[0-9]+$'
          AND COALESCE(tier->>'unitPrice','') ~ '^[0-9]+([.][0-9]+)?$'
        ON CONFLICT ("product_id", "min_quantity") DO NOTHING
      `);
    })().catch((error) => {
      ensured = null;
      throw error;
    });
  }
  return ensured;
}
