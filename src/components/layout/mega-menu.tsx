"use client";

import Link from "next/link";
import {
  ArrowRight, BookOpen, BriefcaseBusiness, ChevronRight, Compass,
  ExternalLink, MessageCircleQuestion, Package, Sparkles, Grid2X2,
  Palette, Building2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { QUICK_NAV_SERVICES, QUICK_NAV_PRODUCTS, QUICK_NAV_EXPLORE, type QuickNavItem } from "@/lib/navigation";
import { NAV_ICON_MAP } from "@/lib/nav-icons";

export type MegaMenuGroup = "services" | "products" | "explore";
type MegaMenuProps = {
  activeMenu: MegaMenuGroup;
  navigation?: { services: QuickNavItem[]; products: QuickNavItem[]; explore: QuickNavItem[] };
};

function ItemIcon({ item }: { item: QuickNavItem }) {
  const Icon = NAV_ICON_MAP[item.icon];
  return <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dark-50 text-dark-600 transition-colors group-hover:bg-primary group-hover:text-white"><Icon className="h-4 w-4" aria-hidden="true" /></span>;
}

export function MegaMenu({ activeMenu, navigation = { services: QUICK_NAV_SERVICES, products: QUICK_NAV_PRODUCTS, explore: QUICK_NAV_EXPLORE } }: MegaMenuProps) {
  const t = useTranslations("Navigation");

  return (
    <div className="w-full pt-3">
      <div className="w-full overflow-hidden rounded-[28px] border border-dark-200 bg-white shadow-[0_24px_70px_-24px_rgba(15,23,42,.28)] ring-1 ring-black/5">
        {activeMenu === "services" && (
          <div className="grid min-h-[360px] grid-cols-[300px_minmax(0,1fr)]">
            <section className="border-r border-dark-100 bg-gradient-to-br from-white via-white to-primary-50/70 p-7">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-white shadow-sm"><BriefcaseBusiness className="h-5 w-5" /></span>
              <p className="mt-5 text-[10px] font-black uppercase tracking-[.2em] text-primary">{t("services")}</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-dark-900">{t("servicesTitle")}</h3>
              <p className="mt-4 text-sm leading-6 text-dark-500">{t("servicesText")}</p>
              <Link href="/services" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-dark-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-primary/30">{t("servicesAll")}<ArrowRight className="h-4 w-4" /></Link>
            </section>
            <section className="p-7">
              <div className="mb-5 flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-dark-400">{t("services")}</p><p className="mt-1 text-sm text-dark-500">{navigation.services.length} pilihan</p></div><Palette className="h-5 w-5 text-primary" aria-hidden="true" /></div>
              <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-3">
                {navigation.services.map((item) => <Link key={item.href} href={item.href} className="group flex items-start gap-3 rounded-2xl border border-dark-100 bg-white p-3 hover:border-primary/30 hover:bg-primary-50/40 focus:outline-none focus:ring-2 focus:ring-primary/25"><ItemIcon item={item} /><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-dark-800 group-hover:text-primary">{item.name}</span>{item.description && <span className="mt-0.5 block line-clamp-2 text-[11px] leading-4 text-dark-400">{item.description}</span>}</span><ChevronRight className="mt-1 h-4 w-4 shrink-0 text-dark-300 group-hover:text-primary" aria-hidden="true" /></Link>)}
              </div>
            </section>
          </div>
        )}

        {activeMenu === "products" && (
          <section className="p-7">
            <div className="flex items-end justify-between gap-5"><div><div className="flex items-center gap-2"><span className="grid h-10 w-10 place-items-center rounded-xl bg-dark text-white"><Package className="h-4.5 w-4.5" /></span><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-primary">{t("products")}</p><h3 className="text-2xl font-black tracking-tight text-dark-900">{t("productsTitle")}</h3></div></div><p className="mt-4 max-w-2xl text-sm leading-6 text-dark-500">{t("productsText")}</p></div><Link href="/products" className="hidden items-center gap-1 text-sm font-bold text-dark-600 hover:text-primary lg:inline-flex">{t("productsAll")}<ExternalLink className="h-4 w-4" /></Link></div>
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {navigation.products.map((item, index) => <Link key={item.href} href={item.href} className="group relative overflow-hidden rounded-2xl border border-dark-100 bg-dark-50/50 p-3.5 hover:border-primary/30 hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/25"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-dark-600 ring-1 ring-dark-100 group-hover:bg-primary group-hover:text-white"><ItemIcon item={item} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-dark-800 group-hover:text-primary">{item.name}</span><span className="mt-0.5 block text-[10px] text-dark-400">#{String(index + 1).padStart(2, "0")}</span></span></div></Link>)}
            </div>
            <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_340px]">
              <Link href="/products" className="group flex items-center justify-between rounded-2xl border border-dark-100 bg-white p-4 hover:border-primary/30"><div className="flex items-center gap-3"><Grid2X2 className="h-5 w-5 text-primary" /><div><p className="text-sm font-bold text-dark-900">{t("productsAll")}</p><p className="text-xs text-dark-400">{t("productsText")}</p></div></div><ArrowRight className="h-4 w-4 text-dark-300 group-hover:text-primary" /></Link>
              <div className="rounded-2xl bg-dark-900 p-4 text-white"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><span className="text-xs font-bold">{t("productsCustomTitle")}</span></div><p className="mt-1.5 text-[11px] leading-5 text-white/65">{t("productsCustomText")}</p><Link href="/contact" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-white hover:text-primary">{t("consult")}<ArrowRight className="h-3.5 w-3.5" /></Link></div>
            </div>
          </section>
        )}

        {activeMenu === "explore" && (
          <section className="grid min-h-[360px] grid-cols-[1.15fr_.85fr]">
            <div className="p-7">
              <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Compass className="h-5 w-5" /></span><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-primary">{t("explore")}</p><h3 className="text-2xl font-black tracking-tight text-dark-900">{t("exploreTitle")}</h3></div></div>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-dark-500">{t("exploreText")}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {navigation.explore.map((item) => <Link key={item.href} href={item.href} className="group rounded-2xl border border-dark-100 bg-white p-4 shadow-sm hover:border-primary/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/25"><div className="flex items-start gap-3"><ItemIcon item={item} /><div className="min-w-0 flex-1"><span className="block text-sm font-bold text-dark-800 group-hover:text-primary">{item.name}</span>{item.description && <span className="mt-1 block text-[11px] leading-4 text-dark-400">{item.description}</span>}</div></div></Link>)}
              </div>
            </div>
            <aside className="border-l border-dark-100 bg-dark-50/70 p-7">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-dark-400">{t("company")}</p>
              <div className="mt-4 space-y-2">
                <Link href="/blog" className="group flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-dark-100"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><BookOpen className="h-4.5 w-4.5" /></span><span className="flex-1"><span className="block text-sm font-bold text-dark-800 group-hover:text-primary">{t("insight")}</span><span className="text-[11px] text-dark-400">{t("insightText")}</span></span></Link>
                <Link href="/about" className="group flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-dark-100"><span className="grid h-10 w-10 place-items-center rounded-xl bg-dark-50 text-dark-600"><Building2 className="h-4.5 w-4.5" /></span><span className="flex-1"><span className="block text-sm font-bold text-dark-800 group-hover:text-primary">{t("company")}</span><span className="text-[11px] text-dark-400">{t("companyText")}</span></span></Link>
              </div>
              <Link href="/contact" className="mt-5 block rounded-2xl bg-primary p-5 text-white hover:bg-primary-dark"><div className="flex items-center gap-2"><MessageCircleQuestion className="h-4 w-4" /><span className="text-sm font-bold">{t("contact")}</span></div><p className="mt-2 text-xs leading-5 text-white/75">{t("startOrder")}</p></Link>
            </aside>
          </section>
        )}
      </div>
    </div>
  );
}
