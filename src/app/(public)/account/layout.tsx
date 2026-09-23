"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Heart,
  MapPin,
  UserCircle,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  MessageSquare,
  WalletCards,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { NotificationBell } from "@/components/account/notification-bell";

const NAV_ITEMS = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "Pesanan", icon: Package, exact: false },
  { href: "/account/favorites", label: "Favorit", icon: Heart, exact: false },
  { href: "/account/addresses", label: "Alamat", icon: MapPin, exact: false },
  { href: "/account/notifications", label: "Notifikasi", icon: Bell, exact: false },
  { href: "/account/messages", label: "Pesan", icon: MessageSquare, exact: false },
  { href: "/account/finance", label: "Keuangan", icon: WalletCards, exact: false },
  { href: "/account/profile", label: "Profil", icon: UserCircle, exact: false },
  { href: "/account/settings", label: "Pengaturan", icon: Settings, exact: false },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  const handleLogout = async () => {
    await logout();
    toast({ type: "success", title: "Berhasil keluar" });
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <Skeleton className="h-10 w-60" />
          <div className="mt-8 grid gap-8 lg:grid-cols-4">
            <Skeleton className="h-96" />
            <div className="min-w-0 lg:col-span-3"><Skeleton className="h-96" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="py-8 text-dark lg:py-12 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        {/* Welcome */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-dark lg:text-3xl dark:text-white">
                Halo, {user.name}
              </h1>
              <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1 text-[11px] font-extrabold text-primary dark:border-primary/25 dark:bg-primary/10">
                {ROLE_LABELS[user.role] || user.role}
              </span>
            </div>
            <p className="mt-1 truncate text-dark-500 dark:text-slate-400">{user.email}</p>
          </div>
          <NotificationBell className="shrink-0" />
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <nav
            className="hidden min-w-0 lg:block"
            aria-label="Account navigation"
          >
            <div className="sticky top-24 rounded-2xl border border-dark-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <ul className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-dark-600 hover:bg-dark-50 hover:text-dark dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
                <li className="mt-2 border-t border-dark-100 pt-2 dark:border-slate-800">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </button>
                </li>
              </ul>
            </div>
          </nav>

          {/* Mobile Nav */}
          <div className="relative -mx-4 min-w-0 lg:hidden">
            <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
              {NAV_ITEMS.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-white"
                        : "bg-dark-100 text-dark-600 hover:bg-dark-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
            {/* Fade hint on the right edge so it's visually clear the row scrolls, instead of looking like the last item is cut off */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white to-transparent dark:from-[#020617]" />
          </div>

          {/* Content */}
          <div className="min-w-0 lg:col-span-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
