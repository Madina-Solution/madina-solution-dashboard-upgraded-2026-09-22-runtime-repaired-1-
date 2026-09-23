import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, Images, Sparkles } from "lucide-react";
import { db } from "@/db";
import { portfolio } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteImage } from "@/components/ui/site-image";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({ title: "Portfolio", description: "Kumpulan karya desain, branding, printing, advertising, dan proyek visual Madina Solution.", path: "/portfolio" });

// ISR: page is cached and regenerated in the background at most every 60s,
// instead of re-running the full render + DB queries on every single visit.
// Admin changes (new product, price update, etc.) appear within this window.
export const revalidate = 60;

export default async function PortfolioPage() {
  const items = await db.select().from(portfolio).where(eq(portfolio.isActive, true)).orderBy(desc(portfolio.isFeatured), desc(portfolio.createdAt));
  const featured = items.filter((item) => item.isFeatured).slice(0, 2);
  const rest = items.filter((item) => !featured.some((featuredItem) => featuredItem.id === item.id));

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden border-b border-dark-100 bg-gradient-to-br from-dark-950 via-dark-900 to-primary-950 text-white">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 lg:px-6 lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80"><Sparkles className="h-3.5 w-3.5 text-primary" />Selected Work</span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Karya yang dirancang untuk terlihat, terasa, dan diingat.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">Eksplorasi proyek Madina Solution dari identitas brand hingga produksi visual. Setiap proyek dibuat dengan perhatian pada strategi, detail dan hasil akhir.</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/70">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">{items.length} proyek</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Design • Print • Branding</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Visual Production</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6 lg:py-16">
        {items.length > 0 ? (
          <>
            {featured.length > 0 && (
              <section>
                <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Featured projects</p><h2 className="mt-2 text-2xl font-bold text-dark sm:text-3xl">Pilihan terbaru kami</h2></div><Button variant="ghost" asChild><Link href="/contact">Mulai proyek <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
                <div className="grid gap-6 lg:grid-cols-2">
                  {featured.map((item) => {
                    const tags = (item.tags as string[]) || [];
                    return <Link key={item.id} href={`/portfolio/${item.slug}`} className="group"><Card className="overflow-hidden border-dark-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-premium-lg">
                      <div className="relative aspect-[16/10] overflow-hidden bg-dark-50">
                        {item.thumbnail ? <SiteImage src={item.thumbnail} alt={item.title} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" /> : <MediaPlaceholder />}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/0 to-black/0" />
                        <div className="absolute inset-x-0 bottom-0 p-6 text-white"><Badge className="mb-3 bg-white/15 text-white hover:bg-white/20">Featured</Badge><h3 className="text-2xl font-bold">{item.title}</h3><p className="mt-1 text-sm text-white/75">{item.client || item.category || "Madina Solution"}</p></div>
                      </div>
                      <div className="flex items-center justify-between gap-4 p-5"><div className="flex flex-wrap gap-2">{tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-dark-50 px-2.5 py-1 text-xs font-medium text-dark-500">{tag}</span>)}</div><span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">Detail <ExternalLink className="h-4 w-4" /></span></div>
                    </Card></Link>;
                  })}
                </div>
              </section>
            )}

            <section className="mt-16">
              <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Portfolio library</p><h2 className="mt-2 text-2xl font-bold text-dark sm:text-3xl">Jelajahi karya lainnya</h2></div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((item, index) => {
                  const tags = (item.tags as string[]) || [];
                  const tall = index % 4 === 1;
                  return <Link key={item.id} href={`/portfolio/${item.slug}`} className="group">
                    <Card className="h-full overflow-hidden border-dark-100 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-premium-lg">
                      <div className={`relative overflow-hidden bg-dark-50 ${tall ? "aspect-[4/5]" : "aspect-[4/3]"}`}>
                        {item.thumbnail ? <SiteImage src={item.thumbnail} alt={item.title} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" /> : <MediaPlaceholder />}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-70" />
                        <div className="absolute left-4 top-4">{item.category && <Badge className="bg-white/90 text-dark-800 hover:bg-white">{item.category}</Badge>}</div>
                        <div className="absolute inset-x-0 bottom-0 p-5 text-white"><h3 className="text-lg font-bold">{item.title}</h3><p className="mt-1 text-xs text-white/70">{item.client || "Madina Solution"}</p></div>
                      </div>
                      <div className="p-5"><p className="line-clamp-2 text-sm leading-6 text-dark-500">{item.description || "Eksplorasi detail proyek dan pendekatan visual yang digunakan."}</p><div className="mt-4 flex items-center justify-between"><div className="flex -space-x-1">{tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full border border-white bg-dark-50 px-2 py-1 text-[10px] font-semibold text-dark-500">{tag}</span>)}</div><ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" /></div></div>
                    </Card>
                  </Link>;
                })}
              </div>
            </section>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-dark-200 bg-dark-50 px-6 py-24 text-center"><Images className="h-12 w-12 text-dark-300" /><h2 className="mt-4 text-xl font-semibold text-dark">Belum ada portfolio</h2><p className="mt-2 max-w-md text-dark-500">Proyek akan tampil di sini setelah dipublikasikan dari dashboard admin.</p></div>
        )}
      </div>
    </div>
  );
}
