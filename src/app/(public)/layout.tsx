import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CookieConsent } from "@/components/consent/cookie-consent";
import { AdSenseScript, AdSenseUnit } from "@/components/ads/adsense";
import { getPublicSiteConfig } from "@/lib/site-config";
import { getLocale, getMessages } from "next-intl/server";
import { getPublicNavigation } from "@/lib/get-navigation";
import { NextIntlClientProvider } from "next-intl";
import type { AppLocale } from "@/i18n/routing";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [config, locale, messages] = await Promise.all([getPublicSiteConfig(), getLocale(), getMessages()]);
  const navigation = await getPublicNavigation(locale as AppLocale);
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Header siteName={config.siteName} siteLogo={config.siteLogo} topBarEnabled={config.topBarEnabled} topBarText={config.topBarText} sitePhone={config.sitePhone} siteEmail={config.siteEmail} siteWhatsapp={config.siteWhatsapp} siteTagline={config.siteTagline} navigation={navigation} />
      {config.adsEnabled && config.adsClient && config.adsSlots.top ? <div className="mx-auto max-w-7xl px-4 pt-4 lg:px-6"><AdSenseUnit client={config.adsClient} slot={config.adsSlots.top} className="mx-auto max-w-4xl" label="Iklan" /></div> : null}
      <main className="min-h-screen">{children}</main>
      {config.adsEnabled && config.adsClient && config.adsSlots.footer ? <div className="mx-auto max-w-7xl px-4 pb-8 lg:px-6"><AdSenseUnit client={config.adsClient} slot={config.adsSlots.footer} className="mx-auto max-w-4xl" label="Iklan" /></div> : null}
      <Footer siteName={config.siteName} siteLogo={config.siteLogo} siteEmail={config.siteEmail} sitePhone={config.sitePhone} siteWhatsapp={config.siteWhatsapp} siteAddress={config.siteAddress} siteTagline={config.siteTagline} />
      <CookieConsent />
      {config.adsEnabled && config.adsClient ? <AdSenseScript client={config.adsClient} enabled={config.adsEnabled} /> : null}
    </NextIntlClientProvider>
  );
}
