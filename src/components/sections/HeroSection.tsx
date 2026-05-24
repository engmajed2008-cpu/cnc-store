"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";
import type { Locale } from "@/lib/i18n";

// ── Slide data ──────────────────────────────────────────────
const slides = [
  {
    id: "cnc",
    label: "CNC",
    bg: "from-[#0a0d08] via-[#131a0d] to-[#090c07]",
    accent: "#4CAF50",
    svgPattern: `
      <defs>
        <pattern id="cnc-g" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M0 0h50v50H0z" fill="none" stroke="#C9A84C" stroke-width=".35" opacity=".35"/>
          <circle cx="0" cy="0" r="1.5" fill="#C9A84C" opacity=".5"/>
          <circle cx="50" cy="0" r="1.5" fill="#C9A84C" opacity=".5"/>
          <circle cx="0" cy="50" r="1.5" fill="#C9A84C" opacity=".5"/>
          <circle cx="50" cy="50" r="1.5" fill="#C9A84C" opacity=".5"/>
        </pattern>
      </defs>
      <rect width="600" height="700" fill="url(#cnc-g)"/>
      <circle cx="300" cy="350" r="110" fill="none" stroke="#C9A84C" stroke-width="1.5" stroke-dasharray="8 4" opacity=".45"/>
      <circle cx="300" cy="350" r="80" fill="none" stroke="#E8C97A" stroke-width="1" opacity=".4"/>
      <circle cx="300" cy="350" r="28" fill="#0d120a" stroke="#C9A84C" stroke-width="2" opacity=".85"/>
      <circle cx="300" cy="350" r="9" fill="#C9A84C" opacity=".9"/>
      <line x1="190" y1="350" x2="272" y2="350" stroke="#C9A84C" stroke-width="1" opacity=".5"/>
      <line x1="328" y1="350" x2="410" y2="350" stroke="#C9A84C" stroke-width="1" opacity=".5"/>
      <line x1="300" y1="240" x2="300" y2="322" stroke="#C9A84C" stroke-width="1" opacity=".5"/>
      <line x1="300" y1="378" x2="300" y2="460" stroke="#C9A84C" stroke-width="1" opacity=".5"/>
      <g stroke="#C9A84C" stroke-width="1.5" opacity=".55">
        <line x1="300" y1="240" x2="300" y2="220"/>
        <line x1="378" y1="272" x2="392" y2="258"/>
        <line x1="410" y1="350" x2="430" y2="350"/>
        <line x1="378" y1="428" x2="392" y2="442"/>
        <line x1="300" y1="460" x2="300" y2="480"/>
        <line x1="222" y1="428" x2="208" y2="442"/>
        <line x1="190" y1="350" x2="170" y2="350"/>
        <line x1="222" y1="272" x2="208" y2="258"/>
      </g>
      <path d="M100 560 L200 520 L300 540 L400 500 L500 530" fill="none" stroke="#C9A84C" stroke-width="1" opacity=".3" stroke-dasharray="5 3"/>
    `,
  },
  {
    id: "decor",
    label: "DECOR",
    bg: "from-[#080d12] via-[#0d1520] to-[#060a0e]",
    accent: "#60B4D8",
    svgPattern: `
      <defs>
        <pattern id="arab" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M40 0 L80 40 L40 80 L0 40Z" fill="none" stroke="#C9A84C" stroke-width=".4" opacity=".25"/>
          <circle cx="40" cy="40" r="24" fill="none" stroke="#E8C97A" stroke-width=".35" opacity=".25"/>
          <circle cx="40" cy="40" r="10" fill="none" stroke="#C9A84C" stroke-width=".35" opacity=".3"/>
        </pattern>
      </defs>
      <rect width="600" height="700" fill="url(#arab)"/>
      <g transform="translate(300,350)">
        <circle r="120" fill="none" stroke="#C9A84C" stroke-width=".8" opacity=".25"/>
        <polygon points="0,-100 29,-29 100,0 29,29 0,100 -29,29 -100,0 -29,-29" fill="none" stroke="#E8C97A" stroke-width="1.5" opacity=".55"/>
        <polygon points="0,-70 20,-20 70,0 20,20 0,70 -20,20 -70,0 -20,-20" fill="none" stroke="#C9A84C" stroke-width="1" opacity=".45"/>
        <circle r="30" fill="#080d12" stroke="#C9A84C" stroke-width="1.5" opacity=".9"/>
        <circle r="12" fill="#C9A84C" opacity=".75"/>
        <circle r="4" fill="#E8C97A" opacity=".9"/>
      </g>
    `,
  },
  {
    id: "ads",
    label: "ADS",
    bg: "from-[#0e080d] via-[#180d18] to-[#0a060a]",
    accent: "#D460B8",
    svgPattern: `
      <defs>
        <pattern id="dp" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="11" cy="11" r="1.8" fill="#C9A84C" opacity=".14"/>
        </pattern>
      </defs>
      <rect width="600" height="700" fill="url(#dp)"/>
      <rect x="80" y="150" width="440" height="260" rx="12" fill="none" stroke="#C9A84C" stroke-width="2" opacity=".45"/>
      <rect x="100" y="170" width="400" height="220" rx="8" fill="rgba(201,168,76,.03)" stroke="#E8C97A" stroke-width="1" opacity=".35"/>
      <text x="300" y="273" text-anchor="middle" font-family="JetBrains Mono" font-size="52" font-weight="700" fill="#E8C97A" opacity=".65">METAL</text>
      <text x="300" y="335" text-anchor="middle" font-family="JetBrains Mono" font-size="52" font-weight="700" fill="#C9A84C" opacity=".55">ART</text>
      <line x1="120" y1="415" x2="480" y2="415" stroke="#C9A84C" stroke-width=".5" opacity=".25"/>
      <circle cx="300" cy="445" r="12" fill="none" stroke="#C9A84C" stroke-width="1" opacity=".35"/>
      <line x1="300" y1="457" x2="300" y2="480" stroke="#C9A84C" stroke-width="1" opacity=".35"/>
      <path d="M200 500 Q230 540 270 530" fill="none" stroke="#C9A84C" stroke-width="1" opacity=".25" stroke-dasharray="4 3"/>
      <path d="M400 500 Q370 540 330 530" fill="none" stroke="#C9A84C" stroke-width="1" opacity=".25" stroke-dasharray="4 3"/>
    `,
  },
  {
    id: "art",
    label: "PANELS",
    bg: "from-[#0d0e08] via-[#151608] to-[#0a0b06]",
    accent: "#D4A840",
    svgPattern: `
      <defs>
        <linearGradient id="mg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#9A7A30"/>
          <stop offset="50%" stop-color="#E8C97A"/>
          <stop offset="100%" stop-color="#9A7A30"/>
        </linearGradient>
      </defs>
      <g opacity=".15">
        <line x1="0" y1="70" x2="600" y2="70" stroke="#C9A84C" stroke-width=".6"/>
        <line x1="0" y1="140" x2="600" y2="140" stroke="#C9A84C" stroke-width=".6"/>
        <line x1="0" y1="210" x2="600" y2="210" stroke="#C9A84C" stroke-width=".6"/>
        <line x1="0" y1="280" x2="600" y2="280" stroke="#C9A84C" stroke-width=".6"/>
        <line x1="0" y1="350" x2="600" y2="350" stroke="#C9A84C" stroke-width=".6"/>
        <line x1="0" y1="420" x2="600" y2="420" stroke="#C9A84C" stroke-width=".6"/>
        <line x1="0" y1="490" x2="600" y2="490" stroke="#C9A84C" stroke-width=".6"/>
        <line x1="0" y1="560" x2="600" y2="560" stroke="#C9A84C" stroke-width=".6"/>
        <line x1="0" y1="630" x2="600" y2="630" stroke="#C9A84C" stroke-width=".6"/>
      </g>
      <rect x="110" y="120" width="380" height="460" rx="5" fill="none" stroke="url(#mg)" stroke-width="2" opacity=".6"/>
      <rect x="130" y="140" width="340" height="420" rx="3" fill="none" stroke="#C9A84C" stroke-width=".6" opacity=".3"/>
      <g stroke="#E8C97A" stroke-width="1.5" fill="none" opacity=".6">
        <path d="M110 145 L110 120 L135 120"/>
        <path d="M490 145 L490 120 L465 120"/>
        <path d="M110 555 L110 580 L135 580"/>
        <path d="M490 555 L490 580 L465 580"/>
      </g>
      <polygon points="300,220 355,350 300,480 245,350" fill="none" stroke="url(#mg)" stroke-width="2" opacity=".7"/>
      <circle cx="300" cy="350" r="22" fill="#0d0e08" stroke="#E8C97A" stroke-width="1.5" opacity=".95"/>
      <circle cx="300" cy="350" r="8" fill="#E8C97A" opacity=".85"/>
    `,
  },
];

// ── Particle component ──────────────────────────────────────
function Particle({ style }: { style: React.CSSProperties }) {
  return <div className="absolute w-1 h-1 rounded-full bg-brand-gold" style={style} />;
}

export function HeroSection() {
  const t = useTranslations("hero");
  const tStats = useTranslations("stats");
  const locale = useLocale() as Locale;
  const isRTL = locale === "ar";
  const [activeSlide, setActiveSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stats = [
    { value: "+500", label: tStats("projects") },
    { value: "+200", label: tStats("clients") },
    { value: "8", label: tStats("years") },
    { value: "+15", label: tStats("materials") },
  ];

  // Auto advance slides
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const goToSlide = (idx: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveSlide(idx);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    setTimeout(() => setIsAnimating(false), 600);
  };

  // Generate stable particles
  const particles = Array.from({ length: 12 }, (_, i) => ({
    left: `${10 + (i * 7.3) % 80}%`,
    top: `${15 + (i * 6.1) % 70}%`,
    opacity: 0.2 + (i % 5) * 0.1,
    animationDuration: `${3 + (i % 4)}s`,
    animationDelay: `${(i * 0.4) % 3}s`,
    animationIterationCount: "infinite" as const,
    animationDirection: i % 2 === 0 ? "alternate" as const : "alternate-reverse" as const,
    animationName: "heroFloat",
  }));

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* ── Background layers ── */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111108] to-[#080808]" />
        
        {/* CNC grid overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(201,168,76,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,.035) 1px,transparent 1px)",
            backgroundSize: "65px 65px",
            maskImage: "radial-gradient(ellipse 90% 90% at 50% 50%,black 20%,transparent 100%)",
          }}
        />

        {/* Gold glow orbs */}
        <div className="absolute w-[700px] h-[700px] rounded-full top-[-200px] -right-[200px] opacity-[0.07]"
          style={{ background: "radial-gradient(circle,#C9A84C 0%,transparent 65%)", animation: "glow1 10s ease-in-out infinite alternate" }} />
        <div className="absolute w-[500px] h-[500px] rounded-full bottom-0 left-[5%] opacity-[0.05]"
          style={{ background: "radial-gradient(circle,#C9A84C 0%,transparent 65%)", animation: "glow2 13s ease-in-out infinite alternate" }} />

        {/* Decorative rings */}
        <div className="absolute top-[-200px] right-[-200px] w-[700px] h-[700px] rounded-full border border-brand-gold/[0.05] pointer-events-none"
          style={{ animation: "spin 70s linear infinite" }} />
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full border border-dashed border-brand-gold/[0.04] pointer-events-none"
          style={{ animation: "spin 45s linear infinite reverse" }} />

        {/* Floating particles */}
        <style>{`
          @keyframes heroFloat { 0%{transform:translateY(0) scale(1);opacity:.2} 100%{transform:translateY(-22px) scale(1.4);opacity:.6} }
          @keyframes glow1 { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(-50px,60px) scale(1.2)} }
          @keyframes glow2 { 0%{transform:translate(0,0)} 100%{transform:translate(60px,-40px) scale(1.15)} }
          @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          @keyframes slideStripIn { from{opacity:0;transform:scale(1.08)} to{opacity:1;transform:scale(1)} }
          @keyframes countUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        `}</style>
        {particles.map((s, i) => <Particle key={i} style={s} />)}
      </div>

      {/* ── Image strip (desktop) ── */}
      <div
        className={clsx(
          "absolute top-0 bottom-0 hidden md:block w-[44%] overflow-hidden",
          isRTL
            ? "right-0 [clip-path:polygon(8%_0,100%_0,100%_100%,0%_100%)]"
            : "left-0 [clip-path:polygon(0_0,92%_0,100%_100%,0_100%)]"
        )}
      >
        {/* Slides */}
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={clsx(
              "absolute inset-0 transition-opacity duration-700",
              idx === activeSlide ? "opacity-100" : "opacity-0"
            )}
          >
            <div className={clsx("absolute inset-0 bg-gradient-to-br", slide.bg)} />
            <svg
              viewBox="0 0 600 700"
              className="absolute inset-0 w-full h-full"
              style={{ animation: idx === activeSlide ? "slideStripIn .7s ease-out" : "none" }}
              dangerouslySetInnerHTML={{ __html: slide.svgPattern }}
            />
            {/* Edge fade toward content */}
            <div className={clsx(
              "absolute inset-0",
              isRTL
                ? "bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent"
                : "bg-gradient-to-l from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent"
            )} />
          </div>
        ))}

        {/* Slide label */}
        <div className={clsx(
          "absolute top-8 flex items-center gap-2 z-10",
          isRTL ? "left-8" : "right-8"
        )}>
          <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
          <span className="text-brand-gold text-xs font-mono tracking-[0.2em] uppercase">
            {slides[activeSlide].label}
          </span>
        </div>

        {/* Dots inside strip */}
        <div className={clsx(
          "absolute bottom-8 flex gap-1.5 items-center z-10",
          isRTL ? "left-8" : "right-8"
        )}>
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={clsx(
                "h-1.5 rounded-full transition-all duration-400 border-none cursor-pointer",
                idx === activeSlide
                  ? "w-6 bg-brand-gold"
                  : "w-1.5 bg-brand-gold/30 hover:bg-brand-gold/60"
              )}
            />
          ))}
        </div>
      </div>

      {/* ── Hero content ── */}
      <div className="section-container relative z-10 w-full pt-28 pb-16 md:pt-36 md:pb-20">
        <div
          className={clsx(
            "md:w-[58%]",
            isRTL ? "md:ms-[44%] text-right" : "md:ms-0 text-left",
            "w-full"
          )}
        >
          {/* Badge */}
          <div
            className={clsx(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full mb-7",
              "border border-brand-gold/30 bg-brand-gold/[0.08]",
              "animate-fade-up opacity-0 stagger-1",
              isRTL ? "flex-row-reverse" : "flex-row"
            )}
            style={{ animationFillMode: "forwards" }}
          >
            <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
            <span className="text-brand-gold text-[0.8rem] font-medium tracking-wide">
              {t("badge")}
            </span>
          </div>

          {/* Title */}
          <h1
            className="mb-5 animate-fade-up opacity-0 stagger-2 font-black leading-[1.08]"
            style={{ fontSize: "clamp(2.1rem,5.5vw,4.4rem)", animationFillMode: "forwards" }}
          >
            <span className="block text-brand-off-white">{t("title")}</span>
            <span
              className="block mt-1 text-gold-gradient"
              style={{ animationFillMode: "forwards" }}
            >
              {t("titleHighlight")}
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-brand-silver leading-[1.85] mb-9 animate-fade-up opacity-0 stagger-3"
            style={{ fontSize: "clamp(.9rem,1.6vw,1.05rem)", animationFillMode: "forwards" }}
          >
            {t("subtitle")}
          </p>

          {/* CTAs */}
          <div
            className={clsx(
              "flex flex-wrap gap-3.5 mb-12 animate-fade-up opacity-0 stagger-4",
              isRTL ? "flex-row-reverse" : "flex-row"
            )}
            style={{ animationFillMode: "forwards" }}
          >
            <Link
              href={`/${locale}/contact`}
              className="btn-primary group text-[0.95rem] font-bold"
            >
              {isRTL ? "اطلب الآن" : "Order Now"}
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                className={clsx("transition-transform duration-200 group-hover:translate-x-1", isRTL && "rotate-180")}
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>

            <Link
              href={`/${locale}/portfolio`}
              className="btn-secondary text-[0.95rem] group"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="opacity-70">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              {t("ctaSecondary")}
            </Link>
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-5 pt-7 border-t border-brand-gold/[0.12] animate-fade-up opacity-0 stagger-5"
            style={{ animationFillMode: "forwards" }}
          >
            {stats.map(({ value, label }) => (
              <div key={label} className="space-y-0.5">
                <span
                  className="block font-black text-gold-gradient"
                  style={{ fontSize: "clamp(1.6rem,3vw,2.3rem)" }}
                >
                  {value}
                </span>
                <span className="block text-brand-silver text-xs leading-snug">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 animate-fade-in opacity-0 stagger-6" style={{ animationFillMode: "forwards" }}>
        <span className="text-brand-silver/60 text-[0.6rem] tracking-[0.18em] uppercase font-mono">
          {t("scrollDown")}
        </span>
        <div className="w-6 h-9 rounded-xl border border-brand-gold/30 flex items-start justify-center pt-1.5">
          <div className="w-1 h-2.5 bg-brand-gold rounded-full" style={{ animation: "scrollDot 2s ease-in-out infinite" }} />
        </div>
        <style>{`@keyframes scrollDot{0%{transform:translateY(0);opacity:1}100%{transform:translateY(10px);opacity:0}}`}</style>
      </div>
    </section>
  );
}
