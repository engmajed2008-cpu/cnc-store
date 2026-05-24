/**
 * POST /api/admin/upload
 *
 * Multipart upload endpoint for:
 *  - type=product_image   → uploads to Supabase products bucket, saves ProductImage row
 *  - type=order_design    → uploads to Supabase orders bucket (private), saves OrderFile row
 *
 * Protected: admin JWT required for product images
 * Order design files can be uploaded by customers (no auth needed) — rate-limited by Nginx
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/db/adminAuth";
import prisma from "@/lib/db/prisma";
import {
  uploadProductImage,
  uploadOrderDesignFile,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DESIGN_TYPES,
  MAX_IMAGE_SIZE,
  MAX_DESIGN_SIZE,
} from "@/lib/storage/supabaseStorage";

export const dynamic = "force-dynamic";

// Next.js 14 default body size limit is 4MB — increase for design files
export const maxDuration = 30; // seconds

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const uploadType = formData.get("type") as string;
    const file       = formData.get("file") as File | null;
    const entityId   = formData.get("entityId") as string | null; // productId or orderId

    // ── Validate input ───────────────────────────────────────
    if (!file || !uploadType || !entityId) {
      return NextResponse.json(
        { error: "Missing required fields: file, type, entityId" },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────
    // Product image upload — requires admin auth
    // ─────────────────────────────────────────────────────────
    if (uploadType === "product_image") {
      const admin = await verifyAdminRequest(req);
      if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Unsupported type: ${file.type}. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}` },
          { status: 422 }
        );
      }

      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: `File too large. Max: ${MAX_IMAGE_SIZE / 1024 / 1024} MB` },
          { status: 422 }
        );
      }

      // Check product exists
      const product = await prisma.product.findUnique({ where: { id: entityId } });
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const { url, storagePath } = await uploadProductImage(
        entityId, buffer, file.name, file.type
      );

      // Get sort order (append after existing)
      const existingCount = await prisma.productImage.count({ where: { productId: entityId } });

      // Save to DB
      const imageRow = await prisma.productImage.create({
        data: {
          productId:   entityId,
          url,
          storagePath,
          isPrimary:   existingCount === 0, // first image = primary
          sortOrder:   existingCount,
        },
      });

      return NextResponse.json({ image: imageRow }, { status: 201 });
    }

    // ─────────────────────────────────────────────────────────
    // Order design file upload — customer-facing, no auth required
    // ─────────────────────────────────────────────────────────
    if (uploadType === "order_design") {
      if (!ALLOWED_DESIGN_TYPES.includes(file.type) && !file.name.match(/\.(dwg|dxf|ai|eps|svg|pdf)$/i)) {
        return NextResponse.json(
          { error: "Unsupported design file format. Accepted: DWG, DXF, PDF, AI, SVG, EPS" },
          { status: 422 }
        );
      }

      if (file.size > MAX_DESIGN_SIZE) {
        return NextResponse.json(
          { error: `File too large. Max: ${MAX_DESIGN_SIZE / 1024 / 1024} MB` },
          { status: 422 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const { storagePath, signedUrl } = await uploadOrderDesignFile(
        entityId, buffer, file.name, file.type
      );

      // Save to DB
      const fileRow = await prisma.orderFile.create({
        data: {
          orderId:     entityId,
          fileName:    file.name,
          storagePath,
          fileSize:    file.size,
          mimeType:    file.type,
        },
      });

      return NextResponse.json(
        { file: fileRow, signedUrl },
        { status: 201 }
      );
    }

    return NextResponse.json({ error: `Unknown upload type: ${uploadType}` }, { status: 400 });

  } catch (err: any) {
    console.error("[POST /api/admin/upload]", err);
    return NextResponse.json(
      { error: err.message ?? "Upload failed" },
      { status: 500 }
    );
  }
}
