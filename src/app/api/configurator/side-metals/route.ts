export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET() {
  const rows = await prisma.sideMetal.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true, slug: true, nameAr: true, nameEn: true, descriptionAr: true,
      priceSar: true, gradientCss: true, iconEmoji: true, sortOrder: true,
    },
  });
  return NextResponse.json({
    sideMetals: rows.map(r => ({ ...r, priceSar: Number(r.priceSar) })),
  });
}
