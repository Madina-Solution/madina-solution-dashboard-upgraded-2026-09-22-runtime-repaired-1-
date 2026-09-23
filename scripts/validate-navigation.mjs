import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ROUTES_ROOT = path.join(ROOT, 'src', 'app');
const SOURCE_ROOTS = [path.join(ROOT, 'src', 'app'), path.join(ROOT, 'src', 'components'), path.join(ROOT, 'src', 'lib')];

function walk(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(p));
    else if (/\.(tsx?|mts|cts|js|jsx)$/.test(entry.name)) result.push(p);
  }
  return result;
}

function routeFromFile(file) {
  const rel = path.relative(ROUTES_ROOT, path.dirname(file)).split(path.sep);
  const parts = rel.filter((x) => !/^\([^)]*\)$/.test(x)).map((x) => x.replace(/^\[\.\.\.(.+)\]$/, ':$1*').replace(/^\[\[\.\.\.(.+)\]\]$/, ':$1*').replace(/^\[(.+)\]$/, ':$1'));
  return '/' + parts.filter(Boolean).join('/');
}

const routes = new Set();
for (const file of walk(ROUTES_ROOT)) {
  if (path.basename(file) !== 'page.tsx' && path.basename(file) !== 'route.ts') continue;
  const route = routeFromFile(file);
  routes.add(route === '' ? '/' : route);
}

const services = new Set(['logo-design', 'brand-identity', 'social-media-design', 'packaging-design']);
const categories = new Set(['banner', 'sticker', 'kartu-nama', 'brosur', 'undangan', 'poster', 'kalender', 'signage']);

const literalLinks = new Map();
const diagnostics = [];

for (const root of SOURCE_ROOTS) {
  for (const file of walk(root)) {
    const text = fs.readFileSync(file, 'utf8');
    const re = /(?:href|router\.push|router\.replace|redirect)\s*=\s*(?:\{\s*)?["'`]([^"'`\s]+)["'`]/g;
    let m;
    while ((m = re.exec(text))) {
      const href = m[1];
      if (!href.startsWith('/')) continue;
      const clean = href.split('#')[0];
      const [pathname, query] = clean.split('?');
      if (!literalLinks.has(href)) literalLinks.set(href, []);
      literalLinks.get(href).push(path.relative(ROOT, file));

      const serviceMatch = pathname.match(/^\/services\/([^/]+)$/);
      if (serviceMatch && !serviceMatch[1].includes("${") && !services.has(serviceMatch[1])) {
        diagnostics.push(`${path.relative(ROOT,file)} -> invalid service slug: ${href}`);
      }
      const categoryMatch = query?.match(/(?:^|&)category=([^&]+)/);
      if (categoryMatch && !categoryMatch[1].includes("${") && !categories.has(decodeURIComponent(categoryMatch[1]))) {
        diagnostics.push(`${path.relative(ROOT,file)} -> invalid product category: ${href}`);
      }

      if (pathname.includes("${")) continue;
      const matches = [...routes].some((route) => {
        if (route === pathname) return true;
        const partsA = route.split('/').filter(Boolean);
        const partsB = pathname.split('/').filter(Boolean);
        if (partsA.length !== partsB.length) return false;
        return partsA.every((part, i) => part.startsWith(':') || part === partsB[i]);
      });
      if (!matches) diagnostics.push(`${path.relative(ROOT,file)} -> route not found: ${href}`);
    }
  }
}

const unique = [...new Set(diagnostics)];
console.log(`Routes discovered: ${routes.size}`);
console.log(`Literal navigation links discovered: ${literalLinks.size}`);
if (unique.length) {
  console.error(`Navigation validation failed with ${unique.length} issue(s):`);
  for (const item of unique) console.error(`- ${item}`);
  process.exit(1);
}
console.log('Navigation validation passed: no invalid literal routes or known seeded slugs.');
