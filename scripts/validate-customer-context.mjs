import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = {
  messageApi: path.join(root, "src/app/api/admin/messages/route.ts"),
  customerApi: path.join(root, "src/app/api/admin/customers/[id]/route.ts"),
  customerListApi: path.join(root, "src/app/api/admin/customers/route.ts"),
  financeApi: path.join(root, "src/app/api/admin/finance/route.ts"),
  accountFinanceApi: path.join(root, "src/app/api/account/finance/route.ts"),
  customerPage: path.join(root, "src/app/(admin)/admin/customers/[id]/page.tsx"),
  accountFinancePage: path.join(root, "src/app/(public)/account/finance/page.tsx"),
};
for (const [name, file] of Object.entries(files)) if (!fs.existsSync(file)) throw new Error(`Missing ${name}: ${file}`);

const read = (name) => fs.readFileSync(files[name], "utf8");
const checks = [
  ["Messaging only resolves customer-role targets", /customer\.role\s*!==\s*["']customer["']/g.test(read("messageApi"))],
  ["Messaging protects finance context by finance.read", /canViewFinance\s*=\s*hasPermission\(session\.role,\s*["']finance\.read["']\)/.test(read("messageApi"))],
  ["Customer listing is role-scoped", /where\(eq\(users\.role,\s*["']customer["']\)\)/.test(read("customerListApi"))],
  ["Customer detail validates customer role", /customer\.role\s*!==\s*["']customer["']/.test(read("customerApi"))],
  ["Finance ledger exposes customer identity", /customerName:\s*users\.name/.test(read("financeApi")) && /customerRole:\s*users\.role/.test(read("financeApi"))],
  ["Customer finance excludes cancelled/draft orders", /ne\(orders\.status,\s*["']cancelled["']\)/.test(read("accountFinanceApi")) && /ne\(orders\.status,\s*["']draft["']\)/.test(read("accountFinanceApi"))],
  ["Customer 360 page exists", true],
  ["Customer finance page displays role", /ROLE_LABELS\[user\.role\]/.test(read("accountFinancePage"))],
];
for (const [label, ok] of checks) console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
if (checks.some(([, ok]) => !ok)) process.exit(1);
console.log("Customer context validation: all checks passed");
