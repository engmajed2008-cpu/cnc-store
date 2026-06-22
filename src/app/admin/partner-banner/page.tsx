"use client";
import { useState, useEffect } from "react";
import { siteStore, DEFAULT_PARTNER_BANNER, type PartnerBannerData } from "@/store/siteStore";

const G  = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

const inp: React.CSSProperties = {
  width: "100%", padding: "0.6rem 0.9rem", borderRadius: 8,
  border: "1px solid rgba(154,106,42,0.25)", background: "#F2E8D0",
  color: "#2C1E15", fontSize: "0.86rem", fontFamily: "Tajawal, Cairo, sans-serif",
  outline: "none", boxSizing: "border-box",
};
const ta: React.CSSProperties = { ...inp, resize: "vertical" as const, minHeight: 90 };

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: "block", color: "#C9A24B", fontSize: "0.75rem", fontWeight: 700, marginBottom: 6 }}>{children}</label>;
}
function Hint({ text }: { text: string }) {
  return <div style={{ fontSize: "0.7rem", color: "#4A3525", marginTop: 5 }}>{text}</div>;
}
function CharCount({ value, max }: { value: string; max: number }) {
  const v = value ?? "";
  const over = v.length > max;
  return <span style={{ fontSize: "0.68rem", color: over ? "#ef4444" : v.length > max * 0.8 ? "#C9A24B" : "#4A3525", marginRight: 6 }}>{v.length}/{max}</span>;
}
function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>{children}</div>;
}
function FieldBox({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export default function PartnerBannerAdminPage() {
  const [d, setD]     = useState<PartnerBannerData>(DEFAULT_PARTNER_BANNER);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = siteStore.getPartnerBanner();
    if (stored) setD(stored);
  }, []);

  const up = <K extends keyof PartnerBannerData>(field: K, val: PartnerBannerData[K]) =>
    setD(prev => ({ ...prev, [field]: val }));

  const upBenefit = (lang: "Ar" | "En", i: number, val: string) => {
    const key = lang === "Ar" ? "benefitsAr" : "benefitsEn";
    const arr = [...d[key]];
    arr[i] = val;
    setD(prev => ({ ...prev, [key]: arr }));
  };
  const addBenefit = () => setD(prev => ({ ...prev, benefitsAr: [...prev.benefitsAr, "✓ ميزة جديدة"], benefitsEn: [...prev.benefitsEn, "✓ New benefit"] }));
  const removeBenefit = (i: number) => setD(prev => ({ ...prev, benefitsAr: prev.benefitsAr.filter((_, idx) => idx !== i), benefitsEn: prev.benefitsEn.filter((_, idx) => idx !== i) }));

  const handleSave = () => {
    siteStore.savePartnerBanner(d);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };
  const handleReset = () => setD(DEFAULT_PARTNER_BANNER);

  return (
    <div style={{ padding: "2.5rem", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl", minHeight: "100vh", background: "#F4EFE6" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ color: "#C9A24B", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            لوحة التحكم / بانر الشراكة
          </div>
          <h1 style={{ fontSize: "1.9rem", fontWeight: 900, margin: 0, ...GT }}>بانر الشراكة 🤝</h1>
          <p style={{ color: "#5A4A3A", marginTop: "0.4rem", fontSize: "0.88rem" }}>
            عدّل نصوص وزر بانر دعوة الموردين والمقاولين للانضمام كشركاء
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={handleSave} style={{ padding: "0.75rem 2rem", borderRadius: 999, background: G, color: "#2C1E15", fontWeight: 800, border: "none", cursor: "pointer", fontSize: "0.9rem" }}>
            💾 حفظ
          </button>
          <button onClick={handleReset} style={{ padding: "0.75rem 1.5rem", borderRadius: 999, background: "rgba(201,162,75,0.08)", color: "#C9A24B", fontWeight: 700, fontSize: "0.85rem", border: "1px solid rgba(201,162,75,0.25)", cursor: "pointer" }}>
            ↩ استعادة الافتراضي
          </button>
        </div>
      </div>

      {/* Toast */}
      {saved && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: G, color: "#2C1E15", padding: "0.75rem 2rem", borderRadius: 999, fontWeight: 700, fontSize: "0.9rem", boxShadow: "0 8px 32px rgba(201,162,75,0.4)" }}>
          ✓ تم الحفظ وتحديث الموقع
        </div>
      )}

      {/* Live preview */}
      <div style={{ marginBottom: "2rem", borderRadius: 16, background: "#E2CFA8", border: "1px solid rgba(74,53,37,0.15)", padding: "32px 36px", position: "relative", overflow: "hidden" }}>
        <div style={{ fontSize: "0.68rem", color: "#9A6A2A", fontWeight: 700, marginBottom: 12 }}>معاينة مباشرة (عربي):</div>
        <span style={{ display: "inline-block", background: "rgba(201,162,75,0.12)", border: "1px solid rgba(201,162,75,0.28)", borderRadius: 999, padding: "3px 14px", fontSize: 11, color: "#C9A24B", fontWeight: 700, marginBottom: 10 }}>{d.badgeAr}</span>
        <h2 style={{ color: "#2C1E15", fontSize: "1.4rem", fontWeight: 900, marginBottom: 10, lineHeight: 1.25 }}>{d.titleAr}</h2>
        <p style={{ color: "#5A3E28", fontSize: 13.5, lineHeight: 1.75, maxWidth: 500, marginBottom: 14 }}>{d.descAr}</p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          {d.benefitsAr.map((b, i) => <span key={i} style={{ fontSize: 12, color: "#9A6A2A", fontWeight: 700 }}>{b}</span>)}
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 28px", borderRadius: 10, background: "linear-gradient(135deg,#C9A24B,#B38F3A)", color: "#2C1E15", fontSize: 14, fontWeight: 900 }}>
          {d.ctaAr}
        </div>
        <div style={{ fontSize: 11.5, color: "#6B5040", marginTop: 10 }}>{d.noteAr}</div>
      </div>

      {/* Form sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* Section: شارة */}
        <div style={{ padding: "1.5rem", borderRadius: 14, background: "#F2E8D0", border: "1px solid rgba(201,162,75,0.1)" }}>
          <div style={{ color: "#C9A24B", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1rem" }}>الشارة (badge)</div>
          <Row>
            <FieldBox>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Label>الشارة (عربي)</Label><CharCount value={d.badgeAr} max={30} />
              </div>
              <input value={d.badgeAr} onChange={e => up("badgeAr", e.target.value)} style={inp} />
              <Hint text="النص الصغير فوق العنوان داخل إطار ذهبي • حد أقصى 30 حرفاً" />
            </FieldBox>
            <FieldBox>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Label>Badge (EN)</Label><CharCount value={d.badgeEn} max={40} />
              </div>
              <input value={d.badgeEn} onChange={e => up("badgeEn", e.target.value)} style={inp} dir="ltr" />
              <Hint text="Small badge above title • max 40 chars" />
            </FieldBox>
          </Row>
        </div>

        {/* Section: العنوان والوصف */}
        <div style={{ padding: "1.5rem", borderRadius: 14, background: "#F2E8D0", border: "1px solid rgba(201,162,75,0.1)" }}>
          <div style={{ color: "#C9A24B", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1rem" }}>العنوان والوصف</div>
          <Row>
            <FieldBox>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Label>العنوان (عربي)</Label><CharCount value={d.titleAr} max={50} />
              </div>
              <input value={d.titleAr} onChange={e => up("titleAr", e.target.value)} style={inp} />
              <Hint text="العنوان الرئيسي الكبير • حد أقصى 50 حرفاً" />
            </FieldBox>
            <FieldBox>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Label>Title (EN)</Label><CharCount value={d.titleEn} max={60} />
              </div>
              <input value={d.titleEn} onChange={e => up("titleEn", e.target.value)} style={inp} dir="ltr" />
              <Hint text="Main headline • max 60 chars" />
            </FieldBox>
          </Row>
          <Row>
            <FieldBox>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Label>الوصف (عربي)</Label><CharCount value={d.descAr} max={160} />
              </div>
              <textarea value={d.descAr} onChange={e => up("descAr", e.target.value)} style={ta} />
              <Hint text="جملتان تشرحان الفائدة للشريك • حد أقصى 160 حرفاً" />
            </FieldBox>
            <FieldBox>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Label>Description (EN)</Label><CharCount value={d.descEn} max={200} />
              </div>
              <textarea value={d.descEn} onChange={e => up("descEn", e.target.value)} style={{ ...ta, direction: "ltr" }} />
              <Hint text="2 sentences explaining partner benefits • max 200 chars" />
            </FieldBox>
          </Row>
        </div>

        {/* Section: المزايا */}
        <div style={{ padding: "1.5rem", borderRadius: 14, background: "#F2E8D0", border: "1px solid rgba(201,162,75,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ color: "#C9A24B", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase" }}>المزايا السريعة (checkmarks)</div>
            <button onClick={addBenefit} style={{ padding: "4px 14px", borderRadius: 999, background: "rgba(201,162,75,0.1)", border: "1px solid rgba(201,162,75,0.25)", color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>+ إضافة</button>
          </div>
          {d.benefitsAr.map((_, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 32px", gap: "0.75rem", marginBottom: "0.75rem", alignItems: "center" }}>
              <div>
                <input value={d.benefitsAr[i]} onChange={e => upBenefit("Ar", i, e.target.value)} style={inp} placeholder="✓ ميزة..." />
                <Hint text="تبدأ عادةً بـ ✓ • حد أقصى 25 حرفاً" />
              </div>
              <div>
                <input value={d.benefitsEn[i] || ""} onChange={e => upBenefit("En", i, e.target.value)} style={inp} dir="ltr" placeholder="✓ Benefit..." />
                <Hint text="Starts with ✓ • max 25 chars" />
              </div>
              {d.benefitsAr.length > 1 && (
                <button onClick={() => removeBenefit(i)} style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.2)", color: "#e05555", cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
              )}
            </div>
          ))}
        </div>

        {/* Section: الزر */}
        <div style={{ padding: "1.5rem", borderRadius: 14, background: "#F2E8D0", border: "1px solid rgba(201,162,75,0.1)" }}>
          <div style={{ color: "#C9A24B", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1rem" }}>زر الدعوة (CTA)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <FieldBox>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Label>نص الزر (عربي)</Label><CharCount value={d.ctaAr} max={25} />
              </div>
              <input value={d.ctaAr} onChange={e => up("ctaAr", e.target.value)} style={inp} />
              <Hint text="نص الزر الذهبي • حد أقصى 25 حرفاً" />
            </FieldBox>
            <FieldBox>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Label>Button text (EN)</Label><CharCount value={d.ctaEn} max={30} />
              </div>
              <input value={d.ctaEn} onChange={e => up("ctaEn", e.target.value)} style={inp} dir="ltr" />
              <Hint text="Gold button text • max 30 chars" />
            </FieldBox>
            <FieldBox>
              <Label>الرابط (href)</Label>
              <input value={d.ctaHref} onChange={e => up("ctaHref", e.target.value)} style={inp} dir="ltr" placeholder="/join" />
              <Hint text="مسار الصفحة — يبدأ بـ / • مثال: /join" />
            </FieldBox>
          </div>
          <Row>
            <FieldBox>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Label>ملاحظة أسفل الزر (عربي)</Label><CharCount value={d.noteAr} max={60} />
              </div>
              <input value={d.noteAr} onChange={e => up("noteAr", e.target.value)} style={inp} />
              <Hint text="جملة تطمينية صغيرة أسفل الزر • مثال: التسجيل مجاني — يستغرق أقل من دقيقتين" />
            </FieldBox>
            <FieldBox>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Label>Note below button (EN)</Label><CharCount value={d.noteEn} max={70} />
              </div>
              <input value={d.noteEn} onChange={e => up("noteEn", e.target.value)} style={inp} dir="ltr" />
              <Hint text="Reassurance text below button • max 70 chars" />
            </FieldBox>
          </Row>
        </div>
      </div>
    </div>
  );
}
