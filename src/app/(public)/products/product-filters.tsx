"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { ProductSearchParams } from "@/lib/validations/product";

type Category = {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
};

type Props = {
  categories: Category[];
  currentParams: Partial<ProductSearchParams>;
};

export function ProductFilters({ categories, currentParams }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = React.useState(currentParams.q || "");
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  // Update URL with new params
  const updateParams = React.useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      // Reset to first page when filtering
      params.delete("page");

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams("q", searchQuery || null);
  };

  // Clear all filters
  const clearAllFilters = () => {
    router.push(pathname, { scroll: false });
    setSearchQuery("");
  };

  // Check if any filters are active
  const hasActiveFilters =
    currentParams.category ||
    currentParams.minPrice ||
    currentParams.maxPrice ||
    currentParams.featured ||
    currentParams.q;

  const priceRanges = [
    { label: "Semua Harga", min: undefined, max: undefined },
    { label: "< Rp 50.000", min: undefined, max: 50000 },
    { label: "Rp 50.000 - Rp 100.000", min: 50000, max: 100000 },
    { label: "Rp 100.000 - Rp 500.000", min: 100000, max: 500000 },
    { label: "> Rp 500.000", min: 500000, max: undefined },
  ];

  const currentPriceRange = priceRanges.find(
    (r) =>
      r.min === currentParams.minPrice && r.max === currentParams.maxPrice
  );

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="mb-4 lg:hidden">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filter & Sortir
          {hasActiveFilters && (
            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
              !
            </span>
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      <div
        className={cn(
          "rounded-2xl border border-dark-100 bg-white p-6",
          "lg:sticky lg:top-24",
          isFilterOpen ? "block" : "hidden lg:block"
        )}
      >
        {/* Search */}
        <form onSubmit={handleSearchSubmit}>
          <label className="mb-2 block text-sm font-medium text-dark">
            Cari Produk
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-400" />
            <Input
              type="text"
              placeholder="Ketik nama produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  updateParams("q", null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>

        <Separator className="my-6" />

        {/* Categories */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-dark">Kategori</h3>
          <div className="space-y-1">
            <button
              onClick={() => updateParams("category", null)}
              className={cn(
                "block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                !currentParams.category
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-dark-600 hover:bg-dark-50 hover:text-dark"
              )}
            >
              Semua Kategori
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => updateParams("category", category.slug)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  currentParams.category === category.slug
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-dark-600 hover:bg-dark-50 hover:text-dark"
                )}
              >
                <span className="truncate">{category.name}</span>
                {typeof category.productCount === "number" && (
                  <span className={cn("ml-2 shrink-0 text-xs", currentParams.category === category.slug ? "text-primary/70" : "text-dark-400")}>{category.productCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Price Range */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-dark">Rentang Harga</h3>
          <div className="space-y-1">
            {priceRanges.map((range, index) => (
              <button
                key={index}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (range.min !== undefined) {
                    params.set("minPrice", String(range.min));
                  } else {
                    params.delete("minPrice");
                  }
                  if (range.max !== undefined) {
                    params.set("maxPrice", String(range.max));
                  } else {
                    params.delete("maxPrice");
                  }
                  router.push(`${pathname}?${params.toString()}`, {
                    scroll: false,
                  });
                }}
                className={cn(
                  "block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  currentPriceRange === range
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-dark-600 hover:bg-dark-50 hover:text-dark"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Featured */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-dark">Lainnya</h3>
          <button
            onClick={() =>
              updateParams(
                "featured",
                currentParams.featured === "true" ? null : "true"
              )
            }
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
              currentParams.featured === "true"
                ? "bg-primary/10 font-medium text-primary"
                : "text-dark-600 hover:bg-dark-50 hover:text-dark"
            )}
          >
            <div
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded border",
                currentParams.featured === "true"
                  ? "border-primary bg-primary"
                  : "border-dark-300"
              )}
            >
              {currentParams.featured === "true" && (
                <svg
                  className="h-3 w-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            Produk Unggulan
          </button>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <>
            <Separator className="my-6" />
            <Button
              variant="outline"
              className="w-full"
              onClick={clearAllFilters}
            >
              <X className="mr-2 h-4 w-4" />
              Hapus Semua Filter
            </Button>
          </>
        )}
      </div>
    </>
  );
}
