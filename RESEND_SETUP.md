# Resend + Vercel — Madina Solution

## Production variables

`EMAIL_PROVIDER=resend` berarti seluruh email transaksional production dikirim melalui API Resend dari server. Anda tidak perlu mengisi `RESEND_API_KEY` di browser dan jangan menggunakan prefix `NEXT_PUBLIC_`.

Set these three variables in Vercel **Production** (and Preview when needed):

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
EMAIL_FROM=Madina Solution <noreply@domain-anda.com>
```

`EMAIL_FROM` must use a sender/domain that has been verified in Resend. Do not put the API key in Git, `.env.example`, client-side code, or `NEXT_PUBLIC_*` variables.

## Vercel CLI

```bash
vercel env add EMAIL_PROVIDER production
# value: resend

vercel env add RESEND_API_KEY production
# paste your Resend API key

vercel env add EMAIL_FROM production
# example: Madina Solution <noreply@madinasolution.net>
```

For Preview, repeat with `preview`. After changing Vercel environment variables, create a new deployment; existing deployments do not retroactively receive changed environment variables.

## Resend

1. Create/sign in to Resend.
2. Add and verify the sending domain.
3. Create an API key with permission appropriate for transactional sending.
4. Use the verified domain in `EMAIL_FROM`.
5. In Vercel, confirm all three variables exist in **Production**.
6. Redeploy Vercel.

Contoh yang benar:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
EMAIL_FROM=Madina Solution <noreply@madinasolution.net>
```

Contoh yang salah: `EMAIL_FROM=admin@gmail.com` ketika domain tersebut belum menjadi sender/domain yang diverifikasi di Resend.

The application sends through the HTTPS Resend API from the server; the API key is never exposed to the browser.

## Local development

Use `.env.local`:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
EMAIL_FROM=Madina Solution <noreply@domain-anda.com>
```

Then restart `npm run dev`.

For a local environment without Resend, you may use `EMAIL_PROVIDER=console`; production must use `resend`.
