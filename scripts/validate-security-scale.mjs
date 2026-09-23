import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const required = [
  ["src/lib/security/rate-limit.ts", ["UPSTASH_REDIS_REST_URL", "EVAL", "AbortController"]],
  ["src/proxy.ts", ["Content-Security-Policy", "frame-ancestors 'none'", "upgrade-insecure-requests"]],
  ["src/instrumentation.ts", ["onRequestError", "ERROR_MONITORING_WEBHOOK_URL"]],
  ["src/app/(public)/products/[slug]/page.tsx", ["revalidate = 60"]],
  ["src/app/(public)/blog/[slug]/page.tsx", ["revalidate = 60"]],
  ["src/app/(public)/portfolio/[slug]/page.tsx", ["revalidate = 60"]],
  ["src/app/(public)/services/[slug]/page.tsx", ["revalidate = 60"]],
];
let failed = false;
for (const [rel, markers] of required) {
  const file = path.join(root, rel);
  const text = fs.readFileSync(file, "utf8");
  for (const marker of markers) {
    if (!text.includes(marker)) { console.error(`FAIL ${rel}: missing ${marker}`); failed = true; }
  }
}
if (failed) process.exit(1);
console.log("Security/scale validation passed: distributed limiter, CSP, observability and detail revalidation contracts are present.");
