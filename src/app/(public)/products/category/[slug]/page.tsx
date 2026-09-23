import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, ShoppingCart, ChevronRight } from "lucide-react";
import { db } from "@/db";
import { products, categories } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { SiteImage } from "@/components/ui/site-image";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { buildPageMetadata } from "@/lib/seo";
import { getLocale } from "next-intl/server";
import { resolveLocalizedProduct, resolveLocalizedCategory } from "@/lib/localized-content";
import type { AppLocale } from "@/i18n/routing";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const category = await db
    .select({
      name: categories.name,
      description: categories.description,
    })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  if (!category[0]) {
    return {
      title: "Kategori Tidak Ditemukan",
    };
  }

  return {
    title: `${category[0].name} - Produk`,
    description: category[0].description || `Produk ${category[0].name} dari Madina Solution`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const locale = (await getLocale()) as AppLocale;

  // Fetch category
  const categoryResult = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.isActive, true)))
    .limit(1);

  const category = categoryResult[0] ? resolveLocalizedCategory(categoryResult[0], locale) : undefined;

  if (!category) {
    notFound();
  }

  // Fetch products in this category
  const productList = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      thumbnail: products.thumbnail,
      basePrice: products.basePrice,
      unit: products.unit,
      rating: products.rating,
      reviewCount: products.reviewCount,
      isFeatured: products.isFeatured,
      translations: products.translations,
    })
    .from(products)
    .where(
      and(eq(products.categoryId, category.id), eq(products.isActive, true))
    )
    .orderBy(desc(products.isFeatured), desc(products.createdAt));
  const localizedProducts = productList.map((item) => resolveLocalizedProduct(item, locale));

  // Fetch all categories for sidebar
  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      translations: categories.translations,
    })
    .from(categories)
    .where(eq(categories.isActive, true));
  const localizedCategories = allCategories.map((item) => resolveLocalizedCategory(item, locale));

  return (
    <div className="py-12 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-dark-500">
          <Link href="/" className="hover:text-primary">
            Beranda
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/products" className="hover:text-primary">
            Produk
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-dark">{category.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-dark">{category.name}</h1>
          {category.description && (
            <p className="mt-3 max-w-2xl text-lg text-dark-600">
              {category.description}
            </p>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar - Categories */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-dark-100 bg-white p-6">
              <h3 className="font-semibold text-dark">Kategori</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link
                    href="/products"
                    className="block rounded-lg px-3 py-2 text-sm text-dark-600 transition-colors hover:bg-dark-50 hover:text-dark"
                  >
                    Semua Produk
                  </Link>
                </li>
                {localizedCategories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/products/category/${cat.slug}`}
                      className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                        cat.slug === slug
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-dark-600 hover:bg-dark-50 hover:text-dark"
                      }`}
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {productList.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {localizedProducts.map((product) => (
                  <Link key={product.id} href={`/products/${product.slug}`}>
                    <Card className="group h-full overflow-hidden transition-all hover:shadow-premium-lg">
                      {/* Image */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-dark-100">
                        {product.thumbnail ? (
                          <SiteImage
                            src={product.thumbnail}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <MediaPlaceholder />
                        )}
                        {product.isFeatured && (
                          <Badge
                            className="absolute left-3 top-3"
                            variant="default"
                          >
                            Featured
                          </Badge>
                        )}
                        <div className="absolute inset-0 bg-dark/0 transition-colors group-hover:bg-dark/10" />
                        <Button
                          size="icon"
                          className="absolute bottom-3 right-3 opacity-0 transition-all group-hover:opacity-100"
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-dark group-hover:text-primary">
                          {product.name}
                        </h3>
                        {product.shortDescription && (
                          <p className="mt-1 line-clamp-2 text-sm text-dark-500">
                            {product.shortDescription}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">
                              {product.rating || "0"}
                            </span>
                          </div>
                          <span className="text-sm text-dark-400">
                            ({product.reviewCount || 0} ulasan)
                          </span>
                        </div>
                        <div className="mt-3 flex items-baseline gap-1">
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(Number(product.basePrice))}
                          </span>
                          <span className="text-sm text-dark-500">
                            /{product.unit || "pcs"}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dark-100 bg-white py-16 text-center">
                <p className="text-lg text-dark-500">
                  Belum ada produk dalam kategori ini.
                </p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/products">Lihat Semua Produk</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
