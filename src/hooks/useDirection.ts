"use client";

import { useLocale } from "next-intl";
type Locale = "ar" | "en";
const localeConfig = {
  ar: { dir: "rtl" as const, font: "font-arabic" },
  en: { dir: "ltr" as const, font: "font-english" },
};

export function useDirection() {
  const locale = useLocale() as Locale;
  const config = localeConfig[locale];

  return {
    locale,
    dir: config.dir,
    isRTL: config.dir === "rtl",
    isLTR: config.dir === "ltr",
    font: config.font,
    rtl: <T>(rtlValue: T, ltrValue: T): T =>
      config.dir === "rtl" ? rtlValue : ltrValue,
    dirClass: (rtlClass: string, ltrClass: string): string =>
      config.dir === "rtl" ? rtlClass : ltrClass,
  };
}

export function useAlternateLocale(): Locale {
  const locale = useLocale() as Locale;
  return locale === "ar" ? "en" : "ar";
}
