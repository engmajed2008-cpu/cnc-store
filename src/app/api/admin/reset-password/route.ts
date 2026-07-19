export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { hashOtpCode, OTP_MAX_ATTEMPTS } from "@/lib/otp";

const Schema = z.object({
  email:       z.string().email(),
  code:        z.string().regex(/^\d{6}$/),
  newPassword: z.string().min(8, "كلمة المرور لا تقل عن 8 أحرف"),
});

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 10, windowMs: 60_000, prefix: "admin:reset" });
  if (!rl.ok) return NextResponse.json({ error: "محاولات كثيرة" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });

  const email = parsed.data.email.toLowerCase();

  const otp = await prisma.emailOtp.findFirst({
    where: { email, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return NextResponse.json({ error: "الرمز غير موجود أو منتهي — أرسل رمزاً جديداً" }, { status: 410 });

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.emailOtp.delete({ where: { id: otp.id } });
    return NextResponse.json({ error: "تجاوزت عدد المحاولات — أرسل رمزاً جديداً" }, { status: 429 });
  }

  if (otp.codeHash !== hashOtpCode(parsed.data.code)) {
    await prisma.emailOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    const left = OTP_MAX_ATTEMPTS - otp.attempts - 1;
    return NextResponse.json({ error: `الرمز غير صحيح — تبقى ${left} محاولات` }, { status: 401 });
  }

  // الرمز صحيح
  await prisma.emailOtp.delete({ where: { id: otp.id } });

  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user || !user.isActive) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash: newHash } });
  await prisma.adminSession.deleteMany({ where: { adminUserId: user.id } });

  return NextResponse.json({ ok: true });
}
