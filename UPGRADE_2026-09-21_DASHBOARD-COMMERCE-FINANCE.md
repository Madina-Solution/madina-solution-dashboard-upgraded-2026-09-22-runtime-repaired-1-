# Upgrade 21 September 2026 — Dashboard, Checkout, Payment Reconciliation & Finance

## Perubahan utama

1. **Branding terpusat**
   - Komponen `BrandMark` menjadi sumber tampilan logo pada public header, footer, mobile navigation, auth layout, dan admin shell.
   - Logo aktual dirender `object-contain` tanpa border, shadow, atau background tambahan.
   - Preview logo di pengaturan admin juga memakai treatment transparan yang sama.

2. **RBAC / Roles & Permissions**
   - Tambah permission `finance.read` dan `finance.manage`.
   - Admin dapat mengelola user di bawah level Admin; Super Admin tetap menjadi satu-satunya role yang dapat menetapkan Super Admin.
   - Perubahan role diri sendiri diblokir.
   - Penggantian role melewati konfirmasi UI dan dicatat pada audit log.

3. **Checkout untuk customer yang sudah login**
   - Data nama, email, dan telepon diambil dari profil akun.
   - Alamat tersimpan milik akun dapat dipilih dan otomatis menjadi snapshot alamat order.
   - Server tetap memverifikasi kepemilikan `addressId`; client tidak dapat memakai alamat milik user lain.
   - Saat user mengubah alamat secara manual, relasi alamat tersimpan dilepas agar order memakai alamat khusus transaksi tersebut.

4. **Gambar per varian produk**
   - Setiap nilai varian sekarang memiliki uploader gambar di Variant Builder.
   - URL gambar disimpan pada metadata varian.
   - Gallery produk publik sudah membaca gambar varian tersebut, sehingga gambar akan muncul tanpa field database baru.

5. **Rekonsiliasi pembayaran transfer bank**
   - Order bank transfer baru langsung membuat record `payments` dengan status `pending`.
   - Upload bukti transfer mengubah payment menjadi `pending_verification` dan menyimpan metadata bukti.
   - Admin dapat mengonfirmasi pembayaran dari halaman detail order.
   - Konfirmasi manual mengubah payment menjadi `paid`, order menjadi `paid`, mengisi `paidAt`, mencatat audit, dan membuat pemasukan pada finance ledger secara idempotent.
   - Order bank transfer lama mendapat backfill payment row agar bisa diverifikasi tanpa rekonstruksi manual.
   - **Order tidak otomatis dianggap lunas hanya karena statusnya `completed`; pembayaran tetap harus diverifikasi.**
   - `PaymentService` dibuat lazy terhadap provider agar `PAYMENT_PROVIDER=manual` tidak membutuhkan kredensial gateway hanya untuk mengonfirmasi transfer bank.

6. **Control Center**
   - Ditambahkan `/admin/control-center` sebagai pusat pekerjaan yang membutuhkan tindakan.
   - Header profile menu sekarang terpisah menjadi:
     - Control Center
     - Profil Akun
     - Pengaturan Platform
   - Tidak lagi ada tiga tombol berbeda yang menuju halaman yang sama.
   - Control Center menyorot pembayaran menunggu verifikasi, order aktif, order selesai tetapi belum lunas, user aktif, aktivitas terbaru, dan akses cepat ke Keuangan/Pesanan.

7. **Manajemen Keuangan**
   - Ditambahkan `/admin/finance`.
   - Modul memakai pendekatan **cash ledger / arus kas operasional**, bukan laporan laba-rugi akrual.
   - Pemasukan pembayaran yang sudah benar-benar lunas dicatat otomatis.
   - Pengeluaran manual dapat dicatat berdasarkan kategori, tanggal, metode, referensi, dan catatan.
   - Tersedia ringkasan pemasukan, pengeluaran, arus bersih, piutang order, dan pembayaran menunggu verifikasi.
   - Ledger dapat diekspor ke CSV.
   - Transaksi pemasukan yang berasal dari payment tidak dihapus manual; pembatalan diarahkan melalui flow pembayaran.

## Database

Migration baru:

`drizzle/0011_finance_ledger_and_payment_reconciliation/migration.sql`

Selain migration Drizzle, `scripts/ensure-db-schema.mjs` ikut diperbarui sehingga schema-sync tetap dapat membuat tabel finance dan melakukan backfill pada environment yang mengandalkan script tersebut.

## Deployment setelah ZIP ini diterapkan

1. Install dependency project seperti biasa.
2. Jalankan migration/schema sync:

```bash
npm run db:migrate
```

3. Periksa dan ganti rekening bank seed placeholder pada:

`/admin/payment-methods`

4. Untuk order bank transfer lama, buka detail order yang masih menunggu verifikasi, cocokkan mutasi rekening/bukti transfer, lalu pilih **Konfirmasi Lunas**.

5. Buka `/admin/finance` untuk memastikan pemasukan lunas dan mencatat biaya operasional.

## Verifikasi yang berhasil dijalankan pada source package

- Navigation contract: PASS
- Integrity scan: PASS
- Media contract: PASS
- Social auth contract: PASS
- Access control contract: PASS
- Media persistence contract: PASS
- UI / branding / admin architecture: **10/10 PASS**
- Commerce / media delivery: **12/12 PASS**
- i18n: PASS
- Structured data: PASS
- Security / scale: PASS
- Modified TypeScript/TSX source: seluruh file perubahan berhasil diparse tanpa syntax error.

`typecheck`, `lint`, production `build`, dan validator schema yang membutuhkan koneksi database tidak dapat dijalankan penuh pada environment packaging ini karena dependency project/database runtime tidak tersedia. Ini bukan hasil verifikasi bahwa build production berhasil.
