-- International content layer for catalog/editorial surfaces.
-- Additive and safe for existing rows; Indonesian remains the canonical fallback.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "translations" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "translations" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "portfolio" ADD COLUMN IF NOT EXISTS "translations" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "faqs" ADD COLUMN IF NOT EXISTS "translations" jsonb DEFAULT '{}'::jsonb;

UPDATE "products"
SET "translations" = jsonb_build_object(
  'id', jsonb_build_object(
    'name', "name",
    'shortDescription', COALESCE("short_description", ''),
    'description', COALESCE("description", ''),
    'specifications', COALESCE("specifications", '{}'::jsonb)
  )
)
WHERE "translations" IS NULL OR "translations" = '{}'::jsonb;

UPDATE "services"
SET "translations" = jsonb_build_object(
  'id', jsonb_build_object(
    'name', "name",
    'shortDescription', COALESCE("short_description", ''),
    'description', COALESCE("description", ''),
    'features', COALESCE("features", '[]'::jsonb),
    'deliverables', COALESCE("deliverables", '[]'::jsonb)
  )
)
WHERE "translations" IS NULL OR "translations" = '{}'::jsonb;

UPDATE "portfolio"
SET "translations" = jsonb_build_object(
  'id', jsonb_build_object(
    'title', "title",
    'description', COALESCE("description", ''),
    'category', COALESCE("category", ''),
    'client', COALESCE("client", ''),
    'tags', COALESCE("tags", '[]'::jsonb)
  )
)
WHERE "translations" IS NULL OR "translations" = '{}'::jsonb;

UPDATE "faqs"
SET "translations" = jsonb_build_object(
  'id', jsonb_build_object(
    'question', "question",
    'answer', "answer",
    'category', COALESCE("category", '')
  )
)
WHERE "translations" IS NULL OR "translations" = '{}'::jsonb;
