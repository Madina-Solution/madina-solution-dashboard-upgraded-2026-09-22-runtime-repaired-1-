"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingBag, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-provider";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "error" }> = {
  pending: { label: "Menunggu Konfirmasi", variant: "warning" },
  confirmed: { label: "Dikonfirmasi", variant: "default" },
  design_review: { label: "Review Desain", variant: "default" },
  design_approved: { label: "Desain Disetujui", variant: "default" },
  production: { label: "Produksi", variant: "warning" },
  quality_control: { label: "Quality Control", variant: "warning" },
  ready: { label: "Siap", variant: "success" },
  shipping: { label: "Dikirim", variant: "default" },
  completed: { label: "Selesai", variant: "success" },
  cancelled: { label: "Dibatalkan", variant: "error" },
};

type OrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  itemCount: number;
  itemNames: string;
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = React.useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    fetch("/api/account/orders")
      .then((r) => r.json())
      .then((data) => setOrders(data.orders || []))
      .finally(() => setIsLoading(false));
  }, [user]);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-dark">Pesanan Saya</h2>
      <p className="mt-1 text-dark-500">Lihat dan lacak semua pesanan Anda</p>

      {orders.length > 0 ? (
        <div className="mt-6 space-y-4">
          {orders.map((order) => {
            const st = STATUS_MAP[order.status] || { label: order.status, variant: "secondary" as const };
            return (
              <Link key={order.id} href={`/account/orders/${order.id}`}>
                <Card className="transition-all hover:shadow-premium">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">{order.orderNumber}</span>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-dark-500 line-clamp-1">{order.itemNames}</p>
                        <p className="mt-1 text-xs text-dark-400">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-dark">{formatCurrency(order.total)}</p>
                          <p className="text-xs text-dark-500">{order.itemCount} item</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-dark-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dark-50">
              <ShoppingBag className="h-8 w-8 text-dark-300" />
            </div>
            <h3 className="mt-4 font-semibold text-dark">Belum Ada Pesanan</h3>
            <p className="mt-1 text-sm text-dark-500">
              Pesanan Anda akan muncul di sini setelah Anda membuat pesanan.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/products">Jelajahi Produk</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
