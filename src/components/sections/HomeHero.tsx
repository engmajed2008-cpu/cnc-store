"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { siteStore, DEFAULT_HOME_PATHS, DEFAULT_COLORS, type HomePath, type SiteColors } from "@/store/siteStore";

/* ─── SVG patterns per path key ─────────────────────────────────────────────── */
const SVG_FALLBACK = `
  <defs>
    <pattern id="hp-fallback" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="1.2" fill="#C9A24B" opacity=".1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#hp-fallback)"/>
  <circle cx="50%" cy="50%" r="22%" fill="none" stroke="#C9A24B" stroke-width="1" stroke-dasharray="6 3" opacity=".3"/>
  <circle cx="50%" cy="50%" r="12%" fill="rgba(201,162,75,.06)" stroke="#C9A24B" stroke-width=".8" opacity=".35"/>
`;

const SVG_PATTERNS: Record<string, string> = {
  products: `
    <defs>
      <pattern id="hp-products" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="10" cy="10" r="1.4" fill="#C9A24B" opacity=".1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hp-products)"/>
    <rect x="12%" y="15%" width="76%" height="62%" rx="6" fill="none" stroke="#C9A24B" stroke-width="1.2" stroke-dasharray="7 3" opacity=".4"/>
    <rect x="18%" y="22%" width="64%" height="48%" rx="4" fill="rgba(201,162,75,.04)" stroke="#EBCB7C" stroke-width=".7" opacity=".3"/>
    <line x1="18%" y1="35%" x2="82%" y2="35%" stroke="#C9A24B" stroke-width=".6" opacity=".25" stroke-dasharray="4 3"/>
    <line x1="18%" y1="47%" x2="82%" y2="47%" stroke="#C9A24B" stroke-width=".6" opacity=".2" stroke-dasharray="4 3"/>
    <circle cx="26%" cy="41%" r="4%" fill="rgba(201,162,75,.08)" stroke="#C9A24B" stroke-width=".8" opacity=".4"/>
    <circle cx="26%" cy="53%" r="4%" fill="rgba(201,162,75,.05)" stroke="#C9A24B" stroke-width=".8" opacity=".35"/>
    <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="9%" font-weight="700" fill="#C9A24B" opacity=".45">CATALOG</text>
  `,
  configure: `
    <defs>
      <pattern id="hp-configure" width="18" height="18" patternUnits="userSpaceOnUse">
        <circle cx="9" cy="9" r="1.2" fill="#C9A24B" opacity=".1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hp-configure)"/>
    <line x1="20%" y1="75%" x2="55%" y2="25%" stroke="#C9A24B" stroke-width="2" opacity=".5" stroke-linecap="round"/>
    <rect x="52%" y="21%" width="14%" height="8%" rx="2" fill="#C9A24B" opacity=".5" transform="rotate(-45 59% 25%)"/>
    <line x1="14%" y1="80%" x2="20%" y2="75%" stroke="#C9A24B" stroke-width="1.5" opacity=".4"/>
    <line x1="14%" y1="80%" x2="19%" y2="87%" stroke="#C9A24B" stroke-width="1.5" opacity=".35"/>
    <path d="M14%,80% L19%,87% L20%,75% Z" fill="rgba(201,162,75,.15)" opacity=".5"/>
    <line x1="30%" y1="62%" x2="40%" y2="52%" stroke="#EBCB7C" stroke-width=".9" opacity=".3" stroke-dasharray="3 2"/>
    <circle cx="65%" cy="40%" r="12%" fill="none" stroke="#C9A24B" stroke-width=".8" stroke-dasharray="5 3" opacity=".25"/>
    <circle cx="65%" cy="40%" r="6%" fill="rgba(201,162,75,.06)" stroke="#C9A24B" stroke-width="1" opacity=".35"/>
    <text x="65%" y="72%" text-anchor="middle" font-family="monospace" font-size="7%" fill="#C9A24B" opacity=".4">DESIGN</text>
  `,
  request: `
    <defs>
      <pattern id="hp-request" width="22" height="22" patternUnits="userSpaceOnUse">
        <path d="M0 0h22v22H0z" fill="none" stroke="#C9A24B" stroke-width=".25" opacity=".1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hp-request)"/>
    <rect x="22%" y="12%" width="56%" height="72%" rx="5" fill="rgba(201,162,75,.05)" stroke="#C9A24B" stroke-width="1.2" opacity=".45"/>
    <rect x="27%" y="18%" width="46%" height="10%" rx="3" fill="rgba(201,162,75,.1)" stroke="#EBCB7C" stroke-width=".7" opacity=".4"/>
    <line x1="27%" y1="37%" x2="73%" y2="37%" stroke="#C9A24B" stroke-width=".7" opacity=".3"/>
    <line x1="27%" y1="47%" x2="65%" y2="47%" stroke="#C9A24B" stroke-width=".7" opacity=".25"/>
    <line x1="27%" y1="57%" x2="60%" y2="57%" stroke="#C9A24B" stroke-width=".7" opacity=".2"/>
    <line x1="27%" y1="67%" x2="50%" y2="67%" stroke="#C9A24B" stroke-width=".7" opacity=".15"/>
    <circle cx="68%" cy="65%" r="10%" fill="none" stroke="#C9A24B" stroke-width=".9" stroke-dasharray="4 3" opacity=".3"/>
    <text x="68%" y="66%" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="7%" fill="#C9A24B" opacity=".4">RFQ</text>
  `,
};

/* ─── Path Card ──────────────────────────────────────────────────────────────── */
function PathCard({ path, isAr }: { path: HomePath; isAr: boolean }) {
  const [hovered, setHovered] = useState(false);
  const svgContent = SVG_PATTERNS[path.key] ?? SVG_FALLBACK;
  const name = isAr ? path.nameAr : path.nameEn;
  const desc = isAr ? path.descAr : path.descEn;
  const cta  = isAr ? path.ctaAr  : path.ctaEn;
  const tag  = isAr ? path.tagAr  : path.tagEn;

  return (
    <Link
      href={`/${isAr ? "ar" : "en"}${path.href}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block",
        position: "relative",
        borderRadius: 20,
        overflow: "hidden",
        cursor: "pointer",
        height: 340,
        textDecoration: "none",
        border: hovered
          ? "1px solid rgba(201,162,75,0.5)"
          : "1px solid rgba(201,162,75,0.12)",
        transition: "border-color 0.35s, transform 0.35s, box-shadow 0.35s",
        transform: hovered ? "translateY(-6px) scale(1.015)" : "none",
        boxShadow: hovered
          ? "0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(201,162,75,0.18)"
          : "none",
      }}
    >
      {/* Background gradient */}
      <div style={{ position: "absolute", inset: 0, background: path.gradient }} />

      {/* Image or SVG pattern */}
      {path.image ? (
        <img
          src={path.image} alt={name}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", opacity: 0.7,
            transition: "transform 0.55s",
            transform: hovered ? "scale(1.06)" : "scale(1)",
          }}
        />
      ) : (
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.9 }}
          viewBox="0 0 400 400"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}

      {/* Dark overlay — stronger at bottom */}
      <div style={{
        position: "absolute", inset: 0,
        background: hovered
          ? "linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.12) 100%)"
          : "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.38) 55%, rgba(0,0,0,0.08) 100%)",
        transition: "all 0.4s",
      }} />

      {/* Shimmer sweep */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(90deg, transparent, rgba(201,162,75,0.09), transparent)",
        transform: hovered ? "translateX(100%)" : "translateX(-100%)",
        transition: "transform 0.65s ease",
      }} />

      {/* Arrow icon — top corner */}
      <div style={{
        position: "absolute",
        top: 14, [isAr ? "right" : "left"]: 14,
        width: 30, height: 30, borderRadius: "50%",
        border: "1px solid rgba(201,162,75,0.25)",
        background: "rgba(201,162,75,0.07)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#C9A24B",
        opacity: hovered ? 1 : 0,
        transform: hovered ? "scale(1)" : "scale(0.7)",
        transition: "all 0.3s 0.1s",
        zIndex: 10,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d={isAr ? "M5 19L19 5M19 19V5H5" : "M19 5L5 19M5 5h14v14"} />
        </svg>
      </div>

      {/* Watermark number */}
      <div style={{
        position: "absolute",
        top: 10, [isAr ? "left" : "right"]: 16,
        fontSize: 80, fontWeight: 900,
        color: "rgba(201,162,75,0.07)",
        lineHeight: 1, userSelect: "none",
        fontVariantNumeric: "tabular-nums",
        zIndex: 1,
      }}>
        {path.num}
      </div>

      {/* Content — bottom */}
      <div style={{
        position: "absolute", inset: 0,
        padding: "18px 20px 22px",
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
        textAlign: isAr ? "right" : "left",
        zIndex: 10,
      }}>
        {/* Tag badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "3px 10px", borderRadius: 999,
          background: "rgba(201,162,75,0.1)", border: "1px solid rgba(201,162,75,0.22)",
          color: "#C9A24B", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em",
          marginBottom: 10, width: "fit-content",
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0)" : "translateY(6px)",
          transition: "all 0.3s",
        }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#C9A24B", display: "block" }} />
          {tag}
        </div>

        {/* Name */}
        <h2 style={{
          color: "#2C1E15", fontWeight: 900, margin: "0 0 8px",
          fontSize: "clamp(1.1rem, 2.2vw, 1.35rem)", lineHeight: 1.25,
        }}>
          {name}
        </h2>

        {/* Description */}
        <p style={{
          color: "#9A9080", fontSize: 12.5, lineHeight: 1.7, margin: "0 0 16px",
          maxHeight: hovered ? 80 : 0,
          opacity: hovered ? 1 : 0,
          overflow: "hidden",
          transition: "all 0.35s",
        }}>
          {desc}
        </p>

        {/* CTA */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          color: "#C9A24B", fontSize: 13, fontWeight: 800,
        }}>
          <span>{cta}</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d={isAr ? "M19 12H5m7 7-7-7 7-7" : "M5 12h14m-7-7 7 7-7 7"} />
          </svg>
        </div>
      </div>
    </Link>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────────── */
export default function HomeHero({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [paths, setPaths]   = useState<HomePath[]>(DEFAULT_HOME_PATHS);
  const [colors, setColors] = useState<SiteColors>(DEFAULT_COLORS);

  useEffect(() => {
    const stored = siteStore.getHomePaths();
    if (stored?.length) setPaths(stored);
    setColors(siteStore.getColors());
  }, []);


  return (
    <section
      dir={isAr ? "rtl" : "ltr"}
      style={{
        position: "relative", overflow: "hidden",
        background: colors.sectionCream,
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "100px 24px 90px",
      }}
    >
      {/* Grid */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(74,53,37,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(74,53,37,0.07) 1px,transparent 1px)",
        backgroundSize:"52px 52px",
      }} />

      {/* Breathing orb — solid gold, clearly visible */}
      <div style={{
        position:"absolute", top:"50%", left:"50%",
        width:600, height:600, borderRadius:"50%",
        marginTop:-300, marginLeft:-300,
        background:"radial-gradient(circle, rgba(201,162,75,0.55) 0%, rgba(201,162,75,0.2) 40%, transparent 70%)",
        pointerEvents:"none",
        animation:"hb 5s ease-in-out infinite",
      }} />

      {/* Secondary orb — top-right */}
      <div style={{
        position:"absolute", top:-80, right:-80,
        width:420, height:420, borderRadius:"50%",
        background:"radial-gradient(circle, rgba(201,162,75,0.4) 0%, transparent 65%)",
        pointerEvents:"none",
        animation:"hb2 7s ease-in-out infinite 2s",
      }} />

      {/* Pulse rings */}
      <div style={{
        position:"absolute", top:"50%", left:"50%",
        width:400, height:400, borderRadius:"50%",
        marginTop:-200, marginLeft:-200,
        border:"3px solid rgba(154,106,42,0.5)",
        pointerEvents:"none",
        animation:"hp 3.5s ease-out infinite",
      }} />
      <div style={{
        position:"absolute", top:"50%", left:"50%",
        width:400, height:400, borderRadius:"50%",
        marginTop:-200, marginLeft:-200,
        border:"3px solid rgba(154,106,42,0.4)",
        pointerEvents:"none",
        animation:"hp 3.5s ease-out infinite 1.75s",
      }} />

      {/* Shimmer sweep */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
        <div style={{
          position:"absolute", top:"-50%", left:0,
          width:"25%", height:"200%",
          background:"linear-gradient(90deg, transparent, rgba(201,162,75,0.3), transparent)",
          animation:"hs 7s ease-in-out infinite 1s",
        }} />
      </div>

      {/* Spinning arc — top-left */}
      <div style={{
        position:"absolute", top:-80, left:-80,
        width:280, height:280, borderRadius:"50%",
        border:"2.5px dashed rgba(154,106,42,0.35)",
        pointerEvents:"none",
        animation:"hsp 22s linear infinite",
      }} />

      {/* Spinning arc — bottom-right */}
      <div style={{
        position:"absolute", bottom:-100, right:-100,
        width:340, height:340, borderRadius:"50%",
        border:"2px dashed rgba(154,106,42,0.28)",
        pointerEvents:"none",
        animation:"hsr 32s linear infinite",
      }} />

      {/* Floating particles — larger & more opaque */}
      {[
        {l:"7%",  t:"80%", s:7, d:6,   del:0   },
        {l:"15%", t:"86%", s:5, d:8,   del:1.4 },
        {l:"24%", t:"74%", s:8, d:7,   del:2.8 },
        {l:"33%", t:"88%", s:5, d:9,   del:0.6 },
        {l:"43%", t:"82%", s:7, d:6.5, del:3.5 },
        {l:"53%", t:"90%", s:5, d:8.5, del:1.8 },
        {l:"62%", t:"76%", s:8, d:7.5, del:4.2 },
        {l:"71%", t:"85%", s:5, d:6.5, del:0.3 },
        {l:"79%", t:"79%", s:7, d:9,   del:2.1 },
        {l:"87%", t:"89%", s:5, d:7,   del:3.9 },
        {l:"93%", t:"73%", s:6, d:8,   del:1.1 },
        {l:"48%", t:"94%", s:5, d:6,   del:4.7 },
      ].map((p, i) => (
        <div key={i} style={{
          position:"absolute", left:p.l, top:p.t,
          width:p.s, height:p.s, borderRadius:"50%",
          background:"rgba(154,106,42,0.7)",
          pointerEvents:"none",
          animation:`hf ${p.d}s ease-in-out infinite ${p.del}s`,
        }} />
      ))}

      {/* Top badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "6px 20px", borderRadius: 999,
        border: "1px solid rgba(154,106,42,0.3)",
        background: "rgba(201,162,75,0.12)",
        marginBottom: 36, position: "relative", zIndex: 1,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#9A6A2A", display: "block" }} />
        <span style={{ fontSize: 12, color: "#9A6A2A", fontWeight: 700, letterSpacing: "0.09em" }}>
          {isAr ? "سوق الدعاية والإعلان — إعلاني" : "Advertising & Signage Marketplace — E3lani"}
        </span>
      </div>

      {/* Headline */}
      <h1 style={{
        textAlign: "center", fontWeight: 900,
        fontSize: "clamp(2rem, 5vw, 3.6rem)",
        lineHeight: 1.15, marginBottom: 16, maxWidth: 720,
        position: "relative", zIndex: 1,
      }}>
        {isAr ? (
          <>
            <span style={{ color: "#2C1E15" }}>عن ماذا تبحث </span>
            <span style={{ color: "#9A6A2A" }}>اليوم؟</span>
          </>
        ) : (
          <>
            <span style={{ color: "#2C1E15" }}>What are you </span>
            <span style={{ color: "#9A6A2A" }}>looking for?</span>
          </>
        )}
      </h1>

      <p style={{
        textAlign: "center", color: "#5A3E28",
        fontSize: "clamp(14px, 2vw, 17px)",
        marginBottom: 56, maxWidth: 480, lineHeight: 1.75,
        position: "relative", zIndex: 1,
      }}>
        {isAr
          ? `اختر مسارك — ${paths.length} ${paths.length === 1 ? "طريقة" : paths.length === 2 ? "طريقتان" : "طرق"} للحصول على ما تحتاجه بالضبط`
          : `Choose your path — ${paths.length} way${paths.length !== 1 ? "s" : ""} to get exactly what you need`}
      </p>

      {/* Path cards — dynamic grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
        gap: 18, width: "100%", maxWidth: 1100,
        position: "relative", zIndex: 1,
      }}>
        {paths.map((p) => (
          <PathCard key={p.id} path={p} isAr={isAr} />
        ))}
      </div>

    </section>
  );
}
