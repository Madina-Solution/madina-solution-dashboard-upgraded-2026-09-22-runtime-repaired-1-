# Product Catalog V2

## Database
- Adds `product_pricing_tiers` as normalized B2B pricing storage.
- Existing `products.metadata.pricing.wholesaleTiers` is preserved.
- Backfill is additive and uses `ON CONFLICT DO NOTHING`.
- Runtime schema helper can create/backfill the table safely on older deployments.

## Public product page
- Rebuilt hero into premium marketplace layout.
- 16:10 product media remains aligned with service/portfolio gallery.
- Adds sticky product section navigation, overview, specifications, normalized bulk pricing, fulfillment, FAQ, reviews, procurement sidebar, and mobile purchase bar.
- Existing metadata remains supported as fallback.

## Migration
Run `npm run db:migrate` once after deployment (or `npm run db:sync`). The sync is idempotent and backfills the normalized pricing table from existing metadata. Do not seed/reset the database. Existing product/article rows are not deleted.
