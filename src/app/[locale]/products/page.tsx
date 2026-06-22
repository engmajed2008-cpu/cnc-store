"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { clsx } from "clsx";
import { ArrowUpRight } from "lucide-react";
import { siteStore, DEFAULT_PRODUCTS, type Product } from "@/store/siteStore";

type Locale = "ar" | "en";

// ─── SVG patterns per product key ─────────────────────────────────────────────
const svgPatterns: Record<string, string> = {
  signs: `
    <defs>
      <pattern id="pp-signs" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="10" cy="10" r="1.4" fill="#C9A24B" opacity=".1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#pp-signs)"/>
    <rect x="10%" y="18%" width="80%" height="58%" rx="6" fill="none" stroke="#C9A24B" stroke-width="1.2" stroke-dasharray="7 3" opacity=".4"/>
    <rect x="16%" y="24%" width="68%" height="46%" rx="4" fill="rgba(201,162,75,.04)" stroke="#EBCB7C" stroke-width=".7" opacity=".3"/>
    <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="11%" font-weight="700" fill="#C9A24B" opacity=".5">SIGN</text>
    <line x1="22%" y1="79%" x2="78%" y2="79%" stroke="#C9A24B" stroke-width=".5" opacity=".25"/>
    <circle cx="50%" cy="85%" r="3%" fill="none" stroke="#C9A24B" stroke-width=".8" opacity=".3"/>
    <line x1="50%" y1="88%" x2="50%" y2="95%" stroke="#C9A24B" stroke-width=".8" opacity=".3"/>
  `,
  banners: `
    <defs>
      <pattern id="pp-banners" width="18" height="18" patternUnits="userSpaceOnUse">
        <circle cx="9" cy="9" r="1.2" fill="#C9A24B" opacity=".1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#pp-banners)"/>
    <rect x="30%" y="8%" width="40%" height="84%" rx="4" fill="none" stroke="#C9A24B" stroke-width="1.2" stroke-dasharray="6 3" opacity=".4"/>
    <rect x="35%" y="13%" width="30%" height="74%" rx="3" fill="rgba(201,162,75,.05)" stroke="#EBCB7C" stroke-width=".7" opacity=".3"/>
    <line x1="50%" y1="6%" x2="50%" y2="0%" stroke="#C9A24B" stroke-width="1.5" opacity=".5"/>
    <circle cx="50%" cy="5%" r="2%" fill="#C9A24B" opacity=".6"/>
    <line x1="20%" y1="50%" x2="29%" y2="50%" stroke="#C9A24B" stroke-width=".7" stroke-dasharray="3 2" opacity=".3"/>
    <line x1="71%" y1="50%" x2="80%" y2="50%" stroke="#C9A24B" stroke-width=".7" stroke-dasharray="3 2" opacity=".3"/>
    <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="7%" fill="#C9A24B" opacity=".4">BANNER</text>
  `,
  flags: `
    <defs>
      <pattern id="pp-flags" width="22" height="22" patternUnits="userSpaceOnUse">
        <path d="M0 0h22v22H0z" fill="none" stroke="#C9A24B" stroke-width=".25" opacity=".12"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#pp-flags)"/>
    <line x1="25%" y1="10%" x2="25%" y2="90%" stroke="#C9A24B" stroke-width="1.8" opacity=".5"/>
    <path d="M25%,12% L75%,25% L25%,45%" fill="rgba(201,162,75,.12)" stroke="#C9A24B" stroke-width="1.1" opacity=".55"/>
    <path d="M25%,48% L70%,60% L25%,72%" fill="rgba(201,162,75,.07)" stroke="#EBCB7C" stroke-width=".8" opacity=".4"/>
    <circle cx="25%" cy="10%" r="2%" fill="#C9A24B" opacity=".7"/>
    <line x1="26%" y1="88%" x2="24%" y2="92%" stroke="#C9A24B" stroke-width="1.5" opacity=".4"/>
  `,
  stickers: `
    <defs>
      <pattern id="pp-stickers" width="30" height="30" patternUnits="userSpaceOnUse">
        <circle cx="15" cy="15" r="1.5" fill="#C9A24B" opacity=".1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#pp-stickers)"/>
    <circle cx="50%" cy="48%" r="32%" fill="none" stroke="#C9A24B" stroke-width="1.2" stroke-dasharray="6 4" opacity=".35"/>
    <circle cx="50%" cy="48%" r="22%" fill="rgba(201,162,75,.05)" stroke="#EBCB7C" stroke-width=".8" opacity=".3"/>
    <circle cx="50%" cy="48%" r="10%" fill="rgba(201,162,75,.1)" stroke="#C9A24B" stroke-width="1.2" opacity=".5"/>
    <path d="M50%,16% L53%,37% L72%,30% L58%,46% L75%,58% L54%,54% L58%,75% L50%,62% L42%,75% L46%,54% L25%,58% L42%,46% L28%,30% L47%,37% Z" fill="none" stroke="#C9A24B" stroke-width=".7" opacity=".2"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="7%" fill="#C9A24B" opacity=".45">◆</text>
  `,
  promotional: `
    <defs>
      <pattern id="pp-promo" width="16" height="16" patternUnits="userSpaceOnUse">
        <circle cx="8" cy="8" r="1" fill="#C9A24B" opacity=".1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#pp-promo)"/>
    <path d="M10%,60% Q25%,20% 50%,38% Q75%,56% 90%,18%" fill="none" stroke="#EBCB7C" stroke-width="1.4" opacity=".4" stroke-dasharray="5 3"/>
    <circle cx="50%" cy="38%" r="3.5%" fill="#C9A24B" opacity=".5"/>
    <circle cx="25%" cy="40%" r="2.2%" fill="none" stroke="#C9A24B" stroke-width="1" opacity=".4"/>
    <circle cx="75%" cy="36%" r="2.2%" fill="none" stroke="#C9A24B" stroke-width="1" opacity=".4"/>
    <circle cx="10%" cy="60%" r="1.8%" fill="#EBCB7C" opacity=".3"/>
    <circle cx="90%" cy="18%" r="1.8%" fill="#EBCB7C" opacity=".3"/>
    <line x1="25%" y1="40%" x2="50%" y2="38%" stroke="#C9A24B" stroke-width=".6" opacity=".25" stroke-dasharray="3 2"/>
    <line x1="75%" y1="36%" x2="50%" y2="38%" stroke="#C9A24B" stroke-width=".6" opacity=".25" stroke-dasharray="3 2"/>
    <text x="50%" y="72%" text-anchor="middle" font-family="monospace" font-size="6.5%" fill="#C9A24B" opacity=".35">PROMO</text>
  `,
  tradeshow: `
    <defs>
      <pattern id="pp-trade" width="45" height="45" patternUnits="userSpaceOnUse">
        <path d="M0 0h45v45H0z" fill="none" stroke="#C9A24B" stroke-width=".3" opacity=".2"/>
        <circle cx="0" cy="0" r="1" fill="#C9A24B" opacity=".35"/>
        <circle cx="45" cy="0" r="1" fill="#C9A24B" opacity=".35"/>
        <circle cx="0" cy="45" r="1" fill="#C9A24B" opacity=".35"/>
        <circle cx="45" cy="45" r="1" fill="#C9A24B" opacity=".35"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#pp-trade)"/>
    <rect x="15%" y="30%" width="70%" height="50%" rx="4" fill="rgba(201,162,75,.06)" stroke="#C9A24B" stroke-width="1" opacity=".4"/>
    <rect x="22%" y="22%" width="18%" height="28%" rx="3" fill="rgba(201,162,75,.08)" stroke="#EBCB7C" stroke-width=".8" opacity=".45"/>
    <rect x="60%" y="22%" width="18%" height="28%" rx="3" fill="rgba(201,162,75,.08)" stroke="#EBCB7C" stroke-width=".8" opacity=".45"/>
    <rect x="41%" y="20%" width="18%" height="20%" rx="3" fill="rgba(201,162,75,.1)" stroke="#C9A24B" stroke-width="1" opacity=".5"/>
    <line x1="50%" y1="80%" x2="50%" y2="90%" stroke="#C9A24B" stroke-width="1" opacity=".35"/>
    <line x1="30%" y1="90%" x2="70%" y2="90%" stroke="#C9A24B" stroke-width=".8" opacity=".3"/>
  `,
};

// ─── Icon per product ─────────────────────────────────────────────────────────
// ─── Badge code per product ───────────────────────────────────────────────────
const productBadges: Record<string, string> = {
  signs: "SIGNS", banners: "BANNERS", flags: "FLAGS",
  stickers: "STICKERS", promotional: "PROMO", tradeshow: "TRADE",
};

// ─── Background gradients ─────────────────────────────────────────────────────
// بطاقات صور داكنة أنيقة (صورة + تغشية سوداء + نص فاتح) — تدرّج بنّي فاخر موحّد للبطاقات بلا صورة
const productBg: Record<string, string> = {
  signs:       "linear-gradient(135deg,#2C1E15 0%,#3A2A1A 50%,#1E140D 100%)",
  banners:     "linear-gradient(135deg,#2C1E15 0%,#3A2A1A 50%,#1E140D 100%)",
  flags:       "linear-gradient(135deg,#2C1E15 0%,#3A2A1A 50%,#1E140D 100%)",
  stickers:    "linear-gradient(135deg,#2C1E15 0%,#3A2A1A 50%,#1E140D 100%)",
  promotional: "linear-gradient(135deg,#2C1E15 0%,#3A2A1A 50%,#1E140D 100%)",
  tradeshow:   "linear-gradient(135deg,#2C1E15 0%,#3A2A1A 50%,#1E140D 100%)",
};

// ─── Grid layout per index ────────────────────────────────────────────────────
// Layout: [big-left, top-right-1, top-right-2, bottom-left-1, bottom-left-2, big-right]
const gridClasses = [
  "md:col-span-1 md:row-span-2",   // signs   — tall left
  "md:col-span-1 md:row-span-1",   // banners
  "md:col-span-1 md:row-span-1",   // flags
  "md:col-span-1 md:row-span-1",   // stickers
  "md:col-span-1 md:row-span-1",   // promotional
  "md:col-span-1 md:row-span-2",   // tradeshow — tall right
];

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({
  product, index, ar, locale,
}: {
  product: Product; index: number; ar: boolean; locale: string;
}) {
  const svg = svgPatterns[product.key] ?? svgPatterns.signs;
  const badge = productBadges[product.key] ?? product.key.toUpperCase();
  const bg = productBg[product.key] ?? productBg.signs;
  const gridClass = gridClasses[index] ?? "md:col-span-1 md:row-span-1";
  const name = ar ? product.nameAr : product.nameEn;
  const desc = ar ? product.descAr : product.descEn;

  return (
    <Link
      href={`/${locale}${product.href}`}
      className={clsx(
        "group relative rounded-2xl overflow-hidden cursor-pointer",
        "border border-brand-gold/10 hover:border-brand-gold/40",
        "transition-all duration-500 hover:-translate-y-1.5 hover:scale-[1.01]",
        "hover:shadow-[0_24px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(201,162,75,0.15)]",
      )}
      style={{ height: "300px" }}
    >
      {/* BG */}
      <div className="absolute inset-0 transition-opacity duration-500" style={{ background: bg }} />

      {/* Image or SVG */}
      {product.image ? (
        <img src={product.image} alt={name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          style={{ opacity: 0.75 }}
        />
      ) : (
        <svg
          className="absolute inset-0 w-full h-full opacity-90 transition-transform duration-700 group-hover:scale-[1.04]"
          viewBox="0 0 400 400"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 transition-all duration-500 group-hover:from-black/95" />

      {/* Shimmer sweep */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-brand-gold/[0.08] to-transparent pointer-events-none" />

      {/* Content */}
      <div className={clsx(
        "absolute inset-0 p-5 flex flex-col justify-between z-10",
        ar ? "items-end text-right" : "items-start text-left"
      )}>
        {/* Top: arrow only */}
        <div className={clsx("flex items-start w-full", ar ? "justify-start" : "justify-end")}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center border border-brand-gold/20 bg-brand-gold/[0.06] text-brand-gold opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-400 delay-100">
            <ArrowUpRight size={14} />
          </div>
        </div>

        {/* Bottom: badge + name + desc */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-gold/[0.1] border border-brand-gold/20 text-brand-gold text-[0.6rem] font-mono tracking-[0.1em] uppercase w-fit opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400">
            <span className="w-1 h-1 rounded-full bg-brand-gold" />
            {badge}
          </div>
          <h3 className="font-bold leading-tight text-[#F7ECD8]" style={{ fontSize: "clamp(0.95rem,2vw,1.15rem)", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
            {name}
          </h3>
          <p className="text-xs leading-relaxed text-[#E2D3BC]/90 opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-16 transition-all duration-400 overflow-hidden">
            {desc}
          </p>
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const locale = useLocale() as Locale;
  const ar = locale === "ar";
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);

  useEffect(() => {
    setProducts(siteStore.getStoreCategories());
  }, []);

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: "transparent", fontFamily: "Tajawal, Cairo, sans-serif" }}>

        {/* ── Hero Banner ──────────────────────────────────────────────── */}
        <section style={{ position: "relative", overflow: "hidden", padding: "1.5rem 0 2rem" }}>
          {/* Background grid */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(201,162,75,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(201,162,75,0.03) 1px,transparent 1px)",
            backgroundSize: "50px 50px",
          }} />
          {/* Gold glow */}
          <div style={{
            position: "absolute", top: -100, [ar ? "right" : "left"]: -100,
            width: 500, height: 500, borderRadius: "50%",
            background: "radial-gradient(circle,rgba(201,162,75,0.08) 0%,transparent 70%)",
            pointerEvents: "none",
          }} />

          <div className="section-container" style={{ position: "relative", zIndex: 1 }}>
            {/* Breadcrumb */}
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              fontSize: "0.78rem", color: "#666", marginBottom: "1.5rem",
              flexDirection: ar ? "row-reverse" : "row",
            }}>
              <Link href={`/${locale}`} style={{ color: "#C9A24B", textDecoration: "none" }}>
                {ar ? "الرئيسية" : "Home"}
              </Link>
              <span style={{ opacity: 0.4 }}>›</span>
              <span>{ar ? "المنتجات" : "Products"}</span>
            </div>

            {/* Heading */}
            <div style={{ textAlign: ar ? "right" : "left" }}>
              <span style={{
                display: "inline-block", fontSize: "0.72rem", fontWeight: 700,
                color: "rgba(201,162,75,0.7)", letterSpacing: "0.2em",
                textTransform: "uppercase", marginBottom: "0.75rem",
                fontFamily: "monospace",
              }}>
                {ar ? "أقسام المنتجات" : "Product Categories"}
              </span>
              <h1 style={{
                fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 900,
                color: "#2C1E15", lineHeight: 1.12, margin: "0 0 1rem 0",
              }}>
                {ar ? (
                  <>كل ما تحتاجه <span style={{ background: "linear-gradient(135deg,#C9A24B,#EBCB7C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>في مكان واحد</span></>
                ) : (
                  <>Everything You Need <span style={{ background: "linear-gradient(135deg,#C9A24B,#EBCB7C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>In One Place</span></>
                )}
              </h1>
              <p style={{ fontSize: "clamp(0.9rem,1.6vw,1rem)", color: "#888", maxWidth: 580, lineHeight: 1.8, margin: 0 }}>
                {ar
                  ? "تشكيلة متكاملة من المنتجات والحلول الإعلانية المصنوعة بأعلى معايير الجودة والدقة"
                  : "A comprehensive range of advertising products and solutions crafted to the highest standards of quality and precision"}
              </p>
              <div style={{
                width: 56, height: 3, borderRadius: 999,
                background: "linear-gradient(135deg,#C9A24B,#EBCB7C)",
                marginTop: "1.25rem",
                marginRight: ar ? 0 : "auto",
                marginLeft: ar ? "auto" : 0,
              }} />
            </div>
          </div>
        </section>

        {/* ── Products Grid ─────────────────────────────────────────────── */}
        <section style={{ padding: "2rem 0 5rem" }}>
          <div className="section-container">
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1rem",
            }}>
              {products.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={idx}
                  ar={ar}
                  locale={locale}
                />
              ))}
            </div>

            {/* Stats bar */}
            <div style={{
              marginTop: "3rem",
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1rem",
            }}>
              {[
                { num: "500+", label: ar ? "منتج منجز" : "Products Delivered" },
                { num: "6",    label: ar ? "أقسام متخصصة" : "Specialized Categories" },
                { num: "100%", label: ar ? "ضمان الجودة" : "Quality Guaranteed" },
              ].map(({ num, label }) => (
                <div key={label} style={{
                  padding: "1.25rem 1.5rem", borderRadius: 16, textAlign: "center",
                  background: "rgba(201,162,75,0.05)", border: "1px solid rgba(201,162,75,0.12)",
                }}>
                  <div style={{
                    fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 900,
                    background: "linear-gradient(135deg,#C9A24B,#EBCB7C)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    marginBottom: "0.25rem",
                  }}>{num}</div>
                  <div style={{ fontSize: "0.8rem", color: "#888" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ───────────────────────────────────────────────── */}
        <section style={{ padding: "0 0 5rem" }}>
          <div className="section-container">
            <div style={{
              borderRadius: 20, overflow: "hidden", position: "relative",
              background: "linear-gradient(135deg,#FDFBF7 0%,#F4EFE6 50%,#0a1218 100%)",
              border: "1px solid rgba(201,162,75,0.2)",
              padding: "3rem 3rem",
            }}>
              {/* bg grid */}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                backgroundImage: "linear-gradient(rgba(201,162,75,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(201,162,75,0.04) 1px,transparent 1px)",
                backgroundSize: "40px 40px",
              }} />
              <div style={{
                position: "absolute", [ar ? "left" : "right"]: -80, top: -80,
                width: 300, height: 300, borderRadius: "50%",
                background: "radial-gradient(circle,rgba(201,162,75,0.1) 0%,transparent 70%)",
                pointerEvents: "none",
              }} />

              <div style={{ position: "relative", zIndex: 1, textAlign: ar ? "right" : "left" }}>
                <h2 style={{ fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 900, color: "#2C1E15", margin: "0 0 0.75rem 0" }}>
                  {ar ? "لم تجد ما تبحث عنه؟" : "Didn't find what you're looking for?"}
                </h2>
                <p style={{ color: "#888", fontSize: "0.95rem", margin: "0 0 1.75rem 0", maxWidth: 480 }}>
                  {ar
                    ? "تواصل معنا وسنصمم لك حلاً مخصصاً يناسب احتياجاتك تماماً"
                    : "Contact us and we'll design a custom solution that perfectly fits your needs"}
                </p>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: ar ? "flex-end" : "flex-start" }}>
                  <Link href={`/${locale}/contact`} className="btn-shine btn-shine-gold" style={{
                    padding: "0.85rem 2rem", borderRadius: 999, fontWeight: 700, fontSize: "0.9rem",
                    background: "linear-gradient(135deg,#C9A24B,#EBCB7C)", color: "#2C1E15",
                    textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    boxShadow: "0 6px 24px rgba(201,162,75,0.3)",
                  }}>
                    {ar ? "تواصل معنا" : "Contact Us"}
                    <ArrowUpRight size={16} />
                  </Link>
                  <a href={`https://wa.me/966500000000`} target="_blank" rel="noopener noreferrer"
                    className="btn-shine btn-shine-outline" style={{
                      padding: "0.85rem 1.75rem", borderRadius: 999, fontSize: "0.9rem",
                      border: "1.5px solid rgba(201,162,75,0.3)", color: "#EBCB7C",
                      textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
    </div>
  );
}
