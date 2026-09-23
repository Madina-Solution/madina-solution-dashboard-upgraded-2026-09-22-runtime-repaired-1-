"use client";

import { BrandMark } from "@/components/layout/brand-mark";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X, Search, UserCircle, ArrowRight, Phone, Mail, ChevronDown,
  Home, ShoppingBag, LogOut, BriefcaseBusiness, Settings,
  Star, Compass,
} from "lucide-react";
import { SiteImage } from "@/components/ui/site-image";
import { cn } from "@/lib/utils";
import {
  QUICK_NAV_SERVICES,
  QUICK_NAV_PRODUCTS,
  QUICK_NAV_EXPLORE,
  type QuickNavItem,
} from "@/lib/navigation";
import { NAV_ICON_MAP } from "@/lib/nav-icons";
import { BRAND } from "@/lib/constants";
import { useSearch } from "@/components/search/search-provider";
import { useAuth } from "@/lib/auth/auth-provider";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { useTranslations } from "next-intl";

type Props = {
  isOpen: boolean; onClose: () => void; siteName?: string; siteLogo?: string; siteTagline?: string;
  sitePhone?: string; siteEmail?: string; siteWhatsapp?: string;
  navigation?: { services: QuickNavItem[]; products: QuickNavItem[]; explore: QuickNavItem[] };
};

export function MobileNav({ isOpen, onClose, siteName = BRAND.name, siteLogo = "", siteTagline = BRAND.tagline, sitePhone = "+62 813-9300-5035", siteEmail = BRAND.email, siteWhatsapp = BRAND.whatsapp, navigation = { services: QUICK_NAV_SERVICES, products: QUICK_NAV_PRODUCTS, explore: QUICK_NAV_EXPLORE } }: Props) {
  const { services: navServices, products: navProducts, explore: navExplore } = navigation;
  const { openSearch } = useSearch();
  const { user, logout } = useAuth();
  const router = useRouter();
  const t = useTranslations("Navigation");
  const [expanded, setExpanded] = React.useState<string | null>(null);

  React.useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleClose = React.useCallback(() => { setExpanded(null); onClose(); }, [onClose]);
  const toggle = (key: string) => setExpanded((value) => (value === key ? null : key));
  const handleLogout = async () => { await logout(); handleClose(); router.push("/"); };
  const handleSearch = () => { handleClose(); openSearch(); };

  const primaryLinks = [
    { href: "/", label: t("home"), icon: Home },
  ];
  // Kontak intentionally lives only inside the Eksplor group below (and the
  // "Mulai Pesanan" CTA at the bottom) — it used to also be listed here as a
  // standalone link, which duplicated it.

  return isOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div onClick={handleClose} className="absolute inset-0 bg-dark-900/65 backdrop-blur-sm" aria-hidden="true" />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="Navigasi mobile">
            <div className="flex items-center justify-between border-b border-dark-100 bg-white p-4">
              <Link href="/" onClick={handleClose} className="flex items-center gap-3" aria-label="Madina Solution Home">
                <BrandMark siteLogo={siteLogo} siteName={siteName} tagline={siteTagline} compact logoClassName="h-10 w-10" className="max-w-[220px]" />
              </Link>
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleClose} className="rounded-xl p-2 text-dark-500 hover:bg-dark-100 hover:text-dark-900" aria-label="Close menu"><X className="h-5 w-5" /></button>
              </div>
            </div>

            <div className="border-b border-dark-100 bg-dark-50/60 p-4">
              <button onClick={handleSearch} className="flex w-full items-center gap-3 rounded-xl border border-dark-100 bg-white px-4 py-3 text-left shadow-sm hover:border-primary/30" aria-label="Cari produk atau layanan">
                <Search className="h-5 w-5 text-primary" />
                <span className="text-sm text-dark-500">Cari produk atau layanan...</span>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 py-3" aria-label="Mobile menu">
              <ul className="space-y-1">
                {primaryLinks.map((item) => { const Icon = item.icon; return <li key={item.href}><Link href={item.href} onClick={handleClose} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-dark-800 hover:bg-primary-50 hover:text-primary"><Icon className="h-4 w-4 text-primary" />{item.label}</Link></li>; })}

                <li>
                  <button onClick={() => toggle("services")} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-dark-800 hover:bg-primary-50 hover:text-primary" aria-expanded={expanded === "services"}>
                    <BriefcaseBusiness className="h-4 w-4 text-primary" /><span className="flex-1">{t("services")}</span><ChevronDown className={cn("h-4 w-4 transition-transform", expanded === "services" && "rotate-180")} />
                  </button>
                  {expanded === "services" && <div className="overflow-hidden"><div className="space-y-1 pb-2 pl-4 pr-1 pt-1">
                    {navServices.map((item) => { const Icon = NAV_ICON_MAP[item.icon]; return (
                      <Link key={item.href} href={item.href} onClick={handleClose} className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-xs font-medium text-dark-600 hover:bg-primary-50 hover:text-primary">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-dark-800">{item.name}</span>{item.description ? <span className="block truncate text-[10px] text-dark-400">{item.description}</span> : null}</span>
                      </Link>
                    ); })}
                  </div></div>}
                </li>

                <li>
                  <button onClick={() => toggle("products")} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-dark-800 hover:bg-primary-50 hover:text-primary" aria-expanded={expanded === "products"}>
                    <ShoppingBag className="h-4 w-4 text-primary" /><span className="flex-1">{t("products")}</span><ChevronDown className={cn("h-4 w-4 transition-transform", expanded === "products" && "rotate-180")} />
                  </button>
                  {expanded === "products" && <div className="overflow-hidden"><div className="grid grid-cols-2 gap-1.5 pb-2 pl-4 pr-1 pt-1">
                    {navProducts.map((item) => { const Icon = NAV_ICON_MAP[item.icon]; return (
                      <Link key={item.href} href={item.href} onClick={handleClose} className="flex items-center gap-2 rounded-xl border border-dark-100 bg-white px-2.5 py-2 text-xs font-semibold text-dark-600 hover:border-primary/20 hover:bg-primary-50 hover:text-primary">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-dark-50 text-dark-500"><Icon className="h-3.5 w-3.5" /></span>
                        <span className="min-w-0 truncate">{item.name}</span>
                      </Link>
                    ); })}
                  </div></div>}
                </li>

                <li>
                  <button onClick={() => toggle("explore")} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-dark-800 hover:bg-primary-50 hover:text-primary" aria-expanded={expanded === "explore"}>
                    <Compass className="h-4 w-4 text-primary" /><span className="flex-1">{t("explore")}</span><ChevronDown className={cn("h-4 w-4 transition-transform", expanded === "explore" && "rotate-180")} />
                  </button>
                  {expanded === "explore" && <div className="overflow-hidden"><div className="space-y-1 pb-2 pl-4 pr-1 pt-1">
                    {navExplore.map((item) => { const Icon = NAV_ICON_MAP[item.icon]; return (
                      <Link key={item.href} href={item.href} onClick={handleClose} className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-xs font-medium text-dark-600 hover:bg-dark-50 hover:text-primary">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-dark-50 text-dark-600"><Icon className="h-4 w-4" /></span>
                        <span className="min-w-0 truncate font-semibold text-dark-800">{item.name}</span>
                      </Link>
                    ); })}
                  </div></div>}
                </li>

              </ul>

              <div className="mx-1 mb-4 mt-4 rounded-2xl bg-dark-900 p-4 text-white shadow-lg"><div className="flex items-center gap-2"><Star className="h-4 w-4 text-primary" /><p className="text-xs font-bold uppercase tracking-wider text-white/80">Hubungi Kami</p></div><div className="mt-3 space-y-2"><a href={`https://wa.me/${siteWhatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-white/80 hover:text-primary"><Phone className="h-4 w-4 text-primary" />{sitePhone}</a><a href={`mailto:${siteEmail}`} className="flex items-center gap-3 text-sm text-white/80 hover:text-primary"><Mail className="h-4 w-4 text-primary" />{siteEmail}</a></div></div>
            </nav>

            <div className="space-y-3 border-t border-dark-100 bg-white p-4">
              {user ? (
                <div className="rounded-2xl border border-primary/15 bg-primary-50 p-3">
                  <div className="flex items-center gap-3">
                    {user.avatar ? <SiteImage src={user.avatar} alt={user.name} width={44} height={44} className="h-11 w-11 rounded-full object-cover ring-2 ring-white" /> : <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-white ring-2 ring-white">{user.name.charAt(0).toUpperCase()}</div>}
                    <div className="min-w-0 flex-1"><p className="truncate font-semibold text-dark-900">{user.name}</p><p className="truncate text-xs text-dark-500">{user.email}</p></div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2"><Link href="/account" onClick={handleClose} className="flex items-center justify-center gap-2 rounded-xl bg-dark-900 py-2.5 text-sm font-semibold text-white hover:bg-dark-800"><UserCircle className="h-4 w-4" />Akun</Link><Link href="/account/settings" onClick={handleClose} className="flex items-center justify-center gap-2 rounded-xl border border-dark-200 bg-white py-2.5 text-sm font-medium text-dark-700 hover:bg-dark-50"><Settings className="h-4 w-4" />Pengaturan</Link></div>
                  <button type="button" onClick={handleLogout} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-white py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />Keluar</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2"><Link href="/login" onClick={handleClose} className="flex items-center justify-center gap-2 rounded-xl border border-dark-200 bg-white py-2.5 text-sm font-medium text-dark-700 hover:bg-dark-50"><UserCircle className="h-4 w-4" />Masuk</Link><Link href="/register" onClick={handleClose} className="flex items-center justify-center gap-2 rounded-xl bg-dark-900 py-2.5 text-sm font-semibold text-white hover:bg-dark-800">Daftar</Link></div>
              )}
              <Link href="/contact" onClick={handleClose} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark">Mulai Pesanan<ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
  ) : null;
}
