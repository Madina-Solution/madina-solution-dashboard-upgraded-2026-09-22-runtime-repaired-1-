

import Link from "next/link";
import { Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteImage } from "@/components/ui/site-image";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { formatDate } from "@/lib/utils";
import { getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

type RelatedArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnail: string | null;
  category: string | null;
  publishedAt: Date | string | null;
};

type Props = {
  articles: RelatedArticle[];
};

export async function RelatedArticles({ articles }: Props) {
  const [rawLocale, t] = await Promise.all([getLocale(), getTranslations("BlogArticle")]);
  const locale = rawLocale as AppLocale;
  if (articles.length === 0) return null;

  return (
    <section className="mt-16 border-t border-dark-100 pt-12">
      <h2 className="text-2xl font-bold text-dark">{t("relatedArticles")}</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <div key={article.id}>
            <Link href={`/blog/${article.slug}`}>
              <Card className="group h-full overflow-hidden transition-all hover:shadow-premium-lg">
                <div className="relative aspect-[16/9] overflow-hidden bg-dark-100">
                  {article.thumbnail ? (
                    <SiteImage
                      src={article.thumbnail}
                      alt={article.title}
                      fill
                      sizes="(max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <MediaPlaceholder />
                  )}
                </div>
                <div className="p-4">
                  {article.category && <Badge variant="secondary" className="mb-2">{article.category}</Badge>}
                  <h3 className="line-clamp-2 font-semibold text-dark group-hover:text-primary">{article.title}</h3>
                  {article.excerpt && <p className="mt-1.5 line-clamp-2 text-sm text-dark-500">{article.excerpt}</p>}
                  {article.publishedAt && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-dark-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(article.publishedAt, locale)}
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
