/**
 * /api/requests/[id]
 *
 * GET — تفاصيل الطلب: صاحب الطلب يرى كل العروض،
 *       الوكالة ترى الطلب (ضمن أمانتها) وعرضها هي فقط، والأدمن يرى الكل.
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { withAuth } from "@/lib/db/withAuth";
import { rateLimit } from "@/lib/rateLimit";

export const GET = withAuth(["CUSTOMER", "AGENCY", "ADMIN"], async (req, { params, profile }) => {
  const rl = rateLimit(req, { limit: 60, windowMs: 60_000, prefix: "req:get" });
  if (!rl.ok) {
    return NextResponse.json({ error: "محاولات كثيرة — حاول لاحقاً" }, { status: 429 });
  }

  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: "معرّف الطلب مطلوب" }, { status: 400 });
  }

  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      municipality: { select: { id: true, nameAr: true, nameEn: true, amanaId: true } },
      category: { select: { id: true, slug: true, nameAr: true, nameEn: true } },
      offers: {
        orderBy: { createdAt: "desc" },
        include: {
          agency: {
            select: { id: true, companyName: true, rating: true, reviewsCount: true, verified: true },
          },
        },
      },
    },
  });

  if (!request) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }

  // صاحب الطلب أو الأدمن: وصول كامل
  if (profile.role === "ADMIN" || request.customerId === profile.id) {
    return NextResponse.json({ request });
  }

  // الوكالات: ضمن أمانة الوكالة فقط، وترى عرضها هي دون عروض المنافسين
  if (profile.role === "AGENCY") {
    const agency = await prisma.agencyProfile.findUnique({
      where: { profileId: profile.id },
    });
    if (!agency || !agency.amanaId || agency.amanaId !== request.municipality.amanaId) {
      return NextResponse.json({ error: "ليست لديك صلاحية عرض هذا الطلب" }, { status: 403 });
    }
    return NextResponse.json({
      request: {
        ...request,
        offers: request.offers.filter((o) => o.agencyId === agency.id),
        offersCount: request.offers.length,
      },
    });
  }

  return NextResponse.json({ error: "ليست لديك صلاحية عرض هذا الطلب" }, { status: 403 });
});
