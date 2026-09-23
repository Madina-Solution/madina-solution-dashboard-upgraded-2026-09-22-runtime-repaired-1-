import { OrganizationSchema, WebSiteSchema, WebPageSchema } from "@/components/seo/json-ld";
import { getPublicSiteConfig } from "@/lib/site-config";
import { Hero } from "@/components/home/hero";
import { Services } from "@/components/home/services";
import { FeaturedProducts } from "@/components/home/featured-products";
import { WhyUs } from "@/components/home/why-us";
import { Testimonials } from "@/components/home/testimonials";
import { Process } from "@/components/home/process";
import { FAQ } from "@/components/home/faq";
import { CTA } from "@/components/home/cta";

// ISR: page is cached and regenerated in the background at most every 60s,
// instead of re-running the full render + DB queries on every single visit.
// Admin changes (new product, price update, etc.) appear within this window.
export const revalidate = 60;

export default async function HomePage() {
  const site = await getPublicSiteConfig();
  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />
      <WebPageSchema name={site.siteName} description={site.seoDescription || site.siteTagline} url={site.siteUrl} />
      <main className="min-h-screen">
        <Hero />
        <Services />
        <FeaturedProducts />
        <WhyUs />
        <Process />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
    </>
  );
}
