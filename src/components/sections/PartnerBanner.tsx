"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { siteStore, DEFAULT_PARTNER_BANNER, DEFAULT_COLORS, type PartnerBannerData, type SiteColors } from "@/store/siteStore";

export default function PartnerBanner({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [d, setD]           = useState<PartnerBannerData>(DEFAULT_PARTNER_BANNER);
  const [colors, setColors] = useState<SiteColors>(DEFAULT_COLORS);

  useEffect(() => {
    const stored = siteStore.getPartnerBanner();
    if (stored) setD(stored);
    setColors(siteStore.getColors());
  }, []);

  const badge    = isAr ? d.badgeAr    : d.badgeEn;
  const title    = isAr ? d.titleAr    : d.titleEn;
  const desc     = isAr ? d.descAr     : d.descEn;
  const benefits = isAr ? d.benefitsAr : d.benefitsEn;
  const cta      = isAr ? d.ctaAr      : d.ctaEn;
  const note     = isAr ? d.noteAr     : d.noteEn;

  return (
    <section
      dir={isAr ? "rtl" : "ltr"}
      style={{ background: colors.sectionDark, padding: "0 24px 80px" }}
    >
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        background: colors.sectionCream,
        border: "1px solid rgba(74,53,37,0.15)",
        borderRadius: 20, padding: "56px 48px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative arcs */}
        <div style={{ position: "absolute", top: "50%", [isAr ? "left" : "right"]: -120, transform: "translateY(-50%)", width: 400, height: 400, borderRadius: "50%", border: "1px solid rgba(74,53,37,0.07)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", [isAr ? "left" : "right"]: -60,  transform: "translateY(-50%)", width: 260, height: 260, borderRadius: "50%", border: "1px solid rgba(74,53,37,0.05)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40, flexWrap: "wrap", position: "relative" }}>

          {/* Text side */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <span style={{ display: "inline-block", background: "rgba(201,162,75,0.12)", border: "1px solid rgba(201,162,75,0.28)", borderRadius: 999, padding: "4px 16px", fontSize: 11, color: "#C9A24B", fontWeight: 700, letterSpacing: "0.09em", marginBottom: 14 }}>
              {badge}
            </span>
            <h2 style={{ color: "#2C1E15", fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 900, marginBottom: 12, lineHeight: 1.25 }}>
              {title}
            </h2>
            <p style={{ color: "#5A3E28", fontSize: 14.5, lineHeight: 1.75, maxWidth: 500 }}>
              {desc}
            </p>
            <div style={{ display: "flex", gap: 20, marginTop: 20, flexWrap: "wrap" }}>
              {benefits.map((b) => (
                <span key={b} style={{ fontSize: 12.5, color: "#9A6A2A", fontWeight: 700 }}>{b}</span>
              ))}
            </div>
          </div>

          {/* CTA side */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: isAr ? "flex-start" : "flex-end", gap: 12, flexShrink: 0 }}>
            <Link
              href={`/${locale}${d.ctaHref}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "15px 36px", borderRadius: 12, background: "linear-gradient(135deg,#C9A24B,#B38F3A)", color: "#2C1E15", fontSize: 15, fontWeight: 900, textDecoration: "none", boxShadow: "0 6px 24px rgba(201,162,75,0.3)", transition: "transform 0.2s,box-shadow 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 32px rgba(201,162,75,0.4)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(201,162,75,0.3)"; }}
            >
              <span>{cta}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d={isAr ? "M19 12H5m7 7-7-7 7-7" : "M5 12h14m-7-7 7 7-7 7"} />
              </svg>
            </Link>
            <span style={{ fontSize: 12, color: "#6B5040", textAlign: isAr ? "start" : "end" }}>{note}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
