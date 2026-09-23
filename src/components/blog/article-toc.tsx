"use client";

import * as React from "react";
import { ChevronDown, ListTree } from "lucide-react";
import { useTranslations } from "next-intl";

type Heading = { id: string; level: number; title: string };

export function ArticleToc({ headings }: { headings: Heading[] }) {
  const t = useTranslations("BlogArticle");
  const [open, setOpen] = React.useState(true);
  const [activeId, setActiveId] = React.useState(headings[0]?.id || "");

  React.useEffect(() => {
    if (!headings.length) return;
    const elements = headings.map((heading) => document.getElementById(heading.id)).filter((element): element is HTMLElement => Boolean(element));
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]?.target instanceof HTMLElement) setActiveId(visible[0].target.id);
    }, { rootMargin: "-16% 0px -68% 0px", threshold: [0, 0.15, 0.5, 1] });

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return null;
  return (
    <nav aria-label={t("toc")} className="rounded-3xl border border-dark-200 bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,.07)] lg:max-h-none">
      <button type="button" className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className="flex items-center gap-2 text-sm font-bold text-dark"><ListTree className="h-4 w-4 text-primary" aria-hidden="true" />{t("toc")}</span>
        <ChevronDown className={`h-4 w-4 text-dark-400 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && <ol className="mt-4 space-y-1.5 border-l border-dark-100 pl-3">{headings.map((h) => {
        const active = activeId === h.id;
        return <li key={h.id} className={h.level === 3 ? "pl-3" : ""}><a href={`#${h.id}`} aria-current={active ? "location" : undefined} onClick={() => setActiveId(h.id)} className={`block rounded-lg border-l-2 px-2 py-1.5 text-[13px] leading-5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${active ? "border-primary bg-primary/[.06] font-bold text-primary" : "border-transparent text-dark-600 hover:bg-dark-50 hover:text-dark"}`}>{h.title}</a></li>;
      })}</ol>}
    </nav>
  );
}
