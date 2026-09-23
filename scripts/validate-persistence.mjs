import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  ["src/app/(admin)/admin/products/page.tsx", "/api/admin/products/${editId}"],
  ["src/app/(admin)/admin/services/page.tsx", "/api/admin/services/${editId}"],
  ["src/app/(admin)/admin/categories/page.tsx", "/api/admin/categories/${editId}"],
  ["src/app/(admin)/admin/portfolio/page.tsx", "/api/admin/portfolio/${editId}"],
  ["src/app/(admin)/admin/articles/page.tsx", "/api/admin/articles/${editId}"],
  ["src/app/(admin)/admin/testimonials/page.tsx", "/api/admin/testimonials/${editId}"],
  ["src/app/(admin)/admin/settings/page.tsx", "/api/admin/settings"],
  ["src/app/(public)/account/profile/page.tsx", "/api/account/profile"],
];
const issues = [];
for (const [file, endpoint] of required) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) { issues.push(`${file}: missing`); continue; }
  const text = fs.readFileSync(full, "utf8");
  if (!text.includes("MediaUploader")) issues.push(`${file}: MediaUploader missing`);
  if (!text.includes(endpoint)) issues.push(`${file}: persistence endpoint missing`);
}
const uploader = fs.readFileSync(path.join(root, "src/components/ui/media-uploader.tsx"), "utf8");
if (!uploader.includes("onChange(nextValue)")) issues.push("media-uploader.tsx: state change contract missing");
if (!uploader.includes("if (!response.ok || !data?.success)")) issues.push("media-uploader.tsx: persistence response validation missing");
if (!uploader.includes("const removeAt = async")) issues.push("media-uploader.tsx: persisted delete contract missing");

const settings = fs.readFileSync(path.join(root, "src/app/api/admin/settings/route.ts"), "utf8");
if (!settings.includes("site_logo") || !settings.includes("hero_image")) issues.push("settings API: branding media fields missing");
if (!settings.includes("maps_embed_url")) issues.push("settings API: maps embed persistence missing");
const product = fs.readFileSync(path.join(root, "src/app/api/admin/products/[id]/route.ts"), "utf8");
for (const key of ["thumbnail", "gallery"]) if (!product.includes(key)) issues.push(`product API: ${key} persistence missing`);

if (issues.length) {
  console.error(`Persistence validation failed with ${issues.length} issue(s):`);
  for (const issue of [...new Set(issues)]) console.error(`- ${issue}`);
  process.exit(1);
}
console.log("Persistence validation passed: upload, update and delete flows have explicit persistence contracts.");
