"use client";

import * as React from "react";
import Link from "next/link";
import { Package, Clock, CheckCircle2, CreditCard, ArrowRight, ShoppingBag, Bell, Loader2, WalletCards } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-provider";
import { formatCurrency } from "@/lib/utils";

type Stats = { totalOrders: number; pendingOrders: number; activeOrders: number; completedOrders: number; unpaidOrders: number; totalSpend: number; unreadNotifications: number };

export default function AccountPage() {
  const { user } = useAuth();
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/account/dashboard").then(r => r.json()).then(d => { if (d.success) setStats(d.stats); }).finally(() => setIsLoading(false));
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><Package className="h-6 w-6" /></div>
              <div><p className="text-sm text-dark-500">Total Pesanan</p><p className="text-2xl font-bold text-dark">{stats?.totalOrders ?? 0}</p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600"><Clock className="h-6 w-6" /></div>
              <div><p className="text-sm text-dark-500">Dalam Proses</p><p className="text-2xl font-bold text-dark">{stats?.activeOrders ?? 0}</p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600"><CheckCircle2 className="h-6 w-6" /></div>
              <div><p className="text-sm text-dark-500">Selesai</p><p className="text-2xl font-bold text-dark">{stats?.completedOrders ?? 0}</p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600"><CreditCard className="h-6 w-6" /></div>
              <div><p className="text-sm text-dark-500">Belum Bayar</p><p className="text-2xl font-bold text-dark">{stats?.unpaidOrders ?? 0}</p></div>
            </CardContent></Card>
          </div>

          {/* Notifications */}
          {(stats?.unreadNotifications ?? 0) > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div className="flex min-w-0 items-center gap-3"><Bell className="h-5 w-5 shrink-0 text-primary" /><span className="truncate font-medium text-dark">{stats!.unreadNotifications} notifikasi belum dibaca</span></div>
                <Button variant="outline" size="sm" className="shrink-0" asChild><Link href="/account/notifications">Lihat <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card><CardContent className="p-6">
            <h2 className="text-lg font-semibold text-dark">Aksi Cepat</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/products" className="flex items-center gap-3 rounded-xl border border-dark-100 p-4 transition-colors hover:border-primary/20 hover:bg-primary/5">
                <ShoppingBag className="h-5 w-5 text-primary" /><span className="font-medium text-dark">Buat Pesanan</span>
              </Link>
              <Link href="/account/orders" className="flex items-center gap-3 rounded-xl border border-dark-100 p-4 transition-colors hover:border-primary/20 hover:bg-primary/5">
                <Package className="h-5 w-5 text-primary" /><span className="font-medium text-dark">Lihat Pesanan</span>
              </Link>
              <Link href="/account/finance" className="flex items-center gap-3 rounded-xl border border-dark-100 p-4 transition-colors hover:border-primary/20 hover:bg-primary/5">
                <WalletCards className="h-5 w-5 text-primary" /><span className="font-medium text-dark">Keuangan</span>
              </Link>
              <Link href="/account/profile" className="flex items-center gap-3 rounded-xl border border-dark-100 p-4 transition-colors hover:border-primary/20 hover:bg-primary/5">
                <CheckCircle2 className="h-5 w-5 text-primary" /><span className="font-medium text-dark">Lengkapi Profil</span>
              </Link>
            </div>
          </CardContent></Card>

          {/* Spending */}
          {(stats?.totalSpend ?? 0) > 0 && (
            <Card><CardContent className="p-6">
              <p className="text-sm text-dark-500">Total Belanja</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(stats!.totalSpend)}</p>
            </CardContent></Card>
          )}
        </>
      )}
    </div>
  );
}
