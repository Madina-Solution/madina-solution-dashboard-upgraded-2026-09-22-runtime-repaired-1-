# Blog Typecheck Fix — 2026-09-18

## Fixed
- Removed the accidental literal `\\n` prefix before `articleExcerpt` in `src/app/(public)/blog/page.tsx`.
- This was the direct cause of TypeScript TS1127, TS1435 and TS1005 at line 29 and the corresponding ESLint parse failure.

## Preserved
- Blog gallery excerpt fallback from `excerpt` to sanitized plain text derived from `content`.
- Blog detail editorial hero and non-floating right sidebar layout.
- Non-floating share tools and table of contents.
- Blog integrity migration `drizzle/0010_blog_integrity/migration.sql`.

## Validation
- Static source integrity checks: PASS.
- Full npm typecheck/lint/build could not be executed in the packaging environment because `npm ci` timed out before dependencies became available.
