/**
 * POST /api/otp/verify — التحقق من رمز OTP
 * body: { phone: "+9665XXXXXXXX", code: "123456" }
 * عند النجاح يعيد phoneProof (إثبات HMAC موقّت) يُرسل مع نموذج الانضمام.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { hashOtpCode, signPhoneProof, OTP_MAX_ATTEMPTS } from "@/lib/otp";

const verifySchema = z.object({
  phone: z.string().regex(/^\+9665\d{8}$/),
  code: z.string().regex(/^\d{6}$/, "الرمز 6 أرقام"),
});

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 10, windowMs: 60_000, prefix: "otp:verify" });
  if (!rl.ok) {
    return NextResponse.json({ error: "محاولات كثيرة — انتظر دقيقة" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" }, { status: 400 });
  }
  const { phone, code } = parsed.data;

  const otp = await prisma.phoneOtp.findFirst({
    where: { phone, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) {
    return NextResponse.json({ error: "لا يوجد رمز نشط لهذا الرقم — أرسل رمزاً جديداً" }, { status: 410 });
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.phoneOtp.delete({ where: { id: otp.id } });
    return NextResponse.json({ error: "تجاوزت عدد المحاولات — أرسل رمزاً جديداً" }, { status: 429 });
  }

  if (otp.codeHash !== hashOtpCode(code)) {
    await prisma.phoneOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    const left = OTP_MAX_ATTEMPTS - otp.attempts - 1;
    return NextResponse.json(
      { error: left > 0 ? `الرمز غير صحيح — تبقى ${left} محاولات` : "الرمز غير صحيح" },
      { status: 401 }
    );
  }

  // نجاح — يُستهلك الرمز ويصدر الإثبات
  await prisma.phoneOtp.delete({ where: { id: otp.id } });
  return NextResponse.json({ ok: true, phoneProof: signPhoneProof(phone) });
}
