"use client";

import * as React from "react";
import { Check, Copy, Mail, Share2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function ArticleReadingTools({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = React.useState(false);
  const [shared, setShared] = React.useState(false);
  const t = useTranslations("BlogArticle");

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const nativeShare = async () => {
    if (!navigator.share) return copyLink();
    try {
      await navigator.share({ title, text: title, url });
      setShared(true);
      window.setTimeout(() => setShared(false), 1500);
    } catch {}
  };

  const popup = (target: string) => {
    window.open(target, "share", "width=640,height=620,noopener,noreferrer");
  };

  return (
    <section className="rounded-3xl border border-dark-100 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,.07)]" aria-label={t("share")}>
      <div className="flex items-center gap-2">
        <Share2 className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-bold text-dark">{t("share")}</h2>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-dark-500">{title}</p>
      <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" aria-label={t("share")} title={t("share")} onClick={nativeShare} className="grid h-10 w-10 place-items-center rounded-xl text-dark-600 hover:bg-dark-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Share2 className="h-4 w-4" aria-hidden="true" /></button>
      <button type="button" aria-label={t("shareX")} title="X" onClick={() => popup(`https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`)} className="grid h-10 w-10 place-items-center rounded-xl text-dark-600 hover:bg-dark-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><X className="h-4 w-4" aria-hidden="true" /></button>
      <button type="button" aria-label={t("shareFacebook")} title="Facebook" onClick={() => popup(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)} className="grid h-10 w-10 place-items-center rounded-xl text-dark-600 hover:bg-dark-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span aria-hidden="true" className="text-[11px] font-black leading-none">f</span></button>
      <button type="button" aria-label={t("shareLinkedIn")} title="LinkedIn" onClick={() => popup(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`)} className="grid h-10 w-10 place-items-center rounded-xl text-dark-600 hover:bg-dark-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span aria-hidden="true" className="text-[10px] font-black leading-none">in</span></button>
      <a href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`} aria-label={t("shareEmail")} title="Email" className="grid h-10 w-10 place-items-center rounded-xl text-dark-600 hover:bg-dark-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Mail className="h-4 w-4" aria-hidden="true" /></a>
      <button type="button" aria-label={copied ? t("copied") : t("copyLink")} title={copied ? t("copied") : t("copyLink")} onClick={copyLink} className={cn("grid h-10 w-10 place-items-center rounded-xl text-dark-600 hover:bg-dark-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", copied && "bg-emerald-50 text-emerald-700")}>{copied || shared ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}</button>
      </div>
    </section>
  );
}
