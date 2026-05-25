import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAdminAuth } from "@/lib/db/adminAuth";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export const GET = withAdminAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit  = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const status = searchParams.get("status");
  const search = searchParams.get("search") ?? "";

  const where = {
    ...(status && { status: status as any }),
    ...(search && {
      OR: [
        { orderNumber:  { contains: search, mode: "insensitive" as const } },
        { customerName: { contains: search, mode: "insensitive" as const } },
        { customerPhone:{ contains: search } },
      ],
    }),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where, skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: "desc" },
      include: { items: { select: { materialNameAr: true, totalPriceSAR: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ orders, pagination: { page, limit, total } });
});

const UpdateOrderSchema = z.object({
  status: z.enum(["pending","confirmed","in_progress","quality_check","ready","shipped","delivered","cancelled","refunded"]),
  note: z.string().default(""),
});

export const PATCH = withAdminAuth(async (req: NextRequest, { params, admin }: any) => {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = UpdateOrderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });

  const [order] = await prisma.$transaction([
    prisma.order.update({ where: { id: params.id }, data: { status: parsed.data.status } }),
    prisma.orderStatusHistory.create({
      data: { orderId: params.id, status: parsed.data.status, note: parsed.data.note, changedBy: admin.id },
    }),
  ]);

  return NextResponse.json({ order });
});
