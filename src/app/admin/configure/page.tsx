"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  siteStore,
  DEFAULT_CONFIGURE_CATEGORIES,
  type ConfigureCategory,
} from "@/store/siteStore";

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

const KEY_OPTIONS = ["signs", "banners", "flags", "stickers", "promo", "expo"];

const empty = (): ConfigureCategory => ({
  id: Date.now(),
  key: "signs",
  nameAr: "",
  nameEn: "",
  descAr: "",
  descEn: "",
  badge: "",
  image: null,
  gradient: GRADIENT_PRESETS[0].value,
});

export default function AdminConfigurePage() {
  const [cats, setCats] = useState<ConfigureCategory[]>(DEFAULT_CONFIGURE_CATEGORIES);
  const [selected, setSelected] = useState<ConfigureCategory | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saved, setSaved] = useState(false);
  const [delConfirm, setDelConfirm] = useState<number | null>(null);

  useEffect(() => {
    const stored = siteStore.getConfigureCategories();
    if (stored?.length) setCats(stored);
  }, []);

  const handleSave = () => {
    if (!selected) return;
    const next = isNew
      ? [...cats, selected]
      : cats.map((c) => (c.id === selected.id ? selected : c));
    setCats(next);
    siteStore.saveConfigureCategories(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSelected(null);
    setIsNew(false);
  };

  const handleDelete = (id: number) => {
    const next = cats.filter((c) => c.id !== id);
    setCats(next);
    siteStore.saveConfigureCategories(next);
    setDelConfirm(null);
  };

  const up = <K extends keyof ConfigureCategory>(field: K, val: ConfigureCategory[K]) =>
    setSelected((s) => (s ? { ...s, [field]: val } : s));

  const inp: React.CSSProperties = {
    width: "100%", padding: "0.6rem 0.9rem", borderRadius: 8,
    border: "1px solid rgba(154,106,42,0.25)", background: "#F2E8D0",
    color: "#2C1E15", fontSize: "0.88rem", fontFamily: "Tajawal, Cairo, sans-serif",
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ padding: "2.5rem", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl", minHeight: "100vh", background: "#F4EFE6" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ color: "#C9A24B", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            لوحة التحكم / صمّم وسعّر
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, margin: 0, ...GT }}>إدارة فئات المُعيِّن 🎛️</h1>
          <p style={{ color: "#666", marginTop: "0.5rem", fontSize: "0.9rem" }}>
            تحكم في فئات صفحة «صمّم وسعّر» — الاسم والصورة والتدرج والـ badge
          </p>
        </div>
        <button
          onClick={() => { setSelected(empty()); setIsNew(true); }}
          style={{ padding: "0.75rem 1.75rem", borderRadius: 999, background: G, color: "#2C1E15", fontWeight: 700, fontSize: "0.9rem", border: "none", cursor: "pointer" }}
        >
          + إضافة فئة
        </button>
      </div>

      {/* Success toast */}
      {saved && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999,
          background: G, color: "#2C1E15", padding: "0.75rem 2rem", borderRadius: 999,
          fontWeight: 700, fontSize: "0.9rem", boxShadow: "0 8px 32px rgba(201,162,75,0.4)",
        }}>
          ✓ تم الحفظ وتحديث الموقع
        </div>
      )}

      {/* Category cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        {cats.map((c) => (
          <div
            key={c.id}
            style={{
              borderRadius: 16, overflow: "hidden", position: "relative",
              border: "1px solid rgba(201,162,75,0.15)",
              background: c.gradient || "#F4EFE6",
              minHeight: 180,
            }}
          >
            {/* Image overlay */}
            {c.image && (
              <img src={c.image} alt={c.nameAr}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }}
              />
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 100%)" }} />

            {/* Content */}
            <div style={{ position: "relative", zIndex: 1, padding: "1rem 1.1rem 1rem" }}>
              {/* Badge */}
              {c.badge && (
                <div style={{
                  display: "inline-block", padding: "2px 10px", borderRadius: 999,
                  background: "rgba(201,162,75,0.15)", border: "1px solid rgba(201,162,75,0.3)",
                  color: "#C9A24B", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em",
                  marginBottom: 8,
                }}>
                  {c.badge}
                </div>
              )}
              <div style={{ color: "#2C1E15", fontWeight: 800, fontSize: "1rem", marginBottom: 4 }}>{c.nameAr}</div>
              <div style={{ color: "#888", fontSize: "0.8rem", marginBottom: 4 }}>{c.nameEn}</div>
              <div style={{ color: "#666", fontSize: "0.75rem", lineHeight: 1.5 }}>{c.descAr}</div>
            </div>

            {/* Key chip */}
            <div style={{
              position: "absolute", top: 10, left: 10,
              background: "rgba(0,0,0,0.6)", borderRadius: 6,
              padding: "2px 8px", fontSize: 10, color: "#C9A24B", fontFamily: "monospace",
            }}>
              {c.key}
            </div>

            {/* Actions */}
            <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
              <button
                onClick={() => { setSelected(c); setIsNew(false); }}
                style={{ padding: "4px 12px", borderRadius: 8, background: "rgba(201,162,75,0.9)", color: "#2C1E15", fontSize: "0.78rem", fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                ✏️ تعديل
              </button>
              <button
                onClick={() => setDelConfirm(c.id)}
                style={{ padding: "4px 10px", borderRadius: 8, background: "rgba(220,50,50,0.85)", color: "#fff", fontSize: "0.78rem", border: "none", cursor: "pointer" }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirm */}
      {delConfirm !== null && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ background: "#F2E8D0", borderRadius: 16, padding: "2rem", maxWidth: 360, textAlign: "center", border: "1px solid rgba(154,106,42,0.25)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🗑️</div>
            <p style={{ color: "#2C1E15", marginBottom: "1.5rem", fontWeight: 600 }}>هل تريد حذف هذه الفئة؟</p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                onClick={() => handleDelete(delConfirm)}
                style={{ padding: "0.6rem 1.5rem", borderRadius: 999, background: "#dc3232", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                نعم، احذف
              </button>
              <button
                onClick={() => setDelConfirm(null)}
                style={{ padding: "0.6rem 1.5rem", borderRadius: 999, background: "rgba(201,162,75,0.15)", color: "#C9A24B", fontWeight: 700, border: "1px solid rgba(201,162,75,0.3)", cursor: "pointer" }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      {selected && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }}>
          <div style={{
            background: "#F2E8D0", borderRadius: 20, padding: "2rem",
            width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto",
            border: "1px solid rgba(154,106,42,0.25)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
              <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 900, ...GT }}>
                {isNew ? "إضافة فئة جديدة" : "تعديل الفئة"}
              </h2>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#666", fontSize: "1.4rem", cursor: "pointer" }}>×</button>
            </div>

            {/* Key */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, marginBottom: 6, letterSpacing: "0.08em" }}>
                المفتاح (key) — يحدد نموذج التسعير
              </label>
              <select
                value={selected.key}
                onChange={(e) => up("key", e.target.value)}
                style={{ ...inp }}
              >
                {KEY_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>

            {/* Names */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <label style={{ display: "block", color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, marginBottom: 6 }}>الاسم (عربي)</label>
                <input style={inp} value={selected.nameAr} onChange={(e) => up("nameAr", e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, marginBottom: 6 }}>Name (EN)</label>
                <input style={inp} dir="ltr" value={selected.nameEn} onChange={(e) => up("nameEn", e.target.value)} />
              </div>
            </div>

            {/* Descriptions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <label style={{ display: "block", color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, marginBottom: 6 }}>الوصف (عربي)</label>
                <textarea style={{ ...inp, resize: "vertical", minHeight: 72 }} value={selected.descAr} onChange={(e) => up("descAr", e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, marginBottom: 6 }}>Description (EN)</label>
                <textarea style={{ ...inp, resize: "vertical", minHeight: 72 }} dir="ltr" value={selected.descEn} onChange={(e) => up("descEn", e.target.value)} />
              </div>
            </div>

            {/* Badge */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, marginBottom: 6 }}>
                Badge (النص المميز — مثال: SIGNS)
              </label>
              <input style={inp} dir="ltr" value={selected.badge} onChange={(e) => up("badge", e.target.value.toUpperCase())} placeholder="SIGNS" />
            </div>

            {/* Gradient */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, marginBottom: 8 }}>التدرج اللوني</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {GRADIENT_PRESETS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => up("gradient", g.value)}
                    style={{
                      borderRadius: 10, border: selected.gradient === g.value ? "2px solid #C9A24B" : "1px solid rgba(201,162,75,0.15)",
                      background: g.value, height: 48, cursor: "pointer",
                      display: "flex", alignItems: "flex-end", padding: "4px 8px",
                    }}
                  >
                    <span style={{ fontSize: 10, color: "#C9A24B", fontWeight: 700 }}>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Image */}
            <div style={{ marginBottom: "1.75rem" }}>
              <label style={{ display: "block", color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, marginBottom: 8 }}>
                صورة الخلفية (اختياري — تحل محل النمط SVG)
              </label>
              <ImageUploader
                value={selected.image}
                onChange={(url) => up("image", url)}
                bucket="products"
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-start" }}>
              <button
                onClick={handleSave}
                style={{ padding: "0.75rem 2rem", borderRadius: 999, background: G, color: "#2C1E15", fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                💾 حفظ
              </button>
              <button
                onClick={() => setSelected(null)}
                style={{ padding: "0.75rem 1.5rem", borderRadius: 999, background: "rgba(201,162,75,0.1)", color: "#C9A24B", fontWeight: 600, border: "1px solid rgba(201,162,75,0.25)", cursor: "pointer" }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
