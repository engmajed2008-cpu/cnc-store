"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { siteStore, DEFAULT_LED_PRICING, type LedLettersPricing } from "@/store/siteStore";

type Locale = "ar" | "en";
const GOLD = "#C9A24B";
const G    = "linear-gradient(135deg,#C9A24B,#EBCB7C)";

// ─── Types ────────────────────────────────────────────────────────────────────
type Material  = "acrylic" | "aluminum" | "stainless";
type Lighting  = "front" | "back" | "double";
type DesignOpt = "upload" | "whatsapp" | "online";

// ─── Option configs ───────────────────────────────────────────────────────────
const MATERIALS = [
  { id: "acrylic"  as Material, icon: "🟡", nameAr: "أكريليك",       nameEn: "Acrylic",         descAr: "خفيف، ألوان متعددة، أكثر المواد استخداماً", descEn: "Lightweight, multiple colors, most popular" },
  { id: "aluminum" as Material, icon: "⬜", nameAr: "ألمنيوم",       nameEn: "Aluminum",        descAr: "متين، مقاوم للعوامل الجوية، مظهر احترافي",  descEn: "Durable, weather-resistant, professional look" },
  { id: "stainless"as Material, icon: "🔲", nameAr: "ستانلس ستيل",   nameEn: "Stainless Steel", descAr: "الأفخم والأقوى، مثالي للواجهات الراقية",   descEn: "Most luxurious, ideal for premium facades" },
];

const LIGHTINGS = [
  { id: "front"  as Lighting, icon: "💡", nameAr: "إضاءة أمامية",   nameEn: "Front-lit",    descAr: "الضوء يخرج من أمام الحرف — كلاسيكي وواضح",    descEn: "Light from the front — classic and clear" },
  { id: "back"   as Lighting, icon: "✨", nameAr: "إضاءة خلفية (هالة)", nameEn: "Halo Back-lit", descAr: "هالة ضوئية خلف الحرف — راقي وعصري",        descEn: "Light halo behind letter — elegant and modern" },
  { id: "double" as Lighting, icon: "🌟", nameAr: "إضاءة مزدوجة",  nameEn: "Double-lit",   descAr: "إضاءة أمامية وخلفية — أقوى ظهور وأكثر إبهاراً", descEn: "Front and back lighting — maximum visibility" },
];

const LED_COLORS = [
  { id: "white_warm", label: "أبيض دافئ",  hex: "#FFF5E0" },
  { id: "white_cool", label: "أبيض بارد",  hex: "#E8F4FF" },
  { id: "gold",       label: "ذهبي",       hex: "#FFD700" },
  { id: "red",        label: "أحمر",        hex: "#FF3B3B" },
  { id: "blue",       label: "أزرق",        hex: "#3B8BFF" },
  { id: "green",      label: "أخضر",        hex: "#3BFF6E" },
  { id: "rgb",        label: "ملون RGB",    hex: "linear-gradient(135deg,#FF3B3B,#3B8BFF,#3BFF6E)" },
];

// ─── Step component ───────────────────────────────────────────────────────────
function Step({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", color: "#2C1E15", fontWeight: 900, fontSize: "0.85rem", flexShrink: 0 }}>{num}</div>
        <h3 style={{ margin: 0, fontWeight: 800, color: "#2C1E15", fontSize: "1rem" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Option Card ──────────────────────────────────────────────────────────────
function OptionCard({ selected, onClick, icon, name, desc }: {
  selected: boolean; onClick: () => void; icon: string; name: string; desc: string;
}) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "1rem", borderRadius: 12, border: `2px solid ${selected ? GOLD : "rgba(255,255,255,0.08)"}`,
      background: selected ? "rgba(201,162,75,0.1)" : "rgba(255,255,255,0.03)",
      cursor: "pointer", textAlign: "right", transition: "all 0.2s", fontFamily: "Tajawal, Cairo, sans-serif",
      boxShadow: selected ? `0 0 0 2px rgba(201,162,75,0.2)` : "none",
    }}>
      <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>{icon}</div>
      <div style={{ fontWeight: 700, color: selected ? GOLD : "#2C1E15", fontSize: "0.9rem", marginBottom: "0.25rem" }}>{name}</div>
      <div style={{ fontSize: "0.72rem", color: "#777", lineHeight: 1.5 }}>{desc}</div>
      {selected && <div style={{ marginTop: "0.5rem", fontSize: "0.7rem", color: GOLD, fontWeight: 700 }}>✓ محدد</div>}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LedLettersPage() {
  const locale = useLocale() as Locale;
  const ar = locale === "ar";

  // Config state
  const [material,   setMaterial]   = useState<Material>("acrylic");
  const [lighting,   setLighting]   = useState<Lighting>("front");
  const [ledColor,   setLedColor]   = useState("white_warm");
  const [height,     setHeight]     = useState(30);  // cm
  const [letters,    setLetters]    = useState(5);   // count
  const [designOpt,  setDesignOpt]  = useState<DesignOpt>("whatsapp");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [pricing,    setPricing]    = useState<LedLettersPricing>(DEFAULT_LED_PRICING);
  const [submitted,  setSubmitted]  = useState(false);

  useEffect(() => { setPricing(siteStore.getLedPricing()); }, []);

  // Price calculation
  const calcPrice = useCallback(() => {
    const base = {
      acrylic: pricing.acrylicPerCmPerLetter,
      aluminum: pricing.aluminumPerCmPerLetter,
      stainless: pricing.stainlessPerCmPerLetter,
    }[material];

    const mult = {
      front: pricing.frontLitMultiplier,
      back: pricing.backLitMultiplier,
      double: pricing.doubleLitMultiplier,
    }[lighting];

    const raw = base * height * letters * mult + pricing.installationFee;
    return Math.max(raw, pricing.minimumOrder);
  }, [material, lighting, height, letters, pricing]);

  const price = calcPrice();
  const selectedMat = MATERIALS.find(m => m.id === material)!;
  const selectedLit = LIGHTINGS.find(l => l.id === lighting)!;

  // WhatsApp order message
  const buildWAMsg = () => {
    const lines = [
      `🔆 طلب حروف بارزة مضيئة LED`,
      `━━━━━━━━━━━━━━━━━━`,
      `المادة: ${selectedMat.nameAr}`,
      `الإضاءة: ${selectedLit.nameAr}`,
      `لون LED: ${LED_COLORS.find(c => c.id === ledColor)?.label}`,
      `ارتفاع الحرف: ${height} سم`,
      `عدد الحروف: ${letters} حرف`,
      `التصميم: ${designOpt === "upload" ? "سأرفق الملف" : designOpt === "whatsapp" ? "سأرسل عبر واتساب" : "أريد التصميم معكم"}`,
      `━━━━━━━━━━━━━━━━━━`,
      `السعر التقديري: ${price.toLocaleString()} ريال`,
    ];
    return encodeURIComponent(lines.join("\n"));
  };

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#FDFBF7", fontFamily: "Tajawal, Cairo, sans-serif", color: "#2C1E15" }}>

      {/* Hero */}
      <section style={{ position: "relative", padding: "2rem 0 2rem", borderBottom: "1px solid rgba(201,162,75,0.1)" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(201,162,75,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(201,162,75,0.03) 1px,transparent 1px)", backgroundSize: "50px 50px", pointerEvents: "none" }} />
        <div className="section-container" style={{ position: "relative", zIndex: 1 }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "#666", marginBottom: "1.25rem" }}>
            <Link href={`/${locale}`} style={{ color: GOLD, textDecoration: "none" }}>الرئيسية</Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <Link href={`/${locale}/configure/signs`} style={{ color: GOLD, textDecoration: "none" }}>اللوحات</Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <Link href={`/${locale}/configure/signs/outdoor`} style={{ color: GOLD, textDecoration: "none" }}>الخارجية</Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: "#ccc" }}>حروف بارزة LED</span>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0.85rem", borderRadius: 999, background: "rgba(201,162,75,0.12)", border: "1px solid rgba(201,162,75,0.3)", fontSize: "0.7rem", fontWeight: 700, color: GOLD, marginBottom: "0.75rem" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD }} />
                احسب سعرك الآن
              </div>
              <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 900, margin: "0 0 0.5rem 0" }}>حروف بارزة مضيئة LED</h1>
              <p style={{ color: "#888", fontSize: "0.92rem", margin: "0 0 0.75rem 0", maxWidth: 520 }}>
                خصص لوحتك بالكامل — اختر المادة والإضاءة والمقاس وارفع تصميمك للحصول على سعر فوري
              </p>
              <Link href={`/${locale}/configure/signs/outdoor/led-letters/types`} style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                fontSize: "0.78rem", color: GOLD, textDecoration: "none", fontWeight: 600,
              }}>
                💡 لا تعرف الفرق بين الأنواع؟ اضغط هنا ←
              </Link>
              <Link href={`/${locale}/configure/signs/outdoor/led-letters/designer`} style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem",
                padding: "0.5rem 1.1rem", borderRadius: 999,
                background: G, color: "#2C1E15",
                fontSize: "0.8rem", fontWeight: 700, textDecoration: "none",
              }}>
                🎨 صمّم لوحتك وشاهد التصميم مباشرة
              </Link>
            </div>
            {/* Live price badge */}
            <div style={{ padding: "1.25rem 2rem", borderRadius: 16, background: "rgba(201,162,75,0.08)", border: "2px solid rgba(201,162,75,0.3)", textAlign: "center", minWidth: 180 }}>
              <div style={{ fontSize: "0.72rem", color: "#888", marginBottom: "0.3rem" }}>السعر التقديري</div>
              <div style={{ fontSize: "2rem", fontWeight: 900, background: G, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {price.toLocaleString()}
              </div>
              <div style={{ fontSize: "0.75rem", color: GOLD }}>ريال سعودي</div>
              <div style={{ fontSize: "0.65rem", color: "#555", marginTop: "0.3rem" }}>* سعر تقديري غير نهائي</div>
            </div>
          </div>
        </div>
      </section>

      {/* Configurator */}
      <section style={{ padding: "2.5rem 0 5rem" }}>
        <div className="section-container">
          <div className="led-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "2rem", alignItems: "start" }}>
          <style dangerouslySetInnerHTML={{ __html: "@media(max-width:900px){.led-grid{grid-template-columns:1fr!important}}" }} />

            {/* Left: Steps */}
            <div>

              {/* Step 1 — Material */}
              <Step num={1} title="اختر مادة الحرف">
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  {MATERIALS.map(m => (
                    <OptionCard key={m.id} selected={material === m.id} onClick={() => setMaterial(m.id)}
                      icon={m.icon} name={m.nameAr} desc={m.descAr} />
                  ))}
                </div>
              </Step>

              {/* Step 2 — Lighting */}
              <Step num={2} title="نوع الإضاءة">
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  {LIGHTINGS.map(l => (
                    <OptionCard key={l.id} selected={lighting === l.id} onClick={() => setLighting(l.id)}
                      icon={l.icon} name={l.nameAr} desc={l.descAr} />
                  ))}
                </div>
              </Step>

              {/* Step 3 — LED Color */}
              <Step num={3} title="لون الإضاءة LED">
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  {LED_COLORS.map(c => (
                    <button key={c.id} onClick={() => setLedColor(c.id)} style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem",
                      padding: "0.75rem 1rem", borderRadius: 12, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
                      border: `2px solid ${ledColor === c.id ? GOLD : "rgba(255,255,255,0.08)"}`,
                      background: ledColor === c.id ? "rgba(201,162,75,0.1)" : "rgba(255,255,255,0.03)",
                      transition: "all 0.2s",
                    }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: c.hex, border: "2px solid rgba(255,255,255,0.15)" }} />
                      <span style={{ fontSize: "0.72rem", color: ledColor === c.id ? GOLD : "#aaa" }}>{c.label}</span>
                    </button>
                  ))}
                </div>
              </Step>

              {/* Step 4 — Size */}
              <Step num={4} title="المقاسات">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                  {/* Height */}
                  <div style={{ background: "#F4EFE6", borderRadius: 14, padding: "1.25rem", border: "1px solid rgba(201,162,75,0.12)" }}>
                    <label style={{ display: "block", fontSize: "0.78rem", color: GOLD, fontWeight: 700, marginBottom: "0.75rem" }}>
                      ارتفاع الحرف (سم)
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <input type="range" min={10} max={200} step={5} value={height} onChange={e => setHeight(Number(e.target.value))}
                        style={{ flex: 1, accentColor: GOLD }} />
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <input type="number" min={10} max={200} value={height} onChange={e => setHeight(Math.min(200, Math.max(10, Number(e.target.value))))}
                          style={{ width: 64, padding: "0.4rem 0.5rem", borderRadius: 8, background: "#F4EFE6", border: "1px solid rgba(201,162,75,0.2)", color: GOLD, fontWeight: 700, fontSize: "1rem", fontFamily: "Tajawal, Cairo, sans-serif", outline: "none", textAlign: "center" }} />
                        <span style={{ color: "#666", fontSize: "0.78rem" }}>سم</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                      {[15, 20, 30, 40, 50, 60, 80, 100].map(h => (
                        <button key={h} onClick={() => setHeight(h)} style={{
                          padding: "0.2rem 0.6rem", borderRadius: 999, fontSize: "0.7rem", cursor: "pointer",
                          background: height === h ? G : "rgba(255,255,255,0.04)",
                          color: height === h ? "#2C1E15" : "#888",
                          border: "none", fontFamily: "Tajawal, Cairo, sans-serif", fontWeight: height === h ? 700 : 400,
                        }}>{h}</button>
                      ))}
                    </div>
                  </div>

                  {/* Letter count */}
                  <div style={{ background: "#F4EFE6", borderRadius: 14, padding: "1.25rem", border: "1px solid rgba(201,162,75,0.12)" }}>
                    <label style={{ display: "block", fontSize: "0.78rem", color: GOLD, fontWeight: 700, marginBottom: "0.75rem" }}>
                      عدد الحروف / الكلمات
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "center" }}>
                      <button onClick={() => setLetters(Math.max(1, letters - 1))} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(201,162,75,0.1)", border: "1px solid rgba(201,162,75,0.3)", color: GOLD, fontSize: "1.2rem", cursor: "pointer" }}>−</button>
                      <span style={{ fontSize: "2rem", fontWeight: 900, color: GOLD, minWidth: 40, textAlign: "center" }}>{letters}</span>
                      <button onClick={() => setLetters(Math.min(50, letters + 1))} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(201,162,75,0.1)", border: "1px solid rgba(201,162,75,0.3)", color: GOLD, fontSize: "1.2rem", cursor: "pointer" }}>+</button>
                    </div>
                    <p style={{ textAlign: "center", fontSize: "0.72rem", color: "#666", margin: "0.75rem 0 0" }}>
                      احسب كل حرف عربي أو إنجليزي بشكل منفصل
                    </p>
                  </div>
                </div>
              </Step>

              {/* Step 5 — Design */}
              <Step num={5} title="التصميم">
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                  {[
                    { id: "whatsapp" as DesignOpt, icon: "💬", name: "إرسال عبر واتساب", desc: "أرسل تصميمك أو شعارك عبر واتساب بعد التأكيد" },
                    { id: "upload"   as DesignOpt, icon: "📤", name: "رفع الملف الآن",    desc: "ارفع ملف AI, PDF, PNG الآن مع الطلب" },
                    { id: "online"   as DesignOpt, icon: "🎨", name: "صمم معنا",          desc: "أداة التصميم المباشر — قريباً ✨" },
                  ].map(opt => (
                    <OptionCard key={opt.id} selected={designOpt === opt.id} onClick={() => setDesignOpt(opt.id)}
                      icon={opt.icon} name={opt.name} desc={opt.desc} />
                  ))}
                </div>

                {designOpt === "upload" && (
                  <div style={{ padding: "1.5rem", borderRadius: 14, border: "2px dashed rgba(201,162,75,0.3)", background: "rgba(201,162,75,0.04)", textAlign: "center" }}>
                    <input type="file" accept=".ai,.pdf,.png,.jpg,.svg,.eps" id="design-upload"
                      style={{ display: "none" }} onChange={e => setUploadFile(e.target.files?.[0] ?? null)} />
                    <label htmlFor="design-upload" style={{ cursor: "pointer" }}>
                      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📁</div>
                      <div style={{ fontWeight: 700, color: GOLD, marginBottom: "0.25rem" }}>
                        {uploadFile ? uploadFile.name : "اضغط لرفع الملف"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#666" }}>
                        AI, PDF, PNG, SVG, EPS — الحجم الأقصى 20MB
                      </div>
                    </label>
                  </div>
                )}

                {designOpt === "online" && (
                  <div style={{ padding: "1.25rem", borderRadius: 12, background: "rgba(201,162,75,0.06)", border: "1px solid rgba(201,162,75,0.2)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.5rem" }}>🚀</span>
                    <div>
                      <div style={{ fontWeight: 700, color: "#2C1E15", marginBottom: "0.2rem" }}>أداة التصميم المباشر</div>
                      <div style={{ fontSize: "0.78rem", color: "#888" }}>قريباً — ستتمكن من كتابة النص واختيار الخط وتعديل الألوان مباشرة ومشاهدة النتيجة في الوقت الفعلي</div>
                    </div>
                  </div>
                )}
              </Step>
            </div>

            {/* Right: Price Summary (sticky) */}
            <div style={{ position: "sticky", top: 120 }}>
              <div style={{ borderRadius: 18, background: "#F4EFE6", border: "2px solid rgba(201,162,75,0.2)", overflow: "hidden" }}>
                {/* Header */}
                <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(201,162,75,0.1)", background: "rgba(201,162,75,0.06)" }}>
                  <div style={{ fontSize: "0.75rem", color: "#888", marginBottom: "0.25rem" }}>ملخص طلبك</div>
                  <div style={{ fontWeight: 900, color: "#2C1E15", fontSize: "1rem" }}>حروف بارزة مضيئة LED</div>
                </div>

                {/* Details */}
                <div style={{ padding: "1.25rem 1.5rem" }}>
                  {[
                    ["المادة",       selectedMat.nameAr],
                    ["الإضاءة",      selectedLit.nameAr],
                    ["لون LED",      LED_COLORS.find(c => c.id === ledColor)?.label ?? ""],
                    ["ارتفاع الحرف", `${height} سم`],
                    ["عدد الحروف",   `${letters} حرف`],
                    ["التصميم",      designOpt === "whatsapp" ? "عبر واتساب" : designOpt === "upload" ? (uploadFile?.name ?? "لم يُرفع بعد") : "صمم معنا"],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.82rem" }}>
                      <span style={{ color: "#777" }}>{k}</span>
                      <span style={{ color: "#ddd", fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}

                  {/* Price breakdown */}
                  <div style={{ marginTop: "1rem", padding: "1rem", borderRadius: 10, background: "rgba(201,162,75,0.06)", border: "1px solid rgba(201,162,75,0.15)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#888", marginBottom: "0.4rem" }}>
                      <span>{height}سم × {letters} حرف × {pricing[`${material}PerCmPerLetter` as keyof LedLettersPricing] as number} ر.س</span>
                      <span>{(Number(pricing[`${material}PerCmPerLetter` as keyof LedLettersPricing]) * height * letters).toLocaleString()} ر.س</span>
                    </div>
                    {lighting !== "front" && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#888", marginBottom: "0.4rem" }}>
                        <span>مضاعف نوع الإضاءة ×{pricing[`${lighting}LitMultiplier` as keyof LedLettersPricing]}</span>
                      </div>
                    )}
                    {price <= pricing.minimumOrder && (
                      <div style={{ fontSize: "0.72rem", color: "#666", marginBottom: "0.5rem" }}>* طُبِّق الحد الأدنى للطلب</div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem", borderTop: "1px solid rgba(201,162,75,0.15)" }}>
                      <span style={{ fontWeight: 800, color: "#2C1E15" }}>الإجمالي التقديري</span>
                      <span style={{ fontWeight: 900, fontSize: "1.2rem", background: G, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        {price.toLocaleString()} ر.س
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: "0.68rem", color: "#555", margin: "0.75rem 0 1.25rem", textAlign: "center" }}>
                    * السعر تقديري — السعر النهائي بعد مراجعة التصميم والمواصفات
                  </p>

                  {/* CTA */}
                  <a
                    href={`https://wa.me/966500000000?text=${buildWAMsg()}`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={() => setSubmitted(true)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem",
                      width: "100%", padding: "0.9rem", borderRadius: 12, border: "none",
                      background: G, color: "#2C1E15", fontWeight: 900, fontSize: "0.95rem",
                      textDecoration: "none", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
                      boxShadow: "0 8px 28px rgba(201,162,75,0.35)",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                    </svg>
                    اطلب الآن عبر واتساب
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
