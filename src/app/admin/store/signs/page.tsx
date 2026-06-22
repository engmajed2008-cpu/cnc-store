"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { siteStore, DEFAULT_SIGN_IMAGES, type SignImages } from "@/store/siteStore";
const ImageUploader = dynamic(() => import("@/components/admin/ImageUploader"), { ssr: false });

const G  = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

const sections: { key: keyof SignImages; icon: string; nameAr: string; nameEn: string; color: string }[] = [
  { key: "outdoor", icon: "🏢", nameAr: "اللوحات الخارجية والواجهات",    nameEn: "Outdoor & Facade Signs",   color: "#4A9EE8" },
  { key: "metal",   icon: "⚙️", nameAr: "اللوحات المعدنية والقص بالليزر", nameEn: "Metal & Laser-Cut Signs",  color: "#C9A24B" },
  { key: "neon",    icon: "✨", nameAr: "لوحات النيون المضيئة",           nameEn: "Neon LED Signs",           color: "#E040FB" },
  { key: "indoor",  icon: "🏛️", nameAr: "اللوحات الداخلية والمكتبية",    nameEn: "Indoor & Office Signs",    color: "#4CAF50" },
  { key: "decor",   icon: "🎨", nameAr: "لوحات الديكور والجداريات",       nameEn: "Decorative & Wall Art",    color: "#FF9800" },
];

export default function SignImagesAdminPage() {
  const [images, setImages] = useState<SignImages>(DEFAULT_SIGN_IMAGES);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    setImages(siteStore.getSignImages());
  }, []);

  const update = (key: keyof SignImages, url: string | null) => {
    const next = { ...images, [key]: url };
    setImages(next);
    siteStore.saveSignImages(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: "2.5rem", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ color: "#C9A24B", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
          لوحة التحكم / إدارة المنتجات / صور اللوحات
        </div>
        <h1 style={{ fontSize: "1.9rem", fontWeight: 900, margin: 0, ...GT }}>صور أقسام اللوحات 🪧</h1>
        <p style={{ color: "#666", marginTop: "0.5rem", fontSize: "0.88rem" }}>
          أضف صورة لكل قسم من أقسام اللوحات — تظهر في صفحة <span style={{ color: "#C9A24B" }}>/configure/signs</span>
        </p>
      </div>

      {/* Info */}
      <div style={{
        padding: "0.85rem 1.25rem", borderRadius: 12, marginBottom: "2rem",
        background: "rgba(201,162,75,0.06)", border: "1px solid rgba(201,162,75,0.15)",
        display: "flex", gap: "0.75rem", alignItems: "flex-start",
      }}>
        <span style={{ fontSize: "1.1rem", marginTop: 2 }}>💡</span>
        <div style={{ fontSize: "0.82rem", color: "#999", lineHeight: 1.6 }}>
          إذا لم تضف صورة، سيظهر التصميم التقني الافتراضي (SVG). الصور المثالية: أفقية بنسبة 16:9، خلفية داكنة أو شفافة، بجودة عالية.
        </div>
      </div>

      {/* Sections grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
        {sections.map(s => (
          <div key={s.key} style={{
            borderRadius: 16, overflow: "hidden",
            border: `1px solid ${s.color}40`,
            background: "#F2E8D0",
          }}>
            {/* Header */}
            <div style={{
              padding: "1rem 1.25rem",
              borderBottom: `1px solid ${s.color}15`,
              display: "flex", alignItems: "center", gap: "0.75rem",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, fontSize: "1.2rem",
                background: s.color + "18", border: `1.5px solid ${s.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{s.icon}</div>
              <div>
                <div style={{ fontWeight: 700, color: "#2C1E15", fontSize: "0.95rem" }}>{s.nameAr}</div>
                <div style={{ fontSize: "0.72rem", color: s.color, marginTop: "0.15rem", fontFamily: "monospace" }}>
                  {s.key.toUpperCase()} · {s.nameEn}
                </div>
              </div>
              {/* Status indicator */}
              <div style={{ marginRight: "auto", marginLeft: 0 }}>
                <div style={{
                  padding: "0.2rem 0.65rem", borderRadius: 999, fontSize: "0.65rem", fontWeight: 700,
                  background: images[s.key] ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.05)",
                  border: images[s.key] ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.1)",
                  color: images[s.key] ? "#4ade80" : "#555",
                }}>
                  {images[s.key] ? "✓ مُضافة" : "لا توجد صورة"}
                </div>
              </div>
            </div>

            {/* Preview */}
            {images[s.key] && (
              <div style={{ height: 160, overflow: "hidden", position: "relative" }}>
                <img src={images[s.key]!} alt={s.nameAr}
                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)",
                }} />
                <button onClick={() => update(s.key, null)} style={{
                  position: "absolute", top: 8, left: 8,
                  padding: "0.3rem 0.75rem", borderRadius: 999, border: "none",
                  background: "rgba(220,50,50,0.8)", color: "#fff",
                  fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                }}>🗑️ حذف الصورة</button>
              </div>
            )}

            {/* Uploader */}
            <div style={{ padding: "1.25rem" }}>
              <ImageUploader
                value={images[s.key]}
                onChange={url => update(s.key, url)}
                folder={`cnc-store/signs/${s.key}`}
                label={images[s.key] ? "🔄 تغيير الصورة" : "📤 رفع صورة"}
                hint="الأبعاد المثالية: 800×500 | نسبة 16:9 | خلفية داكنة | JPG أو PNG"
              />
            </div>
          </div>
        ))}
      </div>

      {saved && (
        <div style={{
          position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
          background: "#0f1f0f", border: "1px solid rgba(100,200,100,0.3)",
          color: "#6dcc6d", padding: "0.75rem 2rem", borderRadius: 999,
          fontWeight: 600, zIndex: 9999,
        }}>
          ✅ تم الحفظ تلقائياً
        </div>
      )}
    </div>
  );
}
