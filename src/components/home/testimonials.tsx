import { SiteImage } from "@/components/ui/site-image";
import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function Testimonials() {
  const items = await db.select().from(testimonials).where(eq(testimonials.isActive, true)).orderBy(desc(testimonials.isFeatured), desc(testimonials.createdAt)).limit(6);
  if (items.length === 0) return null;
  return (
    <section className="bg-dark py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Testimoni</span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">Apa Kata Mereka</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-dark-300">Testimoni pelanggan dikelola melalui database sehingga terus bisa diperbarui dari dashboard.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <Card key={t.id} className="h-full border-dark-700 bg-dark-800">
              <CardContent className="p-6">
                <Quote className="h-8 w-8 text-primary/50" />
                <p className="mt-4 text-dark-200">{t.content}</p>
                <div className="mt-4 flex gap-1">{Array.from({ length: t.rating || 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}</div>
                <div className="mt-4 flex items-center gap-3">
                  {t.avatar ? <SiteImage src={t.avatar} alt="" aria-hidden="true" width={40} height={40} className="h-10 w-10 rounded-full object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary" aria-hidden="true">{t.name.charAt(0)}</div>}
                  <div><p className="font-semibold text-white">{t.name}</p><p className="text-sm text-dark-400">{[t.role, t.company].filter(Boolean).join(", ")}</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
