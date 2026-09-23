"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { SiteImage } from "@/components/ui/site-image";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";

type RelatedProduct = {
  id: string;
  name: string;
  slug: string;
  thumbnail: string | null;
  basePrice: string;
  unit: string | null;
  rating: string | null;
};

type Props = {
  products: RelatedProduct[];
};

export function RelatedProducts({ products }: Props) {
  if (products.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold text-dark">Produk Terkait</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <div key={product.id}>
            <Link href={`/products/${product.slug}`}>
              <Card className="group h-full overflow-hidden transition-all hover:shadow-premium-lg">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-dark-100">
                  {product.thumbnail ? (
                    <SiteImage
                      src={product.thumbnail}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <MediaPlaceholder />
                  )}
                  <div className="absolute inset-0 bg-dark/0 transition-colors group-hover:bg-dark/10" />
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-dark group-hover:text-primary">
                    {product.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {product.rating || "0"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
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
          </div>
        ))}
      </div>
    </section>
  );
}
