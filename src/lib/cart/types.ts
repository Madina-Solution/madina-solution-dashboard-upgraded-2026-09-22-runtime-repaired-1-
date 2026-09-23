// CartItem represents one configured product in the cart.
// Price fields are CLIENT ESTIMATES only — server must re-validate before order.

export type CartItem = {
  /** Cart item entity type */
  itemType: "product" | "service";
  /** Optional service UUID */
  serviceId?: string;
  /** Unique cart-item id (generated client-side) */
  cartItemId: string;
  /** Product UUID from database */
  productId: string;
  /** Snapshot of product name at time of add */
  productName: string;
  /** Product slug for linking */
  productSlug: string;
  /** Snapshot of product thumbnail */
  productThumbnail: string | null;
  /** Selected options keyed by option key */
  selectedOptions: Record<string, string>;
  /** Human-readable summary of options */
  optionsSummary: string;
  /** Product unit (pcs, m², lembar, box…) */
  unit: string;
  /** Quantity */
  quantity: number;
  /** Client-side estimated unit price (base + modifiers) */
  estimatedUnitPrice: number;
  /** Client-side estimated subtotal (unitPrice × quantity) */
  estimatedSubtotal: number;
  /** Free-text notes */
  notes: string;
  /** ISO timestamp of when added */
  addedAt: string;
};

export type CartState = {
  items: CartItem[];
  /** Number of distinct line items */
  itemCount: number;
  /** Client-side estimated total */
  estimatedTotal: number;
};

// Payload sent from product configuration to add an item
export type AddToCartPayload = {
  itemType?: "product" | "service";
  serviceId?: string;
  productId?: string;
  productName: string;
  productSlug: string;
  productThumbnail: string | null;
  selectedOptions: Record<string, string>;
  optionsSummary: string;
  unit: string;
  quantity: number;
  estimatedUnitPrice: number;
  estimatedSubtotal: number;
  notes: string;
};
