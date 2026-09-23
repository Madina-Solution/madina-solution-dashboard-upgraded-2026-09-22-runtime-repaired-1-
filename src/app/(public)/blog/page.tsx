import { SiteImage } from "@/components/ui/site-image";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { Metadata } from "next";
import { db } from "@/db";
import { ensureRuntimeSchema } from "@/db/ensure-runtime-schema";
import { articles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ArrowRight, Clock, FileText, Sparkles } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo";
import { getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { resolveLocalizedArticle } from "@/lib/localized-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Blog");
  return buildPageMetadata({ title: "Blog & Insight", description: t("description"), path: "/blog" });
}
export const revalidate = 60;

type Props = { searchParams: Promise<{ q?: string; category?: string }> };

function readTime(html: string | null) {
  const words = (html || "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
function articleExcerpt(excerpt: string | null, content: string | null) {
  const value = excerpt?.replace(/\s+/g, " ").trim();
  if (value) return value;
  const plain = (content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return plain ? `${plain.slice(0, 180).trimEnd()}${plain.length > 180 ? "…" : ""}` : "";
}

export default async function BlogPage({ searchParams }: Props) {
  await ensureRuntimeSchema();
  const params = await searchParams;
  const [rawLocale, t] = await Promise.all([getLocale(), getTranslations("Blog")]);
  const locale = rawLocale as AppLocale;
  const q = (params.q || "").trim().toLowerCase();
  const category = (params.category || "").trim();
  const sourceArticles = await db.select().from(articles).where(eq(articles.isPublished, true)).orderBy(desc(articles.publishedAt));
  const all = sourceArticles.map((article) => resolveLocalizedArticle(article, locale));
  const filtered = all.filter((article) => {
    const matchQ = !q || [article.title, article.excerpt, article.category, ...(article.tags || [])].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    const matchCategory = !category || article.category === category;
    return matchQ && matchCategory;
  });
  const featured = filtered.find((a) => Boolean(a.metadata?.editorial?.featured)) || filtered[0];
  const rest = filtered.filter((a) => a.id !== featured?.id);
  const categories = Array.from(new Set(all.map((a) => a.category).filter(Boolean))) as string[];

  return (
    <div className="pb-16">
      <section className="border-b border-dark-100 bg-gradient-to-b from-dark-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-14 lg:px-6 lg:py-20">
          <div className="max-w-3xl">
            <Badge variant="secondary"><Sparkles className="mr-1 h-3.5 w-3.5"/>{t("badge")}</Badge>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-dark lg:text-6xl">{t("title")}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-dark-500 lg:text-lg">{t("description")}</p>
          </div>
          <form className="mt-8 flex max-w-3xl flex-col gap-3 sm:flex-row" action="/blog">
            <input name="q" defaultValue={q} placeholder={t("searchPlaceholder")} className="h-12 flex-1 rounded-xl border border-dark-200 bg-white px-4 text-sm outline-none ring-primary/20 focus:ring-4" aria-label={t("searchPlaceholder")} />
            <button className="h-12 rounded-xl bg-dark-900 px-6 text-sm font-semibold text-white hover:bg-dark-800" type="submit">{t("searchButton")}</button>
          </form>
          {categories.length > 0 && <div className="mt-5 flex flex-wrap gap-2"><Link href="/blog" className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${!category ? "border-primary bg-primary text-white" : "border-dark-200 text-dark-600"}`}>{t("all")}</Link>{categories.map((item) => <Link key={item} href={`/blog?category=${encodeURIComponent(item)}`} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${category===item ? "border-primary bg-primary text-white" : "border-dark-200 text-dark-600"}`}>{item}</Link>)}</div>}
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pt-10 lg:px-6">
        {featured ? <section className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
          <Link href={`/blog/${featured.slug}`} className="group overflow-hidden rounded-3xl border border-dark-100 bg-white shadow-sm">
            <div className="relative aspect-[16/9] overflow-hidden bg-dark-100">{featured.thumbnail ? <SiteImage src={featured.thumbnail} alt={featured.title} fill priority sizes="(max-width: 1024px) 100vw, 70vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"/> : <MediaPlaceholder/>}<div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-dark">{t("featured")}</div></div>
            <div className="p-6 lg:p-8"><div className="flex flex-wrap items-center gap-2 text-xs text-dark-400">{featured.category && <Badge variant="secondary">{featured.category}</Badge>}<span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5"/>{t("minRead", { minutes: featured.metadata?.editorial?.readingTime || readTime(featured.content) })}</span></div><h2 className="mt-3 text-2xl font-black tracking-tight text-dark group-hover:text-primary lg:text-4xl">{featured.title}</h2>{articleExcerpt(featured.excerpt, featured.content) && <p className="mt-3 max-w-2xl text-dark-500 lg:text-lg">{articleExcerpt(featured.excerpt, featured.content)}</p>}<p className="mt-5 text-xs text-dark-400">{featured.publishedAt ? formatDate(featured.publishedAt, locale) : formatDate(featured.createdAt, locale)}</p></div>
          </Link>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">{rest.slice(0,3).map((article) => <Link key={article.id} href={`/blog/${article.slug}`} className="group rounded-2xl border border-dark-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex gap-4"><div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-dark-100">{article.thumbnail ? <SiteImage src={article.thumbnail} alt={article.title} fill sizes="128px" className="object-cover"/> : <MediaPlaceholder/>}</div><div className="min-w-0"><div className="flex items-center gap-2 text-[11px] text-dark-400">{article.category && <span>{article.category}</span>}<span>•</span><span>{t("minRead", { minutes: readTime(article.content) })}</span></div><h3 className="mt-1 line-clamp-3 text-sm font-bold leading-5 text-dark group-hover:text-primary">{article.title}</h3></div></div></Link>)}</div>
        </section> : <div className="py-24 text-center"><FileText className="mx-auto h-12 w-12 text-dark-300"/><h2 className="mt-4 text-xl font-bold text-dark">{t("emptyTitle")}</h2><p className="mt-2 text-dark-500">{t("emptyText")}</p></div>}

        {rest.length > 3 && <section className="mt-14"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">{t("latestLabel")}</p><h2 className="mt-1 text-2xl font-black text-dark">{t("latestTitle")}</h2></div><span className="text-sm text-dark-400">{t("articleCount", { count: rest.length })}</span></div><div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{rest.slice(3).map((article) => <Link key={article.id} href={`/blog/${article.slug}`} className="group overflow-hidden rounded-2xl border border-dark-100 bg-white shadow-sm"><div className="relative aspect-[16/9] overflow-hidden bg-dark-100">{article.thumbnail ? <SiteImage src={article.thumbnail} alt={article.title} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"/> : <MediaPlaceholder/>}</div><div className="p-5">{article.category && <Badge variant="secondary">{article.category}</Badge>}<h3 className="mt-3 line-clamp-2 text-lg font-bold text-dark group-hover:text-primary">{article.title}</h3>{articleExcerpt(article.excerpt, article.content) && <p className="mt-2 line-clamp-2 text-sm text-dark-500">{articleExcerpt(article.excerpt, article.content)}</p>}<div className="mt-4 flex items-center justify-between text-xs text-dark-400"><span>{article.publishedAt ? formatDate(article.publishedAt, locale) : formatDate(article.createdAt, locale)}</span><span className="flex items-center gap-1">{t("read")} <ArrowRight className="h-3.5 w-3.5"/></span></div></div></Link>)}</div></section>}
      </main>
    </div>
  );
}
