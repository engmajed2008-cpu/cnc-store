"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { siteStore, DEFAULT_PRODUCTS, type Product } from "@/store/siteStore";
const ImageUploader = dynamic(() => import("@/components/admin/ImageUploader"), { ssr: false });

const G  = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

const empty = (): Product => ({
  id: Date.now(), key: "", nameAr: "", nameEn: "",
  descAr: "", descEn: "", href: "", image: null,
  gradient: "linear-gradient(135deg,#FDFBF7 0%,#F4EFE6 100%)",
});

const GRADIENTS = [
  "linear-gradient(135deg,#FDFBF7 0%,#F4EFE6 100%)",
  "linear-gradient(135deg,#0a1218 0%,#0d1a24 100%)",
  "linear-gradient(135deg,#F4EFE6 0%,#1e1a0e 100%)",
  "linear-gradient(135deg,#120810 0%,#1e0f1a 100%)",
  "linear-gradient(135deg,#0d0d14 0%,#14142a 100%)",
  "linear-gradient(135deg,#0a1208 0%,#111e0a 100%)",
];

export default function MainProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [selected, setSelected] = useState<Product | null>(null);
  const [isNew, setIsNew]       = useState(false);
  const [saved, setSaved]       = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    const stored = siteStore.getStoreCategories();
    if (stored?.length) setProducts(stored as Product[]);
  }, []);

  const handleSave = () => {
    if (!selected) return;
    const next = isNew
      ? [...products, selected]
      : products.map(p => p.id === selected.id ? selected : p);
    setProducts(next);
    siteStore.saveStoreCategories(next);
    setSaved(true); setTimeout(() => setSaved(false), 2500);
    setSelected(null); setIsNew(false);
  };

  const handleDelete = (id: number) => {
    const next = products.filter(p => p.id !== id);
    setProducts(next); siteStore.saveStoreCategories(next); setDeleteId(null);
  };

  const up = (field: keyof Product, val: string | null) =>
    setSelected(s => s ? { ...s, [field]: val } : s);

  return (
    <div style={{ padding: "2.5rem", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ color: "#C9A24B", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            لوحة التحكم / إدارة المنتجات / الأقسام الرئيسية
          </div>
          <h1 style={{ fontSize: "1.9rem", fontWeight: 900, margin: 0, ...GT }}>إدارة المنتجات الرئيسية 🗂️</h1>
          <p style={{ color: "#666", marginTop: "0.5rem", fontSize: "0.88rem" }}>
            إدارة أقسام صفحة المنتجات الرئيسية — تظهر في <span style={{ color: "#C9A24B" }}>/products</span>
          </p>
        </div>
        <button onClick={() => { setSelected(empty()); setIsNew(true); }} style={{
          padding: "0.75rem 1.75rem", borderRadius: 999, background: G,
          color: "#2C1E15", fontWeight: 700, fontSize: "0.9rem", border: "none",
          cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif", boxShadow: "0 6px 20px rgba(201,162,75,0.3)",
        }}>+ إضافة قسم</button>
      </div>

      {/* Info banner */}
      <div style={{
        padding: "0.85rem 1.25rem", borderRadius: 12, marginBottom: "2rem",
        background: "rgba(201,162,75,0.06)", border: "1px solid rgba(201,162,75,0.15)",
        display: "flex", alignItems: "center", gap: "0.75rem",
      }}>
        <span style={{ fontSize: "1.1rem" }}>💡</span>
        <span style={{ fontSize: "0.82rem", color: "#999" }}>
          هذه الأقسام تظهر كبطاقات في صفحة المنتجات الرئيسية. كل قسم يحتوي على منتجات فرعية تُدار من صفحة &quot;المنتجات الفرعية&quot;.
        </span>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {products.map(p => (
          <div key={p.id} style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(154,106,42,0.25)", background: "#F2E8D0" }}>
            <div style={{ height: 140, background: p.gradient, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {p.image
                ? <img src={p.image} alt={p.nameAr} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ textAlign: "center", color: "rgba(201,162,75,0.3)" }}>
                    <div style={{ fontSize: "2rem" }}>🗂️</div>
                    <div style={{ fontSize: "0.65rem", marginTop: "0.3rem" }}>لا توجد صورة</div>
                  </div>
              }
              {/* Category key badge */}
              {p.key && (
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  padding: "0.25rem 0.75rem", borderRadius: 999,
                  background: "rgba(0,0,0,0.6)", border: "1px solid rgba(201,162,75,0.3)",
                  color: "#C9A24B", fontSize: "0.65rem", fontFamily: "monospace", fontWeight: 700,
                }}>{p.key.toUpperCase()}</div>
              )}
            </div>
            <div style={{ padding: "1.1rem" }}>
              <div style={{ fontWeight: 700, color: "#2C1E15", marginBottom: "0.3rem" }}>{p.nameAr}</div>
              <div style={{ color: "#5A3E28", fontSize: "0.75rem", lineHeight: 1.5, marginBottom: "0.9rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.descAr}</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => { setSelected({ ...p }); setIsNew(false); }} style={{
                  flex: 1, padding: "0.5rem", borderRadius: 8,
                  background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.2)",
                  color: "#C9A24B", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
                }}>✏️ تعديل</button>
                <button onClick={() => setDeleteId(p.id)} style={{
                  padding: "0.5rem 0.75rem", borderRadius: 8,
                  background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.2)",
                  color: "#e05555", cursor: "pointer",
                }}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirm */}
      {deleteId !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#F2E8D0", border: "1px solid rgba(220,50,50,0.3)", borderRadius: 20, padding: "2rem", width: "min(90vw,360px)", textAlign: "center", fontFamily: "Tajawal, Cairo, sans-serif" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🗑️</div>
            <div style={{ color: "#2C1E15", fontWeight: 700, marginBottom: "0.5rem" }}>حذف القسم؟</div>
            <div style={{ color: "#5A3E28", fontSize: "0.82rem", marginBottom: "1.5rem" }}>سيتم حذف القسم وجميع بياناته</div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button onClick={() => handleDelete(deleteId)} style={{ padding: "0.6rem 1.5rem", borderRadius: 999, background: "rgba(220,50,50,0.15)", border: "1px solid rgba(220,50,50,0.4)", color: "#e05555", fontWeight: 700, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>حذف</button>
              <button onClick={() => setDeleteId(null)} style={{ padding: "0.6rem 1.5rem", borderRadius: 999, background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.2)", color: "#C9A24B", fontWeight: 700, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "#F2E8D0", border: "1px solid rgba(154,106,42,0.25)", borderRadius: 20, padding: "2rem", width: "min(95vw,600px)", maxHeight: "90vh", overflowY: "auto", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: "1.2rem", ...GT }}>
                {isNew ? "➕ إضافة قسم" : "✏️ تعديل القسم"}
              </h2>
              <button onClick={() => setSelected(null)} style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#888", cursor: "pointer" }}>✕</button>
            </div>

            <ImageUploader value={selected.image} onChange={url => up("image", url)}
              folder="cnc-store/products" label="🖼️ صورة القسم"
              hint="الأبعاد المثالية: 600×400 | خلفية داكنة مفضلة" />

            {[
              { label: "🔑 المفتاح (key)", field: "key" as keyof Product, hint: "مثال: signs, banners — يُستخدم للربط مع المنتجات الفرعية" },
              { label: "🏷️ الاسم (عربي)", field: "nameAr" as keyof Product },
              { label: "🏷️ Name (English)", field: "nameEn" as keyof Product },
              { label: "📝 الوصف (عربي)", field: "descAr" as keyof Product },
              { label: "📝 Description (English)", field: "descEn" as keyof Product },
              { label: "🔗 الرابط", field: "href" as keyof Product, hint: "مثال: /configure/signs" },
            ].map(({ label, field, hint }) => (
              <div key={field} style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.35rem" }}>{label}</label>
                <input value={(selected[field] as string) ?? ""} onChange={e => up(field, e.target.value)}
                  style={{ width: "100%", padding: "0.65rem 1rem", borderRadius: 10, background: "rgba(0,0,0,0.06)", border: "1px solid rgba(154,106,42,0.25)", color: "#2C1E15", fontSize: "0.9rem", fontFamily: "Tajawal, Cairo, sans-serif", outline: "none", boxSizing: "border-box" }} />
                {hint && <div style={{ fontSize: "0.7rem", color: "#555", marginTop: "0.3rem" }}>{hint}</div>}
              </div>
            ))}

            {/* Gradient picker */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.5rem" }}>🎨 لون الخلفية</label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {GRADIENTS.map(g => (
                  <button key={g} onClick={() => up("gradient", g)} style={{
                    width: 44, height: 44, borderRadius: 10, background: g, border: "none",
                    cursor: "pointer", outline: selected.gradient === g ? "2px solid #C9A24B" : "none",
                    outlineOffset: 2,
                  }} />
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button onClick={() => setSelected(null)} style={{ padding: "0.7rem 1.5rem", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#888", fontWeight: 600, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>إلغاء</button>
              <button onClick={handleSave} style={{ padding: "0.7rem 2rem", borderRadius: 999, background: G, border: "none", color: "#2C1E15", fontWeight: 700, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>
                {isNew ? "✅ إضافة" : "✅ حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {saved && (
        <div style={{ position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", background: "#0f1f0f", border: "1px solid rgba(100,200,100,0.3)", color: "#6dcc6d", padding: "0.75rem 2rem", borderRadius: 999, fontWeight: 600, zIndex: 9999 }}>
          ✅ تم الحفظ بنجاح
        </div>
      )}
    </div>
  );
}
