# Database schema recovery — 2026-08-31

The application expects service/product/order configuration columns that can be missing from an existing PostgreSQL database when migration history and the target database drift apart.

## Safe recovery

With the production `DATABASE_URL` loaded in the shell:

```bash
npm run db:sync
npm run validate:db-schema
```

`db:sync` is idempotent. It only adds missing columns with `IF NOT EXISTS`; it does not delete rows, recreate tables, or seed content.

Required columns checked by the validator:

- `services.options`
- `services.process_steps`
- `services.fulfillment_type`
- `products.options`
- `products.fulfillment_type`
- `order_items.fulfillment_type`

After a successful synchronization, restart the application and run:

```bash
npm run validate:release
```
