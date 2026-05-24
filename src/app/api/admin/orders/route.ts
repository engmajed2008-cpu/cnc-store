/**
 * GET   /api/admin/orders        — paginated order list with filters
 * GET   /api/admin/orders/[id]   — single order with items + files
 * PATCH /api/admin/orders/[id]   — update status + add history note
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAdminAuth } from "@/lib/db/adminAuth";
import prisma from "@/lib/db/prisma";
import { getSignedUrl, BUCKETS } from "@/lib/storage/supabaseStorage";

// ─── GET /api/admin/orders ───────────────────────────────────
export const GET = withAdminAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit   = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const status  = searchParams.get("status");
  const search  = searchParams.get("search") ?? "";
  const dateFrom = searchParams.get("dateFrom");
  const dateTo   = searchParams.get("dateTo");

  const where = {
    ...(status && { status: status as any }),
    ...(search && {
      OR: [
        { orderNumber:    { contains: search, mode: "insensitive" as const } },
        { customerName:   { contains: search, mode: "insensitive" as const } },
        { customerPhone:  { contains: search } },
      ],
    }),
    ...(dateFrom && { createdAt: { gte: new Date(dateFrom) } }),
    ...(dateTo   && { createdAt: { lte: new Date(dateTo) } }),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { createdAt: "desc" },
      include: {
        items:   { select: { materialNameAr: true, materialNameEn: true, quantity: true, totalPriceSAR: true } },
        _count:  { select: { items: true, files: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  const serialized = orders.map((o) => ({
    ...o,
    subtotalSAR: Number(o.subtotalSAR),
    discountSAR: Number(o.discountSAR),
    shippingSAR: Number(o.shippingSAR),
    vatSAR:      Number(o.vatSAR),
    totalSAR:    Number(o.totalSAR),
    items: o.items.map((i) => ({ ...i, totalPriceSAR: Number(i.totalPriceSAR) })),
  }));

  return NextResponse.json({
    orders: serialized,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    // Status counts for tab badges
    counts: await getStatusCounts(),
  });
});

async function getStatusCounts() {
  const counts = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  return Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
}

// ─── GET /api/admin/orders/[id] ──────────────────────────────
export async function getOrder(req: NextRequest, id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items:         { include: { material: { select: { icon: true } } } },
      statusHistory: { orderBy: { createdAt: "desc" } },
      files:         true,
    },
  });

  if (!order) return null;

  // Generate signed URLs for design files (private bucket)
  const filesWithUrls = await Promise.all(
    order.files.map(async (f) => ({
      ...f,
      signedUrl: await getSignedUrl(BUCKETS.ORDERS, f.storagePath, 3600).catch(() => null),
    }))
  );

  return {
    ...order,
    subtotalSAR: Number(order.subtotalSAR),
    discountSAR: Number(order.discountSAR),
    shippingSAR: Number(order.shippingSAR),
    vatSAR:      Number(order.vatSAR),
    totalSAR:    Number(order.totalSAR),
    files: filesWithUrls,
    items: order.items.map((i) => ({
      ...i,
      widthCm:       Number(i.widthCm),
      heightCm:      Number(i.heightCm),
      unitPriceSAR:  Number(i.unitPriceSAR),
      totalPriceSAR: Number(i.totalPriceSAR),
    })),
  };
}

// ─── PATCH /api/admin/orders/[id] ────────────────────────────
const UpdateOrderSchema = z.object({
  status: z.enum([
    "pending","confirmed","in_progress","quality_check",
    "ready","shipped","delivered","cancelled","refunded",
  ]),
  note: z.string().default(""),
});

export const PATCH = withAdminAuth(async (req, { params, admin }) => {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = UpdateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const { status, note } = parsed.data;

  const [order] = await prisma.$transaction([
    prisma.order.update({
      where: { id: params.id },
      data: {
        status,
        ...(status === "delivered" && { completedAt: new Date() }),
        updatedAt: new Date(),
      },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId:   params.id,
        status,
        note,
        changedBy: admin.id,
      },
    }),
  ]);

  return NextResponse.json({ order, message: `Order status updated to ${status}` });
});
