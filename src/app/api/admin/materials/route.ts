export const dynamic = "force-dynamic";
/**
 * Admin Materials API
 *
 * GET  /api/admin/materials          — list all materials
 * PATCH /api/admin/materials/[id]    — update pricing fields + write audit log
 *
 * Protected: requires admin JWT cookie
 * After update: revalidates "pricing" tag so all pages get fresh rates
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { withAdminAuth } from "@/lib/db/adminAuth";
import prisma from "@/lib/db/prisma";
// ─────────────────────────────────────────────────────────────
// GET /api/admin/materials
// ─────────────────────────────────────────────────────────────
export const GET = withAdminAuth(async (_req) => {
  const materials = await prisma.material.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      thicknessTiers:  { orderBy: { minMm: "asc" } },
      _count:          { select: { orderItems: true } },
    },
  });

  // Serialize Decimal → number
  const serialized = materials.map((m) => ({
    ...m,
    basePricePerCm2:   Number(m.basePricePerCm2),
    cuttingMultiplier: Number(m.cuttingMultiplier),
    minOrderSAR:       Number(m.minOrderSAR),
    thicknessTiers: m.thicknessTiers.map((t) => ({
      ...t,
      multiplier: Number(t.multiplier),
    })),
  }));

  return NextResponse.json({ materials: serialized });
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/materials/[id]
// ─────────────────────────────────────────────────────────────
const UpdateMaterialSchema = z.object({
  basePricePerCm2:    z.number().positive().optional(),
  cuttingMultiplier:  z.number().positive().optional(),
  minOrderSAR:        z.number().positive().optional(),
  thicknessOptionsMm: z.array(z.number().int().positive()).optional(),
  allowedFinishes:    z.array(z.enum(["raw", "painted", "powder", "anodized"])).optional(),
  nameAr:             z.string().min(1).optional(),
  nameEn:             z.string().min(1).optional(),
  icon:               z.string().optional(),
  color:              z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isActive:           z.boolean().optional(),
  sortOrder:          z.number().int().optional(),
  reason:             z.string().default(""),
});

export const PATCH = withAdminAuth(async (req, { params, admin }) => {
  const { id } = params;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = UpdateMaterialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { reason, ...updates } = parsed.data;

  // Load current values for audit log
  const current = await prisma.material.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Material not found" }, { status: 404 });

  // Run update + audit log in a transaction
  const [updated] = await prisma.$transaction([
    prisma.material.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    }),
    // Write audit record only if price fields changed
    ...(updates.basePricePerCm2 !== undefined || updates.cuttingMultiplier !== undefined
      ? [
          prisma.materialPriceHistory.create({
            data: {
              materialId:        id,
              changedBy:         admin.id,
              oldPricePerCm2:    current.basePricePerCm2,
              newPricePerCm2:    updates.basePricePerCm2 ?? current.basePricePerCm2,
              oldCuttingMult:    current.cuttingMultiplier,
              newCuttingMult:    updates.cuttingMultiplier ?? current.cuttingMultiplier,
              reason,
            },
          }),
        ]
      : []),
  ]);

  // ← This is the key: invalidates Next.js cache so new prices take effect
  revalidateTag("pricing");
  revalidateTag("materials");

  return NextResponse.json({
    material: {
      ...updated,
      basePricePerCm2:   Number(updated.basePricePerCm2),
      cuttingMultiplier: Number(updated.cuttingMultiplier),
      minOrderSAR:       Number(updated.minOrderSAR),
    },
    message: "Material updated and pricing cache invalidated",
  });
});
