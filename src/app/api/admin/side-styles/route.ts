export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { withAdminAuth } from "@/lib/db/adminAuth";
import prisma from "@/lib/db/prisma";

export const GET = withAdminAuth(async () => {
  const rows = await prisma.sideStyle.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({
    sideStyles: rows.map(r => ({ ...r, priceAddPercent: Number(r.priceAddPercent) })),
  });
});

const CreateSchema = z.object({
  slug:            z.string().min(2).regex(/^[a-z0-9-]+$/),
  nameAr:          z.string().min(1),
  nameEn:          z.string().min(1),
  descriptionAr:   z.string().default(""),
  svgPatternId:    z.string().default(""),
  priceAddPercent: z.number().min(0).default(0),
  metalOnly:       z.boolean().default(true),
  sortOrder:       z.number().int().default(0),
});

export const POST = withAdminAuth(async (req) => {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const row = await prisma.sideStyle.create({ data: { ...parsed.data, updatedAt: new Date() } });
  revalidateTag("side-styles");
  return NextResponse.json({ sideStyle: { ...row, priceAddPercent: Number(row.priceAddPercent) } }, { status: 201 });
});
