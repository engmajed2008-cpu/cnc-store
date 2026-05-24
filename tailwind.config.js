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
        arabic: ["'Cairo'", "'Noto Kufi Arabic'", "sans-serif"],
        english: ["'Syne'", "'Space Grotesk'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        brand: {
          gold: "#C9A84C",
          "gold-light": "#E8C97A",
          "gold-dark": "#9A7A30",
          charcoal: "#1A1A1A",
          steel: "#2D2D2D",
          silver: "#8A8A8A",
          "off-white": "#F5F3EE",
          cream: "#FAF8F3",
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
      backgroundImage: {
        "gold-gradient":
          "linear-gradient(135deg, #C9A84C 0%, #E8C97A 50%, #C9A84C 100%)",
        "dark-gradient":
          "linear-gradient(180deg, #1A1A1A 0%, #2D2D2D 100%)",
        "mesh-gold":
          "radial-gradient(at 40% 20%, #C9A84C22 0px, transparent 50%), radial-gradient(at 80% 0%, #E8C97A11 0px, transparent 50%), radial-gradient(at 0% 50%, #9A7A3011 0px, transparent 50%)",
      },
    },
  },
  plugins: [],
};
