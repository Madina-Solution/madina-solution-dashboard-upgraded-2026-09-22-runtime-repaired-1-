import { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { BRAND } from "@/lib/constants";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({ title: "Kebijakan Privasi", description: "Kebijakan privasi Madina Solution mengenai data akun, pesanan, komunikasi, dan penggunaan platform.", path: "/privacy" });

export default function PrivacyPage() {
  return (
    <div>
      <PageHeader
        title="Kebijakan Privasi"
        description="Terakhir diperbarui: Agustus 2026"
        breadcrumbs={[{ label: "Beranda", href: "/" }, { label: "Kebijakan Privasi" }]}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 lg:px-6">
        <div className="prose prose-dark max-w-none space-y-6 text-dark-700">
          <h2 className="text-xl font-semibold text-dark">1. Informasi yang Kami Kumpulkan</h2>
          <p>Kami mengumpulkan informasi yang Anda berikan secara langsung saat menggunakan layanan kami, termasuk: nama, alamat email, nomor telepon, alamat pengiriman, dan file desain yang Anda unggah untuk keperluan pesanan.</p>

          <h2 className="text-xl font-semibold text-dark">2. Penggunaan Informasi</h2>
          <p>Informasi yang kami kumpulkan digunakan untuk: memproses pesanan Anda, berkomunikasi mengenai status pesanan, mengirimkan notifikasi terkait layanan, dan meningkatkan kualitas layanan kami.</p>

          <h2 className="text-xl font-semibold text-dark">3. Perlindungan Data</h2>
          <p>Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi informasi pribadi Anda dari akses tidak sah, penggunaan, atau pengungkapan. Password disimpan dalam bentuk terenkripsi dan tidak pernah dalam teks biasa.</p>

          <h2 className="text-xl font-semibold text-dark">4. Penyimpanan Data</h2>
          <p>Data Anda disimpan selama diperlukan untuk memenuhi tujuan yang dijelaskan dalam kebijakan ini atau selama diwajibkan oleh hukum yang berlaku.</p>

          <h2 className="text-xl font-semibold text-dark">5. Hak Pengguna</h2>
          <p>Anda berhak untuk mengakses, memperbarui, atau meminta penghapusan data pribadi Anda. Untuk permintaan terkait data pribadi, silakan hubungi kami melalui email di {BRAND.email}.</p>

          <h2 className="text-xl font-semibold text-dark">6. Cookie dan teknologi iklan</h2>
          <p>Platform kami menggunakan cookie yang diperlukan untuk autentikasi, keamanan, keranjang, dan preferensi privasi. Teknologi analitik atau iklan non-esensial hanya dijalankan sesuai konfigurasi situs dan persetujuan yang diperlukan. Untuk detail jenis cookie, lihat <a href="/cookies" className="font-semibold text-primary hover:underline">Kebijakan Cookie</a>.</p>

          <h2 className="text-xl font-semibold text-dark">7. Perubahan Kebijakan</h2>
          <p>Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Perubahan akan diinformasikan melalui platform kami.</p>

          <h2 className="text-xl font-semibold text-dark">8. Kontak</h2>
          <p>Untuk pertanyaan mengenai kebijakan privasi ini, silakan hubungi kami di {BRAND.email} atau WhatsApp +62 813-9300-5035.</p>
        </div>
      </div>
    </div>
  );
}
