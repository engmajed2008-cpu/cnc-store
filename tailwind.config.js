/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        arabic: ["'Tajawal'", "'Cairo'", "'Noto Kufi Arabic'", "sans-serif"],
        english: ["'Tajawal'", "'Syne'", "'Space Grotesk'", "sans-serif"],
        sans: ["'Tajawal'", "'Cairo'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        // لوحة هوية «إعلاني» الفاخرة الفاتحة (كريمي/بني/ذهبي) — قاعدة 60-30-10
        brand: {
          gold: "#C9A24B",
          "gold-light": "#E6CA83",
          "gold-dark": "#9A7B36",
          charcoal: "#2C1E15",      // بني داكن فاخر — للنصوص والعناوين ونص الأزرار
          steel: "#ECE3D2",         // كريمي دافئ — للأسطح والبطاقات (كان داكناً)
          silver: "#634E40",        // بني متوسط — النصوص الفرعية
          "off-white": "#2C1E15",   // كان كريمياً (نص فاتح)؛ الآن نص بني داكن على خلفية فاتحة
          cream: "#FDFBF7",         // كريمي فاتح ناعم — الخلفية العامة
          "cream-warm": "#F4EFE6",  // كريمي دافئ — Sidebar / Cards / Tables
        },
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        shimmer: "shimmer 2s infinite",
        "slide-in-rtl": "slideInRTL 0.5s ease-out forwards",
        "slide-in-ltr": "slideInLTR 0.5s ease-out forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        slideInRTL: {
          "0%": { opacity: "0", transform: "translateX(32px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInLTR: {
          "0%": { opacity: "0", transform: "translateX(-32px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      boxShadow: {
        "gold-glow": "0 8px 30px rgba(197,160,89,0.25)",
        soft: "0 4px 18px rgba(44,30,21,0.06)",
      },
      backgroundImage: {
        // تدرّج معدني ذهبي للأزرار الرئيسية
        "gold-gradient":
          "linear-gradient(135deg, #9A7B36 0%, #E6CA83 50%, #F7E7C4 100%)",
        // قسم بني داكن فاخر (للأقسام المميزة / الفوتر)
        "dark-gradient":
          "linear-gradient(180deg, #2C1E15 0%, #1E140D 100%)",
        // إضاءة كريمية ناعمة على الخلفية الفاتحة
        "mesh-gold":
          "radial-gradient(at 40% 20%, rgba(201,162,75,0.10) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(230,202,131,0.08) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(154,123,54,0.06) 0px, transparent 50%)",
      },
    },
  },
  plugins: [],
};
