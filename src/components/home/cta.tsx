import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constants";
import { getHomepageContent, getPublicStats } from "@/lib/site-content";

export async function CTA() {
  const [content, stats] = await Promise.all([getHomepageContent(), getPublicStats()]);
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-dark py-20 lg:py-28">
      <div className="absolute inset-0 opacity-10"><div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white blur-3xl" /><div className="absolute -bottom-20 right-0 h-96 w-96 rounded-full bg-white blur-3xl" /></div>
      <div className="relative mx-auto max-w-7xl px-4 lg:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">{content.ctaTitle}</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80">{content.ctaDescription}</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="xl" className="bg-white text-primary hover:bg-white/90" asChild><Link href="/products">Mulai Pesanan<ArrowRight className="ml-2 h-5 w-5" /></Link></Button>
            <Button size="xl" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild><a href={`https://wa.me/${BRAND.whatsapp}?text=Halo%20Madina%20Solution%2C%20saya%20ingin%20konsultasi.`} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2 h-5 w-5" />Chat WhatsApp</a></Button>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-6 text-white/70 sm:grid-cols-4">
            <div><span className="text-2xl font-bold text-white">{stats.products}+</span><p>Produk</p></div>
            <div><span className="text-2xl font-bold text-white">{stats.services}+</span><p>Layanan</p></div>
            <div><span className="text-2xl font-bold text-white">{stats.testimonials}+</span><p>Testimoni</p></div>
            <div><span className="text-2xl font-bold text-white">{stats.categories}</span><p>Kategori</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
