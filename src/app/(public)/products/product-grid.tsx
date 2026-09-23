"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Star, ShoppingCart, Package, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { SiteImage } from "@/components/ui/site-image";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import type { ProductSearchParams } from "@/lib/validations/product";

type Product = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  basePrice: string;
  unit: string | null;
  rating: string | null;
  reviewCount: number | null;
  isFeatured: boolean | null;
  thumbnail: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
};

type Category = { id: string; name: string; slug: string };

type Props = {
  products: Product[];
  currentParams: Partial<ProductSearchParams>;
  totalCount: number;
  categories: Category[];
};

const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "price-asc", label: "Harga Terendah" },
  { value: "price-desc", label: "Harga Tertinggi" },
  { value: "popular", label: "Terpopuler" },
  { value: "rating", label: "Rating Tertinggi" },
];

export function ProductGrid({ products, currentParams, totalCount, categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const currentSort = currentParams.sort || "newest";
  const activeCategoryName = categories.find((c) => c.slug === currentParams.category)?.name;

  const removeParam = (...keys: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    keys.forEach((key) => params.delete(key));
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const chips: { label: string; onRemove: () => void }[] = [];
  if (currentParams.q) chips.push({ label: `"${currentParams.q}"`, onRemove: () => removeParam("q") });
  if (activeCategoryName) chips.push({ label: activeCategoryName, onRemove: () => removeParam("category") });
  if (currentParams.minPrice !== undefined || currentParams.maxPrice !== undefined) {
    const min = currentParams.minPrice !== undefined ? formatCurrency(currentParams.minPrice) : "";
    const max = currentParams.maxPrice !== undefined ? formatCurrency(currentParams.maxPrice) : "";
    chips.push({ label: min && max ? `${min} - ${max}` : min ? `Di atas ${min}` : `Di bawah ${max}`, onRemove: () => removeParam("minPrice", "maxPrice") });
  }

  return (
    <div>
      {/* Header with count and sort */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-dark-600">
          Menampilkan <span className="font-semibold text-dark">{totalCount}</span> produk
        </p>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-dark-500">Urutkan:</span>
          <select
            value={currentSort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="rounded-xl border border-dark-200 bg-white px-3 py-2 text-sm font-medium text-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filter chips */}
      {chips.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {chips.map((chip, i) => (
            <button
              key={i}
              onClick={chip.onRemove}
              className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 py-1 pl-3 pr-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            >
              {chip.label}
              <X className="h-3.5 w-3.5" />
            </button>
          ))}
          <button onClick={() => router.push(pathname, { scroll: false })} className="text-xs font-medium text-dark-400 underline-offset-2 hover:text-dark-600 hover:underline">
            Hapus semua
          </button>
        </div>
      )}

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`}>
              <Card className="group h-full overflow-hidden rounded-xl border-dark-100 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-premium-lg">
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-dark-50">
                  {product.thumbnail ? (
                    <SiteImage
                      src={product.thumbnail}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <MediaPlaceholder />
                  )}
                  {product.isFeatured && (
                    <Badge className="absolute left-2 top-2" variant="default">
                      Terlaris
                    </Badge>
                  )}
                  {/* Quick-order overlay, Alibaba-style: a full CTA appears on hover instead of a bare icon */}
                  <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-dark/80 to-transparent p-2 transition-transform duration-300 group-hover:translate-y-0">
                    <span className="flex items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-xs font-semibold text-dark shadow-sm">
                      <ShoppingCart className="h-3.5 w-3.5" />Pesan Sekarang
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3">
                  <p className="truncate text-xs text-dark-400">
                    {product.categoryName || "Produk"}
                  </p>
                  <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-dark group-hover:text-primary">
                    {product.name}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-[11px] text-dark-400">Mulai</span>
                    <span className="text-base font-bold text-primary">
                      {formatCurrency(Number(product.basePrice))}
                    </span>
                    <span className="text-xs text-dark-400">
                      /{product.unit || "pcs"}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium text-dark-700">
                      {product.rating || "0"}
                    </span>
                    <span className="text-xs text-dark-400">
                      ({product.reviewCount || 0})
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-dark-100 bg-white py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-dark-100">
            <Package className="h-8 w-8 text-dark-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-dark">
            Tidak Ada Produk
          </h3>
          <p className="mt-2 text-dark-500">
            {currentParams.q || currentParams.category
              ? "Tidak ada produk yang sesuai dengan filter Anda."
              : "Belum ada produk tersedia saat ini."}
          </p>
          {(currentParams.q || currentParams.category) && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/products")}
            >
              Reset Filter
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
