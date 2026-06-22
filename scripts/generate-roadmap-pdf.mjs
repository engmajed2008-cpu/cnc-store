// generate-roadmap-pdf.mjs
// Uses pdfkit to generate the e3lani roadmap PDF with Arabic content
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'e3lani-roadmap.pdf');

// ── Arabic font (built-in Helvetica doesn't support Arabic)
// We'll use a Unicode-safe approach: embed Arabic text as-is (pdfkit supports UTF-8)
// but Arabic requires RTL rendering. We'll use a workaround: include Amiri font if available,
// else fallback to a simple layout with English labels + Arabic descriptions via text positioning.

// Check for a system Arabic font
const FONT_PATHS = [
  'C:/Windows/Fonts/arial.ttf',
  'C:/Windows/Fonts/tahoma.ttf',
  'C:/Windows/Fonts/times.ttf',
];

let arabicFont = null;
for (const p of FONT_PATHS) {
  if (fs.existsSync(p)) { arabicFont = p; break; }
}

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 40, left: 40, right: 40 },
  info: {
    Title: 'خريطة تنفيذ منصة إعلاني',
    Author: 'إعلاني — E3lani',
    Subject: 'Marketplace Development Roadmap',
    Creator: 'E3lani Platform',
  },
});

const stream = fs.createWriteStream(OUT);
doc.pipe(stream);

// ── Colors
const GOLD   = '#C9A24B';
const CREAM  = '#F4ECDD';
const DARK   = '#241A11';
const GREEN  = '#3D8B4E';
const RED    = '#B54040';
const SILVER = '#A39584';
const WHITE  = '#FFFFFF';
const BG     = '#1E1610';
const PHASE_COLORS = {
  0: '#888888',
  1: GOLD,
  2: GREEN,
  3: '#5B82C8',
  4: '#B464C8',
  5: '#C8783C',
};

const W = doc.page.width - 80; // usable width
const L = 40; // left margin

if (arabicFont) doc.registerFont('Arabic', arabicFont);

function setFont(size, color = DARK, bold = false) {
  if (arabicFont) doc.font('Arabic').fontSize(size).fillColor(color);
  else doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size).fillColor(color);
}

function drawRect(x, y, w, h, fill, stroke, radius = 6) {
  doc.roundedRect(x, y, w, h, radius).fillAndStroke(fill, stroke);
}

// ── COVER / HEADER ──────────────────────────────────────────────
doc.rect(0, 0, doc.page.width, 130).fill(DARK);

// Gold gradient bar
doc.rect(0, 128, doc.page.width, 3).fill(GOLD);

// Title
setFont(22, GOLD, true);
doc.text('خريطة تنفيذ منصة إعلاني', L, 38, { align: 'right', width: W });

setFont(12, CREAM);
doc.text('من الواجهة للإدارة — نظام المسارات الثلاثة', L, 68, { align: 'right', width: W });

setFont(9, SILVER);
doc.text('٦ مراحل مترابطة  •  كل مرحلة تُسلَّم كاملة قبل التالية  •  E3lani Marketplace 2026', L, 92, { align: 'right', width: W });

// ── LEGEND ──────────────────────────────────────────────────────
let y = 148;
setFont(8, DARK);
const legendItems = [
  { color: GREEN, label: 'موجود ✓' },
  { color: GOLD,  label: 'موجود جزئياً — يحتاج تعديل' },
  { color: RED,   label: 'جديد — يُبنى من الصفر' },
];
doc.text('المؤشرات:', L, y, { align: 'left' });
let lx = 120;
for (const item of legendItems) {
  doc.circle(lx, y + 5, 5).fill(item.color);
  setFont(8, DARK);
  doc.text(item.label, lx + 10, y, { align: 'left' });
  lx += doc.widthOfString(item.label) + 28;
}
y += 24;

// ── PHASE RENDERER ──────────────────────────────────────────────
function phaseStatusDot(x, py, status) {
  const c = status === 'exists' ? GREEN : status === 'partial' ? GOLD : RED;
  doc.circle(x + 6, py + 6, 4).fill(c);
}

function renderPhase(num, title, goal, badge, cols, startY) {
  const phaseColor = PHASE_COLORS[num] || GOLD;
  const headerH = 44;
  let ph = headerH + 12;

  // Estimate height needed
  const maxItems = Math.max(...cols.map(c => c.items.length));
  ph += maxItems * 22 + 30;

  if (startY + ph > doc.page.height - 60) {
    doc.addPage();
    startY = 40;
  }

  // Phase container
  doc.roundedRect(L, startY, W, ph, 8)
    .fillAndStroke('#F9F6F0', '#D4C4A8');

  // Phase header bar
  doc.roundedRect(L, startY, W, headerH, 8).fill(phaseColor);
  // Fix bottom corners of header
  doc.rect(L, startY + headerH - 8, W, 8).fill(phaseColor);

  // Phase number circle
  doc.circle(L + 22, startY + headerH / 2, 16).fill('rgba(255,255,255,0.25)');
  setFont(14, WHITE, true);
  doc.text(String(num), L + 14, startY + headerH / 2 - 8, { width: 18, align: 'center' });

  // Phase title & goal
  setFont(11, WHITE, true);
  doc.text(title, L + 46, startY + 10, { align: 'right', width: W - 90 });
  setFont(8, 'rgba(255,255,255,0.8)');
  doc.text(goal, L + 46, startY + 26, { align: 'right', width: W - 90 });

  // Badge
  setFont(7, DARK, true);
  const badgeW = doc.widthOfString(badge) + 16;
  doc.roundedRect(L + W - badgeW - 4, startY + headerH / 2 - 9, badgeW, 18, 9)
    .fill('rgba(255,255,255,0.9)');
  doc.fillColor(phaseColor).text(badge, L + W - badgeW - 4, startY + headerH / 2 - 5, { width: badgeW, align: 'center' });

  // Columns
  const colW = (W - 20) / cols.length;
  let cx = L + 10;
  const bodyTop = startY + headerH + 10;

  for (const col of cols) {
    // Column title
    setFont(7, '#888888', true);
    doc.text(col.title.toUpperCase(), cx, bodyTop, { width: colW - 8 });

    let iy = bodyTop + 14;
    for (const item of col.items) {
      phaseStatusDot(cx, iy, item.status);
      setFont(8, DARK);
      doc.text(item.text, cx + 16, iy, { width: colW - 24 });
      if (item.sub) {
        setFont(7, SILVER);
        doc.text(item.sub, cx + 16, iy + 11, { width: colW - 24 });
        iy += 22;
      } else {
        iy += 18;
      }
    }
    cx += colW + 5;
  }

  return startY + ph + 10;
}

// ── PHASE 0 ──────────────────────────────────────────────────────
y = renderPhase(0, 'الأساس — تم إنجازه ✓', 'هوية، مصادقة، بنية قاعدة البيانات، لوحة تحكم أساسية', 'مكتمل', [
  {
    title: 'الواجهة الموجودة',
    items: [
      { status: 'exists',  text: 'Navbar + Footer بهوية إعلاني' },
      { status: 'exists',  text: 'تسجيل دخول + OTP جوال/بريد' },
      { status: 'exists',  text: 'صفحة انضمام الشركاء' },
      { status: 'exists',  text: 'صفحة منتجات + سلة + تسوية' },
    ],
  },
  {
    title: 'Backend الموجود',
    items: [
      { status: 'exists',  text: 'Schema كامل (Request/Offer/MarketplaceOrder)' },
      { status: 'exists',  text: 'API: auth, otp, partners, requests, pricing' },
      { status: 'exists',  text: 'Supabase Auth + Storage' },
      { status: 'partial', text: 'Admin: products, partners, complaints', sub: 'يحتاج ربط بالمسارات الجديدة' },
    ],
  },
  {
    title: 'ما يحتاج توحيد',
    items: [
      { status: 'partial', text: 'الصفحة الرئيسية (سلايدر قديم)', sub: 'تُعاد في المرحلة 1' },
      { status: 'partial', text: 'ألوان الكروت (جارٍ)' },
      { status: 'partial', text: 'i18n — مفاتيح تحتاج إضافة' },
    ],
  },
], y);

// ── PHASE 1 ──────────────────────────────────────────────────────
y = renderPhase(1, 'الصفحة الرئيسية الجديدة — نظام المسارات', 'أول ما يراه الزائر: 3 بوابات واضحة بدل سلايدر عام', 'الأولوية القصوى', [
  {
    title: 'الصفحات الجديدة',
    items: [
      { status: 'new',     text: 'Hero ثلاثي المسار (سؤال + 3 أزرار)' },
      { status: 'new',     text: 'قسم منتجات جاهزة مصغّر (← مسار 1)' },
      { status: 'new',     text: 'قسم «احسب سعرك» مصغّر (← مسار 2)' },
      { status: 'new',     text: 'بانر أرسل مشروعك (← مسار 3)' },
      { status: 'new',     text: 'قسم لماذا إعلاني؟ + أرقام + CTA' },
    ],
  },
  {
    title: 'التنقل (Navbar)',
    items: [
      { status: 'partial', text: 'Navbar: إعادة تنظيم القوائم', sub: 'المنتجات / التصميم / المشاريع / الشركاء' },
      { status: 'new',     text: 'مؤشر المسار النشط (breadcrumb)' },
      { status: 'partial', text: 'Footer: روابط المسارات الثلاثة' },
    ],
  },
  {
    title: 'Backend / Admin',
    items: [
      { status: 'partial', text: 'Admin: تحديد المنتجات المميزة', sub: 'isFeatured موجود في Schema' },
      { status: 'partial', text: 'API site-config لإعدادات Hero' },
      { status: 'exists',  text: 'i18n: نصوص ar/en للمسارات' },
    ],
  },
], y);

// ── PHASE 2 ──────────────────────────────────────────────────────
y = renderPhase(2, 'المسار 1 — الكتالوج والشراء الفوري', 'من تصفح المنتج إلى الدفع وتتبع الطلب — بدون تصميم أو انتظار', 'مسار 1 - شراء فوري', [
  {
    title: 'صفحات العميل',
    items: [
      { status: 'partial', text: '/products — كتالوج كامل مع فلاتر', sub: 'فئة، سعر، تقييم، متوفر' },
      { status: 'new',     text: '/products/[slug] — صفحة منتج كاملة' },
      { status: 'partial', text: '/cart — سلة التسوق' },
      { status: 'partial', text: '/checkout — إتمام الشراء' },
      { status: 'new',     text: '/orders/[id] — تتبع الطلب (timeline)' },
    ],
  },
  {
    title: 'Backend / API',
    items: [
      { status: 'partial', text: 'GET /api/products مع فلاتر + pagination' },
      { status: 'new',     text: 'GET /api/products/[slug]' },
      { status: 'exists',  text: 'POST /api/orders — موجود' },
      { status: 'new',     text: 'GET /api/orders/[id] للعميل' },
      { status: 'exists',  text: 'بوابة الدفع Moyasar' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { status: 'partial', text: 'إدارة المنتجات CRUD كامل', sub: 'صور، تفعيل، ترتيب' },
      { status: 'partial', text: 'إدارة الطلبات + تغيير الحالة' },
      { status: 'partial', text: 'الفئات — إضافة/تعديل' },
    ],
  },
], y);

// ── PHASE 3 ──────────────────────────────────────────────────────
y = renderPhase(3, 'المسار 2 — Configurator والتسعير الفوري', 'العميل يصمم منتجه ويرى السعر مباشرة ثم يطلب', 'مسار 2 - تصميم وسعر', [
  {
    title: 'صفحات العميل',
    items: [
      { status: 'new',     text: '/configure — بوابة اختيار النوع' },
      { status: 'partial', text: '/configure/[type] — المُعيِّن', sub: 'مقاس + مادة + كمية + سعر فوري' },
      { status: 'new',     text: 'رفع التصميم (AI / PDF / PNG)' },
      { status: 'new',     text: 'ملخص الطلب + تأكيد + دفع' },
      { status: 'new',     text: '«لا تصميم» ← طلب خدمة تصميم' },
    ],
  },
  {
    title: 'Backend / API',
    items: [
      { status: 'exists',  text: 'POST /api/pricing/calculate — موجود' },
      { status: 'exists',  text: 'GET /api/materials — موجود' },
      { status: 'exists',  text: 'POST /api/upload — موجود' },
      { status: 'new',     text: 'تحويل Quote مباشر → Order' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { status: 'partial', text: 'إدارة المواد وأسعارها', sub: 'موجود في /admin/store/pricing' },
      { status: 'new',     text: 'مراجعة ملفات التصميم المرفوعة' },
      { status: 'new',     text: 'حدود الأسعار والعروض الخاصة' },
    ],
  },
], y);

// ── PHASE 4 ──────────────────────────────────────────────────────
y = renderPhase(4, 'المسار 3 — نظام طلبات العروض (RFQ)', 'العميل يرسل مشروعاً ← الشركاء يقدمون عروضاً ← المقارنة والاختيار', 'مسار 3 - مشاريع RFQ', [
  {
    title: 'صفحات العميل',
    items: [
      { status: 'new',     text: '/request/new — معالج 3 خطوات', sub: 'البيانات ← البنود ← الإرسال' },
      { status: 'new',     text: '/requests — قائمة مشاريعي' },
      { status: 'new',     text: '/requests/[id] — مقارنة العروض', sub: 'سعر / وقت / تقييم الشريك' },
      { status: 'new',     text: 'اعتماد عرض + دفع Escrow' },
      { status: 'new',     text: 'تتبع التنفيذ + تقييم الشريك' },
    ],
  },
  {
    title: 'Backend / API',
    items: [
      { status: 'partial', text: 'POST /api/requests', sub: 'يحتاج: multi-item (بنود متعددة)' },
      { status: 'exists',  text: 'GET /api/requests/[id]/offers — موجود' },
      { status: 'new',     text: 'POST /api/requests/[id]/award' },
      { status: 'new',     text: 'إشعارات Supabase Realtime' },
      { status: 'new',     text: 'Escrow: تجميد + إفراج' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { status: 'new',     text: 'مراقبة الطلبات النشطة', sub: 'OPEN / OFFERS / AWARDED' },
      { status: 'new',     text: 'إدارة النزاعات والعقود' },
      { status: 'new',     text: 'تقارير العمولة' },
    ],
  },
], y);

// ── PHASE 5 ──────────────────────────────────────────────────────
y = renderPhase(5, 'لوحة تحكم الشريك (Agency / Supplier Dashboard)', 'الشريك يرى الطلبات المناسبة، يقدم عروضاً، يتابع طلباته', 'جانب الشريك', [
  {
    title: 'صفحات الشريك',
    items: [
      { status: 'new',     text: '/partner/dashboard — نظرة عامة', sub: 'طلبات جديدة / عروضي / طلباتي النشطة' },
      { status: 'new',     text: '/partner/requests — بورصة الطلبات', sub: 'فلاتر: فئة، موقع، ميزانية' },
      { status: 'new',     text: '/partner/requests/[id] — تقديم عرض' },
      { status: 'new',     text: '/partner/orders — طلباتي المنفَّذة' },
      { status: 'new',     text: '/partner/profile — ملف الشريك' },
    ],
  },
  {
    title: 'Backend / API',
    items: [
      { status: 'exists',  text: 'GET /api/requests — تصفية للشريك' },
      { status: 'exists',  text: 'POST /api/requests/[id]/offers — موجود' },
      { status: 'new',     text: 'GET /api/partner/dashboard-stats' },
      { status: 'new',     text: 'إشعارات: طلب جديد / عرض مقبول' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { status: 'partial', text: 'اعتماد/رفض الشركاء', sub: 'موجود في /admin/partners' },
      { status: 'new',     text: 'تقييم أداء الشركاء', sub: 'معدل القبول / التقييمات' },
      { status: 'new',     text: 'إشعار الشريك بالقبول/الرفض' },
    ],
  },
], y);

// ── PRIORITY TABLE ───────────────────────────────────────────────
if (y + 160 > doc.page.height - 40) { doc.addPage(); y = 40; }
y += 10;

setFont(11, DARK, true);
doc.text('جدول أولويات التنفيذ', L, y, { align: 'right', width: W });
y += 20;

const tableData = [
  ['المرحلة', 'الجهد', 'القيمة', 'البدء'],
  ['1 — الصفحة الرئيسية', 'أسبوع', 'فوري — يغير انطباع الموقع', 'الآن'],
  ['2 — كتالوج + شراء', 'أسبوعان', 'يُفعّل المسار الأساسي', 'بعد 1'],
  ['3 — Configurator', 'أسبوعان', 'يُفرّق إعلاني عن المنافسين', 'بعد 2'],
  ['4 — نظام RFQ', '3 أسابيع', 'القلب الجوهري للماركتبلس', 'بعد 3'],
  ['5 — لوحة الشريك', 'أسبوعان', 'يُكمل دورة الشريك', 'بعد 4'],
];

const colWidths = [W * 0.28, W * 0.15, W * 0.38, W * 0.19];
const rowH = 24;

for (let r = 0; r < tableData.length; r++) {
  const row = tableData[r];
  const isHeader = r === 0;
  const bg = isHeader ? DARK : r % 2 === 0 ? '#FBF8F4' : WHITE;
  doc.rect(L, y, W, rowH).fill(bg);

  let cx2 = L;
  for (let c = 0; c < row.length; c++) {
    setFont(isHeader ? 8 : 8, isHeader ? WHITE : DARK, isHeader);
    doc.text(row[c], cx2 + 6, y + 7, { width: colWidths[c] - 12, align: 'right' });
    cx2 += colWidths[c];
  }
  // row border
  doc.rect(L, y, W, rowH).stroke('#E0D8CC');
  y += rowH;
}

// ── FOOTER ───────────────────────────────────────────────────────
const pages = doc.bufferedPageRange();
for (let i = 0; i < pages.count; i++) {
  doc.switchToPage(pages.start + i);
  doc.rect(0, doc.page.height - 30, doc.page.width, 30).fill(DARK);
  setFont(7, SILVER);
  doc.text(
    `إعلاني — E3lani Marketplace  |  خريطة التنفيذ 2026  |  صفحة ${i + 1} من ${pages.count}`,
    L, doc.page.height - 20, { align: 'center', width: W }
  );
}

doc.end();
stream.on('finish', () => {
  console.log('PDF generated:', OUT);
});
stream.on('error', (e) => {
  console.error('Error:', e);
  process.exit(1);
});
