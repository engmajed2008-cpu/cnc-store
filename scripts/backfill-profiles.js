/**
 * scripts/backfill-profiles.js
 * إنشاء صفوف profiles للحسابات المسجَّلة قبل تفعيل trigger التسجيل.
 * idempotent — يتخطى من لديه صف بالفعل.
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { PrismaClient } = require("@prisma/client");

const envText = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"]*)"?\s*$/);
  if (m) env[m[1]] = m[2];
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const prisma = new PrismaClient();

async function main() {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(error.message);

  for (const u of data.users) {
    const existing = await prisma.profile.findUnique({ where: { id: u.id } });
    if (existing) {
      console.log(`⏭️  ${u.email} — لديه profile بالفعل (${existing.role})`);
      continue;
    }
    await prisma.profile.create({
      data: {
        id: u.id,
        role: "CUSTOMER",
        fullName: u.user_metadata?.full_name ?? u.user_metadata?.name ?? "",
        email: u.email,
      },
    });
    console.log(`✅ ${u.email} — أُنشئ profile (CUSTOMER)`);
  }
}

main()
  .catch((e) => { console.error("فشل:", e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
