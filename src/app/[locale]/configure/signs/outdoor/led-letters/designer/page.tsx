"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";

type Locale = "ar" | "en";
const GOLD = "#C9A24B";
const G    = "linear-gradient(135deg,#C9A24B,#EBCB7C)";

const ARABIC_FONTS = [
  { id: "Cairo",            nameAr: "القاهرة",   sample: "اسم الشركة" },
  { id: "Tajawal",          nameAr: "تجوال",      sample: "اسم الشركة" },
  { id: "Almarai",          nameAr: "المراعي",    sample: "اسم الشركة" },
  { id: "Amiri",            nameAr: "أميري",      sample: "اسم الشركة" },
  { id: "Noto+Kufi+Arabic", nameAr: "نوتو كوفي", sample: "اسم الشركة" },
  { id: "Lateef",           nameAr: "لطيف",       sample: "اسم الشركة" },
];

const LATIN_FONTS = [
  { id: "Oswald",               nameEn: "Oswald",     sample: "SIGN TEXT" },
  { id: "EB+Garamond",          nameEn: "Garamond",   sample: "SIGN TEXT" },
  { id: "Raleway",              nameEn: "Raleway",    sample: "SIGN TEXT" },
  { id: "Montserrat",           nameEn: "Montserrat", sample: "SIGN TEXT" },
  { id: "Helvetica Neue,Arial", nameEn: "Helvetica",  sample: "SIGN TEXT" },
];

const LAYOUTS = [
  { id: "logo-left",   icon: "◫◻",  nameAr: "الشعار في اليسار",  desc: "النمط الأول" },
  { id: "logo-center", icon: "◻◫◻", nameAr: "الشعار في الوسط",   desc: "النمط الثاني" },
  { id: "logo-right",  icon: "◻◫",  nameAr: "الشعار في اليمين",  desc: "النمط الثالث" },
];

const FACE_COLORS = [
  { id: "black",  label: "أسود",  bg: "#F4EFE6", text: "#ffffff" },
  { id: "white",  label: "أبيض",  bg: "#ffffff", text: "#F4EFE6" },
  { id: "gold",   label: "ذهبي",  bg: "#C9A24B", text: "#F4EFE6" },
  { id: "red",    label: "أحمر",  bg: "#CC2222", text: "#ffffff" },
  { id: "blue",   label: "أزرق",  bg: "#1a4fa8", text: "#ffffff" },
  { id: "green",  label: "أخضر",  bg: "#1a7a3a", text: "#ffffff" },
  { id: "custom", label: "مخصص", bg: "",         text: "" },
];

// ─── Live Preview ─────────────────────────────────────────────────────────────
function SignPreview({
  arabicName, englishName, taglineAr, taglineEn,
  arabicFont, latinFont, layout, faceColor, textColor,
  hasLogo, lines, showEnglish, showTaglineAr, showTaglineEn, showCommercial, fontScale,
}: {
  arabicName: string; englishName: string; taglineAr: string; taglineEn: string;
  arabicFont: string; latinFont: string; layout: string; faceColor: string; textColor: string;
  hasLogo: boolean; lines: "one" | "two"; showEnglish: boolean; showTaglineAr: boolean;
  showTaglineEn: boolean; showCommercial: boolean; fontScale: number;
}) {
  const arName = arabicName  || "الاسم العربي";
  const enName = englishName || "ENGLISH NAME";
  const tagAr  = taglineAr   || "";
  const tagEn  = taglineEn   || "";
  const ff = (id: string) => id.replace(/\+/g, " ");

  const LogoBox = () => (
    <div style={{
      width: 76, height: 76, borderRadius: 8, flexShrink: 0,
      border: `2px solid ${textColor}35`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      color: textColor, opacity: 0.45,
    }}>
      <span style={{ fontSize: "1.4rem" }}>🏢</span>
      <span style={{ fontSize: "0.5rem", marginTop: 2 }}>الشعار</span>
    </div>
  );

  const QRMark = () => showCommercial ? (
    <div style={{
      width: 54, height: 54, border: `2px solid ${textColor}25`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "0.48rem", color: textColor, opacity: 0.35,
      borderRadius: 4, flexShrink: 0, lineHeight: 1.4,
      textAlign: "center",
    }}>
      QR<br/>رمز
    </div>
  ) : null;

  const ArabicBlock = () => (
    <div style={{ textAlign: "right", flex: 1 }}>
      <div style={{
        fontFamily: `"${ff(arabicFont)}", sans-serif`, fontWeight: 700,
        fontSize: `calc(${lines === "one" ? "clamp(2rem,4.5vw,3.5rem)" : "clamp(1.6rem,3.5vw,2.8rem)"} * ${fontScale})`,
        color: textColor, lineHeight: 1.15, transition: "all 0.3s",
      }}>
        {arName}
        {lines === "two" && <div style={{ fontSize: "0.85em", opacity: 0.8, marginTop: "0.15rem" }}>{arName}</div>}
      </div>
      {tagAr && showTaglineAr && (
        <div style={{ fontFamily: `"${ff(arabicFont)}", sans-serif`, fontSize: "0.72em", color: textColor, opacity: 0.65, marginTop: "0.25rem" }}>{tagAr}</div>
      )}
    </div>
  );

  const EnglishBlock = () => !showEnglish ? null : (
    <div style={{ textAlign: "left", flex: 1 }}>
      <div style={{
        fontFamily: `"${ff(latinFont)}", sans-serif`, fontWeight: 700,
        fontSize: `calc(${lines === "one" ? "clamp(1.7rem,4vw,3rem)" : "clamp(1.3rem,3vw,2.4rem)"} * ${fontScale})`,
        color: textColor, lineHeight: 1.15, letterSpacing: "0.04em", transition: "all 0.3s",
      }}>
        {enName}
        {lines === "two" && <div style={{ fontSize: "0.85em", opacity: 0.8, marginTop: "0.15rem" }}>{enName}</div>}
      </div>
      {tagEn && showTaglineEn && (
        <div style={{ fontFamily: `"${ff(latinFont)}", sans-serif`, fontSize: "0.68em", color: textColor, opacity: 0.65, letterSpacing: "0.06em", marginTop: "0.25rem" }}>{tagEn}</div>
      )}
    </div>
  );

  const Divider = () => <div style={{ width: 1.5, height: 56, background: `${textColor}18`, flexShrink: 0 }} />;

  return (
    <div style={{
      width: "100%", height: 400, borderRadius: 18,
      background: faceColor || "#F4EFE6",
      border: `2px solid ${GOLD}30`,
      display: "flex", alignItems: "center",
      padding: "2.5rem 3.5rem",
      overflow: "hidden", boxSizing: "border-box",
      boxShadow: "0 12px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)",
      gap: "1.25rem", transition: "background 0.3s ease",
      position: "relative",
    }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)", backgroundSize: "22px 22px", pointerEvents: "none" }} />
      {layout === "logo-left" && (<><QRMark />{hasLogo && <LogoBox />}<EnglishBlock /><Divider /><ArabicBlock /></>)}
      {layout === "logo-center" && (<><EnglishBlock />{hasLogo && <LogoBox />}<Divider /><ArabicBlock /><QRMark /></>)}
      {layout === "logo-right" && (<><EnglishBlock /><Divider /><ArabicBlock />{hasLogo && <LogoBox />}<QRMark /></>)}
      <div style={{ position: "absolute", bottom: 7, left: 10, fontSize: "0.5rem", color: `${textColor}25`, fontFamily: "monospace", letterSpacing: "0.05em" }}>
        وفق إرشادات أمانة جدة §١.٥ و §٢.٥
      </div>
    </div>
  );
}

function loadFont(fontId: string) {
  if (typeof document === "undefined") return;
  if (document.getElementById(`font-${fontId}`)) return;
  const link = document.createElement("link");
  link.id = `font-${fontId}`;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${fontId}:wght@400;700&display=swap`;
  document.head.appendChild(link);
}

// ─── UI Primitives ────────────────────────────────────────────────────────────
function StepCard({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.85rem" }}>
        <div style={{
          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
          background: "rgba(201,162,75,0.15)", border: "1.5px solid rgba(201,162,75,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.72rem", fontWeight: 800, color: GOLD,
        }}>{num}</div>
        <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#e8e8e8" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ label, required, active = true }: { label: string; required?: boolean; active?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem" }}>
      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: active ? "#bbb" : "#555" }}>{label}</span>
      {required && <span style={{ background: GOLD, color: "#2C1E15", fontSize: "0.55rem", padding: "0.08rem 0.4rem", borderRadius: 999, fontWeight: 800 }}>إجباري</span>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, dir, disabled, fontFamily }: {
  value: string; onChange: (v: string) => void; placeholder: string;
  dir?: "rtl" | "ltr"; disabled?: boolean; fontFamily?: string;
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      dir={dir}
      disabled={disabled}
      style={{
        width: "100%", padding: "0.7rem 0.95rem", borderRadius: 10,
        background: disabled ? "#2C1E15" : "#0f0f0f",
        border: `1.5px solid ${disabled ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.1)"}`,
        color: disabled ? "#444" : "#2C1E15",
        fontSize: "0.92rem", fontFamily: fontFamily || "Tajawal, Cairo, sans-serif",
        outline: "none", boxSizing: "border-box" as const,
        opacity: disabled ? 0.5 : 1,
        transition: "border-color 0.2s",
        letterSpacing: dir === "ltr" ? "0.03em" : undefined,
      }}
    />
  );
}

function ToggleChip({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      padding: "0.28rem 0.65rem", borderRadius: 999, fontSize: "0.68rem",
      border: `1px solid ${active ? "rgba(201,162,75,0.4)" : "rgba(255,255,255,0.07)"}`,
      background: active ? "rgba(201,162,75,0.1)" : "rgba(255,255,255,0.02)",
      color: active ? GOLD : "#555", cursor: "pointer",
      fontFamily: "Tajawal, Cairo, sans-serif", transition: "all 0.15s",
      display: "inline-flex", alignItems: "center", gap: "0.25rem",
    }}>
      <span style={{ fontSize: "0.6rem" }}>{active ? "✓" : "✗"}</span> {label}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SignDesignerPage() {
  const locale = useLocale() as Locale;
  const ar = locale === "ar";

  const [arabicName,     setArabicName]     = useState("أدسوق");
  const [englishName,    setEnglishName]    = useState("ADSOUQ");
  const [taglineAr,      setTaglineAr]      = useState("لوحات احترافية");
  const [taglineEn,      setTaglineEn]      = useState("Professional Signs");
  const [hasLogo,        setHasLogo]        = useState(false);
  const [showEnglish,    setShowEnglish]    = useState(true);
  const [showTaglineAr,  setShowTaglineAr]  = useState(true);
  const [showTaglineEn,  setShowTaglineEn]  = useState(true);
  const [showCommercial, setShowCommercial] = useState(true);
  const [fontScale,      setFontScale]      = useState(1.0);
  const [arabicFont,     setArabicFont]     = useState("Cairo");
  const [latinFont,      setLatinFont]      = useState("Montserrat");
  const [layout,         setLayout]         = useState("logo-center");
  const [lines,          setLines]          = useState<"one" | "two">("one");
  const [faceColorId,    setFaceColorId]    = useState("black");
  const [customColor,    setCustomColor]    = useState("#F4EFE6");
  const [customText,     setCustomText]     = useState("#ffffff");
  const [width,          setWidth]          = useState(200);
  const [height,         setHeight]         = useState(60);

  const selectedColor = FACE_COLORS.find(c => c.id === faceColorId)!;
  const faceColor = faceColorId === "custom" ? customColor : selectedColor.bg;
  const textColor = faceColorId === "custom" ? customText  : selectedColor.text;

  useEffect(() => { loadFont(arabicFont); }, [arabicFont]);
  useEffect(() => { loadFont(latinFont);  }, [latinFont]);
  useEffect(() => {
    loadFont("Cairo"); loadFont("Montserrat");
    [...ARABIC_FONTS, ...LATIN_FONTS].forEach(f => loadFont(f.id));
  }, []);

  const buildWAMsg = () => encodeURIComponent([
    `🎨 طلب تصميم لوحة`,
    `━━━━━━━━━━━━━━`,
    `الاسم العربي: ${arabicName}`,
    `الاسم الإنجليزي: ${englishName}`,
    `الشعار النصي عربي: ${taglineAr}`,
    `الشعار النصي إنجليزي: ${taglineEn}`,
    `الخط العربي: ${ARABIC_FONTS.find(f=>f.id===arabicFont)?.nameAr}`,
    `الخط اللاتيني: ${LATIN_FONTS.find(f=>f.id===latinFont)?.nameEn}`,
    `التخطيط: ${LAYOUTS.find(l=>l.id===layout)?.nameAr}`,
    `عدد الأسطر: ${lines === "one" ? "سطر واحد" : "سطرين"}`,
    `لون الوجه: ${selectedColor.label}`,
    `المقاس: ${width}×${height} سم`,
  ].join("\n"));

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#F4EFE6", fontFamily: "Tajawal, Cairo, sans-serif", color: "#2C1E15" }}>

      {/* ── Header ── */}
      <section style={{
        padding: "1.75rem 0",
        borderBottom: "1px solid rgba(201,162,75,0.1)",
        background: "linear-gradient(180deg,#F4EFE6 0%,#F4EFE6 100%)",
      }}>
        <div className="section-container" dir="rtl">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.73rem", color: "#555", marginBottom: "1rem" }}>
            <Link href={`/${locale}/configure/signs/outdoor/led-letters`} style={{ color: GOLD, textDecoration: "none" }}>حروف LED</Link>
            <span style={{ color: "#333" }}>›</span>
            <span>مصمم اللوحة</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "0.45rem",
                padding: "0.22rem 0.8rem", borderRadius: 999,
                background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.2)",
                fontSize: "0.68rem", fontWeight: 700, color: GOLD, marginBottom: "0.65rem",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                مصمم اللوحة المباشر — وفق إرشادات أمانة جدة §١.٥
              </div>
              <h1 style={{ fontSize: "clamp(1.5rem,3vw,2.2rem)", fontWeight: 900, margin: 0, lineHeight: 1.2 }}>
                صمّم لوحتك وشاهد النتيجة
                <span style={{ background: G, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}> فوراً</span>
              </h1>
              <p style={{ color: "#666", fontSize: "0.83rem", margin: "0.4rem 0 0 0" }}>
                أدخل اسم نشاطك واختر الخط والتخطيط لمشاهدة اللوحة قبل الطلب
              </p>
            </div>
            <Link href={`/${locale}/configure/signs/outdoor/led-letters`} style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              padding: "0.5rem 1rem", borderRadius: 999,
              border: "1px solid rgba(201,162,75,0.2)", color: "#999",
              fontSize: "0.78rem", textDecoration: "none", transition: "color 0.2s",
            }}>
              ← العودة للتسعير
            </Link>
          </div>
        </div>
      </section>

      {/* ── Main Grid ── */}
      <section style={{ padding: "2rem 0 6rem" }}>
        <div className="section-container" dir="rtl">
          <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: "2.5rem", alignItems: "start" }}>

            {/* ── Controls ── */}
            <div>

              {/* Step 1: Content */}
              <StepCard num="١" title="محتوى اللوحة">
                <div style={{ background: "#F4EFE6", borderRadius: 14, padding: "1.25rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ marginBottom: "1rem" }}>
                    <FieldLabel label="الاسم العربي" required />
                    <TextInput value={arabicName} onChange={setArabicName} placeholder="اسم شركتك أو محلك" dir="rtl" fontFamily={`"${arabicFont}", Tajawal, Cairo, sans-serif`} />
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                      <FieldLabel label="الاسم الإنجليزي" active={showEnglish} />
                      <ToggleChip label={showEnglish ? "ظاهر" : "مخفي"} active={showEnglish} onToggle={() => setShowEnglish(v => !v)} />
                    </div>
                    <TextInput value={englishName} onChange={setEnglishName} placeholder="COMPANY NAME" dir="ltr" disabled={!showEnglish} fontFamily={`"${latinFont}", sans-serif`} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                        <FieldLabel label="شعار عربي" active={showTaglineAr} />
                        <ToggleChip label={showTaglineAr ? "ظاهر" : "مخفي"} active={showTaglineAr} onToggle={() => setShowTaglineAr(v => !v)} />
                      </div>
                      <TextInput value={taglineAr} onChange={setTaglineAr} placeholder="وصف مختصر" dir="rtl" disabled={!showTaglineAr} />
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                        <FieldLabel label="Tagline EN" active={showTaglineEn} />
                        <ToggleChip label={showTaglineEn ? "ظاهر" : "مخفي"} active={showTaglineEn} onToggle={() => setShowTaglineEn(v => !v)} />
                      </div>
                      <TextInput value={taglineEn} onChange={setTaglineEn} placeholder="Brief tagline" dir="ltr" disabled={!showTaglineEn} />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.6rem" }}>
                    {[
                      { label: "شعار صوري", val: hasLogo,        toggle: () => setHasLogo(v => !v) },
                      { label: "رمز QR",     val: showCommercial, toggle: () => setShowCommercial(v => !v) },
                    ].map(item => (
                      <button key={item.label} onClick={item.toggle} style={{
                        flex: 1, padding: "0.55rem 0.75rem", borderRadius: 9, cursor: "pointer",
                        border: `1.5px solid ${item.val ? "rgba(201,162,75,0.3)" : "rgba(255,255,255,0.07)"}`,
                        background: item.val ? "rgba(201,162,75,0.08)" : "rgba(255,255,255,0.02)",
                        color: item.val ? GOLD : "#555", fontSize: "0.76rem", fontWeight: 700,
                        fontFamily: "Tajawal, Cairo, sans-serif", transition: "all 0.2s",
                      }}>
                        {item.val ? `✓ ${item.label}` : `+ ${item.label}`}
                      </button>
                    ))}
                  </div>
                </div>
              </StepCard>

              {/* Step 2: Arabic Font */}
              <StepCard num="٢" title="الخط العربي">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem" }}>
                  {ARABIC_FONTS.map(font => (
                    <button key={font.id} onClick={() => setArabicFont(font.id)} style={{
                      padding: "0.9rem 0.75rem", borderRadius: 12, cursor: "pointer",
                      border: `2px solid ${arabicFont === font.id ? GOLD : "rgba(255,255,255,0.07)"}`,
                      background: arabicFont === font.id ? "rgba(201,162,75,0.1)" : "#2C1E15",
                      transition: "all 0.2s", textAlign: "center",
                    }}>
                      <div style={{
                        fontFamily: `"${font.id.replace(/\+/g," ")}", sans-serif`,
                        fontSize: "1.2rem", fontWeight: 700,
                        color: arabicFont === font.id ? GOLD : "#ddd",
                        marginBottom: "0.3rem",
                      }}>{font.sample}</div>
                      <div style={{ fontSize: "0.72rem", color: arabicFont === font.id ? GOLD : "#666", fontWeight: 600 }}>{font.nameAr}</div>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: "0.6rem", padding: "0.5rem 0.8rem", borderRadius: 8, background: "rgba(201,162,75,0.04)", border: "1px solid rgba(201,162,75,0.08)", fontSize: "0.7rem", color: "#666" }}>
                  📋 وفق §١.٥: لا يوجد تقييد في نوع الخط طالما تحققت قواعد الوضوح
                </div>
              </StepCard>

              {/* Step 3: Latin Font */}
              <StepCard num="٣" title="الخط اللاتيني">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" }}>
                  {LATIN_FONTS.map(font => (
                    <button key={font.id} onClick={() => setLatinFont(font.id)} style={{
                      padding: "0.9rem 0.4rem", borderRadius: 12, cursor: "pointer",
                      border: `2px solid ${latinFont === font.id ? GOLD : "rgba(255,255,255,0.07)"}`,
                      background: latinFont === font.id ? "rgba(201,162,75,0.1)" : "#2C1E15",
                      transition: "all 0.2s", textAlign: "center",
                    }}>
                      <div style={{
                        fontFamily: `"${font.id.replace(/\+/g," ")}", sans-serif`,
                        fontSize: "0.82rem", fontWeight: 700,
                        color: latinFont === font.id ? GOLD : "#ddd",
                        marginBottom: "0.28rem", letterSpacing: "0.02em",
                      }}>{font.sample}</div>
                      <div style={{ fontSize: "0.65rem", color: latinFont === font.id ? GOLD : "#666", fontWeight: 600 }}>{font.nameEn}</div>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: "0.6rem", padding: "0.5rem 0.8rem", borderRadius: 8, background: "rgba(201,162,75,0.04)", border: "1px solid rgba(201,162,75,0.08)", fontSize: "0.7rem", color: "#666" }}>
                  📏 الخط اللاتيني يكون أصغر بـ 5% من العربي — يُطبَّق تلقائياً في المعاينة
                </div>
              </StepCard>

              {/* Step 4: Layout */}
              <StepCard num="٤" title="تخطيط اللوحة (§٢.٥)">
                <div style={{ display: "flex", gap: "0.65rem", marginBottom: "0.75rem" }}>
                  {LAYOUTS.map(l => (
                    <button key={l.id} onClick={() => setLayout(l.id)} style={{
                      flex: 1, padding: "0.85rem 0.5rem", borderRadius: 10, cursor: "pointer",
                      border: `2px solid ${layout === l.id ? GOLD : "rgba(255,255,255,0.07)"}`,
                      background: layout === l.id ? "rgba(201,162,75,0.1)" : "#2C1E15",
                      transition: "all 0.2s", textAlign: "center",
                    }}>
                      <div style={{ fontSize: "1.1rem", marginBottom: "0.25rem", color: layout === l.id ? GOLD : "#666" }}>{l.icon}</div>
                      <div style={{ fontSize: "0.73rem", fontWeight: 700, color: layout === l.id ? GOLD : "#ccc" }}>{l.nameAr}</div>
                      <div style={{ fontSize: "0.62rem", color: "#555", marginTop: "0.12rem" }}>{l.desc}</div>
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.6rem" }}>
                  {(["one", "two"] as const).map(v => (
                    <button key={v} onClick={() => setLines(v)} style={{
                      flex: 1, padding: "0.6rem", borderRadius: 9, cursor: "pointer",
                      border: `2px solid ${lines === v ? GOLD : "rgba(255,255,255,0.07)"}`,
                      background: lines === v ? "rgba(201,162,75,0.1)" : "#2C1E15",
                      color: lines === v ? GOLD : "#777", fontSize: "0.8rem", fontWeight: lines === v ? 700 : 400,
                      fontFamily: "Tajawal, Cairo, sans-serif", transition: "all 0.2s",
                    }}>
                      {v === "one" ? "≡ سطر واحد" : "≡≡ سطرين"}
                    </button>
                  ))}
                </div>
              </StepCard>

              {/* Step 5: Dimensions */}
              <StepCard num="٥" title="مقاس اللوحة">
                <div style={{ background: "#F4EFE6", borderRadius: 14, padding: "1.25rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                    <div>
                      <label style={{ display: "block", color: "#999", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.35rem" }}>العرض (سم)</label>
                      <input type="number" min={30} max={800} value={width} onChange={e => setWidth(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.65rem", borderRadius: 10, background: "#FDFBF7", border: "1.5px solid rgba(201,162,75,0.2)", color: "#fff", fontSize: "1rem", fontWeight: 700, outline: "none", boxSizing: "border-box" as const, textAlign: "center" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", color: "#999", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.35rem" }}>الارتفاع (سم)</label>
                      <input type="number" min={10} max={200} value={height} onChange={e => setHeight(Number(e.target.value))}
                        style={{ width: "100%", padding: "0.65rem", borderRadius: 10, background: "#FDFBF7", border: "1.5px solid rgba(201,162,75,0.2)", color: "#fff", fontSize: "1rem", fontWeight: 700, outline: "none", boxSizing: "border-box" as const, textAlign: "center" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {[
                      { label: "صغير (100×40)",   w: 100, h: 40 },
                      { label: "متوسط (200×60)",  w: 200, h: 60 },
                      { label: "كبير (300×80)",   w: 300, h: 80 },
                      { label: "جامبو (500×100)", w: 500, h: 100 },
                    ].map(s => (
                      <button key={s.label} onClick={() => { setWidth(s.w); setHeight(s.h); }} style={{
                        padding: "0.28rem 0.7rem", borderRadius: 999, fontSize: "0.7rem",
                        border: `1px solid ${width === s.w && height === s.h ? "rgba(201,162,75,0.4)" : "rgba(255,255,255,0.07)"}`,
                        background: width === s.w && height === s.h ? "rgba(201,162,75,0.1)" : "rgba(255,255,255,0.02)",
                        color: width === s.w && height === s.h ? GOLD : "#666",
                        cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif", transition: "all 0.15s",
                      }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: "0.7rem", fontSize: "0.7rem", color: "#555", lineHeight: 1.6 }}>
                    📏 وفق §٢.٥: ارتفاع اللوحة = ⅓ من ارتفاع الواجهة — واجهة 3م → لوحة 1م
                  </div>
                </div>
              </StepCard>

              {/* Step 6: Color */}
              <StepCard num="٦" title="لون وجه اللوحة">
                <div style={{ background: "#F4EFE6", borderRadius: 14, padding: "1.25rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", flexWrap: "wrap" }}>
                    {FACE_COLORS.filter(c => c.id !== "custom").map(color => (
                      <button key={color.id} onClick={() => setFaceColorId(color.id)} title={color.label} style={{
                        width: 42, height: 42, borderRadius: 10,
                        border: `2.5px solid ${faceColorId === color.id ? GOLD : "rgba(255,255,255,0.1)"}`,
                        background: color.bg, cursor: "pointer", transition: "all 0.2s",
                        position: "relative", outline: "none",
                        boxShadow: faceColorId === color.id ? `0 0 0 3px rgba(201,162,75,0.2)` : "none",
                      }}>
                        {faceColorId === color.id && (
                          <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: color.text, fontSize: "0.9rem", fontWeight: 700 }}>✓</span>
                        )}
                      </button>
                    ))}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <input type="color" value={customColor} onChange={e => { setCustomColor(e.target.value); setFaceColorId("custom"); }} title="لون مخصص"
                        style={{ width: 42, height: 42, borderRadius: 10, border: `2.5px solid ${faceColorId === "custom" ? GOLD : "rgba(255,255,255,0.1)"}`, cursor: "pointer", padding: 2, background: "transparent" }} />
                      {faceColorId === "custom" && (
                        <input type="color" value={customText} onChange={e => setCustomText(e.target.value)} title="لون النص"
                          style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", padding: 2, background: "transparent" }} />
                      )}
                    </div>
                  </div>
                  {faceColorId === "custom" && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.68rem", color: "#555" }}>الأول: لون الخلفية · الثاني: لون النص</div>
                  )}
                </div>
              </StepCard>
            </div>

            {/* ── Sticky Preview ── */}
            <div style={{ position: "sticky", top: 108 }}>

              {/* Preview header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "inline-block", boxShadow: "0 0 6px #4ade80" }} />
                  <span style={{ fontSize: "0.75rem", color: "#666", fontWeight: 600 }}>معاينة حية</span>
                </div>
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", justifyContent: "flex-start" }}>
                  {[
                    { key: "english", label: "الاسم الإنجليزي", val: showEnglish, toggle: () => setShowEnglish(v => !v) },
                    { key: "tagAr",   label: "شعار عربي",        val: showTaglineAr, toggle: () => setShowTaglineAr(v => !v) },
                    { key: "tagEn",   label: "Tagline EN",        val: showTaglineEn, toggle: () => setShowTaglineEn(v => !v) },
                    { key: "qr",      label: "رمز QR",            val: showCommercial, toggle: () => setShowCommercial(v => !v) },
                    { key: "logo",    label: "الشعار",             val: hasLogo, toggle: () => setHasLogo(v => !v) },
                  ].map(item => (
                    <ToggleChip key={item.key} label={item.label} active={item.val} onToggle={item.toggle} />
                  ))}
                </div>
              </div>

              {/* Font scale */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.85rem", background: "#F4EFE6", padding: "0.7rem 1rem", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "0.7rem", color: "#666", whiteSpace: "nowrap" }}>حجم الخط</span>
                <input type="range" min={0.5} max={2} step={0.05} value={fontScale}
                  onChange={e => setFontScale(Number(e.target.value))}
                  style={{ flex: 1, accentColor: GOLD, height: 4 }} />
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  <button onClick={() => setFontScale(s => Math.max(0.5, +(s - 0.1).toFixed(2)))}
                    style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(201,162,75,0.25)", background: "rgba(201,162,75,0.06)", color: GOLD, cursor: "pointer", fontWeight: 700, fontSize: "0.9rem" }}>−</button>
                  <button onClick={() => setFontScale(1)} title="إعادة"
                    style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(255,255,255,0.07)", background: "transparent", color: "#555", cursor: "pointer", fontSize: "0.6rem" }}>↺</button>
                  <button onClick={() => setFontScale(s => Math.min(2, +(s + 0.1).toFixed(2)))}
                    style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(201,162,75,0.25)", background: "rgba(201,162,75,0.06)", color: GOLD, cursor: "pointer", fontWeight: 700, fontSize: "0.9rem" }}>+</button>
                </div>
                <span style={{ fontSize: "0.75rem", color: GOLD, fontWeight: 700, minWidth: 34, textAlign: "center" }}>{Math.round(fontScale * 100)}%</span>
              </div>

              {/* Sign Preview */}
              <SignPreview
                arabicName={arabicName} englishName={englishName}
                taglineAr={taglineAr} taglineEn={taglineEn}
                arabicFont={arabicFont} latinFont={latinFont}
                layout={layout} lines={lines}
                faceColor={faceColor} textColor={textColor}
                hasLogo={hasLogo} showEnglish={showEnglish}
                showTaglineAr={showTaglineAr} showTaglineEn={showTaglineEn}
                showCommercial={showCommercial} fontScale={fontScale}
              />

              {/* Summary */}
              <div style={{
                marginTop: "1rem", padding: "1rem 1.1rem", borderRadius: 12,
                background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.05)",
              }}>
                <div style={{ fontSize: "0.68rem", color: "#444", fontWeight: 700, marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>ملخص التصميم</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.3rem 1rem" }}>
                  {[
                    ["الخط العربي",   ARABIC_FONTS.find(f=>f.id===arabicFont)?.nameAr ?? ""],
                    ["الخط اللاتيني", LATIN_FONTS.find(f=>f.id===latinFont)?.nameEn ?? ""],
                    ["التخطيط",       LAYOUTS.find(l=>l.id===layout)?.nameAr ?? ""],
                    ["الأسطر",        lines === "one" ? "سطر واحد" : "سطرين"],
                    ["اللون",         FACE_COLORS.find(c=>c.id===faceColorId)?.label ?? "مخصص"],
                    ["المقاس",        `${width}×${height} سم`],
                  ].map(([k,v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "0.28rem 0", borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: "0.75rem" }}>
                      <span style={{ color: "#555" }}>{k}</span>
                      <span style={{ color: "#ccc", fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance */}
              <div style={{
                marginTop: "0.85rem", padding: "0.8rem 1rem", borderRadius: 12,
                background: "rgba(201,162,75,0.04)", border: "1px solid rgba(201,162,75,0.12)",
                fontSize: "0.72rem", color: "#777", lineHeight: 1.7,
              }}>
                🏛️ <strong style={{ color: GOLD }}>وفق الإرشادات الرسمية:</strong>
                <span style={{ color: "#4ade80" }}> ✓</span> الخط العربي في اليمين، اللاتيني في اليسار ·
                <span style={{ color: "#4ade80" }}> ✓</span> الخط اللاتيني أصغر بـ 5% ·
                <span style={{ color: "#4ade80" }}> ✓</span> رمز QR مُضمَّن
              </div>

              {/* CTA */}
              <a
                href={`https://wa.me/966500000000?text=${buildWAMsg()}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem",
                  width: "100%", padding: "0.95rem", borderRadius: 14, marginTop: "0.85rem",
                  background: G, color: "#2C1E15", fontWeight: 900, fontSize: "0.92rem",
                  textDecoration: "none", fontFamily: "Tajawal, Cairo, sans-serif",
                  boxShadow: "0 6px 24px rgba(201,162,75,0.3)",
                  boxSizing: "border-box" as const, transition: "opacity 0.2s",
                }}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
                أرسل تصميمي وأطلب الآن
              </a>

              <div style={{ textAlign: "center", marginTop: "0.5rem", fontSize: "0.68rem", color: "#444" }}>
                سيُرسَل تصميمك كاملاً مع الطلب للواتساب
              </div>
            </div>
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        input[type=range]::-webkit-slider-thumb { cursor: grab; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
      `}} />
    </div>
  );
}
