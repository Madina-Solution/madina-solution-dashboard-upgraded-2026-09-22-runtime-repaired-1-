import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const checks = [];
const assert = (label, condition) => checks.push([label, Boolean(condition)]);

const home = read('src/app/(public)/page.tsx');
const publicLayout = read('src/app/(public)/layout.tsx');
const adminLayout = read('src/app/(admin)/admin/layout.tsx');
const adminShell = read('src/app/(admin)/admin/admin-shell.tsx');
const proxy = read('src/proxy.ts');
const mega = read('src/components/layout/mega-menu.tsx');
const settingsRoute = read('src/app/api/admin/settings/route.ts');
const env = read('src/lib/env.ts');

assert('Homepage lives inside the shared public layout', !fs.existsSync('src/app/page.tsx') && publicLayout.includes('getPublicSiteConfig'));
assert('Public layout consumes the same site config', publicLayout.includes('getPublicSiteConfig') && publicLayout.includes('siteName={config.siteName}'));
assert('Admin layout requires explicit admin.access', adminLayout.includes('hasAnyPermission(session.role, ["admin.access"])'));
assert('Admin shell renders shared branding logo', adminShell.includes('siteLogo') && (adminShell.includes('BrandMark') || adminShell.includes('SiteImage')));
assert('Admin sidebar hides visual scrollbar while retaining overflow', adminShell.includes('overflow-y-auto') && adminShell.includes('scrollbar-hide'));
assert('Proxy enforces route-level admin permissions', proxy.includes('getAdminRoutePermission') && proxy.includes('hasPermission'));
assert('Mega menu uses single navigation source', mega.includes('QUICK_NAV_SERVICES') && mega.includes('QUICK_NAV_PRODUCTS') && mega.includes('QUICK_NAV_EXPLORE') && mega.includes('@/lib/navigation'));
assert('Admin shell uses central route permission map', adminShell.includes('getAdminRoutePermission(href)') && adminShell.includes('getAdminRoutePermission(pathname)'));
assert('Resend status uses actual production provider variables', settingsRoute.includes('EMAIL_PROVIDER === "resend"') && settingsRoute.includes('RESEND_API_KEY') && settingsRoute.includes('EMAIL_FROM'));
assert('Environment accepts deliberate manual payment mode', env.includes('must be manual, midtrans or xendit'));

const failures = checks.filter(([, ok]) => !ok);
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
console.log(`\nUI/architecture contract: ${checks.length - failures.length}/${checks.length} passed`);
if (failures.length) process.exit(1);
