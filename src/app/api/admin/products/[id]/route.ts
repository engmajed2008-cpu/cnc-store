import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { deleteStorageFile } from "@/lib/storage";
import { BUCKETS } from "@/lib/constants";

// GET /api/admin/products/[id]
export const GET = requireAdmin(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: { select: { id: true, slug: true, nameAr: true, nameEn: true } },
        images: { orderBy: { sortOrder: "asc" } },
        orderItems: {
          take: 5,
          orderBy: { order: { createdAt: "desc" } },
          include: { order: { select: { orderNumber: true, createdAt: true } } },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  },
  ["super_admin", "admin", "manager", "viewer"]
);

// PATCH /api/admin/products/[id]
export const PATCH = requireAdmin(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const body = await req.json();

    const product = await prisma.product.update({
      where: { id: params.id },
      data: body,
      include: {
        category: { select: { id: true, slug: true, nameAr: true, nameEn: true } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    revalidateTag("products");
    return NextResponse.json(product);
  },
  ["super_admin", "admin"]
);

// DELETE /api/admin/products/[id]
export const DELETE = requireAdmin(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const images = await prisma.productImage.findMany({ where: { productId: params.id } });
    await Promise.allSettled(
      images.map((img) => deleteStorageFile(BUCKETS.PRODUCTS, img.storagePath))
    );

    await prisma.product.delete({ where: { id: params.id } });

    revalidateTag("products");
    return NextResponse.json({ message: "Product permanently deleted" });
  },
  ["super_admin", "admin"]
);