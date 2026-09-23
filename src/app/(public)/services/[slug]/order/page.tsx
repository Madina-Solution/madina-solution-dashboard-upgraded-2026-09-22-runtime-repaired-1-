import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSiteUrl } from "@/lib/seo";
import { buildPageMetadata } from "@/lib/seo";
import { SiteImage } from "@/components/ui/site-image";
import { ServiceConfiguration } from "@/components/services/service-configuration";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [service] = await db.select({ name: services.name, shortDescription: services.shortDescription }).from(services).where(and(eq(services.slug, slug), eq(services.isActive, true))).limit(1);
  if (!service) return { title: "Layanan Tidak Ditemukan" };
  return buildPageMetadata({ title: `Pesan ${service.name}`, description: service.shortDescription || `Pesan layanan ${service.name} dari Madina Solution.`, path: `/services/${encodeURIComponent(slug)}/order` });
}

export default async function ServiceOrderPage({ params }: Props) {
  const { slug } = await params;
  const [service] = await db.select().from(services).where(and(eq(services.slug, slug), eq(services.isActive, true))).limit(1);
  if (!service) notFound();
  const siteUrl = getSiteUrl();
  const options = Array.isArray(service.options) ? service.options : [];
  return (
    <div className="py-10 lg:py-16">
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <Link href={`/services/${service.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-dark-500 hover:text-primary"><ArrowLeft className="h-4 w-4" />Kembali ke detail layanan</Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-5">
            {service.thumbnail && <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-dark-50"><SiteImage src={service.thumbnail} alt={service.name} fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" priority /></div>}
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Order layanan</p><h1 className="mt-2 text-3xl font-bold text-dark lg:text-4xl">{service.name}</h1><p className="mt-3 text-dark-600">{service.description || service.shortDescription}</p></div>
            <div className="space-y-3 rounded-2xl border border-dark-100 bg-white p-5 shadow-sm"><p className="font-semibold text-dark">Alur pemesanan</p>{["Tentukan spesifikasi sesuai kebutuhan", "Upload bahan/referensi bila diperlukan", "Review estimasi dan lanjut checkout", "Tim Madina Solution memproses pesanan"].map((item) => <div key={item} className="flex items-start gap-3 text-sm text-dark-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{item}</div>)}</div>
            <p className="text-xs text-dark-400">{siteUrl} · Data konfigurasi disimpan sebagai bagian dari pesanan untuk menjaga akurasi produksi.</p>
          </div>
          <ServiceConfiguration serviceId={service.id} serviceName={service.name} serviceSlug={service.slug} thumbnail={service.thumbnail} basePrice={Number(service.startingPrice || 0)} estimatedDays={service.estimatedDays || 7} options={options} fulfillmentType={service.fulfillmentType} />
        </div>
      </div>
    </div>
  );
}
