"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { siteStore } from "@/store/siteStore";
const ImageUploader = dynamic(() => import("@/components/admin/ImageUploader"), { ssr: false });

const G = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

type Product = {
  id: number;
  key: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  href: string;
  image: string | null;
  gradient: string;
};

const defaultProducts: Product[] = [
  { id: 1, key: "signs", nameAr: "اللوحات", nameEn: "Signs", descAr: "لافتات ولوحات معدنية بتصاميم مخصصة واحترافية تعكس هويتك التجارية", descEn: "Custom metal signs and boards with professional designs reflecting your brand identity", href: "/configure/signs", image: null, gradient: "linear-gradient(135deg,#FDFBF7 0%,#F4EFE6 100%)" },
  { id: 2, key: "banners", nameAr: "البنرات", nameEn: "Banners", descAr: "بنرات عالية الجودة للمعارض والفعاليات والإعلانات الخارجية", descEn: "High-quality banners for exhibitions, events, and outdoor advertising", href: "/products/banners", image: null, gradient: "linear-gradient(135deg,#0a1218 0%,#0d1a24 100%)" },
  { id: 3, key: "flags", nameAr: "الأعلام", nameEn: "Flags", descAr: "أعلام ترويجية بأشكال متعددة مناسبة للمعارض والمداخل", descEn: "Promotional flags in multiple shapes suitable for exhibitions and entrances", href: "/products/flags", image: null, gradient: "linear-gradient(135deg,#F4EFE6 0%,#1e1a0e 100%)" },
  { id: 4, key: "stickers", nameAr: "الملصقات", nameEn: "Stickers", descAr: "ملصقات فينيل عالية الجودة للسيارات والواجهات والمتاجر", descEn: "High-quality vinyl stickers for vehicles, facades, and stores", href: "/products/stickers", image: null, gradient: "linear-gradient(135deg,#120810 0%,#1e0f1a 100%)" },
  { id: 5, key: "promotional", nameAr: "منتجات العروض الترويجية", nameEn: "Promotional Products", descAr: "هدايا دعائية ومطبوعات ترويجية تُعزز حضور علامتك التجارية", descEn: "Promotional gifts and prints that enhance your brand presence", href: "/products/promotional", image: null, gradient: "linear-gradient(135deg,#0d0d14 0%,#14142a 100%)" },
  { id: 6, key: "tradeshow", nameAr: "العروض", nameEn: "Tradeshow", descAr: "حلول متكاملة للمعارض والمؤتمرات من بنرات وأكشاك وديكورات", descEn: "Complete solutions for exhibitions and conferences", href: "/products/tradeshow", image: null, gradient: "linear-gradient(135deg,#0a1208 0%,#111e0a 100%)" },
];

const emptyProduct = (): Product => ({
  id: Date.now(), key: "", nameAr: "", nameEn: "", descAr: "", descEn: "", href: "", image: null, gradient: "linear-gradient(135deg,#FDFBF7 0%,#F4EFE6 100%)",
});

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [selected, setSelected] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    const stored = siteStore.getProducts();
    if (stored && stored.length > 0) setProducts(stored as Product[]);
  }, []);

  const handleSave = () => {
    if (!selected) return;
    const next = isNew ? [...products, selected] : products.map((p) => (p.id === selected.id ? selected : p));
    setProducts(next);
    siteStore.saveProducts(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSelected(null);
    setIsNew(false);
  };

  const handleDelete = (id: number) => {
    setProducts(products.filter((p) => p.id !== id));
    setDeleteConfirm(null);
  };

  const up = (field: keyof Product, val: string | null) =>
    setSelected((s) => s ? { ...s, [field]: val } : s);

  return (
    <div style={{ padding: "2.5rem", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ color: "#C9A24B", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase" as const, marginBottom: "0.5rem" }}>
            لوحة التحكم / المنتجات
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, margin: 0, ...GT }}>إدارة المنتجات 🃏</h1>
          <p style={{ color: "#666", marginTop: "0.5rem", fontSize: "0.9rem" }}>إضافة وتعديل كروت المنتجات وصورها</p>
        </div>
        <button onClick={() => { setSelected(emptyProduct()); setIsNew(true); }} style={{
          padding: "0.75rem 1.75rem", borderRadius: 999, background: G,
          color: "#2C1E15", fontWeight: 700, fontSize: "0.9rem", border: "none",
          cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif", boxShadow: "0 6px 20px rgba(201,162,75,0.3)",
        }}>+ إضافة منتج</button>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {products.map((product) => (
          <div key={product.id} style={{
            borderRadius: 16, overflow: "hidden",
            border: "1px solid rgba(154,106,42,0.25)", background: "#F2E8D0",
          }}>
            {/* Image */}
            <div style={{ height: 160, background: product.gradient, position: "relative", overflow: "hidden" }}>
              {product.image ? (
                <img src={product.image} alt={product.nameAr} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ textAlign: "center", color: "rgba(201,162,75,0.3)" }}>
                    <div style={{ fontSize: "2rem" }}>🖼️</div>
                    <div style={{ fontSize: "0.65rem", marginTop: "0.3rem", color: "rgba(201,162,75,0.2)" }}>لا توجد صورة</div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: "1.25rem" }}>
              <div style={{ fontWeight: 700, color: "#2C1E15", fontSize: "1rem", marginBottom: "0.35rem" }}>{product.nameAr}</div>
              <div style={{ color: "#5A3E28", fontSize: "0.78rem", lineHeight: 1.6, marginBottom: "1rem" }}>{product.descAr}</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => { setSelected({ ...product }); setIsNew(false); }} style={{
                  flex: 1, padding: "0.5rem", borderRadius: 8,
                  background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.2)",
                  color: "#C9A24B", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
                }}>✏️ تعديل</button>
                <button onClick={() => setDeleteConfirm(product.id)} style={{
                  padding: "0.5rem 0.75rem", borderRadius: 8,
                  background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.2)",
                  color: "#e05555", cursor: "pointer",
                }}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirm */}
      {deleteConfirm !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#F2E8D0", border: "1px solid rgba(220,50,50,0.3)", borderRadius: 20, padding: "2rem", width: "min(90vw,380px)", textAlign: "center", fontFamily: "Tajawal, Cairo, sans-serif" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🗑️</div>
            <div style={{ color: "#2C1E15", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem" }}>حذف المنتج؟</div>
            <div style={{ color: "#5A3E28", fontSize: "0.85rem", marginBottom: "1.5rem" }}>هذا الإجراء لا يمكن التراجع عنه</div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: "0.6rem 1.5rem", borderRadius: 999, background: "rgba(220,50,50,0.15)", border: "1px solid rgba(220,50,50,0.4)", color: "#e05555", fontWeight: 700, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>نعم، احذف</button>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: "0.6rem 1.5rem", borderRadius: 999, background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.2)", color: "#C9A24B", fontWeight: 700, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "#F2E8D0", border: "1px solid rgba(154,106,42,0.25)", borderRadius: 20, padding: "2rem", width: "min(95vw,580px)", maxHeight: "90vh", overflowY: "auto", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: "1.2rem", ...GT }}>
                {isNew ? "➕ إضافة منتج" : "✏️ تعديل المنتج"}
              </h2>
              <button onClick={() => setSelected(null)} style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#888", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {/* Image Uploader */}
            <ImageUploader
              value={selected.image}
              onChange={(url) => up("image", url)}
              folder="cnc-store/products"
              label="🖼️ صورة المنتج"
              hint="📐 الأبعاد المثالية: 600 × 400 بكسل | النسبة: 3:2 (أفقية) | الحجم الأقصى: 2MB | الصيغ المدعومة: JPG, PNG, WEBP — يُفضل خلفية داكنة لتناسب تصميم الموقع"
            />

            {/* Fields */}
            {[
              { label: "🏷️ الاسم (عربي)", field: "nameAr" as keyof Product },
              { label: "🏷️ Name (EN)", field: "nameEn" as keyof Product },
              { label: "📝 الوصف (عربي)", field: "descAr" as keyof Product },
              { label: "📝 Description (EN)", field: "descEn" as keyof Product },
              { label: "🔗 الرابط", field: "href" as keyof Product },
            ].map(({ label, field }) => (
              <div key={field} style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.4rem" }}>{label}</label>
                <input
                  value={selected[field] as string ?? ""}
                  onChange={(e) => up(field, e.target.value)}
                  style={{ width: "100%", padding: "0.65rem 1rem", borderRadius: 10, background: "#F2E8D0", border: "1px solid rgba(154,106,42,0.25)", color: "#2C1E15", fontSize: "0.9rem", fontFamily: "Tajawal, Cairo, sans-serif", outline: "none", boxSizing: "border-box" as const, direction: "rtl" }}
                />
              </div>
            ))}

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button onClick={() => setSelected(null)} style={{ padding: "0.7rem 1.5rem", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#888", fontWeight: 600, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>إلغاء</button>
              <button onClick={handleSave} style={{ padding: "0.7rem 2rem", borderRadius: 999, background: G, border: "none", color: "#2C1E15", fontWeight: 700, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif", boxShadow: "0 6px 20px rgba(201,162,75,0.3)" }}>
                {isNew ? "✅ إضافة" : "✅ حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {saved && (
        <div style={{ position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#1a2e1a,#0f1f0f)", border: "1px solid rgba(100,200,100,0.3)", color: "#6dcc6d", padding: "0.75rem 2rem", borderRadius: 999, fontWeight: 600, fontSize: "0.9rem", zIndex: 9999 }}>
          تم الحفظ بنجاح
        </div>
      )}
    </div>
  );
}
