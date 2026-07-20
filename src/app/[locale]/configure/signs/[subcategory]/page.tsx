"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { clsx } from "clsx";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { siteStore, DEFAULT_STORE_PRODUCTS, DEFAULT_STORE_SUBCATEGORIES, type StoreProduct, type StoreSubcategory } from "@/store/siteStore";

type Locale = "ar" | "en";

// ─── Product Card (الكرت كاملاً قابل للنقر) ──────────────────────────────────
function ProductCard({ product, ar, locale, accentColor }: {
  product: StoreProduct; ar: boolean; locale: string; accentColor: string;
}) {
  const name = ar ? product.nameAr : product.nameEn;
  const desc = ar ? product.descAr : product.descEn;
  const router = useRouter();
  const waHref = `https://wa.me/966500000000?text=${encodeURIComponent(ar ? `أريد الاستفسار عن: ${name}` : `I'd like to inquire about: ${name}`)}`;
  // صفحة المنتج: من href المخزن، أو صفحة لوحات المتاجر للمنتج المطابق
  const isStorefront = product.nameAr.includes("لوحات المتاجر") || product.nameAr.includes("حروف بارزة") || product.nameEn.includes("Storefront") || product.nameEn.includes("LED Channel");
  const pageHref = product.href ? `/${locale}${product.href}` : (isStorefront ? `/${locale}/configure/signs/raised-letters` : null);
  // النقر على أي جزء من الكرت → صفحة المنتج (أو واتساب إن لم تتوفر صفحة)
  const cardClick = () => { if (pageHref) router.push(pageHref); else window.open(waHref, "_blank", "noopener,noreferrer"); };

  return (
    <div className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1.5"
      onClick={cardClick}
      style={{
        background: "#F4EFE6",
        border: `1.5px solid ${accentColor}20`,
        boxShadow: `0 0 0 0 ${accentColor}00`,
        transition: "all 0.3s ease",
        cursor: "pointer",
      }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = `0 20px 40px ${accentColor}18`}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "none"}
    >
      {/* Image or placeholder */}
      <div style={{ height: 220, overflow: "hidden", position: "relative", background: "#F4EFE6" }}>
        {product.image ? (
          <img src={product.image} alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            style={{ opacity: 0.9 }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "0.5rem" }}>
            <svg width="48" height="48" viewBox="0 0 80 80" fill="none" style={{ opacity: 0.2 }}>
              <rect x="10" y="20" width="60" height="45" rx="4" stroke={accentColor} strokeWidth="2"/>
              <circle cx="28" cy="35" r="6" stroke={accentColor} strokeWidth="2"/>
              <path d="M10 52 L28 38 L42 50 L55 40 L70 52" stroke={accentColor} strokeWidth="2" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: "0.7rem", color: `${accentColor}55` }}>
              {ar ? "سيتم إضافة الصورة" : "Image coming soon"}
            </span>
          </div>
        )}

        {/* Badge */}
        {product.badge && (
          <div style={{
            position: "absolute", top: 12, [ar ? "right" : "left"]: 12,
            padding: "0.2rem 0.7rem", borderRadius: 999, fontSize: "0.68rem", fontWeight: 700,
            background: accentColor, color: "#2C1E15",
          }}>{product.badge}</div>
        )}

        {/* Availability */}
        {!product.available && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#f87171", fontWeight: 700, fontSize: "1rem" }}>
              {ar ? "غير متاح حالياً" : "Currently Unavailable"}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "1.25rem", textAlign: ar ? "right" : "left" }}>
        <h3 style={{ fontWeight: 800, color: "#2C1E15", fontSize: "1rem", margin: "0 0 0.5rem 0" }}>{name}</h3>
        <p style={{ color: "#888", fontSize: "0.82rem", lineHeight: 1.7, margin: "0 0 1.25rem 0" }}>{desc}</p>

        {/* CTA buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <a
            href={waHref}
            target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="btn-shine btn-shine-gold"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.65rem 1.4rem", borderRadius: 999, border: "none",
              background: `linear-gradient(135deg,${accentColor},${accentColor}cc)`,
              color: "#2C1E15", fontWeight: 700, fontSize: "0.82rem",
              textDecoration: "none", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
            }}
          >
            <MessageCircle size={15} />
            {ar ? "اطلب الآن" : "Order Now"}
          </a>

        {/* Configure link for storefront signs */}
        {isStorefront && (
          <Link href={`/${locale}/configure/signs/raised-letters`}
            onClick={e => e.stopPropagation()}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem",
              padding: "0.5rem 1.1rem", borderRadius: 999, border: `1px solid ${accentColor}40`,
              color: accentColor, fontWeight: 600, fontSize: "0.78rem", textDecoration: "none",
              fontFamily: "Tajawal, Cairo, sans-serif",
            }}>
            ⚙️ {ar ? "احسب السعر وخصص طلبك" : "Configure & Price"}
          </Link>
        )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SubcategoryProductsPage({
  params,
}: {
  params: { subcategory: string; locale: string };
}) {
  const locale = useLocale() as Locale;
  const ar = locale === "ar";
  const { subcategory } = params;

  const [products, setProducts]       = useState<StoreProduct[]>([]);
  const [subcatData, setSubcatData]   = useState<StoreSubcategory | null>(null);

  useEffect(() => {
    // Load products for this subcategory
    const allProducts = siteStore.getStoreProducts();
    const filtered = allProducts.filter(
      p => p.mainKey === "signs" && p.subcategoryKey === subcategory && p.available
    );

    // Merge with defaults
    const defaults = (DEFAULT_STORE_PRODUCTS ?? []).filter(
      p => p.mainKey === "signs" && p.subcategoryKey === subcategory
    );
    const ids = new Set(filtered.map(p => p.id));
    const merged = [...filtered, ...defaults.filter(d => !ids.has(d.id))];
    setProducts(merged);

    // Load subcategory info
    const allSubs = siteStore.getStoreSubcategories();
    const found = allSubs.find(s => s.mainKey === "signs" && s.key === subcategory)
      ?? DEFAULT_STORE_SUBCATEGORIES.find(s => s.mainKey === "signs" && s.key === subcategory)
      ?? null;
    setSubcatData(found);
  }, [subcategory]);

  // All subcategories use gold
  const accentColor = "#C9A24B";

  const subcatName = subcatData ? (ar ? subcatData.nameAr : subcatData.nameEn) : subcategory;

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: "#FDFBF7", fontFamily: "Tajawal, Cairo, sans-serif" }}>

      {/* Hero */}
      <section style={{ position: "relative", padding: "2rem 0 2.5rem", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `linear-gradient(${accentColor}08 1px,transparent 1px),linear-gradient(90deg,${accentColor}08 1px,transparent 1px)`,
          backgroundSize: "50px 50px",
        }} />
        <div style={{
          position: "absolute", top: -100, [ar ? "right" : "left"]: -100,
          width: 400, height: 400, borderRadius: "50%",
          background: `radial-gradient(circle,${accentColor}0a 0%,transparent 70%)`,
          pointerEvents: "none",
        }} />

        <div className="section-container" dir={ar ? "rtl" : "ltr"} style={{ position: "relative", zIndex: 1 }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "#666", marginBottom: "1.5rem" }}>
            <Link href={`/${locale}`} style={{ color: accentColor, textDecoration: "none" }}>{ar ? "الرئيسية" : "Home"}</Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <Link href={`/${locale}/products`} style={{ color: accentColor, textDecoration: "none" }}>{ar ? "المنتجات" : "Products"}</Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <Link href={`/${locale}/configure/signs`} style={{ color: accentColor, textDecoration: "none" }}>{ar ? "اللوحات" : "Signs"}</Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: "#ccc" }}>{subcatName}</span>
          </div>

          {/* Title */}
          <div style={{ textAlign: ar ? "right" : "left" }}>
            <div style={{ display: "inline-block", padding: "0.3rem 1rem", borderRadius: 999, marginBottom: "0.75rem", background: `${accentColor}15`, border: `1px solid ${accentColor}30`, fontSize: "0.72rem", fontWeight: 700, color: accentColor, fontFamily: "monospace" }}>
              {ar ? "منتجات القسم" : "Category Products"}
            </div>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900, color: "#2C1E15", lineHeight: 1.12, margin: "0 0 0.75rem 0" }}>
              {subcatName}
            </h1>
            {subcatData && (
              <p style={{ fontSize: "0.95rem", color: "#888", maxWidth: 560, lineHeight: 1.8, margin: 0 }}>
                {ar ? subcatData.descAr : subcatData.descEn}
              </p>
            )}
            <div style={{ width: 48, height: 3, borderRadius: 999, background: `linear-gradient(135deg,${accentColor},${accentColor}80)`, marginTop: "1rem", [ar ? "marginLeft" : "marginRight"]: "auto" }} />
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section style={{ padding: "1rem 0 5rem" }}>
        <div className="section-container">
          {products.length === 0 ? (
            <div style={{ textAlign: "center", padding: "5rem 2rem", color: "#444" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
              <div style={{ fontWeight: 600, color: "#666" }}>
                {ar ? "لا توجد منتجات في هذا القسم بعد" : "No products in this category yet"}
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: "1.25rem" }}>
              {products.map(p => (
                <ProductCard key={p.id} product={p} ar={ar} locale={locale} accentColor={accentColor} />
              ))}
            </div>
          )}

          {/* CTA */}
          <div style={{
            marginTop: "3.5rem", padding: "2.5rem", borderRadius: 20, textAlign: "center",
            background: "#F4EFE6", border: `1px solid ${accentColor}20`,
          }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#2C1E15", margin: "0 0 0.5rem 0" }}>
              {ar ? "لم تجد ما تبحث عنه؟" : "Didn't find what you're looking for?"}
            </h2>
            <p style={{ color: "#777", margin: "0 0 1.5rem 0", fontSize: "0.9rem" }}>
              {ar ? "نصنع حلولاً مخصصة لأي مشروع — تواصل معنا الآن" : "We create custom solutions for any project — contact us now"}
            </p>
            <a href="https://wa.me/966500000000" target="_blank" rel="noopener noreferrer"
              className="btn-shine btn-shine-gold"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.6rem",
                padding: "0.85rem 2rem", borderRadius: 999,
                background: "linear-gradient(135deg,#C9A24B,#EBCB7C)",
                color: "#2C1E15", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
                boxShadow: "0 6px 24px rgba(201,162,75,0.3)",
              }}>
              <MessageCircle size={18} />
              {ar ? "تواصل على واتساب" : "Contact on WhatsApp"}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
