/**
 * src/lib/storage/supabaseStorage.ts
 *
 * Thin wrapper around @supabase/storage-js for:
 *  - Product images  →  bucket: "products"
 *  - Order design files  →  bucket: "orders"
 *
 * Bucket policies (set in Supabase dashboard):
 *   products/ — public read, authenticated write
 *   orders/   — private (signed URLs only)
 */

import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────
// Client singleton (service-role key — server-side only)
// ─────────────────────────────────────────────────────────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // NEVER expose this to client
  { auth: { persistSession: false } }
);

// ─────────────────────────────────────────────────────────────
// Public client (anon key — safe for client components)
// ─────────────────────────────────────────────────────────────
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
export const BUCKETS = {
  PRODUCTS: "products",
  ORDERS:   "orders",
  PARTNERS: "partners", // مستندات الشركاء (سجل تجاري) — خاص، روابط موقّتة فقط
} as const;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml",
];

export const ALLOWED_DESIGN_TYPES = [
  "application/pdf",
  "application/octet-stream", // .dwg .dxf
  "image/svg+xml",
  "application/postscript",   // .ai .eps
];

export const MAX_IMAGE_SIZE  = 10 * 1024 * 1024; // 10 MB
export const MAX_DESIGN_SIZE = 50 * 1024 * 1024; // 50 MB

// ─────────────────────────────────────────────────────────────
// Upload product image
// ─────────────────────────────────────────────────────────────
export interface UploadResult {
  url:         string;
  storagePath: string;
}

export async function uploadProductImage(
  productId: string,
  file: File | Buffer,
  filename: string,
  mimeType: string
): Promise<UploadResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported image type: ${mimeType}`);
  }

  const ext        = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const storagePath = `${productId}/${uniqueName}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKETS.PRODUCTS)
    .upload(storagePath, file, {
      contentType: mimeType,
      upsert: false,
      cacheControl: "31536000", // 1 year — product images rarely change
    });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data } = supabaseAdmin.storage
    .from(BUCKETS.PRODUCTS)
    .getPublicUrl(storagePath);

  return { url: data.publicUrl, storagePath };
}

// ─────────────────────────────────────────────────────────────
// Upload order design file (private bucket)
// ─────────────────────────────────────────────────────────────
export async function uploadOrderDesignFile(
  orderId: string,
  file: File | Buffer,
  filename: string,
  mimeType: string
): Promise<{ storagePath: string; signedUrl: string }> {
  const sanitized   = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${orderId}/${Date.now()}-${sanitized}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKETS.ORDERS)
    .upload(storagePath, file, { contentType: mimeType, upsert: false });

  if (error) throw new Error(`Design file upload failed: ${error.message}`);

  // Generate a 24h signed URL for internal use
  const { data: signedData, error: signErr } = await supabaseAdmin.storage
    .from(BUCKETS.ORDERS)
    .createSignedUrl(storagePath, 86400);

  if (signErr) throw new Error(`Signed URL failed: ${signErr.message}`);

  return { storagePath, signedUrl: signedData.signedUrl };
}

// ─────────────────────────────────────────────────────────────
// Upload partner CR document (private bucket "partners")
// ─────────────────────────────────────────────────────────────
export const ALLOWED_CR_DOC_TYPES = [
  "image/jpeg", "image/png", "image/webp", "application/pdf",
];
export const MAX_CR_DOC_SIZE = 5 * 1024 * 1024; // 5 MB

export async function uploadPartnerCrDoc(
  file: Buffer,
  filename: string,
  mimeType: string,
  folder: "cr-docs" | "owner-ids" = "cr-docs" // مستند السجل التجاري | صورة هوية المالك
): Promise<{ storagePath: string }> {
  if (!ALLOWED_CR_DOC_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported CR document type: ${mimeType}`);
  }
  if (file.byteLength > MAX_CR_DOC_SIZE) {
    throw new Error("CR document exceeds 5MB limit");
  }

  const sanitized   = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const rand        = Math.random().toString(36).slice(2, 10);
  const storagePath = `${folder}/${Date.now()}-${rand}/${sanitized}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKETS.PARTNERS)
    .upload(storagePath, file, { contentType: mimeType, upsert: false });

  if (error) throw new Error(`CR document upload failed: ${error.message}`);
  return { storagePath };
}

// ─────────────────────────────────────────────────────────────
// Delete a file
// ─────────────────────────────────────────────────────────────
export async function deleteStorageFile(
  bucket: string,
  storagePath: string
): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .remove([storagePath]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

// ─────────────────────────────────────────────────────────────
// Generate a fresh signed URL for order files (admin view)
// ─────────────────────────────────────────────────────────────
export async function getSignedUrl(
  bucket: string,
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error) throw new Error(`Signed URL error: ${error.message}`);
  return data.signedUrl;
}
