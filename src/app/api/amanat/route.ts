/**
 * GET /api/amanat — قائمة الأمانات النشطة (عام — لنموذج انضمام الشركاء)
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { rateLimit } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const rl = rateLimit(req, { limit: 60, windowMs: 60_000, prefix: "amanat" });
  if (!rl.ok) {
    return NextResponse.json({ error: "محاولات كثيرة — حاول لاحقاً" }, { status: 429 });
  }

  const amanat = await prisma.amana.findMany({
    where: { isActive: true },
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      cities: {
        where: { isActive: true },
        select: { id: true, nameAr: true, nameEn: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // بيانات شبه ثابتة — تُخزَّن على CDN في الإنتاج (5 دقائق + تقديم النسخة القديمة أثناء التحديث)
  return NextResponse.json(
    { amanat },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" } }
  );
}
