import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const failures = [];
for (const rel of ["src/i18n/request.ts", "src/i18n/routing.ts", "messages/id.json", "messages/en.json", "src/components/i18n/locale-switcher.tsx", "src/lib/localized-content.ts", "drizzle/0008_i18n_content/migration.sql", "drizzle/0009_catalog_i18n/migration.sql"]) {
  if (!fs.existsSync(path.join(ROOT, rel))) failures.push(`Missing ${rel}`);
}
const request = fs.readFileSync(path.join(ROOT, "src/i18n/request.ts"), "utf8");
const routing = fs.readFileSync(path.join(ROOT, "src/i18n/routing.ts"), "utf8");
for (const token of ["getRequestConfig", "messages", "defaultLocale"]) if (!request.includes(token)) failures.push(`i18n request config missing ${token}`);
if (!routing.includes("NEXT_LOCALE")) failures.push("i18n routing cookie key missing NEXT_LOCALE");
const id = JSON.parse(fs.readFileSync(path.join(ROOT, "messages/id.json"), "utf8"));
const en = JSON.parse(fs.readFileSync(path.join(ROOT, "messages/en.json"), "utf8"));
for (const ns of ["Navigation", "Blog", "BlogArticle", "ProductDetail", "ProductsPage", "FAQPage", "LocaleSwitcher"]) {
  if (!id[ns]) failures.push(`id messages missing ${ns}`);
  if (!en[ns]) failures.push(`en messages missing ${ns}`);
}
const localizedSource = fs.readFileSync(path.join(ROOT, "src/lib/localized-content.ts"), "utf8");
for (const token of ["resolveLocalizedArticle", "resolveLocalizedNavigation", "resolveLocalizedProduct", "resolveLocalizedService", "resolveLocalizedPortfolio", "resolveLocalizedFaq", "resolveLocalizedCategory", "locale === \"en\"", "translations"]) {
  if (!localizedSource.includes(token)) failures.push(`database localization contract missing ${token}`);
}
if (failures.length) {
  console.error("i18n validation failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log("i18n validation passed: next-intl request config, locale messages, and locale switcher contracts are present.");
