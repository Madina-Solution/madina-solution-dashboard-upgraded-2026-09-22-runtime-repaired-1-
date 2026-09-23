# Panduan Mengganti Email Super Admin

Madina Solution memiliki dua lapisan identitas: akun PostgreSQL aplikasi dan identitas Firebase untuk login Google/Facebook. Keduanya harus tetap mengarah ke akun yang sama.

## A. Super Admin menggunakan email/password

Sebelum mengubah email, pastikan Anda memiliki akses ke database dan satu akun super admin lain sebagai jalur pemulihan.

1. Backup database.
2. Cari akun dengan `role = 'super_admin'`.
3. Ubah kolom `email` ke alamat baru yang belum dipakai akun lain.
4. Logout dari semua sesi lama lalu login kembali dengan email baru.
5. Verifikasi halaman `/admin` dan seluruh menu penting.

Contoh SQL (jalankan setelah backup):

```sql
UPDATE users
SET email = 'admin-baru@example.com', updated_at = NOW()
WHERE role = 'super_admin'
  AND email = 'admin-lama@example.com';
```

## B. Super Admin menggunakan Google

Selain mengganti email akun aplikasi, pastikan akun Google/Firebase memakai alamat baru yang sama. Pada Firebase Console buka Authentication → Users, lalu gunakan akun Google dengan alamat baru. Bila akun baru menghasilkan Firebase UID berbeda, aplikasi akan memperlakukannya sebagai identitas sosial yang berbeda sampai akun tersebut ditautkan.

**Jangan mengubah `firebaseUid` secara manual kecuali benar-benar memahami konsekuensinya.**

## C. Pemeriksaan setelah perubahan

```bash
npm run typecheck
npm run lint
npm run build
npm run validate:release
```

Pastikan login email/password atau Google yang dipakai super admin berhasil, role tetap `super_admin`, dan akses `/admin` tidak hilang.
