"use client";

import { useLocale } from "next-intl";
import { localeConfig, type Locale } from "@/lib/i18n";

/**
 * Returns direction-aware utilities based on current locale
 */
export function useDirection() {
  const locale = useLocale() as Locale;
  const config = localeConfig[locale];

  return {
    locale,
    dir: config.dir,
    isRTL: config.dir === "rtl",
    isLTR: config.dir === "ltr",
    font: config.font,

    // Utility: return different values based on direction
    rtl: <T>(rtlValue: T, ltrValue: T): T =>
      config.dir === "rtl" ? rtlValue : ltrValue,

    // Tailwind class helper for direction-aware classes
    // e.g. dirClass("text-right", "text-left") → whichever matches
    dirClass: (rtlClass: string, ltrClass: string): string =>
      config.dir === "rtl" ? rtlClass : ltrClass,
  };
}

/**
 * Returns the opposite locale for language switching
 */
export function useAlternateLocale(): Locale {
  const locale = useLocale() as Locale;
  return locale === "ar" ? "en" : "ar";
}
