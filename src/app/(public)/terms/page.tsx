import { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { BRAND } from "@/lib/constants";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({ title: "Syarat & Ketentuan", description: "Syarat dan ketentuan penggunaan layanan platform Madina Solution.", path: "/terms" });

export default function TermsPage() {
  return (
    <div>
      <PageHeader
        title="Syarat & Ketentuan"
        description="Terakhir diperbarui: Agustus 2026"
        breadcrumbs={[{ label: "Beranda", href: "/" }, { label: "Syarat & Ketentuan" }]}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 lg:px-6">
        <div className="prose prose-dark max-w-none space-y-6 text-dark-700">
          <h2 className="text-xl font-semibold text-dark">1. Penggunaan Layanan</h2>
          <p>Dengan menggunakan platform Madina Solution, Anda menyetujui syarat dan ketentuan yang berlaku. Layanan kami mencakup desain grafis, digital printing, branding, advertising, dan layanan kreatif lainnya.</p>

          <h2 className="text-xl font-semibold text-dark">2. Pemesanan</h2>
          <p>Setiap pesanan yang dibuat melalui platform kami merupakan permintaan layanan yang akan diproses setelah konfirmasi dan pembayaran sesuai ketentuan.</p>

          <h2 className="text-xl font-semibold text-dark">3. Harga dan Pembayaran</h2>
          <p>Harga yang ditampilkan merupakan estimasi berdasarkan konfigurasi produk. Harga final akan dikonfirmasi oleh tim kami. Pembayaran dapat dilakukan melalui metode yang tersedia di platform.</p>

          <h2 className="text-xl font-semibold text-dark">4. Desain dan Revisi</h2>
          <p>Untuk pesanan yang membutuhkan desain, pelanggan akan menerima draft desain untuk direview. Revisi dapat dilakukan sesuai ketentuan paket layanan yang dipilih.</p>

          <h2 className="text-xl font-semibold text-dark">5. Produksi</h2>
          <p>Produksi dimulai setelah desain disetujui oleh pelanggan. Setelah produksi dimulai, perubahan desain mungkin tidak dapat dilakukan atau dikenakan biaya tambahan.</p>

          <h2 className="text-xl font-semibold text-dark">6. Pengiriman</h2>
          <p>Estimasi waktu pengerjaan dan pengiriman akan diinformasikan pada saat konfirmasi pesanan. Keterlambatan akibat faktor di luar kendali kami akan dikomunikasikan sesegera mungkin.</p>

          <h2 className="text-xl font-semibold text-dark">7. Pembatalan</h2>
          <p>Pembatalan pesanan dapat dilakukan sebelum proses produksi dimulai. Setelah produksi berlangsung, pembatalan tunduk pada kebijakan pembatalan kami.</p>

          <h2 className="text-xl font-semibold text-dark">8. Hak Kekayaan Intelektual</h2>
          <p>File desain yang dibuat oleh tim Madina Solution menjadi hak pelanggan setelah pembayaran lunas. Pelanggan bertanggung jawab atas konten yang diunggah untuk keperluan produksi.</p>

          <h2 className="text-xl font-semibold text-dark">9. Batasan Tanggung Jawab</h2>
          <p>Madina Solution bertanggung jawab atas kualitas produksi sesuai spesifikasi yang telah disetujui. Perbedaan warna minor antara tampilan layar dan hasil cetak merupakan karakteristik teknis proses percetakan.</p>

          <h2 className="text-xl font-semibold text-dark">10. Perubahan Ketentuan</h2>
          <p>Kami berhak memperbarui syarat dan ketentuan ini. Penggunaan layanan setelah perubahan berlaku dianggap sebagai persetujuan terhadap ketentuan terbaru.</p>
        </div>
      </div>
    </div>
  );
}
