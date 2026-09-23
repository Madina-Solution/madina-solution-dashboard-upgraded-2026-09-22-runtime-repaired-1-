import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const failures = [];
const jsonLd = fs.readFileSync(path.join(ROOT, "src/components/seo/json-ld.tsx"), "utf8");
const product = fs.readFileSync(path.join(ROOT, "src/app/(public)/products/[slug]/page.tsx"), "utf8");
for (const token of ["mpn", "gtin", "inLanguage", "itemCondition"]) if (!jsonLd.includes(token)) failures.push(`ProductSchema missing ${token}`);
for (const token of ["mpn={metadata.schema?.mpn}", "gtin={metadata.schema?.gtin || metadata.barcode}"]) if (!product.includes(token)) failures.push(`Product detail does not pass ${token}`);
if (failures.length) {
  console.error("Structured data validation failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log("Structured data validation passed: Product JSON-LD includes MPN/GTIN/condition/inLanguage contracts and product detail passes identifiers.");
