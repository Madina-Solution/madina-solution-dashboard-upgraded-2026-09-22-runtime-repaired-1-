import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/constants";
import { SearchProvider } from "@/components/search/search-provider";
import { ToastProvider } from "@/components/ui/toast";
import { CartProvider } from "@/lib/cart/cart-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { AuthProvider } from "@/lib/auth/auth-provider";
import { getPublicSiteConfig } from "@/lib/site-config";
import { getLocale } from "next-intl/server";
import { getSiteUrl, parseKeywords, normalizeDescription } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});


export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  type SiteMetadataConfig = {
    siteName: string;
    siteTagline: string;
    siteUrl: string;
    siteLogo: string;
    siteIcon: string;
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string;
    seoOgImage: string;
    seoTwitterHandle: string;
  };
  let config: SiteMetadataConfig = {
    siteName: BRAND.name,
    siteTagline: BRAND.tagline,
    siteUrl: getSiteUrl(),
    siteLogo: "",
    siteIcon: "",
    seoTitle: "Madina Solution | Desain Grafis & Percetakan",
    seoDescription: "Madina Solution adalah spesialis desain grafis, digital printing, dan percetakan di Temanggung, Jawa Tengah.",
    seoKeywords: "Madina Solution, desain grafis, desain grafis Temanggung, digital printing, digital printing Temanggung, percetakan, percetakan Temanggung, percetakan Jawa Tengah, desain dan percetakan, branding, jasa branding UMKM, advertising, desain logo, brand identity, cetak banner, cetak spanduk, cetak sticker, cetak kartu nama, cetak brosur, cetak undangan, cetak poster, cetak kalender, neon box, signage, x-banner",
    seoOgImage: "",
    seoTwitterHandle: "",
  };
  try {
    const site = await getPublicSiteConfig();
    config = { ...config, ...site };
  } catch {
    // Keep deterministic safe defaults when the database is unavailable.
  }
  const title = config.seoTitle || `${config.siteName} — ${config.siteTagline}`;
  const description = normalizeDescription(config.seoDescription || BRAND.description);
  const siteUrl = config.siteUrl || getSiteUrl();
  const image = config.seoOgImage || "/opengraph-image";
  const isRasterAppIcon = /\.png(?:\?.*)?$/i.test(config.siteIcon || "");
  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: `%s | ${config.siteName}` },
    description,
    keywords: parseKeywords(config.seoKeywords),
    authors: [{ name: config.siteName }],
    creator: config.siteName,
    publisher: config.siteName,
    category: "business",
    applicationName: config.siteName,
    referrer: "origin-when-cross-origin",
    formatDetection: { email: false, telephone: false, address: false },
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_US" : "id_ID",
      siteName: config.siteName,
      title,
      description,
      url: siteUrl,
      images: [{ url: image, width: 1200, height: 630, alt: `${config.siteName} — ${config.siteTagline}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      ...(config.seoTwitterHandle ? { creator: config.seoTwitterHandle, site: config.seoTwitterHandle } : {}),
    },
    // App icon is intentionally separate from the header logo so landscape logos do not become blurry favicons.
    icons: {
      icon: isRasterAppIcon ? [{ url: config.siteIcon, type: "image/png" }] : [
        { url: "/icons/madina-192.png?v=20260922", type: "image/png", sizes: "192x192" },
        { url: "/icons/madina-512.png?v=20260922", type: "image/png", sizes: "512x512" },
      ],
      apple: isRasterAppIcon ? [{ url: config.siteIcon, type: "image/png", sizes: "180x180" }] : [{ url: "/icons/madina-180.png?v=20260922", type: "image/png", sizes: "180x180" }],
    },
    manifest: "/manifest.webmanifest?v=20260922",
    robots: { index: true, follow: true, nocache: false },
    // The root route intentionally has no hard-coded canonical; each indexable route declares its own canonical.
  };
}


export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} data-scroll-behavior="smooth" className={inter.variable}>
      <body className="min-h-screen bg-white font-sans text-dark-900 antialiased">
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <SearchProvider>{children}</SearchProvider>
              <CartDrawer />
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
