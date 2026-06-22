/**
 * CNC Price Calculator — Metal Art
 * All prices in SAR. USD conversion rate: 1 USD = 3.75 SAR
 */

export const USD_RATE = 3.75;
export const VAT_RATE = 0.15;

// ── Material base prices per cm² ──────────────────────────────
export const MATERIAL_RATES: Record<string, {
  basePricePerCm2: number;   // SAR per cm²
  cuttingMultiplier: number; // relative cutting difficulty
  minOrderSAR: number;       // minimum order value
  thicknessOptions: number[];
  color: string;
  icon: string;
}> = {
  steel: {
    basePricePerCm2: 0.085,
    cuttingMultiplier: 1.4,
    minOrderSAR: 80,
    thicknessOptions: [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20],
    color: "#6B7280",
    icon: "🔩",
  },
  acrylic: {
    basePricePerCm2: 0.12,
    cuttingMultiplier: 0.9,
    minOrderSAR: 60,
    thicknessOptions: [2, 3, 4, 5, 6, 8, 10, 12, 15, 20],
    color: "#06B6D4",
    icon: "💎",
  },
  cladding: {
    basePricePerCm2: 0.15,
    cuttingMultiplier: 1.1,
    minOrderSAR: 100,
    thicknessOptions: [2, 3, 4, 5, 6],
    color: "#C9A24B",
    icon: "🏗️",
  },
  wood: {
    basePricePerCm2: 0.055,
    cuttingMultiplier: 0.7,
    minOrderSAR: 45,
    thicknessOptions: [3, 4, 5, 6, 9, 12, 15, 18, 25],
    color: "#92400E",
    icon: "🪵",
  },
};

// ── Thickness surcharge multiplier ───────────────────────────
// Thicker materials cost more to cut
function thicknessMultiplier(mm: number): number {
  if (mm <= 3)  return 1.0;
  if (mm <= 6)  return 1.15;
  if (mm <= 10) return 1.3;
  if (mm <= 15) return 1.5;
  return 1.75;
}

// ── Finish pricing (SAR per cm²) ─────────────────────────────
export const FINISH_RATES: Record<string, number> = {
  raw:       0,
  painted:   0.025,
  powder:    0.045,
  anodized:  0.06,
};

// ── Urgency multipliers ──────────────────────────────────────
export const URGENCY_MULTIPLIERS: Record<string, number> = {
  standard: 1.0,
  express:  1.25,
  urgent:   1.60,
};

// ── Main calculation function ─────────────────────────────────
export interface PriceInput {
  material: string;
  thicknessMm: number;
  widthCm: number;
  heightCm: number;
  quantity: number;
  finish: string;
  urgency: string;
}

export interface PriceBreakdown {
  areaCm2: number;
  areaM2: number;
  materialCostSAR: number;
  cuttingCostSAR: number;
  finishCostSAR: number;
  urgencyFeeSAR: number;
  subtotalSAR: number;
  vatSAR: number;
  totalSAR: number;
  totalUSD: number;
  perUnitSAR: number;
  perUnitUSD: number;
  isMinimumApplied: boolean;
}

export function calculatePrice(input: PriceInput): PriceBreakdown | null {
  const mat = MATERIAL_RATES[input.material];
  if (!mat) return null;
  if (!input.widthCm || !input.heightCm || input.widthCm <= 0 || input.heightCm <= 0) return null;

  const areaCm2 = input.widthCm * input.heightCm;
  const areaM2 = areaCm2 / 10000;

  // Per-unit costs
  const thickMult = thicknessMultiplier(input.thicknessMm);
  const rawMaterialCost = areaCm2 * mat.basePricePerCm2 * thickMult;
  const rawCuttingCost  = areaCm2 * mat.basePricePerCm2 * mat.cuttingMultiplier * 0.6;
  const rawFinishCost   = areaCm2 * (FINISH_RATES[input.finish] ?? 0);
  const rawSubtotalUnit = rawMaterialCost + rawCuttingCost + rawFinishCost;

  // Apply urgency to cutting & finish only (not material)
  const urgencyMult = URGENCY_MULTIPLIERS[input.urgency] ?? 1;
  const cuttingWithUrgency = rawCuttingCost * urgencyMult;
  const urgencyFeeUnit = (cuttingWithUrgency - rawCuttingCost) + (rawFinishCost * (urgencyMult - 1));

  const subtotalUnit = rawMaterialCost + cuttingWithUrgency + rawFinishCost;

  // Apply quantity (bulk discount: 5+ pieces get 5%, 20+ get 10%)
  const bulkDiscount = input.quantity >= 20 ? 0.90 : input.quantity >= 5 ? 0.95 : 1.0;
  const subtotalAllUnits = subtotalUnit * input.quantity * bulkDiscount;

  // Minimum order
  const minOrder = mat.minOrderSAR;
  const isMinimumApplied = subtotalAllUnits < minOrder;
  const effectiveSubtotal = Math.max(subtotalAllUnits, minOrder);

  // VAT
  const vatAmount = effectiveSubtotal * VAT_RATE;
  const total = effectiveSubtotal + vatAmount;

  // Allocate breakdown proportionally
  const allocationRatio = effectiveSubtotal / Math.max(subtotalAllUnits, 0.001);
  const qty = input.quantity;

  return {
    areaCm2: Math.round(areaCm2),
    areaM2: Math.round(areaM2 * 1000) / 1000,
    materialCostSAR:  Math.round(rawMaterialCost * qty * bulkDiscount * allocationRatio * 100) / 100,
    cuttingCostSAR:   Math.round(cuttingWithUrgency * qty * bulkDiscount * allocationRatio * 100) / 100,
    finishCostSAR:    Math.round(rawFinishCost * qty * bulkDiscount * allocationRatio * 100) / 100,
    urgencyFeeSAR:    Math.round(urgencyFeeUnit * qty * bulkDiscount * allocationRatio * 100) / 100,
    subtotalSAR:      Math.round(effectiveSubtotal * 100) / 100,
    vatSAR:           Math.round(vatAmount * 100) / 100,
    totalSAR:         Math.round(total * 100) / 100,
    totalUSD:         Math.round((total / USD_RATE) * 100) / 100,
    perUnitSAR:       Math.round((total / qty) * 100) / 100,
    perUnitUSD:       Math.round((total / qty / USD_RATE) * 100) / 100,
    isMinimumApplied,
  };
}

// ── Format currency ──────────────────────────────────────────
export function formatSAR(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
