import dotenv from "dotenv";
import pg from "pg";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.production.local" });

const { Client } = pg;

const requiredColumns = [
  { table: "services", column: "options", sql: 'ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "options" jsonb DEFAULT \'[]\'::jsonb' },
  { table: "services", column: "process_steps", sql: 'ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "process_steps" jsonb DEFAULT \'[]\'::jsonb' },
  { table: "services", column: "fulfillment_type", sql: 'ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "fulfillment_type" varchar(12) DEFAULT \'physical\' NOT NULL' },
  { table: "articles", column: "metadata", sql: `ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb` },
  { table: "products", column: "metadata", sql: `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb` },
  { table: "products", column: "options", sql: 'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "options" jsonb DEFAULT \'[]\'::jsonb' },
  { table: "products", column: "fulfillment_type", sql: 'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "fulfillment_type" varchar(12) DEFAULT \'physical\' NOT NULL' },
  { table: "order_items", column: "fulfillment_type", sql: 'ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "fulfillment_type" varchar(12) DEFAULT \'physical\' NOT NULL' },
  // i18n content layer (migrations 0008_i18n_content / 0009_catalog_i18n).
  // categories.translations is included here because no migration file ever
  // adds it, even though schema.ts and validate-db-schema.mjs both expect it.
  { table: "categories", column: "translations", sql: `ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "translations" jsonb DEFAULT '{}'::jsonb` },
  { table: "products", column: "translations", sql: `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "translations" jsonb DEFAULT '{}'::jsonb` },
  { table: "services", column: "translations", sql: `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "translations" jsonb DEFAULT '{}'::jsonb` },
  { table: "portfolio", column: "translations", sql: `ALTER TABLE "portfolio" ADD COLUMN IF NOT EXISTS "translations" jsonb DEFAULT '{}'::jsonb` },
  { table: "articles", column: "translations", sql: `ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "translations" jsonb DEFAULT '{}'::jsonb` },
  { table: "faqs", column: "translations", sql: `ALTER TABLE "faqs" ADD COLUMN IF NOT EXISTS "translations" jsonb DEFAULT '{}'::jsonb` },
  { table: "navigation_items", column: "translations", sql: `ALTER TABLE "navigation_items" ADD COLUMN IF NOT EXISTS "translations" jsonb DEFAULT '{}'::jsonb` },
  // orders.payment_method_id / shipping_method_id / payment_proof are added
  // in requiredStatements below (after payment_methods/shipping_methods are
  // created), since the FK columns can't be added before their target tables exist.
];

// DDL that isn't a plain "ADD COLUMN IF NOT EXISTS" (enum type + new table for
// the admin-managed Mega Menu / Mobile Nav). Postgres has no
// `CREATE TYPE IF NOT EXISTS`, so the enum is guarded with a pg_type check.
const requiredStatements = [
  `DO $$
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'navigation_group') THEN
       CREATE TYPE navigation_group AS ENUM ('services', 'products', 'explore');
     END IF;
   END $$;`,
  `CREATE TABLE IF NOT EXISTS "navigation_items" (
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
   );`,
  `CREATE TABLE IF NOT EXISTS "product_pricing_tiers" (
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
   );`,
  `CREATE INDEX IF NOT EXISTS "product_pricing_tiers_product_id_idx" ON "product_pricing_tiers" USING btree ("product_id");`,
  `INSERT INTO "product_pricing_tiers" ("product_id", "min_quantity", "unit_price", "sort_order")
   SELECT p.id, (tier->>'minQuantity')::integer, (tier->>'unitPrice')::numeric(12,2), (row_number() OVER (PARTITION BY p.id ORDER BY (tier->>'minQuantity')::integer) - 1)::integer
   FROM "products" p
   CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(p.metadata #> '{pricing,wholesaleTiers}') = 'array' THEN p.metadata #> '{pricing,wholesaleTiers}' ELSE '[]'::jsonb END) AS tier
   WHERE COALESCE(tier->>'minQuantity','') ~ '^[0-9]+$'
     AND COALESCE(tier->>'unitPrice','') ~ '^[0-9]+([.][0-9]+)?$'
   ON CONFLICT ("product_id", "min_quantity") DO NOTHING;`,
  `CREATE TABLE IF NOT EXISTS "payment_methods" (
     "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     "type" varchar(20) NOT NULL,
     "name" varchar(120) NOT NULL,
     "bank_name" varchar(120),
     "account_number" varchar(60),
     "account_holder" varchar(120),
     "logo" text,
     "instructions" text,
     "is_active" boolean NOT NULL DEFAULT true,
     "sort_order" integer NOT NULL DEFAULT 0,
     "created_at" timestamp NOT NULL DEFAULT now(),
     "updated_at" timestamp NOT NULL DEFAULT now()
   );`,
  `CREATE TABLE IF NOT EXISTS "shipping_methods" (
     "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     "name" varchar(120) NOT NULL,
     "courier" varchar(60),
     "cost" numeric(12,2) NOT NULL DEFAULT 0,
     "estimated_days_min" integer DEFAULT 1,
     "estimated_days_max" integer DEFAULT 3,
     "is_active" boolean NOT NULL DEFAULT true,
     "sort_order" integer NOT NULL DEFAULT 0,
     "created_at" timestamp NOT NULL DEFAULT now(),
     "updated_at" timestamp NOT NULL DEFAULT now()
   );`,
  // orders FK/columns — must run after the two tables above exist.
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_method_id" uuid REFERENCES "payment_methods"("id");`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_method_id" uuid REFERENCES "shipping_methods"("id");`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_proof" text;`,
  `CREATE TABLE IF NOT EXISTS "finance_categories" (
     "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     "name" varchar(120) NOT NULL UNIQUE,
     "type" varchar(12) NOT NULL DEFAULT 'both',
     "is_active" boolean NOT NULL DEFAULT true,
     "sort_order" integer NOT NULL DEFAULT 0,
     "created_at" timestamp NOT NULL DEFAULT now(),
     "updated_at" timestamp NOT NULL DEFAULT now()
   );`,
  `CREATE TABLE IF NOT EXISTS "finance_transactions" (
     "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     "type" varchar(12) NOT NULL,
     "status" varchar(12) NOT NULL DEFAULT 'posted',
     "category_id" uuid REFERENCES "finance_categories"("id"),
     "order_id" uuid REFERENCES "orders"("id"),
     "payment_id" uuid REFERENCES "payments"("id"),
     "reference" varchar(100),
     "description" text NOT NULL,
     "amount" numeric(12,2) NOT NULL,
     "currency" varchar(3) NOT NULL DEFAULT 'IDR',
     "payment_method" varchar(50),
     "transaction_date" timestamp NOT NULL DEFAULT now(),
     "notes" text,
     "created_by" uuid REFERENCES "users"("id"),
     "created_at" timestamp NOT NULL DEFAULT now(),
     "updated_at" timestamp NOT NULL DEFAULT now()
   );`,
  `CREATE INDEX IF NOT EXISTS "finance_transactions_date_idx" ON "finance_transactions" ("transaction_date");`,
  `CREATE INDEX IF NOT EXISTS "finance_transactions_type_status_idx" ON "finance_transactions" ("type", "status");`,
  `CREATE INDEX IF NOT EXISTS "finance_transactions_order_idx" ON "finance_transactions" ("order_id");`,
  `CREATE INDEX IF NOT EXISTS "finance_transactions_payment_idx" ON "finance_transactions" ("payment_id");`,
  `INSERT INTO "finance_categories" ("name", "type", "sort_order") VALUES
     ('Penjualan / Order', 'income', 10), ('Transfer Bank', 'income', 20), ('Gateway Pembayaran', 'income', 30),
     ('Bahan & Produksi', 'expense', 40), ('Operasional', 'expense', 50), ('Transportasi / Kurir', 'expense', 60),
     ('Marketing', 'expense', 70), ('Gaji / Honor', 'expense', 80), ('Peralatan', 'expense', 90), ('Lainnya', 'both', 100)
   ON CONFLICT ("name") DO NOTHING;`,
  `INSERT INTO "finance_transactions" ("type", "status", "category_id", "order_id", "reference", "description", "amount", "currency", "payment_method", "transaction_date", "notes", "created_at", "updated_at")
   SELECT 'income', 'posted', fc."id", o."id", o."order_number", CONCAT('Pembayaran pesanan ', o."order_number"), o."total", 'IDR', 'legacy-order', COALESCE(o."completed_at", o."updated_at", o."created_at"), 'Backfill dari order yang sudah berstatus lunas sebelum finance ledger tersedia.', now(), now()
   FROM "orders" o LEFT JOIN "finance_categories" fc ON fc."name" = 'Penjualan / Order'
   WHERE o."payment_status" = 'paid' AND NOT EXISTS (SELECT 1 FROM "finance_transactions" ft WHERE ft."order_id" = o."id" AND ft."type" = 'income' AND ft."status" = 'posted');`,
  `INSERT INTO "payments" ("order_id", "provider", "provider_payment_id", "reference", "amount", "currency", "status", "payment_method", "metadata", "created_at", "updated_at")
   SELECT o."id", 'manual', CONCAT('manual-', o."id"), o."order_number", o."total", 'IDR',
     CASE WHEN o."payment_status" = 'paid' THEN 'paid' WHEN o."payment_proof" IS NOT NULL THEN 'pending_verification' ELSE 'pending' END,
     pm."name", jsonb_build_object('paymentMethodId', pm."id", 'accountNumber', pm."account_number", 'legacyBackfill', true), o."created_at", o."updated_at"
   FROM "orders" o JOIN "payment_methods" pm ON pm."id" = o."payment_method_id" AND pm."type" = 'bank_transfer'
   WHERE NOT EXISTS (SELECT 1 FROM "payments" p WHERE p."order_id" = o."id" AND p."provider" = 'manual');`,
];

// One-time seed matching the static QUICK_NAV_* baseline in src/lib/navigation.ts,
// so the new admin-managed table starts populated instead of empty and the
// public Mega Menu/Mobile Nav keep showing the same items after this migration.
const NAV_SEED = [
  { group: "services", name: "Logo Design", href: "/services/logo-design", icon: "logo-design", description: "Identitas visual awal brand Anda", sortOrder: 0 },
  { group: "services", name: "Brand Identity", href: "/services/brand-identity", icon: "brand-identity", description: "Panduan visual brand menyeluruh", sortOrder: 1 },
  { group: "services", name: "Social Media Design", href: "/services/social-media-design", icon: "social-media", description: "Konten visual media sosial", sortOrder: 2 },
  { group: "services", name: "Packaging Design", href: "/services/packaging-design", icon: "packaging", description: "Desain kemasan produk", sortOrder: 3 },
  { group: "products", name: "Banner & Spanduk", href: "/products?category=banner", icon: "banner", description: null, sortOrder: 0 },
  { group: "products", name: "Sticker", href: "/products?category=sticker", icon: "sticker", description: null, sortOrder: 1 },
  { group: "products", name: "Kartu Nama", href: "/products?category=kartu-nama", icon: "business-card", description: null, sortOrder: 2 },
  { group: "products", name: "Brosur", href: "/products?category=brosur", icon: "brochure", description: null, sortOrder: 3 },
  { group: "products", name: "Undangan", href: "/products?category=undangan", icon: "invitation", description: null, sortOrder: 4 },
  { group: "products", name: "Poster", href: "/products?category=poster", icon: "poster", description: null, sortOrder: 5 },
  { group: "products", name: "Kalender", href: "/products?category=kalender", icon: "calendar", description: null, sortOrder: 6 },
  { group: "products", name: "Signage", href: "/products?category=signage", icon: "signage", description: null, sortOrder: 7 },
  { group: "explore", name: "Portfolio", href: "/portfolio", icon: "portfolio", description: "Hasil karya & studi kasus kami", sortOrder: 0 },
  { group: "explore", name: "Artikel & Insight", href: "/blog", icon: "blog", description: "Tips seputar branding & percetakan", sortOrder: 1 },
  { group: "explore", name: "FAQ", href: "/faq", icon: "faq", description: "Pertanyaan yang sering diajukan", sortOrder: 2 },
  { group: "explore", name: "Tentang Kami", href: "/about", icon: "about", description: "Kenali Madina Solution", sortOrder: 3 },
  { group: "explore", name: "Kontak", href: "/contact", icon: "contact", description: "Hubungi tim kami", sortOrder: 4 },
];

// One-time seed so checkout never shows an empty payment/shipping list right
// after this migration. Values are clearly-labeled placeholders — admin
// should edit the bank account details via /admin/payment-methods before going live.
const PAYMENT_METHOD_SEED = [
  { type: "bank_transfer", name: "Transfer Bank", bankName: "BCA", accountNumber: "0000000000", accountHolder: "Madina Solution (ganti di Admin)", sortOrder: 0 },
  { type: "gateway", name: "Pembayaran Otomatis (VA/QRIS)", bankName: null, accountNumber: null, accountHolder: null, sortOrder: 1 },
];
const SHIPPING_METHOD_SEED = [
  { name: "Reguler", courier: "JNE/J&T (ganti di Admin)", cost: "15000", estimatedDaysMin: 2, estimatedDaysMax: 4, sortOrder: 0 },
];

// Derived from DATABASE_URL instead of `inet_server_host()`: on pooled/proxied
// connections (e.g. Neon's PgBouncer endpoint) that server-side function is not
// available and errors with 42883. Parsing the host client-side is safe (no
// credentials are logged) and works identically on direct and pooled connections.
function describeConnectionTarget(connectionString) {
  try {
    const url = new URL(connectionString);
    return { host: url.hostname, database: url.pathname.replace(/^\//, "") || null };
  } catch {
    return { host: "unknown", database: null };
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    const target = await client.query(`SELECT current_database() AS database, current_user AS user`);
    console.log("Schema sync target:", {
      ...target.rows[0],
      host: describeConnectionTarget(process.env.DATABASE_URL).host,
    });
    await client.query("BEGIN");

    for (const item of requiredColumns) {
      await client.query(item.sql);
    }

    for (const sql of requiredStatements) {
      await client.query(sql);
    }

    const { rows: navCountRows } = await client.query(`SELECT count(*)::int AS count FROM "navigation_items"`);
    if (navCountRows[0].count === 0) {
      for (const item of NAV_SEED) {
        await client.query(
          `INSERT INTO "navigation_items" ("group", "name", "href", "icon", "description", "sort_order") VALUES ($1, $2, $3, $4, $5, $6)`,
          [item.group, item.name, item.href, item.icon, item.description, item.sortOrder]
        );
      }
      console.log(`Seeded ${NAV_SEED.length} navigation_items rows (table was empty).`);
    }

    const { rows: paymentCountRows } = await client.query(`SELECT count(*)::int AS count FROM "payment_methods"`);
    if (paymentCountRows[0].count === 0) {
      for (const item of PAYMENT_METHOD_SEED) {
        await client.query(
          `INSERT INTO "payment_methods" ("type", "name", "bank_name", "account_number", "account_holder", "sort_order") VALUES ($1, $2, $3, $4, $5, $6)`,
          [item.type, item.name, item.bankName, item.accountNumber, item.accountHolder, item.sortOrder]
        );
      }
      console.log(`Seeded ${PAYMENT_METHOD_SEED.length} payment_methods rows (table was empty). Edit account details in /admin/payment-methods.`);
    }

    const { rows: shippingCountRows } = await client.query(`SELECT count(*)::int AS count FROM "shipping_methods"`);
    if (shippingCountRows[0].count === 0) {
      for (const item of SHIPPING_METHOD_SEED) {
        await client.query(
          `INSERT INTO "shipping_methods" ("name", "courier", "cost", "estimated_days_min", "estimated_days_max", "sort_order") VALUES ($1, $2, $3, $4, $5, $6)`,
          [item.name, item.courier, item.cost, item.estimatedDaysMin, item.estimatedDaysMax, item.sortOrder]
        );
      }
      console.log(`Seeded ${SHIPPING_METHOD_SEED.length} shipping_methods rows (table was empty). Edit rates in /admin/shipping-methods.`);
    }

    await client.query("COMMIT");

    const result = await client.query(
      `SELECT table_name, column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND ((table_name = 'services' AND column_name IN ('options','process_steps','fulfillment_type','translations'))
           OR (table_name = 'products' AND column_name IN ('options','fulfillment_type','translations'))
           OR (table_name = 'order_items' AND column_name = 'fulfillment_type')
           OR (table_name = 'product_pricing_tiers' AND column_name IN ('product_id','min_quantity','max_quantity','unit_price','is_active'))
           OR (table_name IN ('categories','portfolio','articles','faqs','navigation_items') AND column_name = 'translations')
           OR (table_name = 'payment_methods' AND column_name IN ('type','name','is_active'))
           OR (table_name = 'shipping_methods' AND column_name IN ('name','cost','is_active'))
           OR (table_name = 'orders' AND column_name IN ('payment_method_id','shipping_method_id','payment_proof'))
           OR (table_name = 'finance_categories' AND column_name IN ('name','type','is_active'))
           OR (table_name = 'finance_transactions' AND column_name IN ('type','status','amount','transaction_date','payment_id')))
       ORDER BY table_name, ordinal_position`
    );

    console.table(result.rows);
    console.log("Database schema synchronization completed successfully.");
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("Database schema synchronization failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
