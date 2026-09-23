# Madina Solution — Final Release Checklist

## Code / CI
- [ ] `npm install`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`

## Database
- [ ] Backup production database
- [ ] Apply `drizzle/0001_password_reset_tokens/migration.sql`
- [ ] Verify `password_reset_tokens` table
- [ ] Verify unique `(provider,event_id)` on `payment_events`

## Environment
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` set
- [ ] `SESSION_SECRET` is random and >= 32 characters
- [ ] `NEXT_PUBLIC_SITE_URL=https://...`
- [ ] `PAYMENT_PROVIDER=midtrans` or `xendit`
- [ ] Provider secret configured
- [ ] `EMAIL_PROVIDER=resend`
- [ ] `RESEND_API_KEY` set
- [ ] `EMAIL_FROM` uses verified domain
- [ ] `STORAGE_PROVIDER=cloudinary`
- [ ] Cloudinary credentials set

## Business E2E
- [ ] Register
- [ ] Login
- [ ] Create order as logged-in customer
- [ ] Confirm `orders.user_id` is populated
- [ ] Create payment
- [ ] Provider sandbox payment
- [ ] Verify webhook signature
- [ ] Verify duplicate webhook is ignored
- [ ] Verify amount mismatch is rejected
- [ ] Admin confirmation / provider status sync
- [ ] Designer assignment
- [ ] Design revision upload
- [ ] Customer approval / revision request
- [ ] Production transition
- [ ] QC
- [ ] Shipping
- [ ] Completed
- [ ] Customer only sees own orders

## Password Reset
- [ ] Request reset email
- [ ] Receive real email
- [ ] Open token URL
- [ ] Reset password
- [ ] Token cannot be reused
- [ ] Expired token rejected
- [ ] Audit log created

## Media
- [ ] Upload authenticated file
- [ ] Validate MIME/size
- [ ] Verify private access control
- [ ] Verify delete authorization
- [ ] Verify durable cloud storage

## Production Security
- [ ] Mock payment unavailable in production
- [ ] Console email unavailable in production
- [ ] Local storage unavailable as production storage
- [ ] No secrets committed
- [ ] Server-side admin authorization verified
- [ ] Remaining admin APIs audited for centralized permissions
- [ ] Distributed rate limiter configured if multi-instance

## Release Decision
Only mark **LEVEL 4 — PRODUCTION READY** after every required item above is verified.
