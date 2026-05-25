export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/db/adminAuth";
import prisma from "@/lib/db/prisma";

export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export const PATCH = withAdminAuth(async (req: NextRequest, { params, admin }: any) => {
  const { id } = params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const current = await prisma.material.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.material.update({
    where: { id },
    data: { ...body, updatedAt: new Date() },
  });

  return NextResponse.json({ material: updated });
});