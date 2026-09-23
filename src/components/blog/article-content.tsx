"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteImage } from "@/components/ui/site-image";
import { useTranslations } from "next-intl";

export function ArticleContent({ html }: { html: string }) {
  const [lightbox, setLightbox] = React.useState<{ src: string; alt: string } | null>(null);
  const [footnote, setFootnote] = React.useState<string | null>(null);
  const t = useTranslations("BlogArticle");

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.tagName === "IMG") {
      const src = target.getAttribute("src");
      if (src) {
        event.preventDefault();
        setLightbox({ src, alt: target.getAttribute("alt") || t("imagePreview") });
      }
      return;
    }
    const link = target.closest("a[href^=\"#footnote-\"]") as HTMLAnchorElement | null;
    if (link) {
      const id = link.getAttribute("href")?.slice(1);
      if (!id) return;
      const reference = document.getElementById(id);
      if (reference) {
        event.preventDefault();
        setFootnote(reference.textContent?.trim() || "Referensi artikel");
      }
    }
  };

  return (
    <>
      <div className="rich-article-content" onClick={handleClick} dangerouslySetInnerHTML={{ __html: html }} />
      {lightbox && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-dark-950/92 p-4" role="dialog" aria-modal="true" aria-label={t("imagePreview")} onClick={() => setLightbox(null)}><div className="relative h-[88vh] w-[94vw]" onClick={(event) => event.stopPropagation()}><SiteImage src={lightbox.src} alt={lightbox.alt} fill sizes="94vw" className="object-contain" priority /><Button type="button" variant="secondary" size="icon" aria-label={t("close")} className="absolute right-2 top-2 rounded-full" onClick={() => setLightbox(null)}><X /></Button></div></div>}
      {footnote && <div className="fixed inset-0 z-[121] flex items-end justify-center bg-dark-950/45 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={t("footnote")} onClick={() => setFootnote(null)}><div className="w-full max-w-lg rounded-3xl border border-dark-200 bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-primary">{t("footnote")}</p><h2 className="mt-1 text-lg font-semibold text-dark">{t("sourceReference")}</h2></div><Button type="button" variant="ghost" size="icon" aria-label={t("close")} onClick={() => setFootnote(null)}><X /></Button></div><p className="mt-5 text-sm leading-7 text-dark-600">{footnote}</p></div></div>}
    </>
  );
}
