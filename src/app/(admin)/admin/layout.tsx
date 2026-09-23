import type { Metadata } from "next";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { hasAnyPermission } from "@/lib/auth/permissions";
import { AdminShell } from "./admin-shell";
import { getPublicSiteConfig } from "@/lib/site-config";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !hasAnyPermission(session.role, ["admin.access"])) {
    redirect("/login");
  }
  const getUnreadMessagesCount = async () => {
    try {
      const rows = await db.select({ value: count() }).from(messages).where(eq(messages.isRead, false));
      return rows[0]?.value ?? 0;
    } catch {
      return 0;
    }
  };
  const [site, unreadMessages] = await Promise.all([getPublicSiteConfig(), getUnreadMessagesCount()]);
  return (
    <AdminShell siteName={site.siteName} siteLogo={site.siteLogo} siteTagline={site.siteTagline} unreadMessages={unreadMessages}>
      {children}
    </AdminShell>
  );
}
