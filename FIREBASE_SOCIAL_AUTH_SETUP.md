# Firebase Social Authentication Setup

## Penyebab umum `auth/internal-error` pada production

Untuk Madina Solution, login Google berjalan melalui Firebase Authentication di browser lalu token Firebase diverifikasi oleh server. Jika Vercel belum memiliki variable Firebase `NEXT_PUBLIC_*`, browser akan gagal membangun Firebase Auth. Pastikan variable production sudah diisi sebelum redeploy.

## Required web environment

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=PROJECT_ID.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=PROJECT_ID.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef
FIREBASE_PROJECT_ID=PROJECT_ID
```

Untuk login Google, minimal `API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, dan `APP_ID` harus benar. `FIREBASE_PROJECT_ID` dipakai server saat memverifikasi ID token. Jangan menaruh secret server ke variable `NEXT_PUBLIC_*`.

## Vercel

Periksa dahulu:

```bash
vercel env ls
```

Kemudian isi production (ulang untuk preview bila diperlukan):

```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production
vercel env add FIREBASE_PROJECT_ID production
```

Setelah environment berubah, lakukan deploy baru. Variable yang berubah tidak mengubah deployment lama secara retroaktif.

## Firebase Console

1. Firebase Console → Authentication → Sign-in method → Google → Enable.
2. Authentication → Settings → Authorized domains → tambahkan `madinasolution.vercel.app` dan domain production lain yang benar-benar digunakan.
3. Pastikan Project ID di Firebase sama dengan `NEXT_PUBLIC_FIREBASE_PROJECT_ID` dan `FIREBASE_PROJECT_ID`.
4. Google provider harus menggunakan konfigurasi Web yang sesuai pada project yang sama.
5. Untuk aplikasi mobile/PWA, redirect-based sign-in dapat menjadi alternatif bila browser memblokir popup.

## Pemeriksaan

Gunakan halaman admin Pengaturan → Status Integrasi. Firebase akan tampil `Aktif` hanya bila variable web utama tersedia di server build.

Error `auth/unauthorized-domain` berarti host belum diizinkan. Error `auth/internal-error` tetap perlu dilihat dari browser console/network setelah variable dan Authorized Domains benar; aplikasi sekarang menampilkan pesan diagnosis yang lebih spesifik.

Aplikasi mempertahankan session PostgreSQL/JWT. Firebase hanya dipakai sebagai identity provider Google/Facebook; ID token kemudian diverifikasi server dan dihubungkan ke user aplikasi.

## Urutan diagnosis Google Login

Karena `auth/internal-error` dapat berasal dari konfigurasi client atau OAuth, lakukan pemeriksaan berurutan: (1) cek `vercel env ls`; (2) cocokkan empat nilai utama Firebase web config dengan project Firebase yang sama; (3) pastikan Google enabled; (4) Firebase Authentication → Settings → Authorized domains berisi `madinasolution.vercel.app`; (5) bila menggunakan custom auth domain, pastikan konfigurasi OAuth/redirect mengikuti domain tersebut; (6) redeploy Vercel setelah variable berubah. Dokumentasi Firebase menyebut Authorized Domains dan validitas API key sebagai penyebab penting untuk error domain/redirect, dan Google sign-in mendukung popup maupun redirect; redirect lebih disarankan pada mobile bila popup tidak cocok.
