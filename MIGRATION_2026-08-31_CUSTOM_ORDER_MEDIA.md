# Custom order / media migration — 2026-08-31

Before using the new per-product/service configuration and fulfillment fields in production, apply the migration from `drizzle/0002_custom_service_order_config/migration.sql`.

Run with the production `DATABASE_URL` configured:

```bash
npm run db:migrate
```

The migration is idempotent and adds:

- `services.options` JSONB for service-specific customer configuration.
- `services.fulfillment_type` (`physical`, `digital`, `hybrid`).
- `products.fulfillment_type` (`physical`, `digital`, `hybrid`).
- `order_items.fulfillment_type`.

The order API revalidates option values and server-calculates price. Customer-upload references are checked against the authenticated user's media records.

## Recovery when migration history is not synchronized

If the database is missing one or more required columns, use the idempotent recovery command:

```bash
npm run db:sync
npm run validate:db-schema
```

This command does not delete or reseed application data.
