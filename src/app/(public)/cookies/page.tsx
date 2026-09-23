import { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { BRAND } from "@/lib/constants";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({ title: "Kebijakan Cookie", description: "Kebijakan penggunaan cookie pada platform Madina Solution.", path: "/cookies" });

export default function CookiesPage() {
  return (
    <div>
      <PageHeader title="Kebijakan Cookie" description="Informasi tentang cookie dan teknologi penyimpanan yang digunakan di situs Madina Solution." breadcrumbs={[{ label: "Beranda", href: "/" }, { label: "Kebijakan Cookie" }]} />
      <article className="mx-auto max-w-4xl px-4 py-12 lg:px-6">
        <div className="space-y-8 text-dark-700">
          <section><h2 className="text-xl font-semibold text-dark">1. Cookie esensial</h2><p className="mt-2 leading-7">Cookie esensial membantu autentikasi, keamanan, keranjang, dan penyimpanan pilihan privasi. Cookie ini tetap dapat digunakan ketika cookie non-esensial ditolak.</p></section>
          <section><h2 className="text-xl font-semibold text-dark">2. Cookie non-esensial</h2><p className="mt-2 leading-7">Cookie analitik dan teknologi iklan hanya dijalankan sesuai konfigurasi situs dan persetujuan yang diperlukan. Pengguna dapat menolak cookie non-esensial melalui banner privasi.</p></section>
          <section><h2 className="text-xl font-semibold text-dark">3. Google AdSense</h2><p className="mt-2 leading-7">Situs dapat menggunakan Google AdSense untuk menayangkan iklan. Google dapat menggunakan cookie atau penyimpanan lokal untuk penayangan, personalisasi, dan pengukuran sesuai pengaturan privasi yang berlaku.</p></section>
          <section><h2 className="text-xl font-semibold text-dark">4. Preferensi Anda</h2><p className="mt-2 leading-7">Anda dapat menghapus atau membatasi cookie melalui pengaturan browser. Menghapus cookie dapat menghilangkan preferensi yang tersimpan pada situs ini.</p></section>
          <section><h2 className="text-xl font-semibold text-dark">5. Kontak</h2><p className="mt-2 leading-7">Untuk pertanyaan privasi dan cookie, hubungi {BRAND.email} atau WhatsApp +62 813-9300-5035.</p></section>
        </div>
      </article>
    </div>
  );
}
