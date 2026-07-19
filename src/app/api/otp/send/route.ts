/**
 * /api/otp/send
 * GET  — حالة خدمة التحقق: { enabled } (هل يوجد مزوّد SMS مهيأ؟)
 * POST — إرسال رمز تحقق إلى جوال سعودي بالصيغة الدولية { phone: "+9665XXXXXXXX" }
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { rateLimit } from "@/lib/rateLimit";
import {
  generateOtpCode,
  hashOtpCode,
  otpEnabled,
  sendOtpSms,
  OTP_TTL_MINUTES,
} from "@/lib/otp";

export async function GET() {
  return NextResponse.json({ enabled: otpEnabled() });
}

const sendSchema = z.object({
  phone: z.string().regex(/^\+9665\d{8}$/, "رقم الجوال يجب أن يكون بالصيغة الدولية ‎+9665XXXXXXXX"),
});

export async function POST(req: NextRequest) {
  // حدود صارمة — الرسائل تكلّف
  const rl = rateLimit(req, { limit: 3, windowMs: 60_000, prefix: "otp:send" });
  if (!rl.ok) {
    return NextResponse.json({ error: "محاولات كثيرة — انتظر دقيقة ثم أعد المحاولة" }, { status: 429 });
  }

  if (!otpEnabled()) {
    return NextResponse.json({ error: "خدمة التحقق غير متاحة حالياً" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" }, { status: 400 });
  }
  const { phone } = parsed.data;

  // حد إضافي لكل رقم: 3 رموز كل 10 دقائق
  const recent = await prisma.phoneOtp.count({
    where: { phone, createdAt: { gt: new Date(Date.now() - 10 * 60_000) } },
  });
  if (recent >= 3) {
    return NextResponse.json({ error: "وصلت حد الإرسال لهذا الرقم — حاول بعد 10 دقائق" }, { status: 429 });
  }

  const code = generateOtpCode();

  // رمز واحد نشط لكل رقم + تنظيف المنتهي
  await prisma.phoneOtp.deleteMany({
    where: { OR: [{ phone }, { expiresAt: { lt: new Date() } }] },
  });
  await prisma.phoneOtp.create({
    data: {
      phone,
      codeHash: hashOtpCode(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
    },
  });

  try {
    const { devCode } = await sendOtpSms(phone, code);
    return NextResponse.json({
      ok: true,
      ttlMinutes: OTP_TTL_MINUTES,
      ...(devCode ? { devCode } : {}),
    });
  } catch (e) {
    await prisma.phoneOtp.deleteMany({ where: { phone } });
    console.error("OTP send error:", e);
    return NextResponse.json({ error: "تعذّر إرسال الرسالة — حاول لاحقاً" }, { status: 502 });
  }
}
