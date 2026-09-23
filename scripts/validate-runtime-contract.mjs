import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(path.join(root, file), "utf8");
const pass = (message) => console.log(`PASS ${message}`);
const fail = (message) => { console.error(`FAIL ${message}`); process.exitCode = 1; };

const adminShell = read("src/app/(admin)/admin/admin-shell.tsx");
if (adminShell.includes('import { NotificationBell } from "@/components/account/notification-bell";') && adminShell.includes("<NotificationBell href=\"/admin/notifications\"")) pass("Admin shell resolves NotificationBell component");
else fail("Admin shell NotificationBell import/render contract is incomplete");

if (existsSync(path.join(root, "src/app/(admin)/admin/notifications/page.tsx"))) pass("Admin notification route exists");
else fail("Admin notification route is missing");

if (existsSync(path.join(root, "public/apple-touch-icon.png")) && existsSync(path.join(root, "public/apple-touch-icon-precomposed.png")) && existsSync(path.join(root, "public/favicon.ico"))) pass("Root browser icon fallbacks exist");
else fail("Root browser icon fallbacks are incomplete");

const hero = read("src/components/home/hero.tsx");
if (!hero.includes("quality={78}")) pass("No unconfigured Next Image quality 78 remains");
else fail("Unconfigured Next Image quality 78 remains");

const config = read("next.config.ts");
if (config.includes("qualities: [75]")) pass("Next Image quality allowlist is explicit");
else fail("Next Image quality allowlist is missing");

const manifest = read("src/app/manifest.ts");
if (manifest.includes("isCustomRasterIcon") && manifest.includes("image/png")) pass("PWA manifest prefers raster app icons");
else fail("PWA manifest raster icon contract is incomplete");
