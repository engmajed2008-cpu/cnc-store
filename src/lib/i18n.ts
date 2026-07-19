import { getRequestConfig } from "next-intl/server";
export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";
export const localeConfig = {
  ar: { label: "العربية", dir: "rtl" as const, font: "font-arabic", flag: "🇸🇦", dateLocale: "ar-SA" },
  en: { label: "English", dir: "ltr" as const, font: "font-english", flag: "🇬🇧", dateLocale: "en-US" },
} as const;
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale as Locale)) { locale = defaultLocale; }
  return {
    locale,
    timeZone: "Asia/Riyadh",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});