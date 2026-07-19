"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { siteStore, DEFAULT_PRODUCTS, DEFAULT_SERVICES, type Product, type Service } from "@/store/siteStore";

const G = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

function Card({ item, locale, index }: { item: Product | Service; locale: string; index: number }) {
  const ar = locale === "ar";
  const name = ar ? item.nameAr : item.nameEn;
  const desc = ar ? item.descAr : item.descEn;

  return (
    <Link
      href={`/${locale}${item.href}`}
      style={{
        display: "block", borderRadius: 16, overflow: "hidden",
        border: "1px solid rgba(201,162,75,0.35)", background: "#F4EFE6",
        textDecoration: "none", transition: "transform 0.3s ease, box-shadow 0.3s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 40px rgba(201,162,75,0.25)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,162,75,0.7)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,162,75,0.35)";
      }}
    >
      {/* Image */}
      <div style={{
        width: "100%", height: 200, background: item.gradient,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(201,162,75,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(201,162,75,0.06) 1px,transparent 1px)",
          backgroundSize: "30px 30px",
        }} />
        {item.image ? (
          <img src={item.image} alt={name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ textAlign: "center", color: "rgba(201,162,75,0.5)", position: "relative", zIndex: 1 }}>
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <rect x="6" y="12" width="40" height="30" rx="3" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="18" cy="22" r="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6 34 L18 24 L28 32 L36 26 L46 34" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <div style={{ fontSize: "0.65rem", marginTop: "0.5rem" }}>
              {ar ? "صورة المنتج" : "Product Image"}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "1.25rem", background: "#F4EFE6" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#2C1E15", margin: "0 0 0.5rem 0" }}>
          {name}
        </h3>
        <p style={{ fontSize: "0.82rem", color: "#5A3E28", lineHeight: 1.7, margin: "0 0 1rem 0" }}>
          {desc}
        </p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "#9A6A2A", fontSize: "0.8rem", fontWeight: 600 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={ar ? "M19 12H5M12 19l-7-7 7-7" : "M5 12h14M12 5l7 7-7 7"} />
          </svg>
          {ar ? "اكتشف المزيد" : "Discover More"}
        </div>
      </div>
    </Link>
  );
}

export default function ProductsServicesSection({ locale }: { locale: string }) {
  const ar = locale === "ar";
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);

  useEffect(() => {
    setProducts(siteStore.getProducts());
    setServices(siteStore.getServices());
  }, []);

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ fontFamily: "Tajawal, Cairo, sans-serif", background: "transparent" }}>

      {/* Products */}
      <section style={{ padding: "5rem 2.5rem", borderBottom: "1px solid rgba(201,162,75,0.08)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ marginBottom: "3rem", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ color: "#C9A24B", fontSize: "0.7rem", letterSpacing: "0.22em", textTransform: "uppercase" as const, marginBottom: "0.6rem" }}>
                {ar ? "تسوّق حسب الفئة" : "Shop by Category"}
              </div>
              <h2 style={{ fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 800, color: "#2C1E15", margin: 0, lineHeight: 1.2 }}>
                {ar ? "منتجاتنا " : "Our "}
                <span style={{ ...GT }}>{ar ? "المتميزة" : "Products"}</span>
              </h2>
            </div>
            <Link href={`/${locale}/products`} style={{
              padding: "0.6rem 1.4rem", borderRadius: 999,
              border: "1.5px solid rgba(201,162,75,0.3)", color: "#C9A24B",
              fontSize: "0.82rem", fontWeight: 600, textDecoration: "none",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={ar ? "M19 12H5M12 19l-7-7 7-7" : "M5 12h14M12 5l7 7-7 7"} />
              </svg>
              {ar ? "عرض الكل" : "View All"}
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {products.slice(0, 8).map((p, i) => <Card key={p.id} item={p} locale={locale} index={i} />)}
          </div>
        </div>
      </section>

      {/* Services */}
      <section style={{ padding: "5rem 2.5rem" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ marginBottom: "3rem", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ color: "#C9A24B", fontSize: "0.7rem", letterSpacing: "0.22em", textTransform: "uppercase" as const, marginBottom: "0.6rem" }}>
                {ar ? "ما نقدمه لك" : "What We Offer"}
              </div>
              <h2 style={{ fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 800, color: "#2C1E15", margin: 0, lineHeight: 1.2 }}>
                {ar ? "خدماتنا " : "Our "}
                <span style={{ ...GT }}>{ar ? "الاحترافية" : "Services"}</span>
              </h2>
            </div>
            <Link href={`/${locale}/services`} style={{
              padding: "0.6rem 1.4rem", borderRadius: 999,
              border: "1.5px solid rgba(201,162,75,0.3)", color: "#C9A24B",
              fontSize: "0.82rem", fontWeight: 600, textDecoration: "none",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={ar ? "M19 12H5M12 19l-7-7 7-7" : "M5 12h14M12 5l7 7-7 7"} />
              </svg>
              {ar ? "عرض الكل" : "View All"}
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
            {services.slice(0, 6).map((s, i) => <Card key={s.id} item={s} locale={locale} index={i} />)}
          </div>
        </div>
      </section>

    </div>
  );
}
