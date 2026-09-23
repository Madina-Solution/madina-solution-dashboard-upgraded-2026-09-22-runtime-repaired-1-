# Admin Dashboard + Payment Type Fix — 2026-09-20

## Perubahan utama
- Memperbaiki error TypeScript pada `src/app/(admin)/admin/payment-methods/page.tsx` dengan tipe `PaymentForm` eksplisit sehingga `bank_transfer | gateway` tidak lagi menyempit menjadi `bank_transfer` saja.
- Mendesain ulang Admin Shell agar lebih dekat dengan referensi dashboard: sidebar modern, active navigation pill, branding area, fixed header, search bar, profile area, notifications shortcut, collapse sidebar, dan logout.
- Menambahkan toggle Light/Dark Mode yang tersimpan pada `localStorage` (`madina-admin-theme`) dan kompatibel dengan Tailwind `dark:` melalui `@custom-variant dark`.
- Menambahkan cleanup theme saat keluar dari area admin agar kelas `dark` tidak terbawa ke halaman publik.
- Mendesain ulang dashboard menjadi layout premium yang lebih simetris: hero header, 8 KPI cards, attention strip, revenue trend, order pipeline, quick actions, best-selling products, recent activity, dan recent orders.
- Chart dashboard menggunakan CSS variables untuk grid/text/surface agar tetap terbaca di Dark Mode.
- Mempertahankan arsitektur data database-driven yang sudah ada; tidak menambahkan mock/localStorage untuk data bisnis.
- Komponen `ConfirmDialog`, `ToastProvider`, `RichTextEditor`, dan `MediaUploader` yang sudah ada tetap digunakan oleh modul admin terkait.

## Verifikasi
- Static syntax parsing untuk file TSX yang diubah: PASS.
- `validate-navigation`: PASS (133 routes, 44 literal navigation links).
- `validate-integrity`: PASS.
- `validate-i18n`: PASS.
- `validate-commerce`: PASS (12/12).
- `validate-persistence`: PASS.
- `validate-ui-contract`: PASS (10/10).
- `validate-structured-data`: PASS.
- `validate-access`: PASS.
- `validate-security-scale`: PASS.

> `npm ci` tidak selesai dalam lingkungan eksekusi ini karena proses instalasi dependency melampaui batas waktu. Karena itu `npm run typecheck`, `npm run lint`, dan `npm run build` penuh tidak dapat dijalankan di lingkungan ini.
