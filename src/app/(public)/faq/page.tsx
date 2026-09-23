import { Metadata } from "next";
import { db } from "@/db";
import { faqs } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { PageHeader } from "@/components/layout/page-header";
import { FAQ as FAQComponent } from "@/components/home/faq";
import { FAQPageSchema } from "@/components/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo";
import { getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { resolveLocalizedFaq } from "@/lib/localized-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("FAQPage");
  return buildPageMetadata({ title: t("title"), description: t("description"), path: "/faq" });
}

// ISR: page is cached and regenerated in the background at most every 60s,
// instead of re-running the full render + DB queries on every single visit.
// Admin changes (new product, price update, etc.) appear within this window.
export const revalidate = 60;

export default async function FAQPage() {
  const [rawLocale, t] = await Promise.all([getLocale(), getTranslations("FAQPage")]);
  const locale = rawLocale as AppLocale;
  const faqSource = await db.select({ question: faqs.question, answer: faqs.answer, category: faqs.category, translations: faqs.translations }).from(faqs).where(eq(faqs.isActive, true)).orderBy(asc(faqs.order));
  const faqList = faqSource.map((item) => resolveLocalizedFaq(item, locale));
  return (
    <div>
      {faqList.length > 0 ? <FAQPageSchema items={faqList} /> : null}
      <PageHeader
        title={t("title")}
        description={t("description")}
        breadcrumbs={[{ label: t("home"), href: "/" }, { label: t("title") }]}
      />
      <FAQComponent />
    </div>
  );
}
