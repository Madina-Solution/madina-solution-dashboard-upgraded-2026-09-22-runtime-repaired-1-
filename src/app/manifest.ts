import type { MetadataRoute } from "next";
import { getPublicSiteConfig } from "@/lib/site-config";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let icon = "/icons/madina-512.png";
  try {
    const site = await getPublicSiteConfig();
    if (site.siteIcon) icon = site.siteIcon;
  } catch {
    // Keep the bundled icon when the database is unavailable.
  }

  const isCustomRasterIcon = /\.png(?:\?.*)?$/i.test(icon);
  const cacheBust = isCustomRasterIcon ? "" : "?v=20260922";
  const icon192 = isCustomRasterIcon ? icon : `/icons/madina-192.png${cacheBust}`;
  const icon512 = isCustomRasterIcon ? icon : `/icons/madina-512.png${cacheBust}`;
  return {
    name: "Madina Solution",
    short_name: "Madina",
    description: "Creative Business Platform untuk desain, printing, branding, dan advertising.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#E8590C",
    lang: "id-ID",
    dir: "ltr",
    id: "/",
    icons: [
      { src: icon192, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: icon512, sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };
}
