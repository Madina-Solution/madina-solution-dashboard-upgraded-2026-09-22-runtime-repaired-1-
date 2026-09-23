import type { MetadataRoute } from "next";
import { db } from "@/db";
import { products, categories, articles, portfolio } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSiteUrl } from "@/lib/seo";

const BASE_URL = getSiteUrl();

const staticPages: MetadataRoute.Sitemap = [
  { url: BASE_URL, changeFrequency: "weekly", priority: 1.0 },
  { url: `${BASE_URL}/products`, changeFrequency: "daily", priority: 0.9 },
  { url: `${BASE_URL}/services`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${BASE_URL}/portfolio`, changeFrequency: "weekly", priority: 0.7 },
  { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE_URL}/privacy`, changeFrequency: "monthly", priority: 0.3 },
  { url: `${BASE_URL}/cookies`, changeFrequency: "monthly", priority: 0.2 },
  { url: `${BASE_URL}/terms`, changeFrequency: "monthly", priority: 0.3 },
  { url: `${BASE_URL}/refund-policy`, changeFrequency: "monthly", priority: 0.3 },
  { url: `${BASE_URL}/shipping-policy`, changeFrequency: "monthly", priority: 0.3 },
  { url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 0.7 },
  { url: `${BASE_URL}/faq`, changeFrequency: "monthly", priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [productList, categoryList, articleList, portfolioList] = await Promise.all([
      db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.isActive, true)),
      db.select({ slug: categories.slug, updatedAt: categories.updatedAt }).from(categories).where(eq(categories.isActive, true)),
      db.select({ slug: articles.slug, updatedAt: articles.updatedAt }).from(articles).where(eq(articles.isPublished, true)),
      db.select({ slug: portfolio.slug, updatedAt: portfolio.updatedAt }).from(portfolio).where(eq(portfolio.isActive, true)),
    ]);
    return [
      ...staticPages,
      ...productList.map((p) => ({ url: `${BASE_URL}/products/${encodeURIComponent(p.slug)}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
      ...categoryList.map((c) => ({ url: `${BASE_URL}/products/category/${encodeURIComponent(c.slug)}`, lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
      ...articleList.map((a) => ({ url: `${BASE_URL}/blog/${encodeURIComponent(a.slug)}`, lastModified: a.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
      ...portfolioList.map((p) => ({ url: `${BASE_URL}/portfolio/${encodeURIComponent(p.slug)}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
    ];
  } catch {
    return staticPages;
  }
}
