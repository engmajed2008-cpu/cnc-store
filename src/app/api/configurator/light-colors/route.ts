export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET() {
  const rows = await prisma.lightColor.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true, slug: true, nameAr: true, nameEn: true, hexColor: true,
      priceSar: true, isColored: true, sortOrder: true,
    },
  });
  return NextResponse.json({
    lightColors: rows.map(r => ({ ...r, priceSar: Number(r.priceSar) })),
  });
}
