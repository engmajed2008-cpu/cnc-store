/**
 * GET /api/materials
 * Returns all active materials with their pricing config.
 * Consumed by the client-side CNCConfigurator for instant price previews.
 * Response is cached (Next.js route cache + HTTP Cache-Control header).
 */

import { NextResponse } from "next/server";
import { getCachedMaterials, getCachedFinishRates, getCachedUrgencyRates, getCachedSiteSettings } from "@/lib/db/pricingCache";

export const dynamic = "force-dynamic"; // revalidation controlled by unstable_cache tags

export async function GET() {
  try {
    const [materials, finishRates, urgencyRates, settings] = await Promise.all([
      getCachedMaterials(),
      getCachedFinishRates(),
      getCachedUrgencyRates(),
      getCachedSiteSettings(),
    ]);

    return NextResponse.json(
      { materials, finishRates, urgencyRates, settings },
      {
        status: 200,
        headers: {
          // Cache 5 minutes in browser, up to 1 hour stale-while-revalidate
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
          "Content-Type":  "application/json",
        },
      }
    );
  } catch (err) {
    console.error("[GET /api/materials]", err);
    return NextResponse.json(
      { error: "Failed to load pricing data" },
      { status: 500 }
    );
  }
}
