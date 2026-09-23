import dotenv from "dotenv";
import pg from "pg";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.production.local" });

const { Client } = pg;

// Read-only report: scans every image URL referenced across the database
// and checks whether it actually loads. Does not modify anything — safe to
// run as often as you like (e.g. after bulk re-uploads) to confirm nothing
// is still broken.
//
// Usage: node scripts/find-broken-media.mjs

const SOURCES = [
  { table: "products", label: "name", fields: [{ column: "thumbnail", kind: "single" }, { column: "gallery", kind: "array" }] },
  { table: "services", label: "name", fields: [{ column: "thumbnail", kind: "single" }, { column: "gallery", kind: "array" }] },
  { table: "categories", label: "name", fields: [{ column: "image", kind: "single" }] },
  { table: "portfolio", label: "title", fields: [{ column: "thumbnail", kind: "single" }, { column: "images", kind: "array" }] },
  { table: "articles", label: "title", fields: [{ column: "thumbnail", kind: "single" }] },
  { table: "testimonials", label: "name", fields: [{ column: "avatar", kind: "single" }] },
  { table: "media", label: "filename", fields: [{ column: "url", kind: "single" }] },
];

function isCheckableUrl(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

async function checkUrl(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let res = await fetch(url, { method: "HEAD", signal: controller.signal });
    // Some CDNs (Cloudinary included, depending on config) don't support HEAD well — fall back to GET.
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: "GET", signal: controller.signal });
    }
    return { ok: res.ok, status: res.status };
  } catch (error) {
    return { ok: false, status: null, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const references = [];

  for (const source of SOURCES) {
    const columns = ["id", source.label, ...source.fields.map((f) => f.column)];
    const { rows } = await client.query(`SELECT ${columns.map((c) => `"${c}"`).join(", ")} FROM "${source.table}"`);
    for (const row of rows) {
      for (const field of source.fields) {
        const value = row[field.column];
        if (field.kind === "single") {
          if (isCheckableUrl(value)) {
            references.push({ table: source.table, id: row.id, label: row[source.label], field: field.column, url: value });
          }
        } else if (field.kind === "array" && Array.isArray(value)) {
          value.forEach((url, i) => {
            if (isCheckableUrl(url)) {
              references.push({ table: source.table, id: row.id, label: row[source.label], field: `${field.column}[${i}]`, url });
            }
          });
        }
      }
    }
  }

  await client.end();

  if (references.length === 0) {
    console.log("No image URLs found to check.");
    return;
  }

  // Dedupe by URL for the actual network checks (many rows can share a URL);
  // then map the check result back to every reference that uses it.
  const uniqueUrls = [...new Set(references.map((r) => r.url))];
  console.log(`Checking ${uniqueUrls.length} unique image URL(s) referenced across ${references.length} field(s)...\n`);

  const checks = await mapWithConcurrency(uniqueUrls, 8, async (url) => ({ url, ...(await checkUrl(url)) }));
  const statusByUrl = new Map(checks.map((c) => [c.url, c]));

  const broken = references
    .map((ref) => ({ ...ref, ...statusByUrl.get(ref.url) }))
    .filter((ref) => !ref.ok);

  if (broken.length === 0) {
    console.log("✅ All image URLs are reachable. Nothing broken.");
    return;
  }

  console.log(`❌ Found ${broken.length} broken reference(s):\n`);
  for (const ref of broken) {
    const status = ref.status ?? ref.error ?? "unreachable";
    console.log(`- [${ref.table}] "${ref.label}" (id: ${ref.id}) — ${ref.field}`);
    console.log(`  ${ref.url}`);
    console.log(`  status: ${status}\n`);
  }

  console.log(`Summary: ${broken.length} broken / ${references.length} total references checked.`);
  console.log("Fix: open each item in the Admin panel and re-upload the image, or clear the broken URL.");
}

main().catch((error) => {
  console.error("find-broken-media failed:", error);
  process.exit(1);
});
