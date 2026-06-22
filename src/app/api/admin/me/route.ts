export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/db/adminAuth";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.adminUser.findUnique({
    where: { id: admin.id },
    select: { email: true, name: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ admin: { email: user.email, name: user.name, role: user.role } });
}
