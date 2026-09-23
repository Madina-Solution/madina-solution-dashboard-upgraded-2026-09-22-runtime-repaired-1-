import { db } from "@/db";
import { faqs } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { FAQAccordion } from "./faq-accordion";

export async function FAQ() {
  const items = await db.select().from(faqs).where(eq(faqs.isActive, true)).orderBy(asc(faqs.order)).limit(6);

  if (items.length === 0) return null;

  return (
    <section className="bg-dark-50 py-20 lg:py-28">
      <div className="mx-auto max-w-4xl px-4 lg:px-6">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">FAQ</span>
          <h2 className="mt-3 text-3xl font-bold text-dark sm:text-4xl">Pertanyaan Umum</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-dark-600">Temukan jawaban untuk pertanyaan yang sering diajukan</p>
        </div>
        <FAQAccordion items={items.map(f => ({ question: f.question, answer: f.answer }))} />
      </div>
    </section>
  );
}
