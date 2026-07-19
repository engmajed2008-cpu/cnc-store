/**
 * /api/requests
 *
 * POST — (CUSTOMER) إنشاء طلب لوحة جديد — الحالة OPEN
 * GET  — (AGENCY)   سرد الطلبات المفتوحة (OPEN | OFFERS) ضمن أمانة الوكالة
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { withAuth } from "@/lib/db/withAuth";
import { rateLimit } from "@/lib/rateLimit";

// ─────────────────────────────────────────────────────────────
// POST /api/requests — (CUSTOMER)
// ─────────────────────────────────────────────────────────────

const createRequestSchema = z.object({
  municipalityId: z.string().min(1, "البلدية مطلوبة"),
  categoryId: z.string().min(1, "الفئة مطلوبة"),
  title: z.string().min(3, "العنوان قصير جداً").max(200),
  specs: z.record(z.unknown()),
  attachments: z.array(z.string()).max(20).default([]),
  budgetEstimate: z.number().positive().optional(),
  deadline: z.coerce.date().optional(),
});

export const POST = withAuth(["CUSTOMER"], async (req, { profile }) => {
  const rl = rateLimit(req, { limit: 10, windowMs: 60_000, prefix: "req:create" });
  if (!rl.ok) {
    return NextResponse.json({ error: "محاولات كثيرة — حاول لاحقاً" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "بيانات غير صالحة", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const [municipality, category] = await Promise.all([
    prisma.municipality.findUnique({ where: { id: input.municipalityId } }),
    prisma.category.findUnique({ where: { id: input.categoryId } }),
  ]);

  if (!municipality || !municipality.isActive) {
    return NextResponse.json({ error: "البلدية غير موجودة أو غير مفعّلة" }, { status: 400 });
  }
  if (!category || !category.isActive || category.kind !== "SERVICE") {
    return NextResponse.json({ error: "الفئة غير صالحة — يجب أن تكون فئة خدمات" }, { status: 400 });
  }

  // لقطة الدليل التنظيمي: استثناء البلدية أولاً، ثم دليل الأمانة العام
  const guide =
    (await prisma.regulatoryGuide.findFirst({
      where: { municipalityId: municipality.id, isActive: true },
      orderBy: { createdAt: "desc" },
    })) ??
    (await prisma.regulatoryGuide.findFirst({
      where: { amanaId: municipality.amanaId, municipalityId: null, isActive: true },
      orderBy: { createdAt: "desc" },
    }));

  const request = await prisma.request.create({
    data: {
      customerId: profile.id,
      municipalityId: municipality.id,
      categoryId: category.id,
      title: input.title,
      specs: input.specs as object,
      attachments: input.attachments,
      budgetEstimate: input.budgetEstimate,
      deadline: input.deadline,
      status: "OPEN",
      guideId: guide?.id ?? null,
      guideVersion: guide?.version ?? null,
    },
    include: {
      municipality: { select: { nameAr: true, nameEn: true } },
      category: { select: { slug: true, nameAr: true, nameEn: true } },
    },
  });

  return NextResponse.json({ request }, { status: 201 });
});

// ─────────────────────────────────────────────────────────────
// GET /api/requests — (AGENCY) طلبات أمانة الوكالة المفتوحة
//   ?categoryId=...  فلترة بالفئة (اختياري)
// ─────────────────────────────────────────────────────────────

export const GET = withAuth(["AGENCY"], async (req, { profile }) => {
  const rl = rateLimit(req, { limit: 60, windowMs: 60_000, prefix: "req:list" });
  if (!rl.ok) {
    return NextResponse.json({ error: "محاولات كثيرة — حاول لاحقاً" }, { status: 429 });
  }

  const agency = await prisma.agencyProfile.findUnique({
    where: { profileId: profile.id },
  });
  if (!agency) {
    return NextResponse.json(
      { error: "لا يوجد ملف وكالة مرتبط بحسابك" },
      { status: 403 }
    );
  }
  if (!agency.amanaId) {
    return NextResponse.json(
      { error: "ملف الوكالة غير مرتبط بأمانة — تواصل مع الإدارة" },
      { status: 403 }
    );
  }

  const categoryId = req.nextUrl.searchParams.get("categoryId") ?? undefined;

  const requests = await prisma.request.findMany({
    where: {
      status: { in: ["OPEN", "OFFERS"] },
      municipality: { amanaId: agency.amanaId },
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      municipality: { select: { id: true, nameAr: true, nameEn: true } },
      category: { select: { id: true, slug: true, nameAr: true, nameEn: true } },
      _count: { select: { offers: true } },
    },
  });

  return NextResponse.json({ requests });
});
