/**
 * POST /api/admin/login — دخول مشرفي المنصة (AdminUser + bcrypt)
 * ينشئ جلسة JWT في كوكي httpOnly باسم e3lani_admin (يقرأها withAdminAuth).
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db/prisma";
import { createAdminSession } from "@/lib/db/adminAuth";
import { rateLimit } from "@/lib/rateLimit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  // 5 محاولات بالدقيقة لكل IP — حماية من التخمين
  const rl = rateLimit(req, { limit: 5, windowMs: 60_000, prefix: "admin:login" });
  if (!rl.ok) {
    return NextResponse.json({ error: "محاولات كثيرة — حاول بعد دقيقة" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!admin || !admin.isActive) {
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  }

  const valid = await bcrypt.compare(parsed.data.password, admin.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  }

  const token = await createAdminSession(admin.id);
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  const res = NextResponse.json({
    ok: true,
    admin: { email: admin.email, name: admin.name, role: admin.role },
  });
  res.cookies.set("e3lani_admin", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 8 * 3600, // مطابق لمدة الجلسة في adminAuth
  });
  return res;
}
