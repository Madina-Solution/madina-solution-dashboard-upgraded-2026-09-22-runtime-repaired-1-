import { cache } from "react";
import { db } from "@/db";
import { navigationItems } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import {
  QUICK_NAV_SERVICES,
  QUICK_NAV_PRODUCTS,
  QUICK_NAV_EXPLORE,
  type QuickNavItem,
  type QuickNavIcon,
} from "@/lib/navigation";
import { resolveLocalizedNavigation, resolveLocalizedQuickNavItem } from "@/lib/localized-content";
import type { AppLocale } from "@/i18n/routing";

export type PublicNavigation = {
  services: QuickNavItem[];
  products: QuickNavItem[];
  explore: QuickNavItem[];
};

function staticFallback(locale: AppLocale): PublicNavigation {
  return {
    services: QUICK_NAV_SERVICES.map((item) => resolveLocalizedQuickNavItem(item, locale)),
    products: QUICK_NAV_PRODUCTS.map((item) => resolveLocalizedQuickNavItem(item, locale)),
    explore: QUICK_NAV_EXPLORE.map((item) => resolveLocalizedQuickNavItem(item, locale)),
  };
}

/**
 * Loads the admin-managed Mega Menu / Mobile Nav items from `navigation_items`.
 * Falls back to the static QUICK_NAV_* baseline (src/lib/navigation.ts) when:
 *  - the table is empty (shouldn't normally happen — ensure-db-schema.mjs
 *    seeds it once on first migrate), or
 *  - the query fails, e.g. on an environment where `db:migrate` hasn't run
 *    yet and the table/enum don't exist.
 * This keeps the public site rendering correctly even mid-deploy.
 */
export const getPublicNavigation = cache(async function getPublicNavigation(locale: AppLocale = "id"): Promise<PublicNavigation> {
  try {
    const rows = await db
      .select()
      .from(navigationItems)
      .where(eq(navigationItems.isActive, true))
      .orderBy(asc(navigationItems.group), asc(navigationItems.sortOrder));

    if (rows.length === 0) return staticFallback(locale);

    const toItem = (row: (typeof rows)[number]): QuickNavItem => {
      const localized = resolveLocalizedNavigation(row, locale);
      return { name: localized.name, href: localized.href, icon: localized.icon as QuickNavIcon, description: localized.description };
    };

    return {
      services: rows.filter((r) => r.group === "services").map(toItem),
      products: rows.filter((r) => r.group === "products").map(toItem),
      explore: rows.filter((r) => r.group === "explore").map(toItem),
    };
  } catch {
    return staticFallback(locale);
  }
});

// Re-exported for the /api/navigation route and any other consumer that
// needs a single active group instead of the full grouped payload.
export async function getPublicNavigationGroup(group: "services" | "products" | "explore", locale: AppLocale = "id"): Promise<QuickNavItem[]> {
  try {
    const rows = await db
      .select()
      .from(navigationItems)
      .where(and(eq(navigationItems.isActive, true), eq(navigationItems.group, group)))
      .orderBy(asc(navigationItems.sortOrder));
    if (rows.length === 0) return staticFallback(locale)[group];
    return rows.map((row) => { const localized = resolveLocalizedNavigation(row, locale); return { name: localized.name, href: localized.href, icon: localized.icon as QuickNavIcon, description: localized.description }; });
  } catch {
    return staticFallback(locale)[group];
  }
}
