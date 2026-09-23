import { Shield, Zap, HeartHandshake, Truck, Award, Clock } from "lucide-react";
import { getPublicStats } from "@/lib/site-content";

const benefits = [
  { icon: Award, title: "Kualitas Premium", description: "Material berkualitas tinggi dan hasil cetak yang tajam untuk kesan profesional." },
  { icon: Zap, title: "Proses Cepat", description: "Pengerjaan efisien dengan estimasi waktu yang jelas dan tepat waktu." },
  { icon: HeartHandshake, title: "Layanan Personal", description: "Tim kami siap membantu konsultasi desain dan kebutuhan bisnis Anda." },
  { icon: Shield, title: "Workflow Terlacak", description: "Pesanan, revisi desain, pembayaran, dan produksi tercatat dalam satu platform." },
  { icon: Truck, title: "Pengiriman Aman", description: "Packaging dan pengiriman dipantau sampai pesanan diterima pelanggan." },
  { icon: Clock, title: "Dukungan Konsultasi", description: "Hubungi tim kami untuk mendapatkan arahan sebelum memesan." },
];

export async function WhyUs() {
  const stats = await getPublicStats();
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Mengapa Madina Solution</span>
            <h2 className="mt-3 text-3xl font-bold text-dark sm:text-4xl lg:text-5xl">Partner Terpercaya untuk <span className="text-gradient">Kesuksesan Bisnis</span></h2>
            <p className="mt-6 text-lg text-dark-600">Platform ini menggabungkan katalog, layanan, pemesanan, desain, produksi, pembayaran, dan komunikasi agar proses bisnis lebih terukur.</p>
            <div className="mt-8 grid grid-cols-3 gap-6">
              <div><p className="text-3xl font-bold text-primary">{stats.products}+</p><p className="mt-1 text-sm text-dark-500">Produk</p></div>
              <div><p className="text-3xl font-bold text-primary">{stats.services}+</p><p className="mt-1 text-sm text-dark-500">Layanan</p></div>
              <div><p className="text-3xl font-bold text-primary">{stats.testimonials}+</p><p className="mt-1 text-sm text-dark-500">Testimoni</p></div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="rounded-2xl border border-dark-100 bg-white p-5 transition-shadow hover:shadow-premium">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><benefit.icon className="h-5 w-5" /></div>
                <h3 className="mt-3 font-semibold text-dark">{benefit.title}</h3>
                <p className="mt-1 text-sm text-dark-500">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
