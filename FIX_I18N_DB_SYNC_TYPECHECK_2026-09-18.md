# Fix i18n DB Sync & Locale Typecheck — 2026-09-18

Fixed from the latest local validation output (`db:sync` → `validate:db-schema` →
`typecheck` failure chain, 32 TS errors across 12 files).

## 1. Database schema sync (`scripts/ensure-db-schema.mjs`)

`ensure-db-schema.mjs` is the safety net that reliably runs during `db:sync`
(per prior incident history, `drizzle-kit migrate` can fail/stop silently and
`&&` chaining then skips this script). Its `requiredColumns` list had not been
updated for the i18n content layer, so `translations` never actually reached
production even though `db:sync` reported success.

- Added the 7 `translations` jsonb columns (`categories`, `products`,
  `services`, `portfolio`, `articles`, `faqs`, `navigation_items`) to
  `requiredColumns`.
- `categories.translations` specifically: neither `0008_i18n_content` nor
  `0009_catalog_i18n` ever added it, despite `schema.ts` and
  `validate-db-schema.mjs` both expecting it — this was the one column with no
  creation path at all before this fix.
- Extended the post-sync verification `console.table` query to report these
  columns too.

**Action still required:** run `npm run db:sync` against the live Neon
database — this fix changes the script, it does not alter production data by
itself.

## 2. Locale typing (`AppLocale` narrowing)

`getLocale()` from `next-intl/server` returns `Promise<string>`, not
`Promise<AppLocale>` (`"id" | "en"`). Every page passing that value into
`resolveLocalized*`, `formatDate`, or `getPublicNavigation` failed
typecheck. Added an explicit `as AppLocale` cast at each `getLocale()` call
site (9 files): `blog/page.tsx`, `blog/[slug]/page.tsx`,
`blog/[slug]/related-articles.tsx`, `faq/page.tsx`, `(public)/layout.tsx`,
`portfolio/[slug]/page.tsx`, `products/page.tsx`,
`products/category/[slug]/page.tsx`, `products/[slug]/page.tsx`,
`services/[slug]/page.tsx`. `src/app/layout.tsx` was left untouched — its
`locale` is only used as a plain string (`lang` attribute, `"en"` comparison).

## 3. Generic-erasing cast (`blog/[slug]/page.tsx`)

Three call sites used `item as Parameters<typeof resolveLocalizedArticle>[0]`.
Because `resolveLocalizedArticle` is generic, extracting `Parameters<>` from
it collapses to the function's *constraint* type (`ArticleLocalizable`),
discarding real fields (`id`, `slug`, `thumbnail`, `publishedAt`) present on
the actual row. This broke `RelatedArticles` and the inline related-article
links. Removed all three casts — TypeScript now infers the generic correctly
from the real row shape.

## 4. Type widening (`src/lib/localized-content.ts`, `src/db/schema.ts`)

- `ArticleLocalizable`: `excerpt` / `content` / `category` / `tags` made
  optional, so a partial `db.select()` (e.g. SEO metadata generation, which
  never needed `content`) still typechecks without pulling extra columns.
- `CategoryLocalizable.description`: made optional for the same reason
  (`products/page.tsx`'s `getCategories()` only needs `.name`).
- `NavigationTranslation.description` (`schema.ts`): widened to
  `string | null | undefined` to match the admin API's Zod validator
  (`.nullable()`), fixing the insert/update type errors in
  `api/admin/navigation/route.ts` and `api/admin/navigation/[id]/route.ts`.

## Verified

- `npx tsc --noEmit` — 0 errors (was 32).
- `npx eslint .` — 0 errors, same 4 pre-existing warnings as before (unrelated
  `<img>` / `useEffect` deps notices, not touched by this fix).
- `npm run build` / `db:sync` / `validate:db-schema` were **not** run here —
  no production `DATABASE_URL` is available in this environment. Run these
  against the live Neon database before deploying.

No destructive migration, reset, or seed is included.
