import { SiteImage } from "@/components/ui/site-image";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { services } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function Services() {
  const items = await db.select().from(services).where(eq(services.isActive, true)).orderBy(desc(services.isFeatured), desc(services.createdAt)).limit(6);
  if (!items.length) return null;
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Layanan Kami</span>
          <h2 className="mt-3 text-3xl font-bold text-dark sm:text-4xl lg:text-5xl">Solusi Lengkap untuk <span className="text-gradient">Kebutuhan Bisnis</span></h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-dark-600">Layanan nyata dari database bisnis kami, lengkap dengan detail dan paket yang dapat dikelola dari dashboard.</p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link key={item.id} href={`/services/${item.slug}`}>
              <Card className="group h-full overflow-hidden border-transparent hover:border-primary/20">
                {item.thumbnail ? <div className="relative aspect-[16/10] w-full overflow-hidden"><SiteImage src={item.thumbnail} alt={item.name} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" /></div> : null}
                <CardContent className="p-6">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <BriefcaseBusiness className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-dark group-hover:text-primary">{item.name}</h3>
                  <p className="mt-2 text-dark-500">{item.shortDescription || item.description}</p>
                  <div className="mt-4 flex items-center text-sm font-medium text-primary">Lihat layanan<ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" /></div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button variant="outline" size="lg" asChild><Link href="/services">Lihat Semua Layanan<ArrowRight className="ml-2 h-5 w-5" /></Link></Button>
        </div>
      </div>
    </section>
  );
}
