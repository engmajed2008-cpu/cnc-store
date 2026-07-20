"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { siteStore, DEFAULT_SLIDES, DEFAULT_CONTACT, type Slide } from "@/store/siteStore";

const G = "linear-gradient(135deg,#9A7B36 0%,#E6CA83 50%,#F7E7C4 100%)";

export default function HeroSlider({ locale }: { locale: string }) {
  const ar = locale === "ar";
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [whatsapp, setWhatsapp] = useState(DEFAULT_CONTACT.whatsapp);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const loaded = siteStore.getSlides();
    setSlides(loaded.length > 0 ? loaded : DEFAULT_SLIDES);
    setWhatsapp(siteStore.getContact().whatsapp || DEFAULT_CONTACT.whatsapp);
  }, []);

  const goTo = useCallback((index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent(index);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating]);

  const next = useCallback(() => goTo((current + 1) % slides.length), [current, goTo, slides.length]);
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, goTo, slides.length]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  if (slides.length === 0) return null;
  const slide = slides[current];

  return (
    <div
      dir={ar ? "rtl" : "ltr"}
      style={{
        position: "relative", width: "100%", height: isMobile ? "440px" : "520px",
        overflow: "hidden",
        background: "linear-gradient(135deg,#2C1E15 0%,#1E140D 100%)",
        transition: "background 0.6s ease", fontFamily: "Tajawal, Cairo, sans-serif",
      }}
    >
      {/* Background grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(201,162,75,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(201,162,75,0.03) 1px,transparent 1px)",
        backgroundSize: "50px 50px",
      }} />

      {/* Gold glow */}
      <div style={{
        position: "absolute", top: -200, [ar ? "right" : "left"]: -200,
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(201,162,75,0.12) 0%,transparent 70%)",
        pointerEvents: "none", transition: "all 0.6s ease",
      }} />

      {/* Full-width background image */}
      {slide.image && (
        <>
          <img
            src={slide.image}
            alt={slide.title}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover",
              opacity: isAnimating ? 0 : 1,
              transition: "opacity 0.6s ease",
            }}
          />
          {/* Dark overlay — strong on right for AR, strong on left for EN */}
          <div style={{
            position: "absolute", inset: 0,
            background: isMobile
              ? "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.72) 100%)"
              : ar
              ? "linear-gradient(to right, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.88) 100%)"
              : "linear-gradient(to left, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.88) 100%)",
          }} />
        </>
      )}

      {/* Content \u2014 right side for Arabic, left side for English */}
      <div style={{
        position: "absolute",
        top: 0, bottom: 0,
        [ar ? "right" : "left"]: 0,
        width: isMobile ? "100%" : "45%",
        display: "flex", flexDirection: "column",
        justifyContent: isMobile ? "flex-end" : "center",
        alignItems: isMobile ? "center" : "flex-start",
        textAlign: isMobile ? "center" : ar ? "right" : "left",
        padding: isMobile ? "2rem 1rem 3.6rem" : "3rem 4rem",
        opacity: isAnimating ? 0 : 1,
        transform: isAnimating ? ("translateX(" + (ar ? "20px" : "-20px") + ")") : "translateX(0)",
        transition: "all 0.6s ease",
      }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          padding: "0.35rem 1rem", borderRadius: 999,
          background: "rgba(201,162,75,0.12)", border: "1px solid rgba(201,162,75,0.3)",
          marginBottom: isMobile ? "0.9rem" : "1.5rem", width: "fit-content",
          alignSelf: isMobile ? "center" : "flex-start",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C9A24B", display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700 }}>{ar ? slide.badge : (slide.badgeEn || slide.badge)}</span>
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: isMobile ? "1.45rem" : "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 900,
          lineHeight: 1.15, color: "#F4ECDD", margin: "0 0 1rem 0",
          textShadow: "0 2px 18px rgba(0,0,0,0.45)",
        }}>
          {ar ? slide.title : (slide.titleEn || slide.title)}
        </h2>

        {/* Subtitle */}
        <p style={{ color: slide.image ? "rgba(255,255,255,0.88)" : "rgba(244,236,221,0.82)", lineHeight: 1.8, maxWidth: 420, margin: isMobile ? "0 0 1.2rem 0" : "0 0 2rem 0", fontSize: isMobile ? "0.88rem" : "1rem" }}>
          {ar ? slide.subtitle : (slide.subtitleEn || slide.subtitle)}
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: isMobile ? "center" : ar ? "flex-end" : "flex-start" }}>
          <Link
            href={"/" + locale + slide.href}
            className="btn-shine btn-shine-gold"
            style={{
              padding: "0.85rem 2rem", borderRadius: 999, fontWeight: 700, fontSize: "0.9rem",
              background: G, color: "#2C1E15", textDecoration: "none",
              boxShadow: "0 6px 24px rgba(197,160,89,0.3)",
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {ar ? slide.ctaAr : slide.ctaEn}
          </Link>
          <a
            href={"https://wa.me/" + whatsapp}
            target="_blank" rel="noopener noreferrer"
            className="btn-shine btn-shine-outline"
            style={{
              padding: "0.85rem 1.5rem", borderRadius: 999, fontSize: "0.9rem",
              border: "1.5px solid rgba(201,162,75,0.3)", color: "#EBCB7C", textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
            </svg>
            {ar ? "\u0648\u0627\u062a\u0633\u0627\u0628" : "WhatsApp"}
          </a>
        </div>
      </div>

      {/* Prev button */}
      <button onClick={prev} style={{
        position: "absolute", top: isMobile ? "38%" : "50%", [ar ? "right" : "left"]: isMobile ? "0.5rem" : "1rem",
        transform: "translateY(-50%)", width: isMobile ? 34 : 44, height: isMobile ? 34 : 44, borderRadius: "50%",
        background: "rgba(201,162,75,0.1)", border: "1.5px solid rgba(201,162,75,0.3)",
        color: "#C9A24B", fontSize: "1.1rem", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10,
      }}>
        {ar ? "\u276f" : "\u276e"}
      </button>

      {/* Next button */}
      <button onClick={next} style={{
        position: "absolute", top: isMobile ? "38%" : "50%", [ar ? "left" : "right"]: isMobile ? "0.5rem" : "1rem",
        transform: "translateY(-50%)", width: isMobile ? 34 : 44, height: isMobile ? 34 : 44, borderRadius: "50%",
        background: "rgba(201,162,75,0.1)", border: "1.5px solid rgba(201,162,75,0.3)",
        color: "#C9A24B", fontSize: "1.1rem", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10,
      }}>
        {ar ? "\u276e" : "\u276f"}
      </button>

      {/* Dots */}
      <div style={{
        position: "absolute", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)",
        display: "flex", gap: "0.5rem", zIndex: 10,
      }}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{
            width: i === current ? 24 : 8, height: 8, borderRadius: 999,
            background: i === current ? "#C9A24B" : "rgba(201,162,75,0.3)",
            border: "none", cursor: "pointer", transition: "all 0.3s ease", padding: 0,
          }} />
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(201,162,75,0.1)" }}>
        <div style={{
          height: "100%", background: "linear-gradient(135deg,#C9A24B,#EBCB7C)",
          width: ((current + 1) / slides.length * 100) + "%",
          transition: "width 0.3s ease",
        }} />
      </div>

      <style dangerouslySetInnerHTML={{ __html: "@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }" }} />
    </div>
  );
}
