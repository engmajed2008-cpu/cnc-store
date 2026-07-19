/**
 * scripts/remove-partner.js — حذف عضوية شريك وإعادة الحساب عميلاً
 * الاستخدام: node scripts/remove-partner.js <email>
 */
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) { console.error("الاستخدام: node scripts/remove-partner.js <email>"); process.exit(1); }

  const profile = await p.profile.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (!profile) { console.error(`لا يوجد profile بالبريد: ${email}`); process.exit(1); }

  const ag = await p.agencyProfile.deleteMany({ where: { profileId: profile.id } });
  const sup = await p.supplierProfile.deleteMany({ where: { profileId: profile.id } });
  await p.profile.update({ where: { id: profile.id }, data: { role: "CUSTOMER" } });

  console.log(`✅ ${email}: حُذف ${ag.count} ملف وكالة و ${sup.count} ملف مورد — الدور أعيد إلى CUSTOMER`);
}

main().catch((e) => { console.error("فشل:", e.message); process.exitCode = 1; }).finally(() => p.$disconnect());
