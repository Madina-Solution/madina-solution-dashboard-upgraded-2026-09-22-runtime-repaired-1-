import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPublicNavigation } from "@/lib/get-navigation";
import { routing, type AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

/**
 * Public read-only mirror of the admin-managed Mega Menu / Mobile Nav data.
 * The header itself fetches this server-side via getPublicNavigation() for
 * zero-delay first render; this endpoint exists for any client-side or
 * external consumer that needs the same grouped data over HTTP.
 */
export async function GET() {
  try {
    const localeValue = (await cookies()).get(routing.localeCookie)?.value as AppLocale | undefined;
    const locale = localeValue && routing.locales.includes(localeValue) ? localeValue : routing.defaultLocale;
    const navigation = await getPublicNavigation(locale);
    return NextResponse.json({ success: true, ...navigation });
  } catch (error) {
    console.error("Navigation data error:", error);
    return NextResponse.json({ success: false, services: [], products: [], explore: [] }, { status: 200 });
  }
}
