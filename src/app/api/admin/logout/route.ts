export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/db/adminAuth";
import prisma from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  const token = req.cookies.get("e3lani_admin")?.value;
  if (token) {
    await prisma.adminSession.deleteMany({ where: { token } }).catch(() => {});
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("e3lani_admin", "", { maxAge: 0, path: "/" });
  return res;
}
