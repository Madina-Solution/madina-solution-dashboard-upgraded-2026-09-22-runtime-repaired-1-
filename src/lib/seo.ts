import type { Metadata } from "next";
import { BRAND } from "@/lib/constants";

export const DEFAULT_SITE_URL = "https://madinasolution.vercel.app";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : DEFAULT_SITE_URL);
  return raw.replace(/\/$/, "");
}

export function absoluteUrl(path = "/", base = getSiteUrl()): string {
  return new URL(path, `${base.replace(/\/$/, "")}/`).toString();
}

export function normalizeDescription(value: string, fallback = BRAND.description): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  return clean.length > 160 ? `${clean.slice(0, 157).trimEnd()}…` : clean;
}

export function parseKeywords(value?: string): string[] {
  if (!value) return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 30);
}

export function buildPageMetadata({
  title,
  description,
  path,
  image,
  canonicalUrl,
  noIndex = false,
  keywords = [],
  openGraphTitle,
  openGraphDescription,
  twitterTitle,
  twitterDescription,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
  canonicalUrl?: string;
  openGraphTitle?: string;
  openGraphDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
}): Metadata {
  const siteUrl = getSiteUrl();
  const canonical = canonicalUrl || absoluteUrl(path, siteUrl);
  const imageUrl = image ? absoluteUrl(image, siteUrl) : absoluteUrl("/opengraph-image", siteUrl);
  const robots = noIndex
    ? { index: false, follow: false }
    : { index: true, follow: true };
  return {
    title,
    description: normalizeDescription(description),
    keywords: keywords.length ? keywords : undefined,
    alternates: { canonical },
    robots,
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: canonical,
      siteName: BRAND.name,
      title: openGraphTitle || title,
      description: normalizeDescription(openGraphDescription || description),
      images: [{ url: imageUrl, width: 1200, height: 630, alt: `${title} — ${BRAND.name}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: twitterTitle || title,
      description: normalizeDescription(twitterDescription || description),
      images: [imageUrl],
    },
  };
}
