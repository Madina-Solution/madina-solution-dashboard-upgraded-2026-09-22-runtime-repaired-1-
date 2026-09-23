import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building, ChevronRight, ExternalLink, Tag } from "lucide-react";
import { db } from "@/db";
import { portfolio } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteImage } from "@/components/ui/site-image";
import { MediaCarousel } from "@/components/ui/media-carousel";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { buildPageMetadata } from "@/lib/seo";
import { BreadcrumbSchema, CreativeWorkSchema } from "@/components/seo/json-ld";
import { getLocale } from "next-intl/server";
import { resolveLocalizedPortfolio } from "@/lib/localized-content";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ slug: string }> };

/** Revalidate public detail content frequently without rebuilding the whole site. */
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as AppLocale;
  const result = await db.select({ title: portfolio.title, description: portfolio.description, category: portfolio.category, client: portfolio.client, tags: portfolio.tags, thumbnail: portfolio.thumbnail, translations: portfolio.translations }).from(portfolio).where(eq(portfolio.slug, slug)).limit(1);
  if (!result[0]) return { title: locale === "en" ? "Portfolio Not Found" : "Portfolio Tidak Ditemukan" };
  const localized = resolveLocalizedPortfolio(result[0], locale);
  return buildPageMetadata({ title: localized.title, description: localized.description || `${localized.title} — Madina Solution Portfolio`, path: `/portfolio/${encodeURIComponent(slug)}`, image: result[0].thumbnail || undefined });
}

export default async function PortfolioDetailPage({ params }: Props) {
  const { slug } = await params;
  const [result] = await Promise.all([
    db.select().from(portfolio).where(and(eq(portfolio.slug, slug), eq(portfolio.isActive, true))).limit(1),
  ]);
  const rawItem = result[0];
  const locale = (await getLocale()) as AppLocale;
  const item = rawItem ? resolveLocalizedPortfolio(rawItem, locale) : undefined;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://madinasolution.vercel.app";
  const pageUrl = `${siteUrl}/portfolio/${encodeURIComponent(slug)}`;
  if (!item) notFound();

  const relatedSource = await db.select({ id: portfolio.id, title: portfolio.title, slug: portfolio.slug, category: portfolio.category, client: portfolio.client, thumbnail: portfolio.thumbnail, description: portfolio.description, tags: portfolio.tags, translations: portfolio.translations }).from(portfolio).where(and(ne(portfolio.id, item.id), eq(portfolio.isActive, true))).limit(4);
  const related = relatedSource.map((entry) => resolveLocalizedPortfolio(entry, locale));
  const tags = (item.tags as string[]) || [];
  const gallery = Array.from(new Set([item.thumbnail, ...((item.images as string[]) || [])].filter(Boolean) as string[]));

  return (
    <>
      <BreadcrumbSchema items={[{ name: "Beranda", url: siteUrl }, { name: "Portfolio", url: `${siteUrl}/portfolio` }, { name: item.title, url: pageUrl }]} />
      <CreativeWorkSchema name={item.title} description={item.description || `Portfolio ${item.title}`} url={pageUrl} image={item.thumbnail || undefined} client={item.client || undefined} />
      <div className="bg-white">
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6 lg:py-16">
        <nav className="mb-8 flex items-center gap-2 text-sm text-dark-500"><Link href="/" className="hover:text-primary">Beranda</Link><ChevronRight className="h-4 w-4" /><Link href="/portfolio" className="hover:text-primary">Portfolio</Link><ChevronRight className="h-4 w-4" /><span className="font-medium text-dark">{item.title}</span></nav>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)] lg:items-start">
          <div>
            <MediaCarousel items={gallery} alt={item.title} className="lg:sticky lg:top-24" />
          </div>
          <aside className="lg:pt-2">
            {item.category && <Badge variant="secondary">{item.category}</Badge>}
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-dark sm:text-5xl">{item.title}</h1>
            {item.client && <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-dark-50 px-4 py-2 text-sm font-medium text-dark-600"><Building className="h-4 w-4 text-primary" />{item.client}</div>}
            {item.description && <p className="mt-6 text-base leading-8 text-dark-600">{item.description}</p>}
            {tags.length > 0 && <div className="mt-7"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-dark-400">Tags</p><div className="mt-3 flex flex-wrap gap-2">{tags.map((tag) => <Badge key={tag} variant="outline"><Tag className="mr-1 h-3 w-3" />{tag}</Badge>)}</div></div>}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col"><Button size="lg" asChild><Link href="/contact">Mulai proyek serupa <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button size="lg" variant="outline" asChild><Link href="/portfolio"><ArrowLeft className="mr-2 h-4 w-4" />Kembali ke portfolio</Link></Button></div>
          </aside>
        </div>

        {related.length > 0 && <section className="mt-20 border-t border-dark-100 pt-12"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Explore more</p><h2 className="mt-2 text-2xl font-bold text-dark sm:text-3xl">Portfolio lainnya</h2></div><Link href="/portfolio" className="hidden text-sm font-semibold text-primary sm:inline-flex">Lihat semua <ExternalLink className="ml-1 h-4 w-4" /></Link></div><div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map((relatedItem) => <Link key={relatedItem.id} href={`/portfolio/${relatedItem.slug}`}><Card className="group h-full overflow-hidden border-dark-100 transition-all hover:-translate-y-1 hover:shadow-premium"><div className="relative aspect-[4/3] bg-dark-50">{relatedItem.thumbnail ? <SiteImage src={relatedItem.thumbnail} alt={relatedItem.title} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" /> : <MediaPlaceholder />}</div><CardContent className="p-4"><h3 className="font-semibold text-dark group-hover:text-primary">{relatedItem.title}</h3><p className="mt-1 text-xs text-dark-500">{relatedItem.client || relatedItem.category || "Madina Solution"}</p></CardContent></Card></Link>)}</div></section>}
      </main>
      </div>
    </>
  );
}
