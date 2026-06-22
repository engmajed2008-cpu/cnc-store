export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { withAdminAuth } from "@/lib/db/adminAuth";
import prisma from "@/lib/db/prisma";

const UpdateSchema = z.object({
  nameAr:          z.string().min(1).optional(),
  nameEn:          z.string().min(1).optional(),
  descriptionAr:   z.string().optional(),
  svgPatternId:    z.string().optional(),
  priceAddPercent: z.number().min(0).optional(),
  metalOnly:       z.boolean().optional(),
  isActive:        z.boolean().optional(),
  sortOrder:       z.number().int().optional(),
});

export const PATCH = withAdminAuth(async (req, { params }) => {
  const { id } = params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const existing = await prisma.sideStyle.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const row = await prisma.sideStyle.update({ where: { id }, data: { ...parsed.data, updatedAt: new Date() } });
  revalidateTag("side-styles");
  return NextResponse.json({ sideStyle: { ...row, priceAddPercent: Number(row.priceAddPercent) } });
});

export const DELETE = withAdminAuth(async (_req, { params }) => {
  const { id } = params;
  const existing = await prisma.sideStyle.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.sideStyle.delete({ where: { id } });
  revalidateTag("side-styles");
  return NextResponse.json({ ok: true });
});
