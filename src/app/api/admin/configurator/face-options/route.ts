export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdminAuth } from "@/lib/db/adminAuth";
import prisma from "@/lib/db/prisma";

export const GET = withAdminAuth(async () => {
  const rows = await prisma.faceOption.findMany({
    orderBy: { sortOrder: "asc" },
    include: { lightingType: { select: { nameAr: true, slug: true } } },
  });
  return NextResponse.json({
    faceOptions: rows.map(r => ({ ...r, priceSar: Number(r.priceSar) })),
  });
});

const Schema = z.object({
  lightingTypeId: z.string().min(1),
  slug:           z.string().min(2).regex(/^[a-z0-9-]+$/),
  nameAr:         z.string().min(1),
  nameEn:         z.string().min(1),
  descriptionAr:  z.string().default(""),
  hasColorPicker: z.boolean().default(false),
  priceSar:       z.number().min(0).default(0),
  gradientCss:    z.string().default(""),
  iconEmoji:      z.string().default("🔲"),
  isActive:       z.boolean().default(true),
  sortOrder:      z.number().int().default(0),
});

export const POST = withAdminAuth(async (req) => {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const row = await prisma.faceOption.create({ data: { ...parsed.data, updatedAt: new Date() } });
  return NextResponse.json({ faceOption: { ...row, priceSar: Number(row.priceSar) } }, { status: 201 });
});
