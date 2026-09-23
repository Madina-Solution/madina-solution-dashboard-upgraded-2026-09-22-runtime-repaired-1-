-- Admin-managed Mega Menu / Mobile Nav items. See scripts/ensure-db-schema.mjs
-- for the idempotent CREATE (and one-time seed from the previous static
-- QUICK_NAV_* baseline in src/lib/navigation.ts) that actually runs on every
-- `npm run db:migrate`.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'navigation_group') THEN
    CREATE TYPE navigation_group AS ENUM ('services', 'products', 'explore');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "navigation_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "group" navigation_group NOT NULL,
  "name" varchar(120) NOT NULL,
  "href" varchar(255) NOT NULL,
  "icon" varchar(40) NOT NULL DEFAULT 'sparkles',
  "description" varchar(160),
  "sort_order" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
