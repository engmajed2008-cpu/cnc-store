/**
 * /api/otp/email/send
 * GET  — حالة خدمة تأكيد البريد: { enabled }
 * POST — إرسال رمز تأكيد إلى البريد { email }
 *
 * يُطلب التأكيد سواء سجّل الشريك بحساب Google أو أدخل بريده بنفسه.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { rateLimit } from "@/lib/rateLimit";
import {
  generateOtpCode,
  hashOtpCode,
  emailOtpEnabled,
  sendOtpEmail,
  OTP_TTL_MINUTES,
} from "@/lib/otp";

export async function GET() {
  return NextResponse.json({ enabled: emailOtpEnabled() });
}

const sendSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح").max(254),
});

export async function POST(req: NextRequest) {
  // حدود صارمة — الرسائل تكلّف
  const rl = rateLimit(req, { limit: 3, windowMs: 60_000, prefix: "otp:email:send" });
  if (!rl.ok) {
    return NextResponse.json({ error: "محاولات كثيرة — انتظر دقيقة ثم أعد المحاولة" }, { status: 429 });
  }

  if (!emailOtpEnabled()) {
    return NextResponse.json({ error: "خدمة تأكيد البريد غير متاحة حالياً" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  // حد إضافي لكل بريد: 3 رموز كل 10 دقائق
  const recent = await prisma.emailOtp.count({
    where: { email, createdAt: { gt: new Date(Date.now() - 10 * 60_000) } },
  });
  if (recent >= 3) {
    return NextResponse.json({ error: "وصلت حد الإرسال لهذا البريد — حاول بعد 10 دقائق" }, { status: 429 });
  }

  const code = generateOtpCode();

  // رمز واحد نشط لكل بريد + تنظيف المنتهي
  await prisma.emailOtp.deleteMany({
    where: { OR: [{ email }, { expiresAt: { lt: new Date() } }] },
  });
  await prisma.emailOtp.create({
    data: {
      email,
      codeHash: hashOtpCode(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
    },
  });

  try {
    const { devCode } = await sendOtpEmail(email, code);
    return NextResponse.json({
      ok: true,
      ttlMinutes: OTP_TTL_MINUTES,
      ...(devCode ? { devCode } : {}),
    });
  } catch (e) {
    await prisma.emailOtp.deleteMany({ where: { email } });
    console.error("Email OTP send error:", e);
    return NextResponse.json({ error: "تعذّر إرسال الرسالة — حاول لاحقاً" }, { status: 502 });
  }
}
