import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
  boolean,
  decimal,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "admin",
  "manager",
  "staff",
  "designer",
  "production",
  "customer",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "draft",
  "pending",
  "confirmed",
  "design_review",
  "design_approved",
  "production",
  "quality_control",
  "ready",
  "shipping",
  "completed",
  "cancelled",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "partial",
  "paid",
  "refunded",
]);

// Users Table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  firebaseUid: varchar("firebase_uid", { length: 128 }).unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  avatar: text("avatar"),
  role: userRoleEnum("role").default("customer").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("password_reset_tokens_user_id_idx").on(table.userId),
  expiresAtIdx: index("password_reset_tokens_expires_at_idx").on(table.expiresAt),
}));

// Categories Table
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  translations: jsonb("translations").$type<CategoryTranslations>().default({}),
  image: text("image"),
  parentId: uuid("parent_id"),
  order: integer("order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CategoryTranslation = { name?: string; description?: string };
export type CategoryTranslations = { id?: CategoryTranslation; en?: CategoryTranslation };

export type ProductTranslation = {
  name?: string;
  shortDescription?: string;
  description?: string;
  specifications?: Record<string, string>;
};
export type ProductTranslations = { id?: ProductTranslation; en?: ProductTranslation };

export type ServiceTranslation = {
  name?: string;
  shortDescription?: string;
  description?: string;
  features?: string[];
  deliverables?: string[];
};
export type ServiceTranslations = { id?: ServiceTranslation; en?: ServiceTranslation };

export type PortfolioTranslation = {
  title?: string;
  description?: string;
  category?: string;
  client?: string;
  tags?: string[];
};
export type PortfolioTranslations = { id?: PortfolioTranslation; en?: PortfolioTranslation };

export type FaqTranslation = { question?: string; answer?: string; category?: string };
export type FaqTranslations = { id?: FaqTranslation; en?: FaqTranslation };

// Products Table
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").references(() => categories.id),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  shortDescription: text("short_description"),
  description: text("description"),
  thumbnail: text("thumbnail"),
  gallery: jsonb("gallery").$type<string[]>().default([]),
  basePrice: decimal("base_price", { precision: 12, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).default("pcs"),
  minOrder: integer("min_order").default(1),
  specifications: jsonb("specifications").$type<Record<string, string>>().default({}),
  options: jsonb("options").$type<ProductOption[]>().default([]),
  metadata: jsonb("metadata").$type<ProductAdminMetadata>().default({}),
  translations: jsonb("translations").$type<ProductTranslations>().default({}),
  productionDays: integer("production_days").default(3),
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true).notNull(),
  fulfillmentType: varchar("fulfillment_type", { length: 12 }).default("physical").notNull(),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0"),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Product pricing tiers
// Normalized wholesale/B2B pricing rows. ProductAdminMetadata remains the
// backwards-compatible authoring source; these rows power reliable public
// pricing queries and can be indexed independently of the product JSON blob.
export const productPricingTiers = pgTable("product_pricing_tiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  minQuantity: integer("min_quantity").notNull(),
  maxQuantity: integer("max_quantity"),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  label: varchar("label", { length: 120 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  productMinQuantityUnique: uniqueIndex("product_pricing_tiers_product_min_quantity_unique").on(table.productId, table.minQuantity),
}));

// Payment Methods Table
// Admin-managed list of payment channels shown at checkout: manual bank
// transfer accounts (type "bank_transfer") plus the existing automatic
// gateway from src/lib/payment/service.ts, surfaced as one selectable
// "gateway" row so the customer sees every option in one place.
export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { length: 20 }).notNull(), // "bank_transfer" | "gateway"
  name: varchar("name", { length: 120 }).notNull(),
  bankName: varchar("bank_name", { length: 120 }),
  accountNumber: varchar("account_number", { length: 60 }),
  accountHolder: varchar("account_holder", { length: 120 }),
  logo: text("logo"),
  instructions: text("instructions"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Shipping Methods Table
// Admin-managed courier list with a flat rate + estimated delivery window.
// Selected at checkout only when deliveryMethod === "delivery"; cost is
// always re-read from this table server-side, never trusted from the client.
export const shippingMethods = pgTable("shipping_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  courier: varchar("courier", { length: 60 }),
  cost: decimal("cost", { precision: 12, scale: 2 }).default("0").notNull(),
  estimatedDaysMin: integer("estimated_days_min").default(1),
  estimatedDaysMax: integer("estimated_days_max").default(3),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Services Table
export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").references(() => categories.id),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  shortDescription: text("short_description"),
  description: text("description"),
  thumbnail: text("thumbnail"),
  gallery: jsonb("gallery").$type<string[]>().default([]),
  startingPrice: decimal("starting_price", { precision: 12, scale: 2 }),
  features: jsonb("features").$type<string[]>().default([]),
  deliverables: jsonb("deliverables").$type<string[]>().default([]),
  processSteps: jsonb("process_steps").$type<ProcessStep[]>().default([]),
  options: jsonb("options").$type<ProductOption[]>().default([]),
  translations: jsonb("translations").$type<ServiceTranslations>().default({}),
  fulfillmentType: varchar("fulfillment_type", { length: 12 }).default("physical").notNull(),
  estimatedDays: integer("estimated_days").default(7),
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Addresses Table
export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  label: varchar("label", { length: 50 }).default("Rumah"),
  recipientName: varchar("recipient_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  district: varchar("district", { length: 100 }),
  postalCode: varchar("postal_code", { length: 10 }),
  address: text("address").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Orders Table
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  userId: uuid("user_id").references(() => users.id),
  // Guest checkout fields
  guestName: varchar("guest_name", { length: 255 }),
  guestEmail: varchar("guest_email", { length: 255 }),
  guestPhone: varchar("guest_phone", { length: 20 }),
  guestWhatsapp: varchar("guest_whatsapp", { length: 20 }),
  addressId: uuid("address_id").references(() => addresses.id),
  // Inline address for guest checkout
  shippingAddress: jsonb("shipping_address").$type<{
    recipientName: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    district?: string;
    postalCode?: string;
  }>(),
  deliveryMethod: varchar("delivery_method", { length: 20 }).default("delivery"),
  status: orderStatusEnum("status").default("pending").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("unpaid").notNull(),
  paymentMethodId: uuid("payment_method_id").references(() => paymentMethods.id),
  shippingMethodId: uuid("shipping_method_id").references(() => shippingMethods.id),
  paymentProof: text("payment_proof"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 12, scale: 2 }).default("0"),
  shippingCost: decimal("shipping_cost", { precision: 12, scale: 2 }).default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  couponId: uuid("coupon_id"),
  notes: text("notes"),
  adminNotes: text("admin_notes"),
  priority: varchar("priority", { length: 10 }).default("normal"),
  assignedDesigner: uuid("assigned_designer").references(() => users.id),
  assignedProduction: uuid("assigned_production").references(() => users.id),
  estimatedCompletion: timestamp("estimated_completion"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Order Items Table
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  productId: uuid("product_id").references(() => products.id),
  serviceId: uuid("service_id").references(() => services.id),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  configuration: jsonb("configuration").$type<Record<string, unknown>>().default({}),
  designFiles: jsonb("design_files").$type<string[]>().default([]),
  fulfillmentType: varchar("fulfillment_type", { length: 12 }).default("physical").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Order Status History Table
export const orderStatusHistory = pgTable("order_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  status: orderStatusEnum("status").notNull(),
  notes: text("notes"),
  changedBy: uuid("changed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reviews Table
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  productId: uuid("product_id").references(() => products.id),
  serviceId: uuid("service_id").references(() => services.id),
  orderId: uuid("order_id").references(() => orders.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  images: jsonb("images").$type<string[]>().default([]),
  isVerified: boolean("is_verified").default(false),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Favorites Table
export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  productId: uuid("product_id").references(() => products.id),
  serviceId: uuid("service_id").references(() => services.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Coupons Table
export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  discountType: varchar("discount_type", { length: 20 }).notNull(), // 'percentage' | 'fixed'
  discountValue: decimal("discount_value", { precision: 12, scale: 2 }).notNull(),
  minPurchase: decimal("min_purchase", { precision: 12, scale: 2 }),
  maxDiscount: decimal("max_discount", { precision: 12, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Portfolio Table
export const portfolio = pgTable("portfolio", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  client: varchar("client", { length: 255 }),
  thumbnail: text("thumbnail"),
  images: jsonb("images").$type<string[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),
  translations: jsonb("translations").$type<PortfolioTranslations>().default({}),
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Testimonials Table
export const testimonials = pgTable("testimonials", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }),
  company: varchar("company", { length: 255 }),
  avatar: text("avatar"),
  content: text("content").notNull(),
  rating: integer("rating").default(5),
  isVerified: boolean("is_verified").default(false),
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Articles Table
export type ArticleTranslation = {
  title?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  tags?: string[];
  seo?: { title?: string; description?: string; keywords?: string[]; canonicalUrl?: string; ogTitle?: string; ogDescription?: string; twitterTitle?: string; twitterDescription?: string };
};

export type ArticleTranslations = { id?: ArticleTranslation; en?: ArticleTranslation };

export type NavigationTranslation = { name?: string; description?: string | null };
export type NavigationTranslations = { id?: NavigationTranslation; en?: NavigationTranslation };

export type ArticleAdminMetadata = {
  seo?: { title?: string; description?: string; keywords?: string[]; canonicalUrl?: string; noIndex?: boolean; ogImage?: string; ogTitle?: string; ogDescription?: string; twitterTitle?: string; twitterDescription?: string };
  editorial?: { authorName?: string; authorRole?: string; authorBio?: string; authorCredentials?: string; readingTime?: number; featured?: boolean; allowComments?: boolean };
  distribution?: { ctaTitle?: string; ctaText?: string; ctaLabel?: string; ctaHref?: string; newsletter?: boolean };
};

export const articles = pgTable("articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id").references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content"),
  thumbnail: text("thumbnail"),
  category: varchar("category", { length: 100 }),
  tags: jsonb("tags").$type<string[]>().default([]),
  metadata: jsonb("metadata").$type<ArticleAdminMetadata>().default({}),
  translations: jsonb("translations").$type<ArticleTranslations>().default({}),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// FAQs Table
export const faqs = pgTable("faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 100 }),
  translations: jsonb("translations").$type<FaqTranslations>().default({}),
  order: integer("order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Messages Table (for internal tracking - realtime via Firebase)
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  senderId: uuid("sender_id").references(() => users.id).notNull(),
  receiverId: uuid("receiver_id").references(() => users.id).notNull(),
  orderId: uuid("order_id").references(() => orders.id),
  content: text("content").notNull(),
  attachments: jsonb("attachments").$type<string[]>().default([]),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Newsletter Subscribers Table
export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribed_at"),
});

// Audit Logs Table
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }).notNull(),
  resourceId: uuid("resource_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Settings Table
export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: jsonb("value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Types for JSON fields
export type ProductOptionValue = {
  label: string;
  value: string;
  priceModifier?: number;
  description?: string;
};

export type ProductAdminMetadata = {
  sku?: string;
  barcode?: string;
  brand?: string;
  condition?: "new" | "used" | "refurbished";
  stock?: { status?: "in_stock" | "out_of_stock" | "preorder" | "made_to_order"; quantity?: number; lowStock?: number };
  pricing?: { compareAtPrice?: string; costPrice?: string; wholesaleTiers?: { minQuantity: number; maxQuantity?: number; unitPrice: string; label?: string }[] };
  shipping?: { weightGrams?: number; lengthCm?: number; widthCm?: number; heightCm?: number; shippingClass?: string; origin?: string; leadTimeDays?: number; freeShipping?: boolean };
  content?: { highlights?: string[]; tags?: string[]; faq?: { question: string; answer: string }[]; videoUrl?: string; warranty?: string; returnPolicy?: string; relatedProductIds?: string[] };
  seo?: { title?: string; description?: string; keywords?: string[]; canonicalUrl?: string; noIndex?: boolean; ogTitle?: string; ogDescription?: string; ogImage?: string; twitterTitle?: string; twitterDescription?: string };
  schema?: { mpn?: string; gtin?: string };
  marketing?: { badge?: string; promoText?: string; campaign?: string };
  variants?: { enabled?: boolean; attributes?: { name: string; values: { label: string; value: string; priceModifier?: number; sku?: string; stock?: number; image?: string }[] }[] };
  trust?: { sampleAvailable?: boolean; customization?: string; responseTime?: string; certifications?: string[]; protection?: string };
  trade?: { paymentTerms?: string; packaging?: string; inspection?: string; shippingTerms?: string };
};

export type ProductOption = {
  id: string;
  name: string;
  key: string;
  type: "select" | "radio" | "checkbox" | "text" | "textarea" | "number" | "size" | "file";
  required: boolean;
  defaultValue?: string;
  placeholder?: string;
  helpText?: string;
  values?: ProductOptionValue[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  displayOrder?: number;
};

export type ProcessStep = {
  title: string;
  description: string;
  icon?: string;
};

// Design Revisions Table
export const designRevisions = pgTable("design_revisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  orderItemId: uuid("order_item_id").references(() => orderItems.id),
  designerId: uuid("designer_id").references(() => users.id).notNull(),
  revisionNumber: integer("revision_number").notNull().default(1),
  status: varchar("status", { length: 30 }).default("draft").notNull(),
  fileUrl: text("file_url"),
  previewUrl: text("preview_url"),
  notes: text("notes"),
  customerFeedback: text("customer_feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
});

// Notifications Table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  orderId: uuid("order_id").references(() => orders.id),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  channel: varchar("channel", { length: 20 }).default("in_app").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  readAt: timestamp("read_at"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payments Table
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  provider: varchar("provider", { length: 30 }).default("manual").notNull(),
  providerPaymentId: varchar("provider_payment_id", { length: 255 }),
  reference: varchar("reference", { length: 100 }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("IDR").notNull(),
  status: varchar("status", { length: 30 }).default("pending").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  expiresAt: timestamp("expires_at"),
  paidAt: timestamp("paid_at"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payment Events Table (webhook idempotency)
export const paymentEvents = pgTable("payment_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id").references(() => payments.id).notNull(),
  provider: varchar("provider", { length: 30 }).notNull(),
  eventId: varchar("event_id", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
  processed: boolean("processed").default(false).notNull(),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  providerEventUnique: uniqueIndex("payment_events_provider_event_unique").on(table.provider, table.eventId),
}));

// Finance categories
export const financeCategories = pgTable("finance_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  type: varchar("type", { length: 12 }).default("both").notNull(), // income | expense | both
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Finance ledger. Payment confirmations write income rows here; admin can add expense/adjustment rows.
export const financeTransactions = pgTable("finance_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { length: 12 }).notNull(), // income | expense | adjustment
  status: varchar("status", { length: 12 }).default("posted").notNull(), // posted | void
  categoryId: uuid("category_id").references(() => financeCategories.id),
  orderId: uuid("order_id").references(() => orders.id),
  paymentId: uuid("payment_id").references(() => payments.id),
  reference: varchar("reference", { length: 100 }),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("IDR").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  transactionDate: timestamp("transaction_date").defaultNow().notNull(),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  dateIdx: index("finance_transactions_date_idx").on(table.transactionDate),
  typeStatusIdx: index("finance_transactions_type_status_idx").on(table.type, table.status),
  orderIdx: index("finance_transactions_order_idx").on(table.orderId),
  paymentIdx: index("finance_transactions_payment_idx").on(table.paymentId),
}));

// Media Table
export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  orderId: uuid("order_id").references(() => orders.id),
  revisionId: uuid("revision_id").references(() => designRevisions.id),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  size: integer("size").notNull(),
  storageProvider: varchar("storage_provider", { length: 30 }).default("local").notNull(),
  storageKey: text("storage_key").notNull(),
  url: text("url").notNull(),
  purpose: varchar("purpose", { length: 30 }).default("order_asset").notNull(),
  visibility: varchar("visibility", { length: 10 }).default("private").notNull(),
  status: varchar("status", { length: 20 }).default("uploaded").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// Navigation Items Table (admin-managed Mega Menu / Mobile Nav quick links)
export const navigationGroupEnum = pgEnum("navigation_group", ["services", "products", "explore"]);

export const navigationItems = pgTable("navigation_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  group: navigationGroupEnum("group").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  href: varchar("href", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 40 }).notNull().default("sparkles"),
  description: varchar("description", { length: 160 }),
  translations: jsonb("translations").$type<NavigationTranslations>().default({}),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Export type inference
export type NavigationItemRow = typeof navigationItems.$inferSelect;
export type NewNavigationItemRow = typeof navigationItems.$inferInsert;
export type User = typeof users.$inferSelect;
export type DesignRevision = typeof designRevisions.$inferSelect;
export type MediaRecord = typeof media.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type PaymentEvent = typeof paymentEvents.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type ProductPricingTier = typeof productPricingTiers.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Portfolio = typeof portfolio.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type FAQ = typeof faqs.$inferSelect;
