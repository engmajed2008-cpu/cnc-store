export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const lightingTypeId = req.nextUrl.searchParams.get("lightingTypeId");
  const rows = await prisma.faceOption.findMany({
    where: {
      isActive: true,
      ...(lightingTypeId ? { lightingTypeId } : {}),
    },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true, slug: true, nameAr: true, nameEn: true, descriptionAr: true,
      hasColorPicker: true, priceSar: true, gradientCss: true, iconEmoji: true,
      lightingTypeId: true, sortOrder: true,
    },
  });
  return NextResponse.json({
    faceOptions: rows.map(r => ({ ...r, priceSar: Number(r.priceSar) })),
  });
}
