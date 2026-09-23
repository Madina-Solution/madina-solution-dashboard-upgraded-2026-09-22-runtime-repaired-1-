import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredAdminPages = [
  ["src/app/(admin)/admin/products/page.tsx", "product_image"],
  ["src/app/(admin)/admin/services/page.tsx", "service_image"],
  ["src/app/(admin)/admin/categories/page.tsx", "category_image"],
  ["src/app/(admin)/admin/portfolio/page.tsx", "portfolio"],
  ["src/app/(admin)/admin/articles/page.tsx", "article_image"],
  ["src/app/(admin)/admin/testimonials/page.tsx", "testimonial_avatar"],
  ["src/app/(admin)/admin/settings/page.tsx", "site_hero"],
  ["src/app/(admin)/admin/settings/page.tsx", "site_logo"],
  ["src/app/(public)/account/profile/page.tsx", "avatar"],
];
const errors = [];
for (const [file, purpose] of requiredAdminPages) {
  const full = path.join(root, file);
  const text = fs.readFileSync(full, "utf8");
  if (!text.includes("MediaUploader")) errors.push(`${file}: missing MediaUploader`);
  if (!text.includes(`purpose=\"${purpose}\"`)) errors.push(`${file}: missing purpose ${purpose}`);
}
const configurator = fs.readFileSync(path.join(root, "src/app/(public)/products/[slug]/product-configuration.tsx"), "utf8");
if (!configurator.includes('option.type === "file"')) errors.push("product-configuration.tsx: file option UI missing");
const uploadRoute = fs.readFileSync(path.join(root, "src/app/api/media/upload/route.ts"), "utf8");
for (const purpose of ["product_image", "service_image", "category_image", "article_image", "testimonial_avatar", "site_hero", "avatar", "site_logo"]) {
  if (!uploadRoute.includes(`\"${purpose}\"`)) errors.push(`upload route: purpose ${purpose} missing`);
}
const validation = fs.readFileSync(path.join(root, "src/lib/media/validation.ts"), "utf8");
for (const mime of ["video/mp4", "video/webm", "video/quicktime"]) if (!validation.includes(mime)) errors.push(`validation.ts: missing ${mime}`);
const uploader = fs.readFileSync(path.join(root, "src/components/ui/media-uploader.tsx"), "utf8");
if (!uploader.includes("allowVideo")) errors.push("media-uploader.tsx: allowVideo missing");
if (!uploader.includes("persist?:")) errors.push("media-uploader.tsx: persistence contract missing");
if (!uploader.includes("persist.method ?? \"PUT\"")) errors.push("media-uploader.tsx: configurable persistence method missing");
if (!uploader.includes("const removeAt = async")) errors.push("media-uploader.tsx: persisted delete handler missing");
const persistenceChecks = [
  ["src/app/(admin)/admin/products/page.tsx", "persist={editId ?", "method: \"PATCH\""],
  ["src/app/(admin)/admin/services/page.tsx", "persist={editId ?", "method: \"PATCH\""],
  ["src/app/(admin)/admin/categories/page.tsx", "persist={editId ?", "method: \"PATCH\""],
  ["src/app/(admin)/admin/portfolio/page.tsx", "persist={editId ?", "method: \"PATCH\""],
  ["src/app/(admin)/admin/articles/page.tsx", "persist={editId ?", "method: \"PATCH\""],
  ["src/app/(admin)/admin/testimonials/page.tsx", "persist={editId ?", "method: \"PATCH\""],
];
for (const [file, ...markers] of persistenceChecks) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  for (const marker of markers) if (!text.includes(marker)) errors.push(`${file}: missing persisted media update contract (${marker})`);
}
const gallery = fs.readFileSync(path.join(root, "src/app/(public)/products/[slug]/product-gallery.tsx"), "utf8");
for (const marker of ["setInterval", "ChevronRight", "ChevronLeft", "<video", "aspect-[16/10]", "setLightbox", "role=\"dialog\""]) if (!gallery.includes(marker)) errors.push(`product-gallery.tsx: missing ${marker}`);
if (errors.length) {
  console.error("Media validation failed:");
  errors.forEach((e) => console.error(`- ${e}`));
  process.exit(1);
}
console.log("Media validation passed: uploader, image/video preview and carousel contracts are present.");
