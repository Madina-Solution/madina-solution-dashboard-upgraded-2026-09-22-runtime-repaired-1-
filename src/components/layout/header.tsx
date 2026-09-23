"use client";
import { SiteImage } from "@/components/ui/site-image";
import { BrandMark } from "@/components/layout/brand-mark";

import * as React from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Search,
  ShoppingCart,
  User,
  ChevronDown,
  Phone,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS, BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useSearch } from "@/components/search/search-provider";
import { useCart } from "@/lib/cart/cart-provider";
import { useAuth } from "@/lib/auth/auth-provider";
import { MegaMenu } from "./mega-menu";
import { MobileNav } from "./mobile-nav";
import { QUICK_NAV_SERVICES, QUICK_NAV_PRODUCTS, QUICK_NAV_EXPLORE, type QuickNavItem } from "@/lib/navigation";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { useTranslations } from "next-intl";

type HeaderProps = {
  siteName?: string; siteLogo?: string; topBarEnabled?: boolean; topBarText?: string;
  sitePhone?: string; siteEmail?: string; siteWhatsapp?: string; siteTagline?: string;
  navigation?: { services: QuickNavItem[]; products: QuickNavItem[]; explore: QuickNavItem[] };
};

export function Header({ siteName = BRAND.name, siteLogo = "", topBarEnabled = true, topBarText = "Creative Business Platform untuk kebutuhan bisnis Anda", sitePhone = "+62 813-9300-5035", siteEmail = BRAND.email, siteWhatsapp = BRAND.whatsapp, siteTagline = BRAND.tagline, navigation = { services: QUICK_NAV_SERVICES, products: QUICK_NAV_PRODUCTS, explore: QUICK_NAV_EXPLORE } }: HeaderProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const t = useTranslations("Navigation");
  const { openSearch } = useSearch();
  const { state: cartState, openDrawer: openCartDrawer } = useCart();
  const { user, logout } = useAuth();
  const closeTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveMenu(null);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleMenuEnter = (key: "services" | "products" | "explore") => {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
    setActiveMenu(key);
  };

  const handleLogout = async () => {
    await logout();
    setAccountOpen(false);
  };

  const handleMenuLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  };

  return (
    <>
      {/* Top Bar */}
      {topBarEnabled && <div className="hidden border-b border-dark-100 bg-dark text-white lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-sm">
          <div className="flex items-center gap-6">
            <a
              href={`https://wa.me/${siteWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-primary"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>{sitePhone}</span>
            </a>
            <span className="text-dark-600">|</span>
            <a
              href={`mailto:${siteEmail}`}
              className="transition-colors hover:text-primary"
            >
              {siteEmail}
            </a>
          </div>
          <p className="text-dark-300">
            {topBarText}
          </p>
        </div>
      </div>}

      {/* Main Header */}
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          isScrolled
            ? "glass border-b border-dark-100 shadow-premium"
            : "bg-white border-b border-transparent"
        )}
      >
        <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 lg:px-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex min-w-0 shrink-0 items-center gap-2"
            aria-label="Madina Solution Home"
          >
            <BrandMark siteLogo={siteLogo} siteName={siteName} tagline={siteTagline} priority logoClassName="h-9 w-9 sm:h-10 sm:w-10" className="max-w-[180px] sm:max-w-[220px]" />
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="relative hidden flex-1 items-center justify-center lg:flex"
            aria-label="Main navigation"
          >
            <ul className="flex items-center gap-1">
              <li><Link href="/" className="rounded-lg px-3.5 py-2 text-sm font-semibold text-dark-700 hover:bg-dark-50">{t("home")}</Link></li>
              {([
                { key: "services", label: t("services") },
                { key: "products", label: t("products") },
                { key: "explore", label: t("explore") },
              ] as const).map(({ key, label }) => (
                <li key={key} className="relative">
                  <button type="button" className="flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-semibold text-dark-700 hover:bg-dark-50 hover:text-dark" aria-haspopup="true" aria-expanded={activeMenu === key} onClick={() => setActiveMenu(activeMenu === key ? null : key)} onMouseEnter={() => handleMenuEnter(key)} onFocus={() => handleMenuEnter(key)}>
                    {label}<ChevronDown className={cn("h-3.5 w-3.5 transition-transform", activeMenu === key && "rotate-180")} />
                  </button>
                </li>
              ))}
            </ul>

          </nav>

          {activeMenu && (
            <div
              id="main-mega-menu"
              className="absolute inset-x-0 top-full z-50"
              onMouseEnter={() => { if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; } }}
              onMouseLeave={handleMenuLeave}
            >
              <MegaMenu navigation={navigation} activeMenu={activeMenu as "services" | "products" | "explore"} />
            </div>
          )}

          {/* Right Actions */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <LocaleSwitcher />
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={openSearch}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Cart"
              onClick={openCartDrawer}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartState.itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {cartState.itemCount > 9 ? "9+" : cartState.itemCount}
                </span>
              )}
            </Button>

            {user ? (
              <div className="relative hidden lg:block">
                <Button variant="ghost" size="icon" aria-label="Akun Saya" onClick={() => setAccountOpen((open) => !open)}>
                  {user.avatar ? <SiteImage src={user.avatar} alt={user.name} width={32} height={32} className="h-8 w-8 rounded-full object-cover" /> : <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{user.name.charAt(0).toUpperCase()}</div>}
                </Button>
                {accountOpen && (
                  <div className="absolute right-0 top-12 w-64 rounded-2xl border border-dark-100 bg-white p-3 shadow-premium-lg">
                    <div className="flex items-center gap-3 border-b border-dark-100 pb-3">
                      {user.avatar ? <SiteImage src={user.avatar} alt={user.name} width={40} height={40} className="h-10 w-10 rounded-full object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{user.name.charAt(0).toUpperCase()}</div>}
                      <div className="min-w-0"><p className="truncate font-semibold text-dark">{user.name}</p><p className="truncate text-xs text-dark-500">{user.email}</p></div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <Link href="/account" onClick={() => setAccountOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-dark-700 hover:bg-dark-50">Dashboard Akun</Link>
                      <Link href="/account/profile" onClick={() => setAccountOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-dark-700 hover:bg-dark-50">Profil Saya</Link>
                      <Link href="/account/settings" onClick={() => setAccountOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-dark-700 hover:bg-dark-50">Pengaturan</Link>
                      <button type="button" onClick={handleLogout} className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">Keluar</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex"
                asChild
                aria-label="Masuk"
              >
                <Link href="/login">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            )}

            <Button size="sm" className="hidden lg:flex" asChild>
              <Link href="/contact">
                Mulai Pesanan
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>

            {/* Mobile Menu Trigger */}
            <Button
              variant="ghost"
              size="icon"
              className="relative lg:hidden"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-label={isMobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            >
              <Menu className={cn("absolute h-5 w-5 transition-all duration-200", isMobileMenuOpen ? "scale-75 opacity-0" : "scale-100 opacity-100")} />
              <X className={cn("h-5 w-5 transition-all duration-200", isMobileMenuOpen ? "scale-100 opacity-100" : "scale-75 opacity-0")} />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        siteName={siteName}
        siteLogo={siteLogo}
        siteTagline={siteTagline}
        sitePhone={sitePhone}
        siteEmail={siteEmail}
        siteWhatsapp={siteWhatsapp}
        navigation={navigation}
      />
    </>
  );
}
