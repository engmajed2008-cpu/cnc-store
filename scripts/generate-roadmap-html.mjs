// generate-roadmap-html.mjs — generates a standalone HTML file for the roadmap
// Arabic text renders correctly via browser engine (Chromium/Edge/Chrome)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_HTML = path.join(__dirname, '..', 'e3lani-roadmap.html');

const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>خريطة تنفيذ منصة إعلاني</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Cairo',sans-serif;background:#F4ECDD;color:#241A11;direction:rtl;print-color-adjust:exact;-webkit-print-color-adjust:exact}

  /* ─── COVER WRAPPER — dark + cream = page 1 ─── */
  .cover-wrapper{page-break-after:always}
  .cover{background:#241A11;padding:48px 56px 36px;border-bottom:4px solid #C9A24B}
  .cover-top{display:flex;align-items:center;justify-content:flex-start;margin-bottom:32px}
  .cover-lockup{height:44px;display:block}

  /* ─── LOGO SHOWCASE — cream area, same page 1 ─── */
  .logo-showcase{background:#F4ECDD;padding:32px 56px;display:flex;align-items:center;justify-content:center;border-bottom:1px solid #D4C4A8}
  .logo-showcase img{width:260px;height:260px;display:block}
  .cover-title{font-size:38px;font-weight:900;color:#F4ECDD;line-height:1.3;margin-bottom:12px}
  .cover-title span{color:#C9A24B}
  .cover-sub{font-size:15px;color:#A39584;margin-bottom:32px;line-height:1.7}
  .cover-stats{display:flex;gap:32px}
  .stat{text-align:center}
  .stat-num{font-size:28px;font-weight:900;color:#C9A24B}
  .stat-label{font-size:11px;color:#A39584;margin-top:2px}
  .cover-date{margin-top:32px;font-size:11px;color:#5A4030;border-top:1px solid rgba(201,162,75,.2);padding-top:16px}

  /* ─── LEGEND ─── */
  .legend{background:#fff;padding:16px 56px;display:flex;align-items:center;gap:28px;border-bottom:1px solid #E0D4C0;flex-wrap:wrap}
  .legend-title{font-size:11px;font-weight:700;color:#888;letter-spacing:.1em;text-transform:uppercase;margin-left:8px}
  .leg{display:flex;align-items:center;gap:8px;font-size:12px;color:#241A11}
  .leg-dot{width:12px;height:12px;border-radius:3px;flex-shrink:0}
  .green{background:#3D8B4E}.gold{background:#C9A24B}.red{background:#B54040}

  /* ─── BODY ─── */
  .body{padding:32px 56px;background:#F4ECDD}

  /* ─── PHASE ─── */
  .phase{border-radius:12px;margin-bottom:24px;overflow:hidden;border:1px solid #D4C4A8;page-break-inside:avoid}
  .phase-header{padding:16px 20px;display:flex;align-items:center;gap:14px}
  .phase-num{width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff;flex-shrink:0}
  .phase-info{flex:1}
  .phase-name{font-size:15px;font-weight:900;color:#fff}
  .phase-goal{font-size:11px;color:rgba(255,255,255,.8);margin-top:3px}
  .phase-badge{font-size:10px;font-weight:700;padding:5px 14px;border-radius:999px;background:rgba(255,255,255,.9);white-space:nowrap;margin-right:auto}

  .phase-body{display:grid;grid-template-columns:1fr 1fr 1fr;background:#fff}
  .col{padding:16px 18px;border-right:1px solid #EEE8E0}
  .col:first-child{border-right:none}
  .col-title{font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#999;margin-bottom:10px}
  .item{display:flex;align-items:flex-start;gap:8px;margin-bottom:8px}
  .dot{width:10px;height:10px;border-radius:3px;flex-shrink:0;margin-top:3px}
  .item-text{font-size:11.5px;color:#241A11;line-height:1.5}
  .item-sub{font-size:10px;color:#999;margin-top:1px}

  /* ─── PHASE COLORS ─── */
  .p0 .phase-header{background:#666}
  .p0 .phase-badge{color:#666}
  .p1 .phase-header{background:linear-gradient(135deg,#B38F3A,#C9A24B)}
  .p1 .phase-badge{color:#B38F3A}
  .p2 .phase-header{background:linear-gradient(135deg,#2E7A3E,#3D8B4E)}
  .p2 .phase-badge{color:#2E7A3E}
  .p3 .phase-header{background:linear-gradient(135deg,#4060A8,#5B82C8)}
  .p3 .phase-badge{color:#4060A8}
  .p4 .phase-header{background:linear-gradient(135deg,#8040A8,#B464C8)}
  .p4 .phase-badge{color:#8040A8}
  .p5 .phase-header{background:linear-gradient(135deg,#A05820,#C8783C)}
  .p5 .phase-badge{color:#A05820}

  /* ─── PRIORITY TABLE ─── */
  .table-section{margin-top:32px;page-break-inside:avoid}
  .table-title{font-size:16px;font-weight:900;color:#241A11;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #C9A24B}
  table{width:100%;border-collapse:collapse;font-size:12px}
  thead tr{background:#241A11;color:#F4ECDD}
  th{padding:10px 14px;text-align:right;font-weight:700;font-size:11px}
  tbody tr:nth-child(even){background:#fff}
  tbody tr:nth-child(odd){background:#FAF7F3}
  td{padding:10px 14px;border-bottom:1px solid #E0D8CC}
  td:first-child{font-weight:700;color:#241A11}
  .badge-now{background:#C9A24B;color:#241A11;padding:2px 10px;border-radius:999px;font-size:10px;font-weight:700}

  /* ─── FLOW TAGS ─── */
  .flow-tags{display:flex;gap:5px;margin-top:6px;flex-wrap:wrap}
  .ftag{font-size:9px;padding:2px 7px;border-radius:4px;font-weight:700}
  .f1{background:rgba(201,162,75,.15);color:#9A6A2A}
  .f2{background:rgba(61,139,78,.12);color:#2E7A3E}
  .f3{background:rgba(91,130,200,.15);color:#4060A8}

  /* ─── PRINT ─── */
  @media print{
    body{background:#F4ECDD}
    .phase{page-break-inside:avoid}
    .table-section{page-break-inside:avoid}
  }

  /* ─── FOOTER ─── */
  .footer{background:#241A11;padding:20px 56px;display:flex;justify-content:space-between;align-items:center;margin-top:40px}
  .footer-brand{font-size:13px;font-weight:700;color:#C9A24B}
  .footer-note{font-size:10px;color:#5A4030}

  /* ─── PRINT BTN ─── */
  .print-bar{background:#C9A24B;padding:14px 56px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
  .print-bar h2{font-size:13px;font-weight:700;color:#241A11}
  .btn-print{background:#241A11;color:#C9A24B;border:none;padding:9px 22px;border-radius:8px;font-family:'Cairo',sans-serif;font-size:13px;font-weight:700;cursor:pointer}
  .btn-print:hover{background:#33261A}
  @media print{.print-bar{display:none}}
</style>
</head>
<body>

<!-- PRINT BAR -->
<div class="print-bar">
  <h2>خريطة تنفيذ منصة إعلاني — اضغط «طباعة / حفظ كـ PDF» لتحميل الملف</h2>
  <button class="btn-print" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>
</div>

<!-- PAGE 1: dark cover + cream logo area (single page) -->
<div class="cover-wrapper">

  <div class="cover">
    <div class="cover-top">
      <img class="cover-lockup" src="./public/brand/e3lani-lockup.svg" alt="إعلاني — سوق الدعاية والإعلان" />
    </div>
    <div class="cover-title">خريطة تنفيذ<br><span>منصة إعلاني</span></div>
    <div class="cover-sub">
      نظام المسارات الثلاثة — من الواجهة للإدارة<br>
      ٦ مراحل مترابطة • كل مرحلة تُسلَّم كاملة قبل التالية
    </div>
    <div class="cover-stats">
      <div class="stat"><div class="stat-num">٦</div><div class="stat-label">مراحل</div></div>
      <div class="stat"><div class="stat-num">٣</div><div class="stat-label">مسارات للعميل</div></div>
      <div class="stat"><div class="stat-num">٢٠+</div><div class="stat-label">صفحة جديدة</div></div>
      <div class="stat"><div class="stat-num">١٠</div><div class="stat-label">أسابيع تنفيذ</div></div>
    </div>
    <div class="cover-date">إعداد: يونيو 2026 — مؤسسة القوافل العربية للمقاولات</div>
  </div>

  <!-- Cream area with large mark — same page 1 -->
  <div class="logo-showcase">
    <img src="./public/brand/e3lani-mark.svg" alt="شعار إعلاني" />
  </div>

</div><!-- /cover-wrapper -->

<!-- LEGEND -->
<div class="legend">
  <span class="legend-title">المؤشرات:</span>
  <div class="leg"><div class="leg-dot green"></div> موجود ✓</div>
  <div class="leg"><div class="leg-dot gold"></div> موجود جزئياً — يحتاج تعديل</div>
  <div class="leg"><div class="leg-dot red"></div> جديد — يُبنى من الصفر</div>
</div>

<!-- BODY -->
<div class="body">

<!-- PHASE 0 -->
<div class="phase p0">
  <div class="phase-header">
    <div class="phase-num">٠</div>
    <div class="phase-info">
      <div class="phase-name">الأساس — تم إنجازه ✓</div>
      <div class="phase-goal">هوية، مصادقة، بنية قاعدة البيانات، لوحة تحكم أساسية</div>
    </div>
    <div class="phase-badge" style="color:#666">مكتمل</div>
  </div>
  <div class="phase-body">
    <div class="col">
      <div class="col-title">الواجهة الموجودة</div>
      <div class="item"><div class="dot green"></div><div class="item-text">Navbar + Footer بهوية إعلاني (شعار vector)</div></div>
      <div class="item"><div class="dot green"></div><div class="item-text">تسجيل دخول + OTP جوال وبريد إلكتروني</div></div>
      <div class="item"><div class="dot green"></div><div class="item-text">صفحة انضمام الشركاء</div></div>
      <div class="item"><div class="dot green"></div><div class="item-text">صفحة منتجات + سلة + تسوية (أساسية)</div></div>
    </div>
    <div class="col">
      <div class="col-title">Backend الموجود</div>
      <div class="item"><div class="dot green"></div><div class="item-text">Schema كامل (Request / Offer / MarketplaceOrder)<div class="item-sub">يغطي المسارات الثلاثة بالكامل</div></div></div>
      <div class="item"><div class="dot green"></div><div class="item-text">API: auth, otp, partners, requests, pricing</div></div>
      <div class="item"><div class="dot green"></div><div class="item-text">Supabase Auth + Storage</div></div>
      <div class="item"><div class="dot gold"></div><div class="item-text">Admin: products, partners, complaints<div class="item-sub">يحتاج ربط بالمسارات الجديدة</div></div></div>
    </div>
    <div class="col">
      <div class="col-title">ما يحتاج توحيد</div>
      <div class="item"><div class="dot gold"></div><div class="item-text">الصفحة الرئيسية (سلايدر قديم)<div class="item-sub">تُعاد كلياً في المرحلة 1</div></div></div>
      <div class="item"><div class="dot gold"></div><div class="item-text">ألوان الكروت — تحويل للكريمي (جارٍ)</div></div>
      <div class="item"><div class="dot gold"></div><div class="item-text">i18n — مفاتيح ترجمة تحتاج إضافة</div></div>
    </div>
  </div>
</div>

<!-- PHASE 1 -->
<div class="phase p1">
  <div class="phase-header">
    <div class="phase-num">١</div>
    <div class="phase-info">
      <div class="phase-name">الصفحة الرئيسية الجديدة — نظام المسارات</div>
      <div class="phase-goal">أول ما يراه الزائر: ٣ بوابات واضحة بدل سلايدر عام</div>
    </div>
    <div class="phase-badge">⚡ الأولوية القصوى</div>
  </div>
  <div class="phase-body">
    <div class="col">
      <div class="col-title">الصفحات الجديدة</div>
      <div class="item"><div class="dot red"></div><div class="item-text">Hero ثلاثي المسار<div class="item-sub">سؤال واحد + ٣ أزرار + خلفية متحركة</div></div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">قسم منتجات جاهزة مصغّر<div class="item-sub">٤ منتجات مميزة ← يقود لمسار ١</div></div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">قسم «احسب سعرك الآن» مبسّط<div class="item-sub">Configurator مصغّر ← يقود لمسار ٢</div></div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">بانر «أرسل مشروعك» ← مسار ٣</div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">قسم لماذا إعلاني؟ + أرقام الإنجازات</div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">CTA انضمام الشركاء (أسفل الصفحة)</div></div>
      <div class="flow-tags"><span class="ftag f1">مسار ١</span><span class="ftag f2">مسار ٢</span><span class="ftag f3">مسار ٣</span></div>
    </div>
    <div class="col">
      <div class="col-title">إعادة هيكلة التنقل</div>
      <div class="item"><div class="dot gold"></div><div class="item-text">Navbar: إعادة تنظيم القوائم<div class="item-sub">المنتجات / التصميم / المشاريع / الشركاء</div></div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">مؤشر المسار النشط (breadcrumb ذكي)</div></div>
      <div class="item"><div class="dot gold"></div><div class="item-text">Footer: روابط المسارات الثلاثة</div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">صفحة «كيف تعمل المنصة؟»<div class="item-sub">شرح ٣ خطوات لكل مسار</div></div></div>
    </div>
    <div class="col">
      <div class="col-title">Backend / Admin</div>
      <div class="item"><div class="dot gold"></div><div class="item-text">Admin: تحديد المنتجات المميزة<div class="item-sub">حقل isFeatured موجود في Schema</div></div></div>
      <div class="item"><div class="dot gold"></div><div class="item-text">API site-config: إعدادات Hero<div class="item-sub">نصوص CTA، الصور، الأرقام</div></div></div>
      <div class="item"><div class="dot green"></div><div class="item-text">i18n: نصوص ar/en للمسارات الثلاثة</div></div>
    </div>
  </div>
</div>

<!-- PHASE 2 -->
<div class="phase p2">
  <div class="phase-header">
    <div class="phase-num">٢</div>
    <div class="phase-info">
      <div class="phase-name">المسار ١ — الكتالوج والشراء الفوري 🛒</div>
      <div class="phase-goal">من تصفح المنتج إلى الدفع وتتبع الطلب — بدون تصميم أو انتظار</div>
    </div>
    <div class="phase-badge">مسار ١ — شراء فوري</div>
  </div>
  <div class="phase-body">
    <div class="col">
      <div class="col-title">صفحات العميل</div>
      <div class="item"><div class="dot gold"></div><div class="item-text">/products — كتالوج كامل<div class="item-sub">فلاتر: فئة، سعر، تقييم، توفر</div></div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">/products/[slug] — صفحة منتج كاملة<div class="item-sub">صور، مواصفات، سعر، أضف للسلة</div></div></div>
      <div class="item"><div class="dot gold"></div><div class="item-text">/cart — سلة التسوق المحسّنة</div></div>
      <div class="item"><div class="dot gold"></div><div class="item-text">/checkout — إتمام الشراء</div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">/orders/[id] — تتبع الطلب<div class="item-sub">timeline + حالة + رقم تتبع</div></div></div>
      <div class="flow-tags"><span class="ftag f1">مسار ١ فقط</span></div>
    </div>
    <div class="col">
      <div class="col-title">Backend / API</div>
      <div class="item"><div class="dot gold"></div><div class="item-text">GET /api/products مع فلاتر<div class="item-sub">pagination, category, price range</div></div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">GET /api/products/[slug]</div></div>
      <div class="item"><div class="dot green"></div><div class="item-text">POST /api/orders — موجود</div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">GET /api/orders/[id] للعميل</div></div>
      <div class="item"><div class="dot green"></div><div class="item-text">بوابة الدفع Moyasar — مُعدّة</div></div>
    </div>
    <div class="col">
      <div class="col-title">Admin</div>
      <div class="item"><div class="dot gold"></div><div class="item-text">إدارة المنتجات CRUD كامل<div class="item-sub">إضافة صور، تفعيل/تعطيل، ترتيب</div></div></div>
      <div class="item"><div class="dot gold"></div><div class="item-text">إدارة الطلبات + تغيير الحالة<div class="item-sub">timeline مع إشعارات</div></div></div>
      <div class="item"><div class="dot gold"></div><div class="item-text">الفئات — إضافة / تعديل / ترتيب</div></div>
    </div>
  </div>
</div>

<!-- PHASE 3 -->
<div class="phase p3">
  <div class="phase-header">
    <div class="phase-num">٣</div>
    <div class="phase-info">
      <div class="phase-name">المسار ٢ — Configurator والتسعير الفوري 🎨</div>
      <div class="phase-goal">العميل يصمم منتجه ويرى السعر مباشرة — ثم يطلب أو يرفع تصميمه</div>
    </div>
    <div class="phase-badge">مسار ٢ — تصميم وسعر</div>
  </div>
  <div class="phase-body">
    <div class="col">
      <div class="col-title">صفحات العميل</div>
      <div class="item"><div class="dot red"></div><div class="item-text">/configure — بوابة اختيار النوع<div class="item-sub">لافتة / بنر / لوحة / قص CNC ...</div></div></div>
      <div class="item"><div class="dot gold"></div><div class="item-text">/configure/[type] — المُعيِّن<div class="item-sub">مقاس + مادة + كمية + إنهاء + سعر فوري</div></div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">رفع التصميم (AI / PDF / PNG)<div class="item-sub">Supabase Storage + التحقق من الملف</div></div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">ملخص الطلب + تأكيد + دفع</div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">«لا تصميم لديّ» ← طلب خدمة تصميم</div></div>
      <div class="flow-tags"><span class="ftag f2">مسار ٢ فقط</span></div>
    </div>
    <div class="col">
      <div class="col-title">Backend / API</div>
      <div class="item"><div class="dot green"></div><div class="item-text">POST /api/pricing/calculate — موجود<div class="item-sub">يحتاج توحيد مع المُعيِّن الجديد</div></div></div>
      <div class="item"><div class="dot green"></div><div class="item-text">GET /api/materials — موجود</div></div>
      <div class="item"><div class="dot green"></div><div class="item-text">POST /api/upload — موجود</div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">تحويل Quote مباشر → Order</div></div>
    </div>
    <div class="col">
      <div class="col-title">Admin</div>
      <div class="item"><div class="dot gold"></div><div class="item-text">إدارة المواد وأسعارها<div class="item-sub">موجود في /admin/store/pricing</div></div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">مراجعة الطلبات المُعيَّنة<div class="item-sub">التحقق من ملفات التصميم المرفوعة</div></div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">حدود الأسعار والعروض الخاصة</div></div>
    </div>
  </div>
</div>

<!-- PHASE 4 -->
<div class="phase p4">
  <div class="phase-header">
    <div class="phase-num">٤</div>
    <div class="phase-info">
      <div class="phase-name">المسار ٣ — نظام طلبات العروض (RFQ) 📋</div>
      <div class="phase-goal">العميل يرسل مشروعاً كاملاً ← الشركاء يقدمون عروضاً ← المقارنة والاختيار والتعاقد</div>
    </div>
    <div class="phase-badge">مسار ٣ — مشاريع RFQ</div>
  </div>
  <div class="phase-body">
    <div class="col">
      <div class="col-title">صفحات العميل</div>
      <div class="item"><div class="dot red"></div><div class="item-text">/request/new — معالج ٣ خطوات<div class="item-sub">البيانات ← البنود ← الإرسال</div></div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">/requests — قائمة مشاريعي<div class="item-sub">حالة كل مشروع + عدد العروض</div></div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">/requests/[id] — مقارنة العروض<div class="item-sub">سعر / وقت / تقييم الشريك</div></div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">اعتماد عرض + دفع Escrow</div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">تتبع التنفيذ + تقييم الشريك</div></div>
      <div class="flow-tags"><span class="ftag f3">مسار ٣ فقط</span></div>
    </div>
    <div class="col">
      <div class="col-title">Backend / API</div>
      <div class="item"><div class="dot gold"></div><div class="item-text">POST /api/requests — موجود<div class="item-sub">يحتاج: multi-item (بنود متعددة)</div></div></div>
      <div class="item"><div class="dot green"></div><div class="item-text">GET /api/requests/[id]/offers — موجود</div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">POST /api/requests/[id]/award<div class="item-sub">منح العقد للشريك الفائز</div></div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">إشعارات Supabase Realtime</div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">Escrow: تجميد المبلغ + الإفراج</div></div>
    </div>
    <div class="col">
      <div class="col-title">Admin</div>
      <div class="item"><div class="dot red"></div><div class="item-text">مراقبة الطلبات النشطة<div class="item-sub">OPEN / OFFERS / AWARDED / IN_PROGRESS</div></div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">إدارة النزاعات والعقود</div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">تقارير العمولة والمدفوعات</div></div>
    </div>
  </div>
</div>

<!-- PHASE 5 -->
<div class="phase p5">
  <div class="phase-header">
    <div class="phase-num">٥</div>
    <div class="phase-info">
      <div class="phase-name">لوحة تحكم الشريك (Agency / Supplier Dashboard)</div>
      <div class="phase-goal">الشريك يرى الطلبات المناسبة له، يقدم عروضاً، ويتابع طلباته المنفَّذة</div>
    </div>
    <div class="phase-badge">جانب الشريك</div>
  </div>
  <div class="phase-body">
    <div class="col">
      <div class="col-title">صفحات الشريك</div>
      <div class="item"><div class="dot red"></div><div class="item-text">/partner/dashboard — نظرة عامة<div class="item-sub">طلبات جديدة / عروضي / طلباتي النشطة</div></div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">/partner/requests — بورصة الطلبات<div class="item-sub">فلاتر: فئة، موقع، ميزانية</div></div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">/partner/requests/[id] — تقديم عرض<div class="item-sub">سعر + مدة + ملفات + ملاحظات</div></div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">/partner/orders — طلباتي المنفَّذة</div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">/partner/profile — ملف الشريك</div></div>
      <div class="flow-tags"><span class="ftag f3">مسار ٣</span><span class="ftag f2">مسار ٢ جزئياً</span></div>
    </div>
    <div class="col">
      <div class="col-title">Backend / API</div>
      <div class="item"><div class="dot green"></div><div class="item-text">GET /api/requests — تصفية للشريك<div class="item-sub">بالفئة + المدينة + الحالة</div></div></div>
      <div class="item"><div class="dot green"></div><div class="item-text">POST /api/requests/[id]/offers — موجود</div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">GET /api/partner/dashboard-stats</div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">إشعارات: طلب جديد / عرض مقبول</div></div>
    </div>
    <div class="col">
      <div class="col-title">Admin</div>
      <div class="item"><div class="dot gold"></div><div class="item-text">اعتماد / رفض الشركاء<div class="item-sub">موجود في /admin/partners</div></div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">تقييم أداء الشركاء<div class="item-sub">معدل القبول / التقييمات / وقت الرد</div></div></div>
      <div class="item"><div class="dot red"></div><div class="item-text">إشعار الشريك بالقبول / الرفض</div></div>
    </div>
  </div>
</div>

<!-- PRIORITY TABLE -->
<div class="table-section">
  <div class="table-title">جدول أولويات التنفيذ</div>
  <table>
    <thead>
      <tr>
        <th>المرحلة</th>
        <th>الجهد التقديري</th>
        <th>القيمة للمنصة</th>
        <th>موعد البدء</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>١ — الصفحة الرئيسية</td>
        <td>أسبوع واحد</td>
        <td>فوري — يغير الانطباع الأول للموقع</td>
        <td><span class="badge-now">الآن</span></td>
      </tr>
      <tr>
        <td>٢ — كتالوج + شراء فوري</td>
        <td>أسبوعان</td>
        <td>يُفعّل المسار الأساسي للإيرادات</td>
        <td>بعد المرحلة ١</td>
      </tr>
      <tr>
        <td>٣ — Configurator وتسعير</td>
        <td>أسبوعان</td>
        <td>يُفرّق إعلاني عن المنافسين</td>
        <td>بعد المرحلة ٢</td>
      </tr>
      <tr>
        <td>٤ — نظام RFQ</td>
        <td>٣ أسابيع</td>
        <td>القلب الجوهري للماركتبلس</td>
        <td>بعد المرحلة ٣</td>
      </tr>
      <tr>
        <td>٥ — لوحة الشريك</td>
        <td>أسبوعان</td>
        <td>يُكمل دورة الشريك ويُفعّل الشبكة</td>
        <td>بعد المرحلة ٤</td>
      </tr>
    </tbody>
  </table>
</div>

</div><!-- /body -->

<!-- FOOTER -->
<div class="footer">
  <div class="footer-brand">إعلاني — E3lani Marketplace</div>
  <div class="footer-note">خريطة التنفيذ 2026 — مؤسسة القوافل العربية للمقاولات — سري وخاص</div>
</div>

<script>
// Auto-trigger print dialog hint
window.onload = function() {
  // Nothing auto-triggered; user clicks the button
};
</script>
</body>
</html>`;

fs.writeFileSync(OUT_HTML, html, 'utf8');
console.log('HTML generated:', OUT_HTML);
