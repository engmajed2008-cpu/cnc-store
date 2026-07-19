export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { verifyAdminRequest } from "@/lib/db/adminAuth";

const Schema = z.object({
  name: z.string().min(2, "الاسم قصير جداً").max(80),
});

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });

  const updated = await prisma.adminUser.update({
    where: { id: admin.id },
    data:  { name: parsed.data.name },
    select: { email: true, name: true, role: true },
  });

  return NextResponse.json({ ok: true, admin: updated });
}
