/**
 * POST /api/partners/upload-cr — رفع مستندات الشريك (multipart/form-data، حقل "file")
 *
 * حقل "kind" اختياري: "cr" (السجل التجاري — الافتراضي) | "owner-id" (صورة هوية المالك).
 * متاح قبل إنشاء الحساب (نموذج الانضمام بخطوة واحدة) — لذا الحدود صارمة.
 * يعيد storagePath + إثباتاً موقَّعاً (docProof) يُرسل مع نموذج الانضمام
 * حتى لا يُمكن تمرير مسار ملف لم يُرفع عبر هذا المسار.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import {
  uploadPartnerCrDoc,
  ALLOWED_CR_DOC_TYPES,
  MAX_CR_DOC_SIZE,
} from "@/lib/storage/supabaseStorage";
import { signValueProof } from "@/lib/otp";

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 5, windowMs: 60_000, prefix: "partners:upload-cr" });
  if (!rl.ok) {
    return NextResponse.json({ error: "محاولات كثيرة — انتظر دقيقة" }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "صيغة الطلب غير صالحة" }, { status: 400 });
  }

  const kind = form.get("kind") === "owner-id" ? "owner-id" : "cr";
  const docLabel = kind === "owner-id" ? "صورة هوية المالك" : "صورة السجل التجاري";

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: `أرفق ${docLabel}` }, { status: 400 });
  }
  if (!ALLOWED_CR_DOC_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "صيغة الملف غير مدعومة — المسموح: JPG أو PNG أو WEBP أو PDF" },
      { status: 400 }
    );
  }
  if (file.size > MAX_CR_DOC_SIZE) {
    return NextResponse.json({ error: "حجم الملف يتجاوز 5MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { storagePath } = await uploadPartnerCrDoc(
    buffer,
    file.name || (kind === "owner-id" ? "owner-id" : "cr-doc"),
    file.type,
    kind === "owner-id" ? "owner-ids" : "cr-docs"
  );

  return NextResponse.json(
    {
      ok: true,
      storagePath,
      docProof: signValueProof(storagePath, 60), // صالح ساعة — كافٍ لإكمال النموذج
      fileName: file.name,
    },
    { status: 201 }
  );
}
