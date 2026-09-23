"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  WalletCards,
  CircleGauge,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Palette,
  Image,
  Star,
  MessageSquare,
  Ticket,
  Settings,
  FileText,
  Shield,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  HelpCircle,
  Briefcase,
  LayoutGrid,
  Landmark,
  Truck,
  Quote,
  Sun,
  Moon,
  ExternalLink,
  Command,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandMark } from "@/components/layout/brand-mark";
import { SiteImage } from "@/components/ui/site-image";
import { hasPermission } from "@/lib/auth/permissions";
import { getAdminRoutePermission } from "@/lib/auth/admin-routes";
import { NotificationBell } from "@/components/account/notification-bell";

const DASHBOARD_ITEM = { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true };
const CONTROL_CENTER_ITEM = { href: "/admin/control-center", label: "Control Center", icon: CircleGauge, exact: false };

const NAV_GROUPS = [
  {
    label: "Commerce",
    items: [
      { href: "/admin/orders", label: "Pesanan", icon: ShoppingCart, exact: false },
      { href: "/admin/finance", label: "Keuangan", icon: WalletCards, exact: false },
      { href: "/admin/products", label: "Produk", icon: Package, exact: false },
      { href: "/admin/categories", label: "Kategori", icon: FolderTree, exact: false },
      { href: "/admin/coupons", label: "Kupon", icon: Ticket, exact: false },
      { href: "/admin/payment-methods", label: "Metode Pembayaran", icon: Landmark, exact: false },
      { href: "/admin/shipping-methods", label: "Metode Pengiriman", icon: Truck, exact: false },
    ],
  },
  {
    label: "Operasional",
    items: [
      { href: "/admin/design", label: "Desain", icon: Palette, exact: false },
      { href: "/admin/production", label: "Produksi", icon: Settings, exact: false },
    ],
  },
  {
    label: "Pelanggan",
    items: [
      { href: "/admin/customers", label: "Pelanggan", icon: Users, exact: false },
      { href: "/admin/reviews", label: "Ulasan", icon: Star, exact: false },
      { href: "/admin/messages", label: "Pesan", icon: MessageSquare, exact: false },
    ],
  },
  {
    label: "Konten",
    items: [
      { href: "/admin/services", label: "Layanan", icon: Briefcase, exact: false },
      { href: "/admin/portfolio", label: "Portfolio", icon: Image, exact: false },
      { href: "/admin/articles", label: "Artikel", icon: FileText, exact: false },
      { href: "/admin/testimonials", label: "Testimoni", icon: Quote, exact: false },
      { href: "/admin/faqs", label: "FAQ", icon: HelpCircle, exact: false },
      { href: "/admin/navigation", label: "Mega Menu", icon: LayoutGrid, exact: false },
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/admin/users", label: "Users & Roles", icon: Users, exact: false },
      { href: "/admin/media", label: "Media", icon: Image, exact: false },
      { href: "/admin/settings", label: "Pengaturan", icon: Settings, exact: false },
      { href: "/admin/audit-logs", label: "Audit Log", icon: Shield, exact: false },
    ],
  },
];

const ADMIN_ROLES = ["super_admin", "admin", "manager", "staff", "designer", "production"];

type ThemeMode = "light" | "dark";

type AdminShellProps = {
  children: React.ReactNode;
  siteName: string;
  siteLogo?: string;
  siteTagline?: string;
  unreadMessages?: number;
};

export function AdminShell({ children, siteName, siteLogo = "", siteTagline = "Creative Business Platform", unreadMessages = 0 }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [theme, setTheme] = React.useState<ThemeMode>("light");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!isLoading && (!user || !ADMIN_ROLES.includes(user.role))) router.push("/login");
  }, [isLoading, user, router]);

  React.useEffect(() => {
    // One-time, hydration-safe read of client-only storage on mount.
    // Cannot be replaced by a lazy useState initializer: localStorage does
    // not exist during server render, so reading it there would either
    // crash or produce a server/client markup mismatch.
    const stored = window.localStorage.getItem("madina-admin-theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above: intentional one-time client-only init, not a render-cascade
    setTheme(stored === "dark" ? "dark" : "light");
    setCollapsed(window.localStorage.getItem("madina-admin-sidebar") === "collapsed");
  }, []);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("madina-admin-theme", theme);
  }, [theme]);

  React.useEffect(() => () => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "";
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem("madina-admin-sidebar", collapsed ? "collapsed" : "expanded");
  }, [collapsed]);

  React.useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        requestAnimationFrame(() => searchRef.current?.focus());
      }
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-dark-50"><Skeleton className="h-12 w-48" /></div>;
  }

  if (!user || !ADMIN_ROLES.includes(user.role)) return null;

  const canSee = (href: string) => hasPermission(user.role, getAdminRoutePermission(href));
  const canAccessCurrentRoute = hasPermission(user.role, getAdminRoutePermission(pathname));

  const handleLogout = async () => {
    await logout();
    toast({ type: "success", title: "Berhasil keluar" });
    router.push("/login");
  };

  const toggleTheme = () => setTheme((current) => current === "light" ? "dark" : "light");

  return (
    <div className={cn("admin-ui flex min-h-screen bg-[#f5f7fb] text-dark-900 transition-colors dark:bg-[#0b1020] dark:text-white", theme === "dark" && "admin-dark")}>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-dark/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-dark-100/80 bg-white/95 shadow-[12px_0_40px_rgba(15,23,42,0.04)] backdrop-blur-xl transition-[width,transform] duration-200 dark:border-slate-800 dark:bg-slate-950/95 lg:z-40",
          collapsed ? "lg:w-[82px]" : "lg:w-[268px]",
          sidebarOpen ? "w-[286px] translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-[76px] items-center border-b border-dark-100/80 px-3 dark:border-slate-800">
          {collapsed ? (
            <button type="button" onClick={() => setCollapsed(false)} className="group relative mx-auto flex h-11 w-11 items-center justify-center rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950" aria-label="Buka sidebar" title="Buka sidebar">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl transition-opacity duration-150 group-hover:opacity-0 group-focus:opacity-0">
                <BrandMark siteLogo={siteLogo} siteName={siteName} tagline={siteTagline} showText={false} compact priority logoClassName="h-10 w-10" />
              </span>
              <span aria-hidden="true" className="absolute inset-0 flex h-11 w-11 items-center justify-center rounded-2xl text-dark-500 opacity-0 transition-all duration-150 group-hover:opacity-100 group-focus:opacity-100 group-hover:bg-dark-100 group-hover:text-dark-900 dark:text-slate-400 dark:group-hover:bg-slate-900 dark:group-hover:text-white">
                <PanelLeftOpen className="h-[18px] w-[18px]" />
              </span>
            </button>
          ) : (
            <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
              <Link href="/admin" className="min-w-0 flex-1" aria-label={siteName}>
                <BrandMark siteLogo={siteLogo} siteName={siteName} tagline={siteTagline} priority />
              </Link>
              <button type="button" onClick={() => setCollapsed(true)} className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-dark-400 transition hover:bg-dark-100 hover:text-dark-700 dark:text-slate-500 dark:hover:bg-slate-900 dark:hover:text-slate-200 lg:flex" aria-label="Ciutkan sidebar" title="Ciutkan sidebar">
                <PanelLeftClose className="h-[18px] w-[18px]" />
              </button>
            </div>
          )}
          <button type="button" onClick={() => setSidebarOpen(false)} className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-dark-400 hover:bg-dark-100 dark:text-slate-500 dark:hover:bg-slate-900 lg:hidden" aria-label="Tutup menu admin"><X className="h-5 w-5" /></button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-4 scrollbar-hide" aria-label="Admin navigation">
          <ul className="mb-5 space-y-1">
            <li>
              <Link
                href={DASHBOARD_ITEM.href}
                onClick={() => setSidebarOpen(false)}
                title={collapsed ? DASHBOARD_ITEM.label : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold transition-colors",
                  pathname === DASHBOARD_ITEM.href
                    ? "bg-primary/[0.10] text-primary ring-1 ring-primary/10 dark:bg-primary/15"
                    : "text-dark-600 hover:bg-dark-50 hover:text-dark-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
                  collapsed && "justify-center px-2"
                )}
              >
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", pathname === DASHBOARD_ITEM.href ? "bg-white text-primary shadow-sm ring-1 ring-primary/10 dark:bg-slate-900" : "bg-transparent group-hover:bg-white dark:group-hover:bg-slate-800")}>
                  <DASHBOARD_ITEM.icon className="h-[17px] w-[17px]" />
                </span>
                {!collapsed && <span className="min-w-0 flex-1 truncate">{DASHBOARD_ITEM.label}</span>}
                {!collapsed && pathname === DASHBOARD_ITEM.href && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
              </Link>
            </li>
            {canSee(CONTROL_CENTER_ITEM.href) && (
              <li>
                <Link
                  href={CONTROL_CENTER_ITEM.href}
                  onClick={() => setSidebarOpen(false)}
                  title={collapsed ? CONTROL_CENTER_ITEM.label : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold transition-colors",
                    pathname.startsWith(CONTROL_CENTER_ITEM.href)
                      ? "bg-primary/[0.10] text-primary ring-1 ring-primary/10 dark:bg-primary/15"
                      : "text-dark-600 hover:bg-dark-50 hover:text-dark-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", pathname.startsWith(CONTROL_CENTER_ITEM.href) ? "bg-white text-primary shadow-sm ring-1 ring-primary/10 dark:bg-slate-900" : "bg-transparent group-hover:bg-white dark:group-hover:bg-slate-800")}>
                    <CONTROL_CENTER_ITEM.icon className="h-[17px] w-[17px]" />
                  </span>
                  {!collapsed && <span className="min-w-0 flex-1 truncate">{CONTROL_CENTER_ITEM.label}</span>}
                  {!collapsed && pathname.startsWith(CONTROL_CENTER_ITEM.href) && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                </Link>
              </li>
            )}
          </ul>
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => canSee(item.href));
            if (!visibleItems.length) return null;
            return (
              <div key={group.label} className="mb-5">
                {!collapsed && <p className="mb-2 px-2.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-dark-400">{group.label}</p>}
                <ul className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          title={collapsed ? item.label : undefined}
                          className={cn(
                            "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold transition-colors",
                            isActive
                              ? "bg-primary/[0.10] text-primary ring-1 ring-primary/10 dark:bg-primary/15"
                              : "text-dark-600 hover:bg-dark-50 hover:text-dark-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
                            collapsed && "justify-center px-2"
                          )}
                        >
                          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", isActive ? "bg-white text-primary shadow-sm ring-1 ring-primary/10 dark:bg-slate-900" : "bg-transparent group-hover:bg-white dark:group-hover:bg-slate-800")}>
                            <Icon className="h-[17px] w-[17px]" />
                          </span>
                          {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                          {!collapsed && isActive && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-dark-100/80 p-3 dark:border-slate-800">
          {collapsed ? (
            <Link href="/admin/settings" title="Tingkatkan Bisnis Anda" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-white shadow-sm">
              <Star className="h-[18px] w-[18px]" />
            </Link>
          ) : (
            <Link href="/admin/settings" className="group relative block overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-light p-4 text-white shadow-[0_10px_24px_rgba(196,77,10,0.25)] transition-transform hover:-translate-y-0.5">
              <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15"><Star className="h-4 w-4" /></div>
                <div className="min-w-0">
                  <p className="text-[13px] font-extrabold leading-tight">Tingkatkan Bisnis Anda</p>
                  <p className="mt-1 text-[11px] leading-snug text-white/80">Kelola profil, SEO & performa toko untuk hasil maksimal.</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </aside>

      <div className={cn("min-h-screen min-w-0 flex-1 overflow-x-hidden", collapsed ? "lg:pl-[82px]" : "lg:pl-[268px]")}>
        <header className={cn("fixed inset-x-0 top-0 z-30 flex h-[76px] items-center gap-3 border-b border-dark-100/80 bg-white/90 px-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 sm:px-6", collapsed ? "lg:pl-[106px]" : "lg:pl-[292px]")}> 
          <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-xl p-2 text-dark-500 hover:bg-dark-100 lg:hidden" aria-label="Buka menu admin"><Menu className="h-5 w-5" /></button>
          <div className={cn("hidden min-w-0 md:flex md:flex-1", searchOpen ? "max-w-none" : "max-w-[560px]")}> 
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-400" />
              <input
                ref={searchRef}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
                className="h-11 w-full rounded-2xl border border-dark-100 bg-dark-50/70 pl-11 pr-14 text-sm font-medium text-dark-800 outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-950"
                placeholder="Cari produk, pesanan, pelanggan…"
                aria-label="Cari produk, pesanan, pelanggan"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 flex h-7 -translate-y-1/2 items-center gap-1 rounded-lg border border-dark-100 bg-white px-2 text-[10px] font-bold text-dark-400 dark:border-slate-700 dark:bg-slate-900"><Command className="h-3 w-3" /> K</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <Link href="/" target="_blank" className="hidden items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-dark-600 hover:bg-dark-50 hover:text-primary dark:text-slate-300 dark:hover:bg-slate-900 sm:inline-flex"><ExternalLink className="h-4 w-4" /> Lihat Website</Link>
            <Link href="/admin/messages" className="relative flex h-10 w-10 items-center justify-center rounded-xl text-dark-500 hover:bg-dark-50 dark:text-slate-300 dark:hover:bg-slate-900" aria-label={unreadMessages > 0 ? `Pesan masuk, ${unreadMessages} belum dibaca` : "Pesan masuk"}>
              <MessageSquare className="h-[18px] w-[18px]" />
              {unreadMessages > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950" />}
            </Link>
            <NotificationBell href="/admin/notifications" className="text-dark-500 hover:bg-dark-50 dark:text-slate-300 dark:hover:bg-slate-900" />
            <button type="button" onClick={toggleTheme} className="flex h-10 w-10 items-center justify-center rounded-xl text-dark-500 hover:bg-dark-50 dark:text-slate-300 dark:hover:bg-slate-900" aria-label={theme === "light" ? "Aktifkan dark mode" : "Aktifkan light mode"}>{theme === "light" ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}</button>
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((open) => !open)}
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2.5 rounded-2xl border border-dark-100 bg-white px-2.5 py-1.5 shadow-sm transition hover:border-primary/20 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                {user.avatar ? <SiteImage src={user.avatar} alt={user.name} width={34} height={34} className="h-[34px] w-[34px] rounded-xl object-cover" /> : <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-primary/10 font-extrabold text-primary">{user.name.charAt(0).toUpperCase()}</div>}
                <div className="min-w-0 text-left"><p className="max-w-28 truncate text-xs font-bold text-dark-900 dark:text-white">{user.name}</p><p className="max-w-28 truncate text-[10px] font-semibold capitalize text-dark-400">{user.role.replaceAll("_", " ")}</p></div>
                <ChevronDown className={cn("hidden h-4 w-4 text-dark-300 transition-transform lg:block", profileMenuOpen && "rotate-180")} />
              </button>
              {profileMenuOpen && (
                <div role="menu" className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 overflow-hidden rounded-2xl border border-dark-100 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-950">
                  <div className="border-b border-dark-100 px-3 pb-3 dark:border-slate-800"><p className="truncate text-sm font-bold text-dark-900 dark:text-white">{user.name}</p><p className="mt-0.5 truncate text-xs text-dark-500">{user.email}</p></div>
                  <div className="pt-2">
                    <Link href="/admin/control-center" onClick={() => setProfileMenuOpen(false)} role="menuitem" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-dark-700 hover:bg-dark-50 dark:text-slate-200 dark:hover:bg-slate-900"><CircleGauge className="h-4 w-4 text-primary" /> Control Center</Link>
                    <Link href="/account/profile" onClick={() => setProfileMenuOpen(false)} role="menuitem" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-dark-700 hover:bg-dark-50 dark:text-slate-200 dark:hover:bg-slate-900"><Users className="h-4 w-4 text-dark-400" /> Profil Akun</Link>
                    <Link href="/admin/settings" onClick={() => setProfileMenuOpen(false)} role="menuitem" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-dark-700 hover:bg-dark-50 dark:text-slate-200 dark:hover:bg-slate-900"><Settings className="h-4 w-4 text-dark-400" /> Pengaturan Platform</Link>
                  </div>
                </div>
              )}
            </div>
            <button type="button" onClick={() => void handleLogout()} className="flex h-10 w-10 items-center justify-center rounded-xl text-dark-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30" aria-label="Keluar"><LogOut className="h-[18px] w-[18px]" /></button>
          </div>
        </header>

        <main className="min-h-screen overflow-x-hidden px-3 pb-10 pt-[92px] sm:px-5 lg:px-7">
          {canAccessCurrentRoute ? children : (
            <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
              <div className="rounded-3xl border border-dark-100 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <Shield className="mx-auto h-10 w-10 text-primary" />
                <h1 className="mt-4 text-xl font-bold text-dark dark:text-white">Akses Terbatas</h1>
                <p className="mt-2 text-sm leading-6 text-dark-500 dark:text-slate-400">Role <strong>{user.role}</strong> tidak memiliki izin untuk halaman ini.</p>
                <Link href="/admin" className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">Kembali ke Dashboard</Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
