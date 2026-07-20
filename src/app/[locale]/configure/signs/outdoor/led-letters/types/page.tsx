"use client";
import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";

type Locale = "ar" | "en";
const GOLD = "#C9A24B";
const G    = "linear-gradient(135deg,#C9A24B,#EBCB7C)";

// ─── SVG Cross-section Diagrams (based on official Jeddah municipality guidelines) ─
function BackLitDiagram({ animated }: { animated: boolean }) {
  return (
    <svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxHeight: 180 }}>
      {/* Wall */}
      <rect x="0" y="140" width="280" height="40" fill="#1e1e1e" rx="3"/>
      <text x="140" y="158" textAnchor="middle" fill="#555" fontSize="10">الجدار</text>

      {/* Halo glow on wall */}
      <ellipse cx="140" cy="143" rx="95" ry="5" fill={GOLD} opacity={animated ? 0.25 : 0.1}>
        {animated && <animate attributeName="rx" values="75;105;75" dur="2.5s" repeatCount="indefinite"/>}
        {animated && <animate attributeName="opacity" values="0.1;0.3;0.1" dur="2.5s" repeatCount="indefinite"/>}
      </ellipse>

      {/* Letter body - returns (sides) aluminum */}
      <rect x="55" y="50" width="7" height="90" fill="#9a9a9a" rx="2"/>
      <rect x="218" y="50" width="7" height="90" fill="#9a9a9a" rx="2"/>
      <rect x="55" y="50" width="170" height="7" fill="#9a9a9a" rx="2"/>
      {/* Open bottom - no back panel */}

      {/* LED modules (back lit) */}
      {[80,110,140,170,200].map((x, i) => (
        <circle key={i} cx={x} cy={120} r="4" fill={GOLD} opacity={animated ? 1 : 0.4}>
          {animated && <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" begin={`${i*0.35}s`} repeatCount="indefinite"/>}
          {animated && <animate attributeName="r" values="3;5;3" dur="1.8s" begin={`${i*0.35}s`} repeatCount="indefinite"/>}
        </circle>
      ))}

      {/* Opaque face */}
      <rect x="55" y="42" width="170" height="10" fill="#aaaaaa" rx="2"/>
      <text x="140" y="38" textAnchor="middle" fill="#aaa" fontSize="9">وجه معتم (ستانلس ستيل)</text>

      {/* Halo arrows going back */}
      {animated && [85,130,175].map((x, i) => (
        <g key={i}>
          <line x1={x} y1="138" x2={x} y2="152" stroke={GOLD} strokeWidth="2.5">
            <animate attributeName="opacity" values="0;1;0" dur="1.2s" begin={`${i*0.4}s`} repeatCount="indefinite"/>
          </line>
          <polygon points={`${x},157 ${x-4},149 ${x+4},149`} fill={GOLD}>
            <animate attributeName="opacity" values="0;1;0" dur="1.2s" begin={`${i*0.4}s`} repeatCount="indefinite"/>
          </polygon>
        </g>
      ))}

      {/* Side label */}
      <text x="33" y="100" textAnchor="middle" fill="#888" fontSize="9" transform="rotate(-90,33,100)">ألومنيوم</text>
      <text x="140" y="108" textAnchor="middle" fill={GOLD} fontSize="9">LED خلفية</text>

      {/* Halo label */}
      <text x="140" y="173" textAnchor="middle" fill={GOLD} fontSize="10" fontWeight="bold">✨ تأثير الهالة</text>
    </svg>
  );
}

function FaceLitDiagram({ animated }: { animated: boolean }) {
  return (
    <svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxHeight: 180 }}>
      {/* Wall */}
      <rect x="0" y="140" width="280" height="40" fill="#1e1e1e" rx="3"/>
      <text x="140" y="158" textAnchor="middle" fill="#555" fontSize="10">الجدار</text>

      {/* Letter back panel */}
      <rect x="55" y="130" width="170" height="7" fill="#666" rx="2"/>
      {/* Letter returns */}
      <rect x="55" y="50" width="7" height="87" fill="#9a9a9a" rx="2"/>
      <rect x="218" y="50" width="7" height="87" fill="#9a9a9a" rx="2"/>
      <rect x="55" y="50" width="170" height="7" fill="#9a9a9a" rx="2"/>

      {/* LED inside */}
      {[80,110,140,170,200].map((x, i) => (
        <circle key={i} cx={x} cy={100} r="4" fill="#FFFDE7" opacity={animated ? 1 : 0.4}>
          {animated && <animate attributeName="opacity" values="0.5;1;0.5" dur="1.6s" begin={`${i*0.3}s`} repeatCount="indefinite"/>}
        </circle>
      ))}

      {/* Acrylic face (transparent colored) */}
      <rect x="55" y="42" width="170" height="10" fill="#4A9EE8" opacity="0.65" rx="2"/>
      <text x="140" y="37" textAnchor="middle" fill="#4A9EE8" fontSize="9">وجه أكريليك شفاف ملون</text>

      {/* Light rays going forward */}
      {animated && [88,120,152,184].map((x, i) => (
        <g key={i}>
          <line x1={x} y1="40" x2={x} y2="22" stroke="#FFFDE7" strokeWidth="2">
            <animate attributeName="opacity" values="0;0.9;0" dur="1.3s" begin={`${i*0.32}s`} repeatCount="indefinite"/>
          </line>
          <polygon points={`${x},15 ${x-4},25 ${x+4},25`} fill="#FFFDE7">
            <animate attributeName="opacity" values="0;0.9;0" dur="1.3s" begin={`${i*0.32}s`} repeatCount="indefinite"/>
          </polygon>
        </g>
      ))}

      {/* Two-part label */}
      <text x="250" y="90" textAnchor="end" fill="#aaa" fontSize="9">جسم معتم</text>
      <text x="250" y="50" textAnchor="end" fill="#4A9EE8" fontSize="9">وجه شفاف</text>

      <text x="140" y="118" textAnchor="middle" fill="#FFFDE7" fontSize="9">LED داخلية</text>
      <text x="140" y="175" textAnchor="middle" fill="#FFFDE7" fontSize="10" fontWeight="bold">← الضوء يخرج من الأمام</text>
    </svg>
  );
}

function SideLitDiagram({ animated }: { animated: boolean }) {
  return (
    <svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxHeight: 180 }}>
      {/* Wall */}
      <rect x="0" y="140" width="280" height="40" fill="#1e1e1e" rx="3"/>
      <text x="140" y="158" textAnchor="middle" fill="#555" fontSize="10">الجدار</text>

      {/* Letter body (closed box) */}
      <rect x="55" y="50" width="170" height="90" fill="#F4EFE6" rx="4" stroke="#888" strokeWidth="1.5"/>

      {/* LED on sides */}
      {[60,72,84].map((y, i) => (
        <circle key={`l${i}`} cx={62} cy={y+30} r="3.5" fill="#EBCB7C" opacity={animated ? 1 : 0.4}>
          {animated && <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" begin={`${i*0.5}s`} repeatCount="indefinite"/>}
        </circle>
      ))}
      {[60,72,84].map((y, i) => (
        <circle key={`r${i}`} cx={218} cy={y+30} r="3.5" fill="#EBCB7C" opacity={animated ? 1 : 0.4}>
          {animated && <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" begin={`${i*0.5 + 0.25}s`} repeatCount="indefinite"/>}
        </circle>
      ))}

      {/* Light spreading inside */}
      {animated && [100,130,160].map((x, i) => (
        <ellipse key={i} cx={x} cy={95} rx="18" ry="12" fill="#EBCB7C" opacity="0.08">
          <animate attributeName="rx" values="12;22;12" dur="2s" begin={`${i*0.6}s`} repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.04;0.15;0.04" dur="2s" begin={`${i*0.6}s`} repeatCount="indefinite"/>
        </ellipse>
      ))}

      {/* Face - printed acrylic */}
      <rect x="55" y="42" width="170" height="10" fill="#EBCB7C" opacity="0.5" rx="2"/>
      <text x="140" y="37" textAnchor="middle" fill="#EBCB7C" fontSize="9">وجه أكريليك مطبوع UV</text>

      {/* Side arrows */}
      {animated && (
        <>
          <line x1="68" y1="95" x2="90" y2="95" stroke="#EBCB7C" strokeWidth="2">
            <animate attributeName="opacity" values="0;0.8;0" dur="1.2s" repeatCount="indefinite"/>
          </line>
          <polygon points="95,95 85,91 85,99" fill="#EBCB7C">
            <animate attributeName="opacity" values="0;0.8;0" dur="1.2s" repeatCount="indefinite"/>
          </polygon>
          <line x1="212" y1="95" x2="190" y2="95" stroke="#EBCB7C" strokeWidth="2">
            <animate attributeName="opacity" values="0;0.8;0" dur="1.2s" begin="0.6s" repeatCount="indefinite"/>
          </line>
          <polygon points="185,95 195,91 195,99" fill="#EBCB7C">
            <animate attributeName="opacity" values="0;0.8;0" dur="1.2s" begin="0.6s" repeatCount="indefinite"/>
          </polygon>
        </>
      )}

      <text x="140" y="100" textAnchor="middle" fill="#888" fontSize="9">لوحة مضيئة داخلية</text>
      <text x="140" y="175" textAnchor="middle" fill="#EBCB7C" fontSize="10" fontWeight="bold">الضوء من الجانبين ←→</text>
    </svg>
  );
}

// ─── Sign types (based on official Jeddah municipality guidelines §4.5) ────────
const SIGN_TYPES = [
  {
    id: "back",
    sectionNum: "١",
    icon: "✨",
    nameAr: "الإضاءة من الخلف",
    nameEn: "Back-Lit / Halo",
    tagAr: "الأكثر فخامة",
    tagColor: GOLD,
    officialDesc: "يتم تسليط الضوء من خلف أحرف أو رموز فردية مما يخلق تأثير الهالة. ولا بد من استخدام مواد إنتاج عالية الجودة لضمان تصميم جيد ووضوح القراءة.",
    detailAr: "الحرف مصنوع من مادة معتمة (ستانلس ستيل أو ألومنيوم) والإضاءة تخرج من الخلف لتضرب الجدار مخلقةً هالة ضوئية مميزة. يُعطي مظهراً راقياً واحترافياً يُلائم الشركات والفنادق والمجمعات.",
    prosAr: ["تأثير الهالة الذهبية المميز", "مظهر فاخر يعكس الجودة", "مناسب للواجهات الراقية", "رائع في الإضاءة المنخفضة"],
    bestForAr: "الفنادق — العيادات الخاصة — شركات المحاسبة والمحاماة — صالونات التجميل الفاخرة — المجمعات التجارية الراقية",
    materialsAr: "جوانب: ستانلس ستيل 304 أو ألومنيوم | وجه: ستانلس ستيل معتم",
    lightingAr: "→ الضوء يخرج للخلف ويكوّن الهالة",
    lightingColor: GOLD,
    configLighting: "back",
    bg: "linear-gradient(135deg,#FDFBF7,#F4EFE6)",
    Diagram: BackLitDiagram,
  },
  {
    id: "front",
    sectionNum: "٢",
    icon: "💡",
    nameAr: "الإضاءة من الأمام",
    nameEn: "Face-Lit / Front-Lit",
    tagAr: "الأكثر شيوعاً",
    tagColor: "#4CAF50",
    officialDesc: "يُسلط الضوء من مصدر من داخل اللوحة. يتكون الحرف من جزأين: جسم معتم ووجه أمامي شفاف. يُستخدم الأكريليك لتصنيع الوجهة مع طباعتها باستخدام طابعات UV.",
    detailAr: "الحرف يحتوي على هيكل معدني معتم (ألومنيوم أو زنكور) مع وجه أكريليك شفاف ملون. الإضاءة LED من الداخل تخترق الأكريليك لتُضيء الحرف. الخيار المثالي للمحلات التجارية.",
    prosAr: ["رؤية ممتازة نهاراً وليلاً", "ألوان واجهة متعددة", "الأقل تكلفة بين الأنواع", "مناسب لجميع البيئات التجارية"],
    bestForAr: "المطاعم والمقاهي — الصيدليات — المحلات التجارية — العيادات — المصارف والبنوك",
    materialsAr: "جوانب: ألومنيوم أو زنكور (دهان بودر كوتينج) | وجه: أكريليك شفاف ملون (طباعة UV)",
    lightingAr: "← الضوء يخرج من الواجهة الأمامية",
    lightingColor: "#FFFDE7",
    configLighting: "front",
    bg: "linear-gradient(135deg,#0a1218,#0d1a24)",
    Diagram: FaceLitDiagram,
  },
  {
    id: "side",
    sectionNum: "٣",
    icon: "🔆",
    nameAr: "الإضاءة من الجانب",
    nameEn: "Side-Lit / Edge-Lit",
    tagAr: "تأثير بصري مختلف",
    tagColor: "#EBCB7C",
    officialDesc: "يُسلط الضوء من مصدر داخل لوحة مخلقة. ينتشر الضوء من الجانبين إلى داخل الحرف مما يُعطي توهجاً منتظماً وتأثيراً بصرياً مميزاً.",
    detailAr: "وحدة LED تُركَّب على جانبي الحرف مما يُوزع الضوء بشكل متساوٍ داخل اللوحة. يُعطي مظهراً عصرياً مختلفاً يُناسب اللافتات الكبيرة واللوحات المضيئة المخلقة.",
    prosAr: ["توزيع ضوء متساوٍ ومنتظم", "مظهر عصري ومختلف", "مناسب للألواح الكبيرة", "أقل استهلاكاً للطاقة"],
    bestForAr: "مراكز التسوق الكبيرة — لافتات المداخل الرئيسية — اللوحات التوجيهية — الفنادق والمجمعات",
    materialsAr: "لوحة: أكريليك مطبوع UV | هيكل: ألومنيوم | الإضاءة: LED جانبية",
    lightingAr: "←→ الضوء يدخل من الجانبين",
    lightingColor: "#EBCB7C",
    configLighting: "back",
    bg: "linear-gradient(135deg,#F4EFE6,#1e1a0e)",
    Diagram: SideLitDiagram,
  },
];

// ─── Materials data (§3.5 official guidelines) ───────────────────────────────
const MATERIALS = [
  {
    rank: "١",
    nameAr: "الاستانلس ستيل (الفولاذ المقاوم للصدأ)",
    nameEn: "Stainless Steel 304",
    icon: "🥇",
    color: "#C0C0C0",
    descAr: "أفضل المواد أداءً ومقاومةً للعوامل الجوية. يُستخدم الدرجة 304 فقط لمقاومته العالية للتآكل والصدأ. متوفر باللونين الذهبي والقضي.",
    warningAr: "⚠️ يُمنع استخدام درجة 201",
    useAr: "الجوانب والوجه معاً — للواجهات الراقية والخارجية",
  },
  {
    rank: "٢",
    nameAr: "الألومنيوم (Channelium)",
    nameEn: "Aluminum Channel",
    icon: "🥈",
    color: "#A8A8A8",
    descAr: "غلاف معدني يُشكّل جوانب وظهر الحرف ثلاثي الأبعاد. يوفر دعماً هيكلياً ويُتيح سهولة تشكيله بتصاميم وزوايا مختلفة.",
    warningAr: "",
    useAr: "الجوانب فقط — يُدمج مع أكريليك في الوجه",
  },
  {
    rank: "٣",
    nameAr: "الزنكور (الفولاذ المجلفن)",
    nameEn: "Galvanized Steel",
    icon: "🥉",
    color: "#8a8a8a",
    descAr: "صفائح فولاذية مطلية بالزنك لمقاومة التآكل. يُشكَّل ثم يُدهن بدهان البودر كوتينج لأفضل حماية.",
    warningAr: "✅ أفضل أنواع الدهان: البودر كوتينج",
    useAr: "الجوانب — للمحلات ذات الميزانية المتوسطة",
  },
  {
    rank: "٤",
    nameAr: "الأكريليك",
    nameEn: "Acrylic",
    icon: "💎",
    color: "#4A9EE8",
    descAr: "مادة شفافة عالية الجودة تُستخدم للوجه الأمامي فقط لخاصية نفاذية الضوء. تُطبع بطابعات UV لأي لون أو تصميم.",
    warningAr: "⚠️ لا يُنصح باستخدامه للجوانب — ضعيف أمام العوامل الجوية",
    useAr: "الوجه الأمامي فقط — يُدمج مع مواد الجوانب الثلاث",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LedLettersTypesPage() {
  const locale = useLocale() as Locale;
  const ar = locale === "ar";
  const [activeType, setActiveType] = useState(0);
  const [animated, setAnimated] = useState(true);
  const [activeTab, setActiveTab] = useState<"lighting" | "materials">("lighting");

  const type = SIGN_TYPES[activeType];
  const DiagramComponent = type.Diagram;

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#FDFBF7", fontFamily: "Tajawal, Cairo, sans-serif", color: "#2C1E15" }}>

      {/* Hero */}
      <section style={{ padding: "2rem 0 2.5rem", borderBottom: "1px solid rgba(201,162,75,0.12)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(201,162,75,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(201,162,75,0.03) 1px,transparent 1px)", backgroundSize: "50px 50px", pointerEvents: "none" }} />

        <div className="section-container" dir="rtl" style={{ position: "relative", zIndex: 1 }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.75rem", color: "#666", marginBottom: "1.25rem" }}>
            <Link href={`/${locale}/configure/signs/outdoor`} style={{ color: GOLD, textDecoration: "none" }}>الخارجية</Link>
            <span>›</span>
            <Link href={`/${locale}/configure/signs/outdoor/led-letters`} style={{ color: GOLD, textDecoration: "none" }}>حروف LED</Link>
            <span>›</span>
            <span>أنواع الإضاءة</span>
          </div>

          <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto" }}>
            {/* Official badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 1rem", borderRadius: 999, background: "rgba(201,162,75,0.1)", border: "1px solid rgba(201,162,75,0.25)", fontSize: "0.72rem", fontWeight: 700, color: GOLD, marginBottom: "0.75rem" }}>
              🏛️ وفق إرشادات أمانة جدة § ٤.٥ و ٥.٣
            </div>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900, margin: "0 0 0.75rem 0" }}>
              دليل أنواع الحروف البارزة
              <span style={{ background: G, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}> المضيئة</span>
            </h1>
            <p style={{ color: "#888", fontSize: "0.92rem", lineHeight: 1.8, margin: "0 0 1.25rem 0" }}>
              تعرّف على أنواع الإضاءة والمواد المعتمدة رسمياً حتى تختار اللوحة الأنسب لمشروعك
            </p>

            {/* Tabs */}
            <div style={{ display: "inline-flex", gap: "0.4rem", background: "#F4EFE6", padding: "0.35rem", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
              {(["lighting", "materials"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: "0.5rem 1.25rem", borderRadius: 9, border: "none",
                  background: activeTab === tab ? G : "transparent",
                  color: activeTab === tab ? "#2C1E15" : "#888",
                  fontWeight: activeTab === tab ? 700 : 500,
                  fontSize: "0.85rem", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
                  transition: "all 0.2s",
                }}>
                  {tab === "lighting" ? "💡 أنواع الإضاءة" : "🔩 المواد المعتمدة"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LIGHTING TYPES TAB */}
      {activeTab === "lighting" && (
        <section style={{ padding: "2.5rem 0 3rem" }}>
          <div className="section-container" dir="rtl">

            {/* Type selector */}
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginBottom: "2.5rem", flexWrap: "wrap" }}>
              {SIGN_TYPES.map((t, i) => (
                <button key={t.id} onClick={() => setActiveType(i)} style={{
                  padding: "0.7rem 1.4rem", borderRadius: 12,
                  border: `2px solid ${activeType === i ? GOLD : "rgba(255,255,255,0.08)"}`,
                  background: activeType === i ? "rgba(201,162,75,0.1)" : "rgba(255,255,255,0.03)",
                  color: activeType === i ? GOLD : "#aaa", fontWeight: activeType === i ? 700 : 500,
                  fontSize: "0.88rem", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
                  transition: "all 0.2s", display: "flex", alignItems: "center", gap: "0.5rem",
                }}>
                  <span style={{ fontSize: "1.1rem" }}>{t.icon}</span>
                  <span>{t.sectionNum}. {t.nameAr}</span>
                </button>
              ))}

              {/* Animate toggle */}
              <button onClick={() => setAnimated(v => !v)} style={{
                padding: "0.5rem 1rem", borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "transparent", color: "#666",
                fontSize: "0.78rem", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
              }}>
                {animated ? "⏸" : "▶"} أنيميشن
              </button>
            </div>

            {/* Main display */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}>

              {/* Diagram panel */}
              <div>
                <div style={{ borderRadius: 20, padding: "1.5rem", background: type.bg, border: `2px solid rgba(201,162,75,0.18)`, position: "relative" }}>
                  {/* Official section number */}
                  <div style={{ position: "absolute", top: 12, right: 12, width: 28, height: 28, borderRadius: "50%", background: GOLD, color: "#2C1E15", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.85rem" }}>
                    {type.sectionNum}
                  </div>
                  {/* Tag */}
                  <div style={{ position: "absolute", top: 12, left: 12, padding: "0.2rem 0.7rem", borderRadius: 999, background: type.tagColor, color: "#2C1E15", fontSize: "0.67rem", fontWeight: 700 }}>
                    {type.tagAr}
                  </div>

                  <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <DiagramComponent animated={animated} />
                  </div>

                  {/* Light direction */}
                  <div style={{ marginTop: "0.75rem", textAlign: "center", padding: "0.6rem", borderRadius: 8, background: "rgba(0,0,0,0.3)" }}>
                    <span style={{ color: type.lightingColor, fontWeight: 700, fontSize: "0.82rem" }}>
                      {type.lightingAr}
                    </span>
                  </div>
                </div>

                {/* Diagram legend */}
                <div style={{ marginTop: "0.75rem", padding: "0.85rem 1rem", borderRadius: 12, background: "#F4EFE6", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: "0.72rem", color: "#555", fontWeight: 700, marginBottom: "0.5rem" }}>مفتاح الرسم:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                    {[
                      { c: "#9a9a9a", l: "هيكل الحرف (ألومنيوم)" },
                      { c: "#4A9EE8", l: "أكريليك شفاف" },
                      { c: "#FFFDE7", l: "LED إضاءة أمامية" },
                      { c: GOLD,       l: "LED إضاءة خلفية" },
                    ].map(({c,l}) => (
                      <div key={l} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: c, flexShrink: 0 }} />
                        <span style={{ fontSize: "0.68rem", color: "#777" }}>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Info panel */}
              <div>
                {/* Title */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "2rem" }}>{type.icon}</span>
                  <div>
                    <h2 style={{ margin: 0, fontWeight: 900, fontSize: "1.4rem" }}>{type.nameAr}</h2>
                    <div style={{ fontSize: "0.75rem", color: "#666", fontFamily: "monospace" }}>{type.nameEn}</div>
                  </div>
                </div>

                {/* Official description */}
                <div style={{ padding: "1rem", borderRadius: 12, background: "rgba(201,162,75,0.06)", border: "1px solid rgba(201,162,75,0.2)", marginBottom: "1.25rem" }}>
                  <div style={{ fontSize: "0.68rem", color: GOLD, fontWeight: 700, marginBottom: "0.35rem" }}>📋 وصف أمانة جدة الرسمي:</div>
                  <p style={{ color: "#ccc", fontSize: "0.83rem", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
                    "{type.officialDesc}"
                  </p>
                </div>

                {/* Detail */}
                <p style={{ color: "#bbb", fontSize: "0.88rem", lineHeight: 1.8, margin: "0 0 1.25rem 0" }}>{type.detailAr}</p>

                {/* Pros */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "1.25rem" }}>
                  {type.prosAr.map(pro => (
                    <div key={pro} style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", fontSize: "0.8rem", color: "#ddd" }}>
                      <span style={{ color: GOLD, marginTop: 2, flexShrink: 0 }}>◆</span>{pro}
                    </div>
                  ))}
                </div>

                {/* Materials */}
                <div style={{ padding: "0.85rem 1rem", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.72rem", color: "#666", fontWeight: 700, marginBottom: "0.3rem" }}>🔩 المواد المستخدمة:</div>
                  <div style={{ fontSize: "0.8rem", color: "#bbb" }}>{type.materialsAr}</div>
                </div>

                {/* Best for */}
                <div style={{ padding: "0.85rem 1rem", borderRadius: 10, background: "rgba(201,162,75,0.06)", border: "1px solid rgba(201,162,75,0.15)", marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "0.72rem", color: GOLD, fontWeight: 700, marginBottom: "0.3rem" }}>🎯 الأنسب لـ:</div>
                  <div style={{ fontSize: "0.82rem", color: "#ccc" }}>{type.bestForAr}</div>
                </div>

                {/* CTA */}
                <Link href={`/${locale}/configure/signs/outdoor/led-letters?type=${type.configLighting}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", padding: "0.85rem", borderRadius: 12, background: G, color: "#2C1E15", fontWeight: 900, fontSize: "0.9rem", textDecoration: "none", fontFamily: "Tajawal, Cairo, sans-serif", boxShadow: "0 6px 24px rgba(201,162,75,0.25)" }}>
                  ⚙️ اطلب هذا النوع واحسب السعر
                </Link>
              </div>
            </div>

            {/* Dots nav */}
            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "2rem" }}>
              {SIGN_TYPES.map((_, i) => (
                <button key={i} onClick={() => setActiveType(i)} style={{
                  width: activeType === i ? 28 : 10, height: 10, borderRadius: 999,
                  background: activeType === i ? GOLD : "rgba(255,255,255,0.15)",
                  border: "none", cursor: "pointer", transition: "all 0.3s",
                }} />
              ))}
            </div>

            {/* Lighting intensity section */}
            <div style={{ marginTop: "3rem", padding: "2rem", borderRadius: 20, background: "#F4EFE6", border: "1px solid rgba(201,162,75,0.12)" }}>
              <h3 style={{ fontWeight: 800, margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>ثانياً: إرشادات شدة الإضاءة ولونها</h3>
              <p style={{ color: "#777", fontSize: "0.82rem", margin: "0 0 1.5rem 0" }}>وفق § ٤.٥ من إرشادات أمانة جدة — يجب ألا يكون الضوء مبهراً وألا يُخفي ملامح الحرف</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                {[
                  { level: "المستوى الأول", type: "إضاءة دافئة", range: "٢٧٠٠ – ٣٥٠٠ كلفن", color: "#FFF5E0", use: "أجواء مريحة ودافئة" },
                  { level: "المستوى الثاني", type: "إضاءة محايدة", range: "حد أقصى ٤٠٠٠ كلفن", color: "#F5F5DC", use: "التوازن بين الأجواء والرؤية" },
                  { level: "المستوى الثالث", type: "إضاءة باردة", range: "حد أقصى ٦٥٠٠ كلفن", color: "#E8F4FF", use: "تعزيز الرؤية والأمان" },
                ].map(item => (
                  <div key={item.level} style={{ padding: "1rem", borderRadius: 12, background: "#FDFBF7", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ width: "100%", height: 8, borderRadius: 4, background: item.color, marginBottom: "0.75rem" }} />
                    <div style={{ fontWeight: 700, fontSize: "0.8rem", marginBottom: "0.2rem" }}>{item.level}</div>
                    <div style={{ color: GOLD, fontSize: "0.78rem", marginBottom: "0.2rem" }}>{item.type}</div>
                    <div style={{ color: "#777", fontSize: "0.72rem", marginBottom: "0.35rem" }}>{item.range}</div>
                    <div style={{ color: "#aaa", fontSize: "0.72rem" }}>{item.use}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "0.85rem 1rem", borderRadius: 10, background: "rgba(201,162,75,0.06)", border: "1px solid rgba(201,162,75,0.15)", fontSize: "0.8rem", color: "#bbb" }}>
                ✅ يُشترط استخدام إضاءة خارجية <strong style={{ color: "#ddd" }}>مقاومة للماء والغبار (تصنيف IP45 أو أعلى)</strong>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MATERIALS TAB */}
      {activeTab === "materials" && (
        <section style={{ padding: "2.5rem 0 4rem" }}>
          <div className="section-container" dir="rtl">
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <h2 style={{ fontWeight: 900, fontSize: "1.4rem", margin: "0 0 0.5rem 0" }}>المواد المعتمدة لتصنيع الحروف البارزة</h2>
              <p style={{ color: "#777", fontSize: "0.85rem" }}>وفق § ٣.٥ من إرشادات أمانة جدة — مرتبة حسب أفضلية الأداء ومقاومة العوامل الجوية</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              {MATERIALS.map(mat => (
                <div key={mat.rank} style={{ borderRadius: 16, overflow: "hidden", border: "1.5px solid rgba(201,162,75,0.12)", background: "#F4EFE6" }}>
                  <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", color: "#2C1E15", fontWeight: 900, fontSize: "0.9rem", flexShrink: 0 }}>
                      {mat.rank}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: "#2C1E15", fontSize: "0.95rem" }}>{mat.nameAr}</div>
                      <div style={{ fontSize: "0.7rem", color: "#666", fontFamily: "monospace" }}>{mat.nameEn}</div>
                    </div>
                    <span style={{ marginRight: "auto", fontSize: "1.5rem" }}>{mat.icon}</span>
                  </div>
                  <div style={{ padding: "1.1rem 1.25rem" }}>
                    <p style={{ color: "#bbb", fontSize: "0.82rem", lineHeight: 1.7, margin: "0 0 0.75rem 0" }}>{mat.descAr}</p>
                    {mat.warningAr && (
                      <div style={{ padding: "0.4rem 0.75rem", borderRadius: 8, background: mat.warningAr.includes("⚠️") ? "rgba(220,50,50,0.08)" : "rgba(74,222,128,0.08)", border: `1px solid ${mat.warningAr.includes("⚠️") ? "rgba(220,50,50,0.2)" : "rgba(74,222,128,0.2)"}`, fontSize: "0.75rem", color: mat.warningAr.includes("⚠️") ? "#f87171" : "#4ade80", marginBottom: "0.6rem" }}>
                        {mat.warningAr}
                      </div>
                    )}
                    <div style={{ fontSize: "0.75rem", color: "#666" }}>
                      <span style={{ color: GOLD, fontWeight: 700 }}>الاستخدام: </span>{mat.useAr}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Combination tip */}
            <div style={{ marginTop: "1.5rem", padding: "1.25rem 1.5rem", borderRadius: 16, background: "rgba(201,162,75,0.06)", border: "1px solid rgba(201,162,75,0.2)" }}>
              <div style={{ fontWeight: 800, color: GOLD, marginBottom: "0.5rem" }}>💡 نصيحة الدمج المثالي:</div>
              <p style={{ color: "#bbb", fontSize: "0.85rem", lineHeight: 1.7, margin: 0 }}>
                الأفضل للواجهات الخارجية: <strong style={{ color: "#ddd" }}>جوانب من ستانلس ستيل 304 + وجه أمامي من أكريليك</strong> — يجمع بين المتانة العالية والمظهر الاحترافي. لا يُنصح بتصنيع الحرف كاملاً (جوانب ووجه) من الأكريليك لضعف تحمله للعوامل الجوية.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section style={{ padding: "2rem 0 4rem" }}>
        <div className="section-container" dir="rtl">
          <div style={{ textAlign: "center", padding: "2.5rem", borderRadius: 20, background: "#F4EFE6", border: "1px solid rgba(201,162,75,0.15)" }}>
            <h3 style={{ fontWeight: 900, margin: "0 0 0.5rem 0", fontSize: "1.3rem" }}>جاهز لتصميم لوحتك؟</h3>
            <p style={{ color: "#777", margin: "0 0 1.5rem 0", fontSize: "0.9rem" }}>اختر نوع الإضاءة والمادة المناسبة واحسب سعرك فوراً</p>
            <Link href={`/${locale}/configure/signs/outdoor/led-letters`}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", padding: "0.9rem 2.5rem", borderRadius: 999, background: G, color: "#2C1E15", fontWeight: 900, fontSize: "0.9rem", textDecoration: "none", boxShadow: "0 6px 24px rgba(201,162,75,0.3)", fontFamily: "Tajawal, Cairo, sans-serif" }}>
              ⚙️ احسب سعرك الآن
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
