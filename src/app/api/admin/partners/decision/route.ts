/**
 * POST /api/admin/partners/decision — قرار الأدمن على طلب انضمام شريك
 *
 * body: { type: "agency" | "supplier", id, action: "approve" | "reject" }
 * - approve: verified=true + ترقية دور الحساب (AGENCY أو SUPPLIER)
 * - reject : حذف الطلب (يبقى الحساب CUSTOMER ويمكنه التقديم من جديد)
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/db/adminAuth";

const decisionSchema = z.object({
  type: z.enum(["agency", "supplier"]),
  id: z.string().min(1),
  action: z.enum(["approve", "reject"]),
});

export const POST = withAdminAuth(async (req) => {
  const body = await req.json().catch(() => null);
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "بيانات غير صالحة", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { type, id, action } = parsed.data;

  if (type === "agency") {
    const agency = await prisma.agencyProfile.findUnique({ where: { id } });
    if (!agency) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

    if (action === "reject") {
      if (agency.isAnchor) {
        return NextResponse.json(
          { error: "لا يمكن حذف وكالة المرساة من هنا" },
          { status: 400 }
        );
      }
      // يحذف الطلب/العضوية ويعيد الحساب عميلاً (يصلح أيضاً لإلغاء عضوية مفعّلة)
      await prisma.$transaction([
        prisma.agencyProfile.delete({ where: { id } }),
        prisma.profile.update({
          where: { id: agency.profileId },
          data: { role: "CUSTOMER" },
        }),
      ]);
      return NextResponse.json({ ok: true, result: "rejected" });
    }

    await prisma.$transaction([
      prisma.agencyProfile.update({
        where: { id },
        data: { verified: true, verifiedAt: new Date() },
      }),
      prisma.profile.update({
        where: { id: agency.profileId },
        data: { role: "AGENCY" },
      }),
    ]);
    return NextResponse.json({ ok: true, result: "approved", role: "AGENCY" });
  }

  const supplier = await prisma.supplierProfile.findUnique({ where: { id } });
  if (!supplier) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

  if (action === "reject") {
    await prisma.$transaction([
      prisma.supplierProfile.delete({ where: { id } }),
      prisma.profile.update({
        where: { id: supplier.profileId },
        data: { role: "CUSTOMER" },
      }),
    ]);
    return NextResponse.json({ ok: true, result: "rejected" });
  }

  await prisma.$transaction([
    prisma.supplierProfile.update({ where: { id }, data: { verified: true } }),
    prisma.profile.update({
      where: { id: supplier.profileId },
      data: { role: "SUPPLIER" },
    }),
  ]);
  return NextResponse.json({ ok: true, result: "approved", role: "SUPPLIER" });
});
