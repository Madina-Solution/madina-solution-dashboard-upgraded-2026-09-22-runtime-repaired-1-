import { MediaCarousel } from "@/components/ui/media-carousel";
import { SiteImage } from "@/components/ui/site-image";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Clock, MessageCircle, ChevronRight } from "lucide-react";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { BRAND } from "@/lib/constants";
import { BreadcrumbSchema, CreativeWorkSchema } from "@/components/seo/json-ld";
import { buildPageMetadata, getSiteUrl } from "@/lib/seo";
import { getLocale } from "next-intl/server";
import { resolveLocalizedService } from "@/lib/localized-content";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ slug: string }> };

/** Revalidate public detail content frequently without rebuilding the whole site. */
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await db.select({ name: services.name, shortDescription: services.shortDescription }).from(services).where(eq(services.slug, slug)).limit(1);
  if (!result[0]) return { title: "Layanan Tidak Ditemukan" };
  return buildPageMetadata({ title: result[0].name, description: result[0].shortDescription || `Layanan ${result[0].name} dari Madina Solution`, path: `/services/${encodeURIComponent(slug)}` });
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const [rawLocale] = await Promise.all([getLocale()]);
  const locale = rawLocale as AppLocale;
  const result = await db.select().from(services).where(and(eq(services.slug, slug), eq(services.isActive, true))).limit(1);
  const service = result[0] ? resolveLocalizedService(result[0], locale) : undefined;

  if (!service) notFound();

  const relatedServicesSource = await db.select({ id: services.id, name: services.name, slug: services.slug, thumbnail: services.thumbnail, shortDescription: services.shortDescription, startingPrice: services.startingPrice, translations: services.translations }).from(services).where(and(ne(services.id, service.id), eq(services.isActive, true))).limit(3);
  const relatedServices = relatedServicesSource.map((item) => resolveLocalizedService(item, locale));

  const siteUrl = getSiteUrl();
  const features = (service.features as string[]) || [];
  const deliverables = (service.deliverables as string[]) || [];

  const pageUrl = `${siteUrl}/services/${encodeURIComponent(slug)}`;

  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Home", url: siteUrl },
        { name: "Layanan", url: `${siteUrl}/services` },
        { name: service.name, url: `${siteUrl}/services/${service.slug}` },
      ]} />

      <CreativeWorkSchema name={service.name} description={service.shortDescription || service.description || `Layanan ${service.name}`} url={pageUrl} image={service.thumbnail || undefined} />

      <div className="py-12 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-sm text-dark-500">
            <Link href="/" className="hover:text-primary">Beranda</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/services" className="hover:text-primary">Layanan</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-dark">{service.name}</span>
          </nav>

          <div className="grid gap-12 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {(() => { const gallery = Array.isArray(service.gallery) ? (service.gallery as string[]) : []; const media = gallery.length ? gallery : (service.thumbnail ? [service.thumbnail] : []); return media.length ? <div className="mb-8"><MediaCarousel items={media} alt={service.name} autoPlay={media.length > 1} /></div> : null; })()}
              <Badge variant="default" className="mb-4">Layanan</Badge>
              <h1 className="text-3xl font-bold text-dark lg:text-4xl">{service.name}</h1>
              {service.shortDescription && <p className="mt-4 text-lg text-dark-600">{service.shortDescription}</p>}

              {service.description && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold text-dark">Tentang Layanan</h2>
                  <p className="mt-4 whitespace-pre-wrap text-dark-600">{service.description}</p>
                </div>
              )}

              {features.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold text-dark">Fitur</h2>
                  <ul className="mt-4 space-y-3">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                        <span className="text-dark-600">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {deliverables.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold text-dark">Deliverables</h2>
                  <ul className="mt-4 space-y-2">
                    {deliverables.map((d, i) => (
                      <li key={i} className="flex items-center gap-2 text-dark-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  {service.startingPrice && (
                    <div className="mb-4">
                      <p className="text-sm text-dark-500">Mulai dari</p>
                      <p className="text-3xl font-bold text-primary">{formatCurrency(Number(service.startingPrice))}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 rounded-xl bg-dark-50 p-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-dark">Estimasi</p>
                      <p className="text-sm text-dark-500">{service.estimatedDays || 7} hari kerja</p>
                    </div>
                  </div>

                  <Button className="mt-6 w-full" size="lg" asChild>
                    <Link href={`/services/${service.slug}/order`}>
                      Pesan Layanan <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <Button variant="outline" className="mt-3 w-full" size="lg" asChild>
                    <Link href="/contact">Konsultasi Gratis</Link>
                  </Button>

                  <Button variant="secondary" className="mt-3 w-full" size="lg" asChild>
                    <a href={`https://wa.me/${BRAND.whatsapp}?text=Halo%20Madina%20Solution%2C%20saya%20tertarik%20dengan%20layanan%20${encodeURIComponent(service.name)}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-2 h-4 w-4" /> Chat WhatsApp
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Related Services */}
          {relatedServices.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-dark">Layanan Lainnya</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                {relatedServices.map((s) => (
                  <Link key={s.id} href={`/services/${s.slug}`}>
                    <Card className="group h-full transition-all hover:shadow-premium-lg">
                      <CardContent className="p-4">
                        <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-xl bg-dark-50">
                          {s.thumbnail ? <SiteImage src={s.thumbnail} alt={s.name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center text-primary"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">MS</span></div>}
                        </div>
                        <h3 className="font-semibold text-dark group-hover:text-primary">{s.name}</h3>
                        {s.shortDescription && <p className="mt-2 text-sm text-dark-500 line-clamp-2">{s.shortDescription}</p>}
                        {s.startingPrice && <p className="mt-3 font-medium text-primary">{formatCurrency(Number(s.startingPrice))}</p>}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
