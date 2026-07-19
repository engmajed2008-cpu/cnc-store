/**
 * /api/requests/[id]/offers
 *
 * POST — (AGENCY) تقديم عرض على طلب مفتوح ضمن أمانة الوكالة.
 *        عرض واحد لكل وكالة (@@unique) — ويحوّل حالة الطلب إلى OFFERS.
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import { withAuth } from "@/lib/db/withAuth";
import { rateLimit } from "@/lib/rateLimit";

const createOfferSchema = z.object({
  price: z.number().positive("السعر يجب أن يكون أكبر من صفر"),
  leadTimeDays: z.number().int().positive("مدة التنفيذ بالأيام مطلوبة"),
  notes: z.string().max(2000).optional(),
  attachments: z.array(z.string()).max(20).default([]),
});

export const POST = withAuth(["AGENCY"], async (req, { params, profile }) => {
  const rl = rateLimit(req, { limit: 20, windowMs: 60_000, prefix: "offer:create" });
  if (!rl.ok) {
    return NextResponse.json({ error: "محاولات كثيرة — حاول لاحقاً" }, { status: 429 });
  }

  const requestId = params.id;
  if (!requestId) {
    return NextResponse.json({ error: "معرّف الطلب مطلوب" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createOfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "بيانات غير صالحة", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const agency = await prisma.agencyProfile.findUnique({
    where: { profileId: profile.id },
  });
  if (!agency) {
    return NextResponse.json({ error: "لا يوجد ملف وكالة مرتبط بحسابك" }, { status: 403 });
  }
  if (!agency.amanaId) {
    return NextResponse.json(
      { error: "ملف الوكالة غير مرتبط بأمانة — تواصل مع الإدارة" },
      { status: 403 }
    );
  }

  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { municipality: { select: { amanaId: true } } },
  });
  if (!request) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }
  if (request.municipality.amanaId !== agency.amanaId) {
    return NextResponse.json({ error: "الطلب خارج نطاق أمانة وكالتك" }, { status: 403 });
  }
  if (request.status !== "OPEN" && request.status !== "OFFERS") {
    return NextResponse.json({ error: "الطلب لم يعد يستقبل عروضاً" }, { status: 409 });
  }

  try {
    const [offer] = await prisma.$transaction([
      prisma.offer.create({
        data: {
          requestId,
          agencyId: agency.id,
          price: input.price,
          leadTimeDays: input.leadTimeDays,
          notes: input.notes,
          attachments: input.attachments,
          status: "PENDING",
        },
      }),
      prisma.request.update({
        where: { id: requestId },
        data: { status: "OFFERS" },
      }),
    ]);

    return NextResponse.json({ offer }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "قدّمت وكالتك عرضاً على هذا الطلب مسبقاً" },
        { status: 409 }
      );
    }
    throw e;
  }
});
