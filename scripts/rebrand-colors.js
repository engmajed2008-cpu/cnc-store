/**
 * scripts/rebrand-colors.js — ترحيل ألوان الموقع إلى لوحة هوية «إعلاني»
 * أسود/فحمي → بني داكن، الذهبي القديم → ذهبي الهوية، الأبيض المطفأ → كريمي.
 * يكتب UTF-8 بدون BOM (الـ BOM يكسر "use client" في Next).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src");

// الترتيب مهم: الأطول أولاً حتى لا يبتلع #111 الـ #111111
const REPLACEMENTS = [
  [/C9A84C/gi, "C9A24B"],          // ذهبي
  [/E8C97A/gi, "EBCB7C"],          // ذهبي فاتح
  [/9A7A30/gi, "9A6A2A"],          // برونزي
  [/rgba\(\s*201\s*,\s*168\s*,\s*76/g, "rgba(201,162,75"],
  [/F5F3EE/gi, "F4ECDD"],          // كريمي
  [/#111111/gi, "#241A11"],        // بني داكن (أساس)
  [/#1A1A1A/gi, "#241A11"],
  [/#111(?![0-9a-fA-F])/g, "#241A11"],
  [/#2D2D2D/gi, "#33261A"],        // بني
  [/#161616/gi, "#2A1F14"],        // سطح مرتفع (نوافذ)
  [/#0d0d0d/gi, "#1E1610"],        // خلفية الصفحات
  [/#0a0a0a/gi, "#19120B"],        // أعمق خلفية (الأدمن)
];

let filesChanged = 0;
let totalHits = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    if (!/\.(tsx?|css)$/.test(entry.name) || entry.name.endsWith(".bak")) continue;
    const before = fs.readFileSync(full, "utf8");
    let after = before;
    for (const [re, to] of REPLACEMENTS) after = after.replace(re, to);
    if (after !== before) {
      let hits = 0;
      for (const [re] of REPLACEMENTS) hits += (before.match(re) || []).length;
      fs.writeFileSync(full, after, "utf8"); // بدون BOM
      filesChanged++;
      totalHits += hits;
      console.log(`  ${path.relative(ROOT, full)} — ${hits}`);
    }
  }
}

walk(ROOT);
console.log(`\n✅ ${filesChanged} ملفاً، ${totalHits} استبدالاً.`);
