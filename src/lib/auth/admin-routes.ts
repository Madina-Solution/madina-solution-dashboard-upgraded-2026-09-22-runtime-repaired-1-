import type { Permission } from "@/lib/auth/permissions";

export type AdminRouteRule = { prefix: string; permission: Permission };

export const ADMIN_ROUTE_RULES: AdminRouteRule[] = [
  { prefix: "/admin", permission: "admin.access" },
  { prefix: "/admin/control-center", permission: "dashboard.view" },
  { prefix: "/admin/finance", permission: "finance.read" },
  { prefix: "/admin/orders", permission: "orders.read" },
  { prefix: "/admin/products", permission: "products.read" },
  { prefix: "/admin/categories", permission: "categories.read" },
  { prefix: "/admin/coupons", permission: "coupons.read" },
  { prefix: "/admin/design", permission: "design.read" },
  { prefix: "/admin/production", permission: "production.read" },
  { prefix: "/admin/customers", permission: "customers.read" },
  { prefix: "/admin/reviews", permission: "content.read" },
  { prefix: "/admin/messages", permission: "messages.read" },
  { prefix: "/admin/notifications", permission: "admin.access" },
  { prefix: "/admin/services", permission: "content.read" },
  { prefix: "/admin/portfolio", permission: "content.read" },
  { prefix: "/admin/articles", permission: "content.read" },
  { prefix: "/admin/testimonials", permission: "content.read" },
  { prefix: "/admin/faqs", permission: "content.read" },
  { prefix: "/admin/navigation", permission: "content.read" },
  { prefix: "/admin/payment-methods", permission: "settings.read" },
  { prefix: "/admin/shipping-methods", permission: "settings.read" },
  { prefix: "/admin/users", permission: "users.read" },
  { prefix: "/admin/media", permission: "media.read" },
  { prefix: "/admin/settings", permission: "settings.read" },
  { prefix: "/admin/audit-logs", permission: "audit.read" },
];

export function getAdminRoutePermission(pathname: string): Permission {
  const match = [...ADMIN_ROUTE_RULES]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`));
  return match?.permission ?? "admin.access";
}
