import { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({ title: "Kebijakan Pengembalian", description: "Kebijakan pembatalan, pengembalian dana, dan penanganan produk atau layanan Madina Solution.", path: "/refund-policy" });

export default function RefundPolicyPage() {
  return (
    <div>
      <PageHeader
        title="Kebijakan Pengembalian"
        description="Terakhir diperbarui: Agustus 2026"
        breadcrumbs={[{ label: "Beranda", href: "/" }, { label: "Kebijakan Pengembalian" }]}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 lg:px-6">
        <div className="prose prose-dark max-w-none space-y-6 text-dark-700">
          <h2 className="text-xl font-semibold text-dark">1. Pembatalan Sebelum Produksi</h2>
          <p>Pesanan dapat dibatalkan sepenuhnya jika proses desain atau produksi belum dimulai. Pengembalian dana akan diproses dalam 7 hari kerja.</p>

          <h2 className="text-xl font-semibold text-dark">2. Pembatalan Saat Proses Desain</h2>
          <p>Jika pesanan dibatalkan saat proses desain berlangsung, biaya desain yang telah dikerjakan tidak dapat dikembalikan.</p>

          <h2 className="text-xl font-semibold text-dark">3. Pembatalan Saat Produksi</h2>
          <p>Pesanan yang telah memasuki tahap produksi tidak dapat dibatalkan. Produk custom printing dibuat khusus sesuai spesifikasi pelanggan.</p>

          <h2 className="text-xl font-semibold text-dark">4. Produk Cacat</h2>
          <p>Jika produk yang diterima tidak sesuai dengan desain yang telah disetujui (bukan karena kesalahan file pelanggan), kami akan melakukan cetak ulang tanpa biaya tambahan atau memberikan pengembalian dana sesuai kesepakatan.</p>

          <h2 className="text-xl font-semibold text-dark">5. Proses Pengembalian</h2>
          <p>Untuk mengajukan pengembalian, silakan hubungi kami melalui WhatsApp atau email dengan menyertakan nomor pesanan dan alasan pengembalian. Tim kami akan merespons dalam 1×24 jam kerja.</p>
        </div>
      </div>
    </div>
  );
}
