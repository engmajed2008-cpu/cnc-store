/**
 * GET /api/partners/pledge — شروط تعهد الشركاء (عام)
 *
 * تُعرض في نموذج الانضمام («الاطلاع على التعهد») ويجب الموافقة عليها قبل التقديم.
 * الشروط ديناميكية — تُدار من لوحة التحكم (/api/admin/pledge-terms).
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { rateLimit } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const rl = rateLimit(req, { limit: 30, windowMs: 60_000, prefix: "partners:pledge" });
  if (!rl.ok) {
    return NextResponse.json({ error: "محاولات كثيرة — حاول لاحقاً" }, { status: 429 });
  }

  const terms = await prisma.pledgeTerm.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, textAr: true, textEn: true },
  });

  // شبه ثابتة — تُخزَّن على CDN في الإنتاج؛ تعديلات الإدارة تظهر خلال 5 دقائق كحد أقصى
  return NextResponse.json(
    { terms },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" } }
  );
}
