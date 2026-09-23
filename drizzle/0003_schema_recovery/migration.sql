ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "options" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "fulfillment_type" varchar(12) DEFAULT 'physical' NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "fulfillment_type" varchar(12) DEFAULT 'physical' NOT NULL;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "fulfillment_type" varchar(12) DEFAULT 'physical' NOT NULL;

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "options" jsonb DEFAULT '[]'::jsonb;
