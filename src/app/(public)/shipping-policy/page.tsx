import { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({ title: "Kebijakan Pengiriman", description: "Informasi pengiriman dan pengambilan pesanan Madina Solution.", path: "/shipping-policy" });

export default function ShippingPolicyPage() {
  return (
    <div>
      <PageHeader
        title="Kebijakan Pengiriman"
        description="Terakhir diperbarui: Agustus 2026"
        breadcrumbs={[{ label: "Beranda", href: "/" }, { label: "Kebijakan Pengiriman" }]}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 lg:px-6">
        <div className="prose prose-dark max-w-none space-y-6 text-dark-700">
          <h2 className="text-xl font-semibold text-dark">1. Metode Pengiriman</h2>
          <p>Madina Solution menyediakan dua metode pengambilan: pengiriman ke alamat tujuan dan pengambilan langsung di lokasi kami di Dusun Ngleri, Desa Ngadimulyo, Kecamatan Kedu, Kabupaten Temanggung, Jawa Tengah.</p>

          <h2 className="text-xl font-semibold text-dark">2. Area Layanan</h2>
          <p>Kami melayani pengiriman ke seluruh Indonesia melalui jasa ekspedisi terpercaya. Biaya pengiriman dihitung berdasarkan berat, dimensi, dan tujuan pengiriman.</p>

          <h2 className="text-xl font-semibold text-dark">3. Estimasi Waktu</h2>
          <p>Estimasi waktu pengerjaan akan diinformasikan saat konfirmasi pesanan. Waktu pengiriman tambahan tergantung pada jasa ekspedisi yang dipilih. Untuk pengambilan di lokasi, pesanan dapat diambil setelah status pesanan berubah menjadi &quot;Siap&quot;.</p>

          <h2 className="text-xl font-semibold text-dark">4. Pengemasan</h2>
          <p>Semua produk dikemas dengan hati-hati untuk memastikan keamanan selama pengiriman. Untuk produk berukuran besar seperti neon box atau signage, kami menggunakan pengemasan khusus.</p>

          <h2 className="text-xl font-semibold text-dark">5. Kerusakan Saat Pengiriman</h2>
          <p>Jika produk mengalami kerusakan selama pengiriman, silakan hubungi kami segera dengan melampirkan foto produk dan kemasan. Kami akan berkoordinasi dengan ekspedisi untuk proses klaim.</p>
        </div>
      </div>
    </div>
  );
}
