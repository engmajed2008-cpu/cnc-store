/**
 * scripts/promote-anchor-agency.js
 *
 * ترقية حساب مسجَّل إلى وكالة المرساة (Anchor Agency).
 * الاستخدام:
 *   node scripts/promote-anchor-agency.js <email>
 *
 * يتطلب أن يكون الحساب مسجَّلاً مسبقاً عبر صفحة التسجيل
 * (الـ Trigger ينشئ صف profiles تلقائياً عند التسجيل).
 * idempotent — آمن لإعادة التشغيل.
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { PrismaClient } = require("@prisma/client");

const COMPANY_NAME = "مؤسسة القوافل العربية للمقاولات";
const AMANA_ID = "amana-jeddah";

// ── env ──────────────────────────────────────────────────────
const envText = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"]*)"?\s*$/);
  if (m) env[m[1]] = m[2];
}

const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("الاستخدام: node scripts/promote-anchor-agency.js <email>");
    process.exit(1);
  }

  // 1) العثور على مستخدم Auth بالبريد
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(`Auth listUsers: ${error.message}`);
  const user = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (!user) {
    console.error(`❌ لا يوجد مستخدم Auth بالبريد: ${email}`);
    console.error("   سجّل الحساب أولاً عبر /ar/register ثم أعد التشغيل.");
    process.exit(1);
  }
  console.log(`✅ مستخدم Auth موجود: ${user.email} (${user.id})`);

  // 2) التأكد من صف profiles (الـ Trigger ينشئه عند التسجيل)
  let profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (!profile) {
    // حساب أقدم من تفعيل الـ Trigger — ننشئ الصف يدوياً
    profile = await prisma.profile.create({
      data: {
        id: user.id,
        role: "CUSTOMER",
        fullName: user.user_metadata?.full_name ?? "",
        email: user.email,
      },
    });
    console.log("ℹ️  لم يكن هناك صف profiles (حساب سابق للـ Trigger) — أُنشئ الآن.");
  }

  // 3) الترقية إلى AGENCY
  await prisma.profile.update({
    where: { id: user.id },
    data: { role: "AGENCY" },
  });
  console.log("✅ الدور: AGENCY");

  // 4) ملف الوكالة — المرساة، موثَّقة، مرتبطة بأمانة جدة
  const agency = await prisma.agencyProfile.upsert({
    where: { profileId: user.id },
    update: {
      companyName: COMPANY_NAME,
      amanaId: AMANA_ID,
      isAnchor: true,
      verified: true,
      verifiedAt: new Date(),
    },
    create: {
      profileId: user.id,
      companyName: COMPANY_NAME,
      amanaId: AMANA_ID,
      isAnchor: true,
      verified: true,
      verifiedAt: new Date(),
    },
  });

  console.log(`✅ وكالة المرساة جاهزة: ${agency.companyName}`);
  console.log(`   amanaId: ${agency.amanaId} | isAnchor: ${agency.isAnchor} | verified: ${agency.verified}`);
  console.log("\n🎉 اكتملت الترقية — الوكالة تستطيع الآن سرد الطلبات وتقديم العروض.");
}

main()
  .catch((e) => {
    console.error("💥 فشل:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
