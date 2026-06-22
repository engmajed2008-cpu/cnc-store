/**
 * src/lib/db/withAuth.ts
 *
 * Marketplace auth guard — Supabase Auth + profiles (mirror of withAdminAuth).
 *
 * Usage:
 *   export const POST = withAuth(["CUSTOMER"], async (req, { profile }) => { ... });
 *   export const GET  = withAuth(["AGENCY", "ADMIN"], async (req, { profile, params }) => { ... });
 *
 * SECURITY NOTE: Prisma connects as the postgres role and bypasses RLS —
 * role enforcement happens HERE in the API layer, not in RLS policies.
 */

import { NextRequest, NextResponse } from "next/server";
import type { Profile, UserRole } from "@prisma/client";
import prisma from "./prisma";
import { getAuthUser } from "@/lib/supabase/server";

type AuthedRouteHandler = (
  req: NextRequest,
  ctx: { params: Record<string, string>; profile: Profile }
) => Promise<NextResponse>;

export function withAuth(roles: UserRole[], handler: AuthedRouteHandler) {
  return async (req: NextRequest, ctx?: { params?: Record<string, string> }) => {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    const profile = await prisma.profile.findUnique({ where: { id: user.id } });
    if (!profile) {
      // Auth user exists but no profiles row (trigger predates account?)
      return NextResponse.json(
        { error: "لا يوجد ملف مستخدم مرتبط بهذا الحساب" },
        { status: 403 }
      );
    }

    if (roles.length > 0 && !roles.includes(profile.role)) {
      return NextResponse.json(
        { error: "ليست لديك صلاحية الوصول إلى هذا المورد" },
        { status: 403 }
      );
    }

    return handler(req, { params: ctx?.params ?? {}, profile });
  };
}
