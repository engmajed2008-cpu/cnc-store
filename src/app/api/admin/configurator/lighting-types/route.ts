export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdminAuth } from "@/lib/db/adminAuth";
import prisma from "@/lib/db/prisma";

export const GET = withAdminAuth(async () => {
  const rows = await prisma.lightingType.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({
    lightingTypes: rows.map(r => ({ ...r, basePriceSar: Number(r.basePriceSar) })),
  });
});

const Schema = z.object({
  slug:         z.string().min(2).regex(/^[a-z0-9-]+$/),
  nameAr:       z.string().min(1),
  nameEn:       z.string().min(1),
  descriptionAr: z.string().default(""),
  basePriceSar: z.number().min(0).default(0),
  iconEmoji:    z.string().default("💡"),
  isActive:     z.boolean().default(true),
  sortOrder:    z.number().int().default(0),
});

export const POST = withAdminAuth(async (req) => {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const row = await prisma.lightingType.create({ data: { ...parsed.data, updatedAt: new Date() } });
  return NextResponse.json({ lightingType: { ...row, basePriceSar: Number(row.basePriceSar) } }, { status: 201 });
});
