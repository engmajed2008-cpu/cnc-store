export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdminAuth } from "@/lib/db/adminAuth";
import prisma from "@/lib/db/prisma";

const Schema = z.object({
  nameAr:       z.string().min(1).optional(),
  nameEn:       z.string().min(1).optional(),
  descriptionAr: z.string().optional(),
  basePriceSar: z.number().min(0).optional(),
  iconEmoji:    z.string().optional(),
  isActive:     z.boolean().optional(),
  sortOrder:    z.number().int().optional(),
});

export const PATCH = withAdminAuth(async (req, ctx) => {
  const id = (ctx?.params as { id: string })?.id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const row = await prisma.lightingType.update({ where: { id }, data: { ...parsed.data, updatedAt: new Date() } });
  return NextResponse.json({ lightingType: { ...row, basePriceSar: Number(row.basePriceSar) } });
});

export const DELETE = withAdminAuth(async (_req, ctx) => {
  const id = (ctx?.params as { id: string })?.id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.lightingType.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
