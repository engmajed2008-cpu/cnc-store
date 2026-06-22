"use client";
import { useState, useEffect } from "react";

const GOLD = "#C9A24B";
const G = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

const ALL_COLORS = ["gold", "silver", "white", "black", "red", "blue", "green", "copper"] as const;
const COLOR_LABELS: Record<string, string> = {
  gold: "ذهبي", silver: "فضي", white: "أبيض", black: "أسود",
  red: "أحمر", blue: "أزرق", green: "أخضر", copper: "نحاسي",
};
const COLOR_HEX: Record<string, string> = {
  gold: "#C9A24B", silver: "#D4D4D4", white: "#F5F5F5", black: "#141414",
  red: "#C0392B", blue: "#1F4E8C", green: "#1F7A4D", copper: "#B06A3B",
};

type LetterType = {
  id: string; slug: string; nameAr: string; nameEn: string; tagAr: string;
  faceMaterial: string; sideMaterial: string; lighting: string;
  rateMultiplier: number; gradientCss: string; availableColors: string[];
  colorful: boolean; isActive: boolean; sortOrder: number;
};
type SideStyle = {
  id: string; slug: string; nameAr: string; nameEn: string; descriptionAr: string;
  svgPatternId: string; priceAddPercent: number; metalOnly: boolean;
  isActive: boolean; sortOrder: number;
};

const EMPTY_LT: Omit<LetterType, "id" | "isActive"> = {
  slug: "", nameAr: "", nameEn: "", tagAr: "",
  faceMaterial: "acrylic", sideMaterial: "acrylic", lighting: "none",
  rateMultiplier: 1, gradientCss: "", availableColors: ["gold", "silver", "white", "black"],
  colorful: true, sortOrder: 0,
};
const EMPTY_SS: Omit<SideStyle, "id" | "isActive"> = {
  slug: "", nameAr: "", nameEn: "", descriptionAr: "",
  svgPatternId: "", priceAddPercent: 0, metalOnly: true, sortOrder: 0,
};

const LIGHTING_LABELS: Record<string, string> = { front: "أمامية", back: "خلفية", both: "مزدوجة", none: "بدون" };
const MAT_LABELS: Record<string, string> = { acrylic: "أكريليك", stainless: "إستانلس", zincor: "زنكور", aluminum: "ألومنيوم" };

function badge(v: boolean) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 12,
      fontSize: "0.7rem", fontWeight: 700,
      background: v ? "rgba(46,122,62,0.12)" : "rgba(180,50,50,0.1)",
      color: v ? "#2E7A3E" : "#B43232",
    }}>{v ? "نشط" : "موقوف"}</span>
  );
}

const inp: React.CSSProperties = {
  width: "100%", padding: "0.4rem 0.6rem", borderRadius: 7,
  border: "1px solid rgba(201,162,75,0.3)", fontFamily: "Cairo,sans-serif",
  fontSize: "0.8rem", boxSizing: "border-box",
};
const sel: React.CSSProperties = { ...inp };
const fldLabel: React.CSSProperties = { fontSize: "0.68rem", color: "#634E40", marginBottom: 3 };
const card: React.CSSProperties = {
  background: "#F4EFE6", borderRadius: 12,
  border: "1px solid rgba(201,162,75,0.2)",
  padding: "1.1rem 1.25rem", marginBottom: "0.75rem",
};
const grid2: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem",
};

/* مُعدِّل الألوان المتاحة — checkboxes ملوّنة */
function ColorsEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (c: string) =>
    onChange(value.includes(c) ? value.filter(x => x !== c) : [...value, c]);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: 4 }}>
      {ALL_COLORS.map(c => {
        const on = value.includes(c);
        return (
          <button key={c} type="button" onClick={() => toggle(c)} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "3px 8px 3px 5px",
            borderRadius: 20, cursor: "pointer", border: `2px solid ${on ? GOLD : "rgba(201,162,75,0.25)"}`,
            background: on ? "rgba(201,162,75,0.1)" : "#FDFBF7",
            fontSize: "0.68rem", fontWeight: 700, color: on ? "#2C1E15" : "#8A7A66",
            transition: "all 0.15s",
          }}>
            <span style={{ width: 14, height: 14, borderRadius: "50%", background: COLOR_HEX[c], border: "1px solid rgba(0,0,0,0.12)", flexShrink: 0 }} />
            {COLOR_LABELS[c]}
          </button>
        );
      })}
    </div>
  );
}

/* نموذج نوع حرف (مشترك بين الإنشاء والتعديل) */
function LTForm({
  data, onChange, onSave, onCancel, saving, isNew,
}: {
  data: Omit<LetterType, "id" | "isActive">; onChange: (p: Partial<typeof data>) => void;
  onSave: () => void; onCancel: () => void; saving: boolean; isNew?: boolean;
}) {
  return (
    <div>
      <div style={{ fontWeight: 900, color: "#2C1E15", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
        {isNew ? "➕ إضافة نوع حرف جديد" : `تعديل: ${(data as LetterType).slug ?? ""}`}
      </div>
      <div style={grid2}>
        {isNew && (
          <div style={{ gridColumn: "1/-1" }}>
            <div style={fldLabel}>Slug (معرّف فريد — أحرف إنجليزية وأرقام وشرطة)</div>
            <input value={(data as LetterType).slug ?? ""} onChange={e => onChange({ slug: e.target.value } as PartialLT)}
              placeholder="acrylic-aluminum" style={inp} dir="ltr" />
          </div>
        )}
        <div>
          <div style={fldLabel}>الاسم بالعربية</div>
          <input value={data.nameAr} onChange={e => onChange({ nameAr: e.target.value })} style={inp} />
        </div>
        <div>
          <div style={fldLabel}>الاسم بالإنجليزية</div>
          <input value={data.nameEn} onChange={e => onChange({ nameEn: e.target.value })} style={inp} dir="ltr" />
        </div>
        <div>
          <div style={fldLabel}>التاج / الوسم (tagAr)</div>
          <input value={data.tagAr} onChange={e => onChange({ tagAr: e.target.value })} placeholder="الأكثر مبيعاً" style={inp} />
        </div>
        <div>
          <div style={fldLabel}>معامل السعر</div>
          <input type="number" step="0.05" min="0.1" value={data.rateMultiplier}
            onChange={e => onChange({ rateMultiplier: parseFloat(e.target.value) || 1 })} style={inp} dir="ltr" />
        </div>
        <div>
          <div style={fldLabel}>خامة الوجه</div>
          <select value={data.faceMaterial} onChange={e => onChange({ faceMaterial: e.target.value })} style={sel}>
            {Object.entries(MAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <div style={fldLabel}>خامة الجوانب</div>
          <select value={data.sideMaterial} onChange={e => onChange({ sideMaterial: e.target.value })} style={sel}>
            {Object.entries(MAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <div style={fldLabel}>الإضاءة الافتراضية</div>
          <select value={data.lighting} onChange={e => onChange({ lighting: e.target.value })} style={sel}>
            {Object.entries(LIGHTING_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <div style={fldLabel}>الترتيب</div>
          <input type="number" value={data.sortOrder} onChange={e => onChange({ sortOrder: parseInt(e.target.value) || 0 })} style={inp} dir="ltr" />
        </div>
      </div>

      {/* CSS Gradient */}
      <div style={{ marginBottom: "0.5rem" }}>
        <div style={fldLabel}>CSS Gradient (للمعاينة في القائمة)</div>
        <input value={data.gradientCss} onChange={e => onChange({ gradientCss: e.target.value })}
          placeholder="linear-gradient(135deg,#888,#aaa)" style={{ ...inp, fontFamily: "monospace", fontSize: "0.75rem" }} dir="ltr" />
        {data.gradientCss && <div style={{ height: 22, borderRadius: 6, marginTop: 4, background: data.gradientCss }} />}
      </div>

      {/* الألوان المتاحة */}
      <div style={{ marginBottom: "0.5rem" }}>
        <div style={fldLabel}>الألوان المتاحة لهذه الخامة</div>
        <ColorsEditor value={data.availableColors} onChange={v => onChange({ availableColors: v })} />
      </div>

      {/* colorful toggle */}
      <label style={{
        display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
        padding: "0.35rem 0.7rem", borderRadius: 8, marginBottom: "0.6rem",
        background: data.colorful ? "rgba(201,162,75,0.08)" : "#F4EFE6",
        border: `1px solid ${data.colorful ? "rgba(201,162,75,0.35)" : "rgba(201,162,75,0.15)"}`,
      }}>
        <input type="checkbox" checked={data.colorful} onChange={e => onChange({ colorful: e.target.checked })}
          style={{ accentColor: GOLD, width: 16, height: 16 }} />
        <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#2C1E15" }}>يدعم ألواناً مخصصة (colorful)</span>
        <span style={{ fontSize: "0.62rem", color: "#634E40" }}>يُظهر منتقي اللون الحر للعميل</span>
      </label>

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
        <button onClick={onSave} disabled={saving}
          style={{ padding: "0.5rem 1.3rem", borderRadius: 8, border: "none", background: GOLD, color: "#2C1E15", fontWeight: 800, cursor: "pointer", fontFamily: "Cairo,sans-serif" }}>
          {saving ? "جارٍ الحفظ..." : isNew ? "إنشاء ✓" : "حفظ ✓"}
        </button>
        <button onClick={onCancel}
          style={{ padding: "0.5rem 1rem", borderRadius: 8, border: "1px solid rgba(154,106,42,0.3)", background: "transparent", color: "#634E40", cursor: "pointer", fontFamily: "Cairo,sans-serif" }}>
          إلغاء
        </button>
      </div>
    </div>
  );
}
type PartialLT = Partial<Omit<LetterType, "id" | "isActive">>;

/* نموذج نمط جانب */
function SSForm({
  data, onChange, onSave, onCancel, saving, isNew,
}: {
  data: Omit<SideStyle, "id" | "isActive">; onChange: (p: Partial<typeof data>) => void;
  onSave: () => void; onCancel: () => void; saving: boolean; isNew?: boolean;
}) {
  return (
    <div>
      <div style={{ fontWeight: 900, color: "#2C1E15", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
        {isNew ? "➕ إضافة نمط جانب جديد" : `تعديل: ${(data as SideStyle).slug ?? ""}`}
      </div>
      <div style={grid2}>
        {isNew && (
          <div style={{ gridColumn: "1/-1" }}>
            <div style={fldLabel}>Slug (معرّف فريد)</div>
            <input value={(data as SideStyle).slug ?? ""} onChange={e => onChange({ slug: e.target.value } as Partial<typeof data>)}
              placeholder="dots" style={inp} dir="ltr" />
          </div>
        )}
        <div>
          <div style={fldLabel}>الاسم بالعربية</div>
          <input value={data.nameAr} onChange={e => onChange({ nameAr: e.target.value })} style={inp} />
        </div>
        <div>
          <div style={fldLabel}>الاسم بالإنجليزية</div>
          <input value={data.nameEn} onChange={e => onChange({ nameEn: e.target.value })} style={inp} dir="ltr" />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <div style={fldLabel}>الوصف بالعربية</div>
          <input value={data.descriptionAr} onChange={e => onChange({ descriptionAr: e.target.value })} style={inp} />
        </div>
        <div>
          <div style={fldLabel}>نسبة الزيادة في السعر (%)</div>
          <input type="number" step="1" min="0" value={data.priceAddPercent}
            onChange={e => onChange({ priceAddPercent: parseFloat(e.target.value) || 0 })} style={inp} dir="ltr" />
        </div>
        <div>
          <div style={fldLabel}>معرّف النمط SVG (svgPatternId)</div>
          <input value={data.svgPatternId} onChange={e => onChange({ svgPatternId: e.target.value })}
            placeholder="dots" style={inp} dir="ltr" />
        </div>
        <div>
          <div style={fldLabel}>الترتيب</div>
          <input type="number" value={data.sortOrder} onChange={e => onChange({ sortOrder: parseInt(e.target.value) || 0 })} style={inp} dir="ltr" />
        </div>
      </div>

      <label style={{
        display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
        padding: "0.35rem 0.7rem", borderRadius: 8, marginBottom: "0.6rem",
        background: data.metalOnly ? "rgba(201,162,75,0.08)" : "#F4EFE6",
        border: `1px solid ${data.metalOnly ? "rgba(201,162,75,0.35)" : "rgba(201,162,75,0.15)"}`,
      }}>
        <input type="checkbox" checked={data.metalOnly} onChange={e => onChange({ metalOnly: e.target.checked })}
          style={{ accentColor: GOLD, width: 16, height: 16 }} />
        <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#2C1E15" }}>للجوانب المعدنية فقط (metalOnly)</span>
        <span style={{ fontSize: "0.62rem", color: "#634E40" }}>لا يظهر مع الأكريليك</span>
      </label>

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
        <button onClick={onSave} disabled={saving}
          style={{ padding: "0.5rem 1.3rem", borderRadius: 8, border: "none", background: GOLD, color: "#2C1E15", fontWeight: 800, cursor: "pointer", fontFamily: "Cairo,sans-serif" }}>
          {saving ? "جارٍ الحفظ..." : isNew ? "إنشاء ✓" : "حفظ ✓"}
        </button>
        <button onClick={onCancel}
          style={{ padding: "0.5rem 1rem", borderRadius: 8, border: "1px solid rgba(154,106,42,0.3)", background: "transparent", color: "#634E40", cursor: "pointer", fontFamily: "Cairo,sans-serif" }}>
          إلغاء
        </button>
      </div>
    </div>
  );
}

export default function MaterialsAdminPage() {
  const [tab,        setTab]        = useState<"letters" | "sides">("letters");
  const [letterTypes, setLetterTypes] = useState<LetterType[]>([]);
  const [sideStyles,  setSideStyles]  = useState<SideStyle[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [editLT,     setEditLT]     = useState<LetterType | null>(null);
  const [editSS,     setEditSS]     = useState<SideStyle | null>(null);
  const [newLT,      setNewLT]      = useState<Omit<LetterType, "id"|"isActive"> | null>(null);
  const [newSS,      setNewSS]      = useState<Omit<SideStyle, "id"|"isActive"> | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState("");

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3500); };

  async function load() {
    setLoading(true);
    const [lt, ss] = await Promise.all([
      fetch("/api/admin/letter-types", { credentials: "include" }).then(r => r.json()),
      fetch("/api/admin/side-styles",  { credentials: "include" }).then(r => r.json()),
    ]);
    setLetterTypes(lt.letterTypes ?? []);
    setSideStyles(ss.sideStyles   ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  /* --- Toggle active --- */
  async function toggleLT(lt: LetterType) {
    await fetch(`/api/admin/letter-types/${lt.id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !lt.isActive }),
    });
    load(); flash(lt.isActive ? "تم الإيقاف" : "تم التفعيل");
  }
  async function toggleSS(ss: SideStyle) {
    await fetch(`/api/admin/side-styles/${ss.id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !ss.isActive }),
    });
    load(); flash(ss.isActive ? "تم الإيقاف" : "تم التفعيل");
  }

  /* --- Save edit --- */
  async function saveLT() {
    if (!editLT) return;
    setSaving(true);
    const { id, isActive, ...body } = editLT;
    const res = await fetch(`/api/admin/letter-types/${id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) { setEditLT(null); load(); flash("تم الحفظ ✓"); }
    else flash("حدث خطأ — تحقق من البيانات");
  }
  async function saveSS() {
    if (!editSS) return;
    setSaving(true);
    const { id, isActive, ...body } = editSS;
    const res = await fetch(`/api/admin/side-styles/${id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) { setEditSS(null); load(); flash("تم الحفظ ✓"); }
    else flash("حدث خطأ — تحقق من البيانات");
  }

  /* --- Create new --- */
  async function createLT() {
    if (!newLT) return;
    setSaving(true);
    const res = await fetch("/api/admin/letter-types", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLT),
    });
    setSaving(false);
    if (res.ok) { setNewLT(null); load(); flash("تم إنشاء نوع الحرف ✓"); }
    else {
      const err = await res.json().catch(() => ({}));
      flash("خطأ: " + (err.error?.fieldErrors ? JSON.stringify(err.error.fieldErrors) : "تحقق من البيانات"));
    }
  }
  async function createSS() {
    if (!newSS) return;
    setSaving(true);
    const res = await fetch("/api/admin/side-styles", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSS),
    });
    setSaving(false);
    if (res.ok) { setNewSS(null); load(); flash("تم إنشاء نمط الجانب ✓"); }
    else {
      const err = await res.json().catch(() => ({}));
      flash("خطأ: " + (err.error?.fieldErrors ? JSON.stringify(err.error.fieldErrors) : "تحقق من البيانات"));
    }
  }

  const sideIcon = (slug: string) =>
    ({ solid: "▬", dots: "⁞", slots: "☰", squares: "▦", diamonds: "◆" } as Record<string,string>)[slug] ?? "✦";

  return (
    <div style={{ padding: "2.5rem", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl", maxWidth: 960 }}>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ color: GOLD, fontSize: "0.7rem", letterSpacing: "0.2em", marginBottom: "0.4rem" }}>
          لوحة التحكم / إدارة المنتجات / خامات الحروف البارزة
        </div>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 900, margin: 0, ...GT }}>خامات الحروف البارزة 🔩</h1>
        <p style={{ color: "#634E40", marginTop: "0.4rem", fontSize: "0.88rem" }}>
          أدِر أنواع الحروف (وجه + جوانب + إضاءة) وأنماط التخريم — تظهر مباشرة في أداة التصميم للعملاء
        </p>
      </div>

      {msg && (
        <div style={{
          padding: "0.6rem 1rem", borderRadius: 8, marginBottom: "1rem", fontSize: "0.85rem", fontWeight: 700,
          background: msg.startsWith("خطأ") ? "rgba(180,50,50,0.1)" : "rgba(46,122,62,0.12)",
          color: msg.startsWith("خطأ") ? "#B43232" : "#2E7A3E",
        }}>{msg}</div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {([["letters","أنواع الحروف","🔩"], ["sides","أنماط الجوانب","✨"]] as const).map(([t, label, icon]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "0.55rem 1.2rem", borderRadius: 10, cursor: "pointer",
            fontFamily: "Tajawal,Cairo,sans-serif", fontWeight: 800, fontSize: "0.82rem",
            border: `1.5px solid ${tab === t ? GOLD : "rgba(201,162,75,0.2)"}`,
            background: tab === t ? "rgba(201,162,75,0.12)" : "#F4EFE6",
            color: tab === t ? "#2C1E15" : "#634E40",
          }}>{icon} {label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "#634E40", fontSize: "0.9rem", padding: "2rem 0" }}>جارٍ التحميل...</div>
      ) : tab === "letters" ? (
        <>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.78rem", color: "#634E40" }}>
              {letterTypes.length} نوع • النشطة تظهر في قائمة اختيار الخامة
            </div>
            {!newLT && (
              <button onClick={() => { setEditLT(null); setNewLT({ ...EMPTY_LT }); }} style={{
                padding: "0.45rem 1rem", borderRadius: 9, cursor: "pointer",
                fontFamily: "Tajawal,Cairo,sans-serif", fontWeight: 800, fontSize: "0.8rem",
                border: `1.5px solid ${GOLD}`, background: "rgba(201,162,75,0.1)", color: "#2C1E15",
              }}>+ إضافة نوع جديد</button>
            )}
          </div>

          {/* New form */}
          {newLT && (
            <div style={{ ...card, border: `2px solid ${GOLD}`, background: "rgba(201,162,75,0.04)" }}>
              <LTForm
                data={newLT}
                onChange={p => setNewLT(prev => prev && ({ ...prev, ...p }))}
                onSave={createLT}
                onCancel={() => setNewLT(null)}
                saving={saving}
                isNew
              />
            </div>
          )}

          {/* List */}
          {letterTypes.map(lt => (
            <div key={lt.id} style={card}>
              {editLT?.id === lt.id ? (
                <LTForm
                  data={editLT}
                  onChange={p => setEditLT(prev => prev && ({ ...prev, ...p } as LetterType))}
                  onSave={saveLT}
                  onCancel={() => setEditLT(null)}
                  saving={saving}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: 56, height: 40, borderRadius: 8, flexShrink: 0, background: lt.gradientCss || "#888" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 800, color: "#2C1E15", fontSize: "0.88rem" }}>{lt.nameAr}</span>
                      {lt.tagAr && (
                        <span style={{ fontSize: "0.65rem", color: GOLD, background: "rgba(201,162,75,0.1)", padding: "1px 7px", borderRadius: 10 }}>{lt.tagAr}</span>
                      )}
                      {badge(lt.isActive)}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#634E40", marginTop: 2 }}>
                      وجه: <b>{MAT_LABELS[lt.faceMaterial]}</b> · جوانب: <b>{MAT_LABELS[lt.sideMaterial]}</b> · إضاءة: <b>{LIGHTING_LABELS[lt.lighting]}</b> · معامل: <b>×{lt.rateMultiplier}</b>
                    </div>
                    <div style={{ display: "flex", gap: "0.3rem", marginTop: 4, flexWrap: "wrap" }}>
                      {lt.availableColors.map(c => (
                        <span key={c} style={{
                          display: "inline-flex", alignItems: "center", gap: 3,
                          fontSize: "0.6rem", color: "#634E40", background: "#FDFBF7",
                          border: "1px solid rgba(201,162,75,0.2)", borderRadius: 10, padding: "1px 6px",
                        }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLOR_HEX[c] }} />
                          {COLOR_LABELS[c]}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "#9A8070", marginTop: 2, fontFamily: "monospace" }}>
                      {lt.slug} {lt.colorful ? "· ألوان حرة ✓" : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0, flexDirection: "column" }}>
                    <button onClick={() => { setNewLT(null); setEditLT(lt); }} style={{
                      padding: "0.35rem 0.75rem", borderRadius: 7, border: `1px solid ${GOLD}`,
                      background: "transparent", color: GOLD, cursor: "pointer", fontSize: "0.75rem", fontWeight: 700,
                    }}>تعديل</button>
                    <button onClick={() => toggleLT(lt)} style={{
                      padding: "0.35rem 0.75rem", borderRadius: 7,
                      border: `1px solid ${lt.isActive ? "#B43232" : "#2E7A3E"}`,
                      background: "transparent", color: lt.isActive ? "#B43232" : "#2E7A3E",
                      cursor: "pointer", fontSize: "0.75rem", fontWeight: 700,
                    }}>{lt.isActive ? "إيقاف" : "تفعيل"}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.78rem", color: "#634E40" }}>
              {sideStyles.length} نمط • أنماط التخريم تتيح إشعاع الضوء من جوانب الحروف المعدنية
            </div>
            {!newSS && (
              <button onClick={() => { setEditSS(null); setNewSS({ ...EMPTY_SS }); }} style={{
                padding: "0.45rem 1rem", borderRadius: 9, cursor: "pointer",
                fontFamily: "Tajawal,Cairo,sans-serif", fontWeight: 800, fontSize: "0.8rem",
                border: `1.5px solid ${GOLD}`, background: "rgba(201,162,75,0.1)", color: "#2C1E15",
              }}>+ إضافة نمط جديد</button>
            )}
          </div>

          {newSS && (
            <div style={{ ...card, border: `2px solid ${GOLD}`, background: "rgba(201,162,75,0.04)" }}>
              <SSForm
                data={newSS}
                onChange={p => setNewSS(prev => prev && ({ ...prev, ...p }))}
                onSave={createSS}
                onCancel={() => setNewSS(null)}
                saving={saving}
                isNew
              />
            </div>
          )}

          {sideStyles.map(ss => (
            <div key={ss.id} style={card}>
              {editSS?.id === ss.id ? (
                <SSForm
                  data={editSS}
                  onChange={p => setEditSS(prev => prev && ({ ...prev, ...p } as SideStyle))}
                  onSave={saveSS}
                  onCancel={() => setEditSS(null)}
                  saving={saving}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ fontSize: "1.6rem", flexShrink: 0, width: 40, textAlign: "center" }}>
                    {sideIcon(ss.slug)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 800, color: "#2C1E15", fontSize: "0.88rem" }}>{ss.nameAr}</span>
                      {ss.priceAddPercent > 0 && (
                        <span style={{ fontSize: "0.65rem", color: "#B07820", background: "rgba(176,120,32,0.1)", padding: "1px 7px", borderRadius: 10 }}>+{ss.priceAddPercent}%</span>
                      )}
                      {ss.metalOnly && <span style={{ fontSize: "0.6rem", color: "#634E40", background: "rgba(154,106,42,0.08)", padding: "1px 7px", borderRadius: 10 }}>معادن فقط</span>}
                      {badge(ss.isActive)}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#634E40", marginTop: 2 }}>{ss.descriptionAr}</div>
                    <div style={{ fontSize: "0.65rem", color: "#9A8070", marginTop: 2, fontFamily: "monospace" }}>{ss.slug}</div>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0, flexDirection: "column" }}>
                    <button onClick={() => { setNewSS(null); setEditSS(ss); }} style={{
                      padding: "0.35rem 0.75rem", borderRadius: 7, border: `1px solid ${GOLD}`,
                      background: "transparent", color: GOLD, cursor: "pointer", fontSize: "0.75rem", fontWeight: 700,
                    }}>تعديل</button>
                    <button onClick={() => toggleSS(ss)} style={{
                      padding: "0.35rem 0.75rem", borderRadius: 7,
                      border: `1px solid ${ss.isActive ? "#B43232" : "#2E7A3E"}`,
                      background: "transparent", color: ss.isActive ? "#B43232" : "#2E7A3E",
                      cursor: "pointer", fontSize: "0.75rem", fontWeight: 700,
                    }}>{ss.isActive ? "إيقاف" : "تفعيل"}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
