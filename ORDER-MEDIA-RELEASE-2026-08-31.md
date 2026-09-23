# Madina Solution — Order, Media & Service UI Release

## Implemented
- Service detail uses one canonical media presentation: gallery first, thumbnail as fallback only.
- Carousel controls use high-contrast dark surfaces with accessible focus states.
- Mega menu thumbnails resolve from active database media for services, products and categories.
- Service and product configurations support dynamic options, required fields, price modifiers, file uploads (image/PDF), checkbox options, quantity and notes.
- Server validates submitted options and uploaded media ownership before order creation.
- Order items persist product/service identity, configuration, uploaded files and fulfillment type.
- Completed paid orders expose protected digital deliverables and previews.
- Admin Media Manager supports search, purpose filtering, preview and delete.
- Product/service administration exposes options and physical/digital/hybrid fulfillment settings.

## Database migration
Apply the checked-in migration before using new fulfillment/configuration fields:

`npx drizzle-kit migrate`

Migration: `drizzle/0002_custom_service_order_config/migration.sql`

## Release verification
Run in the deployment workspace:

`npm ci`
`npm run validate:release`
`npm run typecheck`
`npm run lint`
`npm run build`

The source was statically checked here; a clean dependency-backed build must still be run in the deployment workspace before promotion.
