"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, Loader2, Trash2, ShoppingCart, ImageOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-provider";
import { formatCurrency } from "@/lib/utils";
import { SiteImage } from "@/components/ui/site-image";

type Favorite = { id: string; productId: string | null; productName: string | null; productSlug: string | null; productPrice: string | null; productUnit: string | null; productThumbnail: string | null };

export default function FavoritesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = React.useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    try { const r = await fetch("/api/account/favorites"); const d = await r.json(); if (d.success) setItems(d.favorites); } catch {} finally { setIsLoading(false); }
  }, []);
  React.useEffect(() => {
    void (async () => { await fetchData(); })();
  }, [fetchData]);

  const handleRemove = async (id: string) => {
    const res = await fetch(`/api/account/favorites/${id}`, { method: "DELETE" });
    if ((await res.json()).success) { toast({ type: "success", title: "Dihapus dari favorit" }); fetchData(); }
  };

  if (!user) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-dark">Favorit</h2>
      <p className="mt-1 text-dark-500">Produk yang Anda simpan</p>

      {isLoading ? <div className="mt-6 flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-dark-400" /></div>
      : items.length > 0 ? (
        <div className="mt-6 space-y-4">{items.map((fav) => (
          <Card key={fav.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-dark-50">{fav.productThumbnail ? <SiteImage src={fav.productThumbnail} alt={fav.productName || "Produk"} fill sizes="48px" className="object-cover" /> : <div className="grid h-full place-items-center text-dark-300"><ImageOff className="h-5 w-5" aria-hidden="true" /></div>}</div>
                <div className="min-w-0">
                  <Link href={`/products/${fav.productSlug}`} className="block truncate font-semibold text-dark hover:text-primary">{fav.productName || "Produk"}</Link>
                  {fav.productPrice && <p className="truncate text-sm text-primary">{formatCurrency(Number(fav.productPrice))}/{fav.productUnit || "pcs"}</p>}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" asChild><Link href={`/products/${fav.productSlug}`}><ShoppingCart className="mr-1 h-3.5 w-3.5" />Pesan</Link></Button>
                <Button variant="ghost" size="icon" onClick={() => handleRemove(fav.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}</div>
      ) : (
        <Card className="mt-6"><CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Heart className="h-10 w-10 text-dark-300" /><h3 className="mt-4 font-semibold text-dark">Belum Ada Favorit</h3>
          <p className="mt-1 text-sm text-dark-500">Simpan produk favorit Anda untuk akses cepat.</p>
          <Button className="mt-4" asChild><Link href="/products">Jelajahi Produk</Link></Button>
        </CardContent></Card>
      )}
    </div>
  );
}
