/**
 * src/lib/db/pricingCache.ts
 *
 * Two-layer caching for pricing data:
 *  1. In-process memory (instant, resets on deploy)
 *  2. Next.js unstable_cache (survives hot-reload, tagged for on-demand revalidation)
 *
 * Admin panel calls revalidateTag("pricing") after every price update.
 */

import { unstable_cache } from "next/cache";
import prisma from "./prisma";

// ─────────────────────────────────────────────────────────────
// Types (mirror Prisma schema, but serializable)
// ─────────────────────────────────────────────────────────────
export interface DbMaterial {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  color: string;
  basePricePerCm2: number;   // converted from Decimal
  cuttingMultiplier: number;
  minOrderSAR: number;
  thicknessOptionsMm: number[];
  allowedFinishes: string[];
  isActive: boolean;
  thicknessTiers: DbThicknessTier[];
}

export interface DbThicknessTier {
  minMm: number;
  maxMm: number;
  multiplier: number;
}

export interface DbFinishRate {
  finish: string;
  nameAr: string;
  nameEn: string;
  pricePerCm2: number;
}

export interface DbUrgencyRate {
  urgency: string;
  nameAr: string;
  nameEn: string;
  multiplier: number;
  leadTimeDays: string;
}

export interface DbSiteSettings {
  vatRate: number;
  usdRate: number;
  freeShippingThreshold: number;
  standardShippingFee: number;
  bulkDiscount5PctQty: number;
  bulkDiscount10PctQty: number;
}

export interface PricingConfig {
  materials: DbMaterial[];
  finishRates: DbFinishRate[];
  urgencyRates: DbUrgencyRate[];
  settings: DbSiteSettings;
}

// ─────────────────────────────────────────────────────────────
// Fetchers (raw DB queries, not cached)
// ─────────────────────────────────────────────────────────────
async function fetchMaterials(): Promise<DbMaterial[]> {
  const rows = await prisma.material.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      thicknessTiers: { orderBy: { minMm: "asc" } },
    },
  });

  return rows.map((m) => ({
    id: m.id,
    slug: m.slug,
    nameAr: m.nameAr,
    nameEn: m.nameEn,
    icon: m.icon,
    color: m.color,
    basePricePerCm2:   Number(m.basePricePerCm2),
    cuttingMultiplier: Number(m.cuttingMultiplier),
    minOrderSAR:       Number(m.minOrderSAR),
    thicknessOptionsMm: m.thicknessOptionsMm,
    allowedFinishes:   m.allowedFinishes,
    isActive:          m.isActive,
    thicknessTiers:    m.thicknessTiers.map((t) => ({
      minMm:      t.minMm,
      maxMm:      t.maxMm,
      multiplier: Number(t.multiplier),
    })),
  }));
}

async function fetchFinishRates(): Promise<DbFinishRate[]> {
  const rows = await prisma.finishRate.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((r) => ({
    finish:       r.finish,
    nameAr:       r.nameAr,
    nameEn:       r.nameEn,
    pricePerCm2:  Number(r.pricePerCm2),
  }));
}

async function fetchUrgencyRates(): Promise<DbUrgencyRate[]> {
  const rows = await prisma.urgencyRate.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((r) => ({
    urgency:      r.urgency,
    nameAr:       r.nameAr,
    nameEn:       r.nameEn,
    multiplier:   Number(r.multiplier),
    leadTimeDays: r.leadTimeDays,
  }));
}

async function fetchSiteSettings(): Promise<DbSiteSettings> {
  const rows = await prisma.siteSetting.findMany({
    where: {
      key: {
        in: [
          "vat_rate", "usd_rate", "free_shipping_threshold",
          "standard_shipping_fee", "bulk_discount_5_pct_qty",
          "bulk_discount_10_pct_qty",
        ],
      },
    },
  });

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    vatRate:                Number(map.vat_rate                ?? "0.15"),
    usdRate:                Number(map.usd_rate                ?? "3.75"),
    freeShippingThreshold:  Number(map.free_shipping_threshold  ?? "500"),
    standardShippingFee:    Number(map.standard_shipping_fee    ?? "45"),
    bulkDiscount5PctQty:    Number(map.bulk_discount_5_pct_qty  ?? "5"),
    bulkDiscount10PctQty:   Number(map.bulk_discount_10_pct_qty ?? "20"),
  };
}

// ─────────────────────────────────────────────────────────────
// Cached fetchers — revalidated on admin price updates
// ─────────────────────────────────────────────────────────────
const CACHE_TAG = "pricing";
const REVALIDATE_SECONDS = 3600; // 1 hour fallback

export const getCachedMaterials = unstable_cache(
  fetchMaterials,
  ["materials"],
  { tags: [CACHE_TAG, "materials"], revalidate: REVALIDATE_SECONDS }
);

export const getCachedFinishRates = unstable_cache(
  fetchFinishRates,
  ["finish-rates"],
  { tags: [CACHE_TAG, "finish-rates"], revalidate: REVALIDATE_SECONDS }
);

export const getCachedUrgencyRates = unstable_cache(
  fetchUrgencyRates,
  ["urgency-rates"],
  { tags: [CACHE_TAG, "urgency-rates"], revalidate: REVALIDATE_SECONDS }
);

export const getCachedSiteSettings = unstable_cache(
  fetchSiteSettings,
  ["site-settings"],
  { tags: [CACHE_TAG, "site-settings"], revalidate: REVALIDATE_SECONDS }
);

/** Load everything at once — used by the price calculator API */
export async function getFullPricingConfig(): Promise<PricingConfig> {
  const [materials, finishRates, urgencyRates, settings] = await Promise.all([
    getCachedMaterials(),
    getCachedFinishRates(),
    getCachedUrgencyRates(),
    getCachedSiteSettings(),
  ]);
  return { materials, finishRates, urgencyRates, settings };
}

/** Build a material lookup map by slug */
export function buildMaterialMap(
  materials: DbMaterial[]
): Record<string, DbMaterial> {
  return Object.fromEntries(materials.map((m) => [m.slug, m]));
}

/** Find the correct thickness multiplier for a material */
export function getThicknessMultiplier(
  material: DbMaterial,
  thicknessMm: number
): number {
  const tier = material.thicknessTiers.find(
    (t) => thicknessMm >= t.minMm && thicknessMm <= t.maxMm
  );
  return tier?.multiplier ?? 1.0;
}
