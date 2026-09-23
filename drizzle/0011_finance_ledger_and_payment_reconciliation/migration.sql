-- Finance ledger + payment reconciliation.
-- Additive migration; existing commerce data remains intact.

CREATE TABLE IF NOT EXISTS "finance_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(120) NOT NULL UNIQUE,
  "type" varchar(12) NOT NULL DEFAULT 'both',
  "is_active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "finance_transactions" (
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
);

CREATE INDEX IF NOT EXISTS "finance_transactions_date_idx" ON "finance_transactions" ("transaction_date");
CREATE INDEX IF NOT EXISTS "finance_transactions_type_status_idx" ON "finance_transactions" ("type", "status");
CREATE INDEX IF NOT EXISTS "finance_transactions_order_idx" ON "finance_transactions" ("order_id");
CREATE INDEX IF NOT EXISTS "finance_transactions_payment_idx" ON "finance_transactions" ("payment_id");

INSERT INTO "finance_categories" ("name", "type", "sort_order") VALUES
  ('Penjualan / Order', 'income', 10),
  ('Transfer Bank', 'income', 20),
  ('Gateway Pembayaran', 'income', 30),
  ('Bahan & Produksi', 'expense', 40),
  ('Operasional', 'expense', 50),
  ('Transportasi / Kurir', 'expense', 60),
  ('Marketing', 'expense', 70),
  ('Gaji / Honor', 'expense', 80),
  ('Peralatan', 'expense', 90),
  ('Lainnya', 'both', 100)
ON CONFLICT ("name") DO NOTHING;

-- Backfill paid orders that existed before the ledger was introduced.
INSERT INTO "finance_transactions" (
  "type", "status", "category_id", "order_id", "reference", "description", "amount", "currency",
  "payment_method", "transaction_date", "notes", "created_at", "updated_at"
)
SELECT
  'income', 'posted', fc."id", o."id", o."order_number", CONCAT('Pembayaran pesanan ', o."order_number"),
  o."total", 'IDR', 'legacy-order', COALESCE(o."completed_at", o."updated_at", o."created_at"),
  'Backfill dari order yang sudah berstatus lunas sebelum finance ledger tersedia.', now(), now()
FROM "orders" o
LEFT JOIN "finance_categories" fc ON fc."name" = 'Penjualan / Order'
WHERE o."payment_status" = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM "finance_transactions" ft
    WHERE ft."order_id" = o."id" AND ft."type" = 'income' AND ft."status" = 'posted'
  );

-- Legacy bank-transfer orders need a payment row so proof verification and
-- manual confirmation can operate on them without reconstructing the order.
INSERT INTO "payments" (
  "order_id", "provider", "provider_payment_id", "reference", "amount", "currency", "status", "payment_method", "metadata", "created_at", "updated_at"
)
SELECT
  o."id", 'manual', CONCAT('manual-', o."id"), o."order_number", o."total", 'IDR',
  CASE WHEN o."payment_status" = 'paid' THEN 'paid' WHEN o."payment_proof" IS NOT NULL THEN 'pending_verification' ELSE 'pending' END,
  pm."name",
  jsonb_build_object('paymentMethodId', pm."id", 'accountNumber', pm."account_number", 'legacyBackfill', true),
  o."created_at", o."updated_at"
FROM "orders" o
JOIN "payment_methods" pm ON pm."id" = o."payment_method_id" AND pm."type" = 'bank_transfer'
WHERE NOT EXISTS (
  SELECT 1 FROM "payments" p WHERE p."order_id" = o."id" AND p."provider" = 'manual'
);
