/**
 * /api/partners — انضمام الشركاء (وكالات / منشآت صناعة / موردو مواد)
 *
 * POST — (أي مستخدم مسجَّل) تقديم طلب انضمام بنوع المنشأة:
 *        AD_AGENCY (وكالة دعاية وإعلان) | MANUFACTURER (منشأة صناعة) | SUPPLIER (مورد مواد)
 *        يُنشأ الملف بـ verified: false — التفعيل يدوي من إدارة المنصة فقط.
 * GET  — حالة طلب/عضوية الشريك الحالية للمستخدم.
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { withAuth } from "@/lib/db/withAuth";
import { rateLimit } from "@/lib/rateLimit";
import { otpEnabled, verifyPhoneProof, verifyValueProof, emailOtpEnabled, verifyEmailProof } from "@/lib/otp";

const applySchema = z.object({
  entityType: z.enum(["AD_AGENCY", "MANUFACTURER", "SUPPLIER"]),
  fullName: z.string().min(2, "اسم المسؤول مطلوب").max(100),
  phone: z.string().regex(/^\+9665\d{8}$/, "رقم الجوال يجب أن يكون بالصيغة الدولية ‎+9665XXXXXXXX"),
  phoneProof: z.string().optional(), // إثبات تحقق OTP — إلزامي عندما تكون الخدمة مفعّلة
  emailProof: z.string().optional(), // إثبات تأكيد البريد (يشمل حسابات Google) — إلزامي عندما تكون الخدمة مفعّلة
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
});

/** التحقق من الأمانة والمدينة التابعة لها — يعيد المدينة أو null. */
async function resolveCity(amanaId: string, cityId: string) {
  return prisma.city.findFirst({
    where: { id: cityId, amanaId, isActive: true, amana: { isActive: true } },
  });
}

// أي مستخدم مسجَّل يمكنه التقديم (CUSTOMER هو الدور الافتراضي بعد التسجيل)
export const POST = withAuth(["CUSTOMER"], async (req, { profile }) => {
  const rl = rateLimit(req, { limit: 5, windowMs: 60_000, prefix: "partners:apply" });
  if (!rl.ok) {
    return NextResponse.json({ error: "محاولات كثيرة — حاول لاحقاً" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "بيانات غير صالحة", details: parsed.error.flatten() },
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

  // تأكيد البريد إلزامي (حتى لحسابات Google) عندما تكون الخدمة مفعّلة
  if (emailOtpEnabled() && profile.email) {
    if (!(input.emailProof && verifyEmailProof(input.emailProof, profile.email))) {
      return NextResponse.json({ error: "يجب تأكيد البريد الإلكتروني أولاً (زر إرسال رمز التأكيد)" }, { status: 400 });
    }
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

  const cityRow = await resolveCity(input.amanaId, input.cityId);
  if (!cityRow) {
    return NextResponse.json({ error: "المدينة غير صالحة أو لا تتبع الأمانة المختارة" }, { status: 400 });
  }

  // طلب واحد لكل حساب — لا ازدواجية بين الجدولين
  const [existingAgency, existingSupplier] = await Promise.all([
    prisma.agencyProfile.findUnique({ where: { profileId: profile.id } }),
    prisma.supplierProfile.findUnique({ where: { profileId: profile.id } }),
  ]);
  if (existingAgency || existingSupplier) {
    return NextResponse.json(
      { error: "لديك طلب انضمام مسجَّل مسبقاً على هذا الحساب" },
      { status: 409 }
    );
  }

  // اسم المسؤول وجواله يُعتمدان في ملف الحساب (هوية الدخول للوحة التحكم)
  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      fullName: input.fullName,
      phone: input.phone,
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
    const supplier = await prisma.supplierProfile.create({
      data: {
        profileId: profile.id,
        companyName: input.companyName,
        ...partnerDocs,
        city: cityRow.nameAr,
        amanaId: input.amanaId,
        verified: false,
      },
    });
    return NextResponse.json(
      { application: { type: "SUPPLIER", id: supplier.id, verified: false } },
      { status: 201 }
    );
  }

  const agency = await prisma.agencyProfile.create({
    data: {
      profileId: profile.id,
      companyName: input.companyName,
      ...partnerDocs,
      city: cityRow.nameAr,
      amanaId: input.amanaId,
      kind: input.entityType, // AD_AGENCY | MANUFACTURER
      verified: false,
    },
  });
  return NextResponse.json(
    { application: { type: input.entityType, id: agency.id, verified: false } },
    { status: 201 }
  );
});

// حالة العضوية/الطلب — لأي دور (يشمل من رُقّي بالفعل)
export const GET = withAuth(["CUSTOMER", "AGENCY", "SUPPLIER", "ADMIN"], async (req, { profile }) => {
  const rl = rateLimit(req, { limit: 30, windowMs: 60_000, prefix: "partners:me" });
  if (!rl.ok) {
    return NextResponse.json({ error: "محاولات كثيرة — حاول لاحقاً" }, { status: 429 });
  }

  const [agency, supplier] = await Promise.all([
    prisma.agencyProfile.findUnique({
      where: { profileId: profile.id },
      select: { id: true, companyName: true, kind: true, verified: true, createdAt: true },
    }),
    prisma.supplierProfile.findUnique({
      where: { profileId: profile.id },
      select: { id: true, companyName: true, verified: true, createdAt: true },
    }),
  ]);

  if (agency) {
    return NextResponse.json({
      application: { type: agency.kind, ...agency, role: profile.role },
    });
  }
  if (supplier) {
    return NextResponse.json({
      application: { type: "SUPPLIER", ...supplier, role: profile.role },
    });
  }
  return NextResponse.json({ application: null });
});
