/**
 * GET   /api/admin/settings   — list all site settings
 * PATCH /api/admin/settings   — bulk update settings + revalidate pricing cache
 *
 * Settings include: vat_rate, usd_rate, shipping fees, bulk discount thresholds
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { withAdminAuth } from "@/lib/db/adminAuth";
import prisma from "@/lib/db/prisma";

// ─── GET /api/admin/settings ────────────────────────────────
export const GET = withAdminAuth(async () => {
  const settings = await prisma.siteSetting.findMany({
    orderBy: { key: "asc" },
  });
  return NextResponse.json({ settings });
});

// ─── PATCH /api/admin/settings ───────────────────────────────
const SettingsSchema = z.object({
  vat_rate:                  z.number().min(0).max(1).optional(),
  usd_rate:                  z.number().positive().optional(),
  free_shipping_threshold:   z.number().min(0).optional(),
  standard_shipping_fee:     z.number().min(0).optional(),
  bulk_discount_5_pct_qty:   z.number().int().min(2).optional(),
  bulk_discount_10_pct_qty:  z.number().int().min(3).optional(),
}).strict();

export const PATCH = withAdminAuth(
  async (req, { admin }) => {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const parsed = SettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    // Upsert each provided key
    const ops = Object.entries(parsed.data).map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: String(value), updatedBy: admin.id },
        update: { value: String(value), updatedBy: admin.id, updatedAt: new Date() },
      })
    );

    await prisma.$transaction(ops);

    // Invalidate pricing cache — affects VAT, USD rate, shipping, bulk discounts
    revalidateTag("pricing");
    revalidateTag("site-settings");

    return NextResponse.json({
      message: "Settings updated and pricing cache invalidated",
      updated: Object.keys(parsed.data),
    });
  },
  ["super_admin", "admin"] // Only admins can change global settings
);
