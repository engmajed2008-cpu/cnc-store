"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { siteStore, DEFAULT_PRODUCTS, DEFAULT_STORE_SUBCATEGORIES, type Product, type StoreSubcategory, type SignImages } from "@/store/siteStore";
const ImageUploader = dynamic(() => import("@/components/admin/ImageUploader"), { ssr: false });

const G  = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

const emptySubcat = (mainKey: string): StoreSubcategory => ({
  id: Date.now(), mainKey, key: "", nameAr: "", nameEn: "", descAr: "", descEn: "", image: null,
});

export default function StoreSubcategoriesPage() {
  const [mainCategories, setMainCategories] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [subcategories, setSubcategories]   = useState<StoreSubcategory[]>([]);
  const [activeMain, setActiveMain]         = useState<string>("");
  const [selected, setSelected]             = useState<StoreSubcategory | null>(null);
  const [isNew, setIsNew]                   = useState(false);
  const [deleteId, setDeleteId]             = useState<number | null>(null);
  const [saved, setSaved]                   = useState(false);
  const [editingMain, setEditingMain]       = useState<Product | null>(null);

  useEffect(() => {
    const cats = siteStore.getStoreCategories();
    const list = cats?.length ? cats as Product[] : DEFAULT_PRODUCTS;
    setMainCategories(list);
    setActiveMain(list[0]?.key ?? "");

    // Merge defaults with saved
    const saved = siteStore.getStoreSubcategories();
    const signImgs: SignImages = siteStore.getSignImages();
    const merged = [...saved];

    DEFAULT_STORE_SUBCATEGORIES.forEach(def => {
      const exists = merged.find(s => s.key === def.key && s.mainKey === def.mainKey);
      if (!exists) {
        // Migrate existing signImages into the subcategory image field
        const migratedImage = def.mainKey === "signs"
          ? (signImgs[def.key as keyof SignImages] ?? null)
          : null;
        merged.push({ ...def, image: migratedImage });
      }
    });

    // Also update existing sign subcategories that have no image but signImages has one
    const finalMerged = merged.map(s => {
      if (s.mainKey === "signs" && !s.image && signImgs[s.key as keyof SignImages]) {
        return { ...s, image: signImgs[s.key as keyof SignImages] };
      }
      return s;
    });

    siteStore.saveStoreSubcategories(finalMerged);
    setSubcategories(finalMerged);
  }, []);

  const filtered = subcategories.filter(s => s.mainKey === activeMain);
  const activeMainData = mainCategories.find(c => c.key === activeMain);

  const save_ = () => {
    if (!selected) return;
    const next = isNew
      ? [...subcategories, selected]
      : subcategories.map(s => s.id === selected.id ? selected : s);
    setSubcategories(next);
    siteStore.saveStoreSubcategories(next);
    setSaved(true); setTimeout(() => setSaved(false), 2500);
    setSelected(null); setIsNew(false);
  };

  const del = (id: number) => {
    const next = subcategories.filter(s => s.id !== id);
    setSubcategories(next);
    siteStore.saveStoreSubcategories(next);
    setDeleteId(null);
  };

  const up = <K extends keyof StoreSubcategory>(f: K, v: StoreSubcategory[K]) =>
    setSelected(s => s ? { ...s, [f]: v } : s);

  const saveMain = () => {
    if (!editingMain) return;
    const next = mainCategories.map(c => c.id === editingMain.id ? editingMain : c);
    setMainCategories(next);
    siteStore.saveStoreCategories(next);
    setSaved(true); setTimeout(() => setSaved(false), 2500);
    setEditingMain(null);
  };

  return (
    <div style={{ padding: "2.5rem", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl" }}>

      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ color: "#C9A24B", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
          لوحة التحكم / إدارة المنتجات
        </div>
        <h1 style={{ fontSize: "1.9rem", fontWeight: 900, margin: 0, ...GT }}>الأقسام الفرعية 🗂️</h1>
        <p style={{ color: "#666", marginTop: "0.4rem", fontSize: "0.85rem" }}>
          أنشئ الأقسام الفرعية لكل قسم رئيسي — ستُستخدم لتصنيف المنتجات
        </p>
      </div>

      {/* Main category tabs */}
      <div style={{
        display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.75rem",
        background: "#F2E8D0", padding: "0.4rem", borderRadius: 12, border: "1px solid rgba(154,106,42,0.25)",
      }}>
        {mainCategories.map(cat => {
          const count = subcategories.filter(s => s.mainKey === cat.key).length;
          const isActive = activeMain === cat.key;
          return (
            <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <button onClick={() => setActiveMain(cat.key)} style={{
                padding: "0.5rem 1rem", borderRadius: 9, border: "none",
                background: isActive ? G : "transparent",
                color: isActive ? "#2C1E15" : "#888",
                fontWeight: isActive ? 700 : 500,
                fontSize: "0.83rem", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
                display: "flex", alignItems: "center", gap: "0.4rem", transition: "all 0.2s",
              }}>
                {cat.nameAr}
                <span style={{
                  padding: "0.1rem 0.45rem", borderRadius: 999, fontSize: "0.68rem",
                  background: isActive ? "rgba(0,0,0,0.2)" : "rgba(201,162,75,0.12)",
                  color: isActive ? "#2C1E15" : "#C9A24B",
                }}>{count}</span>
              </button>
              {/* Edit main category button */}
              <button onClick={() => setEditingMain({ ...cat })} style={{
                width: 26, height: 26, borderRadius: 6, border: "none",
                background: isActive ? "rgba(0,0,0,0.15)" : "rgba(201,162,75,0.08)",
                color: isActive ? "#2C1E15" : "#666",
                cursor: "pointer", fontSize: "0.75rem", display: "flex",
                alignItems: "center", justifyContent: "center",
              }} title="تعديل القسم الرئيسي">✏️</button>
            </div>
          );
        })}
      </div>

      {/* Section header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ width: 4, height: 22, borderRadius: 2, background: G }} />
          <span style={{ fontWeight: 700, color: "#2C1E15" }}>{activeMainData?.nameAr}</span>
          <span style={{ fontSize: "0.75rem", color: "#555" }}>({filtered.length} قسم فرعي)</span>
        </div>
        <button onClick={() => { setSelected(emptySubcat(activeMain)); setIsNew(true); }} style={{
          padding: "0.55rem 1.4rem", borderRadius: 999, background: G, border: "none",
          color: "#2C1E15", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
        }}>+ إضافة قسم فرعي</button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", border: "2px dashed rgba(201,162,75,0.1)", borderRadius: 16, color: "#444" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🗂️</div>
          <div style={{ fontWeight: 600, color: "#666", marginBottom: "0.4rem" }}>لا توجد أقسام فرعية بعد</div>
          <div style={{ fontSize: "0.8rem" }}>اضغط "+ إضافة قسم فرعي" للبدء</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {filtered.map(sub => (
            <div key={sub.id} style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(154,106,42,0.25)", background: "#F2E8D0" }}>
              {/* Image */}
              <div style={{ height: 130, background: activeMainData?.gradient ?? "#F4EFE6", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                {sub.image
                  ? <img src={sub.image} alt={sub.nameAr} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ color: "rgba(201,162,75,0.2)", textAlign: "center" }}>
                      <div style={{ fontSize: "1.8rem" }}>🗂️</div>
                      <div style={{ fontSize: "0.6rem", marginTop: "0.2rem" }}>لا توجد صورة</div>
                    </div>
                }
                {sub.key && (
                  <div style={{
                    position: "absolute", top: 8, right: 8,
                    padding: "0.2rem 0.6rem", borderRadius: 999,
                    background: "rgba(0,0,0,0.65)", border: "1px solid rgba(201,162,75,0.3)",
                    color: "#C9A24B", fontSize: "0.62rem", fontFamily: "monospace", fontWeight: 700,
                  }}>{sub.key}</div>
                )}
              </div>
              <div style={{ padding: "1rem" }}>
                <div style={{ fontWeight: 700, color: "#2C1E15", marginBottom: "0.25rem" }}>{sub.nameAr || "—"}</div>
                <div style={{ fontSize: "0.72rem", color: "#5A3E28", marginBottom: "0.75rem" }}>{sub.nameEn}</div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => { setSelected({ ...sub }); setIsNew(false); }} style={{
                    flex: 1, padding: "0.45rem", borderRadius: 8,
                    background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.2)",
                    color: "#C9A24B", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
                  }}>✏️ تعديل</button>
                  <button onClick={() => setDeleteId(sub.id)} style={{
                    padding: "0.45rem 0.7rem", borderRadius: 8,
                    background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.2)",
                    color: "#e05555", cursor: "pointer",
                  }}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#F2E8D0", border: "1px solid rgba(220,50,50,0.3)", borderRadius: 20, padding: "2rem", width: "min(90vw,340px)", textAlign: "center", fontFamily: "Tajawal, Cairo, sans-serif" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🗑️</div>
            <div style={{ color: "#2C1E15", fontWeight: 700, marginBottom: "0.4rem" }}>حذف القسم الفرعي؟</div>
            <div style={{ color: "#5A3E28", fontSize: "0.8rem", marginBottom: "1.25rem" }}>لن تُحذف المنتجات المرتبطة به</div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button onClick={() => del(deleteId)} style={{ padding: "0.55rem 1.4rem", borderRadius: 999, background: "rgba(220,50,50,0.15)", border: "1px solid rgba(220,50,50,0.4)", color: "#e05555", fontWeight: 700, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>حذف</button>
              <button onClick={() => setDeleteId(null)} style={{ padding: "0.55rem 1.4rem", borderRadius: 999, background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.2)", color: "#C9A24B", fontWeight: 700, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "#F2E8D0", border: "1px solid rgba(154,106,42,0.25)", borderRadius: 20, padding: "2rem", width: "min(95vw,560px)", maxHeight: "92vh", overflowY: "auto", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: "1.1rem", ...GT }}>
                {isNew ? "➕ قسم فرعي جديد" : "✏️ تعديل القسم الفرعي"}
              </h2>
              <button onClick={() => setSelected(null)} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#888", cursor: "pointer" }}>✕</button>
            </div>

            <ImageUploader value={selected.image} onChange={url => up("image", url)}
              folder={`cnc-store/subcats/${selected.mainKey}`} label="🖼️ صورة القسم الفرعي"
              hint="الأبعاد المثالية: 600×400 | خلفية داكنة" />

            {[
              { label: "🔑 المفتاح (key)", field: "key" as keyof StoreSubcategory, hint: "حروف إنجليزية صغيرة بدون مسافات، مثال: outdoor" },
              { label: "🏷️ الاسم (عربي)", field: "nameAr" as keyof StoreSubcategory },
              { label: "🏷️ Name (English)", field: "nameEn" as keyof StoreSubcategory },
              { label: "📝 الوصف (عربي)", field: "descAr" as keyof StoreSubcategory },
              { label: "📝 Description (English)", field: "descEn" as keyof StoreSubcategory },
            ].map(({ label, field, hint }) => (
              <div key={field} style={{ marginBottom: "0.9rem" }}>
                <label style={{ display: "block", color: "#C9A24B", fontSize: "0.77rem", fontWeight: 700, marginBottom: "0.3rem" }}>{label}</label>
                <input value={(selected[field] as string) ?? ""} onChange={e => up(field, e.target.value as StoreSubcategory[typeof field])}
                  style={{ width: "100%", padding: "0.6rem 0.9rem", borderRadius: 10, background: "rgba(0,0,0,0.06)", border: "1px solid rgba(154,106,42,0.25)", color: "#2C1E15", fontSize: "0.88rem", fontFamily: "Tajawal, Cairo, sans-serif", outline: "none", boxSizing: "border-box" }} />
                {hint && <div style={{ fontSize: "0.68rem", color: "#555", marginTop: "0.25rem" }}>{hint}</div>}
              </div>
            ))}

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
              <button onClick={() => setSelected(null)} style={{ padding: "0.65rem 1.4rem", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#888", fontWeight: 600, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>إلغاء</button>
              <button onClick={save_} style={{ padding: "0.65rem 1.75rem", borderRadius: 999, background: G, border: "none", color: "#2C1E15", fontWeight: 700, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>
                {isNew ? "✅ إضافة" : "✅ حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit main category modal */}
      {editingMain && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "#F2E8D0", border: "1px solid rgba(154,106,42,0.25)", borderRadius: 20, padding: "2rem", width: "min(95vw,500px)", maxHeight: "90vh", overflowY: "auto", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: "1.1rem", ...GT }}>✏️ تعديل القسم الرئيسي</h2>
              <button onClick={() => setEditingMain(null)} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#888", cursor: "pointer" }}>✕</button>
            </div>

            <ImageUploader
              value={editingMain.image}
              onChange={url => setEditingMain(prev => prev ? { ...prev, image: url } : prev)}
              folder={`cnc-store/categories/${editingMain.key}`}
              label="🖼️ صورة القسم الرئيسي"
              hint="الأبعاد المثالية: 600×400 | خلفية داكنة"
            />

            {[
              { label: "🏷️ الاسم (عربي)", field: "nameAr" as keyof Product },
              { label: "🏷️ Name (English)", field: "nameEn" as keyof Product },
              { label: "📝 الوصف (عربي)", field: "descAr" as keyof Product },
              { label: "📝 Description (English)", field: "descEn" as keyof Product },
              { label: "🔗 الرابط (href)", field: "href" as keyof Product },
            ].map(({ label, field }) => (
              <div key={field} style={{ marginBottom: "0.85rem" }}>
                <label style={{ display: "block", color: "#C9A24B", fontSize: "0.77rem", fontWeight: 700, marginBottom: "0.3rem" }}>{label}</label>
                <input
                  value={(editingMain[field] as string) ?? ""}
                  onChange={e => setEditingMain(prev => prev ? { ...prev, [field]: e.target.value } : prev)}
                  style={{ width: "100%", padding: "0.6rem 0.9rem", borderRadius: 10, background: "rgba(0,0,0,0.06)", border: "1px solid rgba(154,106,42,0.25)", color: "#2C1E15", fontSize: "0.88rem", fontFamily: "Tajawal, Cairo, sans-serif", outline: "none", boxSizing: "border-box" as const }}
                />
              </div>
            ))}

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
              <button onClick={() => setEditingMain(null)} style={{ padding: "0.65rem 1.4rem", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#888", fontWeight: 600, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>إلغاء</button>
              <button onClick={saveMain} style={{ padding: "0.65rem 1.75rem", borderRadius: 999, background: G, border: "none", color: "#2C1E15", fontWeight: 700, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>✅ حفظ</button>
            </div>
          </div>
        </div>
      )}

      {saved && (
        <div style={{ position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", background: "#0f1f0f", border: "1px solid rgba(100,200,100,0.3)", color: "#6dcc6d", padding: "0.75rem 2rem", borderRadius: 999, fontWeight: 600, zIndex: 9999 }}>
          ✅ تم الحفظ
        </div>
      )}
    </div>
  );
}
