"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { siteStore } from "@/store/siteStore";
const ImageUploader = dynamic(() => import("@/components/admin/ImageUploader"), { ssr: false });

const G = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

type Service = {
  id: number;
  key: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  href: string;
  featuresAr: string[];
  gradient: string;
  image?: string | null;
};

const defaultServices: Service[] = [
  {
    id: 1, key: "decor", nameAr: "خدمات الديكور الداخلي", nameEn: "Interior Decor Services",
    descAr: "تصميم وتنفيذ ديكورات داخلية فاخرة تمزج بين الفن والتقنية الحديثة",
    descEn: "Design and implementation of luxury interior decor blending art with modern technology",
    href: "/services/decor", gradient: "linear-gradient(135deg,#F4EFE6 0%,#F4EFE6 100%)",
    featuresAr: ["تصميم مخصص", "تنفيذ احترافي", "ضمان الجودة"],
  },
  {
    id: 2, key: "cutting", nameAr: "خدمات القص الرقمي", nameEn: "Digital Cutting Services",
    descAr: "قص وحفر المعادن بدقة ميكرونية باستخدام أحدث ماكينات CNC الليزرية",
    descEn: "Metal cutting and engraving with micrometric precision using the latest CNC laser machines",
    href: "/services/cutting", gradient: "linear-gradient(135deg,#0a1218 0%,#0d1a24 100%)",
    featuresAr: ["دقة عالية", "سرعة إنجاز", "جميع أنواع المعادن"],
  },
  {
    id: 3, key: "facade", nameAr: "خدمات تصميم الواجهات", nameEn: "Facade Design Services",
    descAr: "تصميم واجهات تجارية ومعمارية احترافية تجذب الأنظار وتعكس هويتك",
    descEn: "Professional commercial and architectural facade design that attracts attention and reflects your identity",
    href: "/services/facade", gradient: "linear-gradient(135deg,#120810 0%,#1e0f1a 100%)",
    featuresAr: ["تصميم فريد", "مواد عالية الجودة", "تسليم في الوقت المحدد"],
  },
];

const emptyService = (): Service => ({
  id: Date.now(), key: "", nameAr: "", nameEn: "", descAr: "", descEn: "",
  href: "", gradient: "linear-gradient(135deg,#F4EFE6 0%,#F4EFE6 100%)", featuresAr: [""], image: null,
});

export default function ServicesAdminPage() {
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [selected, setSelected] = useState<Service | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    const stored = siteStore.getServices();
    if (stored && stored.length > 0) setServices(stored as Service[]);
  }, []);

  const handleSave = () => {
    if (!selected) return;
    const next = isNew ? [...services, selected] : services.map((s) => (s.id === selected.id ? selected : s));
    setServices(next);
    siteStore.saveServices(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSelected(null);
    setIsNew(false);
  };

  const handleDelete = (id: number) => {
    setServices(services.filter((s) => s.id !== id));
    setDeleteConfirm(null);
  };

  const up = (field: keyof Service, val: string) => setSelected((s) => s ? { ...s, [field]: val } : s);

  const updateFeature = (i: number, val: string) => {
    if (!selected) return;
    const f = [...selected.featuresAr];
    f[i] = val;
    setSelected({ ...selected, featuresAr: f });
  };

  const addFeature = () => {
    if (!selected) return;
    setSelected({ ...selected, featuresAr: [...selected.featuresAr, ""] });
  };

  const removeFeature = (i: number) => {
    if (!selected) return;
    setSelected({ ...selected, featuresAr: selected.featuresAr.filter((_, idx) => idx !== i) });
  };

  return (
    <div style={{ padding: "2.5rem", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ color: "#C9A24B", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase" as const, marginBottom: "0.5rem" }}>
            لوحة التحكم / الخدمات
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, margin: 0, ...GT }}>إدارة الخدمات 🔧</h1>
          <p style={{ color: "#666", marginTop: "0.5rem", fontSize: "0.9rem" }}>إضافة وتعديل كروت الخدمات</p>
        </div>
        <button onClick={() => { setSelected(emptyService()); setIsNew(true); }} style={{
          padding: "0.75rem 1.75rem", borderRadius: 999, background: G,
          color: "#2C1E15", fontWeight: 700, fontSize: "0.9rem", border: "none",
          cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif", boxShadow: "0 6px 20px rgba(201,162,75,0.3)",
        }}>+ إضافة خدمة</button>
      </div>

      {/* Services List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {services.map((service) => (
          <div key={service.id} style={{
            display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem 1.5rem",
            borderRadius: 16, border: "1px solid rgba(154,106,42,0.25)", background: "#F2E8D0",
          }}>
            {/* Color strip */}
            <div style={{ width: 8, height: 56, borderRadius: 4, background: G, opacity: 0.7, flexShrink: 0 }} />

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: "#2C1E15", fontSize: "1rem", marginBottom: "0.25rem" }}>{service.nameAr}</div>
              <div style={{ color: "#5A3E28", fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{service.descAr}</div>
              <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                {service.featuresAr.map((f, i) => (
                  <span key={i} style={{ padding: "0.15rem 0.6rem", borderRadius: 999, background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.15)", color: "#C9A24B", fontSize: "0.68rem" }}>
                    ✓ {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={() => { setSelected({ ...service }); setIsNew(false); }} style={{
                padding: "0.5rem 1.1rem", borderRadius: 999,
                background: "rgba(201,162,75,0.1)", border: "1px solid rgba(201,162,75,0.25)",
                color: "#C9A24B", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
              }}>✏️ تعديل</button>
              <button onClick={() => setDeleteConfirm(service.id)} style={{
                padding: "0.5rem 0.9rem", borderRadius: 999,
                background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.2)",
                color: "#e05555", cursor: "pointer", fontSize: "0.82rem",
              }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirm */}
      {deleteConfirm !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#F2E8D0", border: "1px solid rgba(220,50,50,0.3)", borderRadius: 20, padding: "2rem", width: "min(90vw,380px)", textAlign: "center", fontFamily: "Tajawal, Cairo, sans-serif" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🗑️</div>
            <div style={{ color: "#2C1E15", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem" }}>حذف الخدمة؟</div>
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
                {isNew ? "➕ إضافة خدمة" : "✏️ تعديل الخدمة"}
              </h2>
              <button onClick={() => setSelected(null)} style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#888", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            <ImageUploader
              value={selected.image ?? null}
              onChange={(url: string) => setSelected({ ...selected, image: url || null })}
              folder="cnc-store/services"
              label="صورة الخدمة"
              hint="📐 الأبعاد المثالية: 600 × 400 بكسل | النسبة: 3:2 (أفقية) | الحجم الأقصى: 2MB | الصيغ المدعومة: JPG, PNG, WEBP — يُفضل خلفية داكنة لتناسب تصميم الموقع"
            />

            {[
              { label: "🏷️ الاسم (عربي)", field: "nameAr" as keyof Service },
              { label: "🏷️ Name (EN)", field: "nameEn" as keyof Service },
              { label: "📝 الوصف (عربي)", field: "descAr" as keyof Service },
              { label: "📝 Description (EN)", field: "descEn" as keyof Service },
              { label: "🔗 الرابط", field: "href" as keyof Service },
            ].map(({ label, field }) => (
              <div key={field} style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.4rem" }}>{label}</label>
                <input value={selected[field] as string ?? ""} onChange={(e) => up(field, e.target.value)} style={{ width: "100%", padding: "0.65rem 1rem", borderRadius: 10, background: "#F2E8D0", border: "1px solid rgba(154,106,42,0.25)", color: "#2C1E15", fontSize: "0.9rem", fontFamily: "Tajawal, Cairo, sans-serif", outline: "none", boxSizing: "border-box" as const, direction: "rtl" }} />
              </div>
            ))}

            {/* Features */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                <label style={{ color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700 }}>✅ المميزات</label>
                <button onClick={addFeature} style={{ padding: "0.25rem 0.75rem", borderRadius: 999, background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.2)", color: "#C9A24B", fontSize: "0.72rem", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>+ إضافة</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {selected.featuresAr.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.5rem" }}>
                    <input value={f} onChange={(e) => updateFeature(i, e.target.value)} placeholder={`ميزة ${i + 1}`} style={{ flex: 1, padding: "0.55rem 0.8rem", borderRadius: 8, background: "#F2E8D0", border: "1px solid rgba(154,106,42,0.25)", color: "#2C1E15", fontSize: "0.85rem", fontFamily: "Tajawal, Cairo, sans-serif", outline: "none", direction: "rtl" }} />
                    {selected.featuresAr.length > 1 && (
                      <button onClick={() => removeFeature(i)} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.2)", color: "#e05555", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

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
        <div style={{ position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#1a2e1a,#0f1f0f)", border: "1px solid rgba(100,200,100,0.3)", color: "#6dcc6d", padding: "0.75rem 2rem", borderRadius: 999, fontWeight: 600, fontSize: "0.9rem", zIndex: 9999, boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
          ✅ تم الحفظ بنجاح
        </div>
      )}
    </div>
  );
}
