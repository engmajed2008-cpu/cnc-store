"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { siteStore, DEFAULT_HOME_PATHS, type HomePath } from "@/store/siteStore";

const ImageUploader = dynamic(() => import("@/components/admin/ImageUploader"), { ssr: false });

const G  = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

const GRADIENT_PRESETS = [
  { label: "ذهبي غامق",  value: "linear-gradient(135deg,#FDFBF7 0%,#F4EFE6 50%,#FDFBF7 100%)" },
  { label: "أزرق ليلي",  value: "linear-gradient(135deg,#0a1218 0%,#0d1a24 50%,#FDFBF7 100%)" },
  { label: "بني دافئ",   value: "linear-gradient(135deg,#F4EFE6 0%,#1e1a0e 50%,#FDFBF7 100%)" },
  { label: "بنفسجي",     value: "linear-gradient(135deg,#120810 0%,#1e0f1a 50%,#FDFBF7 100%)" },
  { label: "نيلي",       value: "linear-gradient(135deg,#0d0d14 0%,#14142a 50%,#FDFBF7 100%)" },
  { label: "أخضر داكن",  value: "linear-gradient(135deg,#0a1208 0%,#111e0a 50%,#FDFBF7 100%)" },
];

const HREF_OPTIONS = [
  { label: "/products", value: "/products" },
  { label: "/configure", value: "/configure" },
  { label: "/request/new", value: "/request/new" },
  { label: "/join", value: "/join" },
  { label: "/configure/signs", value: "/configure/signs" },
  { label: "/products/banners", value: "/products/banners" },
];

const inp: React.CSSProperties = {
  width: "100%", padding: "0.6rem 0.9rem", borderRadius: 8,
  border: "1px solid rgba(154,106,42,0.25)", background: "#F2E8D0",
  color: "#2C1E15", fontSize: "0.88rem", fontFamily: "Tajawal, Cairo, sans-serif",
  outline: "none", boxSizing: "border-box",
};

function FieldHint({ text }: { text: string }) {
  return (
    <div style={{ fontSize: "0.72rem", color: "#5A4A3A", marginTop: 5, lineHeight: 1.6 }}>
      {text}
    </div>
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  const len = (value ?? "").length;
  const over = len > max;
  return (
    <span style={{ fontSize: "0.68rem", color: over ? "#ef4444" : len > max * 0.8 ? "#C9A24B" : "#4A3525", marginRight: 6 }}>
      {len}/{max}
    </span>
  );
}

function makeBlank(paths: HomePath[]): HomePath {
  const nextN = paths.length + 1;
  return {
    id: Math.max(0, ...paths.map((p) => p.id)) + 1,
    num: String(nextN).padStart(2, "0"),
    badge: String(nextN).padStart(2, "0"),
    key: `path_${nextN}`,
    nameAr: "مسار جديد",
    nameEn: "New Path",
    descAr: "",
    descEn: "",
    ctaAr: "استكشف الآن",
    ctaEn: "Explore Now",
    tagAr: `المسار ${nextN === 1 ? "الأول" : nextN === 2 ? "الثاني" : nextN === 3 ? "الثالث" : String(nextN)}`,
    tagEn: `Track ${nextN}`,
    href: "/products",
    image: null,
    gradient: GRADIENT_PRESETS[nextN % GRADIENT_PRESETS.length].value,
  };
}

function reNumber(list: HomePath[]): HomePath[] {
  return list.map((p, i) => ({
    ...p,
    num: String(i + 1).padStart(2, "0"),
    badge: String(i + 1).padStart(2, "0"),
  }));
}

export default function AdminHomePathsPage() {
  const [paths, setPaths]         = useState<HomePath[]>(DEFAULT_HOME_PATHS);
  const [editing, setEditing]     = useState<HomePath | null>(null);
  const [isNew, setIsNew]         = useState(false);
  const [delConfirm, setDelConfirm] = useState<number | null>(null);
  const [saved, setSaved]         = useState(false);

  useEffect(() => {
    const stored = siteStore.getHomePaths();
    if (stored?.length) setPaths(stored);
  }, []);

  const persist = (next: HomePath[]) => {
    const numbered = reNumber(next);
    setPaths(numbered);
    siteStore.saveHomePaths(numbered);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSave = () => {
    if (!editing) return;
    const next = isNew
      ? [...paths, editing]
      : paths.map((p) => (p.id === editing.id ? editing : p));
    persist(next);
    setEditing(null);
    setIsNew(false);
  };

  const handleDelete = (id: number) => {
    persist(paths.filter((p) => p.id !== id));
    setDelConfirm(null);
  };

  const handleReset = () => {
    persist(DEFAULT_HOME_PATHS);
  };

  const up = <K extends keyof HomePath>(field: K, val: HomePath[K]) =>
    setEditing((s) => (s ? { ...s, [field]: val } : s));

  return (
    <div style={{ padding: "2.5rem", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl", minHeight: "100vh", background: "#F4EFE6" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ color: "#C9A24B", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            لوحة التحكم / الصفحة الرئيسية
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, margin: 0, ...GT }}>إدارة المسارات 🛤️</h1>
          <p style={{ color: "#666", marginTop: "0.5rem", fontSize: "0.88rem" }}>
            أضف مساراً جديداً أو عدّل الموجود أو احذفه — كل تغيير يظهر فوراً على الصفحة الرئيسية
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            onClick={() => { setIsNew(true); setEditing(makeBlank(paths)); }}
            style={{ padding: "0.75rem 1.75rem", borderRadius: 999, background: G, color: "#2C1E15", fontWeight: 800, border: "none", cursor: "pointer", fontSize: "0.9rem" }}
          >
            + إضافة مسار
          </button>
          <button
            onClick={handleReset}
            style={{ padding: "0.75rem 1.5rem", borderRadius: 999, background: "rgba(201,162,75,0.08)", color: "#C9A24B", fontWeight: 700, fontSize: "0.88rem", border: "1px solid rgba(201,162,75,0.25)", cursor: "pointer" }}
          >
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

      {/* Paths grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: paths.length <= 3 ? `repeat(${paths.length}, 1fr)` : "repeat(3, 1fr)",
        gap: "1.25rem",
        marginBottom: "1.5rem",
      }}>
        {paths.map((p) => (
          <div
            key={p.id}
            style={{ borderRadius: 20, overflow: "hidden", position: "relative", border: "1px solid rgba(201,162,75,0.15)", background: p.gradient || "#F4EFE6", minHeight: 260 }}
          >
            {p.image && (
              <img src={p.image} alt={p.nameAr} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.35) 100%)" }} />

            <div style={{ position: "absolute", top: 8, left: 14, fontSize: 68, fontWeight: 900, color: "rgba(201,162,75,0.07)", lineHeight: 1, userSelect: "none", zIndex: 1 }}>
              {p.num}
            </div>

            {/* key chip */}
            <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.65)", borderRadius: 6, padding: "2px 8px", fontSize: 10, color: "#C9A24B", fontFamily: "monospace", zIndex: 3 }}>
              {p.key}
            </div>

            {/* Delete confirm overlay */}
            {delConfirm === p.id && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 20 }}>
                <p style={{ color: "#2C1E15", fontWeight: 700, fontSize: 14, textAlign: "center" }}>حذف «{p.nameAr}»؟</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleDelete(p.id)} style={{ padding: "6px 20px", borderRadius: 999, background: "#dc2626", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 13 }}>نعم، احذف</button>
                  <button onClick={() => setDelConfirm(null)} style={{ padding: "6px 16px", borderRadius: 999, background: "rgba(255,255,255,0.1)", color: "#ccc", fontWeight: 600, border: "none", cursor: "pointer", fontSize: 13 }}>إلغاء</button>
                </div>
              </div>
            )}

            {/* Card content */}
            <div style={{ position: "relative", zIndex: 2, padding: "1.2rem", display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: 260 }}>
              <div style={{ display: "inline-block", padding: "2px 10px", borderRadius: 999, background: "rgba(201,162,75,0.1)", border: "1px solid rgba(201,162,75,0.25)", color: "#C9A24B", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: 8, width: "fit-content" }}>
                {p.tagAr}
              </div>
              <div style={{ color: "#2C1E15", fontWeight: 900, fontSize: "1.05rem", marginBottom: 6 }}>{p.nameAr}</div>
              <div style={{ color: "#777", fontSize: "0.8rem", lineHeight: 1.6, marginBottom: 14 }}>{p.descAr}</div>
              <div style={{ color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, marginBottom: 14 }}>← {p.ctaAr}</div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => { setEditing({ ...p }); setIsNew(false); }}
                  style={{ flex: 1, padding: "7px 0", borderRadius: 999, background: "rgba(201,162,75,0.9)", color: "#2C1E15", fontSize: "0.78rem", fontWeight: 700, border: "none", cursor: "pointer" }}
                >
                  ✏️ تعديل
                </button>
                <button
                  onClick={() => setDelConfirm(p.id)}
                  style={{ padding: "7px 14px", borderRadius: 999, background: "rgba(220,38,38,0.15)", color: "#f87171", fontSize: "0.78rem", fontWeight: 700, border: "1px solid rgba(220,38,38,0.3)", cursor: "pointer" }}
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add new card */}
        <button
          onClick={() => { setIsNew(true); setEditing(makeBlank(paths)); }}
          style={{
            borderRadius: 20, border: "2px dashed rgba(201,162,75,0.25)",
            background: "#F2E8D0",
            minHeight: 260, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 12,
            cursor: "pointer", transition: "all 0.2s", color: "rgba(201,162,75,0.4)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(201,162,75,0.06)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,162,75,0.5)";
            (e.currentTarget as HTMLElement).style.color = "#C9A24B";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(201,162,75,0.03)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,162,75,0.25)";
            (e.currentTarget as HTMLElement).style.color = "rgba(201,162,75,0.4)";
          }}
        >
          <span style={{ fontSize: 36, lineHeight: 1 }}>+</span>
          <span style={{ fontSize: 13, fontWeight: 700 }}>إضافة مسار جديد</span>
        </button>
      </div>

      {/* Count info */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#5A4A3A", fontSize: 12.5, marginBottom: "1.5rem" }}>
        <span>📊</span>
        <span>{paths.length} مسار نشط على الصفحة الرئيسية</span>
        {paths.length > 3 && (
          <span style={{ color: "#C9A24B", marginRight: 8 }}>— الشبكة تتكيف تلقائياً مع العدد</span>
        )}
      </div>

      {/* Edit / Add Modal */}
      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#F2E8D0", borderRadius: 20, padding: "2rem", width: "100%", maxWidth: 720, maxHeight: "92vh", overflowY: "auto", border: "1px solid rgba(154,106,42,0.25)" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
              <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 900, ...GT }}>
                {isNew ? "➕ إضافة مسار جديد" : `✏️ تعديل: ${editing.nameAr}`}
              </h2>
              <button onClick={() => { setEditing(null); setIsNew(false); }} style={{ background: "none", border: "none", color: "#666", fontSize: "1.6rem", cursor: "pointer" }}>×</button>
            </div>

            {/* Key + href */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <label style={{ display: "block", color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, marginBottom: 6 }}>المفتاح (key) — معرّف فريد</label>
                <input style={inp} dir="ltr" value={editing.key} onChange={(e) => up("key", e.target.value)} placeholder="products / configure / custom_key" />
                <FieldHint text="أحرف إنجليزية وأرقام وشُرط سفلية فقط — لا مسافات • مثال: products أو cnc_signs • يُستخدم لتحديد نمط الرسم التلقائي" />
              </div>
              <div>
                <label style={{ display: "block", color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, marginBottom: 6 }}>الرابط (href)</label>
                <select value={HREF_OPTIONS.find(o => o.value === editing.href) ? editing.href : "__custom"} onChange={(e) => { if (e.target.value !== "__custom") up("href", e.target.value); }} style={inp}>
                  {HREF_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  <option value="__custom">رابط مخصص...</option>
                </select>
                {!HREF_OPTIONS.find(o => o.value === editing.href) && (
                  <input style={{ ...inp, marginTop: 6 }} dir="ltr" value={editing.href} onChange={(e) => up("href", e.target.value)} placeholder="/path/to/page" />
                )}
                <FieldHint text="مسار الصفحة التي يُفتح عند الضغط على البطاقة — يبدأ بـ / دائماً" />
              </div>
            </div>

            {/* Names */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700 }}>الاسم (عربي)</label>
                  <CharCount value={editing.nameAr} max={20} />
                </div>
                <input style={inp} value={editing.nameAr} onChange={(e) => up("nameAr", e.target.value)} />
                <FieldHint text="العنوان الرئيسي الظاهر على البطاقة • الحد المثالي: 10-20 حرفاً" />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700 }}>Name (EN)</label>
                  <CharCount value={editing.nameEn} max={20} />
                </div>
                <input style={inp} dir="ltr" value={editing.nameEn} onChange={(e) => up("nameEn", e.target.value)} />
                <FieldHint text="Card title in English • ideal: 2-4 words" />
              </div>
            </div>

            {/* Descriptions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700 }}>الوصف (عربي)</label>
                  <CharCount value={editing.descAr} max={80} />
                </div>
                <textarea style={{ ...inp, resize: "vertical", minHeight: 80 }} value={editing.descAr} onChange={(e) => up("descAr", e.target.value)} />
                <FieldHint text="جملة أو جملتان تشرح المسار • الحد المثالي: 40-80 حرفاً • تظهر تحت العنوان مباشرة" />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700 }}>Description (EN)</label>
                  <CharCount value={editing.descEn} max={80} />
                </div>
                <textarea style={{ ...inp, resize: "vertical", minHeight: 80 }} dir="ltr" value={editing.descEn} onChange={(e) => up("descEn", e.target.value)} />
                <FieldHint text="1-2 sentences describing the path • ideal: 40-80 chars" />
              </div>
            </div>

            {/* CTA */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700 }}>نص الزر (عربي)</label>
                  <CharCount value={editing.ctaAr} max={20} />
                </div>
                <input style={inp} value={editing.ctaAr} onChange={(e) => up("ctaAr", e.target.value)} />
                <FieldHint text="نص دعوة العمل على الزر • أمثلة: استكشف الآن، اطلب تصميم، احسب السعر • حد أقصى 20 حرفاً" />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700 }}>Button text (EN)</label>
                  <CharCount value={editing.ctaEn} max={20} />
                </div>
                <input style={inp} dir="ltr" value={editing.ctaEn} onChange={(e) => up("ctaEn", e.target.value)} />
                <FieldHint text="Call-to-action text • e.g. Explore Now, Get Quote • max 20 chars" />
              </div>
            </div>

            {/* Tags */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700 }}>وسم المسار (عربي)</label>
                  <CharCount value={editing.tagAr} max={15} />
                </div>
                <input style={inp} value={editing.tagAr} onChange={(e) => up("tagAr", e.target.value)} placeholder="المسار الأول" />
                <FieldHint text="الشارة الصغيرة فوق العنوان • أمثلة: المسار الأول، مباشر، للمشاريع الكبرى • حد أقصى 15 حرفاً" />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700 }}>Track tag (EN)</label>
                  <CharCount value={editing.tagEn} max={15} />
                </div>
                <input style={inp} dir="ltr" value={editing.tagEn} onChange={(e) => up("tagEn", e.target.value)} placeholder="Track One" />
                <FieldHint text="Small badge above title • e.g. Track One, Instant, Enterprise • max 15 chars" />
              </div>
            </div>

            {/* Gradient */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, marginBottom: 8 }}>التدرج اللوني</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {GRADIENT_PRESETS.map((g) => (
                  <button key={g.value} onClick={() => up("gradient", g.value)} style={{ borderRadius: 10, border: editing.gradient === g.value ? "2px solid #C9A24B" : "1px solid rgba(201,162,75,0.15)", background: g.value, height: 48, cursor: "pointer", display: "flex", alignItems: "flex-end", padding: "4px 8px" }}>
                    <span style={{ fontSize: 10, color: "#C9A24B", fontWeight: 700 }}>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Image */}
            <div style={{ marginBottom: "1.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                <label style={{ color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700 }}>صورة الخلفية (اختياري)</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { label: "المقاس المثالي", val: "1200 × 800 بكسل" },
                    { label: "نسبة العرض", val: "3:2 أو 16:9" },
                    { label: "الحجم الأقصى", val: "10 MB" },
                    { label: "الصيغ المقبولة", val: "JPG · PNG · WEBP" },
                  ].map((t) => (
                    <span key={t.label} style={{
                      fontSize: "0.67rem", padding: "2px 8px", borderRadius: 6,
                      background: "rgba(201,162,75,0.06)", border: "1px solid rgba(201,162,75,0.15)",
                      color: "#7A6040", lineHeight: 1.8,
                    }}>
                      <span style={{ color: "#C9A24B", fontWeight: 700 }}>{t.label}: </span>{t.val}
                    </span>
                  ))}
                </div>
              </div>
              <ImageUploader value={editing.image} onChange={(url) => up("image", url)} bucket="products" />
              <FieldHint text="الصورة تُعرض كخلفية شبه شفافة خلف التدرج اللوني — يُفضَّل استخدام صور واسعة أفقياً بدقة عالية لتبدو واضحة على الشاشات الكبيرة" />
            </div>

            {/* Mini preview */}
            <div style={{ marginBottom: "1.75rem" }}>
              <label style={{ display: "block", color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, marginBottom: 8 }}>معاينة</label>
              <div style={{ borderRadius: 14, overflow: "hidden", position: "relative", background: editing.gradient, height: 150, border: "1px solid rgba(201,162,75,0.2)" }}>
                {editing.image && <img src={editing.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 100%)" }} />
                <div style={{ position: "absolute", bottom: 16, right: 16, zIndex: 2 }}>
                  <div style={{ display: "inline-block", padding: "2px 10px", borderRadius: 999, background: "rgba(201,162,75,0.1)", border: "1px solid rgba(201,162,75,0.25)", color: "#C9A24B", fontSize: 9, marginBottom: 6 }}>{editing.tagAr}</div>
                  <div style={{ color: "#2C1E15", fontWeight: 900, fontSize: "1rem" }}>{editing.nameAr}</div>
                  <div style={{ color: "#888", fontSize: "0.75rem", marginTop: 3 }}>{editing.ctaAr} ←</div>
                </div>
                <div style={{ position: "absolute", top: 8, left: 12, fontSize: 56, fontWeight: 900, color: "rgba(201,162,75,0.07)", lineHeight: 1 }}>{editing.num}</div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={handleSave} style={{ padding: "0.75rem 2rem", borderRadius: 999, background: G, color: "#2C1E15", fontWeight: 800, border: "none", cursor: "pointer" }}>
                {isNew ? "➕ إضافة" : "💾 حفظ"}
              </button>
              <button onClick={() => { setEditing(null); setIsNew(false); }} style={{ padding: "0.75rem 1.5rem", borderRadius: 999, background: "rgba(201,162,75,0.1)", color: "#C9A24B", fontWeight: 600, border: "1px solid rgba(201,162,75,0.25)", cursor: "pointer" }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
