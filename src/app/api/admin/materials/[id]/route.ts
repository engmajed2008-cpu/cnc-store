export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { withAdminAuth } from "@/lib/db/adminAuth";
import prisma from "@/lib/db/prisma";

const UpdateMaterialSchema = z.object({
  basePricePerCm2:    z.number().positive().optional(),
  cuttingMultiplier:  z.number().positive().optional(),
  minOrderSAR:        z.number().positive().optional(),
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
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }

  const { reason, ...updates } = parsed.data;

  const current = await prisma.material.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.material.update({
    where: { id },
    data: { ...updates, updatedAt: new Date() },
  });

  revalidateTag("pricing");
  revalidateTag("materials");

  return NextResponse.json({ material: updated });
});