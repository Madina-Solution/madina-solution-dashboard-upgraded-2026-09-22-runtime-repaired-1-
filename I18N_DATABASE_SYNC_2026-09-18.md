# Internationalization + Database Synchronization — 2026-09-18

## Mega Menu
Desktop Mega Menu no longer renders duplicate columns. Each active group has a distinct information architecture:
- Services: service discovery + service cards.
- Products: catalog grid + full-catalog CTA + custom request CTA.
- Explore: portfolio/editorial/company navigation.

All dynamic labels are translated with `next-intl`, while navigation item names/descriptions are resolved from database `translations.id/en`.

## Database localization
The database now stores localized content in JSONB `translations` fields for:
- categories
- products
- services
- portfolio
- articles
- FAQs
- navigation_items

Existing canonical Indonesian values are copied into `translations.id` by additive SQL migration. No records are deleted, truncated, or reset. English values remain optional until editorial translation is provided; the resolver falls back to Indonesian/canonical content rather than mixing partial languages.

## Admin editing
Admin content surfaces expose English fields for products, services, portfolio, FAQs, articles, and navigation items. Product/service/portfolio descriptions support the reusable WYSIWYG component for English content as well.

## Public resolution
The public locale is determined by the next-intl request configuration and `NEXT_LOCALE` cookie. Blog/product/service/portfolio/FAQ/category pages resolve DB-backed translations against the active locale.

## Schema migration
`drizzle/0009_catalog_i18n/migration.sql` adds the multilingual catalog fields with `IF NOT EXISTS` and backfills the Indonesian layer.

Runtime recovery in `src/db/ensure-runtime-schema.ts` applies the same additive schema safeguards when needed.

## Release validation
`validate-i18n`, navigation, integrity, media, commerce, and UI architecture validation passed in the source workspace. Full TypeScript/lint/build should still be run in the project's installed dependency environment before deployment.
