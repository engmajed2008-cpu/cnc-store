"use client";

import Link from "next/link";

const G = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

const services = [
  {
    key: "advertising",
    icon: "◎",
    gradient: "linear-gradient(135deg,#120810 0%,#1e0f1a 100%)",
    ar: {
      name: "دعاية وإعلان",
      desc: "لافتات، بنرات، وهويات بصرية تعبر عن علامتك التجارية بأقوى الأساليب",
      features: ["تصميم الهوية البصرية", "اللافتات الإلكترونية", "المطبوعات الاحترافية", "الإعلانات الخارجية"],
    },
    en: {
      name: "Advertising",
      desc: "Signs, banners, and visual identities that express your brand with the strongest methods",
      features: ["Brand Identity Design", "Electronic Signs", "Professional Prints", "Outdoor Advertising"],
    },
    href: "/services/advertising",
  },
  {
    key: "decor",
    icon: "✦",
    gradient: "linear-gradient(135deg,#F4EFE6 0%,#F4EFE6 100%)",
    ar: {
      name: "ديكور فني",
      desc: "حلول ديكورية مبتكرة تمزج بين الفن الراقي والتقنية الحديثة",
      features: ["لوحات معدنية مزخرفة", "ديكورات الجدران", "عناصر داخلية فريدة", "تشكيلات فنية مخصصة"],
    },
    en: {
      name: "Artistic Decor",
      desc: "Innovative decor solutions blending high art with modern technology",
      features: ["Ornamental Metal Panels", "Wall Decor", "Unique Interior Elements", "Custom Art Pieces"],
    },
    href: "/services/decor",
  },
  {
    key: "cnc",
    icon: "⚙",
    gradient: "linear-gradient(135deg,#0a1218 0%,#0d1a24 100%)",
    ar: {
      name: "قص CNC",
      desc: "قص وحفر المعادن بدقة ميكرونية باستخدام أحدث ماكينات CNC",
      features: ["قص الألمنيوم والستيل", "الحفر ثلاثي الأبعاد", "النماذج الأولية", "الإنتاج بالجملة"],
    },
    en: {
      name: "CNC Cutting",
      desc: "Metal cutting and engraving with micrometric precision using the latest CNC machines",
      features: ["Aluminum & Steel Cutting", "3D Engraving", "Prototyping", "Bulk Production"],
    },
    href: "/services/cnc",
  },
];

function ServiceCard({ item, locale, index }: { item: typeof services[0]; locale: string; index: number }) {
  const ar = locale === "ar";
  const info = ar ? item.ar : item.en;

  return (
    <Link
      href={`/${locale}${item.href}`}
      style={{
        display: "block",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(201,162,75,0.12)",
        background: "#F4EFE6",
        textDecoration: "none",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 40px rgba(201,162,75,0.15)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,162,75,0.3)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,162,75,0.12)";
      }}
    >
      <div style={{
        width: "100%",
        height: 160,
        background: item.gradient,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(201,162,75,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(201,162,75,0.04) 1px,transparent 1px)",
          backgroundSize: "30px 30px",
        }} />
        <span style={{ fontSize: "3rem", color: "rgba(201,162,75,0.6)", position: "relative", zIndex: 1 }}>
          {item.icon}
        </span>
        <span style={{
          position: "absolute", top: "1rem",
          ...(ar ? { left: "1rem" } : { right: "1rem" }),
          fontSize: "2.5rem", fontWeight: 900,
          color: "rgba(201,162,75,0.08)", fontFamily: "monospace",
        }}>
          0{index + 1}
        </span>
      </div>

      <div style={{ padding: "1.5rem", background: "#F4EFE6" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2C1E15", margin: "0 0 0.5rem 0" }}>
          {info.name}
        </h3>
        <p style={{ fontSize: "0.82rem", color: "#909090", lineHeight: 1.7, margin: "0 0 1rem 0" }}>
          {info.desc}
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.25rem 0", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {info.features.map((f) => (
            <li key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#888",
              flexDirection: ar ? "row-reverse" : "row" }}>
              <span style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(201,162,75,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="#C9A24B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              {f}
            </li>
          ))}
        </ul>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "#C9A24B", fontSize: "0.8rem", fontWeight: 600 }}>
          {ar ? "اعرف المزيد" : "Learn More"}
        </div>
      </div>
    </Link>
  );
}

export function ServicesSection({ locale }: { locale?: string }) {
  const loc = locale ?? "ar";
  const ar = loc === "ar";

  return (
    <section
      dir={ar ? "rtl" : "ltr"}
      style={{ padding: "5rem 2.5rem", background: "#FDFBF7", fontFamily: "Tajawal, Cairo, sans-serif", borderTop: "1px solid rgba(201,162,75,0.08)" }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ marginBottom: "3rem", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ color: "#C9A24B", fontSize: "0.7rem", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: "0.6rem" }}>
              {ar ? "ما نقدمه" : "What We Offer"}
            </div>
            <h2 style={{ fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 800, color: "#2C1E15", margin: 0, lineHeight: 1.2 }}>
              {ar ? "خدماتنا " : "Our "}
              <span style={{ ...GT }}>{ar ? "الرئيسية" : "Services"}</span>
            </h2>
          </div>
          <Link href={`/${loc}/services`} style={{
            padding: "0.6rem 1.4rem", borderRadius: 999,
            border: "1.5px solid rgba(201,162,75,0.3)",
            color: "#C9A24B", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none",
          }}>
            {ar ? "عرض الكل" : "View All"}
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1.25rem" }}>
          {services.map((s, i) => (
            <ServiceCard key={s.key} item={s} locale={loc} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
