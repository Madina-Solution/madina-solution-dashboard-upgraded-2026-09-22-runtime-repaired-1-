
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

## 2026-08-25 — TypeScript follow-up
- Fixed admin product form gallery inference (`never[]`) so MediaUploader gallery updates are type-safe.


## [Unreleased] — Media/Seed Type Consistency Fix
- Fixed TypeScript contracts for Product, Category, Portfolio, Service, and Article admin media fields.
- Fixed article PATCH validation and `publishedAt` handling.
- Restored missing `Mail` icon import in admin settings.
- Rich seed now loads `.env.local`/`.env` automatically and backfills missing media on existing records.
# Changelog

## 2026-08-21 — Navigation + Integrity Hardening (1.0.0-pc.3)
- Centralized public navigation in `src/lib/navigation.ts`.
- Fixed invalid Mega Menu and Mobile Nav service/category routes.
- Fixed invalid Service page category links and Footer service links.
- Updated homepage service cards to use the same canonical navigation contract.
- Added `npm run validate:navigation` automated route/slug validation.
- Added `npm run validate:integrity` automated placeholder/dead-route/security-pattern scan.
- Added keyboard focus and Escape behavior for desktop Mega Menu.
- Removed placeholder `href="#"` public footer links.

 — Final Hardening Archive (1.0.0-pc.1)

### Security / Auth
- Added production server-side admin layout authorization.
- Replaced development password reset with expiring one-time token flow.
- Added audit trail for password reset requests/completions.
- Persisted authenticated customer ownership on newly created orders.

### Payment
- Added Midtrans provider adapter with signature verification.
- Added Xendit invoice provider adapter with callback-token verification.
- Blocked Mock payment provider in production.
- Added authoritative payment amount verification on webhook.
- Added database uniqueness for provider/event webhook idempotency.

### Email
- Replaced fake production SMTP implementation with Resend HTTPS provider.
- Console email is development-only; production requires Resend.

### Operations / Infrastructure
- Tightened production environment validation.
- Added password reset database migration.
- Updated health status to distinguish Production Candidate from Production Ready.
- Updated project documentation to reflect actual release gates.

### Release status
**LEVEL 3 — PRODUCTION CANDIDATE.** External provider configuration and final E2E verification remain required.

# Changelog

## 2026-08-21 — Final Hardening Archive
- Added production-gated Midtrans/Xendit payment provider selection.
- Added Midtrans signature verification and provider API integration.
- Added Xendit invoice integration and callback-token verification.
- Added payment webhook amount validation.
- Added Resend transactional email provider; console email is development-only.
- Replaced development-only password reset with expiring one-time token flow and reset-password page/API.
- Persisted `userId` for authenticated checkout orders.
- Added server-side admin layout authorization.
- Added password reset token schema and migration.
- Added unique payment webhook event constraint.
- Added production environment validation and health reporting.

## Prior versions

## Iteration 05 — Email + Notification Service → LEVEL 4

### Added
- `EmailProvider` interface with `ConsoleEmailProvider` (dev) and `SmtpEmailProvider` (prod)
- `getEmailProvider()` factory with env-based switching (SMTP_*)
- Email templates: order created, payment received, design ready, order completed, password reset
- Centralized `notify()` service combining in-app + email notifications
- Error isolation: notification failures never break main operations

### Architecture
- All 3 provider abstractions now complete: Payment + Storage + Email
- Each switches automatically based on environment variables
- Development uses mock/local/console providers
- Production activates real providers via env config

### Release Level
- Advanced from LEVEL 3 (Production Candidate) to LEVEL 4 (Production Ready)
- 5 consecutive iterations with zero P0 issues
- 42/42 pages verified 200
- All provider abstractions complete

## Iterations 01–04

### Established
- 113 routes, 60 APIs, 50 pages, 24 DB tables
- JWT + bcrypt + RBAC + 30+ permissions
- 12 admin CRUD modules with ConfirmDialog
- 5 customer CRUD modules
- Order 10-state machine
- Design revision workflow
- Payment + Cloudinary + proxy migration
- SEO + legal pages
- Zero security anti-patterns across all iterations

## [Unreleased]
- Universal homepage/content settings + rich catalog seed
- Profile avatar and authenticated account controls
- Mobile menu icons and login-aware logout/account actions
 - Final Hardening Pass
- Fixed React 19 `set-state-in-effect` lint pattern across admin, account, and search screens without disabling the ESLint rule.
- Restored `.env.example` with current production configuration requirements.
- Added `npm run validate:release` to run navigation, integrity, TypeScript, ESLint, and production-build gates in sequence.
- Hardened media provider selection: production now requires Cloudinary and uploaded media records the actual storage provider instead of always recording `local`.
- Added accessible decorative image attributes and removed remaining navigation placeholder patterns.

## [6.1.0] - Universal Media & Image Management

### Media UX
- Added reusable `MediaUploader` with click + drag/drop upload, validation, preview, remove, and multi-image gallery support.
- Connected Product thumbnail/gallery, Service thumbnail/gallery, Category image, Portfolio thumbnail/gallery, Article featured image, and Testimonial avatar to the media upload pipeline.
- Added product configurator file-option upload for customer design files.
- Added administrator Media Library upload and image previews.
- Public Portfolio, Services, and Blog pages now render stored images and galleries instead of placeholder initials when media exists.

### Backend
- Added dedicated media purposes for product/service/category/article/testimonial content.
- Restricted public-content media purposes to administrator roles.
- Added image URL/gallery validation to admin CRUD APIs.
- Release validation now includes a Media Contract check.

## 2026-08-29 — Social Auth & Media Carousel Hardening
- Added real Google and Facebook sign-in buttons backed by Firebase Authentication and a server-side Firebase ID-token verification bridge into the existing PostgreSQL/JWT session system.
- Added interactive media carousels for product, service and portfolio galleries with image/video support, swipe, keyboard navigation, autoplay controls and lightbox preview.
- Extended media upload validation for MP4, WebM and QuickTime video.
- Updated media library and product media UI to display video previews.

## 2026-08-30 — Product media rendering hardening
- Fixed product catalog/category/related-product cards to render database thumbnails.
- Fixed product detail carousel to use a single active media layer, preventing slide overlap during transitions.
- Added stable media URL normalization for product image/video display.
- Improved admin product list to show thumbnail/video preview.
- Improved MediaUploader preview frame stability for uploaded media.
- Added live site/hero preview and editable site URL in admin settings.
- Updated media validation contract for the new carousel implementation.

## Cookie & AdSense Hardening

- Site branding, top bar visibility, cookie consent, privacy/cookie policy, and AdSense placements are configurable from admin settings.
- AdSense is disabled by default and gated behind non-essential cookie consent.
- `/ads.txt` is generated from the configured publisher id.

## 2026-08-30 — Release fix: settings, consent, gallery and Firebase types
- Fixed `site_logo` media purpose end-to-end (uploader + type contract).
- Fixed dynamic `siteName`/`siteUrl` metadata type inference.
- Fixed Firebase Google provider typing so `setCustomParameters` is available.
- Removed gallery index state synchronization effect; active index is derived safely.
- Removed consent/AdSense hydration-state effects that triggered React lint errors by using SSR-safe lazy initialization.
- Typed admin integration-status icon rows explicitly to avoid ReactNode inference errors.
- Kept settings initial API hydration effect explicitly documented because it synchronizes external API data into local form state.
