/**
 * GET    /api/admin/products/[id]
 * PATCH  /api/admin/products/[id]
 * DELETE /api/admin/products/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { withAdminAuth } from "@/lib/db/adminAuth";
import prisma from "@/lib/db/prisma";
import { deleteStorageFile, BUCKETS } from "@/lib/storage/supabaseStorage";

// ─── GET single product ──────────────────────────────────────
export const GET = withAdminAuth(async (_req, { params }) => {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      category:     { select: { id: true, slug: true, nameAr: true, nameEn: true } },
      images:       { orderBy: { sortOrder: "asc" } },
      material:     { select: { id: true, slug: true, nameAr: true, nameEn: true } },
      orderItems:   { take: 5, orderBy: { order: { createdAt: "desc" } }, include: { order: { select: { orderNumber: true, createdAt: true } } } },
    },
  });

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    product: { ...product, basePriceSAR: product.basePriceSAR ? Number(product.basePriceSAR) : null },
  });
});

// ─── PATCH update product ────────────────────────────────────
const UpdateSchema = z.object({
  nameAr:        z.string().min(1).optional(),
  nameEn:        z.string().min(1).optional(),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  taglineAr:     z.string().optional(),
  taglineEn:     z.string().optional(),
  categoryId:    z.string().optional(),
  materialId:    z.string().nullable().optional(),
  basePriceSAR:  z.number().positive().nullable().optional(),
  isCustomPrice: z.boolean().optional(),
  tags:          z.array(z.string()).optional(),
  status:        z.enum(["draft","active","archived"]).optional(),
  isFeatured:    z.boolean().optional(),
  isBestSeller:  z.boolean().optional(),
  isNew:         z.boolean().optional(),
  sortOrder:     z.number().int().optional(),
  defaultFinish: z.enum(["raw","painted","powder","anodized"]).nullable().optional(),
  metaTitleAr:   z.string().optional(),
  metaTitleEn:   z.string().optional(),
  metaDescAr:    z.string().optional(),
  metaDescEn:    z.string().optional(),
});

export const PATCH = withAdminAuth(async (req, { params }) => {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const product = await prisma.product.update({
    where: { id: params.id },
    data: { ...parsed.data, updatedAt: new Date() },
  });

  revalidateTag("products");

  return NextResponse.json({
    product: { ...product, basePriceSAR: product.basePriceSAR ? Number(product.basePriceSAR) : null },
  });
});

// ─── DELETE (archive) product ────────────────────────────────
export const DELETE = withAdminAuth(
  async (_req, { params }) => {
    // Soft delete: set status = archived
    // Hard delete only if no order items reference this product
    const orderCount = await prisma.orderItem.count({ where: { productId: params.id } });

    if (orderCount > 0) {
      // Soft delete
      await prisma.product.update({ where: { id: params.id }, data: { status: "archived" } });
      revalidateTag("products");
      return NextResponse.json({ message: "Product archived (has order history)" });
    }

    // Hard delete — also remove images from Supabase Storage
    const images = await prisma.productImage.findMany({ where: { productId: params.id } });
    await Promise.allSettled(
      images.map((img) => deleteStorageFile(BUCKETS.PRODUCTS, img.storagePath))
    );
    await prisma.product.delete({ where: { id: params.id } });

    revalidateTag("products");
    return NextResponse.json({ message: "Product permanently deleted" });
  },
  ["super_admin", "admin"] // Only these roles can delete
);
