# Madina Solution — Production Hardening — 2026-09-22

- Fixed ESLint React Compiler/manual-memoization issue in admin finance by removing unnecessary `useMemo`.
- Fixed effect-driven lint errors in admin messaging with deferred initial fetch and cleanup-safe polling.
- Added persistent `site_icon` setting support to the admin settings API.
- Added explicit 192/512 PNG app icons plus manifest cache-busting for bundled icons.
- Added Firebase configuration diagnostics and clarified Google Auth production setup.
- Added Resend/Vercel production configuration guidance.
- Added admin notification inbox and 5-second polling for in-app notifications.
- Customer messages notify support users; admin replies notify customers.
- Order status updates notify the customer account.
- Admin messaging and finance context remain governed by RBAC.
