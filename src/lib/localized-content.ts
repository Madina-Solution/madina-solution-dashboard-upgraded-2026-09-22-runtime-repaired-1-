import type { AppLocale } from "@/i18n/routing";
import type { QuickNavItem } from "@/lib/navigation";
import type { Article, ArticleTranslation, ArticleTranslations, NavigationItemRow, NavigationTranslations, ProductTranslation, ProductTranslations, ServiceTranslation, ServiceTranslations, PortfolioTranslation, PortfolioTranslations, FaqTranslation, FaqTranslations, CategoryTranslation, CategoryTranslations } from "@/db/schema";

const NAV_EN_FALLBACKS: Record<string, { name: string; description?: string }> = {
  "/services/logo-design": { name: "Logo Design", description: "Create a clear visual identity for your brand" },
  "/services/brand-identity": { name: "Brand Identity", description: "A complete visual system for your brand" },
  "/services/social-media-design": { name: "Social Media Design", description: "Visual content for social channels" },
  "/services/packaging-design": { name: "Packaging Design", description: "Product packaging designed to stand out" },
  "/products?category=banner": { name: "Banners & Signage", description: "Large-format print for promotion and events" },
  "/products?category=sticker": { name: "Stickers", description: "Custom stickers for products and promotion" },
  "/products?category=kartu-nama": { name: "Business Cards", description: "Professional cards for everyday networking" },
  "/products?category=brosur": { name: "Brochures", description: "Print brochures for campaigns and sales" },
  "/products?category=undangan": { name: "Invitations", description: "Invitations for events and celebrations" },
  "/products?category=poster": { name: "Posters", description: "High-impact promotional posters" },
  "/products?category=kalender": { name: "Calendars", description: "Branded calendars for business and gifts" },
  "/products?category=signage": { name: "Signage", description: "Indoor and outdoor business signage" },
  "/portfolio": { name: "Portfolio", description: "Selected work and visual case studies" },
  "/blog": { name: "Articles & Insight", description: "Practical design and printing guidance" },
  "/faq": { name: "FAQ", description: "Frequently asked questions" },
  "/about": { name: "About Us", description: "Learn about Madina Solution" },
  "/contact": { name: "Contact", description: "Talk to our team" },
};

function clean(value: string | null | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

type ArticleLocalizable = Pick<Article, "title" | "translations"> &
  Partial<Pick<Article, "excerpt" | "content" | "category" | "tags">>;

export function resolveLocalizedArticle<T extends ArticleLocalizable>(article: T, locale: AppLocale): T & { localizedSeo?: ArticleTranslation["seo"] } {
  const translations = (article.translations || {}) as ArticleTranslations;
  const localized = translations[locale] || {};
  const fallback = translations.id || {};
  return {
    ...article,
    title: clean(localized.title) || clean(fallback.title) || article.title,
    excerpt: clean(localized.excerpt) || clean(fallback.excerpt) || article.excerpt,
    content: clean(localized.content) || clean(fallback.content) || article.content,
    category: clean(localized.category) || clean(fallback.category) || article.category,
    tags: localized.tags?.length ? localized.tags : fallback.tags?.length ? fallback.tags : ((article.tags as string[] | null) || []),
    localizedSeo: localized.seo || fallback.seo,
  };
}

export function resolveLocalizedNavigation(row: NavigationItemRow, locale: AppLocale) {
  const translations = (row.translations || {}) as NavigationTranslations;
  const localized = translations[locale] || {};
  const fallback = translations.id || {};
  const englishFallback = locale === "en" ? NAV_EN_FALLBACKS[row.href] : undefined;
  return {
    name: clean(localized.name) || clean(fallback.name) || englishFallback?.name || row.name,
    href: row.href,
    icon: row.icon,
    description: clean(localized.description) || clean(fallback.description) || englishFallback?.description || row.description || undefined,
  };
}


type ProductLocalizable = { name: string; shortDescription?: string | null; description?: string | null; specifications?: Record<string, string> | null; translations?: ProductTranslations | null };
type ServiceLocalizable = { name: string; shortDescription?: string | null; description?: string | null; features?: string[] | null; deliverables?: string[] | null; translations?: ServiceTranslations | null };
type PortfolioLocalizable = { title: string; description: string | null; category: string | null; client: string | null; tags: string[] | null; translations?: PortfolioTranslations | null };
type CategoryLocalizable = { name: string; description?: string | null; translations?: CategoryTranslations | null };
type FaqLocalizable = { question: string; answer: string; category: string | null; translations?: FaqTranslations | null };

function pickTranslation<T extends Record<string, unknown>>(translations: { id?: T; en?: T } | null | undefined, locale: AppLocale): T {
  return ((translations?.[locale] || translations?.id || {}) as T);
}

export function resolveLocalizedProduct<T extends ProductLocalizable>(product: T, locale: AppLocale): T {
  const localized = pickTranslation<ProductTranslation>(product.translations as ProductTranslations | null | undefined, locale);
  return {
    ...product,
    name: clean(localized.name) || product.name,
    shortDescription: clean(localized.shortDescription) || product.shortDescription,
    description: clean(localized.description) || product.description,
    specifications: localized.specifications && Object.keys(localized.specifications).length ? localized.specifications : product.specifications,
  } as T;
}

export function resolveLocalizedService<T extends ServiceLocalizable>(service: T, locale: AppLocale): T {
  const localized = pickTranslation<ServiceTranslation>(service.translations as ServiceTranslations | null | undefined, locale);
  return {
    ...service,
    name: clean(localized.name) || service.name,
    shortDescription: clean(localized.shortDescription) || service.shortDescription,
    description: clean(localized.description) || service.description,
    features: localized.features?.length ? localized.features : service.features,
    deliverables: localized.deliverables?.length ? localized.deliverables : service.deliverables,
  } as T;
}

export function resolveLocalizedPortfolio<T extends PortfolioLocalizable>(item: T, locale: AppLocale): T {
  const localized = pickTranslation<PortfolioTranslation>(item.translations as PortfolioTranslations | null | undefined, locale);
  return {
    ...item,
    title: clean(localized.title) || item.title,
    description: clean(localized.description) || item.description,
    category: clean(localized.category) || item.category,
    client: clean(localized.client) || item.client,
    tags: localized.tags?.length ? localized.tags : item.tags,
  } as T;
}

export function resolveLocalizedCategory<T extends CategoryLocalizable>(item: T, locale: AppLocale): T {
  const localized = pickTranslation<CategoryTranslation>(item.translations as CategoryTranslations | null | undefined, locale);
  return { ...item, name: clean(localized.name) || item.name, description: clean(localized.description) || item.description } as T;
}

export function resolveLocalizedFaq<T extends FaqLocalizable>(item: T, locale: AppLocale): T {
  const localized = pickTranslation<FaqTranslation>(item.translations as FaqTranslations | null | undefined, locale);
  return {
    ...item,
    question: clean(localized.question) || item.question,
    answer: clean(localized.answer) || item.answer,
    category: clean(localized.category) || item.category,
  } as T;
}

export function resolveLocalizedQuickNavItem(item: QuickNavItem, locale: AppLocale): QuickNavItem {
  const fallback = locale === "en" ? NAV_EN_FALLBACKS[item.href] : undefined;
  return { ...item, name: fallback?.name || item.name, description: fallback?.description || item.description };
}
