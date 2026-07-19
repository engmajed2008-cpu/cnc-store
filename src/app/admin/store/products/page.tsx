"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { siteStore, DEFAULT_PRODUCTS, type Product, type StoreSubcategory, type StoreProduct } from "@/store/siteStore";
const ImageUploader = dynamic(() => import("@/components/admin/ImageUploader"), { ssr: false });

const G  = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };
const UNITS = ["ريال", "SAR", "ريال/م", "ريال/قطعة", "ريال/م²"];
const BADGES = ["", "جديد", "الأكثر طلباً", "عرض خاص", "محدود"];

const emptyProduct = (mainKey: string, subcategoryKey: string): StoreProduct => ({
  id: Date.now(), mainKey, subcategoryKey,
  nameAr: "", nameEn: "", descAr: "", descEn: "",
  price: "", unit: "ريال", image: null, badge: "", available: true,
});

export default function StoreProductsPage() {
  const [mainCategories, setMainCategories]   = useState<Product[]>(DEFAULT_PRODUCTS);
  const [subcategories, setSubcategories]     = useState<StoreSubcategory[]>([]);
  const [products, setProducts]               = useState<StoreProduct[]>([]);
  const [activeMain, setActiveMain]           = useState<string>("");
  const [activeSub, setActiveSub]             = useState<string>("all");
  const [selected, setSelected]               = useState<StoreProduct | null>(null);
  const [isNew, setIsNew]                     = useState(false);
  const [deleteId, setDeleteId]               = useState<number | null>(null);
  const [saved, setSaved]                     = useState(false);

  useEffect(() => {
    const cats = siteStore.getStoreCategories();
    const list = cats?.length ? cats as Product[] : DEFAULT_PRODUCTS;
    setMainCategories(list);
    setActiveMain(list[0]?.key ?? "");
    setSubcategories(siteStore.getStoreSubcategories());
    setProducts(siteStore.getStoreProducts());
  }, []);

  const currentSubs = subcategories.filter(s => s.mainKey === activeMain);
  const filtered = products.filter(p =>
    p.mainKey === activeMain && (activeSub === "all" || p.subcategoryKey === activeSub)
  );
  const activeMainData = mainCategories.find(c => c.key === activeMain);

  const save_ = () => {
    if (!selected) return;
    const next = isNew
      ? [...products, selected]
      : products.map(p => p.id === selected.id ? selected : p);
    setProducts(next);
    siteStore.saveStoreProducts(next);
    setSaved(true); setTimeout(() => setSaved(false), 2500);
    setSelected(null); setIsNew(false);
  };

  const del = (id: number) => {
    const next = products.filter(p => p.id !== id);
    setProducts(next);
    siteStore.saveStoreProducts(next);
    setDeleteId(null);
  };

  const up = <K extends keyof StoreProduct>(f: K, v: StoreProduct[K]) =>
    setSelected(s => s ? { ...s, [f]: v } : s);

  return (
    <div style={{ padding: "2.5rem", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl" }}>

      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ color: "#C9A24B", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
          لوحة التحكم / إدارة المنتجات
        </div>
        <h1 style={{ fontSize: "1.9rem", fontWeight: 900, margin: 0, ...GT }}>المنتجات 📦</h1>
        <p style={{ color: "#666", marginTop: "0.4rem", fontSize: "0.85rem" }}>
          أضف وادر منتجات لكل قسم رئيسي وفرعي
        </p>
      </div>

      {/* Main category tabs */}
      <div style={{
        display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem",
        background: "#F2E8D0", padding: "0.4rem", borderRadius: 12, border: "1px solid rgba(154,106,42,0.25)",
      }}>
        {mainCategories.map(cat => {
          const count = products.filter(p => p.mainKey === cat.key).length;
          return (
            <button key={cat.key} onClick={() => { setActiveMain(cat.key); setActiveSub("all"); }} style={{
              padding: "0.5rem 1rem", borderRadius: 9, border: "none",
              background: activeMain === cat.key ? G : "transparent",
              color: activeMain === cat.key ? "#2C1E15" : "#888",
              fontWeight: activeMain === cat.key ? 700 : 500,
              fontSize: "0.83rem", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
              display: "flex", alignItems: "center", gap: "0.4rem", transition: "all 0.2s",
            }}>
              {cat.nameAr}
              <span style={{
                padding: "0.1rem 0.45rem", borderRadius: 999, fontSize: "0.68rem",
                background: activeMain === cat.key ? "rgba(0,0,0,0.2)" : "rgba(201,162,75,0.12)",
                color: activeMain === cat.key ? "#2C1E15" : "#C9A24B",
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Subcategory filter */}
      {currentSubs.length > 0 && (
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          <button onClick={() => setActiveSub("all")} style={{
            padding: "0.35rem 0.9rem", borderRadius: 999, border: "none", cursor: "pointer",
            background: activeSub === "all" ? "rgba(201,162,75,0.15)" : "rgba(255,255,255,0.04)",
            color: activeSub === "all" ? "#C9A24B" : "#666",
            fontWeight: activeSub === "all" ? 700 : 500, fontSize: "0.78rem", fontFamily: "Tajawal, Cairo, sans-serif",
            outline: activeSub === "all" ? "1px solid rgba(201,162,75,0.3)" : "1px solid transparent",
          }}>الكل ({products.filter(p => p.mainKey === activeMain).length})</button>
          {currentSubs.map(sub => (
            <button key={sub.key} onClick={() => setActiveSub(sub.key)} style={{
              padding: "0.35rem 0.9rem", borderRadius: 999, border: "none", cursor: "pointer",
              background: activeSub === sub.key ? "rgba(201,162,75,0.15)" : "rgba(255,255,255,0.04)",
              color: activeSub === sub.key ? "#C9A24B" : "#666",
              fontWeight: activeSub === sub.key ? 700 : 500, fontSize: "0.78rem", fontFamily: "Tajawal, Cairo, sans-serif",
              outline: activeSub === sub.key ? "1px solid rgba(201,162,75,0.3)" : "1px solid transparent",
            }}>
              {sub.nameAr} ({products.filter(p => p.subcategoryKey === sub.key && p.mainKey === activeMain).length})
            </button>
          ))}
        </div>
      )}

      {/* Section header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ width: 4, height: 22, borderRadius: 2, background: G }} />
          <span style={{ fontWeight: 700, color: "#2C1E15" }}>{activeMainData?.nameAr}</span>
          {activeSub !== "all" && (
            <span style={{ fontSize: "0.75rem", color: "#C9A24B" }}>
              › {currentSubs.find(s => s.key === activeSub)?.nameAr}
            </span>
          )}
          <span style={{ fontSize: "0.75rem", color: "#555" }}>({filtered.length} منتج)</span>
        </div>
        <button onClick={() => {
          setSelected(emptyProduct(activeMain, activeSub === "all" ? (currentSubs[0]?.key ?? "") : activeSub));
          setIsNew(true);
        }} style={{
          padding: "0.55rem 1.4rem", borderRadius: 999, background: G, border: "none",
          color: "#2C1E15", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
        }}>+ إضافة منتج</button>
      </div>

      {/* No subcategories warning */}
      {currentSubs.length === 0 && (
        <div style={{ padding: "0.8rem 1.2rem", borderRadius: 12, marginBottom: "1.25rem", background: "rgba(201,162,75,0.06)", border: "1px solid rgba(201,162,75,0.15)", display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <span>⚠️</span>
          <span style={{ fontSize: "0.82rem", color: "#999" }}>لا توجد أقسام فرعية لهذا القسم — أضف أقساماً فرعية من صفحة "الأقسام الفرعية" أولاً</span>
        </div>
      )}

      {/* Products grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", border: "2px dashed rgba(201,162,75,0.1)", borderRadius: 16, color: "#444" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📦</div>
          <div style={{ fontWeight: 600, color: "#666", marginBottom: "0.4rem" }}>لا توجد منتجات بعد</div>
          <div style={{ fontSize: "0.8rem" }}>اضغط "+ إضافة منتج" للبدء</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
          {filtered.map(prod => {
            const subName = subcategories.find(s => s.key === prod.subcategoryKey)?.nameAr;
            return (
              <div key={prod.id} style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(154,106,42,0.25)", background: "#F2E8D0", position: "relative" }}>
                <div style={{
                  position: "absolute", top: 8, left: 8, zIndex: 2,
                  width: 8, height: 8, borderRadius: "50%",
                  background: prod.available ? "#4ade80" : "#f87171",
                  boxShadow: prod.available ? "0 0 5px #4ade80" : "0 0 5px #f87171",
                }} />
                {prod.badge && (
                  <div style={{ position: "absolute", top: 8, right: 8, zIndex: 2, padding: "0.18rem 0.55rem", borderRadius: 999, background: "rgba(201,162,75,0.9)", color: "#2C1E15", fontSize: "0.62rem", fontWeight: 700 }}>
                    {prod.badge}
                  </div>
                )}
                <div style={{ height: 130, background: activeMainData?.gradient ?? "#F4EFE6", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {prod.image
                    ? <img src={prod.image} alt={prod.nameAr} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ color: "rgba(201,162,75,0.2)", textAlign: "center" }}>
                        <div style={{ fontSize: "1.8rem" }}>📦</div>
                      </div>
                  }
                </div>
                <div style={{ padding: "0.9rem" }}>
                  <div style={{ fontWeight: 700, color: "#2C1E15", marginBottom: "0.2rem", fontSize: "0.9rem" }}>{prod.nameAr || "—"}</div>
                  {subName && <div style={{ fontSize: "0.68rem", color: "#C9A24B", marginBottom: "0.4rem" }}>📂 {subName}</div>}
                  {prod.price && <div style={{ color: "#C9A24B", fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.6rem" }}>{prod.price} {prod.unit}</div>}
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button onClick={() => { setSelected({ ...prod }); setIsNew(false); }} style={{
                      flex: 1, padding: "0.4rem", borderRadius: 8,
                      background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.2)",
                      color: "#C9A24B", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
                    }}>✏️ تعديل</button>
                    <button onClick={() => setDeleteId(prod.id)} style={{
                      padding: "0.4rem 0.65rem", borderRadius: 8,
                      background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.2)",
                      color: "#e05555", cursor: "pointer",
                    }}>🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#F2E8D0", border: "1px solid rgba(220,50,50,0.3)", borderRadius: 20, padding: "2rem", width: "min(90vw,340px)", textAlign: "center", fontFamily: "Tajawal, Cairo, sans-serif" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🗑️</div>
            <div style={{ color: "#2C1E15", fontWeight: 700, marginBottom: "1.25rem" }}>حذف المنتج؟</div>
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
          <div style={{ background: "#F2E8D0", border: "1px solid rgba(154,106,42,0.25)", borderRadius: 20, padding: "2rem", width: "min(95vw,600px)", maxHeight: "92vh", overflowY: "auto", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: "1.1rem", ...GT }}>
                {isNew ? "➕ منتج جديد" : "✏️ تعديل المنتج"}
              </h2>
              <button onClick={() => setSelected(null)} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#888", cursor: "pointer" }}>✕</button>
            </div>

            <ImageUploader value={selected.image} onChange={url => up("image", url)}
              folder={`cnc-store/products/${selected.mainKey}`} label="🖼️ صورة المنتج"
              hint="600×400 | خلفية داكنة" />

            {/* Subcategory selector */}
            <div style={{ marginBottom: "0.9rem" }}>
              <label style={{ display: "block", color: "#C9A24B", fontSize: "0.77rem", fontWeight: 700, marginBottom: "0.3rem" }}>📂 القسم الفرعي</label>
              <select value={selected.subcategoryKey} onChange={e => up("subcategoryKey", e.target.value)}
                style={{ width: "100%", padding: "0.6rem 0.9rem", borderRadius: 10, background: "rgba(0,0,0,0.06)", border: "1px solid rgba(154,106,42,0.25)", color: "#2C1E15", fontSize: "0.88rem", fontFamily: "Tajawal, Cairo, sans-serif", outline: "none" }}>
                <option value="">— اختر القسم الفرعي —</option>
                {currentSubs.map(s => <option key={s.key} value={s.key}>{s.nameAr}</option>)}
              </select>
            </div>

            {/* Fields */}
            {([
              { label: "🏷️ الاسم (عربي)", field: "nameAr" },
              { label: "🏷️ Name (English)", field: "nameEn" },
              { label: "📝 الوصف (عربي)", field: "descAr" },
              { label: "📝 Description (English)", field: "descEn" },
            ] as { label: string; field: keyof StoreProduct }[]).map(({ label, field }) => (
              <div key={field} style={{ marginBottom: "0.9rem" }}>
                <label style={{ display: "block", color: "#C9A24B", fontSize: "0.77rem", fontWeight: 700, marginBottom: "0.3rem" }}>{label}</label>
                <input value={(selected[field] as string) ?? ""} onChange={e => up(field, e.target.value as StoreProduct[typeof field])}
                  style={{ width: "100%", padding: "0.6rem 0.9rem", borderRadius: 10, background: "rgba(0,0,0,0.06)", border: "1px solid rgba(154,106,42,0.25)", color: "#2C1E15", fontSize: "0.88rem", fontFamily: "Tajawal, Cairo, sans-serif", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}

            {/* Price + Unit */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.9rem" }}>
              <div>
                <label style={{ display: "block", color: "#C9A24B", fontSize: "0.77rem", fontWeight: 700, marginBottom: "0.3rem" }}>💰 السعر</label>
                <input value={selected.price} onChange={e => up("price", e.target.value)} placeholder="مثال: 150 أو 150-500"
                  style={{ width: "100%", padding: "0.6rem 0.9rem", borderRadius: 10, background: "rgba(0,0,0,0.06)", border: "1px solid rgba(154,106,42,0.25)", color: "#2C1E15", fontSize: "0.88rem", fontFamily: "Tajawal, Cairo, sans-serif", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", color: "#C9A24B", fontSize: "0.77rem", fontWeight: 700, marginBottom: "0.3rem" }}>📏 الوحدة</label>
                <select value={selected.unit} onChange={e => up("unit", e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.9rem", borderRadius: 10, background: "rgba(0,0,0,0.06)", border: "1px solid rgba(154,106,42,0.25)", color: "#2C1E15", fontSize: "0.88rem", fontFamily: "Tajawal, Cairo, sans-serif", outline: "none" }}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Badge */}
            <div style={{ marginBottom: "0.9rem" }}>
              <label style={{ display: "block", color: "#C9A24B", fontSize: "0.77rem", fontWeight: 700, marginBottom: "0.4rem" }}>🏅 الشارة</label>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {BADGES.map(b => (
                  <button key={b} onClick={() => up("badge", b)} style={{
                    padding: "0.3rem 0.85rem", borderRadius: 999, border: "none", cursor: "pointer",
                    background: selected.badge === b ? G : "rgba(255,255,255,0.05)",
                    color: selected.badge === b ? "#2C1E15" : "#888",
                    fontFamily: "Tajawal, Cairo, sans-serif", fontSize: "0.8rem",
                  }}>{b || "بدون"}</button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button onClick={() => up("available", !selected.available)} style={{
                width: 42, height: 22, borderRadius: 999, border: "none", cursor: "pointer",
                background: selected.available ? "#4ade80" : "rgba(255,255,255,0.1)",
                position: "relative", transition: "background 0.2s", flexShrink: 0,
              }}>
                <div style={{
                  position: "absolute", top: 2, right: selected.available ? 2 : "calc(100% - 20px)",
                  width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "right 0.2s",
                }} />
              </button>
              <span style={{ color: selected.available ? "#4ade80" : "#666", fontSize: "0.83rem" }}>
                {selected.available ? "متاح للطلب" : "غير متاح"}
              </span>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setSelected(null)} style={{ padding: "0.65rem 1.4rem", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#888", fontWeight: 600, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>إلغاء</button>
              <button onClick={save_} style={{ padding: "0.65rem 1.75rem", borderRadius: 999, background: G, border: "none", color: "#2C1E15", fontWeight: 700, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>
                {isNew ? "✅ إضافة" : "✅ حفظ"}
              </button>
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
