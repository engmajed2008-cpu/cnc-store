export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { withAdminAuth } from "@/lib/db/adminAuth";
import prisma from "@/lib/db/prisma";

const UpdateSchema = z.object({
  nameAr:          z.string().min(1).optional(),
  nameEn:          z.string().min(1).optional(),
  tagAr:           z.string().optional(),
  faceMaterial:    z.enum(["acrylic", "stainless", "zincor", "aluminum"]).optional(),
  sideMaterial:    z.enum(["acrylic", "stainless", "zincor", "aluminum"]).optional(),
  lighting:        z.enum(["front", "back", "both", "none"]).optional(),
  rateMultiplier:  z.number().positive().optional(),
  gradientCss:     z.string().optional(),
  availableColors: z.array(z.string()).optional(),
  colorful:        z.boolean().optional(),
  isActive:        z.boolean().optional(),
  sortOrder:       z.number().int().optional(),
});

export const PATCH = withAdminAuth(async (req, { params }) => {
  const { id } = params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const existing = await prisma.letterType.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const row = await prisma.letterType.update({ where: { id }, data: { ...parsed.data, updatedAt: new Date() } });
  revalidateTag("letter-types");
  return NextResponse.json({ letterType: { ...row, rateMultiplier: Number(row.rateMultiplier) } });
});

export const DELETE = withAdminAuth(async (_req, { params }) => {
  const { id } = params;
  const existing = await prisma.letterType.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.letterType.delete({ where: { id } });
  revalidateTag("letter-types");
  return NextResponse.json({ ok: true });
});
