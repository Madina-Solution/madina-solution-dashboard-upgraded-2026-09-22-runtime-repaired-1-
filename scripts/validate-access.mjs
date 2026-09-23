import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const API = path.join(ROOT, "src", "app", "api");
const issues = [];

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(file));
    else if (entry.name === "route.ts") out.push(file);
  }
  return out;
}

const files = walk(API);
for (const file of files) {
  const rel = path.relative(ROOT, file);
  const text = fs.readFileSync(file, "utf8");
  if (rel.startsWith(`src${path.sep}app${path.sep}api${path.sep}admin${path.sep}`)) {
    if (!text.includes("hasPermission(") && !text.includes("hasAnyPermission(")) {
      issues.push(`${rel}: admin API missing centralized permission check`);
    }
    if (/ADMIN_ROLES|MANAGER_ROLES|DESIGN_ROLES|STAFF_ROLES/.test(text)) {
      issues.push(`${rel}: hard-coded role array found; use centralized permissions`);
    }
  }
}

const mustContain = [
  ["src/app/api/admin/messages/[id]/route.ts", 'messages.manage'],
  ["src/app/api/admin/reviews/[id]/route.ts", 'content.update', 'content.delete'],
  ["src/app/api/admin/orders/[id]/design-revisions/route.ts", 'design.create', 'design.read'],
  ["src/app/api/admin/customers/[id]/route.ts", 'customers.update'],
  ["src/app/api/payments/[id]/confirm/route.ts", 'payments.confirm'],
  ["src/app/api/orders/[id]/payment/route.ts", 'payments.read', 'orders.update'],
];
for (const [rel, ...tokens] of mustContain) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) { issues.push(`${rel}: expected route missing`); continue; }
  const text = fs.readFileSync(file, "utf8");
  for (const token of tokens) if (!text.includes(token)) issues.push(`${rel}: expected permission '${token}' missing`);
}

const permissions = fs.readFileSync(path.join(ROOT, "src/lib/auth/permissions.ts"), "utf8");
for (const token of ["super_admin", "admin", "manager", "staff", "designer", "production", "customer"]) {
  if (!permissions.includes(`${token}:`)) issues.push(`permissions.ts: role '${token}' missing`);
}

if (issues.length) {
  console.error(`Access validation failed with ${issues.length} issue(s):`);
  for (const issue of [...new Set(issues)]) console.error(`- ${issue}`);
  process.exit(1);
}
console.log("Access validation passed: centralized RBAC and semantic permission contracts are present.");
