import dotenv from "dotenv";
import pg from "pg";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.production.local" });

const { Client } = pg;
const required = [
  ["services", "options"],
  ["services", "process_steps"],
  ["services", "fulfillment_type"],
  ["products", "options"],
  ["products", "fulfillment_type"],
  ["order_items", "fulfillment_type"],
  ["product_pricing_tiers", "product_id"],
  ["product_pricing_tiers", "min_quantity"],
  ["product_pricing_tiers", "unit_price"],
  ["product_pricing_tiers", "is_active"],
  ["categories", "translations"],
  ["products", "translations"],
  ["services", "translations"],
  ["portfolio", "translations"],
  ["articles", "translations"],
  ["faqs", "translations"],
  ["navigation_items", "translations"],
  ["payment_methods", "type"],
  ["payment_methods", "is_active"],
  ["shipping_methods", "cost"],
  ["shipping_methods", "is_active"],
  ["orders", "payment_method_id"],
  ["orders", "shipping_method_id"],
  ["orders", "payment_proof"],
  ["payments", "provider"],
  ["payments", "status"],
  ["finance_categories", "name"],
  ["finance_categories", "type"],
  ["finance_transactions", "type"],
  ["finance_transactions", "amount"],
  ["finance_transactions", "transaction_date"],
  ["finance_transactions", "payment_id"],
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
    console.log("Schema validation target:", {
      ...target.rows[0],
      host: describeConnectionTarget(process.env.DATABASE_URL).host,
    });
    const result = await client.query(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND (table_name, column_name) IN (${required.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(",")})
       ORDER BY table_name, column_name`,
      required.flat()
    );

    const found = new Set(result.rows.map((row) => `${row.table_name}.${row.column_name}`));
    const missing = required.filter(([table, column]) => !found.has(`${table}.${column}`));

    if (missing.length) {
      console.error("Database schema validation failed. Missing columns:");
      for (const [table, column] of missing) console.error(`- ${table}.${column}`);
      process.exit(1);
    }

    console.log("Database schema validation passed: required service/product/order configuration columns, B2B pricing table, and payment/shipping method tables, and finance ledger tables exist.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Database schema validation failed:", error);
  process.exit(1);
});
