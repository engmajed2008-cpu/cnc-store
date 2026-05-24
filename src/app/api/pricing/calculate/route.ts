/**
 * POST /api/pricing/calculate
 *
 * Server-side price calculation using live DB rates.
 * Used as a fallback when client needs a verified price
 * (e.g., before adding to cart or at checkout).
 *
 * Body: PriceInput
 * Response: PriceBreakdown
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculatePriceFromDb } from "@/lib/db/dynamicPriceCalculator";

// ── Input validation schema ──────────────────────────────────
const PriceInputSchema = z.object({
  material:    z.string().min(1).max(50),
  thicknessMm: z.number().int().min(1).max(100),
  widthCm:     z.number().positive().max(1000),
  heightCm:    z.number().positive().max(1000),
  quantity:    z.number().int().min(1).max(500),
  finish:      z.enum(["raw", "painted", "powder", "anodized"]),
  urgency:     z.enum(["standard", "express", "urgent"]),
});

export async function POST(req: NextRequest) {
  try {
    // Parse + validate
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = PriceInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const result = await calculatePriceFromDb(parsed.data);

    if (!result) {
      return NextResponse.json(
        { error: "Could not calculate price — invalid material or dimensions" },
        { status: 400 }
      );
    }

    return NextResponse.json(result, {
      status: 200,
      headers: {
        // Price results should NOT be cached — rates change
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[POST /api/pricing/calculate]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
