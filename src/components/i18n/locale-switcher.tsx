"use client";

import * as React from "react";
import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { routing, type AppLocale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("LocaleSwitcher");
  const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = event.target.value as AppLocale;
    if (!routing.locales.includes(nextLocale)) return;
    document.cookie = `${routing.localeCookie}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    window.location.reload();
  };

  return (
    <label className="hidden h-10 items-center gap-1.5 rounded-xl border border-dark-100 bg-white px-2.5 text-dark-600 shadow-sm lg:flex" aria-label={t("label")}>
      <Languages className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">{t("label")}</span>
      <select value={locale} onChange={onChange} className="bg-transparent text-xs font-bold outline-none" aria-label={t("label")}>
        <option value="id">{t("id")}</option>
        <option value="en">{t("en")}</option>
      </select>
    </label>
  );
}
