export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db/prisma";
import { verifyAdminRequest } from "@/lib/db/adminAuth";
import { rateLimit } from "@/lib/rateLimit";

const Schema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8, "كلمة المرور لا تقل عن 8 أحرف"),
});

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 5, windowMs: 60_000, prefix: "admin:chpw" });
  if (!rl.ok) return NextResponse.json({ error: "محاولات كثيرة — انتظر دقيقة" }, { status: 429 });

  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });

  const user = await prisma.adminUser.findUnique({ where: { id: admin.id } });
  if (!user) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 401 });

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash: newHash } });

  // إلغاء كل الجلسات الأخرى (الجلسة الحالية تبقى)
  const currentToken = req.cookies.get("metalart_admin")?.value;
  await prisma.adminSession.deleteMany({
    where: { adminUserId: admin.id, ...(currentToken ? { token: { not: currentToken } } : {}) },
  });

  return NextResponse.json({ ok: true });
}
