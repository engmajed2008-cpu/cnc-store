export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { withAdminAuth } from "@/lib/db/adminAuth";
import prisma from "@/lib/db/prisma";

// GET — list all letter types (including inactive)
export const GET = withAdminAuth(async () => {
  const rows = await prisma.letterType.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({
    letterTypes: rows.map(r => ({ ...r, rateMultiplier: Number(r.rateMultiplier) })),
  });
});

const CreateSchema = z.object({
  slug:            z.string().min(2).regex(/^[a-z0-9-]+$/),
  nameAr:          z.string().min(1),
  nameEn:          z.string().min(1),
  tagAr:           z.string().default(""),
  faceMaterial:    z.enum(["acrylic", "stainless", "zincor", "aluminum"]),
  sideMaterial:    z.enum(["acrylic", "stainless", "zincor", "aluminum"]),
  lighting:        z.enum(["front", "back", "both", "none"]).default("front"),
  rateMultiplier:  z.number().positive().default(1),
  gradientCss:     z.string().default(""),
  availableColors: z.array(z.string()).default([]),
  colorful:        z.boolean().default(true),
  sortOrder:       z.number().int().default(0),
});

export const POST = withAdminAuth(async (req) => {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const row = await prisma.letterType.create({ data: { ...parsed.data, updatedAt: new Date() } });
  revalidateTag("letter-types");
  return NextResponse.json({ letterType: { ...row, rateMultiplier: Number(row.rateMultiplier) } }, { status: 201 });
});
