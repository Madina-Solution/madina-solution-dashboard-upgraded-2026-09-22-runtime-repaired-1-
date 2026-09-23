# Madina Solution — Professional Dashboard & Customer Context Upgrade

Tanggal: 21 September 2026

## Scope

Upgrade final ini menyatukan branding admin, sidebar, WYSIWYG dark mode, customer service, customer 360, RBAC, dan finance context. Fokusnya adalah konsistensi data dan izin: satu pelanggan tetap dikenali sebagai role `customer` di profil, pesan, order, dan konteks keuangan.

## UX

- Sidebar collapsed menggunakan satu kontrol: branding berubah menjadi ikon buka sidebar saat hover/focus.
- Sidebar expanded menjaga branding dan tombol collapse dalam layout flex sehingga tidak bertumpuk.
- Control Center menampilkan shortcut berdasarkan permission pengguna.
- Customer list memiliki shortcut langsung ke Customer 360 dan Messaging.
- Customer 360 menjadi pusat profil, order, pesan, pembayaran, dan piutang.
- Finance memiliki pencarian dan filter jenis transaksi serta mengikuti `finance.manage` untuk aksi tulis.

## WYSIWYG

Editor menerapkan dark canvas dan dark typography melalui `html.dark` dan `.admin-ui.admin-dark`, termasuk heading, paragraph, link, list, blockquote, table, code, callout, CTA, footnote, dan status visual.

## Messaging & RBAC

- Admin Messaging hanya dapat membuka target dengan role `customer`.
- Customer context pada Messaging menyertakan profil dan order.
- Data keuangan pada Messaging hanya dikirim ke role dengan `finance.read`.
- Customer 360 hanya memproses akun dengan role `customer`.
- Deaktivasi pelanggan tervalidasi terhadap role target dan dicatat pada audit log.

## Finance

- Paid payment membuat ledger income secara idempotent.
- Konfirmasi manual menghitung pembayaran kumulatif; order menjadi `paid` hanya ketika akumulasi pembayaran memenuhi total order, selain itu `partial`.
- Konfirmasi manual mengirim notifikasi in-app ke pemilik order.
- Piutang pelanggan dihitung sebagai tagihan aktif dikurangi seluruh pembayaran `paid`, bukan sekadar order yang belum berstatus paid.
- Draft dan cancelled order dikecualikan dari agregasi piutang/customer finance.

## Verification

- 286 file TypeScript/TSX lolos parsing dengan 0 syntax error.
- Navigation validation: PASS.
- Integrity validation: PASS.
- Media: PASS.
- Social auth: PASS.
- Access/RBAC: PASS.
- Persistence: PASS.
- UI architecture: 10/10 PASS.
- Commerce/media: 12/12 PASS.
- i18n: PASS.
- Structured data: PASS.
- Security/scale: PASS.
- Customer context validation: all checks passed.

Production `npm run typecheck`, `npm run lint`, dan `npm run build` tetap harus dijalankan pada environment project pengguna sebelum deploy final karena environment packaging saat ini tidak memiliki dependency project lengkap. Log lokal pengguna sebelumnya menunjukkan typecheck dan production build berhasil; lint adalah area yang sebelumnya menghambat rilis.
