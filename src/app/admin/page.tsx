"use client";
import Link from "next/link";
import { useState } from "react";

const G  = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

const sections = [
  {
    order: 1,
    href: "/admin/slider",
    icon: "🎠",
    label: "السلايدر",
    desc: "شرائح الصورة العريضة في أعلى الصفحة الرئيسية",
    meta: "4 شرائح",
    sectionBg: "#F4EFE6",
    sectionLabel: "خلفية داكنة",
    sectionLabelColor: "#C9A24B",
    editable: true,
  },
  {
    order: 2,
    href: "/admin/home-paths",
    icon: "🛤️",
    label: "المسارات الثلاث",
    desc: "بطاقات المسارات التفاعلية — كتالوج الجاهز، صمّم وسعّر، سعّر مشروعك",
    meta: "3 مسارات قابلة للتعديل",
    sectionBg: "#E2CFA8",
    sectionLabel: "خلفية كريمية",
    sectionLabelColor: "#7A5020",
    editable: true,
  },
  {
    order: 3,
    href: "/admin/stats",
    icon: "📊",
    label: "الإحصائيات والمزايا",
    desc: "شريط الأرقام (4 إحصائيات) وبطاقات «لماذا إعلاني؟» (3 ميزات)",
    meta: "4 أرقام + 3 ميزات",
    sectionBg: "#F4EFE6",
    sectionLabel: "خلفية داكنة",
    sectionLabelColor: "#C9A24B",
    editable: true,
  },
  {
    order: 4,
    href: "/admin/partner-banner",
    icon: "🤝",
    label: "بانر الشراكة",
    desc: "بطاقة دعوة الموردين والمقاولين للانضمام كشركاء معتمدين — عنوان، وصف، مزايا، زر",
    meta: "نصوص قابلة للتعديل",
    sectionBg: "#E2CFA8",
    sectionLabel: "خلفية كريمية",
    sectionLabelColor: "#7A5020",
    editable: true,
  },
  {
    order: 5,
    href: "/admin/colors",
    icon: "🎨",
    label: "ألوان الخلفيات",
    desc: "تغيير لون الخلفية الفاتحة (الكريمي) والداكنة (البني) وخلفية الصفحة العامة",
    meta: "3 ألوان قابلة للتخصيص",
    sectionBg: "#FDFBF7",
    sectionLabel: "كل الأقسام",
    sectionLabelColor: "#C9A24B",
    editable: true,
  },
];

function SectionCard({ s, i }: { s: typeof sections[0]; i: number }) {
  const [hov, setHov] = useState(false);

  const card = (
    <div
      onMouseEnter={() => s.editable && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "stretch",
        borderRadius: 14,
        border: hov ? "1px solid rgba(201,162,75,0.4)" : "1px solid rgba(201,162,75,0.1)",
        background: hov ? "rgba(201,162,75,0.04)" : "rgba(255,255,255,0.01)",
        transition: "all 0.2s",
        overflow: "hidden",
        transform: hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? "0 8px 28px rgba(0,0,0,0.3)" : "none",
        cursor: s.editable ? "pointer" : "default",
      }}
    >
      {/* Color swatch — section actual bg */}
      <div style={{
        width: 6,
        background: s.sectionBg === "#E2CFA8"
          ? "linear-gradient(to bottom, #E2CFA8, #D4BC8E)"
          : "linear-gradient(to bottom, #F4EFE6, #F4EFE6)",
        flexShrink: 0,
      }} />

      {/* Order number */}
      <div style={{
        width: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        borderRight: "1px solid rgba(201,162,75,0.06)",
      }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: "rgba(201,162,75,0.2)" }}>
          {String(s.order).padStart(2, "0")}
        </span>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: "20px 22px", display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
        {/* Icon */}
        <span style={{ fontSize: 28, flexShrink: 0 }}>{s.icon}</span>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: "#2C1E15" }}>{s.label}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
              padding: "2px 8px", borderRadius: 999,
              background: s.sectionBg === "#E2CFA8" ? "rgba(154,106,42,0.12)" : "rgba(201,162,75,0.1)",
              color: s.sectionLabelColor,
              border: `1px solid ${s.sectionBg === "#E2CFA8" ? "rgba(154,106,42,0.2)" : "rgba(201,162,75,0.18)"}`,
            }}>
              {s.sectionLabel}
            </span>
          </div>
          <p style={{ color: "#6A5A4A", fontSize: 12.5, lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
        </div>

        {/* Meta + action */}
        <div style={{ flexShrink: 0, textAlign: "center", minWidth: 110 }}>
          <div style={{ fontSize: 11.5, color: "#634E40", marginBottom: 10, fontWeight: 600 }}>{s.meta}</div>
          {s.editable ? (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 16px", borderRadius: 8,
              background: hov ? G : "rgba(201,162,75,0.08)",
              border: hov ? "none" : "1px solid rgba(201,162,75,0.2)",
              color: hov ? "#2C1E15" : "#C9A24B",
              fontSize: 12, fontWeight: 800,
              transition: "all 0.2s",
            }}>
              <span>تعديل</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5m7 7-7-7 7-7"/></svg>
            </div>
          ) : (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 16px", borderRadius: 8,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "#4A4040", fontSize: 12, fontWeight: 600,
            }}>
              ثابت
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return s.editable ? <Link href={s.href!} style={{ textDecoration: "none", display: "block" }}>{card}</Link> : card;
}

export default function AdminPage() {
  return (
    <div style={{ padding: "2.5rem", fontFamily: "Tajawal, Cairo, sans-serif", maxWidth: 860 }}>

      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ color: "#C9A24B", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase" as const, marginBottom: "0.5rem" }}>
          لوحة التحكم / الصفحة الرئيسية
        </div>
        <h1 style={{ fontSize: "1.9rem", fontWeight: 900, margin: 0, ...GT }}>
          خريطة الصفحة الرئيسية 🗺️
        </h1>
        <p style={{ color: "#5A4A3A", marginTop: "0.4rem", fontSize: "0.88rem" }}>
          {sections.length} أقسام قابلة للتعديل — انقر على القسم للبدء
        </p>
      </div>

      {/* Page color stripe — visual indicator of the alternating layout */}
      <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", marginBottom: 32, gap: 2 }}>
        {sections.map((s) => (
          <div key={s.order} style={{ flex: 1, background: s.sectionBg === "#E2CFA8" ? "#C9A24B" : "#ECE3D2" }} />
        ))}
      </div>

      {/* Section cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sections.map((s, i) => <SectionCard key={s.order} s={s} i={i} />)}
      </div>

      {/* Tip */}
      <div style={{
        marginTop: 28,
        padding: "14px 18px",
        borderRadius: 10,
        background: "#F2E8D0",
        border: "1px solid rgba(201,162,75,0.1)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 16 }}>💡</span>
        <span style={{ fontSize: 12, color: "#6A5A4A", lineHeight: 1.7 }}>
          الأقسام مرتبة من أعلى الصفحة إلى أسفلها. كل تغيير يُحفظ فوراً في localStorage ويُزامَن مع Supabase تلقائياً.
        </span>
      </div>
    </div>
  );
}
