# Madina Solution

**Creative Business Platform** — v1.0.0 — Production Candidate

Professional digital platform for graphic design, digital printing, branding, and advertising services.

## Architecture

```
Customer → Products → Configure → Cart → Checkout → Order → Payment
                                                       ↓
Admin → Confirm → Designer → Revision → Customer Approve → Production → QC → Ship → Complete
                                                       ↓
                                        Notification + Audit Log (every step)
```

## Stack

Next.js 16 • TypeScript • PostgreSQL (25 tables) • Drizzle ORM • JWT + bcrypt • Zod • Tailwind CSS 4

## Stats

112 application entries (51 pages + 61 API routes) • 25 DB tables • 54 DB indexes

## Features

**Commerce:** Product config with price modifiers, cart, checkout, server-side pricing, coupon validation, sequential order numbers

**Orders:** 10-state machine (pending→confirmed→design→approved→production→QC→ready→ship→complete), strict transitions, audit trail

**Admin:** Dashboard (real metrics), Products, Categories, Services, Portfolio, Articles, FAQ, Testimonials, Coupons, Reviews, Customers, Users & Roles, Messages, Media, Design workspace, Production workspace, Settings, Audit logs — all with full CRUD

**Customer:** Dashboard (real stats), orders + tracking + timeline, profile edit, address CRUD, favorites, notifications, password change, design review + approval

**Payment:** Provider abstraction; Mock is development-only; Midtrans/Xendit adapters; webhook signature/idempotency and server-authoritative amounts

**Storage:** Provider abstraction (Local active, Cloudinary ready with built provider)

**Security:** JWT httpOnly cookies, bcrypt 12 rounds, RBAC (7 roles + permission matrix), IDOR prevention, rate limiting, security headers, Zod validation, audit logging

**SEO:** Dynamic sitemap (38 URLs), robots.txt, JSON-LD (Organization, Product, Breadcrumb, WebSite), OpenGraph, canonical URLs

**Legal:** Privacy, Terms, Refund Policy, Shipping Policy

## Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and SESSION_SECRET
npx drizzle-kit push
npm run validate:navigation
npm run validate:integrity
npm run typecheck
npm run lint
npm run build
npm run dev
```

## Environment

See `.env.example` for all variables. Required:
- `DATABASE_URL` — PostgreSQL connection
- `SESSION_SECRET` — JWT signing (min 32 chars)

Optional (activate by setting env vars):
- `CLOUDINARY_*` — Cloud storage
- `PAYMENT_PROVIDER` + keys — Payment gateway
- `EMAIL_PROVIDER`, `RESEND_API_KEY`, `EMAIL_FROM` — Production email via Resend

## Production Checklist

- [ ] Neon PostgreSQL configured
- [ ] SESSION_SECRET set (not default)
- [ ] NEXT_PUBLIC_SITE_URL set to production domain
- [ ] Cloudinary credentials set
- [ ] Payment provider credentials set
- [ ] HTTPS + domain configured
- [ ] Database backup strategy
- [ ] `npm run build` passes
- [ ] E2E workflow tested

## Contact

**Madina Solution** — Dusun Ngleri, Desa Ngadimulyo, Kecamatan Kedu, Kabupaten Temanggung, Jawa Tengah, Indonesia
WhatsApp: +62 813-9300-5035 • Email: Perc.madina@gmail.com

© 2026 Madina Solution. All rights reserved.


## Final Hardening / Production Gates

This repository is a **Production Candidate**. The code now rejects Mock payment and console email in production, supports real provider adapters, persists authenticated order ownership, and implements a secure password-reset token flow.

Before live release configure: `PAYMENT_PROVIDER` + provider credentials, `EMAIL_PROVIDER=resend` + `RESEND_API_KEY` + `EMAIL_FROM`, Cloudinary production storage, and apply the included Drizzle migration. Then run the full authenticated E2E checkout/payment/design/production flow in a production-like environment.


## Production Candidate Gate

This archive is **LEVEL 3 — PRODUCTION CANDIDATE**, not a claim of live production readiness. Before release, configure real payment, email and durable storage providers, apply the included database migration, and run the full authenticated E2E business workflow. See `PROJECT_STATUS.md` and `README_RELEASE_NOTES.md`.

## 2026-08-24 Media, Content & Account Hardening

- Homepage hero, CTA, statistik, dan about timeline membaca data database/settings.
- Admin Settings dapat mengelola konten hero/CTA dan gambar hero melalui MediaUploader.
- Profil pelanggan mendukung avatar upload, telepon, role, tanggal bergabung, dan refresh session.
- Header desktop memiliki account menu untuk Dashboard, Profil, Pengaturan, dan Keluar.
- Mobile navigation menampilkan icon pada item utama dan status login lengkap dengan profil/settings/logout.
- Rich seed tersedia melalui `npm run db:seed:rich` dengan minimal 10 produk per kategori, 16 layanan, 24 testimoni, 12 portfolio, dan 8 artikel.
- Media release validation mencakup avatar dan site hero.
