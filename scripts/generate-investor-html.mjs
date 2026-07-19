import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'e3lani-investor.html');

const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<title>وثيقة المستثمرين — إعلاني</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Cairo',sans-serif;background:#F4ECDD;color:#241A11;direction:rtl;print-color-adjust:exact;-webkit-print-color-adjust:exact}

/* ─── PRINT BAR ─── */
.print-bar{background:#C9A24B;padding:12px 48px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
.print-bar h2{font-size:12px;font-weight:700;color:#241A11}
.btn-print{background:#241A11;color:#C9A24B;border:none;padding:8px 20px;border-radius:8px;font-family:'Cairo',sans-serif;font-size:12px;font-weight:700;cursor:pointer}
@media print{
  .print-bar{display:none}
  thead{display:table-header-group}
  tfoot{display:table-footer-group}
  tr{page-break-inside:avoid;break-inside:avoid}
  /* منع انقسام العناصر متوسطة الحجم فقط (لا الطويلة جداً كـ .phase-item حتى لا تنشأ فراغات/صفحات زائدة) */
  .card,.card-dark,.rev-card,.mcirc,.bbar,.launch-phase,.moat-banner,.why-card,.shot{
    page-break-inside:avoid;break-inside:avoid
  }
}

/* ─── SCREENSHOTS GALLERY ─── */
.shots{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:8px}
.shot{border-radius:12px;overflow:hidden;border:1px solid #D4C4A8;background:#fff;box-shadow:0 4px 18px rgba(44,30,21,.06)}
.shot img{width:100%;display:block}
.shot-cap{font-size:10px;font-weight:700;color:#5A3E28;padding:9px 12px;background:#FAF7F3;border-top:1px solid #E0D4C0}
.shot-feature{grid-column:1/-1;border-color:#C9A24B}
.shot-feature .shot-cap{font-size:11.5px;color:#9A6A2A;background:rgba(201,162,75,.08)}

/* ─── COVER WRAPPER ─── */
.cover-wrapper{page-break-after:always}
.cover{background:#241A11;padding:44px 52px 32px;border-bottom:4px solid #C9A24B}
.cover-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:36px}
.cover-lockup{height:40px;display:block}
.cover-badge{background:rgba(201,162,75,.15);border:1px solid rgba(201,162,75,.4);color:#C9A24B;font-size:10px;font-weight:700;padding:5px 14px;border-radius:999px;letter-spacing:.1em}
.cover-eyebrow{font-size:11px;color:#C9A24B;letter-spacing:.2em;text-transform:uppercase;margin-bottom:10px}
.cover-title{font-size:42px;font-weight:900;color:#F4ECDD;line-height:1.25;margin-bottom:10px}
.cover-title span{color:#C9A24B}
.cover-tagline{font-size:15px;color:#A39584;line-height:1.7;margin-bottom:32px}
.cover-kpis{display:flex;gap:0;border:1px solid rgba(201,162,75,.2);border-radius:12px;overflow:hidden;margin-bottom:24px}
.kpi{flex:1;padding:18px 20px;text-align:center;border-left:1px solid rgba(201,162,75,.15)}
.kpi:last-child{border-left:none}
.kpi-val{font-size:22px;font-weight:900;color:#C9A24B;line-height:1}
.kpi-lbl{font-size:9px;color:#A39584;margin-top:4px;line-height:1.4}
.cover-date{font-size:10px;color:#5A4030;border-top:1px solid rgba(201,162,75,.15);padding-top:14px}

/* ─── LOGO SHOWCASE ─── */
.logo-showcase{background:#F4ECDD;padding:28px 52px;display:flex;align-items:center;justify-content:center;border-bottom:2px solid #D4C4A8}
.logo-showcase img{width:220px;height:220px;display:block}

/* ─── SECTION WRAPPER ─── */
.section{padding:36px 52px;border-bottom:1px solid #DDD4C4}
.section-alt{background:#fff}
.section-dark{background:#241A11;color:#F4ECDD}
.section-gold{background:linear-gradient(135deg,#241A11,#33261A)}
.eyebrow{font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#C9A24B;margin-bottom:8px}
.section-title{font-size:20px;font-weight:900;color:#241A11;margin-bottom:6px}
.section-title-light{font-size:20px;font-weight:900;color:#F4ECDD;margin-bottom:6px}
.section-title span{color:#C9A24B}
.section-desc{font-size:12.5px;color:#5A3E28;line-height:1.8;margin-bottom:24px}
.section-desc-light{font-size:12.5px;color:#A39584;line-height:1.8;margin-bottom:24px}

/* ─── PROBLEM / SOLUTION ─── */
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.card{border-radius:12px;padding:20px 22px;border:1px solid #D4C4A8;background:#FAF7F3}
.card-dark{border-radius:12px;padding:20px 22px;border:1px solid rgba(201,162,75,.2);background:rgba(201,162,75,.06)}
.card h3{font-size:13px;font-weight:900;color:#241A11;margin-bottom:10px;display:flex;align-items:center;gap:8px}
.card-dark h3{color:#F4ECDD}
.card p,.card li{font-size:11.5px;color:#5A3E28;line-height:1.75}
.card-dark p,.card-dark li{color:#A39584}
.card ul{padding-right:16px;list-style:disc}
.icon{width:28px;height:28px;border-radius:8px;background:#C9A24B;display:inline-flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.icon-red{background:#B54040}
.icon-green{background:#3D8B4E}

/* ─── MARKET ─── */
.market-circles{display:flex;align-items:stretch;gap:14px;margin:20px 0}
.mcirc{border-radius:16px;padding:20px;text-align:center;flex:1}
.mcirc-1{background:rgba(201,162,75,.12);border:2px solid rgba(201,162,75,.3)}
.mcirc-2{background:rgba(201,162,75,.2);border:2px solid rgba(201,162,75,.4)}
.mcirc-3{background:rgba(201,162,75,.35);border:2px solid #C9A24B}
.mcirc-label{font-size:9px;color:#9A6A2A;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
.mcirc-val{font-size:20px;font-weight:900;color:#241A11;margin:4px 0 2px}
.mcirc-desc{font-size:9.5px;color:#5A3E28}

/* ─── REVENUE STREAMS ─── */
.rev-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:16px}
.rev-card{border-radius:10px;padding:16px;background:#FAF7F3;border:1px solid #D4C4A8;text-align:center}
.rev-icon{font-size:24px;margin-bottom:8px}
.rev-title{font-size:12px;font-weight:900;color:#241A11;margin-bottom:4px}
.rev-model{font-size:10px;color:#C9A24B;font-weight:700;margin-bottom:6px}
.rev-desc{font-size:10px;color:#5A3E28;line-height:1.6}

/* ─── FINANCIALS TABLE ─── */
.fin-table{width:100%;border-collapse:collapse;font-size:11.5px;margin-top:16px}
.fin-table thead tr{background:#241A11;color:#F4ECDD}
.fin-table th{padding:10px 14px;text-align:right;font-weight:700;font-size:10.5px}
.fin-table td{padding:10px 14px;border-bottom:1px solid #E0D4C0}
.fin-table tbody tr:nth-child(even){background:#FAF7F3}
.fin-table tbody tr:nth-child(odd){background:#fff}
.fin-table .highlight{font-weight:900;color:#3D8B4E}
.fin-table .loss{color:#B54040;font-weight:700}
.fin-table .total-row td{background:#241A11!important;color:#F4ECDD;font-weight:700}
.fin-table .gold-row td{background:rgba(201,162,75,.1)!important;font-weight:700;color:#9A6A2A}

/* ─── REGULATORY MOAT ─── */
.moat-banner{background:linear-gradient(135deg,#1A2E1A,#0D1F0D);border:2px solid #3D8B4E;border-radius:14px;padding:20px 24px;margin-bottom:20px;display:flex;align-items:center;gap:16px}
.moat-icon{font-size:36px;flex-shrink:0}
.moat-text h3{font-size:14px;font-weight:900;color:#5DAD6E;margin-bottom:4px}
.moat-text p{font-size:11.5px;color:#A8C8A8;line-height:1.7}
.reg-flow{display:flex;align-items:center;gap:0;margin:20px 0;background:#FAF7F3;border-radius:12px;border:1px solid #D4C4A8;overflow:hidden}
.reg-step{flex:1;padding:16px 14px;text-align:center;position:relative}
.reg-step:not(:last-child)::after{content:"←";position:absolute;left:-10px;top:50%;transform:translateY(-50%);font-size:16px;color:#C9A24B;font-weight:900;z-index:1}
.reg-step-num{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:#fff;margin:0 auto 8px}
.reg-step-title{font-size:10.5px;font-weight:900;color:#241A11;margin-bottom:3px}
.reg-step-desc{font-size:9.5px;color:#5A3E28;line-height:1.5}
.reg-step-s1{background:rgba(91,130,200,.08);border-left:2px solid rgba(91,130,200,.3)}
.reg-step-s2{background:rgba(201,162,75,.08);border-left:2px solid rgba(201,162,75,.3)}
.reg-step-s3{background:rgba(61,139,78,.08);border-left:2px solid rgba(61,139,78,.3)}
.reg-step-s4{background:rgba(61,139,78,.18)}

.launch-map{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}
.launch-phase{border-radius:12px;padding:18px 20px;border:2px solid}
.launch-phase-1{border-color:#C9A24B;background:rgba(201,162,75,.07)}
.launch-phase-2{border-color:rgba(201,162,75,.3);background:rgba(201,162,75,.03)}
.launch-phase h4{font-size:13px;font-weight:900;margin-bottom:4px;display:flex;align-items:center;gap:8px}
.launch-phase-1 h4{color:#9A6A2A}
.launch-phase-2 h4{color:#5A3E28}
.launch-phase .tag{font-size:9px;font-weight:700;padding:3px 10px;border-radius:999px;margin-bottom:8px;display:inline-block}
.tag-now{background:#C9A24B;color:#241A11}
.tag-next{background:rgba(201,162,75,.2);color:#9A6A2A}
.launch-phase ul{padding-right:16px;list-style:disc}
.launch-phase li{font-size:11px;color:#5A3E28;line-height:1.75}
.city-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.chip{font-size:10px;padding:4px 10px;border-radius:999px;font-weight:600}
.chip-active{background:#C9A24B;color:#241A11}
.chip-next{background:#E8E0D0;color:#5A3E28}

/* ─── EQUITY STRUCTURE ─── */
.equity-hero{display:flex;gap:20px;margin-bottom:20px}
.equity-stat-box{flex:1;border-radius:12px;padding:18px 20px;text-align:center;border:2px solid}
.esb-gold{background:rgba(201,162,75,.1);border-color:#C9A24B}
.esb-dark{background:#241A11;border-color:#241A11}
.esb-green{background:rgba(61,139,78,.08);border-color:#3D8B4E}
.esb-val{font-size:22px;font-weight:900;margin-bottom:4px}
.esb-gold .esb-val{color:#9A6A2A}
.esb-dark .esb-val{color:#C9A24B}
.esb-green .esb-val{color:#2E7A3E}
.esb-lbl{font-size:10px;color:#5A3E28;line-height:1.5}
.esb-dark .esb-lbl{color:#A39584}

.ownership-bar{border-radius:12px;overflow:hidden;height:52px;display:flex;margin:16px 0}
.own-seg{display:flex;align-items:center;justify-content:center;flex-direction:column;font-size:10px;font-weight:700;color:#fff;gap:2px}
.own-founder{background:#241A11;flex:3}
.own-investor{background:linear-gradient(90deg,#C9A24B,#EBCB7C);flex:1}
.own-investor span,.own-founder span{font-size:13px;font-weight:900}
.own-investor{color:#241A11}

.inv-table{width:100%;border-collapse:collapse;font-size:11.5px;margin-top:16px}
.inv-table thead tr{background:#241A11;color:#F4ECDD}
.inv-table th{padding:10px 14px;text-align:right;font-size:10.5px;font-weight:700}
.inv-table td{padding:10px 14px;border-bottom:1px solid #E0D4C0}
.inv-table tbody tr:nth-child(even){background:#FAF7F3}
.inv-table tbody tr:nth-child(odd){background:#fff}
.inv-table .bold{font-weight:900;color:#241A11}
.inv-table .gold{color:#9A6A2A;font-weight:700}
.inv-table .green{color:#2E7A3E;font-weight:700}
.inv-table .highlight-row td{background:rgba(201,162,75,.12)!important;font-weight:700}
.share-chip{display:inline-flex;align-items:center;gap:4px;background:#C9A24B;color:#241A11;padding:3px 10px;border-radius:999px;font-size:10px;font-weight:900}

/* ─── BUDGET BREAKDOWN ─── */
.budget-bars{margin-top:16px}
.bbar{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.bbar-label{font-size:11px;font-weight:700;color:#241A11;width:180px;flex-shrink:0}
.bbar-track{flex:1;height:28px;background:#EEE8E0;border-radius:6px;overflow:hidden;position:relative}
.bbar-fill{height:100%;border-radius:6px;display:flex;align-items:center;padding:0 10px}
.bbar-fill span{font-size:10px;font-weight:700;color:#fff;white-space:nowrap}
.bbar-amount{font-size:11px;font-weight:700;color:#241A11;width:110px;text-align:left;flex-shrink:0}

/* ─── PHASES ─── */
.phases-timeline{margin-top:20px}
.phase-item{display:flex;gap:20px;margin-bottom:0}
.phase-line{display:flex;flex-direction:column;align-items:center;gap:0}
.phase-dot{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#fff;flex-shrink:0}
.phase-connector{width:2px;flex:1;min-height:20px}
.phase-content{flex:1;padding-bottom:24px;padding-top:4px}
.phase-title{font-size:13px;font-weight:900;color:#241A11;margin-bottom:4px}
.phase-period{font-size:10px;color:#C9A24B;font-weight:700;margin-bottom:6px}
.phase-milestones{font-size:11px;color:#5A3E28;line-height:1.7}
.ph-c1{background:#666}.ph-c2{background:#C9A24B}.ph-c3{background:#3D8B4E}.ph-c4{background:#5B82C8}
.ph-l1{background:#E0D8CC}.ph-l2{background:rgba(201,162,75,.3)}.ph-l3{background:rgba(61,139,78,.3)}.ph-l4{background:rgba(91,130,200,.3)}

/* ─── WHY NOW ─── */
.why-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:16px}
.why-card{border-radius:10px;padding:16px 18px;border:1px solid rgba(201,162,75,.25);background:rgba(201,162,75,.07)}
.why-card h4{font-size:12px;font-weight:900;color:#F4ECDD;margin-bottom:6px;display:flex;align-items:center;gap:8px}
.why-card p{font-size:10.5px;color:#A39584;line-height:1.65}

/* ─── CTA ─── */
.cta{background:linear-gradient(135deg,#C9A24B,#EBCB7C);padding:32px 52px;text-align:center}
.cta h2{font-size:22px;font-weight:900;color:#241A11;margin-bottom:8px}
.cta p{font-size:13px;color:#33261A;margin-bottom:20px;line-height:1.7}
.cta-boxes{display:flex;justify-content:center;gap:24px}
.cta-box{background:#241A11;border-radius:12px;padding:16px 28px;text-align:center}
.cta-box-val{font-size:20px;font-weight:900;color:#C9A24B}
.cta-box-lbl{font-size:10px;color:#A39584;margin-top:3px}

/* ─── FOOTER ─── */
.doc-footer{background:#241A11;padding:16px 52px;display:flex;justify-content:space-between;align-items:center}
.doc-footer-brand{font-size:12px;font-weight:700;color:#C9A24B}
.doc-footer-note{font-size:9px;color:#5A4030}

/* ─── PRINT ─── */
@media print{
  .section{page-break-inside:avoid}
  .cover-wrapper{page-break-after:always}
  .fin-table{page-break-inside:avoid}
  .phase-item{page-break-inside:avoid;break-inside:avoid}
  .phase-content{page-break-inside:avoid;break-inside:avoid}
  .phases-timeline{page-break-inside:avoid;break-inside:avoid}
}
</style>
</head>
<body>

<!-- PRINT BAR -->
<div class="print-bar">
  <h2>وثيقة المستثمرين — منصة إعلاني | سري وخاص</h2>
  <button class="btn-print" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>
</div>

<!-- ══════════════════════════════════════════════
     PAGE 1: COVER + LOGO
══════════════════════════════════════════════ -->
<div class="cover-wrapper">
<div class="cover">
  <div class="cover-top">
    <img class="cover-lockup" src="./public/brand/e3lani-lockup.svg" alt="إعلاني" />
    <div class="cover-badge">وثيقة مستثمرين — سري</div>
  </div>
  <div class="cover-eyebrow">فرصة استثمارية — يونيو 2026</div>
  <div class="cover-title">سوق الدعاية والإعلان<br><span>الرقمي في المملكة</span></div>
  <div class="cover-tagline">
    منصة <strong style="color:#F4ECDD">إعلاني</strong> — الوسيط الذكي بين أصحاب الأعمال وموردي الإعلانات في المملكة العربية السعودية.<br>
    أول منصة تُدمج اشتراطات الأمانات البلدية في أدوات التصميم — تصميمك يخرج متوافقاً تلقائياً.
  </div>
  <div class="cover-kpis">
    <div class="kpi"><div class="kpi-val">15 مليار</div><div class="kpi-lbl">ريال حجم سوق<br>الإعلان السعودي (TAM)</div></div>
    <div class="kpi"><div class="kpi-val">3.5 مليار</div><div class="kpi-lbl">ريال السوق<br>المخدوم (SAM)</div></div>
    <div class="kpi"><div class="kpi-val">+18%</div><div class="kpi-lbl">نمو سنوي<br>للإعلان الرقمي</div></div>
    <div class="kpi"><div class="kpi-val">الأولى</div><div class="kpi-lbl">منصة بامتثال<br>بلدي مدمج</div></div>
  </div>
  <div class="cover-date">إعداد: مؤسسة القوافل العربية للمقاولات — يونيو 2026 — الأرقام السوقية والمالية تقديرية وتمهيدية، وتُحسم ضمن دراسة جدوى احترافية قيد الإعداد</div>
</div>
<div class="logo-showcase">
  <img src="./public/brand/e3lani-mark.svg" alt="شعار إعلاني" />
</div>
</div>

<!-- ══════════════════════════════════════════════
     SECTION 1: فكرة المشروع
══════════════════════════════════════════════ -->
<div class="section">
  <div class="eyebrow">القسم الأول</div>
  <div class="section-title">فكرة المشروع — <span>ما هي إعلاني؟</span></div>
  <div class="section-desc">
    إعلاني منصة رقمية متخصصة تربط أصحاب الأعمال والمسوّقين بموردي الدعاية والإعلان (لافتات، بنرات، طباعة، CNC، شاشات، دعاية مضيئة) في السوق السعودي. بدلاً من الاعتماد على الاتصالات المباشرة أو المقاولين الأفراد، توفر المنصة تجربة شراء موحّدة وشفافة.
  </div>
  <div class="two-col">
    <div class="card">
      <h3><span class="icon icon-red">⚠</span> المشكلة</h3>
      <ul>
        <li>السوق مشتّت — لا يوجد سوق موحّد للدعاية والإعلان</li>
        <li>صعوبة مقارنة الأسعار بين الموردين</li>
        <li>لا شفافية في التسعير — يختلف السعر من عميل لآخر</li>
        <li>تأخر في التسليم وضعف التتبع</li>
        <li>المشاريع الكبيرة تستغرق أسابيع للحصول على عروض أسعار</li>
        <li>المورد الصغير لا يجد قناة تسويق موثوقة</li>
      </ul>
    </div>
    <div class="card">
      <h3><span class="icon icon-green">✓</span> الحل — إعلاني</h3>
      <ul>
        <li><strong>مسار الشراء الفوري:</strong> كتالوج جاهز بأسعار ثابتة وشفافة</li>
        <li><strong>مسار التخصيص:</strong> أداة تصميم مع حساب السعر لحظياً</li>
        <li><strong>مسار المشاريع (RFQ):</strong> إرسال مشروع واستقبال عروض من موردين معتمدين</li>
        <li><strong>ذكاء اصطناعي مدمج:</strong> اقتراح تصاميم متوافقة، تسعير أذكى، ومطابقة بالموردين الأنسب</li>
        <li>دفع آمن + نظام Escrow + تتبع الطلب</li>
        <li>تقييم الموردين لضمان الجودة</li>
      </ul>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════
     SECTION 1B: الميزة التنافسية المحورية — الامتثال البلدي
══════════════════════════════════════════════ -->
<div class="section section-alt">
  <div class="eyebrow">الميزة الحصرية</div>
  <div class="section-title">حل مشكلة <span>الاشتراطات البلدية</span> — الميزة التنافسية التي لا يملكها أحد</div>
  <div class="section-desc">
    أحد أبرز معوّقات قطاع الإعلانات في المملكة: أصحاب الأعمال لا يعرفون اشتراطات الأمانة والبلدية لكل منطقة — فتُركَّب اللوحات ثم تُزال أو تُغرَّم لاحقاً. إعلاني تحل هذه المشكلة بشكل جذري: <strong>كل تصميم يخرج من أدوات المنصة يكون متوافقاً تلقائياً مع اشتراطات البلدية في المدينة المختارة.</strong>
  </div>

  <div class="moat-banner">
    <div class="moat-icon">🏛</div>
    <div class="moat-text">
      <h3>الخندق التنافسي (Competitive Moat) — لا يمكن نسخه بسهولة</h3>
      <p>
        بناء قاعدة بيانات اشتراطات الأمانات السعودية (أبعاد، مواد، إضاءة، ألوان، ارتفاعات، مناطق محظورة) يستغرق أشهراً من التفاوض والتوثيق.
        من يبنيها أولاً يمتلك ميزة يصعب على أي منافس الوصول إليها لاحقاً — وهذا ما يبدأ به إعلاني من المرحلة الأولى.
      </p>
    </div>
  </div>

  <!-- كيف تعمل المنصة -->
  <div style="font-size:11px;font-weight:700;color:#5A3E28;margin-bottom:8px">كيف تعمل منصة إعلاني — من تحديد الموقع إلى عرضٍ متوافق ومسعّر:</div>
  <div class="reg-flow">
    <div class="reg-step reg-step-s1">
      <div class="reg-step-num" style="background:#5B82C8">١</div>
      <div class="reg-step-title">تحديد موقع اللوحة</div>
      <div class="reg-step-desc">العميل يحدد المدينة + الحي + نوع الشارع (تجاري / سكني / طريق رئيسي)</div>
    </div>
    <div class="reg-step reg-step-s2">
      <div class="reg-step-num" style="background:#C9A24B">٢</div>
      <div class="reg-step-title">سحب الاشتراطات تلقائياً</div>
      <div class="reg-step-desc">المنصة تستدعي اشتراطات الأمانة: المساحة القصوى، الارتفاع، المواد، الإضاءة، التباعد</div>
    </div>
    <div class="reg-step" style="background:rgba(109,79,179,.08);border-left:2px solid rgba(109,79,179,.3);flex:1;padding:16px 14px;text-align:center;position:relative">
      <div class="reg-step-num" style="background:#6D4FB3">٣</div>
      <div class="reg-step-title">تصميم موجّه بالذكاء الاصطناعي</div>
      <div class="reg-step-desc">أداة التصميم تُقيَّد ضمن الحدود المسموحة، والذكاء الاصطناعي يقترح تصاميم وصياغات متوافقة</div>
    </div>
    <div class="reg-step reg-step-s2">
      <div class="reg-step-num" style="background:#B38F3A">٤</div>
      <div class="reg-step-title">تسعير فوري + عروض الموردين</div>
      <div class="reg-step-desc">سعر تقديري لحظي، ثم عروض تنافسية من موردين معتمدين قريبين من المستفيد</div>
    </div>
    <div class="reg-step reg-step-s4">
      <div class="reg-step-num" style="background:#2E7A3E">٥</div>
      <div class="reg-step-title">تصميم متوافق ✓ + تقرير امتثال</div>
      <div class="reg-step-desc">يصدر تقرير PDF جاهز لتقديمه للأمانة مع طلب الترخيص</div>
    </div>
  </div>

  <!-- المشكلة الحالية vs الحل -->
  <div class="two-col" style="margin-top:16px">
    <div class="card" style="border-color:#B54040;background:rgba(181,64,64,.05)">
      <h3><span class="icon icon-red">✗</span> قبل إعلاني — المشكلة الحالية</h3>
      <ul>
        <li>صاحب المحل يطلب لوحة حسب تصوّره الشخصي</li>
        <li>المورد يُنفَّذ دون مراجعة الاشتراطات</li>
        <li>الأمانة ترفض الترخيص أو تأمر بإزالة اللوحة</li>
        <li>خسارة تكلفة التنفيذ + غرامات تصل لـ 50,000 ريال</li>
        <li>إعادة التصميم والتنفيذ من الصفر</li>
      </ul>
    </div>
    <div class="card" style="border-color:#3D8B4E;background:rgba(61,139,78,.05)">
      <h3><span class="icon icon-green">✓</span> مع إعلاني — الحل الكامل</h3>
      <ul>
        <li>العميل يختار الموقع، المنصة تحدد الحدود تلقائياً</li>
        <li>التصميم يخرج مطابقاً للاشتراطات من اليوم الأول</li>
        <li>تقرير امتثال PDF لتسريع إجراءات الترخيص</li>
        <li>صفر غرامات — صفر إزالات — صفر إعادة تنفيذ</li>
        <li>توفير وقت الحصول على الموافقة بنسبة تصل 70%</li>
      </ul>
    </div>
  </div>

  <!-- خطة الانطلاق الجغرافي -->
  <div style="break-after:avoid;page-break-after:avoid;font-size:13px;font-weight:900;color:#241A11;margin:24px 0 12px;padding-top:20px;border-top:2px solid #D4C4A8">
    استراتيجية الانطلاق الجغرافي — من أمانة جدة إلى المملكة كاملةً
  </div>
  <div class="launch-map">
    <div class="launch-phase launch-phase-1">
      <span class="tag tag-now">المرحلة الأولى — الإطلاق</span>
      <h4>🏙 كامل نطاق أمانة محافظة جدة</h4>
      <ul>
        <li><strong>مدينة جدة</strong> — بجميع بلدياتها الفرعية</li>
        <li>محافظة رابغ ومراكزها</li>
        <li>محافظة خليص ومراكزها</li>
        <li>محافظة الكامل ومراكزها</li>
        <li>محافظات القنفذة وأمج والليث ومراكزها</li>
      </ul>
      <div style="margin-top:10px;font-size:10px;color:#9A6A2A;font-weight:700">
        السبب: اشتراطات موحّدة تحت مظلة أمانة واحدة — أسرع في البناء والتفاوض، وتغطية كاملة لنطاق الأمانة من اليوم الأول
      </div>
      <div class="city-chips" style="margin-top:8px">
        <span class="chip chip-active">جدة</span>
        <span class="chip chip-active">رابغ</span>
        <span class="chip chip-active">خليص</span>
        <span class="chip chip-active">الكامل</span>
        <span class="chip chip-active">القنفذة</span>
        <span class="chip chip-active">أمج</span>
        <span class="chip chip-active">الليث</span>
      </div>
    </div>
    <div class="launch-phase launch-phase-2">
      <span class="tag tag-next">المرحلة الثانية — التوسع</span>
      <h4>🗺 إطلاق شامل — جميع المدن السعودية</h4>
      <ul>
        <li>أمانة الرياض — أكبر سوق في المملكة</li>
        <li>أمانة مكة المكرمة — السياحة والحج</li>
        <li>أمانة المدينة المنورة</li>
        <li>أمانة المنطقة الشرقية (الدمام، الخبر، الأحساء)</li>
        <li>أمانات المناطق الشمالية والجنوبية</li>
      </ul>
      <div class="city-chips" style="margin-top:8px">
        <span class="chip chip-next">الرياض</span>
        <span class="chip chip-next">مكة</span>
        <span class="chip chip-next">الدمام</span>
        <span class="chip chip-next">المدينة</span>
        <span class="chip chip-next">+9 مناطق</span>
      </div>
    </div>
  </div>

  <div style="margin-top:14px;padding:14px 18px;background:rgba(201,162,75,.1);border-radius:10px;border-right:3px solid #C9A24B">
    <span style="font-size:11px;font-weight:900;color:#9A6A2A">الميزة طويلة الأمد: </span>
    <span style="font-size:11px;color:#241A11">
      مع توسع المنصة، تصبح قاعدة بيانات الاشتراطات أصلاً استراتيجياً قابلاً للترخيص للجهات الحكومية وشركات البناء والتطوير — مصدر إيراد إضافي غير مباشر في المرحلة الثالثة.
    </span>
  </div>
</div>

<!-- ══════════════════════════════════════════════
     SECTION 1C: لمحة من المنصة (لقطات حقيقية)
══════════════════════════════════════════════ -->
<div class="section">
  <div class="eyebrow">المنتج</div>
  <div class="section-title">لمحة من المنصة — <span>الأداة قيد التشغيل الفعلي</span></div>
  <div class="section-desc">
    واجهات حقيقية من المنصة أثناء التطوير، تعكس الهوية البصرية وتجربة الاستخدام.
    وأبرزها <strong>أداة تصميم اللوحات التجارية</strong> التي تُظهر النتيجة لحظياً، مع ضبط المواصفات وضمان التوافق التلقائي مع اشتراطات الأمانة.
  </div>
  <div class="shots">
    <div class="shot shot-feature">
      <img src="./public/brand/screens/designer.png" alt="أداة تصميم اللوحات التجارية" />
      <div class="shot-cap">🎨 أداة تصميم اللوحات التجارية — معاينة فورية + خيارات المواصفات + امتثال تلقائي لاشتراطات الأمانة</div>
    </div>
    <div class="shot">
      <img src="./public/brand/screens/home.png" alt="الصفحة الرئيسية لمنصة إعلاني" />
      <div class="shot-cap">الواجهة الرئيسية — مسارات الشراء والتصميم والمشاريع</div>
    </div>
    <div class="shot">
      <img src="./public/brand/screens/products.png" alt="كتالوج المنتجات" />
      <div class="shot-cap">كتالوج المنتجات والفئات</div>
    </div>
  </div>
  <div style="margin-top:12px;font-size:9.5px;color:#8A7A66;text-align:center">لقطات فعلية من بيئة التطوير — قد تختلف بعض التفاصيل في الإصدار النهائي.</div>
</div>

<!-- ══════════════════════════════════════════════
     SECTION 2: السوق المستهدف
══════════════════════════════════════════════ -->
<div class="section section-alt">
  <div class="eyebrow">القسم الثاني</div>
  <div class="section-title">السوق المستهدف — <span>حجم الفرصة</span></div>
  <div class="section-desc">
    السوق السعودي للإعلان والدعاية يشهد نمواً متسارعاً مع رؤية 2030 وطفرة الاستثمار التجاري والمشاريع العملاقة.
    النمو السنوي للإعلان الرقمي يتجاوز 18% وهو من أعلى معدلات المنطقة.
  </div>
  <div class="market-circles">
    <div class="mcirc mcirc-1">
      <div class="mcirc-label">TAM — السوق الكلي</div>
      <div class="mcirc-val">15 مليار ﷼</div>
      <div class="mcirc-desc">إجمالي الإنفاق الإعلاني<br>في المملكة سنوياً</div>
    </div>
    <div class="mcirc mcirc-2">
      <div class="mcirc-label">SAM — السوق المخدوم</div>
      <div class="mcirc-val">3.5 مليار ﷼</div>
      <div class="mcirc-desc">لافتات، طباعة، CNC،<br>دعاية مضيئة، بنرات</div>
    </div>
    <div class="mcirc mcirc-3">
      <div class="mcirc-label">SOM — هدفنا الأولي</div>
      <div class="mcirc-val">75 مليون ﷼</div>
      <div class="mcirc-desc">حصة 2% في 3 سنوات<br>السوق الرقمي المتاح</div>
    </div>
  </div>
  <div class="two-col" style="margin-top:20px">
    <div class="card">
      <h3>🏢 العملاء المستهدفون</h3>
      <ul>
        <li>المنشآت الصغيرة والمتوسطة (1.3 مليون منشأة في المملكة)</li>
        <li>المطاعم والكافيهات والمحلات التجارية</li>
        <li>شركات الأحداث والفعاليات</li>
        <li>الوكالات الإعلانية ومنظمو المعارض</li>
        <li>المطوّرون العقاريون والمقاولون</li>
      </ul>
    </div>
    <div class="card">
      <h3>🔧 الموردون الشركاء</h3>
      <ul>
        <li>مصانع اللافتات والدعاية المضيئة</li>
        <li>مراكز الطباعة الرقمية والواسعة</li>
        <li>ورش CNC وقص الأكريليك والمعادن</li>
        <li>شركات الشاشات الإلكترونية</li>
        <li>منفّذو الدعاية الخارجية (OOH)</li>
      </ul>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════
     SECTION 3: نموذج الإيرادات
══════════════════════════════════════════════ -->
<div class="section">
  <div class="eyebrow">القسم الثالث</div>
  <div class="section-title">نموذج الإيرادات — <span>كيف تربح المنصة؟</span></div>
  <div class="section-desc">أربعة مصادر إيراد متنوعة تضمن الاستدامة المالية للمنصة من المرحلة الأولى.</div>
  <div class="rev-grid">
    <div class="rev-card">
      <div class="rev-icon">🛒</div>
      <div class="rev-title">عمولة المعاملات</div>
      <div class="rev-model">10 — 12% من قيمة الطلب</div>
      <div class="rev-desc">على كل عملية بيع وشراء تتم عبر المنصة — المصدر الأساسي للإيراد</div>
    </div>
    <div class="rev-card">
      <div class="rev-icon">⭐</div>
      <div class="rev-title">اشتراك الموردين</div>
      <div class="rev-model">300 — 1,200 ريال/شهر</div>
      <div class="rev-desc">باقات للموردين: ظهور مميز، أدوات تحليل، وصول لبيانات السوق</div>
    </div>
    <div class="rev-card">
      <div class="rev-icon">🎨</div>
      <div class="rev-title">خدمة التصميم</div>
      <div class="rev-model">هامش 25 — 35%</div>
      <div class="rev-desc">وساطة خدمات التصميم بين العملاء ومصممي المنصة المعتمدين</div>
    </div>
    <div class="rev-card">
      <div class="rev-icon">📢</div>
      <div class="rev-title">الإعلان المدفوع</div>
      <div class="rev-model">بانرات + ظهور أولي</div>
      <div class="rev-desc">إعلانات الموردين داخل المنصة وقوائم الفئات المميزة</div>
    </div>
    <div class="rev-card">
      <div class="rev-icon">🔒</div>
      <div class="rev-title">Escrow + ضمان</div>
      <div class="rev-model">1 — 2% رسوم تجميد</div>
      <div class="rev-desc">رسوم إضافية على نظام الضمان للمشاريع الكبيرة (RFQ)</div>
    </div>
    <div class="rev-card">
      <div class="rev-icon">📊</div>
      <div class="rev-title">بيانات السوق</div>
      <div class="rev-model">اشتراكات مؤسسية</div>
      <div class="rev-desc">تقارير أسعار السوق وتوجهات الطلب للشركات والجهات الحكومية (مرحلة 3)</div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════
     SECTION 4: دراسة الجدوى المالية
══════════════════════════════════════════════ -->
<div class="section section-alt">
  <div class="eyebrow">القسم الرابع</div>
  <div class="section-title">التوقعات المالية التمهيدية — <span>سيناريو محافظ</span></div>
  <div class="section-desc">
    الأرقام التالية تقديرات داخلية تمهيدية تعكس سيناريو نمو محافظاً، مبنية على متوسط قيمة طلب 3,500 ريال، ونسبة عمولة 11%، وعدد موردين مبدئي 30 مورداً في مرحلة الإطلاق.
    <strong style="color:#9A6A2A">وهي قابلة للمراجعة والتدقيق ضمن دراسة الجدوى الاحترافية التي يجري الإعداد لإسنادها إلى بيت خبرة استشاري متخصص</strong> (انظر القسم التالي).
  </div>
  <table class="fin-table">
    <thead>
      <tr>
        <th>البند</th>
        <th>السنة الأولى</th>
        <th>السنة الثانية</th>
        <th>السنة الثالثة</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>عدد الطلبات الشهرية (نهاية العام)</td>
        <td>80 طلب</td>
        <td>280 طلب</td>
        <td>750 طلب</td>
      </tr>
      <tr>
        <td>متوسط قيمة الطلب</td>
        <td>3,200 ﷼</td>
        <td>3,800 ﷼</td>
        <td>4,500 ﷼</td>
      </tr>
      <tr class="gold-row">
        <td>إجمالي GMV (حجم المعاملات)</td>
        <td>1.8 مليون ﷼</td>
        <td>7.2 مليون ﷼</td>
        <td>22 مليون ﷼</td>
      </tr>
      <tr>
        <td>إيراد العمولة (11%)</td>
        <td>198,000 ﷼</td>
        <td>792,000 ﷼</td>
        <td>2,420,000 ﷼</td>
      </tr>
      <tr>
        <td>اشتراكات الموردين</td>
        <td>72,000 ﷼</td>
        <td>216,000 ﷼</td>
        <td>480,000 ﷼</td>
      </tr>
      <tr>
        <td>خدمات التصميم والإضافات</td>
        <td>30,000 ﷼</td>
        <td>120,000 ﷼</td>
        <td>350,000 ﷼</td>
      </tr>
      <tr class="gold-row">
        <td>إجمالي الإيرادات</td>
        <td>300,000 ﷼</td>
        <td>1,128,000 ﷼</td>
        <td>3,250,000 ﷼</td>
      </tr>
      <tr>
        <td>تكاليف التشغيل (فريق + بنية تحتية)</td>
        <td class="loss">820,000 ﷼</td>
        <td class="loss">1,050,000 ﷼</td>
        <td>1,400,000 ﷼</td>
      </tr>
      <tr>
        <td>تسويق واكتساب عملاء</td>
        <td class="loss">180,000 ﷼</td>
        <td class="loss">280,000 ﷼</td>
        <td>350,000 ﷼</td>
      </tr>
      <tr class="total-row">
        <td>صافي الربح / الخسارة</td>
        <td>– 700,000 ﷼</td>
        <td>– 202,000 ﷼</td>
        <td>+ 1,500,000 ﷼</td>
      </tr>
    </tbody>
  </table>
  <div style="margin-top:14px;padding:12px 16px;background:rgba(61,139,78,.1);border-radius:8px;border-right:3px solid #3D8B4E">
    <span style="font-size:11px;font-weight:700;color:#2E7A3E">نقطة التعادل (Break-Even):</span>
    <span style="font-size:11px;color:#241A11"> الشهر 18 من تاريخ الإطلاق — عند بلوغ 180 طلباً شهرياً بمتوسط 3,500 ريال</span>
  </div>
</div>

<!-- ══════════════════════════════════════════════
     SECTION 4B: نموذج الاستثمار ورأس المال — قيد الإعداد
══════════════════════════════════════════════ -->
<div class="section">
  <div class="eyebrow">نموذج الاستثمار</div>
  <div class="section-title">رأس المال ونموذج الاستثمار — <span>قيد الإعداد مع بيت خبرة استشاري</span></div>
  <div class="section-desc">
    إيماناً بأن قراراً بهذا الحجم يستحق أساساً مهنياً دقيقاً، اختارت المؤسسة <strong>عدم تثبيت رقم رأس مال أو هيكل ملكية مسبقاً</strong>،
    والاتجاه بدلاً من ذلك إلى إسناد إعداد دراسة الجدوى وهيكلة الاستثمار إلى بيت خبرة استشاري ومالي متخصص.
    الغاية أن يُبنى حجم التمويل المطلوب ونموذج الاستثمار على أرقام مدقّقة ومعايير سوق موثوقة — لا على تقديرات مبدئية.
  </div>

  <div class="moat-banner" style="background:linear-gradient(135deg,#1F2A3A,#0D1626);border-color:#5B82C8">
    <div class="moat-icon">📐</div>
    <div class="moat-text">
      <h3 style="color:#8FB0E0">العمل جارٍ على</h3>
      <p style="color:#B8C8E0">
        تكليف جهة استشارية متخصصة بإعداد دراسة جدوى احترافية، وتحديد رأس المال المطلوب بدقة،
        واقتراح نموذج الاستثمار وهيكل الملكية والحوكمة الأنسب — بما يحفظ حقوق المستثمر ويتوافق مع أفضل الممارسات.
      </p>
    </div>
  </div>

  <div class="two-col" style="margin-top:4px">
    <div class="card">
      <h3><span class="icon">📊</span> ما ستحدده الدراسة الاستشارية</h3>
      <ul>
        <li>حجم رأس المال المطلوب بدقة (CapEx + OpEx حتى الاكتفاء)</li>
        <li>نموذج الاستثمار الأنسب (حقوق ملكية / أداة قابلة للتحويل / مرحلي)</li>
        <li>التقييم العادل المبني على معايير ومضاعفات السوق</li>
        <li>هيكل الملكية والحوكمة وحقوق المستثمر</li>
        <li>تحليل الحساسية والمخاطر وسيناريوهات النمو</li>
      </ul>
    </div>
    <div class="card">
      <h3><span class="icon">🤝</span> دعوة لمستثمر استراتيجي</h3>
      <ul>
        <li>نبحث عن شريك استراتيجي يؤمن بالفكرة وأثرها في السوق السعودي</li>
        <li>الانفتاح على مشاركة مستشاري المستثمر في مراجعة الدراسة وصياغة الصفقة</li>
        <li>شفافية كاملة في البيانات والافتراضات والنماذج المالية</li>
        <li>التزام بالحوكمة والتقارير الدورية بعد الاستثمار</li>
        <li>جزء كبير من المنصة مطوَّر ومختبَر ويكتمل خلال أسبوعين — التمويل موجّه للنمو والتشغيل لا لبناء الأساس من الصفر</li>
      </ul>
    </div>
  </div>

  <div style="margin-top:16px;padding:14px 18px;background:rgba(201,162,75,.1);border-radius:10px;border-right:3px solid #C9A24B">
    <span style="font-size:11px;font-weight:900;color:#9A6A2A">الخلاصة: </span>
    <span style="font-size:11px;color:#241A11">
      تُعرض هذه الوثيقة لاستكشاف الاهتمام المبدئي بالفرصة. أما الأرقام النهائية لرأس المال والتقييم وهيكل الصفقة فتُحدَّد بالتشارك مع بيت الخبرة الاستشاري ومستشاري المستثمر، وتُوثَّق في مذكرة استثمار تفصيلية لاحقة.
    </span>
  </div>
</div>

<!-- ══════════════════════════════════════════════
     SECTION 5: الميزانية المبدئية
══════════════════════════════════════════════ -->
<div class="section">
  <div class="eyebrow">القسم الخامس</div>
  <div class="section-title">أوجه استخدام رأس المال — <span>توزيع تقديري مبدئي</span></div>
  <div class="section-desc">
    يوضح الجدول التالي التوزيع النسبي المبدئي لأوجه إنفاق رأس المال على مدى نحو 18 شهراً حتى الاكتفاء الذاتي.
    <strong style="color:#9A6A2A">النسب استرشادية، وتُحسم المبالغ المطلقة ضمن دراسة الجدوى الاحترافية</strong> المشار إليها في القسم الرابع.
  </div>
  <div class="budget-bars">
    <div class="bbar">
      <div class="bbar-label">الفريق والتشغيل</div>
      <div class="bbar-track"><div class="bbar-fill" style="width:40%;background:linear-gradient(90deg,#33261A,#5A3E28)"><span>40%</span></div></div>
      <div class="bbar-amount">~40%</div>
    </div>
    <div class="bbar">
      <div class="bbar-label">تطوير المنصة التقنية</div>
      <div class="bbar-track"><div class="bbar-fill" style="width:33%;background:linear-gradient(90deg,#C9A24B,#EBCB7C)"><span>33%</span></div></div>
      <div class="bbar-amount">~33%</div>
    </div>
    <div class="bbar">
      <div class="bbar-label">تسويق وإطلاق واكتساب عملاء</div>
      <div class="bbar-track"><div class="bbar-fill" style="width:20%;background:linear-gradient(90deg,#3D8B4E,#5DAD6E)"><span>20%</span></div></div>
      <div class="bbar-amount">~20%</div>
    </div>
    <div class="bbar">
      <div class="bbar-label">تراخيص وقانوني وبنية تحتية</div>
      <div class="bbar-track"><div class="bbar-fill" style="width:5%;background:#5B82C8"><span>5%</span></div></div>
      <div class="bbar-amount">~5%</div>
    </div>
    <div class="bbar">
      <div class="bbar-label">احتياطي طوارئ</div>
      <div class="bbar-track"><div class="bbar-fill" style="width:2%;background:#888"><span></span></div></div>
      <div class="bbar-amount">~2%</div>
    </div>
  </div>
  <div class="two-col" style="margin-top:20px">
    <div class="card">
      <h3>👥 تفصيل الفريق</h3>
      <ul>
        <li>مطوّر Full-Stack رئيسي × 1</li>
        <li>مطوّر Frontend (Next.js) × 1</li>
        <li>مصمم UX/UI × 1</li>
        <li>مدير تسويق ومبيعات × 1</li>
        <li>مدير العمليات × 1</li>
      </ul>
    </div>
    <div class="card">
      <h3>💻 التقنية والبنية</h3>
      <ul>
        <li>تطوير المنصة (Next.js + Supabase + Prisma)</li>
        <li>بوابة الدفع Moyasar + Escrow</li>
        <li>البنية التحتية السحابية (Vercel + Supabase)</li>
        <li>تطبيق الهاتف (المرحلة 2)</li>
        <li>اختبار الأمان والامتثال التقني</li>
      </ul>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════
     SECTION 6: مراحل التنفيذ
══════════════════════════════════════════════ -->
<div class="section section-alt">
  <div class="eyebrow">القسم السادس</div>
  <div class="section-title">خطة التنفيذ — <span>3 مراحل خلال 18 شهراً</span></div>
  <div class="section-desc">طُوِّر واختُبر جزء كبير من المنصة، ويكتمل بناؤها التقني خلال نحو أسبوعين. ولا تُطلَق للعموم حتى تكتمل جاهزيتها الكاملة — تُستكمل بعدها قاعدة الاشتراطات البلدية وتجنيد الموردين خلال مرحلة التجهيز، ثم انطلاق مدروس من أمانة جدة، فتغطية كاملة للمملكة.</div>

  <!-- شريط الجدول الزمني -->
  <div style="display:flex;margin-bottom:28px;border-radius:12px;overflow:hidden;border:1px solid #D4C4A8">
    <div style="flex:2;background:#241A11;padding:14px 18px;text-align:center">
      <div style="font-size:9px;font-weight:700;color:#C9A24B;letter-spacing:.12em;text-transform:uppercase;margin-bottom:4px">الأشهر 1 — 3</div>
      <div style="font-size:12px;font-weight:900;color:#F4ECDD">التطوير والتجهيز الكامل</div>
      <div style="font-size:9.5px;color:#A39584;margin-top:2px">قبل الإطلاق — لا يراها أحد حتى تكتمل</div>
    </div>
    <div style="flex:3;background:linear-gradient(135deg,#B38F3A,#C9A24B);padding:14px 18px;text-align:center">
      <div style="font-size:9px;font-weight:700;color:#241A11;letter-spacing:.12em;text-transform:uppercase;margin-bottom:4px">الأشهر 4 — 9</div>
      <div style="font-size:12px;font-weight:900;color:#241A11">الإطلاق المصغر</div>
      <div style="font-size:9.5px;color:#33261A;margin-top:2px">أمانة جدة + المحافظات التابعة</div>
    </div>
    <div style="flex:5;background:linear-gradient(135deg,#2E7A3E,#3D8B4E);padding:14px 18px;text-align:center">
      <div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.8);letter-spacing:.12em;text-transform:uppercase;margin-bottom:4px">الأشهر 10 — 18</div>
      <div style="font-size:12px;font-weight:900;color:#fff">الإطلاق الكامل</div>
      <div style="font-size:9.5px;color:rgba(255,255,255,.8);margin-top:2px">جميع مدن المملكة العربية السعودية</div>
    </div>
  </div>

  <div class="phases-timeline">

    <!-- المرحلة 1: التطوير -->
    <div class="phase-item">
      <div class="phase-line">
        <div class="phase-dot" style="background:#241A11">١</div>
        <div class="phase-connector" style="background:#D4C4A8"></div>
      </div>
      <div class="phase-content">
        <div class="phase-title">مرحلة التطوير والتجهيز الكامل — قبل أي إطلاق</div>
        <div class="phase-period" style="color:#241A11;background:rgba(0,0,0,.07);display:inline-block;padding:2px 12px;border-radius:999px;font-size:10px;font-weight:700;margin-bottom:8px">الأشهر 1 — 3 من تأمين الاستثمار</div>
        <div class="phase-milestones">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div style="background:#FAF7F3;border-radius:8px;padding:12px;border-right:3px solid #241A11">
              <div style="font-size:10px;font-weight:900;color:#241A11;margin-bottom:6px">⚙ المنصة التقنية الكاملة</div>
              <div style="font-size:10px;color:#5A3E28;line-height:1.75">
                • البنية الجاهزة: Auth + Schema + Admin ✓<br>
                • كتالوج المنتجات + صفحة المنتج + سلة<br>
                • أداة Configurator + تسعير فوري لحظي<br>
                • نظام RFQ كامل + لوحة الشريك<br>
                • بوابة دفع Moyasar + نظام Escrow<br>
                • تتبع الطلبات + إشعارات Realtime<br>
                • لوحة Admin شاملة للإدارة الكاملة
              </div>
            </div>
            <div style="background:#FAF7F3;border-radius:8px;padding:12px;border-right:3px solid #C9A24B">
              <div style="font-size:10px;font-weight:900;color:#241A11;margin-bottom:6px">🏛 قاعدة الاشتراطات البلدية</div>
              <div style="font-size:10px;color:#5A3E28;line-height:1.75">
                • توثيق اشتراطات أمانة جدة كاملةً<br>
                • إدخال بيانات جميع المحافظات التابعة<br>
                • ربط الاشتراطات بأداة التصميم والـ Configurator<br>
                • اختبار 100% توافق كل تصميم ناتج<br>
                • قالب تقرير الامتثال PDF الجاهز للأمانة<br>
                • تجنيد أول 30 مورداً معتمداً من المنطقة<br>
                • إجراء الموافقات القانونية والترخيص
              </div>
            </div>
          </div>
          <div style="margin-top:10px;padding:11px 14px;background:#241A11;border-radius:8px;display:flex;align-items:center;gap:10px">
            <span style="font-size:18px">🎯</span>
            <span style="font-size:11px;color:#F4ECDD"><strong style="color:#C9A24B">شرط الإطلاق الإلزامي:</strong> المنصة لا تفتح للعموم إلا عند اجتياز اختبار 100% لاشتراطات أمانة جدة + وجود 30 مورداً نشطاً على الأقل</span>
          </div>
        </div>
      </div>
    </div>

    <!-- المرحلة 2: الإطلاق المصغر -->
    <div class="phase-item">
      <div class="phase-line">
        <div class="phase-dot" style="background:#C9A24B">٢</div>
        <div class="phase-connector" style="background:rgba(201,162,75,.3)"></div>
      </div>
      <div class="phase-content">
        <div class="phase-title">الإطلاق المصغر — أمانة جدة والمحافظات التابعة</div>
        <div class="phase-period" style="color:#9A6A2A;background:rgba(201,162,75,.15);display:inline-block;padding:2px 12px;border-radius:999px;font-size:10px;font-weight:700;margin-bottom:8px">الأشهر 4 — 9 | 6 أشهر تشغيل فعلي</div>
        <div class="phase-milestones">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div style="background:#FAF7F3;border-radius:8px;padding:12px;border-right:3px solid #C9A24B">
              <div style="font-size:10px;font-weight:900;color:#241A11;margin-bottom:6px">🏙 المدن المشمولة بالإطلاق</div>
              <div style="font-size:10px;color:#5A3E28;line-height:1.8">
                • جدة — المدينة الرئيسية (اشتراطات موحّدة)<br>
                • محافظة رابغ<br>
                • محافظة خليص<br>
                • محافظة الكامل<br>
                • محافظة القنفذة + أمج + الليث
              </div>
            </div>
            <div style="background:#FAF7F3;border-radius:8px;padding:12px;border-right:3px solid #C9A24B">
              <div style="font-size:10px;font-weight:900;color:#241A11;margin-bottom:6px">📊 أهداف المرحلة</div>
              <div style="font-size:10px;color:#5A3E28;line-height:1.8">
                • 80 طلب/شهر بنهاية الشهر التاسع<br>
                • 50+ مورداً معتمداً في المنطقة<br>
                • معدل رضا عملاء لا يقل عن 4.5/5<br>
                • صفر شكاوى امتثال بلدي<br>
                • 500+ مستخدم مسجّل
              </div>
            </div>
          </div>
          <div style="margin-top:10px;padding:11px 14px;background:rgba(201,162,75,.1);border-radius:8px;border-right:3px solid #C9A24B">
            <span style="font-size:11px;color:#241A11"><strong style="color:#9A6A2A">الهدف الاستراتيجي:</strong> إثبات نموذج العمل وجمع البيانات والتقييمات في بيئة محدودة — أي خلل يُعالَج قبل الانطلاق الوطني</span>
          </div>
        </div>
      </div>
    </div>

    <!-- المرحلة 3: الإطلاق الكامل -->
    <div class="phase-item">
      <div class="phase-line">
        <div class="phase-dot" style="background:#3D8B4E">٣</div>
        <div class="phase-connector" style="background:rgba(61,139,78,.2)"></div>
      </div>
      <div class="phase-content">
        <div class="phase-title">الإطلاق الكامل — جميع مدن المملكة العربية السعودية</div>
        <div class="phase-period" style="color:#2E7A3E;background:rgba(61,139,78,.12);display:inline-block;padding:2px 12px;border-radius:999px;font-size:10px;font-weight:700;margin-bottom:8px">الأشهر 10 — 18 | 9 أشهر توسع وطني</div>
        <div class="phase-milestones">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
            <div style="background:#FAF7F3;border-radius:8px;padding:12px;border-right:3px solid #3D8B4E">
              <div style="font-size:10px;font-weight:900;color:#241A11;margin-bottom:6px">🗺 التوسع الجغرافي التدريجي</div>
              <div style="font-size:10px;color:#5A3E28;line-height:1.7">
                • أمانة الرياض (ش 10)<br>
                • أمانة مكة المكرمة (ش 11)<br>
                • أمانة المنطقة الشرقية (ش 12)<br>
                • أمانة المدينة المنورة (ش 13)<br>
                • باقي 9 مناطق (ش 14 — 16)
              </div>
            </div>
            <div style="background:#FAF7F3;border-radius:8px;padding:12px;border-right:3px solid #3D8B4E">
              <div style="font-size:10px;font-weight:900;color:#241A11;margin-bottom:6px">⚡ التطوير المصاحب</div>
              <div style="font-size:10px;color:#5A3E28;line-height:1.7">
                • إضافة اشتراطات كل أمانة تدريجياً<br>
                • تطبيق الجوال (iOS + Android)<br>
                • API للشراكات المؤسسية<br>
                • برنامج الإحالة للموردين<br>
                • لوحة تحليلات متقدمة
              </div>
            </div>
            <div style="background:#FAF7F3;border-radius:8px;padding:12px;border-right:3px solid #3D8B4E">
              <div style="font-size:10px;font-weight:900;color:#241A11;margin-bottom:6px">📈 أهداف نهاية ش 18</div>
              <div style="font-size:10px;color:#5A3E28;line-height:1.7">
                • 750 طلب/شهر<br>
                • 200+ مورد وطنياً<br>
                • تغطية 13 منطقة<br>
                • الوصول لنقطة التعادل<br>
                • الاستعداد لـ Series A
              </div>
            </div>
          </div>
          <div style="margin-top:10px;padding:11px 14px;background:rgba(61,139,78,.1);border-radius:8px;border-right:3px solid #3D8B4E">
            <span style="font-size:11px;color:#241A11"><strong style="color:#2E7A3E">المحرّك الرئيسي للتوسع:</strong> كل أمانة جديدة تُضاف لقاعدة البيانات تُعطي المنصة ميزة تنافسية إضافية لا يملكها أي منافس في تلك المنطقة — التوسع يعني تعميق الخندق التنافسي</span>
          </div>
        </div>
      </div>
    </div>

  </div>

  <!-- جدول ملخص المراحل -->
  <div style="margin-top:4px;border-radius:10px;overflow:hidden;border:1px solid #D4C4A8">
    <table style="width:100%;border-collapse:collapse;font-size:11px">
      <thead><tr style="background:#241A11;color:#F4ECDD">
        <th style="padding:10px 14px;text-align:right;font-weight:700">المرحلة</th>
        <th style="padding:10px 14px;text-align:right;font-weight:700">المدة</th>
        <th style="padding:10px 14px;text-align:right;font-weight:700">التوقيت</th>
        <th style="padding:10px 14px;text-align:right;font-weight:700">KPI الرئيسي</th>
        <th style="padding:10px 14px;text-align:right;font-weight:700">الإيراد الشهري المتوقع</th>
      </tr></thead>
      <tbody>
        <tr style="background:#FAF7F3">
          <td style="padding:10px 14px;font-weight:700">التطوير والتجهيز</td>
          <td style="padding:10px 14px">3 أشهر</td>
          <td style="padding:10px 14px"><span style="background:#241A11;color:#C9A24B;padding:2px 10px;border-radius:999px;font-size:9.5px;font-weight:700">ش 1 — 3</span></td>
          <td style="padding:10px 14px">منصة جاهزة 100% + 30 مورد معتمد</td>
          <td style="padding:10px 14px;color:#B54040;font-weight:700">— (مرحلة استثمار)</td>
        </tr>
        <tr style="background:#fff">
          <td style="padding:10px 14px;font-weight:700">الإطلاق المصغر — جدة</td>
          <td style="padding:10px 14px">6 أشهر</td>
          <td style="padding:10px 14px"><span style="background:rgba(201,162,75,.2);color:#9A6A2A;padding:2px 10px;border-radius:999px;font-size:9.5px;font-weight:700">ش 4 — 9</span></td>
          <td style="padding:10px 14px">80 طلب/شهر، 500 مستخدم</td>
          <td style="padding:10px 14px;color:#9A6A2A;font-weight:700">12,000 — 28,000 ﷼</td>
        </tr>
        <tr style="background:rgba(61,139,78,.05)">
          <td style="padding:10px 14px;font-weight:700">الإطلاق الكامل — المملكة</td>
          <td style="padding:10px 14px">9 أشهر</td>
          <td style="padding:10px 14px"><span style="background:rgba(61,139,78,.15);color:#2E7A3E;padding:2px 10px;border-radius:999px;font-size:9.5px;font-weight:700">ش 10 — 18</span></td>
          <td style="padding:10px 14px">750 طلب/شهر، 13 منطقة</td>
          <td style="padding:10px 14px;color:#2E7A3E;font-weight:700">85,000 — 270,000 ﷼</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ══════════════════════════════════════════════
     SECTION 7: لماذا الآن؟
══════════════════════════════════════════════ -->
<div class="section section-dark">
  <div class="eyebrow" style="color:#C9A24B">القسم السابع</div>
  <div class="section-title-light">لماذا <span>الآن</span>؟ — المؤشرات التي تصبّ في صالح إعلاني</div>
  <div class="section-desc-light">تتقاطع أربعة عوامل استراتيجية في هذه اللحظة لتجعل إعلاني فرصة نادرة.</div>
  <div class="why-grid">
    <div class="why-card">
      <h4>🏗 طفرة رؤية 2030</h4>
      <p>المشاريع العملاقة (نيوم، البحر الأحمر، قدية) تولّد طلباً هائلاً على اللافتات والهوية البصرية والدعاية. المقاولون والمطوّرون بحاجة لمورد موثوق وموحّد.</p>
    </div>
    <div class="why-card">
      <h4>📱 نضج المستهلك الرقمي</h4>
      <p>95% من السعوديين يستخدمون الإنترنت. الشراء الرقمي للخدمات B2B يتسارع. ثقة المنشآت الصغيرة في المنصات الرقمية تجاوزت نقطة التحوّل.</p>
    </div>
    <div class="why-card">
      <h4>🏛 حل مشكلة الاشتراطات البلدية</h4>
      <p>لا توجد منصة واحدة في السعودية تُضمن توافق التصميم مع اشتراطات الأمانات تلقائياً. هذا الحل يخلق ميزة تنافسية دفاعية يصعب تقليدها، ويجعل إعلاني وسيطاً موثوقاً بين الأعمال والجهات التنظيمية.</p>
    </div>
    <div class="why-card">
      <h4>⚡ جزء كبير من المنصة منجز — لا من الصفر</h4>
      <p>طُوِّر واختُبر جزء كبير من المنصة (قاعدة البيانات، المصادقة، واجهة الإدارة، أدوات التصميم والتسعير)، ويكتمل بناؤها خلال نحو أسبوعين. الاستثمار يذهب للنمو والتسويق، لا لبناء الأساس من البداية.</p>
    </div>
    <div class="why-card" style="grid-column:1/-1;border-color:rgba(109,79,179,.35);background:rgba(109,79,179,.08)">
      <h4>🤖 موجة الذكاء الاصطناعي — رافعة للمنصة</h4>
      <p>
        تدمج إعلاني تطبيقات الذكاء الاصطناعي في صميم تجربتها: اقتراح تصاميم وصياغات متوافقة مع الاشتراطات، ومطابقة الطلب بالموردين الأنسب،
        وتسعير أذكى، ومساعد محادثة يرشد المستخدم خطوة بخطوة. نضوج هذه الأدوات اليوم يرفع جودة التجربة ويخفض التكلفة التشغيلية — ميزة لم تكن متاحة بهذه الكفاءة قبل عامين.
      </p>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════
     CTA
══════════════════════════════════════════════ -->
<!-- FOOTER -->
<div class="doc-footer">
  <div class="doc-footer-brand">إعلاني — E3lani.com | سوق الدعاية والإعلان</div>
  <div class="doc-footer-note">وثيقة سرية — لأغراض الاستثمار فقط — مؤسسة القوافل العربية للمقاولات 2026</div>
</div>

</body>
</html>`;

fs.writeFileSync(OUT, html, 'utf8');
console.log('Investor HTML generated:', OUT);
