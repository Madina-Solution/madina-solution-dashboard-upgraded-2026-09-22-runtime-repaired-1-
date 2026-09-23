export const routing = {
  locales: ["id", "en"] as const,
  defaultLocale: "id" as const,
  localeCookie: "NEXT_LOCALE",
};

export type AppLocale = (typeof routing.locales)[number];
