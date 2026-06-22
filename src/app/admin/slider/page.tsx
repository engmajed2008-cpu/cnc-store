"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { siteStore } from "@/store/siteStore";
const ImageUploader = dynamic(() => import("@/components/admin/ImageUploader"), { ssr: false });

const G = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

type Slide = {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  ctaAr: string;
  ctaEn: string;
  href: string;
  color: string;
  image: string | null;
};

const defaultSlides: Slide[] = [
  { id: 1, image: null, badge: "عرض خاص", title: "قص CNC بدقة استثنائية", subtitle: "احصل على خصم 20% على جميع طلبات القص الرقمي هذا الشهر", ctaAr: "اطلب الآن", ctaEn: "Order Now", href: "/products/cnc", color: "#0d1208" },
  { id: 2, image: null, badge: "جديد", title: "ديكورات معدنية فاخرة", subtitle: "حول مساحتك الى تحفة فنية مع احدث تصاميم الديكور المعدني", ctaAr: "اكتشف المزيد", ctaEn: "Discover More", href: "/services/decor", color: "#080d12" },
  { id: 3, image: null, badge: "الاكثر طلبا", title: "لوحات ولافتات احترافية", subtitle: "اصنع هوية بصرية قوية لعلامتك التجارية مع لافتاتنا المخصصة", ctaAr: "شاهد الاعمال", ctaEn: "View Work", href: "/clients/projects", color: "#2C1E15" },
  { id: 4, image: null, badge: "خدمة مميزة", title: "تصميم وتنفيذ متكامل", subtitle: "من الفكرة الى التنفيذ - فريقنا يرافقك في كل خطوة", ctaAr: "تواصل معنا", ctaEn: "Contact Us", href: "/contact", color: "#0d0d14" },
];

const emptySlide = (): Slide => ({
  id: Date.now(), image: null, badge: "", title: "", subtitle: "",
  ctaAr: "", ctaEn: "", href: "/", color: "#FDFBF7",
});

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.65rem 1rem", borderRadius: 10,
  background: "#F2E8D0", border: "1px solid rgba(154,106,42,0.25)",
  color: "#2C1E15", fontSize: "0.9rem", fontFamily: "Tajawal, Cairo, sans-serif",
  outline: "none", boxSizing: "border-box", direction: "rtl",
};

export default function SliderAdminPage() {
  const [slides, setSlides] = useState<Slide[]>(defaultSlides);
  const [selected, setSelected] = useState<Slide | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    const stored = siteStore.getSlides();
    if (stored && stored.length > 0) setSlides(stored as Slide[]);
  }, []);

  const openEdit = (slide: Slide) => { setSelected({ ...slide }); setIsNew(false); };
  const openNew = () => { setSelected(emptySlide()); setIsNew(true); };
  const closeModal = () => { setSelected(null); setIsNew(false); };

  const handleChange = (field: keyof Slide, value: string) => {
    if (!selected) return;
    setSelected({ ...selected, [field]: value });
  };

  const handleSave = () => {
    if (!selected) return;
    const next = isNew ? [...slides, selected] : slides.map((s) => (s.id === selected.id ? selected : s));
    setSlides(next);
    siteStore.saveSlides(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    closeModal();
  };

  const handleDelete = (id: number) => {
    const next = slides.filter((s) => s.id !== id);
    setSlides(next);
    siteStore.saveSlides(next);
    setDeleteConfirm(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const arr = [...slides];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    setSlides(arr);
    siteStore.saveSlides(arr);
  };

  const moveDown = (index: number) => {
    if (index === slides.length - 1) return;
    const arr = [...slides];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    setSlides(arr);
    siteStore.saveSlides(arr);
  };

  return (
    <div style={{ padding: "2.5rem", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ color: "#C9A24B", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            لوحة التحكم / الـ Slider
          </div>
          <h1 suppressHydrationWarning style={{ fontSize: "2rem", fontWeight: 900, margin: 0, ...GT }}>ادارة الـ Slider</h1>
          <p style={{ color: "#666", marginTop: "0.5rem", fontSize: "0.9rem" }}>اضف او عدل او رتب شرائح الصفحة الرئيسية</p>
        </div>
        <button onClick={openNew} style={{ padding: "0.75rem 1.75rem", borderRadius: 999, background: G, color: "#2C1E15", fontWeight: 700, fontSize: "0.9rem", border: "none", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>
          + اضافة شريحة جديدة
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", padding: "1.25rem 1.5rem", background: "#F2E8D0", borderRadius: 14, border: "1px solid rgba(201,162,75,0.1)" }}>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: "1.8rem", fontWeight: 900, ...GT }}>{slides.length}</div>
          <div style={{ fontSize: "0.75rem", color: "#aaa" }}>اجمالي الشرائح</div>
        </div>
        <div style={{ width: 1, background: "rgba(201,162,75,0.1)" }} />
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: "1.8rem", fontWeight: 900, ...GT }}>5s</div>
          <div style={{ fontSize: "0.75rem", color: "#aaa" }}>مدة كل شريحة</div>
        </div>
        <div style={{ width: 1, background: "rgba(201,162,75,0.1)" }} />
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: "1.8rem", fontWeight: 900, ...GT }}>&#10003;</div>
          <div style={{ fontSize: "0.75rem", color: "#aaa" }}>التبديل التلقائي</div>
        </div>
      </div>

      {/* Slides List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {slides.map((slide, index) => (
          <div key={slide.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem 1.5rem", borderRadius: 16, border: "1px solid rgba(154,106,42,0.25)", background: "#F2E8D0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(201,162,75,0.1)", border: "1px solid rgba(201,162,75,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#C9A24B", fontWeight: 700, fontSize: "0.9rem", flexShrink: 0 }}>
              {index + 1}
            </div>
            {slide.image && (
              <img src={slide.image} alt="" style={{ width: 64, height: 44, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(201,162,75,0.2)", flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#2C1E15", fontWeight: 700, fontSize: "1rem", marginBottom: "0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {slide.title || "بدون عنوان"}
              </div>
              <div style={{ color: "#bbb", fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {slide.badge && <span style={{ color: "#C9A24B", fontWeight: 600 }}>{slide.badge}</span>}
                {slide.badge && " — "}
                {slide.subtitle || "—"}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <button onClick={() => moveUp(index)} disabled={index === 0} style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.15)", color: "#C9A24B", cursor: "pointer", fontSize: "0.75rem" }}>▲</button>
              <button onClick={() => moveDown(index)} disabled={index === slides.length - 1} style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.15)", color: "#C9A24B", cursor: "pointer", fontSize: "0.75rem" }}>▼</button>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={() => openEdit(slide)} style={{ padding: "0.5rem 1.1rem", borderRadius: 999, background: "rgba(201,162,75,0.1)", border: "1px solid rgba(201,162,75,0.25)", color: "#C9A24B", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>
                تعديل ✏
              </button>
              <button onClick={() => setDeleteConfirm(slide.id)} style={{ padding: "0.5rem 0.9rem", borderRadius: 999, background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.2)", color: "#e05555", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Toast */}
      {saved && (
        <div style={{ position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", background: "#1a2e1a", border: "1px solid rgba(100,200,100,0.3)", color: "#6dcc6d", padding: "0.75rem 2rem", borderRadius: 999, fontWeight: 600, fontSize: "0.9rem", zIndex: 9999 }}>
          تم الحفظ بنجاح
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div style={{ background: "#F2E8D0", border: "1px solid rgba(220,50,50,0.3)", borderRadius: 20, padding: "2rem", width: "min(90vw,380px)", textAlign: "center", fontFamily: "Tajawal, Cairo, sans-serif" }}>
            <div style={{ color: "#2C1E15", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem" }}>حذف الشريحة؟</div>
            <div style={{ color: "#5A3E28", fontSize: "0.85rem", marginBottom: "1.5rem" }}>هذا الاجراء لا يمكن التراجع عنه</div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: "0.6rem 1.5rem", borderRadius: 999, background: "rgba(220,50,50,0.15)", border: "1px solid rgba(220,50,50,0.4)", color: "#e05555", fontWeight: 700, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>نعم، احذف</button>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: "0.6rem 1.5rem", borderRadius: 999, background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.2)", color: "#C9A24B", fontWeight: 700, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>الغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {selected !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "1rem" }}>
          <div style={{ background: "#F2E8D0", border: "1px solid rgba(154,106,42,0.25)", borderRadius: 20, padding: "2rem", width: "min(95vw,560px)", maxHeight: "90vh", overflowY: "auto", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: "1.25rem", ...GT }}>
                {isNew ? "اضافة شريحة جديدة" : "تعديل الشريحة"}
              </h2>
              <button onClick={closeModal} style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#888", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {/* Image guidelines */}
            <div style={{ padding: "0.85rem 1rem", borderRadius: 12, marginBottom: "1rem", background: "rgba(201,162,75,0.06)", border: "1px solid rgba(201,162,75,0.15)" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#C9A24B", marginBottom: "0.5rem" }}>📸 إرشادات الصورة</div>
              <ul style={{ margin: 0, padding: "0 1.25rem", fontSize: "0.78rem", color: "#999", lineHeight: 2 }}>
                <li><b style={{ color: "#ddd" }}>الأبعاد:</b> 1920 × 520 بكسل (عرض كامل)</li>
                <li><b style={{ color: "#ddd" }}>النسبة:</b> 16:4.3 — أفقية عريضة جداً</li>
                <li><b style={{ color: "#ddd" }}>المحتوى:</b> الجانب الأيسر (55%) سيكون مرئياً — ضع المحتوى المهم هناك</li>
                <li><b style={{ color: "#ddd" }}>الجانب الأيمن (45%):</b> يُغطى بـ overlay داكن لعرض الكتابة</li>
                <li><b style={{ color: "#ddd" }}>الصيغ:</b> JPG أو WEBP | الحجم الأقصى: 3MB</li>
                <li><b style={{ color: "#ddd" }}>نصيحة:</b> تجنب وضع نص أو شعار في الجانب الأيمن</li>
              </ul>
            </div>

            <ImageUploader
              value={selected.image}
              onChange={(url: string) => setSelected({ ...selected, image: url || null })}
              folder="cnc-store/slider"
              label="🖼️ صورة الخلفية الكاملة"
              hint="1920×520 بكسل | عرض كامل | المحتوى المهم في الجانب الأيسر"
            />

            {/* Text guidelines */}
            <div style={{ padding: "0.85rem 1rem", borderRadius: 12, margin: "0.5rem 0 1rem", background: "rgba(74,158,232,0.06)", border: "1px solid rgba(74,158,232,0.15)" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#4A9EE8", marginBottom: "0.5rem" }}>✍️ إرشادات الكتابة</div>
              <ul style={{ margin: 0, padding: "0 1.25rem", fontSize: "0.78rem", color: "#999", lineHeight: 2 }}>
                <li><b style={{ color: "#ddd" }}>الشارة (badge):</b> كلمة أو كلمتان فقط — مثل: "جديد"، "عرض خاص"</li>
                <li><b style={{ color: "#ddd" }}>العنوان:</b> جملة قصيرة 4-6 كلمات — يظهر بخط كبير</li>
                <li><b style={{ color: "#ddd" }}>الوصف:</b> جملة أو جملتان — 10-15 كلمة كحد أقصى</li>
                <li><b style={{ color: "#ddd" }}>زر الطلب (ctaAr/ctaEn):</b> فعل قصير — مثل: "اطلب الآن"</li>
              </ul>
            </div>

            {[
              { field: "badge", labelAr: "🏷️ الشارة (عربي)", placeholder: "مثال: عرض خاص" },
              { field: "title", labelAr: "📝 العنوان (عربي)", placeholder: "مثال: قص CNC بدقة استثنائية" },
              { field: "subtitle", labelAr: "💬 الوصف (عربي)", placeholder: "جملة قصيرة 10-15 كلمة" },
              { field: "ctaAr", labelAr: "🔘 نص الزر (عربي)", placeholder: "مثال: اطلب الآن" },
              { field: "ctaEn", labelAr: "🔘 Button Text (EN)", placeholder: "e.g. Order Now" },
              { field: "href", labelAr: "🔗 الرابط عند الضغط", placeholder: "/products/cnc" },
            ].map(({ field, labelAr, placeholder }) => (
              <div key={field} style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.4rem" }}>{labelAr}</label>
                <input
                  value={(selected[field as keyof Slide] as string) ?? ""}
                  onChange={(e) => handleChange(field as keyof Slide, e.target.value)}
                  placeholder={placeholder}
                  style={inputStyle}
                />
              </div>
            ))}

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.4rem" }}>لون الخلفية</label>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <input type="color" value={selected.color} onChange={(e) => handleChange("color", e.target.value)} style={{ width: 44, height: 44, borderRadius: 10, border: "1px solid rgba(201,162,75,0.2)", background: "transparent", cursor: "pointer", padding: 2 }} />
                <input value={selected.color} onChange={(e) => handleChange("color", e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={closeModal} style={{ padding: "0.7rem 1.5rem", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#888", fontWeight: 600, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>الغاء</button>
              <button onClick={handleSave} style={{ padding: "0.7rem 2rem", borderRadius: 999, background: G, border: "none", color: "#2C1E15", fontWeight: 700, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>
                {isNew ? "اضافة" : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
