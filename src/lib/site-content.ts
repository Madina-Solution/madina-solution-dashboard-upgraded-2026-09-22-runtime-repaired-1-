import { cache } from "react";
import { db } from "@/db";
import { categories, products, services, settings, testimonials } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const FALLBACK_HOMEPAGE = {
  heroTitle: "Bangun Citra Bisnis yang Lebih Profesional",
  heroDescription:
    "Dari desain hingga produksi, Madina Solution membantu bisnis menghadirkan identitas visual yang kuat, konsisten, dan siap tampil di dunia nyata.",
  heroBadge: "Creative Business Platform",
  heroImage:
    "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=85",
  heroImageAlt: "Tim kreatif mengerjakan desain visual untuk kebutuhan bisnis",
};

export const getSiteSettingsMap = cache(async function getSiteSettingsMap() {
  try {
    const rows = await db.select().from(settings);
    return Object.fromEntries(rows.map((row) => [row.key, row.value])) as Record<string, unknown>;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Site settings unavailable; using safe defaults.", error);
    }
    return {};
  }
});

export async function getHomepageContent() {
  const map = await getSiteSettingsMap();
  const valueOf = (key: string): unknown => {
    const raw = map[key];
    if (raw && typeof raw === "object" && "value" in raw) return (raw as { value?: unknown }).value;
    return raw;
  };
  const stringOf = (key: string, fallback: string) => { const value = valueOf(key); return typeof value === "string" && value.trim() ? value : fallback; };
  const numberOf = (key: string, fallback: number) => { const value = valueOf(key); return typeof value === "number" ? value : fallback; };
  return {
    siteName: stringOf("site_name", "Madina Solution"),
    siteTagline: stringOf("site_tagline", "Creative Business Platform"),
    heroTitle: stringOf("hero_title", FALLBACK_HOMEPAGE.heroTitle),
    heroDescription: stringOf("hero_description", FALLBACK_HOMEPAGE.heroDescription),
    heroBadge: stringOf("hero_badge", FALLBACK_HOMEPAGE.heroBadge),
    heroImage: stringOf("hero_image", FALLBACK_HOMEPAGE.heroImage),
    heroImageAlt: stringOf("hero_image_alt", FALLBACK_HOMEPAGE.heroImageAlt),
    ctaTitle: stringOf("cta_title", "Siap Membuat Bisnis Anda Tampil Lebih Profesional?"),
    ctaDescription: stringOf("cta_description", "Konsultasikan kebutuhan desain dan cetak Anda dengan tim kami."),
    responseHours: numberOf("business_response_hours", 24),
  };
}

export async function getSeoSettings() {
  const map = await getSiteSettingsMap();
  const valueOf = (key: string): unknown => {
    const raw = map[key];
    if (raw && typeof raw === "object" && "value" in raw) return (raw as { value?: unknown }).value;
    return raw;
  };
  const stringOf = (key: string, fallback = "") => {
    const value = valueOf(key);
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  };
  return {
    title: stringOf("seo_title"),
    description: stringOf("seo_description"),
    keywords: stringOf("seo_keywords"),
    ogImage: stringOf("seo_og_image"),
    twitterHandle: stringOf("seo_twitter_handle"),
  };
}

export async function getPublicStats() {
  try {
    const [categoryCount, productCount, serviceCount, testimonialCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(categories).where(eq(categories.isActive, true)),
      db.select({ count: sql<number>`count(*)::int` }).from(products).where(eq(products.isActive, true)),
      db.select({ count: sql<number>`count(*)::int` }).from(services).where(eq(services.isActive, true)),
      db.select({ count: sql<number>`count(*)::int` }).from(testimonials).where(eq(testimonials.isActive, true)),
    ]);

    return {
      categories: categoryCount[0]?.count ?? 0,
      products: productCount[0]?.count ?? 0,
      services: serviceCount[0]?.count ?? 0,
      testimonials: testimonialCount[0]?.count ?? 0,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Public stats unavailable; using safe defaults.", error);
    }
    return {
      categories: 8,
      products: 80,
      services: 16,
      testimonials: 24,
    };
  }
}
