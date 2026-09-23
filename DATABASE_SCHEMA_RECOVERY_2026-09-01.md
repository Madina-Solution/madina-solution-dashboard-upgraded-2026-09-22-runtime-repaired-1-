# Database Schema Recovery — 2026-09-01 (updated)

This patch fixes production-candidate database schema and sync/validation issues.

## Original fixes (2026-08-31)

1. CLI migration/validation scripts now load `.env.local` before `.env`, preventing local scripts from silently targeting a different database than Next.js local runtime.
2. `db:migrate` remains idempotent because it runs `ensure-db-schema.mjs` after Drizzle migrations. The recovery script checks and adds required service/product/order configuration columns with `IF NOT EXISTS`.
3. The required schema contract now verifies `services.options`, `services.fulfillment_type`, `services.process_steps`, `products.options`, `products.fulfillment_type`, and `order_items.fulfillment_type`.
4. Admin Media Manager now supplies the required `MediaUploader.onChange` contract; uploads still trigger a list reload through `onUploaded`.

## Additional fixes (2026-09-01)

5. **`inet_server_host()` connection error (`42883`).** `validate-db-schema.mjs` and `ensure-db-schema.mjs` queried `inet_server_host()` purely to print a diagnostic target line. That function is unavailable on pooled/proxied Postgres connections (e.g. Neon's PgBouncer connection string), so both scripts failed before ever reaching the actual schema check. Fixed by deriving the host from `DATABASE_URL` client-side instead of querying the server — this is safe (no credentials are logged) and works identically on direct and pooled connections.
6. **`services.process_steps` was never actually created.** The required-columns contract in `validate-db-schema.mjs` has always listed `services.process_steps`, but no migration (`0001`-`0003`) and no entry in `ensure-db-schema.mjs`'s `requiredColumns` ever ran `ALTER TABLE services ADD COLUMN process_steps`. This meant `validate:db-schema` could never pass on a fresh or already-migrated database, independent of issue #5. Fixed by:
   - adding the column to `ensure-db-schema.mjs`'s `requiredColumns` (idempotent `ADD COLUMN IF NOT EXISTS`, runs every `db:migrate`)
   - adding migration `drizzle/0004_process_steps_column/migration.sql` for schema-version documentation

Do not seed or reset production data to resolve schema drift. Run:

```bash
npm run db:migrate
npm run validate:db-schema
npm run validate:release
```

The schema sync target is now printed as `database`/`user`/`host` (host parsed from `DATABASE_URL`) so an operator can confirm the intended database without exposing credentials or depending on server-side functions unavailable on pooled connections.
