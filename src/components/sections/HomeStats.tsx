"use client";
import { useState, useEffect, useRef } from "react";
import { siteStore, DEFAULT_STATS, DEFAULT_WHY_CARDS, DEFAULT_COLORS, type Stat, type WhyCard, type SiteColors } from "@/store/siteStore";
import { isSvgIcon, getIconId, SvgIcon } from "@/lib/siteIcons";

function IconDisplay({ value, size = 36 }: { value: string; size?: number }) {
  if (isSvgIcon(value)) return <SvgIcon id={getIconId(value)} size={size} />;
  const isUrl = value.startsWith("http") || value.startsWith("/") || value.startsWith("data:");
  if (isUrl) return <img src={value} alt="" style={{ width: size, height: size, objectFit: "contain" }} />;
  return <span style={{ fontSize: size, lineHeight: 1 }}>{value}</span>;
}

function Counter({ target, suffix = "", duration = 1800 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { threshold: 0.5 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
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
  }, [started, target, duration]);

  return (
    <span
      ref={ref}
      style={{
        background: "linear-gradient(135deg, #C9A24B, #EBCB7C)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {count}{suffix}
    </span>
  );
}

export default function HomeStats({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [stats, setStats]     = useState<Stat[]>(DEFAULT_STATS);
  const [whyCards, setWhy]    = useState<WhyCard[]>(DEFAULT_WHY_CARDS);
  const [colors, setColors]   = useState<SiteColors>(DEFAULT_COLORS);

  useEffect(() => {
    const s = siteStore.getStats();
    if (s?.length) setStats(s);
    const w = siteStore.getWhyCards();
    if (w?.length) setWhy(w);
    setColors(siteStore.getColors());
  }, []);

  return (
    <section
      dir={isAr ? "rtl" : "ltr"}
      style={{ background: colors.sectionDark, padding: "80px 24px" }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Stats bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            background: colors.sectionCream,
            border: "1px solid rgba(74,53,37,0.15)",
            borderRadius: 16,
            overflow: "hidden",
            marginBottom: 80,
          }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                padding: "28px 20px",
                textAlign: "center",
                borderInlineEnd: i < stats.length - 1 ? "1px solid rgba(74,53,37,0.1)" : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                <IconDisplay value={s.icon} size={32} />
              </div>
              <div style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 900, marginBottom: 6 }}>
                <Counter target={parseInt(s.value, 10) || 0} suffix={s.suffix} />
              </div>
              <div style={{ color: "#5A3E28", fontSize: 13, fontWeight: 600 }}>
                {isAr ? s.label : (s.labelEn || s.label)}
              </div>
            </div>
          ))}
        </div>

        {/* Why section header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              display: "inline-block",
              padding: "4px 18px",
              borderRadius: 999,
              background: "rgba(201,162,75,0.09)",
              border: "1px solid rgba(201,162,75,0.22)",
              fontSize: 11,
              color: "#C9A24B",
              fontWeight: 700,
              letterSpacing: "0.1em",
              marginBottom: 16,
            }}
          >
            {isAr ? "لماذا إعلاني؟" : "Why E3lani?"}
          </div>
          <h2
            style={{
              color: "#2C1E15",
              fontSize: "clamp(1.6rem, 3vw, 2.3rem)",
              fontWeight: 900,
              marginBottom: 12,
            }}
          >
            {isAr ? "ميزات لا تجدها في أي مكان آخر" : "Features you won't find anywhere else"}
          </h2>
          <p
            style={{
              color: "#634E40",
              fontSize: 15,
              maxWidth: 480,
              margin: "0 auto",
              lineHeight: 1.75,
            }}
          >
            {isAr
              ? "بنينا المنصة بفهم عميق لسوق الإعلانات السعودي وتحدياته الحقيقية"
              : "Built with deep understanding of the Saudi advertising market and its real challenges"}
          </p>
        </div>

        {/* Why cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
          gap: 20,
        }}>
          {whyCards.map((w) => (
            <div
              key={w.id}
              style={{
                background: colors.sectionCream,
                border: "1px solid rgba(74,53,37,0.12)",
                borderRadius: 16,
                padding: "32px 28px",
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <IconDisplay value={w.icon} size={36} />
              </div>
              <h3
                style={{
                  color: "#2C1E15",
                  fontSize: 17,
                  fontWeight: 800,
                  marginBottom: 10,
                  lineHeight: 1.3,
                }}
              >
                {isAr ? w.titleAr : w.titleEn}
              </h3>
              <p style={{ color: "#5A3E28", fontSize: 13.5, lineHeight: 1.8 }}>
                {isAr ? w.descAr : w.descEn}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
