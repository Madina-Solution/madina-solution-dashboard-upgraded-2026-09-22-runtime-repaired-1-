"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { items: { question: string; answer: string }[] };

export function FAQAccordion({ items }: Props) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <div className="mt-12 space-y-4">
      {items.map((faq, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-dark-100 bg-white">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-dark-50"
          >
            <span className="font-semibold text-dark">{faq.question}</span>
            <ChevronDown className={cn("h-5 w-5 shrink-0 text-dark-400 transition-transform", openIndex === index && "rotate-180")} />
          </button>
          <div className={cn("grid transition-all duration-300", openIndex === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
            <div className="overflow-hidden">
              <p className="px-6 pb-6 text-dark-600">{faq.answer}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
