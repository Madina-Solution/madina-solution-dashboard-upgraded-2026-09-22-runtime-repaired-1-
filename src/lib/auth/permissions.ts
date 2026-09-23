/**
 * Centralized permission matrix for Madina Solution RBAC.
 * Every protected API should use checkPermission() instead of
 * inline role arrays.
 */

export type Permission =
  | "admin.access"
  | "dashboard.view"
  | "products.read" | "products.create" | "products.update" | "products.delete"
  | "categories.read" | "categories.create" | "categories.update" | "categories.delete"
  | "orders.read" | "orders.update" | "orders.assign" | "orders.manage"
  | "customers.read" | "customers.update" | "customers.manage"
  | "design.read" | "design.create" | "design.approve"
  | "production.read" | "production.update"
  | "payments.read" | "payments.confirm" | "payments.refund"
  | "messages.read" | "messages.create" | "messages.manage"
  | "finance.read" | "finance.manage"
  | "coupons.read" | "coupons.create" | "coupons.update" | "coupons.delete"
  | "content.read" | "content.create" | "content.update" | "content.delete"
  | "media.read" | "media.upload" | "media.delete"
  | "users.read" | "users.update" | "users.manage"
  | "settings.read" | "settings.update"
  | "audit.read";

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: [
    "admin.access",
    "dashboard.view", "products.read", "products.create", "products.update", "products.delete",
    "categories.read", "categories.create", "categories.update", "categories.delete",
    "orders.read", "orders.update", "orders.assign", "orders.manage",
    "customers.read", "customers.update", "customers.manage",
    "design.read", "design.create", "design.approve",
    "production.read", "production.update",
    "payments.read", "payments.confirm", "payments.refund",
    "messages.read", "messages.create", "messages.manage",
    "finance.read", "finance.manage",
    "coupons.read", "coupons.create", "coupons.update", "coupons.delete",
    "content.read", "content.create", "content.update", "content.delete",
    "media.read", "media.upload", "media.delete",
    "users.read", "users.update", "users.manage",
    "settings.read", "settings.update", "audit.read",
  ],
  admin: [
    "admin.access",
    "users.manage",
    "dashboard.view", "products.read", "products.create", "products.update", "products.delete",
    "categories.read", "categories.create", "categories.update", "categories.delete",
    "orders.read", "orders.update", "orders.assign", "orders.manage",
    "customers.read", "customers.update", "customers.manage",
    "design.read", "design.create", "design.approve",
    "production.read", "production.update",
    "payments.read", "payments.confirm",
    "messages.read", "messages.create", "messages.manage",
    "finance.read", "finance.manage",
    "coupons.read", "coupons.create", "coupons.update",
    "content.read", "content.create", "content.update", "content.delete",
    "media.read", "media.upload", "media.delete",
    "users.read", "users.update",
    "settings.read", "settings.update", "audit.read",
  ],
  manager: [
    "admin.access",
    "dashboard.view", "products.read", "products.create", "products.update",
    "categories.read", "categories.create", "categories.update",
    "orders.read", "orders.update", "orders.assign",
    "customers.read", "customers.update",
    "coupons.read", "coupons.create", "coupons.update",
    "design.read", "design.create", "design.approve",
    "production.read", "production.update",
    "payments.read", "payments.confirm",
    "messages.read", "messages.create", "messages.manage",
    "content.read", "content.create", "content.update",
    "media.read", "media.upload",
  ],
  staff: [
    "admin.access",
    "dashboard.view", "products.read", "categories.read",
    "orders.read", "orders.update", "customers.read", "customers.update",
    "payments.read",
    "messages.read", "messages.create",
    "content.read", "media.read", "media.upload",
  ],
  designer: ["admin.access", "dashboard.view", "orders.read", "design.read", "design.create", "media.read", "media.upload", "messages.read", "messages.create"],
  production: ["admin.access", "dashboard.view", "orders.read", "production.read", "production.update", "media.read", "media.upload", "messages.read"],
  customer: ["dashboard.view"],
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: string, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
}

/**
 * Check if a role has ANY of the given permissions.
 */
export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a role.
 */
export function getPermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Role hierarchy for escalation prevention.
 * A user can only assign roles with lower or equal rank.
 */
const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 100,
  admin: 90,
  manager: 70,
  staff: 50,
  designer: 40,
  production: 40,
  customer: 10,
};

/**
 * Check if actor can assign target role (prevent escalation).
 */
export function canAssignRole(actorRole: string, targetRole: string): boolean {
  if (actorRole === targetRole) return false;
  if (targetRole === "super_admin") return actorRole === "super_admin";
  const actorRank = ROLE_HIERARCHY[actorRole] ?? 0;
  const targetRank = ROLE_HIERARCHY[targetRole] ?? 0;
  return actorRank > targetRank;
}

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin", admin: "Admin", manager: "Manager", staff: "Staff",
  designer: "Designer", production: "Production", customer: "Pelanggan",
};

export const ROLE_CAPABILITY_GROUPS: Record<string, string[]> = {
  super_admin: ["Platform & settings", "Users & roles", "Commerce", "Content & media", "Payments", "Finance", "Audit"],
  admin: ["Operasional penuh", "Users level bawah", "Commerce", "Messaging", "Content & media", "Payments", "Finance", "Settings", "Audit"],
  manager: ["Commerce", "Customers", "Messaging", "Design & production", "Coupons", "Content & media"],
  staff: ["Orders", "Customers", "Messaging", "Catalog read", "Content read", "Media upload"],
  designer: ["Orders read", "Customer messaging", "Design revisions", "Design media"],
  production: ["Orders read", "Customer messaging", "Production pipeline", "Production media"],
  customer: ["Account", "Cart & checkout", "Orders pribadi"],
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin: "Kontrol penuh platform, role, settings, media dan audit.",
  admin: "Operasional penuh, katalog, order, konten, media, pembayaran dan keuangan; dapat mengelola user di bawah level Admin, tetapi tidak dapat mengambil alih level Super Admin.",
  manager: "Mengelola katalog, order, pelanggan, desain, produksi, kupon dan konten operasional; tidak mengubah role atau pengaturan inti situs.",
  staff: "Operasional harian: melihat/memperbarui order dan pelanggan, melihat katalog/konten, serta upload aset kerja; tanpa akses role/settings.",
  designer: "Workspace desain, membuat revisi, dan mengelola aset desain; tanpa akses finansial, role, atau settings.",
  production: "Pipeline produksi, QC dan aset produksi; tanpa akses finansial, role, atau settings.",
  customer: "Belanja, order dan pengaturan akun pribadi.",
};
