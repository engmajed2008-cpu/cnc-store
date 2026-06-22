/**
 * /api/admin/pledge-terms — إدارة شروط تعهد الشركاء (ديناميكية)
 *
 * GET    — كل الشروط (الفعّالة وغير الفعّالة) مرتّبة.
 * POST   — إضافة شرط جديد { textAr, textEn? } — يُذيَّل تلقائياً.
 * PATCH  — تعديل شرط { id, textAr?, textEn?, isActive?, sortOrder? }.
 * DELETE — حذف شرط نهائياً { id }.
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/db/adminAuth";

export const GET = withAdminAuth(async () => {
  const terms = await prisma.pledgeTerm.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ terms });
});

const createSchema = z.object({
  textAr: z.string().min(5, "نص الشرط بالعربية مطلوب (5 أحرف على الأقل)").max(500),
  textEn: z.string().max(500).optional(),
});

export const POST = withAdminAuth(async (req) => {
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 }
    );
  }

  const last = await prisma.pledgeTerm.aggregate({ _max: { sortOrder: true } });
  const term = await prisma.pledgeTerm.create({
    data: {
      textAr: parsed.data.textAr.trim(),
      textEn: parsed.data.textEn?.trim() || null,
      sortOrder: (last._max.sortOrder ?? 0) + 1,
      isActive: true,
    },
  });
  return NextResponse.json({ term }, { status: 201 });
});

const patchSchema = z.object({
  id: z.string().min(1),
  textAr: z.string().min(5).max(500).optional(),
  textEn: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const PATCH = withAdminAuth(async (req) => {
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  const { id, ...data } = parsed.data;

  const term = await prisma.pledgeTerm.update({ where: { id }, data }).catch(() => null);
  if (!term) {
    return NextResponse.json({ error: "الشرط غير موجود" }, { status: 404 });
  }
  return NextResponse.json({ term });
});

const deleteSchema = z.object({ id: z.string().min(1) });

export const DELETE = withAdminAuth(async (req) => {
  const body = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const deleted = await prisma.pledgeTerm.delete({ where: { id: parsed.data.id } }).catch(() => null);
  if (!deleted) {
    return NextResponse.json({ error: "الشرط غير موجود" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
});
