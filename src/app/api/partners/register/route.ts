/**
 * POST /api/partners/register — تسجيل شريك جديد بخطوة واحدة (حساب + طلب انضمام)
 *
 * للزوار غير المسجَّلين: ينشئ حساب Auth (مؤكَّد البريد) عبر service role —
 * الـ trigger ينشئ صف profiles — ثم يسجّل طلب الانضمام بـ verified: false.
 * التفعيل يبقى يدوياً من إدارة المنصة.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/db/prisma";
import { rateLimit } from "@/lib/rateLimit";
import {
  otpEnabled,
  verifyPhoneProof,
  verifyValueProof,
  emailOtpEnabled,
  verifyEmailProof,
  isStrongPassword,
  STRONG_PASSWORD_MESSAGE,
} from "@/lib/otp";

const registerSchema = z.object({
  fullName: z.string().min(2, "الاسم مطلوب").max(100),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  emailProof: z.string().optional(), // إثبات تأكيد البريد — إلزامي عندما تكون الخدمة مفعّلة
  password: z.string().max(72).refine(isStrongPassword, STRONG_PASSWORD_MESSAGE),
  entityType: z.enum(["AD_AGENCY", "MANUFACTURER", "SUPPLIER"]),
  companyName: z.string().min(2, "اسم المنشأة مطلوب").max(150),
  crNumberType: z.enum(["CR", "UNIFIED"]).default("CR"), // سجل تجاري | الرقم الموحد
  crNumber: z.string().regex(/^\d{10}$/, "رقم السجل التجاري أو الرقم الموحد: 10 أرقام"),
  crDocPath: z.string().min(1, "صورة السجل التجاري مطلوبة"),
  crDocProof: z.string().min(1, "صورة السجل التجاري مطلوبة"),
  ownerIdNumber: z.string().regex(/^[12]\d{9}$/, "رقم هوية المالك: 10 أرقام تبدأ بـ1 أو 2"),
  ownerIdDocPath: z.string().min(1, "صورة هوية المالك مطلوبة"),
  ownerIdDocProof: z.string().min(1, "صورة هوية المالك مطلوبة"),
  pledgeAccepted: z.literal(true, { errorMap: () => ({ message: "يجب الموافقة على التعهد أولاً" }) }),
  amanaId: z.string().min(1, "الأمانة مطلوبة"),
  cityId: z.string().min(1, "المدينة مطلوبة"),
  phone: z.string().regex(/^\+9665\d{8}$/, "رقم الجوال يجب أن يكون بالصيغة الدولية ‎+9665XXXXXXXX"),
  phoneProof: z.string().optional(), // إثبات تحقق OTP — إلزامي عندما تكون الخدمة مفعّلة
});

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  // إنشاء حسابات — حد صارم لكل IP
  const rl = rateLimit(req, { limit: 3, windowMs: 60_000, prefix: "partners:register" });
  if (!rl.ok) {
    return NextResponse.json({ error: "محاولات كثيرة — حاول بعد دقيقة" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // عندما تكون خدمة OTP مفعّلة، لا يُقبل جوال غير مُتحقَّق منه
  const phoneVerified = otpEnabled()
    ? Boolean(input.phoneProof && verifyPhoneProof(input.phoneProof, input.phone))
    : false;
  if (otpEnabled() && !phoneVerified) {
    return NextResponse.json({ error: "يجب التحقق من رقم الجوال أولاً" }, { status: 400 });
  }

  // تأكيد البريد إلزامي عندما تكون الخدمة مفعّلة
  if (emailOtpEnabled() && !(input.emailProof && verifyEmailProof(input.emailProof, input.email))) {
    return NextResponse.json({ error: "يجب تأكيد البريد الإلكتروني أولاً (زر إرسال رمز التأكيد)" }, { status: 400 });
  }

  // الرقم الموحد للمنشأة يبدأ بـ7 دائماً
  if (input.crNumberType === "UNIFIED" && !input.crNumber.startsWith("7")) {
    return NextResponse.json({ error: "الرقم الموحد للمنشأة يبدأ بالرقم 7" }, { status: 400 });
  }

  // المستندات يجب أن تكون مرفوعة عبر /api/partners/upload-cr
  if (!verifyValueProof(input.crDocProof, input.crDocPath)) {
    return NextResponse.json({ error: "أعد رفع صورة السجل التجاري" }, { status: 400 });
  }
  if (!verifyValueProof(input.ownerIdDocProof, input.ownerIdDocPath)) {
    return NextResponse.json({ error: "أعد رفع صورة هوية المالك" }, { status: 400 });
  }

  // المدينة يجب أن تتبع الأمانة المختارة
  const cityRow = await prisma.city.findFirst({
    where: { id: input.cityId, amanaId: input.amanaId, isActive: true, amana: { isActive: true } },
  });
  if (!cityRow) {
    return NextResponse.json({ error: "المدينة غير صالحة أو لا تتبع الأمانة المختارة" }, { status: 400 });
  }

  // إنشاء حساب Auth — الـ trigger ينشئ صف profiles بنفس المعرف
  const supabase = adminClient();
  const { data: created, error: authError } = await supabase.auth.admin.createUser({
    email: input.email.toLowerCase(),
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
  });

  if (authError) {
    const exists = /already|registered|exists/i.test(authError.message);
    return NextResponse.json(
      {
        error: exists
          ? "هذا البريد مسجَّل مسبقاً — سجّل دخولك ثم قدّم الطلب من نفس الصفحة"
          : "تعذّر إنشاء الحساب: " + authError.message,
        code: exists ? "EMAIL_EXISTS" : "AUTH_ERROR",
      },
      { status: exists ? 409 : 500 }
    );
  }

  const userId = created.user.id;

  try {
    // الـ trigger أنشأ الـ profile — نحدّث الجوال ونسجّل طلب الانضمام
    await prisma.profile.update({
      where: { id: userId },
      data: {
        phone: input.phone,
        fullName: input.fullName,
        phoneVerifiedAt: phoneVerified ? new Date() : null,
      },
    });

    const partnerDocs = {
      crNumber: input.crNumber,
      crNumberType: input.crNumberType,
      crDocPath: input.crDocPath,
      ownerIdNumber: input.ownerIdNumber,
      ownerIdDocPath: input.ownerIdDocPath,
      pledgeAcceptedAt: new Date(),
    };

    if (input.entityType === "SUPPLIER") {
      await prisma.supplierProfile.create({
        data: {
          profileId: userId,
          companyName: input.companyName,
          ...partnerDocs,
          city: cityRow.nameAr,
          amanaId: input.amanaId,
          verified: false,
        },
      });
    } else {
      await prisma.agencyProfile.create({
        data: {
          profileId: userId,
          companyName: input.companyName,
          ...partnerDocs,
          city: cityRow.nameAr,
          amanaId: input.amanaId,
          kind: input.entityType,
          verified: false,
        },
      });
    }
  } catch (e) {
    // فشل ما بعد إنشاء الحساب — نحذف حساب Auth حتى لا يبقى حساب بلا طلب
    await supabase.auth.admin.deleteUser(userId).catch(() => {});
    await prisma.profile.deleteMany({ where: { id: userId } }).catch(() => {});
    throw e;
  }

  return NextResponse.json(
    { ok: true, application: { type: input.entityType, verified: false } },
    { status: 201 }
  );
}
