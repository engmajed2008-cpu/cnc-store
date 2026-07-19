/**
 * GET /api/admin/partners — قائمة طلبات انضمام الشركاء (للأدمن)
 *   ?status=pending (افتراضي) | all
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/db/adminAuth";
import { getSignedUrl, BUCKETS } from "@/lib/storage/supabaseStorage";

async function withCrDocUrl<T extends { crDocPath: string | null; ownerIdDocPath: string | null }>(rows: T[]) {
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      crDocUrl: row.crDocPath
        ? await getSignedUrl(BUCKETS.PARTNERS, row.crDocPath, 3600).catch(() => null)
        : null,
      ownerIdDocUrl: row.ownerIdDocPath
        ? await getSignedUrl(BUCKETS.PARTNERS, row.ownerIdDocPath, 3600).catch(() => null)
        : null,
    }))
  );
}

export const GET = withAdminAuth(async (req) => {
  const status = req.nextUrl.searchParams.get("status") ?? "pending";
  const where = status === "all" ? {} : { verified: false };

  const [agencies, suppliers] = await Promise.all([
    prisma.agencyProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        profile: { select: { fullName: true, email: true, phone: true, role: true } },
        amana: { select: { nameAr: true } },
      },
    }),
    prisma.supplierProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        profile: { select: { fullName: true, email: true, phone: true, role: true } },
        amana: { select: { nameAr: true } },
      },
    }),
  ]);

  return NextResponse.json({
    agencies: await withCrDocUrl(agencies),
    suppliers: await withCrDocUrl(suppliers),
  });
});
