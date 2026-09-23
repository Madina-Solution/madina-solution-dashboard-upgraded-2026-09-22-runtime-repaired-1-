
## 2026-08-30 — TypeScript/API media detail fix
- Fixed admin order detail product thumbnail query and rendering.
- Added missing Next.js route context types across admin dynamic API routes.
- Added missing service update validation schema.
- Fixed `MediaUploader` upload callback typing/prop wiring.
- Fixed product review avatar imports for media rendering.
- Kept database schema unchanged; fixes are application-layer only.
## 2026-08-30 — RBAC, Media Persistence & Dashboard Hardening
- Centralized RBAC semantics for admin APIs with least-privilege role boundaries.
- Added access-control and media-persistence release validators.
- Media upload now persists entity changes before updating local UI state; replace/delete flows use the endpoint method contract.
- Customer, review, message, design-revision and payment permission checks aligned to operation semantics.
- Product/customer/review media placeholders replaced with real thumbnail/avatar rendering where media exists.
- Admin shell top bar remains fixed and mobile contact/branding uses the same site configuration.
- Google Maps embed remains editable from Settings and validated as a Google Maps embed URL.

# Madina Solution — Final Hardening Release Notes

This archive is a **Production Candidate**, not a claim of live production readiness without external credentials.

## Implemented directly
- Production-gated payment provider selection (Midtrans/Xendit; mock blocked in NODE_ENV=production).
- Midtrans payment provider with Snap create/status/cancel/refund and signature-verified webhook.
- Xendit invoice create/status/expire and callback-token verification; refund remains explicitly unsupported until a payment-product-specific Xendit refund API is selected.
- Webhook amount validation against the authoritative database payment amount.
- Production-gated transactional email using Resend (development console provider only outside production).
- Secure password-reset token flow: random token, SHA-256 hash at rest, 30-minute expiry, one-time use, audit logging, dedicated reset page/API.
- Logged-in checkout orders now persist `userId`; guest checkout remains supported.
- Production environment validation now blocks missing/misconfigured payment/email/site URL configuration.

## Required before live release
- Configure a real payment provider and credentials in the deployment environment.
- Configure Resend and a verified sender domain.
- Configure Cloudinary (or another durable storage provider) for production uploads.
- Apply the password reset database migration before first deployment of this build.
- Run an authenticated end-to-end payment/webhook test in the provider sandbox, then production credentials.

## 2026-08-29 — Social Auth & Media Carousel Hardening
- Added real Google and Facebook sign-in buttons backed by Firebase Authentication and a server-side Firebase ID-token verification bridge into the existing PostgreSQL/JWT session system.
- Added interactive media carousels for product, service and portfolio galleries with image/video support, swipe, keyboard navigation, autoplay controls and lightbox preview.
- Extended media upload validation for MP4, WebM and QuickTime video.
- Updated media library and product media UI to display video previews.

## Cookie & AdSense Hardening

- Site branding, top bar visibility, cookie consent, privacy/cookie policy, and AdSense placements are configurable from admin settings.
- AdSense is disabled by default and gated behind non-essential cookie consent.
- `/ads.txt` is generated from the configured publisher id.

## 2026-09-01 — Database schema recovery + Media Manager type fix

- CLI database configuration now prioritizes `.env.local`, avoiding accidental migration/validation against a different local database.
- `db:migrate` remains idempotent via `ensure-db-schema.mjs`.
- Recovery/validation now covers `services.options`, `services.fulfillment_type`, `process_steps`, `products.options`, `products.fulfillment_type`, and `order_items.fulfillment_type`.
- Schema sync/validation prints the target database/user/host without exposing credentials.
- Admin Media Manager now satisfies the required `MediaUploader.onChange` contract while retaining reload-on-upload behavior.
