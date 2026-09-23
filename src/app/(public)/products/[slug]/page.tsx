import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Check,
  ChevronRight,
  Clock3,
  FileCheck2,
  MessageCircle,
  MessageSquareQuote,
  Package,
  Palette,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  UserCircle,
} from "lucide-react";
import { db } from "@/db";
import { categories, productPricingTiers, products, reviews, users } from "@/db/schema";
import { and, count, desc, eq, ne, sql } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { BRAND } from "@/lib/constants";
import { ProductGallery } from "./product-gallery";
import { SiteImage } from "@/components/ui/site-image";
import { ProductConfiguration } from "./product-configuration";
import { RelatedProducts } from "./related-products";
import { ProductSchema, BreadcrumbSchema } from "@/components/seo/json-ld";
import { AdSenseUnit } from "@/components/ads/adsense";
import { getPublicSiteConfig } from "@/lib/site-config";
import { buildPageMetadata } from "@/lib/seo";
import { ReviewForm } from "./review-form";
import type { ProductAdminMetadata, ProductOption } from "@/db/schema";
import { resolveLocalizedProduct } from "@/lib/localized-content";
import { sanitizeRichHtml } from "@/lib/sanitize-rich-html";
import { getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ slug: string }> };

/** Revalidate public detail content frequently without rebuilding the whole site. */
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [product] = await db
    .select({
      name: products.name,
      shortDescription: products.shortDescription,
      thumbnail: products.thumbnail,
      metadata: products.metadata,
    })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (!product) return { title: "Produk Tidak Ditemukan" };
  const seo = (product.metadata as ProductAdminMetadata | null)?.seo;
  return buildPageMetadata({
    title: seo?.title || product.name,
    description: seo?.description || product.shortDescription || `${product.name} — Madina Solution`,
    path: `/products/${encodeURIComponent(slug)}`,
    image: seo?.ogImage || product.thumbnail || undefined,
    noIndex: !!seo?.noIndex,
    keywords: seo?.keywords || [],
  });
}

function StarRating({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const starClass = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating ${value.toFixed(1)} dari 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`${starClass} ${index < Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-dark-100 text-dark-200"}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://madinasolution.web.app";
  const [rawLocale, t] = await Promise.all([getLocale(), getTranslations("ProductDetail")]);
  const locale = rawLocale as AppLocale;

  const [productResult, siteConfig] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        shortDescription: products.shortDescription,
        description: products.description,
        thumbnail: products.thumbnail,
        gallery: products.gallery,
        basePrice: products.basePrice,
        unit: products.unit,
        minOrder: products.minOrder,
        specifications: products.specifications,
        options: products.options,
        metadata: products.metadata,
        translations: products.translations,
        productionDays: products.productionDays,
        isFeatured: products.isFeatured,
        categoryId: products.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.slug, slug), eq(products.isActive, true)))
      .limit(1),
    getPublicSiteConfig(),
  ]);

  const rawProduct = productResult[0];
  if (!rawProduct) notFound();
  const product = resolveLocalizedProduct(rawProduct, locale);

  const [productReviews, ratingAgg, relatedProducts, normalizedTiers] = await Promise.all([
    db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        images: reviews.images,
        isVerified: reviews.isVerified,
        createdAt: reviews.createdAt,
        userName: users.name,
        userAvatar: users.avatar,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(and(eq(reviews.productId, product.id), eq(reviews.isApproved, true)))
      .orderBy(desc(reviews.createdAt))
      .limit(8),
    db
      .select({ avg: sql<string>`coalesce(avg(${reviews.rating}), 0)`, count: count() })
      .from(reviews)
      .where(and(eq(reviews.productId, product.id), eq(reviews.isApproved, true))),
    product.categoryId
      ? db
          .select({
            id: products.id,
            name: products.name,
            slug: products.slug,
            thumbnail: products.thumbnail,
            basePrice: products.basePrice,
            unit: products.unit,
            rating: products.rating,
          })
          .from(products)
          .where(and(eq(products.categoryId, product.categoryId), ne(products.id, product.id), eq(products.isActive, true)))
          .limit(4)
      : Promise.resolve([]),
    db
      .select({ minQuantity: productPricingTiers.minQuantity, maxQuantity: productPricingTiers.maxQuantity, unitPrice: productPricingTiers.unitPrice, label: productPricingTiers.label })
      .from(productPricingTiers)
      .where(and(eq(productPricingTiers.productId, product.id), eq(productPricingTiers.isActive, true)))
      .orderBy(productPricingTiers.minQuantity),
  ]);

  const liveRating = Number(ratingAgg[0]?.avg ?? 0);
  const liveReviewCount = ratingAgg[0]?.count ?? 0;
  const metadata = (product.metadata as ProductAdminMetadata | null) || {};
  const specs = (product.specifications as Record<string, string> | null) || {};
  const gallery = Array.from(new Set([
    ...(Array.isArray(product.gallery) ? (product.gallery as string[]) : []),
    metadata.content?.videoUrl || "",
    ...((metadata.variants?.attributes || []).flatMap((attribute) => attribute.values.map((value) => value.image || ""))),
  ].filter(Boolean)));
  const richDescription = sanitizeRichHtml(product.description || product.shortDescription || "");
  const stockStatus = metadata.stock?.status || "made_to_order";
  const unit = product.unit || "pcs";
  const variantOptions: ProductOption[] = metadata.variants?.enabled
    ? (metadata.variants.attributes || []).map((attr, index) => ({
        id: `variant_${product.id}_${index}`,
        name: attr.name,
        key: `variant_${index}_${attr.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
        type: "radio",
        required: true,
        values: attr.values.map((value) => ({
          label: value.label,
          value: value.value,
          priceModifier: value.priceModifier,
          description: value.stock !== undefined ? `Stok varian: ${value.stock}` : undefined,
        })),
        displayOrder: index,
      }))
    : [];
  const allOptions = [...(product.options || []), ...variantOptions];
  const tieredPrices = normalizedTiers.length
    ? normalizedTiers
    : [...(metadata.pricing?.wholesaleTiers || [])].sort((a, b) => a.minQuantity - b.minQuantity).map((tier) => ({ minQuantity: tier.minQuantity, maxQuantity: undefined, unitPrice: tier.unitPrice, label: undefined }));
  const faq = metadata.content?.faq || [];
  const highlights = metadata.content?.highlights?.filter(Boolean) || [];
  const trust = metadata.trust || {};
  const trade = metadata.trade || {};
  const pageUrl = `${siteUrl}/products/${product.slug}`;

  return (
    <>
      <ProductSchema
        name={product.name}
        description={product.shortDescription || product.description || product.name}
        price={Number(product.basePrice)}
        url={pageUrl}
        image={product.thumbnail || undefined}
        sku={metadata.sku}
        mpn={metadata.schema?.mpn}
        gtin={metadata.schema?.gtin || metadata.barcode}
        brandName={metadata.brand}
        condition={metadata.condition}
        inLanguage={locale === "en" ? "en-US" : "id-ID"}
        availability={stockStatus === "out_of_stock" ? "OutOfStock" : "InStock"}
        rating={liveReviewCount > 0 ? liveRating : undefined}
        reviewCount={liveReviewCount > 0 ? liveReviewCount : undefined}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: siteUrl },
          { name: "Products", url: `${siteUrl}/products` },
          ...(product.categoryName ? [{ name: product.categoryName, url: `${siteUrl}/products/category/${product.categorySlug}` }] : []),
          { name: product.name, url: pageUrl },
        ]}
      />

      <main className="min-h-screen bg-[#f7f5f2] py-5 sm:py-7 lg:py-10">
        <div className="mx-auto max-w-[1480px] px-3 sm:px-5 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-xs text-dark-500 sm:text-sm">
            <Link href="/" className="font-medium hover:text-primary">{t("home")}</Link>
            <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            <Link href="/products" className="font-medium hover:text-primary">{t("products")}</Link>
            {product.categoryName && <><ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" /><Link href={`/products/category/${product.categorySlug}`} className="font-medium hover:text-primary">{product.categoryName}</Link></>}
            <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate font-semibold text-dark">{product.name}</span>
          </nav>

          <section className="overflow-hidden rounded-[2rem] border border-dark-200/80 bg-white shadow-[0_30px_100px_rgba(15,23,42,.10)]">
            <div className="grid items-start lg:grid-cols-[minmax(0,1.04fr)_minmax(440px,.96fr)]">
              <div className="min-w-0 border-b border-dark-100 p-3 sm:p-5 lg:border-b-0 lg:border-r lg:p-7 xl:p-8">
                <ProductGallery thumbnail={product.thumbnail} gallery={gallery} productName={product.name} />
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["MOQ", `${product.minOrder || 1} ${unit}`, t("minimumOrder")] ,
                    [t("leadTime"), `${metadata.shipping?.leadTimeDays || product.productionDays || 3} hari`, t("productionEstimate")] ,
                    [t("fulfillment"), stockStatus === "in_stock" ? t("readyStock") : stockStatus === "preorder" ? t("preorder") : t("madeToOrder"), t("orderStatus")] ,
                    ["SKU", metadata.sku || t("notSet"), t("productReference")] ,
                  ].map(([k,v,d]) => <div key={k} className="rounded-2xl border border-dark-100 bg-[#fbfaf8] p-3 sm:p-4"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-dark-400">{k}</p><p className="mt-1 truncate text-sm font-bold text-dark">{v}</p><p className="mt-1 text-[11px] leading-4 text-dark-400">{d}</p></div>)}
                </div>
              </div>

              <div className="min-w-0 p-4 sm:p-6 lg:p-7 xl:p-8">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em]">
                  {product.categoryName && <span className="rounded-full bg-dark px-3 py-1.5 text-white">{product.categoryName}</span>}
                  {product.isFeatured && <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-800">{t("featured")}</span>}
                  {metadata.variants?.enabled && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-800">{t("customizable")}</span>}
                  {tieredPrices.length > 0 && <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-blue-800">{t("bulkPricing")}</span>}
                </div>

                <h1 className="mt-4 text-[2rem] font-black leading-[1.03] tracking-[-0.045em] text-dark sm:text-4xl lg:text-[3.25rem]">{product.name}</h1>
                {product.shortDescription && <p className="mt-4 max-w-2xl text-sm leading-7 text-dark-600 sm:text-base">{product.shortDescription}</p>}

                <div className="mt-5 flex flex-wrap items-center gap-3 border-y border-dark-100 py-4">
                  <div className="inline-flex items-center gap-2"><StarRating value={liveRating} size="md" /><span className="font-bold text-dark">{liveReviewCount ? liveRating.toFixed(1) : "—"}</span></div>
                  <span className="text-sm text-dark-400">{liveReviewCount} {t("reviews")}</span>
                  {metadata.brand && <><span className="h-4 w-px bg-dark-200" aria-hidden="true" /><span className="text-sm text-dark-500">{t("brand")} <strong className="text-dark">{metadata.brand}</strong></span></>}
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-primary/15 bg-gradient-to-br from-[#fffaf5] to-[#f7f2ed] p-5 sm:p-6">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-dark-400">{t("startingPrice")}</p><div className="mt-1 flex items-baseline gap-2"><span className="text-4xl font-black tracking-[-.04em] text-primary sm:text-[3rem]">{formatCurrency(Number(product.basePrice))}</span><span className="text-sm text-dark-500">/ {unit}</span></div></div>
                    {metadata.pricing?.compareAtPrice && Number(metadata.pricing.compareAtPrice) > Number(product.basePrice) && <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-dark-400 line-through ring-1 ring-dark-100">{formatCurrency(Number(metadata.pricing.compareAtPrice))}</span>}
                  </div>
                  {tieredPrices.length > 0 && <div className="mt-5 overflow-hidden rounded-2xl border border-dark-200 bg-white"><div className="grid grid-cols-[1fr_auto] bg-dark px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-white"><span>{t("quantity")}</span><span>{t("pricePerUnit", { unit })}</span></div>{tieredPrices.map((tier, i) => <div key={`${tier.minQuantity}-${tier.unitPrice}-${i}`} className="grid grid-cols-[1fr_auto] items-center border-t border-dark-100 px-4 py-3 text-sm"><span className="font-medium text-dark-600">{tier.label || (tier.maxQuantity ? `${tier.minQuantity}–${tier.maxQuantity} ${unit}` : `${tier.minQuantity}+ ${unit}`)}</span><strong className="text-dark">{formatCurrency(Number(tier.unitPrice))}</strong></div>)}</div>}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    [t("customization"), trust.customization || (metadata.variants?.enabled ? t("available") : t("requestQuote"))],
                    [t("sample"), trust.sampleAvailable ? t("available") : t("byRequest")],
                    [t("response"), trust.responseTime || t("salesTeam")],
                    [t("payment"), trade.paymentTerms || t("invoice")],
                  ].map(([label,value]) => <div key={label} className="rounded-2xl border border-dark-100 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-dark-400">{label}</p><p className="mt-1 text-xs font-bold leading-5 text-dark">{value}</p></div>)}
                </div>

                <div id="configure" className="mt-6 scroll-mt-24 rounded-[1.5rem] border border-dark-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">{t("configureBuy")}</p><h2 className="mt-1 text-xl font-bold text-dark">{t("chooseOrder")}</h2></div><a href="#overview" className="text-xs font-semibold text-dark-400 hover:text-primary">{t("viewDetails")} ↓</a></div>
                  <ProductConfiguration productId={product.id} productName={product.name} productSlug={product.slug} productThumbnail={product.thumbnail} basePrice={Number(product.basePrice)} unit={unit} minOrder={product.minOrder || 1} options={allOptions} wholesaleTiers={tieredPrices.map((tier) => ({ minQuantity: tier.minQuantity, unitPrice: String(tier.unitPrice) }))} />
                </div>
              </div>
            </div>
          </section>

          <nav aria-label="Navigasi detail produk" className="sticky top-16 z-20 mt-4 overflow-x-auto rounded-2xl border border-dark-200 bg-white/95 p-2 shadow-lg backdrop-blur-xl">
            <div className="flex min-w-max items-center gap-1">
              {[['overview',t("overview")],['specifications',t("specifications")],['pricing',t("wholesale")],['shipping',t("shipping")],['faq',t("faq")],['reviews',t("reviewsNav")]].map(([href,label]) => <a key={href} href={`#${href}`} className="rounded-xl px-3 py-2 text-xs font-bold text-dark-500 transition hover:bg-dark-50 hover:text-dark sm:px-4">{label}</a>)}
            </div>
          </nav>

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-8">
            <div className="min-w-0">
              <Card id="overview" className="scroll-mt-28 border-dark-200 shadow-sm"><CardContent className="p-5 sm:p-7">
                <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">{t("productOverview")}</p><h2 className="mt-2 text-2xl font-black tracking-tight text-dark sm:text-3xl">{t("productValue")}</h2></div><span className="text-xs font-medium text-dark-400">SKU {metadata.sku || "—"}</span></div>
                {highlights.length > 0 && <div className="mt-6 grid gap-3 sm:grid-cols-2">{highlights.map((item) => <div key={item} className="flex gap-3 rounded-2xl border border-dark-100 bg-dark-50/60 p-4"><Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" /><span className="text-sm font-medium leading-6 text-dark-600">{item}</span></div>)}</div>}
                <div className="prose prose-slate mt-7 max-w-none text-[15px] leading-8 prose-headings:tracking-tight prose-h2:mt-10 prose-h2:text-2xl prose-h3:text-xl prose-img:rounded-2xl" dangerouslySetInnerHTML={{ __html: richDescription || `<p>Deskripsi produk belum tersedia.</p>` }} />
              </CardContent></Card>
              {(Object.keys(specs).length > 0 || metadata.schema?.mpn || metadata.schema?.gtin || metadata.barcode || metadata.condition) && (
                <Card id="specifications" className="scroll-mt-28 border-dark-200 shadow-sm">
                  <CardContent className="p-5 sm:p-7">
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">{t("technicalData")}</p>
                    <h2 className="mt-2 text-2xl font-black text-dark">{t("technicalSpecs")}</h2>
                    <div className="mt-5 overflow-hidden rounded-2xl border border-dark-100">
                      <div className="divide-y divide-dark-100">
                        {Object.entries(specs).map(([key, value]) => (
                          <div key={key} className="grid gap-2 px-4 py-4 sm:grid-cols-[220px_1fr] sm:px-5">
                            <span className="text-xs font-bold uppercase tracking-wider text-dark-400">{key}</span>
                            <span className="text-sm leading-6 text-dark-700">{value}</span>
                          </div>
                        ))}
                        {metadata.schema?.mpn && (
                          <div className="grid gap-2 px-4 py-4 sm:grid-cols-[220px_1fr] sm:px-5"><span className="text-xs font-bold uppercase tracking-wider text-dark-400">MPN</span><span className="text-sm leading-6 text-dark-700">{metadata.schema.mpn}</span></div>
                        )}
                        {(metadata.schema?.gtin || metadata.barcode) && (
                          <div className="grid gap-2 px-4 py-4 sm:grid-cols-[220px_1fr] sm:px-5"><span className="text-xs font-bold uppercase tracking-wider text-dark-400">GTIN / Barcode</span><span className="text-sm leading-6 text-dark-700">{metadata.schema?.gtin || metadata.barcode}</span></div>
                        )}
                        {metadata.condition && (
                          <div className="grid gap-2 px-4 py-4 sm:grid-cols-[220px_1fr] sm:px-5"><span className="text-xs font-bold uppercase tracking-wider text-dark-400">Condition</span><span className="text-sm capitalize leading-6 text-dark-700">{metadata.condition}</span></div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {tieredPrices.length > 0 && <Card id="pricing" className="mt-6 scroll-mt-28 border-dark-200 shadow-sm"><CardContent className="p-5 sm:p-7"><div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">{t("b2bPricing")}</p><h2 className="mt-2 text-2xl font-black text-dark">{t("volumePricing")}</h2></div><span className="text-xs text-dark-400">{t("volumeNote")}</span></div><div className="mt-6 overflow-hidden rounded-2xl border border-dark-100"><div className="grid grid-cols-[1fr_1fr_1fr] bg-dark px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-white"><span>Min. qty</span><span>Label</span><span className="text-right">{t("pricePerUnit", { unit })}</span></div>{tieredPrices.map((tier,i)=><div key={`${tier.minQuantity}-${i}`} className="grid grid-cols-[1fr_1fr_1fr] items-center border-t border-dark-100 px-4 py-4 text-sm"><span className="font-semibold text-dark">{tier.maxQuantity ? `${tier.minQuantity}–${tier.maxQuantity} ${unit}` : `${tier.minQuantity}+ ${unit}`}</span><span className="text-dark-500">{tier.label || (i === 0 ? "Volume" : i === tieredPrices.length - 1 ? "Best value" : "Bulk")}</span><strong className="text-right text-dark">{formatCurrency(Number(tier.unitPrice))}</strong></div>)}</div></CardContent></Card>}

              <Card id="shipping" className="mt-6 scroll-mt-28 border-dark-200 shadow-sm"><CardContent className="p-5 sm:p-7"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">{t("fulfillment")}</p><h2 className="mt-2 text-2xl font-black text-dark">{t("productionShipping")}</h2><div className="mt-6 grid gap-3 sm:grid-cols-2">{([
                [Clock3, t("leadTime"), `${metadata.shipping?.leadTimeDays || product.productionDays || 3} hari produksi`],
                [Truck, t("origin"), metadata.shipping?.origin || "Kedu, Temanggung"],
                [Package, t("packaging"), trade.packaging || "Packaging disesuaikan produk"],
                [ShieldCheck, t("quality"), trade.inspection || "QC sebelum dikirim"],
              ] satisfies Array<[LucideIcon, string, string]>).map(([Icon,title,text]) => <div key={title} className="flex gap-3 rounded-2xl border border-dark-100 bg-dark-50/60 p-4"><span className="text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-sm font-bold text-dark">{title}</p><p className="mt-1 text-xs leading-5 text-dark-500">{text}</p></div></div>)}</div></CardContent></Card>

              {faq.length > 0 && <Card id="faq" className="mt-6 scroll-mt-28 border-dark-200 shadow-sm"><CardContent className="p-5 sm:p-7"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">{t("buyerQuestions")}</p><h2 className="mt-2 text-2xl font-black text-dark">{t("commonQuestions")}</h2><div className="mt-6 space-y-3">{faq.map((item) => <details key={item.question} className="group rounded-2xl border border-dark-100 bg-white p-4"><summary className="cursor-pointer list-none pr-8 text-sm font-bold text-dark marker:hidden">{item.question}</summary><p className="mt-3 text-sm leading-7 text-dark-600">{item.answer}</p></details>)}</div></CardContent></Card>}

              <Card id="reviews" className="mt-6 scroll-mt-28 border-dark-200 shadow-sm"><CardContent className="p-5 sm:p-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">{t("buyerFeedback")}</p><h2 className="mt-2 text-2xl font-black text-dark">{t("customerReviews")}</h2></div><span className="text-sm font-semibold text-dark-500">{liveReviewCount} ulasan</span></div>{productReviews.length > 0 ? <div className="mt-6 space-y-5">{productReviews.map((review) => <article key={review.id} className="border-b border-dark-100 pb-5 last:border-0"><div className="flex gap-4">{review.userAvatar ? <SiteImage src={review.userAvatar} alt={review.userName || "Pengguna"} width={40} height={40} className="h-10 w-10 rounded-full object-cover" /> : <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary" aria-hidden="true"><UserCircle className="h-5 w-5" /></div>}<div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-dark">{review.userName || "Pengguna"}</span>{review.isVerified && <Badge variant="success"><Check className="mr-1 h-3 w-3" aria-hidden="true" />Terverifikasi</Badge>}</div><div className="mt-1 flex items-center gap-2"><StarRating value={review.rating} /><span className="text-xs text-dark-400">{review.rating}.0</span></div>{review.comment && <p className="mt-2 text-sm leading-7 text-dark-600">{review.comment}</p>}</div></div></article>)}</div> : <p className="mt-6 rounded-2xl bg-dark-50 p-5 text-sm text-dark-500">Belum ada ulasan untuk produk ini.</p>}<ReviewForm productId={product.id} /></CardContent></Card>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24">
              <Card className="border-dark-200 shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-3 border-b border-dark-100 pb-4"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-dark text-white"><span className="text-xs font-black">MS</span></div><div><p className="text-sm font-black text-dark">Madina Solution</p><p className="text-xs text-dark-500">{t("sellerTagline")}</p></div></div><div className="mt-4 space-y-3 text-sm">{[[MessageSquareQuote,"Konsultasi spesifikasi dan kebutuhan custom."],[FileCheck2,"Review file sebelum produksi."],[Truck,"Pengiriman mengikuti konfigurasi dan lokasi."],[ShieldCheck,trust.protection || "Informasi produk dan harga mengikuti data yang dipublikasikan."]].map(([Icon,text]) => <div key={String(text)} className="flex gap-3"><Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /><span className="text-dark-600">{String(text)}</span></div>)}</div><Button className="mt-5 w-full" size="lg" asChild><a href={`https://wa.me/${BRAND.whatsapp}?text=Halo%20Madina%20Solution%2C%20saya%20ingin%20meminta%20penawaran%20untuk%20${encodeURIComponent(product.name)}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />{t("requestQuote")}</a></Button></CardContent></Card>

              <Card className="border-dark-200 shadow-sm"><CardContent className="p-5"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">{t("procurement")}</p><h3 className="mt-2 text-lg font-black text-dark">{t("beforeCheckout")}</h3><div className="mt-4 space-y-3">{[t("checkSpecs"), t("setQuantity"), t("prepareFiles"), t("checkDelivery")].map((item) => <div key={item} className="flex gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" /><span className="text-dark-600">{item}</span></div>)}</div></CardContent></Card>


              {(metadata.shipping?.weightGrams || metadata.shipping?.lengthCm || metadata.shipping?.widthCm || metadata.shipping?.heightCm) && <Card className="border-dark-200 shadow-sm"><CardContent className="p-5"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">{t("packageData")}</p><div className="mt-4 space-y-3 text-sm">{metadata.shipping.weightGrams ? <div className="flex justify-between gap-4"><span className="text-dark-400">{t("weight")}</span><strong className="text-dark">{metadata.shipping.weightGrams} g</strong></div> : null}{(metadata.shipping.lengthCm || metadata.shipping.widthCm || metadata.shipping.heightCm) ? <div className="flex justify-between gap-4"><span className="text-dark-400">{t("dimensions")}</span><strong className="text-dark">{metadata.shipping.lengthCm || "—"} × {metadata.shipping.widthCm || "—"} × {metadata.shipping.heightCm || "—"} cm</strong></div> : null}</div></CardContent></Card>}
            </aside>
          </div>

          <div className="sticky bottom-3 z-30 mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-2xl border border-dark-200 bg-dark/95 p-2 text-white shadow-[0_20px_60px_rgba(15,23,42,.28)] backdrop-blur lg:hidden">
            <div className="min-w-0 flex-1 px-2"><p className="truncate text-[10px] font-bold uppercase tracking-[.16em] text-white/55">{t("startingFrom")}</p><p className="truncate text-base font-black">{formatCurrency(Number(product.basePrice))}<span className="ml-1 text-xs font-medium text-white/55">/{unit}</span></p></div>
            <Button variant="secondary" size="sm" asChild><a href="#configure">{t("choose")}</a></Button>
            <Button size="sm" asChild><a href={`https://wa.me/${BRAND.whatsapp}?text=Halo%20Madina%20Solution%2C%20saya%20ingin%20meminta%20penawaran%20${encodeURIComponent(product.name)}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />{t("offer")}</a></Button>
          </div>

          {siteConfig.adsEnabled && siteConfig.adsClient && siteConfig.adsSlots.product ? <div className="mt-10"><AdSenseUnit client={siteConfig.adsClient} slot={siteConfig.adsSlots.product} className="mx-auto max-w-4xl" label="Iklan" /></div> : null}
          {relatedProducts.length > 0 ? <RelatedProducts products={relatedProducts} /> : null}
        </div>
      </main>
    </>
  );
}
