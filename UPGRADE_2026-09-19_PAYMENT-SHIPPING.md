# Payment Methods & Shipping Methods — 2026-09-19

## What this adds
1. **Multi bank-account payment** — admin can add unlimited bank transfer
   accounts (Bank A, Bank B, Bank C, ...) plus the existing automatic
   gateway (Midtrans/Xendit/mock), shown together as selectable options at
   checkout. Managed at `/admin/payment-methods`.
2. **Multi-courier shipping** — admin can add unlimited flat-rate shipping
   methods (JNE, J&T, SiCepat, ...) with an estimated delivery window.
   Managed at `/admin/shipping-methods`. Checkout's shipping cost line is no
   longer a placeholder ("Dihitung terpisah") — it's a real selectable cost
   that is added into the order total.
3. **Payment proof upload** — logged-in customers can upload a bank-transfer
   screenshot right after placing an order; it's attached to the order
   (`orders.payment_proof`) and shown to the admin on the order detail page.
4. **Sidebar fix** — `/admin/testimonials` existed in code but had no
   sidebar link, so it was effectively unreachable from the admin UI. Added
   under "Konten", alongside the two new links under "Commerce".

## Known scope limit (please read)
`src/app/api/media/upload` has always required a login session — this predates
this change. That means **guest checkout customers cannot upload a payment
proof file directly on the site**; the success screen shows them the bank
details and asks them to send the screenshot via WhatsApp instead (same
pattern the site already uses for delivery coordination). Only logged-in
customers see the in-page upload widget. If you want guests to upload proof
directly too, that requires relaxing the media-upload auth requirement — a
separate, deliberate decision since it changes who can write files to storage
without an account. Flag it if you want that built next.

## Database
- New tables: `payment_methods`, `shipping_methods`.
- New `orders` columns: `payment_method_id`, `shipping_method_id`, `payment_proof`.
- `scripts/ensure-db-schema.mjs` creates both tables and seeds one placeholder
  bank account + one placeholder gateway entry + one placeholder shipping
  rate, **only if the tables are empty** — existing data is never touched.
  Placeholder bank details are obviously fake (`0000000000`) so you'll notice
  immediately if you forget to edit them.
- `scripts/validate-db-schema.mjs` updated to check the new tables/columns.

## Deploy steps
```bash
npm run db:sync              # creates payment_methods/shipping_methods, adds order columns, seeds placeholders
npm run validate:db-schema   # confirms the new tables/columns exist
```
Then go to **Admin → Metode Pembayaran** and **Admin → Metode Pengiriman** to
replace the placeholder bank account and courier rate with your real ones
before going live.

## Files touched
- `src/db/schema.ts` — new tables + orders columns
- `scripts/ensure-db-schema.mjs`, `scripts/validate-db-schema.mjs`
- `src/lib/validations/checkout.ts` — `paymentMethodId`/`shippingMethodId`
- `src/app/api/orders/route.ts` — server-side pricing/validation of both, shipping cost added to total
- `src/app/api/orders/[id]/payment-proof/route.ts` — new
- `src/app/api/admin/payment-methods/**`, `src/app/api/admin/shipping-methods/**` — new CRUD
- `src/app/(admin)/admin/payment-methods/page.tsx`, `src/app/(admin)/admin/shipping-methods/page.tsx` — new
- `src/app/(admin)/admin/admin-shell.tsx` — nav links (Testimoni, Metode Pembayaran, Metode Pengiriman)
- `src/lib/auth/admin-routes.ts` — permission mapping for the new/fixed routes
- `src/app/(public)/checkout/page.tsx` — now an async server component fetching active methods
- `src/app/(public)/checkout/checkout-content.tsx` — payment/shipping selection UI, real shipping cost, proof upload
- `src/app/(admin)/admin/orders/[id]/page.tsx` — shows selected method + proof image

## Not touched (product variants)
The "Amplop Merpati Desain A/B/C" request from the multi-item ask is already
covered by the existing Variant Builder in **Admin → Produk → edit produk →
Variant matrix** — no code change was needed for that part.
