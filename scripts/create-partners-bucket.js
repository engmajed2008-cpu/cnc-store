/**
 * إنشاء bucket خاص لمستندات الشركاء (السجل التجاري) — idempotent
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const envText = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"]*)"?\s*$/);
  if (m) env[m[1]] = m[2];
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  const { data: buckets } = await admin.storage.listBuckets();
  if (buckets?.some((b) => b.name === "partners")) {
    console.log("bucket 'partners' موجود مسبقاً");
    return;
  }
  const { error } = await admin.storage.createBucket("partners", {
    public: false, // خاص — الوصول بروابط موقّتة فقط
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  });
  if (error) throw new Error(error.message);
  console.log("✅ أُنشئ bucket 'partners' (خاص، حد 5MB، صور/PDF)");
}

main().catch((e) => { console.error("فشل:", e.message); process.exit(1); });
