import type { Locale } from "@/lib/i18n";

export interface Product {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  category: ProductCategory;
  images: string[];
  inStock: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  tags: string[];
}

export type ProductCategory = "signs" | "decor" | "cnc" | "custom";

export interface PortfolioItem {
  id: string;
  titleAr: string;
  titleEn: string;
  clientAr: string;
  clientEn: string;
  category: ProductCategory;
  year: number;
  images: string[];
  tags: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface LocalizedText {
  ar: string;
  en: string;
}

// Helper to get localized text
export function getLocalizedText(text: LocalizedText, locale: Locale): string {
  return text[locale];
}
