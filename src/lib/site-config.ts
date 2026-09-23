import { getSiteSettingsMap } from "@/lib/site-content";

function valueOf(map: Record<string, unknown>, key: string): unknown {
  const raw = map[key];
  if (raw && typeof raw === "object" && "value" in raw) return (raw as { value?: unknown }).value;
  return raw;
}
function stringOf(map: Record<string, unknown>, key: string, fallback = "") { const value = valueOf(map, key); return typeof value === "string" ? value : fallback; }
function booleanOf(map: Record<string, unknown>, key: string, fallback = false) { const value = valueOf(map, key); return typeof value === "boolean" ? value : fallback; }

export async function getPublicSiteConfig() {
  const settings = await getSiteSettingsMap();
  return {
    siteName: stringOf(settings, "site_name", "Madina Solution"),
    siteTagline: stringOf(settings, "site_tagline", "Creative Business Platform"),
    siteLogo: stringOf(settings, "site_logo"),
    siteIcon: stringOf(settings, "site_icon"),
    topBarEnabled: booleanOf(settings, "topbar_enabled", true),
    topBarText: stringOf(settings, "topbar_text", "Creative Business Platform untuk kebutuhan bisnis Anda"),
    sitePhone: stringOf(settings, "site_phone", "+62 813-9300-5035"),
    siteEmail: stringOf(settings, "site_email", "Perc.madina@gmail.com"),
    siteWhatsapp: stringOf(settings, "site_whatsapp", "6281393005035"),
    siteAddress: stringOf(settings, "site_address", "Dusun Ngleri, Desa Ngadimulyo, Kecamatan Kedu, Kabupaten Temanggung, Jawa Tengah, Indonesia"),
    siteUrl: stringOf(settings, "site_url", process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://madinasolution.vercel.app")),
    seoTitle: stringOf(settings, "seo_title"),
    seoDescription: stringOf(settings, "seo_description"),
    seoKeywords: stringOf(settings, "seo_keywords"),
    seoOgImage: stringOf(settings, "seo_og_image"),
    seoTwitterHandle: stringOf(settings, "seo_twitter_handle"),
    mapsEmbedUrl: stringOf(settings, "maps_embed_url", "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d247.3671256912222!2d110.1555280331352!3d-7.2551769777527015!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e70795cfc6cf129%3A0xa0254c4ef1fe6d5f!2sJoglo%20Market!5e0!3m2!1sid!2sid"),
    adsEnabled: booleanOf(settings, "adsense_enabled", false),
    adsClient: stringOf(settings, "adsense_client"),
    adsSlots: {
      top: stringOf(settings, "adsense_slot_top"),
      footer: stringOf(settings, "adsense_slot_footer"),
      product: stringOf(settings, "adsense_slot_product"),
      article: stringOf(settings, "adsense_slot_article"),
    },
  };
}
