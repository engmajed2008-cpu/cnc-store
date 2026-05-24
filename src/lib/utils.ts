import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Locale } from "@/lib/i18n";

/**
 * Merge Tailwind classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price in SAR with locale-aware number formatting
 */
export function formatPrice(amount: number, locale: Locale): string {
  const formatted = new Intl.NumberFormat(
    locale === "ar" ? "ar-SA" : "en-SA",
    {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }
  ).format(amount);

  return formatted;
}

/**
 * Format date with locale awareness
 */
export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA" : "en-SA",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  ).format(date);
}

/**
 * Generate locale-aware path
 */
export function localePath(path: string, locale: Locale): string {
  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Check if locale is RTL
 */
export function isRTL(locale: Locale): boolean {
  return locale === "ar";
}
