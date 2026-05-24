/**
 * Admin Products API
 *
 * GET    /api/admin/products           — paginated list
 * POST   /api/admin/products           — create new product
 * GET    /api/admin/products/[id]      — single product with images
 * PATCH  /api/admin/products/[id]      — update fields
 * DELETE /api/admin/products/[id]      — soft delete (status=archived)
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { withAdminAuth } from "@/lib/db/adminAuth";
import prisma from "@/lib/db/prisma";

// ─────────────────────────────────────────────────────────────
// Validation schemas
// ─────────────────────────────────────────────────────────────
const CreateProductSchema = z.object({
  slug:          z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  categoryId:    z.string().min(1),
  nameAr:        z.string().min(1).max(200),
  nameEn:        z.string().min(1).max(200),
  descriptionAr: z.string().default(""),
  descriptionEn: z.string().default(""),
  taglineAr:     z.string().default(""),
  taglineEn:     z.string().default(""),
  basePriceSAR:  z.number().positive().nullable().default(null),
  isCustomPrice: z.boolean().default(false),
  materialId:    z.string().nullable().default(null),
  defaultFinish: z.enum(["raw","painted","powder","anodized"]).nullable().default(null),
  tags:          z.array(z.string()).default([]),
  status:        z.enum(["draft","active","archived"]).default("draft"),
  isFeatured:    z.boolean().default(false),
  isBestSeller:  z.boolean().default(false),
  isNew:         z.boolean().default(false),
  sortOrder:     z.number().int().default(0),
  metaTitleAr:   z.string().default(""),
  metaTitleEn:   z.string().default(""),
  metaDescAr:    z.string().default(""),
  metaDescEn:    z.string().default(""),
});

const UpdateProductSchema = CreateProductSchema.partial();

// ─────────────────────────────────────────────────────────────
// GET /api/admin/products
// ─────────────────────────────────────────────────────────────
export const GET = withAdminAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const page       = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit      = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const search     = searchParams.get("search") ?? "";
  const categoryId = searchParams.get("categoryId");
  const status     = searchParams.get("status");

  const where = {
    ...(search && {
      OR: [
        { nameAr: { contains: search, mode: "insensitive" as const } },
        { nameEn: { contains: search, mode: "insensitive" as const } },
        { slug:   { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(categoryId && { categoryId }),
    ...(status     && { status: status as any }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        category: { select: { slug: true, nameAr: true, nameEn: true } },
        images:   { where: { isPrimary: true }, take: 1 },
        _count:   { select: { orderItems: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const serialized = products.map((p) => ({
    ...p,
    basePriceSAR: p.basePriceSAR ? Number(p.basePriceSAR) : null,
  }));

  return NextResponse.json({
    products: serialized,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/admin/products
// ─────────────────────────────────────────────────────────────
export const POST = withAdminAuth(async (req) => {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = CreateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  // Check slug uniqueness
  const existing = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  const product = await prisma.product.create({ data: parsed.data as any });

  revalidateTag("products");

  return NextResponse.json({ product }, { status: 201 });
});
