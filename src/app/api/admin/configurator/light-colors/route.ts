export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdminAuth } from "@/lib/db/adminAuth";
import prisma from "@/lib/db/prisma";

export const GET = withAdminAuth(async () => {
  const rows = await prisma.lightColor.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({
    lightColors: rows.map(r => ({ ...r, priceSar: Number(r.priceSar) })),
  });
});

const Schema = z.object({
  slug:      z.string().min(2).regex(/^[a-z0-9-]+$/),
  nameAr:    z.string().min(1),
  nameEn:    z.string().min(1),
  hexColor:  z.string().regex(/^#[0-9a-fA-F]{6}$/),
  priceSar:  z.number().min(0).default(0),
  isColored: z.boolean().default(false),
  isActive:  z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const POST = withAdminAuth(async (req) => {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const row = await prisma.lightColor.create({ data: { ...parsed.data, updatedAt: new Date() } });
  return NextResponse.json({ lightColor: { ...row, priceSar: Number(row.priceSar) } }, { status: 201 });
});
