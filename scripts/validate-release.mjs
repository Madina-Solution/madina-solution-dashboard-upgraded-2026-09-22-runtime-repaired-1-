import { spawnSync } from "node:child_process";

const checks = [
  ["validate:navigation", "Navigation contract"],
  ["validate:integrity", "Integrity scan"],
  ["validate:media", "Media contract"],
  ["validate:social-auth", "Social auth contract"],
  ["validate:access", "Access control contract"],
  ["validate:persistence", "Media persistence contract"],
  ["validate:ui", "UI, branding and admin architecture contract"],
  ["validate:commerce", "Commerce, service configuration and media delivery contract"],
  ["validate:i18n", "Internationalization contract"],
  ["validate:structured-data", "Structured data contract"],
  ["validate:security-scale", "Security, observability and scale contract"],
  ["validate:customer-context", "Customer profile, messaging and finance context contract"],
  ["validate:runtime", "Browser runtime contract"],
  ["validate:db-schema", "Database schema contract"],
  ["typecheck", "TypeScript"],
  ["lint", "ESLint"],
  ["build", "Production build"],
];

for (const [script, label] of checks) {
  console.log(`\n=== ${label} (${script}) ===`);
  const result = spawnSync("npm", ["run", script], { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    console.error(`\nRELEASE CHECK FAILED: ${label}`);
    process.exit(result.status ?? 1);
  }
}

console.log("\nRELEASE CHECK PASSED: navigation, integrity, media, social auth, access control, persistence, UI/branding architecture, commerce/media delivery, i18n, structured data, security/scale, database schema, TypeScript, lint and build.");
