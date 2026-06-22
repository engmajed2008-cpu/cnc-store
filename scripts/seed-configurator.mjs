// Seed script: Configurator V2 — front-lit complete data
// Run: node scripts/seed-configurator.mjs

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding configurator V2...");

  // ── Step 1: Lighting Types ─────────────────────────────────
  const frontLit = await prisma.lightingType.upsert({
    where: { slug: "front-lit" },
    update: {},
    create: {
      slug: "front-lit",
      nameAr: "إضاءة أمامية",
      nameEn: "Front-Lit",
      descriptionAr: "الوجه الأمامي للحرف مضيء — يخرج الضوء من الوجه",
      basePriceSar: 120,
      iconEmoji: "◐",
      sortOrder: 1,
    },
  });
  console.log("Created lighting type: front-lit", frontLit.id);

  // Placeholder lighting types (inactive, to be fully configured later)
  for (const lt of [
    { slug: "back-lit",  nameAr: "إضاءة خلفية",  nameEn: "Back-Lit",  icon: "◉", sort: 2 },
    { slug: "side-lit",  nameAr: "إضاءة جانبية", nameEn: "Side-Lit",  icon: "◑", sort: 3 },
    { slug: "non-lit",   nameAr: "بدون إضاءة",   nameEn: "Non-Lit",   icon: "○", sort: 4 },
    { slug: "mix-lit",   nameAr: "إضاءة مركّبة", nameEn: "Mix-Lit",   icon: "●", sort: 5 },
  ]) {
    await prisma.lightingType.upsert({
      where: { slug: lt.slug },
      update: {},
      create: {
        slug: lt.slug, nameAr: lt.nameAr, nameEn: lt.nameEn,
        descriptionAr: "", basePriceSar: 0, iconEmoji: lt.icon,
        isActive: false, sortOrder: lt.sort,
      },
    });
  }
  console.log("Created placeholder lighting types (inactive)");

  // ── Step 2: Face Options (for front-lit) ───────────────────
  const faceOptions = [
    {
      slug: "white-acrylic",
      nameAr: "أكريليك أبيض",
      nameEn: "White Acrylic",
      descriptionAr: "وجه أكريليك أبيض اللون — الأكثر انتشاراً للإضاءة الأمامية",
      hasColorPicker: false,
      priceSar: 0,
      gradientCss: "linear-gradient(135deg,#f8f8f8,#e0e0e0)",
      iconEmoji: "⬜",
      sortOrder: 1,
    },
    {
      slug: "colored-acrylic",
      nameAr: "أكريليك ملوّن",
      nameEn: "Colored Acrylic",
      descriptionAr: "أكريليك ملوّن — اختر اللون المطلوب لوجه الحرف",
      hasColorPicker: true,
      priceSar: 15,
      gradientCss: "conic-gradient(from 0deg,#ff3b30,#ffcc00,#34c759,#007aff,#af52de,#ff3b30)",
      iconEmoji: "🎨",
      sortOrder: 2,
    },
    {
      slug: "acrylic-neon-center",
      nameAr: "أكريليك + نيون بالمنتصف",
      nameEn: "Acrylic + Center Neon",
      descriptionAr: "خط نيون يمرّ بمنتصف وجه الحرف — تأثير بصري مميّز",
      hasColorPicker: false,
      priceSar: 45,
      gradientCss: "linear-gradient(135deg,#f0f0f0 0%,#fff 40%,#ffe066 50%,#fff 60%,#f0f0f0 100%)",
      iconEmoji: "✦",
      sortOrder: 3,
    },
    {
      slug: "acrylic-neon-outline",
      nameAr: "أكريليك + نيون محيط",
      nameEn: "Acrylic + Outline Neon",
      descriptionAr: "نيون يحيط بمحيط وجه الحرف من الداخل — هالة مضيئة",
      hasColorPicker: false,
      priceSar: 55,
      gradientCss: "linear-gradient(135deg,#e8e8e8,#fff 50%,#e0f0ff)",
      iconEmoji: "◈",
      sortOrder: 4,
    },
  ];

  for (const fo of faceOptions) {
    await prisma.faceOption.upsert({
      where: { slug: fo.slug },
      update: {},
      create: { ...fo, lightingTypeId: frontLit.id },
    });
    console.log("  face option:", fo.slug);
  }

  // ── Step 3: Side Metals ───────────────────────────────────
  const sideMetals = [
    {
      slug: "ss-brushed",
      nameAr: "إستانلس مشطوف",
      nameEn: "Stainless Steel Brushed",
      descriptionAr: "إستانلس ستيل بملمس مشطوف — متين وأنيق",
      priceSar: 35,
      gradientCss: "linear-gradient(135deg,#8a9098,#c8cdd4,#6e757d,#bfc5cc)",
      iconEmoji: "〰️",
      sortOrder: 1,
    },
    {
      slug: "ss-polished",
      nameAr: "إستانلس مصقول",
      nameEn: "Stainless Steel Polished",
      descriptionAr: "إستانلس ستيل بملمس مصقول لامع — مظهر فاخر",
      priceSar: 45,
      gradientCss: "linear-gradient(135deg,#bcc2c8,#eef0f2 45%,#9fa5ab,#d8dce0)",
      iconEmoji: "✨",
      sortOrder: 2,
    },
    {
      slug: "aluminum",
      nameAr: "ألومنيوم",
      nameEn: "Aluminum",
      descriptionAr: "ألومنيوم مطلي — خفيف الوزن ومرن وفعّال التكلفة",
      priceSar: 20,
      gradientCss: "linear-gradient(135deg,#9aa0a8,#d0d4d8,#8a9098,#c0c6ca)",
      iconEmoji: "⬡",
      sortOrder: 3,
    },
    {
      slug: "zinc-alloy",
      nameAr: "زنكور",
      nameEn: "Zinc Alloy",
      descriptionAr: "خليط الزنك — يقبل الطلاء بألوان متعددة",
      priceSar: 25,
      gradientCss: "linear-gradient(135deg,#6a5a4a,#9a8a78,#5a4a3c,#8a7a68)",
      iconEmoji: "🔲",
      sortOrder: 4,
    },
  ];

  for (const sm of sideMetals) {
    await prisma.sideMetal.upsert({
      where: { slug: sm.slug },
      update: {},
      create: sm,
    });
    console.log("  side metal:", sm.slug);
  }

  // ── Step 4: Side Add-ons ───────────────────────────────────
  const sideAddons = [
    {
      slug: "perforation",
      nameAr: "تخريم الجوانب",
      nameEn: "Side Perforation",
      descriptionAr: "ثقوب بنمط هندسي على الجوانب تتيح للضوء الإشعاع منها",
      priceSar: 30,
      iconEmoji: "⁞⁞",
      sortOrder: 1,
    },
    {
      slug: "front-frame",
      nameAr: "إطار أمامي",
      nameEn: "Front Frame",
      descriptionAr: "إطار معدني رفيع يحيط بوجه الحرف من الخارج — لمسة نهائية مميّزة",
      priceSar: 25,
      iconEmoji: "⬚",
      sortOrder: 2,
    },
    {
      slug: "perforated-mesh",
      nameAr: "شبك مخرّم أمامي",
      nameEn: "Perforated Front Mesh",
      descriptionAr: "شبك مخرّم فوق الوجه يُضفي مظهراً صناعياً فاخراً",
      priceSar: 40,
      iconEmoji: "▦",
      sortOrder: 3,
    },
  ];

  for (const sa of sideAddons) {
    await prisma.sideAddon.upsert({
      where: { slug: sa.slug },
      update: {},
      create: sa,
    });
    console.log("  side addon:", sa.slug);
  }

  // ── Step 5: Light Colors ───────────────────────────────────
  const lightColors = [
    // Standard (free)
    { slug: "warm",    nameAr: "أصفر دافئ",   nameEn: "Warm White",   hexColor: "#FFC65C", priceSar: 0,  isColored: false, sortOrder: 1 },
    { slug: "neutral", nameAr: "أبيض طبيعي",  nameEn: "Neutral White", hexColor: "#FFE9C7", priceSar: 0,  isColored: false, sortOrder: 2 },
    { slug: "cool",    nameAr: "أبيض بارد",   nameEn: "Cool White",   hexColor: "#CFE6FF", priceSar: 0,  isColored: false, sortOrder: 3 },
    // Colored (extra cost)
    { slug: "red",     nameAr: "أحمر",         nameEn: "Red",          hexColor: "#FF3B30", priceSar: 20, isColored: true,  sortOrder: 4 },
    { slug: "green",   nameAr: "أخضر",         nameEn: "Green",        hexColor: "#34C759", priceSar: 20, isColored: true,  sortOrder: 5 },
    { slug: "blue",    nameAr: "أزرق",         nameEn: "Blue",         hexColor: "#007AFF", priceSar: 20, isColored: true,  sortOrder: 6 },
    { slug: "pink",    nameAr: "وردي",         nameEn: "Pink",         hexColor: "#FF2D92", priceSar: 20, isColored: true,  sortOrder: 7 },
    { slug: "purple",  nameAr: "بنفسجي",       nameEn: "Purple",       hexColor: "#AF52DE", priceSar: 20, isColored: true,  sortOrder: 8 },
    { slug: "rgb",     nameAr: "RGB متعدد الألوان", nameEn: "RGB Multicolor", hexColor: "#FF3B30", priceSar: 40, isColored: true, sortOrder: 9 },
  ];

  for (const lc of lightColors) {
    await prisma.lightColor.upsert({
      where: { slug: lc.slug },
      update: {},
      create: lc,
    });
    console.log("  light color:", lc.slug);
  }

  console.log("\nSeeding complete!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
