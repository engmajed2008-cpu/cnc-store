/**
 * scripts/rebrand-luxury.js — تحويل الموقع من الثيم الداكن إلى الثيم الفاخر الفاتح
 * (كريمي / بني / ذهبي) — قاعدة 60-30-10.
 *
 * الخلفيات الداكنة → كريمي فاتح/دافئ، والنصوص الكريمية الفاتحة → بني داكن.
 * الذهبي وألوان الحالة (أحمر/أخضر/أزرق) تبقى كما هي.
 * يكتب UTF-8 بدون BOM (الـ BOM يكسر "use client" في Next).
 *
 * Usage: node scripts/rebrand-luxury.js [--dry]
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src");
const DRY = process.argv.includes("--dry");

// الترتيب: الأطول/الأدق أولاً. كل القيم hex بصيغة #RRGGBB (case-insensitive).
const MAP = {
  // ── خلفيات داكنة → كريمي ──
  "#1E1610": "#FDFBF7", // خلفية الصفحات الأساسية → كريمي فاتح ناعم
  "#241A11": "#F4EFE6", // السطح/الفحمي → كريمي دافئ
  "#2A1F14": "#F4EFE6", // البطاقات/النوافذ → كريمي دافئ
  "#33261A": "#ECE3D2", // البني المرتفع → كريمي أعمق قليلاً
  "#19120B": "#F4EFE6", // أعمق خلفية (الأدمن) → كريمي دافئ
  "#1A1108": "#F4EFE6", // قسم داكن → كريمي دافئ
  "#1a1208": "#FDFBF7",
  "#2a1f0a": "#F4EFE6",
  "#12100a": "#F4EFE6",
  "#362210": "#FDFBF7", // navBg قديم
  // ── نصوص كريمية فاتحة → بني داكن/متوسط ──
  "#F4ECDD": "#2C1E15", // النص الأساسي الكريمي → بني داكن فاخر
  "#A39584": "#634E40", // النص الفرعي → بني متوسط ناعم
};

// طبّق الأطول أولاً لتفادي التداخل
const ENTRIES = Object.entries(MAP).sort((a, b) => b[0].length - a[0].length);

let filesChanged = 0;
let totalHits = 0;

function convert(text) {
  let out = text;
  let hits = 0;
  for (const [from, to] of ENTRIES) {
    const re = new RegExp(from.replace("#", "#"), "gi");
    out = out.replace(re, (m) => { hits++; return to; });
  }
  return { out, hits };
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    if (!/\.(tsx?|css)$/.test(entry.name) || entry.name.endsWith(".bak")) continue;
    const before = fs.readFileSync(full, "utf8");
    const { out, hits } = convert(before);
    if (out !== before) {
      if (!DRY) fs.writeFileSync(full, out, "utf8"); // بدون BOM
      filesChanged++;
      totalHits += hits;
      console.log(`  ${path.relative(ROOT, full)} — ${hits}`);
    }
  }
}

console.log(DRY ? "── DRY RUN ──" : "── تطبيق التحويل الفاخر ──");
walk(ROOT);
console.log(`\n✅ ${filesChanged} ملفاً، ${totalHits} استبدالاً.${DRY ? " (لم يُكتب شيء)" : ""}`);
