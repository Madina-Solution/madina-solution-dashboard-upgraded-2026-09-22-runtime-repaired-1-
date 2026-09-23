import { SiteImage } from "@/components/ui/site-image";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { db } from "@/db";
import { services, categories, products } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { SERVICE_NAV_GROUPS } from "@/lib/navigation";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({ title: "Layanan", description: "Layanan desain grafis, digital printing, advertising, branding, dan paket bisnis untuk kebutuhan visual bisnis Anda.", path: "/services" });

// ISR: page is cached and regenerated in the background at most every 60s,
// instead of re-running the full render + DB queries on every single visit.
// Admin changes (new product, price update, etc.) appear within this window.
export const revalidate = 60;

export default async function ServicesPage() {
  // Fetch services from database
  const [serviceList, categoryList, productList] = await Promise.all([
    db
      .select()
      .from(services)
      .where(eq(services.isActive, true))
      .orderBy(desc(services.isFeatured), desc(services.createdAt)),
    db
      .select({ slug: categories.slug, image: categories.image })
      .from(categories)
      .where(eq(categories.isActive, true)),
    db
      .select({ slug: products.slug, name: products.name, thumbnail: products.thumbnail })
      .from(products)
      .where(eq(products.isActive, true)),
  ]);

  const serviceImages = new Map(serviceList.map((item) => [item.slug, item.thumbnail || ""]));
  const categoryImages = new Map(categoryList.map((item) => [item.slug, item.image || ""]));
  const productImages = new Map(productList.flatMap((item) => item.thumbnail ? [[item.slug, item.thumbnail] as const] : []));

  const resolveNavImage = (href: string) => {
    const url = new URL(href, "https://madinasolution.local");
    if (url.pathname.startsWith("/services/")) {
      return serviceImages.get(url.pathname.split("/").filter(Boolean).pop() || "") || "";
    }
    const categorySlug = url.searchParams.get("category");
    if (categorySlug) return categoryImages.get(categorySlug) || "";
    const query = url.searchParams.get("q")?.trim().toLowerCase();
    if (query) {
      const match = productList.find((item) => item.thumbnail && (`${item.slug} ${item.name}`).toLowerCase().includes(query));
      if (match?.thumbnail) return match.thumbnail;
      return Array.from(productImages.values())[0] || "";
    }
    return "";
  };

  return (
    <div className="py-12 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        {/* Header */}
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Layanan Kami
          </span>
          <h1 className="mt-3 text-4xl font-bold text-dark lg:text-5xl">
            Solusi Lengkap untuk Bisnis Anda
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-dark-600">
            Dari ide hingga produksi, kami siap membantu mewujudkan kebutuhan
            visual dan promosi bisnis Anda.
          </p>
        </div>

        {/* Featured Services from Database */}
        {serviceList.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-8 text-2xl font-bold text-dark">
              Layanan Unggulan
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {serviceList.map((service) => (
                <Link key={service.id} href={`/services/${service.slug}`}>
                  <Card className="group h-full transition-all hover:border-primary/20 hover:shadow-premium">
                    <CardContent className="p-6">
                      <div className="flex aspect-[3/2] items-center justify-center overflow-hidden rounded-xl bg-primary/10">
                        {service.thumbnail ? <div className="relative h-full w-full"><SiteImage src={service.thumbnail} alt={service.name} fill sizes="(max-width: 1024px) 100vw, 25vw" className="object-cover" /></div> : <MediaPlaceholder />}
                      </div>
                      {service.isFeatured && (
                        <Badge className="mt-3" variant="default">
                          Featured
                        </Badge>
                      )}
                      <h3 className="mt-3 font-semibold text-dark group-hover:text-primary">
                        {service.name}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-dark-500">
                        {service.shortDescription}
                      </p>
                      {service.startingPrice && (
                        <p className="mt-3 text-sm font-medium text-primary">
                          Mulai dari{" "}
                          {formatCurrency(Number(service.startingPrice))}
                        </p>
                      )}
                      <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        Selengkapnya
                        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Service navigation built only from the canonical route contract */}
        <div className="mt-20 space-y-16">
          {SERVICE_NAV_GROUPS.map((group) => (
            <section key={group.slug}>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-dark">{group.category}</h2>
                  <p className="mt-1 text-sm text-dark-500">{group.description}</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={group.items[0]?.href || "/services"}>
                    Lihat Pilihan
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {group.items.slice(0, 4).map((item) => (
                  <Link key={`${group.slug}-${item.name}`} href={item.href}>
                    <Card className="group h-full transition-all hover:border-primary/20 hover:shadow-premium">
                      <CardContent className="p-4">
                        <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-dark-50">
                          {resolveNavImage(item.href) ? (
                            <SiteImage src={resolveNavImage(item.href)} alt={item.name} fill sizes="(max-width: 1024px) 100vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-primary shadow-sm"><Sparkles className="h-5 w-5" /></span>
                            </div>
                          )}
                        </div>
                        <h3 className="mt-3 font-semibold text-dark group-hover:text-primary">
                          {item.name}
                        </h3>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 rounded-3xl bg-primary/5 p-8 text-center lg:p-12">
          <h2 className="text-2xl font-bold text-dark lg:text-3xl">
            Tidak Menemukan Layanan yang Anda Cari?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-dark-600">
            Hubungi kami untuk konsultasi gratis. Tim kami siap membantu
            menemukan solusi terbaik untuk kebutuhan bisnis Anda.
          </p>
          <Button size="lg" className="mt-6" asChild>
            <Link href="/contact">
              Hubungi Kami
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
