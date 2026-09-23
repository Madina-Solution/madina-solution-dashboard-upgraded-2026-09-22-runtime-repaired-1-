# Madina Solution — Production Setup Checklist

## 1. Vercel environment

At minimum, the production deployment should have the database/session/site variables plus the services that are actually used.

### Firebase Google/Facebook

```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production
vercel env add FIREBASE_PROJECT_ID production
```

### Resend

```bash
vercel env add EMAIL_PROVIDER production
vercel env add RESEND_API_KEY production
vercel env add EMAIL_FROM production
```

`RESEND_API_KEY` is a server secret and must never use `NEXT_PUBLIC_`.

After changing variables, create a new production deployment.

## 2. Google Login

Firebase Console → Authentication → Sign-in method → Google: Enable.

Firebase Console → Authentication → Settings → Authorized domains: add the production hostname, for example `madinasolution.vercel.app`, and any custom production hostname you actually use.

The Firebase Project ID in the web configuration and `FIREBASE_PROJECT_ID` must refer to the same Firebase project.

## 3. Favicon / Android PWA icon

The release contains independent PNG assets:

- `/icons/madina-192.png`
- `/icons/madina-512.png`
- `/icons/madina-180.png`
- `/icon.png`

The manifest is cache-busted for the bundled icon. If an Android installation still displays the old icon after deployment, uninstall the old PWA/shortcut and install it again after the new deployment is available.

To use a company-specific icon without changing code: Admin → Pengaturan → Branding & Identitas → App Icon / Favicon → upload a square PNG → Simpan Semua.

## 4. Resend sender

The sender in `EMAIL_FROM` must match a sender/domain that has been verified in Resend.

Example:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
EMAIL_FROM=Madina Solution <noreply@verified-domain.example>
```

## 5. Notifications

The application stores in-app notifications in PostgreSQL. The account and admin notification surfaces poll every 5 seconds while the page is visible. The system now creates notifications for:

- customer/admin messages
- payment confirmation
- payment status changes
- order status changes
- design workflow events already supported by the project

This is near-real-time in-app delivery, not browser push/FCM. Browser push would require an additional FCM Web Push/VAPID setup and device-token storage.

## 6. Super Admin email

Back up the database first. Then find the current `super_admin` account and update only its email:

```sql
UPDATE users
SET email = 'admin-baru@example.com', updated_at = NOW()
WHERE role = 'super_admin'
  AND email = 'admin-lama@example.com';
```

Do not manually change `firebaseUid` unless the account-linking plan is understood. Afterward, log out of old sessions and verify `/admin`.

## 7. Release verification

Run in this order:

```bash
npm install
npm run db:migrate
npm run validate:release
npm run typecheck
npm run lint
npm run build
```

For routine releases, keep the order above so database/schema and contract checks fail early.
