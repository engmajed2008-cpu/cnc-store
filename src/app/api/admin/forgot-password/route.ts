export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { generateOtpCode, hashOtpCode, sendOtpEmail, OTP_TTL_MINUTES, emailOtpEnabled } from "@/lib/otp";

const Schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 3, windowMs: 60_000, prefix: "admin:forgot" });
  if (!rl.ok) return NextResponse.json({ error: "محاولات كثيرة — انتظر دقيقة" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "بريد غير صالح" }, { status: 400 });

  const email = parsed.data.email.toLowerCase();

  // لا نكشف إن كان البريد موجوداً أم لا
  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return NextResponse.json({ ok: true, ttlMinutes: OTP_TTL_MINUTES });
  }

  const code = generateOtpCode();

  await prisma.emailOtp.deleteMany({ where: { OR: [{ email }, { expiresAt: { lt: new Date() } }] } });
  await prisma.emailOtp.create({
    data: { email, codeHash: hashOtpCode(code), expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000) },
  });

  // إذا كانت خدمة الإيميل متاحة — أرسل. وإلا أعد الكود في dev للاختبار
  if (emailOtpEnabled()) {
    try { await sendOtpEmail(email, code); } catch { /* تابع */ }
    return NextResponse.json({ ok: true, ttlMinutes: OTP_TTL_MINUTES });
  } else {
    return NextResponse.json({ ok: true, ttlMinutes: OTP_TTL_MINUTES, devCode: code });
  }
}
