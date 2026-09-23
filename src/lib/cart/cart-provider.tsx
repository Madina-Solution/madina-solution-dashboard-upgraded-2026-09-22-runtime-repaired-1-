"use client";

import * as React from "react";
import type { CartItem, CartState, AddToCartPayload } from "./types";

const STORAGE_KEY = "madina-cart";

type CartContextType = {
  state: CartState;
  addItem: (payload: AddToCartPayload) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const CartContext = React.createContext<CartContextType | null>(null);

export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function deriveState(items: CartItem[]): CartState {
  return {
    items,
    itemCount: items.length,
    estimatedTotal: items.reduce((sum, item) => sum + item.estimatedSubtotal, 0),
  };
}

function loadFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({ ...item, itemType: item.itemType === "service" ? "service" : "product" }));
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or blocked — silent fail
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Hydrate from localStorage after mount (once)
  const hydrated = React.useRef(false);
  React.useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      setItems(loadFromStorage());
      setIsHydrated(true);
    }
  }, []);

  // Persist to localStorage whenever items change (after hydration)
  React.useEffect(() => {
    if (isHydrated) {
      saveToStorage(items);
    }
  }, [items, isHydrated]);

  const addItem = React.useCallback((payload: AddToCartPayload) => {
    const newItem: CartItem = {
      cartItemId: generateId(),
      itemType: payload.itemType ?? "product",
      serviceId: payload.serviceId,
      productId: payload.productId ?? "",
      productName: payload.productName,
      productSlug: payload.productSlug,
      productThumbnail: payload.productThumbnail,
      selectedOptions: payload.selectedOptions,
      optionsSummary: payload.optionsSummary,
      unit: payload.unit,
      quantity: payload.quantity,
      estimatedUnitPrice: payload.estimatedUnitPrice,
      estimatedSubtotal: payload.estimatedSubtotal,
      notes: payload.notes,
      addedAt: new Date().toISOString(),
    };
    setItems((prev) => [...prev, newItem]);
  }, []);

  const removeItem = React.useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  }, []);

  const updateQuantity = React.useCallback(
    (cartItemId: string, quantity: number) => {
      if (quantity < 1) return;
      setItems((prev) =>
        prev.map((item) =>
          item.cartItemId === cartItemId
            ? {
                ...item,
                quantity,
                estimatedSubtotal: item.estimatedUnitPrice * quantity,
              }
            : item
        )
      );
    },
    []
  );

  const clearCart = React.useCallback(() => {
    setItems([]);
  }, []);

  const openDrawer = React.useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = React.useCallback(() => setIsDrawerOpen(false), []);

  const state = React.useMemo(() => deriveState(items), [items]);

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
