"use client";

import { SiteImage } from "@/components/ui/site-image";

import * as React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Clock,
  MessageCircle,
  ImageOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { useCart } from "@/lib/cart/cart-provider";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import { BRAND } from "@/lib/constants";

export function CartPageContent() {
  const { state, removeItem, updateQuantity, clearCart } = useCart();
  const { toast } = useToast();

  const handleRemove = (cartItemId: string, name: string) => {
    removeItem(cartItemId);
    toast({
      type: "info",
      title: "Dihapus dari keranjang",
      description: name,
    });
  };

  return (
    <div className="py-8 lg:py-12">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <Breadcrumb
          items={[
            { label: "Beranda", href: "/" },
            { label: "Keranjang" },
          ]}
          className="mb-6"
        />

        <h1 className="text-3xl font-bold text-dark">Keranjang Belanja</h1>

        {state.items.length > 0 ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="space-y-4 lg:col-span-2">
              {state.items.map((item) => (
                <Card key={item.cartItemId}>
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-dark-50 sm:h-24 sm:w-24">{item.productThumbnail ? <SiteImage src={item.productThumbnail} alt={item.productName} fill sizes="96px" className="object-cover" /> : <div className="grid h-full place-items-center text-dark-300"><ImageOff className="h-5 w-5" aria-hidden="true" /></div>}</div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              href={item.itemType === "service" ? `/services/${item.productSlug}` : `/products/${item.productSlug}`}
                              className="font-semibold text-dark hover:text-primary"
                            >
                              {item.productName}
                            </Link>
                            {item.optionsSummary && (
                              <p className="mt-1 text-sm text-dark-500">
                                {item.optionsSummary}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemove(item.cartItemId, item.productName)
                            }
                            className="shrink-0 rounded-lg p-1.5 text-dark-400 transition-colors hover:bg-red-50 hover:text-red-500"
                            aria-label={`Hapus ${item.productName}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {item.notes && (
                          <p className="mt-2 rounded-md bg-dark-50 px-3 py-1.5 text-xs text-dark-500">
                            Catatan: {item.notes}
                          </p>
                        )}

                        {/* Quantity + Price */}
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center rounded-lg border border-dark-200">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.cartItemId,
                                  item.quantity - 1
                                )
                              }
                              disabled={item.quantity <= 1}
                              className="px-3 py-1.5 text-dark-500 transition-colors hover:bg-dark-50 disabled:opacity-30"
                              aria-label="Kurangi"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="min-w-[3rem] text-center text-sm font-semibold text-dark">
                              {item.quantity} {item.unit}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.cartItemId,
                                  item.quantity + 1
                                )
                              }
                              className="px-3 py-1.5 text-dark-500 transition-colors hover:bg-dark-50"
                              aria-label="Tambah"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-dark-500">
                              {formatCurrency(item.estimatedUnitPrice)}/{item.unit}
                            </p>
                            <p className="text-lg font-bold text-dark">
                              {formatCurrency(item.estimatedSubtotal)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Cart Actions */}
              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" asChild>
                  <Link href="/products">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Lanjut Belanja
                  </Link>
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    clearCart();
                    toast({
                      type: "info",
                      title: "Keranjang dikosongkan",
                    });
                  }}
                  className="text-sm text-dark-500 transition-colors hover:text-red-500"
                >
                  Kosongkan Keranjang
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-dark">
                    Ringkasan Pesanan
                  </h2>

                  <div className="mt-4 space-y-3 border-b border-dark-100 pb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-600">
                        Subtotal ({state.itemCount} item)
                      </span>
                      <span className="font-medium text-dark">
                        {formatCurrency(state.estimatedTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-600">Ongkos kirim</span>
                      <span className="text-dark-500">Dihitung saat checkout</span>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between">
                    <span className="font-semibold text-dark">Estimasi Total</span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(state.estimatedTotal)}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-dark-400">
                    Harga final akan dihitung ulang oleh server saat checkout.
                  </p>

                  <Button className="mt-6 w-full" size="lg" asChild>
                    <Link href="/checkout">
                      Lanjut ke Checkout
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    variant="secondary"
                    className="mt-3 w-full"
                    size="lg"
                    asChild
                  >
                    <a
                      href={`https://wa.me/${BRAND.whatsapp}?text=Halo%20Madina%20Solution%2C%20saya%20ingin%20melanjutkan%20pesanan%20dari%20website.`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Pesan via WhatsApp
                    </a>
                  </Button>

                  {/* Trust */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-dark-500">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-green-600" />
                      Garansi kualitas cetak
                    </div>
                    <div className="flex items-center gap-3 text-sm text-dark-500">
                      <Truck className="h-4 w-4 shrink-0 text-blue-600" />
                      Pengiriman seluruh Indonesia
                    </div>
                    <div className="flex items-center gap-3 text-sm text-dark-500">
                      <Clock className="h-4 w-4 shrink-0 text-orange-600" />
                      Respons cepat 24 jam
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="mt-16 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-dark-50">
              <ShoppingBag className="h-12 w-12 text-dark-300" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-dark">
              Keranjang Kosong
            </h2>
            <p className="mx-auto mt-2 max-w-md text-dark-500">
              Belum ada produk di keranjang Anda. Temukan layanan dan produk
              untuk kebutuhan bisnis Anda.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/products">
                  Jelajahi Produk
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/services">Lihat Layanan</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
