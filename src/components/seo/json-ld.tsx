
import { BRAND } from "@/lib/constants";
import { getPublicSiteConfig } from "@/lib/site-config";

type Props = { data: Record<string, unknown> };

function safeJson(data: Record<string, unknown>) {
  return JSON.stringify(data).replace(/</g, "\u003c").replace(/>/g, "\u003e").replace(/&/g, "\u0026");
}

export function JsonLd({ data }: Props) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(data) }} />;
}

export async function OrganizationSchema() {
  const site = await getPublicSiteConfig();
  return <JsonLd data={{
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    name: site.siteName,
    description: site.seoDescription || BRAND.description,
    url: site.siteUrl,
    logo: site.siteLogo || undefined,
    image: site.seoOgImage || `${site.siteUrl}/opengraph-image`,
    telephone: site.sitePhone ? `+${site.sitePhone.replace(/\D/g, "")}` : undefined,
    email: site.siteEmail || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.siteAddress,
      addressLocality: "Kedu",
      addressRegion: "Jawa Tengah",
      addressCountry: "ID",
    },
    areaServed: { "@type": "Country", name: "Indonesia" },
    priceRange: "$$",
    sameAs: [],
  }} />;
}

export async function WebSiteSchema() {
  const site = await getPublicSiteConfig();
  return <JsonLd data={{
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.siteName,
    url: site.siteUrl,
    inLanguage: "id-ID",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${site.siteUrl}/products?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  }} />;
}

export function WebPageSchema({ name, description, url }: { name: string; description: string; url: string }) {
  return <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name, description, url, inLanguage: "id-ID" }} />;
}

export function ProductSchema({ name, description, price, currency = "IDR", availability = "InStock", url, image, sku, mpn, gtin, brandName, condition, rating, reviewCount, inLanguage }: {
  name: string; description: string; price: number; currency?: string; availability?: string; url: string; image?: string; sku?: string; mpn?: string; gtin?: string; brandName?: string; condition?: "new" | "used" | "refurbished"; rating?: number; reviewCount?: number; inLanguage?: string;
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org", "@type": "Product", name, description, url, ...(inLanguage ? { inLanguage } : {}),
    brand: { "@type": "Brand", name: brandName || BRAND.name },
    offers: { "@type": "Offer", price, priceCurrency: currency, availability: `https://schema.org/${availability}`, url },
  };
  if (image) data.image = image;
  if (sku) data.sku = sku;
  if (mpn) data.mpn = mpn;
  if (gtin) {
    const digits = gtin.trim();
    const specific = digits.match(/^(\d{8}|\d{12}|\d{13}|\d{14})$/);
    data[specific ? `gtin${specific[1].length}` : "gtin"] = specific ? specific[1] : digits;
  }
  if (condition) {
    data.offers = { ...(data.offers as Record<string, unknown>), itemCondition: `https://schema.org/${condition === "new" ? "NewCondition" : condition === "used" ? "UsedCondition" : "RefurbishedCondition"}` };
  }
  if (rating && reviewCount && reviewCount > 0) data.aggregateRating = { "@type": "AggregateRating", ratingValue: rating, reviewCount };
  return <JsonLd data={data} />;
}

export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  return <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.url })) }} />;
}

export function ArticleSchema({ name, description, url, image, publishedAt, updatedAt, authorName, inLanguage }: { name: string; description: string; url: string; image?: string; publishedAt?: string; updatedAt?: string; authorName?: string; inLanguage?: string }) {
  return <JsonLd data={{
    "@context": "https://schema.org",
    "@type": "Article",
    headline: name,
    description,
    url,
    ...(image ? { image: [image] } : {}),
    ...(publishedAt ? { datePublished: publishedAt } : {}),
    ...(updatedAt ? { dateModified: updatedAt } : {}),
    author: { "@type": "Person", name: authorName || BRAND.name },
    publisher: { "@type": "Organization", name: BRAND.name },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: inLanguage || "id-ID",
  }} />;
}

export function FAQPageSchema({ items }: { items: { question: string; answer: string }[] }) {
  return <JsonLd data={{
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  }} />;
}

export function CreativeWorkSchema({ name, description, url, image, client }: { name: string; description: string; url: string; image?: string; client?: string }) {
  return <JsonLd data={{
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name, description, url,
    ...(image ? { image: [image] } : {}),
    ...(client ? { about: { "@type": "Organization", name: client } } : {}),
    creator: { "@type": "Organization", name: BRAND.name },
    inLanguage: "id-ID",
  }} />;
}
