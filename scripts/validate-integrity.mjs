import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (/\.(tsx?|mts|cts|js|jsx)$/.test(entry.name)) out.push(p);
  }
  return out;
}

const files = walk(SRC);
const issues = [];
const read = (file) => fs.readFileSync(file, 'utf8');

for (const file of files) {
  const text = read(file);
  const rel = path.relative(ROOT, file);

  if (text.includes('href="#"')) issues.push(`${rel}: placeholder href="#"`);
  if (/window\.(alert|confirm)\s*\(/.test(text)) issues.push(`${rel}: browser alert/confirm found`);
  if (/\\b(TODO|FIXME)\\b/.test(text)) issues.push(`${rel}: TODO/FIXME marker found`);
  if (/services\/(design|printing|advertising|branding|business)(?:[/?"'`]|$)/.test(text)) {
    issues.push(`${rel}: legacy category-style service URL found`);
  }
  if (/\/products\?category=(branding|design)(?:[&"'`]|$)/.test(text)) {
    issues.push(`${rel}: unsupported product category URL found`);
  }
  if (/madina-solution-dev-secret|your-secret-key-at-least-32/i.test(text) && !rel.endsWith('.env.example')) {
    issues.push(`${rel}: development session secret pattern found`);
  }
}

try {
  execFileSync('node', ['scripts/validate-navigation.mjs'], { stdio: 'inherit' });
} catch {
  issues.push('navigation contract validation failed');
}

if (issues.length) {
  console.error(`Integrity validation failed with ${issues.length} issue(s):`);
  for (const issue of [...new Set(issues)]) console.error(`- ${issue}`);
  process.exit(1);
}

console.log('Integrity validation passed: no known placeholder/dead-route/security markers found.');
