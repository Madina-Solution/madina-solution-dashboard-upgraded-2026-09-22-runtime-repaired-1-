"use client";

import { SiteImage } from "@/components/ui/site-image";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ImageOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";

export function CartDrawer() {
  const { state, removeItem, updateQuantity, clearCart, isDrawerOpen, closeDrawer } =
    useCart();

  React.useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  React.useEffect(() => {
    if (!isDrawerOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isDrawerOpen, closeDrawer]);

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeDrawer}
            className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-label="Keranjang belanja"
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-premium-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-dark-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-dark">
                  Keranjang ({state.itemCount})
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-lg p-1.5 text-dark-400 transition-colors hover:bg-dark-100 hover:text-dark"
                aria-label="Tutup keranjang"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items */}
            {state.items.length > 0 ? (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
                  <div className="space-y-4">
                    {state.items.map((item) => (
                      <div
                        key={item.cartItemId}
                        className="rounded-xl border border-dark-100 bg-white p-4"
                      >
                        <div className="flex gap-4">
                          {/* Thumbnail */}
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-dark-50">{item.productThumbnail ? <SiteImage src={item.productThumbnail} alt={item.productName} fill sizes="64px" className="object-cover" /> : <div className="grid h-full place-items-center text-dark-300"><ImageOff className="h-5 w-5" aria-hidden="true" /></div>}</div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/products/${item.productSlug}`}
                              onClick={closeDrawer}
                              className="font-semibold text-dark hover:text-primary"
                            >
                              {item.productName}
                            </Link>
                            {item.optionsSummary && (
                              <p className="mt-0.5 text-xs text-dark-500 line-clamp-2">
                                {item.optionsSummary}
                              </p>
                            )}
                            <p className="mt-1 text-sm font-medium text-primary">
                              {formatCurrency(item.estimatedUnitPrice)}/{item.unit}
                            </p>
                          </div>

                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => removeItem(item.cartItemId)}
                            className="self-start rounded-md p-1 text-dark-400 transition-colors hover:bg-red-50 hover:text-red-500"
                            aria-label={`Hapus ${item.productName}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Quantity + Subtotal */}
                        <div className="mt-3 flex items-center justify-between">
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
                              className="px-2 py-1 text-dark-500 transition-colors hover:bg-dark-50 disabled:opacity-30"
                              aria-label="Kurangi"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-[2.5rem] text-center text-sm font-medium text-dark">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.cartItemId,
                                  item.quantity + 1
                                )
                              }
                              className="px-2 py-1 text-dark-500 transition-colors hover:bg-dark-50"
                              aria-label="Tambah"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-dark">
                            {formatCurrency(item.estimatedSubtotal)}
                          </span>
                        </div>

                        {item.notes && (
                          <p className="mt-2 rounded-md bg-dark-50 px-2 py-1 text-xs text-dark-500">
                            Catatan: {item.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-dark-100 px-6 py-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-dark-600">Estimasi Total</span>
                    <span className="text-lg font-bold text-dark">
                      {formatCurrency(state.estimatedTotal)}
                    </span>
                  </div>
                  <p className="mb-4 text-xs text-dark-400">
                    Harga final akan dihitung ulang saat checkout.
                  </p>
                  <Button className="w-full" size="lg" asChild>
                    <Link href="/cart" onClick={closeDrawer}>
                      Lihat Keranjang
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="mt-2 w-full rounded-lg py-2 text-sm text-dark-500 transition-colors hover:text-red-500"
                  >
                    Kosongkan Keranjang
                  </button>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-dark-50">
                  <ShoppingBag className="h-10 w-10 text-dark-300" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-dark">
                  Keranjang Kosong
                </h3>
                <p className="mt-2 text-center text-sm text-dark-500">
                  Temukan produk untuk kebutuhan bisnis Anda.
                </p>
                <Button className="mt-6" asChild>
                  <Link href="/products" onClick={closeDrawer}>
                    Jelajahi Produk
                  </Link>
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
