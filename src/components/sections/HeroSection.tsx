"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { siteStore, DEFAULT_STATS, type Stat } from "@/store/siteStore";
type Locale = "ar" | "en";

/* ─── animated counter hook ─────────────────────────────── */
function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const startTime = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(ease * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return count;
}

/* ─── single stat with count-up ─────────────────────────── */
function StatItem({ value, label, started }: { value: string; label: string; started: boolean }) {
  const num = parseInt(value.replace(/\D/g, "")) || 0;
  const suffix = value.replace(/[\d]/g, "");
  const count = useCountUp(num, 2000, started);
  return (
    <div style={{ textAlign: "center" }}>
      <span style={{
        display: "block", fontWeight: 900,
        fontSize: "clamp(1.5rem,2.5vw,2.1rem)",
        background: "linear-gradient(135deg,#C9A24B,#EBCB7C)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        fontVariantNumeric: "tabular-nums",
      }}>
        {started ? `${count}${suffix}` : value}
      </span>
      <span style={{ display: "block", color: "#909090", fontSize: "0.78rem", lineHeight: 1.4 }}>{label}</span>
    </div>
  );
}

/* ─── floating particle ──────────────────────────────────── */
type Particle = { id: number; x: number; size: number; dur: number; delay: number; opacity: number };

export function HeroSection() {
  const t = useTranslations("hero");
  const locale = useLocale() as Locale;
  const isRTL = locale === "ar";

  const [statsData, setStatsData]   = useState<Stat[]>(DEFAULT_STATS);
  const [visible,   setVisible]     = useState(false);
  const [particles, setParticles]   = useState<Particle[]>([]);
  const [laserY,    setLaserY]      = useState(-10);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => { setStatsData(siteStore.getStats()); }, []);

  /* IntersectionObserver → trigger count-up once */
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.25 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  /* generate particles once on client */
  useEffect(() => {
    setParticles(
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: Math.random() * 3 + 1.5,
        dur: Math.random() * 8 + 6,
        delay: Math.random() * 10,
        opacity: Math.random() * 0.5 + 0.15,
      }))
    );
  }, []);

  /* laser sweep */
  useEffect(() => {
    let dir = 1;
    let pos = -10;
    const interval = setInterval(() => {
      pos += dir * 1.2;
      if (pos > 110) dir = -1;
      if (pos < -10) dir = 1;
      setLaserY(pos);
    }, 16);
    return () => clearInterval(interval);
  }, []);

  const stats = statsData.map(s => ({ value: s.suffix + s.value, label: s.label }));

  return (
    <section
      id="hero"
      ref={sectionRef}
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        position: "relative", width: "100%", minHeight: "100vh",
        display: "flex", alignItems: "center", overflow: "hidden",
        background: "linear-gradient(135deg,#0a0d08 0%,#131a0d 50%,#090c07 100%)",
        fontFamily: "Tajawal, Cairo, sans-serif",
      }}
    >
      <style>{`
        @keyframes glow1      { 0%{transform:translate(0,0) scale(1)}   100%{transform:translate(-50px,60px) scale(1.2)} }
        @keyframes glow2      { 0%{transform:translate(0,0)}             100%{transform:translate(60px,-40px) scale(1.15)} }
        @keyframes floatUp    { 0%{transform:translateY(0);opacity:var(--op)}  100%{transform:translateY(-100vh);opacity:0} }
        @keyframes fadeInUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeInDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer    { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes pulseBorder{ 0%,100%{border-color:rgba(201,162,75,0.3)} 50%{border-color:rgba(201,162,75,0.7)} }
        @keyframes rotateSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes rotateRev  { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
        @keyframes scaleIn    { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
        @keyframes lineGrow   { from{transform:scaleX(0)} to{transform:scaleX(1)} }
        @keyframes dotBlink   { 0%,100%{opacity:1} 50%{opacity:0.2} }

        .hero-title-1  { animation: fadeInDown 0.8s 0.1s ease-out both; }
        .hero-title-2  { animation: fadeInUp   0.9s 0.3s ease-out both; }
        .hero-sub      { animation: fadeInUp   0.8s 0.55s ease-out both; }
        .hero-cta      { animation: scaleIn    0.7s 0.75s ease-out both; }
        .hero-stats    { animation: fadeInUp   0.7s 1s    ease-out both; }
        .hero-divider  { transform-origin:center; animation: lineGrow 0.8s 0.9s ease-out both; }

        .btn-primary-hero {
          position: relative; overflow: hidden;
          background: linear-gradient(135deg,#C9A24B,#EBCB7C);
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .btn-primary-hero::after {
          content:""; position:absolute; inset:0;
          background: linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.35) 50%,transparent 100%);
          background-size:200% 100%;
          animation: shimmer 2.5s 1.5s ease-in-out infinite;
        }
        .btn-primary-hero:hover { transform:translateY(-2px); box-shadow:0 10px 36px rgba(201,162,75,0.5)!important; }

        .btn-secondary-hero {
          transition: all 0.2s;
          animation: pulseBorder 3s 2s ease-in-out infinite;
        }
        .btn-secondary-hero:hover { background:rgba(201,162,75,0.12)!important; transform:translateY(-2px); }

        .hex-ring-1 { transform-origin:50% 50%; animation: rotateSlow 20s linear infinite; }
        .hex-ring-2 { transform-origin:50% 50%; animation: rotateRev  15s linear infinite; }

        .stat-item { transition: transform 0.2s; }
        .stat-item:hover { transform: translateY(-4px); }
      `}</style>

      {/* ── Floating particles ── */}
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          left: `${p.x}%`,
          bottom: "-10px",
          width: p.size,
          height: p.size,
          borderRadius: "50%",
          background: "#C9A24B",
          pointerEvents: "none",
          ["--op" as string]: p.opacity,
          animation: `floatUp ${p.dur}s ${p.delay}s linear infinite`,
          opacity: p.opacity,
        }} />
      ))}

      {/* ── Laser sweep line ── */}
      <div style={{
        position: "absolute", left: 0, right: 0,
        top: `${laserY}%`,
        height: 1,
        background: "linear-gradient(90deg,transparent,rgba(201,162,75,0.12) 30%,rgba(201,162,75,0.28) 50%,rgba(201,162,75,0.12) 70%,transparent)",
        pointerEvents: "none",
        transition: "top 0.016s linear",
      }} />

      {/* ── Background grid ── */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(201,162,75,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(201,162,75,.03) 1px,transparent 1px)",
        backgroundSize: "65px 65px",
        maskImage: "radial-gradient(ellipse 90% 90% at 50% 50%,black 20%,transparent 100%)",
      }} />

      {/* ── Glow orbs ── */}
      <div style={{
        position: "absolute", top: -200, right: -200,
        width: 700, height: 700, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(201,162,75,0.1) 0%,transparent 65%)",
        pointerEvents: "none", animation: "glow1 10s ease-in-out infinite alternate",
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: "5%",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(201,162,75,0.06) 0%,transparent 65%)",
        pointerEvents: "none", animation: "glow2 13s ease-in-out infinite alternate",
      }} />

      {/* ── Rotating hex rings (background decoration) ── */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", opacity:0.06 }}
        viewBox="0 0 1400 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <g className="hex-ring-1" style={{ transformOrigin:"700px 400px" }}>
          <polygon points="700,150 920,275 920,525 700,650 480,525 480,275"
            fill="none" stroke="#C9A24B" strokeWidth="1"/>
        </g>
        <g className="hex-ring-2" style={{ transformOrigin:"700px 400px" }}>
          <polygon points="700,220 880,320 880,480 700,580 520,480 520,320"
            fill="none" stroke="#C9A24B" strokeWidth="0.8"/>
        </g>
        <circle cx="700" cy="400" r="180" fill="none" stroke="#C9A24B" strokeWidth="0.5" strokeDasharray="6 6"/>
      </svg>

      {/* ── Main content ── */}
      <div style={{
        position: "relative", zIndex: 10,
        width: "100%", maxWidth: 1400, margin: "0 auto",
        minHeight: "100vh", display: "flex", alignItems: "center",
      }}>
        <div style={{
          width: "100%",
          padding: "clamp(2rem,6vw,6rem)",
          paddingTop: "clamp(6rem,10vw,9rem)",
          paddingBottom: "clamp(3rem,6vw,6rem)",
          display: "flex", flexDirection: "column",
          alignItems: "center", textAlign: "center",
        }}>

          {/* Badge */}
          <div className="hero-title-1" style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.35rem 1rem", borderRadius: 999, marginBottom: "1.25rem",
            border: "1px solid rgba(201,162,75,0.3)",
            background: "rgba(201,162,75,0.07)",
            fontSize: "0.78rem", color: "#C9A24B", fontWeight: 600,
          }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#C9A24B", animation:"dotBlink 1.5s ease-in-out infinite", display:"inline-block" }}/>
            {isRTL ? "✦ إعلاني — سوق الدعاية والإعلان" : "✦ E3LANI — ADVERTISING & SIGNAGE MARKET"}
          </div>

          {/* Title */}
          <h1 style={{ margin: "0 0 1.25rem 0", fontWeight: 900, lineHeight: 1.1, fontSize: "clamp(2rem,4.5vw,4rem)" }}>
            <span className="hero-title-1" style={{ display: "block", color: "#2C1E15" }}>{t("title")}</span>
            <span className="hero-title-2" style={{
              display: "block", marginTop: "0.15em",
              background: "linear-gradient(135deg,#C9A24B,#EBCB7C,#C9A24B)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              animation: "shimmer 4s 1s linear infinite, fadeInUp 0.9s 0.3s ease-out both",
            }}>{t("titleHighlight")}</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-sub" style={{
            color: "#8A8A8A", lineHeight: 1.9, marginBottom: "2.25rem",
            maxWidth: 680, fontSize: "clamp(0.9rem,1.4vw,1rem)",
          }}>
            {t("subtitle")}
          </p>

          {/* CTAs */}
          <div className="hero-cta" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2.75rem", justifyContent: "center" }}>
            <Link href={`/${locale}/contact`} className="btn-primary-hero btn-shine btn-shine-gold" style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.85rem 2rem", borderRadius: 999,
              fontWeight: 700, fontSize: "0.95rem",
              color: "#2C1E15", textDecoration: "none",
              boxShadow: "0 6px 28px rgba(201,162,75,0.3)",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {isRTL ? "اطلب الآن" : "Order Now"}
              {isRTL
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              }
            </Link>
            <Link href={`/${locale}/portfolio`} className="btn-secondary-hero btn-shine btn-shine-outline" style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.85rem 1.75rem", borderRadius: 999,
              fontWeight: 600, fontSize: "0.95rem",
              border: "1.5px solid rgba(201,162,75,0.3)",
              color: "#EBCB7C", textDecoration: "none",
              background: "rgba(201,162,75,0.05)",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              {t("ctaSecondary")}
            </Link>
          </div>

          {/* Stats divider */}
          <div className="hero-divider" style={{
            width: "100%", maxWidth: 700, height: 1,
            background: "rgba(201,162,75,0.12)",
            marginBottom: "1.75rem",
          }} />

          {/* Stats */}
          <div className="hero-stats" style={{
            display: "grid", gridTemplateColumns: "repeat(4,1fr)",
            gap: "1rem", width: "100%", maxWidth: 700,
          }}>
            {stats.map(({ value, label }) => (
              <div key={label} className="stat-item">
                <StatItem value={value} label={label} started={visible} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
