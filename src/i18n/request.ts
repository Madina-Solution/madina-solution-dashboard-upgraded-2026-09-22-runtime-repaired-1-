import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { routing, type AppLocale } from "./routing";
import idMessages from "../../messages/id.json";
import enMessages from "../../messages/en.json";

const messages = { id: idMessages, en: enMessages } as const;

function isLocale(value: string | undefined): value is AppLocale {
  return !!value && routing.locales.includes(value as AppLocale);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const cookieLocale = (await cookies()).get(routing.localeCookie)?.value;
  const locale = isLocale(requested) ? requested : isLocale(cookieLocale) ? cookieLocale : routing.defaultLocale;
  return { locale, messages: messages[locale] };
});
