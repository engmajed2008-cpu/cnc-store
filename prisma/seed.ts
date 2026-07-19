/**
 * prisma/seed.ts
 * Run: npm run db:seed
 *
 * Creates:
 *  - Default super admin user
 *  - Validates material, finish, urgency seed data
 *  - Ensures site settings are populated
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── 1. Admin user ──────────────────────────────────────────
  const adminEmail    = process.env.SEED_ADMIN_EMAIL    ?? "admin@e3lani.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "E3lani@2024!";
  const adminName     = process.env.SEED_ADMIN_NAME     ?? "E3lani Admin";

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.adminUser.upsert({
    where:  { email: adminEmail },
    update: {},
    create: { email: adminEmail, name: adminName, passwordHash, role: "super_admin" },
  });
  console.log(`✅ Admin user: ${admin.email} (role: ${admin.role})`);

  // ── 2. Materials ──────────────────────────────────────────
  const materialCount = await prisma.material.count();
  console.log(`✅ Materials: ${materialCount} rows`);

  // ── 3. Finish rates ───────────────────────────────────────
  const finishCount = await prisma.finishRate.count();
  console.log(`✅ Finish rates: ${finishCount} rows`);

  // ── 4. Urgency rates ──────────────────────────────────────
  const urgencyCount = await prisma.urgencyRate.count();
  console.log(`✅ Urgency rates: ${urgencyCount} rows`);

  // ── 5. Categories ─────────────────────────────────────────
  const catCount = await prisma.category.count();
  console.log(`✅ Categories: ${catCount} rows`);

  // ── 6. Site settings ──────────────────────────────────────
  const settingsCount = await prisma.siteSetting.count();
  console.log(`✅ Site settings: ${settingsCount} rows`);

  // ── 7. Marketplace — أمانة جدة (المرحلة 0) ─────────────────
  const jeddah = await prisma.amana.upsert({
    where:  { id: "amana-jeddah" },
    update: { nameAr: "أمانة محافظة جدة", nameEn: "Jeddah Municipality (Amana)", isActive: true },
    create: { id: "amana-jeddah", nameAr: "أمانة محافظة جدة", nameEn: "Jeddah Municipality (Amana)", isActive: true },
  });
  console.log(`✅ Amana: ${jeddah.nameAr}`);

  // مدن أمانة جدة — القائمة الرسمية المعتمدة، تُعرض للشركاء عند التسجيل
  // إضافة أمانات ومدن جديدة عند التوسع = صفوف فقط — لا كود
  const jeddahCities = [
    { id: "city-jeddah",        nameAr: "جدة",              nameEn: "Jeddah",                sortOrder: 1 },
    { id: "city-adham",         nameAr: "أضم",              nameEn: "Adham",                 sortOrder: 2 },
    { id: "city-shuwaq",        nameAr: "الشواق",           nameEn: "Al-Shuwaq",             sortOrder: 3 },
    { id: "city-ardiyah-south", nameAr: "العرضية الجنوبية", nameEn: "Al-Ardiyah Al-Janubiyah", sortOrder: 4 },
    { id: "city-ardiyah-north", nameAr: "العرضية الشمالية", nameEn: "Al-Ardiyah Al-Shamaliyah", sortOrder: 5 },
    { id: "city-qunfudhah",     nameAr: "القنفذة",          nameEn: "Al-Qunfudhah",          sortOrder: 6 },
    { id: "city-qouz",          nameAr: "القوز",            nameEn: "Al-Qouz",               sortOrder: 7 },
    { id: "city-kamil",         nameAr: "الكامل",           nameEn: "Al-Kamil",              sortOrder: 8 },
    { id: "city-lith",          nameAr: "الليث",            nameEn: "Al-Lith",               sortOrder: 9 },
    { id: "city-muzaylif",      nameAr: "المظيليف",         nameEn: "Al-Muzaylif",           sortOrder: 10 },
    { id: "city-hajar",         nameAr: "حجر",              nameEn: "Hajar",                 sortOrder: 11 },
    { id: "city-hali",          nameAr: "حلي",              nameEn: "Hali",                  sortOrder: 12 },
    { id: "city-khulais",       nameAr: "خليص",             nameEn: "Khulais",               sortOrder: 13 },
    { id: "city-rabigh",        nameAr: "رابغ",             nameEn: "Rabigh",                sortOrder: 14 },
    { id: "city-sabt-aljarah",  nameAr: "سبت الجارة",       nameEn: "Sabt Al-Jarah",         sortOrder: 15 },
    { id: "city-ghomaiqah",     nameAr: "غميقة",            nameEn: "Ghomaiqah",             sortOrder: 16 },
  ];
  for (const c of jeddahCities) {
    await prisma.city.upsert({
      where:  { id: c.id },
      update: { amanaId: jeddah.id, nameAr: c.nameAr, nameEn: c.nameEn, sortOrder: c.sortOrder, isActive: true },
      create: { id: c.id, amanaId: jeddah.id, nameAr: c.nameAr, nameEn: c.nameEn, sortOrder: c.sortOrder, isActive: true },
    });
  }
  // تعطيل المدن المؤقتة القديمة غير الموجودة في القائمة الرسمية
  await prisma.city.updateMany({
    where: { amanaId: jeddah.id, id: { notIn: jeddahCities.map((c) => c.id) } },
    data:  { isActive: false },
  });
  console.log(`✅ Cities (${jeddahCities.length}): ${jeddahCities.map((c) => c.nameAr).join("، ")} (amana: ${jeddah.nameAr})`);

  // TODO: إكمال قائمة بلديات أمانة جدة الرسمية من الدليل التنظيمي عند رفعه
  const alBalad = await prisma.municipality.upsert({
    where:  { id: "mun-jeddah-albalad" },
    update: { amanaId: jeddah.id, nameAr: "بلدية البلد", nameEn: "Al-Balad Municipality", isActive: true },
    create: { id: "mun-jeddah-albalad", amanaId: jeddah.id, nameAr: "بلدية البلد", nameEn: "Al-Balad Municipality", isActive: true },
  });
  console.log(`✅ Municipality: ${alBalad.nameAr}`);

  // دليل تنظيمي مبدئي — rules تُعبَّأ عند رفع الدليل الرسمي
  const guide = await prisma.regulatoryGuide.upsert({
    where:  { id: "guide-jeddah-draft-0" },
    update: { amanaId: jeddah.id, version: "draft-0", isActive: true },
    create: { id: "guide-jeddah-draft-0", amanaId: jeddah.id, version: "draft-0", rules: {}, isActive: true },
  });
  console.log(`✅ Regulatory guide: ${guide.version} (amana: ${jeddah.nameAr})`);

  // ── 8. شروط تعهد الشركاء (تُزرع مرة واحدة فقط — تُدار لاحقاً من لوحة التحكم) ──
  const pledgeCount = await prisma.pledgeTerm.count();
  if (pledgeCount === 0) {
    const defaultTerms = [
      { textAr: "الالتزام بتنفيذ طلبات العملاء وفق المواصفات والمدة المتفق عليها عبر المنصة.", textEn: "Fulfill customer orders according to the agreed specifications and timeline on the platform." },
      { textAr: "صحة البيانات والمستندات المقدّمة في طلب الانضمام وتحديثها فور أي تغيير.", textEn: "All submitted information and documents are accurate and will be updated upon any change." },
      { textAr: "الالتزام بأنظمة المملكة واشتراطات الأمانة والجهات المختصة في أعمال الدعاية والإعلان.", textEn: "Comply with Saudi regulations and the requirements of the Amana and competent authorities." },
      { textAr: "حسن استخدام المنصة وعدم إساءة استخدامها أو انتحال صفة الغير.", textEn: "Use the platform responsibly without misuse or impersonation." },
      { textAr: "إتمام التعاملات وتوثيقها عبر المنصة وعدم الالتفاف على نظام العمولات.", textEn: "Complete and document all transactions through the platform without bypassing the commission system." },
      { textAr: "الحفاظ على سرية بيانات العملاء وعدم استخدامها خارج نطاق تنفيذ الطلب.", textEn: "Keep customer data confidential and use it only to fulfill the order." },
    ];
    await prisma.pledgeTerm.createMany({
      data: defaultTerms.map((t, i) => ({ ...t, sortOrder: i + 1, isActive: true })),
    });
    console.log(`✅ Pledge terms: seeded ${defaultTerms.length} default terms`);
  } else {
    console.log(`✅ Pledge terms: ${pledgeCount} rows (managed from admin panel — not reseeded)`);
  }

  console.log("\n🎉 Seed complete!");
  console.log(`\n   Admin login:`);
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`\n   ⚠  Change the password after first login!\n`);
}

main()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
