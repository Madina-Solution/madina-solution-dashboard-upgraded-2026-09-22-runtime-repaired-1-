import { SiteImage } from "@/components/ui/site-image";
import { ArrowRight, Play, Sparkles, Package, Layers3, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getHomepageContent, getPublicStats } from "@/lib/site-content";

export async function Hero() {
  const [content, stats] = await Promise.all([getHomepageContent(), getPublicStats()]);
  const statItems = [
    { icon: Package, value: `${stats.products}+`, label: "Produk Aktif" },
    { icon: Layers3, value: `${stats.services}+`, label: "Layanan" },
    { icon: Sparkles, value: `${stats.testimonials}+`, label: "Testimoni" },
    { icon: MessageCircle, value: `< ${content.responseHours} Jam`, label: "Respons Konsultasi" },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-white">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-20 lg:px-6 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {content.heroBadge}
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-dark sm:text-5xl lg:text-6xl">
              {content.heroTitle}
            </h1>
            <p className="mt-6 text-lg text-dark-600 lg:text-xl">{content.heroDescription}</p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/products">Mulai Pesanan<ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/portfolio"><Play className="mr-2 h-5 w-5" />Lihat Portfolio</Link>
              </Button>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {statItems.map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="mx-auto h-6 w-6 text-primary" />
                  <p className="mt-2 text-2xl font-bold text-dark">{stat.value}</p>
                  <p className="text-sm text-dark-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-1 shadow-premium-lg lg:aspect-[4/3]">
              {content.heroImage.includes("/video/upload/") || /\.(mp4|webm|mov)(?:[?#].*)?$/i.test(content.heroImage) ? <video src={content.heroImage} autoPlay muted loop playsInline preload="metadata" className="h-full w-full rounded-[1.25rem] object-cover" aria-label={content.heroImageAlt} /> : <SiteImage
                src={content.heroImage}
                alt={content.heroImageAlt}
                fill
                priority
                quality={75}
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 85vw, 50vw"
                className="h-full w-full rounded-[1.25rem] object-cover"
              />}
              <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-black/60 p-5 text-white backdrop-blur-md">
                <p className="text-sm font-medium text-white/70">{content.siteName}</p>
                <p className="mt-1 text-lg font-semibold">{content.siteTagline}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
