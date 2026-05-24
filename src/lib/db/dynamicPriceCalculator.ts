/**
 * src/lib/db/dynamicPriceCalculator.ts
 *
 * Drop-in replacement for src/lib/priceCalculator.ts
 * Uses rates fetched from the database instead of hard-coded constants.
 *
 * The static calculatePrice() still works for client-side instant previews
 * (uses cached values passed from the server). The server-side
 * calculatePriceFromDb() fetches the latest rates directly.
 */

import type { PricingConfig, DbMaterial } from "./pricingCache";
import { getThicknessMultiplier } from "./pricingCache";
import type { PriceInput, PriceBreakdown } from "@/lib/priceCalculator";

// ─────────────────────────────────────────────────────────────
// Core calculation — pure function, no DB calls
// ─────────────────────────────────────────────────────────────
export function calculatePriceWithConfig(
  input: PriceInput,
  config: PricingConfig
): PriceBreakdown | null {
  const { materials, finishRates, urgencyRates, settings } = config;

  // Find material
  const mat = materials.find((m) => m.slug === input.material);
  if (!mat) return null;
  if (!input.widthCm || !input.heightCm || input.widthCm <= 0 || input.heightCm <= 0)
    return null;

  // Find finish
  const finishRate = finishRates.find((f) => f.finish === input.finish);
  const finishPricePerCm2 = finishRate?.pricePerCm2 ?? 0;

  // Find urgency
  const urgencyRate = urgencyRates.find((u) => u.urgency === input.urgency);
  const urgencyMult = urgencyRate?.multiplier ?? 1.0;

  // Area
  const areaCm2 = input.widthCm * input.heightCm;
  const areaM2  = areaCm2 / 10000;

  // Thickness multiplier — from DB tiers
  const thickMult = getThicknessMultiplier(mat, input.thicknessMm);

  // Per-unit base costs
  const rawMaterialCost = areaCm2 * mat.basePricePerCm2 * thickMult;
  const rawCuttingCost  = areaCm2 * mat.basePricePerCm2 * mat.cuttingMultiplier * 0.6;
  const rawFinishCost   = areaCm2 * finishPricePerCm2;

  // Apply urgency (to cutting + finish only)
  const cuttingWithUrgency = rawCuttingCost * urgencyMult;
  const urgencyFeeUnit     = (cuttingWithUrgency - rawCuttingCost) +
                             (rawFinishCost * (urgencyMult - 1));

  const subtotalUnit = rawMaterialCost + cuttingWithUrgency + rawFinishCost;

  // Bulk discount — from site_settings
  const qty = input.quantity;
  const bulkDiscount =
    qty >= settings.bulkDiscount10PctQty ? 0.90 :
    qty >= settings.bulkDiscount5PctQty  ? 0.95 : 1.0;
  const subtotalAllUnits = subtotalUnit * qty * bulkDiscount;

  // Minimum order (from material row)
  const minOrder = mat.minOrderSAR;
  const isMinimumApplied = subtotalAllUnits < minOrder;
  const effectiveSubtotal = Math.max(subtotalAllUnits, minOrder);

  // VAT — from site_settings
  const vatAmount = effectiveSubtotal * settings.vatRate;
  const total     = effectiveSubtotal + vatAmount;

  // Allocate breakdown proportionally (same as original)
  const allocationRatio = effectiveSubtotal / Math.max(subtotalAllUnits, 0.001);

  return {
    areaCm2: Math.round(areaCm2),
    areaM2:  Math.round(areaM2 * 1000) / 1000,
    materialCostSAR: round2(rawMaterialCost * qty * bulkDiscount * allocationRatio),
    cuttingCostSAR:  round2(cuttingWithUrgency * qty * bulkDiscount * allocationRatio),
    finishCostSAR:   round2(rawFinishCost * qty * bulkDiscount * allocationRatio),
    urgencyFeeSAR:   round2(urgencyFeeUnit * qty * bulkDiscount * allocationRatio),
    subtotalSAR:     round2(effectiveSubtotal),
    vatSAR:          round2(vatAmount),
    totalSAR:        round2(total),
    totalUSD:        round2(total / settings.usdRate),
    perUnitSAR:      round2(total / qty),
    perUnitUSD:      round2(total / qty / settings.usdRate),
    isMinimumApplied,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─────────────────────────────────────────────────────────────
// Server-side helper — fetches fresh config, then calculates
// ─────────────────────────────────────────────────────────────
export async function calculatePriceFromDb(
  input: PriceInput
): Promise<PriceBreakdown | null> {
  const { getFullPricingConfig } = await import("./pricingCache");
  const config = await getFullPricingConfig();
  return calculatePriceWithConfig(input, config);
}
