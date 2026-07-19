export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET() {
  const rows = await prisma.lightingType.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true, slug: true, nameAr: true, nameEn: true,
      descriptionAr: true, basePriceSar: true, iconEmoji: true, sortOrder: true,
    },
  });
  return NextResponse.json({
    lightingTypes: rows.map(r => ({ ...r, basePriceSar: Number(r.basePriceSar) })),
  });
}
