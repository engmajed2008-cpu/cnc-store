"use client";
import { useState, useRef, useEffect } from "react";
import { siteStore, DEFAULT_COLORS, type SiteColors } from "@/store/siteStore";

const G  = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

// ─── Preset palettes ──────────────────────────────────────────────────────────

const CREAM_PRESETS = [
  { hex: "#E2CFA8", label: "الكريمي الرئيسي" },
  { hex: "#F4EFE6", label: "كريمي فاتح جداً" },
  { hex: "#EBD9AA", label: "كريمي دافئ" },
  { hex: "#EBCB7C", label: "ذهبي فاتح" },
  { hex: "#E8D5B0", label: "لبني دافئ" },
  { hex: "#F0E0C0", label: "عاجي فاتح" },
  { hex: "#F5F0E8", label: "أبيض كريمي" },
  { hex: "#EDE0C4", label: "قمحي فاتح" },
  { hex: "#D9C490", label: "كريمي داكن" },
  { hex: "#C8B87E", label: "كريمي بني" },
  { hex: "#D4A85C", label: "ذهبي متوسط" },
  { hex: "#C9A24B", label: "ذهبي إعلاني" },
  { hex: "#BEA870", label: "ذهبي خافت" },
  { hex: "#CC7A40", label: "برتقالي بني" },
  { hex: "#9A7440", label: "بني ذهبي" },
  { hex: "#B89A60", label: "ذهبي عتيق" },
  { hex: "#D4C4A0", label: "رملي فاتح" },
  { hex: "#F2E8D0", label: "حليبي دافئ" },
  { hex: "#E0D0B0", label: "خيزران فاتح" },
  { hex: "#C4B090", label: "تراب فاتح" },
];
const DARK_PRESETS = [
  { hex: "#F4EFE6", label: "البني الرئيسي" },
  { hex: "#F4EFE6", label: "بني متوسط" },
  { hex: "#F4EFE6", label: "بني معتدل" },
  { hex: "#ECE3D2", label: "بني محمر" },
  { hex: "#2E1A0E", label: "بني عميق" },
  { hex: "#3D1A08", label: "برتقالي داكن" },
  { hex: "#4A2010", label: "بني محروق" },
  { hex: "#3A2808", label: "كهرماني داكن" },
  { hex: "#1C0E07", label: "بني برتقالي" },
  { hex: "#1A0E08", label: "بني جداً داكن" },
  { hex: "#F4EFE6", label: "أسود دافئ" },
  { hex: "#0F0A05", label: "بني أعمق" },
  { hex: "#0A0704", label: "أسود دافئ عميق" },
  { hex: "#0D0B08", label: "شبه أسود دافئ" },
  { hex: "#1E1814", label: "بني رمادي" },
  { hex: "#160E0A", label: "بني قاتم" },
  { hex: "#2C1A10", label: "شوكولاتة" },
  { hex: "#3A1408", label: "صدأ داكن" },
  { hex: "#200C06", label: "قهوة محروقة" },
  { hex: "#080604", label: "شبه أسود" },
];
const PAGE_PRESETS = [
  { hex: "#FDFBF7", label: "الرئيسي" },
  { hex: "#F4EFE6", label: "أعمق" },
  { hex: "#F4EFE6", label: "بني" },
  { hex: "#1C1208", label: "بني داكن" },
  { hex: "#1A1510", label: "بني رمادي" },
  { hex: "#18140E", label: "بني معتم" },
  { hex: "#150F08", label: "بني عميق" },
  { hex: "#120D08", label: "قهوة داكنة" },
  { hex: "#100C07", label: "داكن جداً" },
  { hex: "#0F0A05", label: "بني أعمق" },
  { hex: "#F4EFE6", label: "أسود دافئ" },
  { hex: "#1C0E07", label: "بني برتقالي" },
  { hex: "#0D0D0D", label: "رمادي داكن" },
  { hex: "#111111", label: "أسود رمادي" },
  { hex: "#0D0B09", label: "شبه أسود دافئ" },
  { hex: "#080604", label: "شبه أسود" },
  { hex: "#FDFBF7", label: "بني عتيق" },
  { hex: "#160E0A", label: "بني قاتم" },
  { hex: "#2A1A10", label: "بني متوسط" },
  { hex: "#0C0A08", label: "أسود دافئ عميق" },
];
const NAV_PRESETS = [
  { hex: "#F4EFE6", label: "الرئيسي" },
  { hex: "#F4EFE6", label: "بني معتدل" },
  { hex: "#ECE3D2", label: "بني محمر" },
  { hex: "#2E2018", label: "بني فاتح" },
  { hex: "#F4EFE6", label: "بني داكن" },
  { hex: "#F4EFE6", label: "أعمق" },
  { hex: "#2C1E12", label: "بني عميق" },
  { hex: "#3A2A1A", label: "بني فاتح جداً" },
  { hex: "#1E1814", label: "بني رمادي" },
  { hex: "#1C0E07", label: "بني برتقالي" },
  { hex: "#3D1A08", label: "برتقالي داكن" },
  { hex: "#4A2810", label: "بني محروق" },
  { hex: "#140E09", label: "بني عميق" },
  { hex: "#0F0A05", label: "أسود دافئ" },
  { hex: "#0D0A06", label: "شبه أسود" },
  { hex: "#1E1612", label: "بني رمادي معتدل" },
  { hex: "#28200C", label: "زيتوني داكن" },
  { hex: "#200C0C", label: "بني أحمر" },
  { hex: "#0A0808", label: "أسود دافئ شبه كامل" },
  { hex: "#FDFBF7", label: "كهرماني" },
];
const FOOTER_PRESETS = [
  { hex: "#F4EFE6", label: "الرئيسي" },
  { hex: "#F4EFE6", label: "بني دافئ" },
  { hex: "#0F0A05", label: "بني أعمق" },
  { hex: "#F4EFE6", label: "أسود دافئ" },
  { hex: "#0A0704", label: "أسود عميق" },
  { hex: "#080604", label: "شبه أسود" },
  { hex: "#F4EFE6", label: "بني متوسط" },
  { hex: "#ECE3D2", label: "بني محمر" },
  { hex: "#2E1A0E", label: "بني عميق" },
  { hex: "#1C0E07", label: "بني برتقالي" },
  { hex: "#3D1A08", label: "برتقالي داكن" },
  { hex: "#150D08", label: "داكن جداً" },
  { hex: "#1E1814", label: "بني رمادي" },
  { hex: "#0D0B09", label: "شبه أسود دافئ" },
  { hex: "#160C06", label: "بني قاتم" },
  { hex: "#2C1810", label: "شوكولاتة" },
  { hex: "#100808", label: "أسود محمر" },
  { hex: "#1A1510", label: "رمادي دافئ" },
  { hex: "#0C0906", label: "أسود دافئ عميق" },
  { hex: "#201408", label: "بني غامق" },
];

// ─── Theme packs ─────────────────────────────────────────────────────────────

const THEMES: { label: string; colors: SiteColors }[] = [
  { label: "الهوية الحالية",    colors: { sectionCream: "#E2CFA8", sectionDark: "#F4EFE6", pageBg: "#FDFBF7", navBg: "#F4EFE6", footerBg: "#F4EFE6" } },
  { label: "ذهبي فاتح",        colors: { sectionCream: "#F4EFE6", sectionDark: "#F4EFE6", pageBg: "#F4EFE6", navBg: "#F4EFE6", footerBg: "#F4EFE6" } },
  { label: "بني كلاسيكي",      colors: { sectionCream: "#D9C490", sectionDark: "#0F0A05", pageBg: "#F4EFE6", navBg: "#F4EFE6", footerBg: "#0F0A05" } },
  { label: "كريمي محمر",       colors: { sectionCream: "#EBD9AA", sectionDark: "#ECE3D2", pageBg: "#FDFBF7", navBg: "#ECE3D2", footerBg: "#FDFBF7" } },
  { label: "برتقالي دافئ",     colors: { sectionCream: "#CC7A40", sectionDark: "#3D1A08", pageBg: "#1C0E07", navBg: "#3D1A08", footerBg: "#1C0E07" } },
  { label: "ذهبي محروق",       colors: { sectionCream: "#D4A85C", sectionDark: "#2E1A0E", pageBg: "#150F08", navBg: "#2E1A0E", footerBg: "#0F0A05" } },
  { label: "داكن عميق",        colors: { sectionCream: "#C8B87E", sectionDark: "#0A0704", pageBg: "#080604", navBg: "#0F0A05", footerBg: "#0A0704" } },
  { label: "بني رمادي",        colors: { sectionCream: "#E8D5B0", sectionDark: "#1E1814", pageBg: "#1A1510", navBg: "#1E1814", footerBg: "#150D08" } },
  { label: "كهرماني",          colors: { sectionCream: "#EBCB7C", sectionDark: "#3A2808", pageBg: "#200C06", navBg: "#3A1408", footerBg: "#1C0E07" } },
  { label: "شوكولاتة",         colors: { sectionCream: "#E0D0B0", sectionDark: "#2C1A10", pageBg: "#160E0A", navBg: "#2C1E12", footerBg: "#100808" } },
  { label: "أسود ذهبي",        colors: { sectionCream: "#C9A24B", sectionDark: "#0D0B08", pageBg: "#0C0A08", navBg: "#140E09", footerBg: "#080604" } },
  { label: "صحراوي",           colors: { sectionCream: "#F5F0E8", sectionDark: "#2A1A10", pageBg: "#FDFBF7", navBg: "#F4EFE6", footerBg: "#150F08" } },
];

// ─── ColorCard ────────────────────────────────────────────────────────────────

function isValidHex(h: string) {
  return /^#[0-9a-fA-F]{6}$/.test(h);
}

function ColorCard({
  title, subtitle, value, onChange, presets, usedIn,
}: {
  title: string;
  subtitle: string;
  value: string;
  onChange: (v: string) => void;
  presets: { hex: string; label: string }[];
  usedIn: string[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(value);

  // keep draft in sync when value changes from parent (theme pack)
  useEffect(() => { setDraft(value); }, [value]);

  const commit = (hex: string) => {
    if (isValidHex(hex)) onChange(hex);
  };

  const isLight = (() => {
    const hex = value.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  })();

  return (
    <div style={{
      borderRadius: 18,
      border: "1px solid rgba(154,106,42,0.25)",
      background: "#F2E8D0",
      overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      {/* Big swatch */}
      <div
        style={{ height: 160, background: value, cursor: "pointer", position: "relative", transition: "background 0.25s", display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="color"
          value={isValidHex(value) ? value : "#000000"}
          onChange={e => { onChange(e.target.value); setDraft(e.target.value); }}
          style={{ position: "absolute", opacity: 0, width: 0, height: 0, border: "none" }}
        />
        <div style={{
          padding: "6px 14px", borderRadius: 999,
          background: isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)",
          fontSize: "0.72rem", fontWeight: 700,
          color: isLight ? "#2C1E15" : "#2C1E15",
          backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><path d="M17.5 10c.3-.3.5-.7.5-1.2V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v15l4-4h8.3c.7 0 1.3-.3 1.7-.7"/><path d="M20 14a2 2 0 0 1 0 4m0-4a2 2 0 0 0 0 4m0-4v-2m0 6v2"/></svg>
          انقر لتغيير اللون
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "1.25rem 1.25rem 1.5rem" }}>
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#2C1E15", marginBottom: 2 }}>{title}</div>
          <div style={{ fontSize: "0.72rem", color: "#5A4A3A" }}>{subtitle}</div>
        </div>

        {/* Hex input */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0.9rem 0 0.75rem" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: value, border: "1px solid rgba(201,162,75,0.2)", flexShrink: 0, transition: "background 0.25s" }} />
          <input
            value={draft}
            onChange={e => {
              const v = e.target.value;
              setDraft(v);
              if (isValidHex(v)) onChange(v);
            }}
            onBlur={() => commit(draft)}
            maxLength={7}
            placeholder="#E2CFA8"
            dir="ltr"
            style={{
              flex: 1, padding: "0.45rem 0.75rem", borderRadius: 8,
              border: isValidHex(draft) ? "1px solid rgba(154,106,42,0.3)" : "1px solid rgba(220,50,50,0.5)",
              background: "#F2E8D0", color: "#2C1E15",
              fontSize: "0.85rem", fontFamily: "monospace",
              outline: "none",
            }}
          />
        </div>

        {/* Preset swatches */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: "1rem" }}>
          {presets.map(p => (
            <button
              key={p.hex}
              title={p.label}
              onClick={() => { onChange(p.hex); setDraft(p.hex); }}
              style={{
                width: 26, height: 26, borderRadius: 6, background: p.hex,
                border: value.toLowerCase() === p.hex.toLowerCase()
                  ? "2px solid #C9A24B"
                  : "1.5px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
                transition: "border-color 0.18s, transform 0.18s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
                flexShrink: 0,
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "scale(1.2)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
            />
          ))}
        </div>

        {/* Usage */}
        <div style={{ borderTop: "1px solid rgba(201,162,75,0.08)", paddingTop: "0.75rem" }}>
          <div style={{ fontSize: "0.67rem", color: "#C9A24B", fontWeight: 700, marginBottom: 4 }}>يُستخدم في:</div>
          {usedIn.map(s => (
            <div key={s} style={{ fontSize: "0.7rem", color: "#5A4A3A", lineHeight: 1.8 }}>• {s}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SiteColorsAdminPage() {
  const [mounted, setMounted] = useState(false);
  const [colors, setColors]   = useState<SiteColors>(DEFAULT_COLORS);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    setColors(siteStore.getColors());
    setMounted(true);
  }, []);

  // Rebuild every key explicitly — guards against null/partial state during hydration recovery
  const safeColors: SiteColors = {
    sectionCream: colors?.sectionCream ?? DEFAULT_COLORS.sectionCream,
    sectionDark:  colors?.sectionDark  ?? DEFAULT_COLORS.sectionDark,
    pageBg:       colors?.pageBg       ?? DEFAULT_COLORS.pageBg,
    navBg:        colors?.navBg        ?? DEFAULT_COLORS.navBg,
    footerBg:     colors?.footerBg     ?? DEFAULT_COLORS.footerBg,
  };

  const up = <K extends keyof SiteColors>(k: K, v: string) =>
    setColors(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    siteStore.saveColors(safeColors);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!mounted) return (
    <div style={{ padding: "2.5rem", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl", color: "#C9A24B", opacity: 0.4 }}>
      جاري التحميل…
    </div>
  );

  return (
    <div style={{ padding: "2.5rem", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl", minHeight: "100vh", background: "#F4EFE6" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ color: "#C9A24B", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
          لوحة التحكم / ألوان الموقع
        </div>
        <h1 style={{ fontSize: "1.9rem", fontWeight: 900, margin: 0, ...GT }}>ألوان الخلفيات 🎨</h1>
        <p style={{ color: "#5A4A3A", marginTop: "0.4rem", fontSize: "0.88rem" }}>
          تحكّم في ألوان خلفيات أقسام الصفحة الرئيسية — التغييرات تُطبَّق فوراً على الموقع
        </p>
      </div>

      {/* Toast */}
      {saved && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: G, color: "#2C1E15", padding: "0.75rem 2rem", borderRadius: 999, fontWeight: 700, fontSize: "0.9rem", boxShadow: "0 8px 32px rgba(201,162,75,0.4)" }}>
          ✓ تم الحفظ — الألوان ستظهر على الموقع عند تحديث الصفحة
        </div>
      )}

      {/* Live mini-preview */}
      <div style={{ marginBottom: "2rem", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(201,162,75,0.12)" }}>
        <div style={{ background: "#5A4A3A", padding: "6px 14px", fontSize: "0.65rem", color: "#634E40", fontWeight: 700, letterSpacing: "0.1em" }}>
          معاينة مصغّرة للأقسام
        </div>
        {/* Navbar */}
        <div style={{ height: 32, background: safeColors.navBg, display: "flex", alignItems: "center", paddingRight: 14, gap: 8, borderBottom: "1px solid rgba(201,162,75,0.15)" }}>
          <div style={{ width: 32, height: 12, borderRadius: 3, background: "rgba(201,162,75,0.5)" }} />
          <div style={{ flex: 1, height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", maxWidth: 120 }} />
          <div style={{ fontSize: "0.55rem", color: "rgba(201,162,75,0.5)", marginRight: 6 }}>الشريط العلوي</div>
        </div>
        {/* Slider strip */}
        <div style={{ height: 24, background: safeColors.pageBg, display: "flex", alignItems: "center", paddingRight: 14, gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(201,162,75,0.3)" }} />
          <div style={{ fontSize: "0.55rem", color: "rgba(201,162,75,0.35)" }}>السلايدر</div>
        </div>
        {/* Cream section */}
        <div style={{ height: 38, background: safeColors.sectionCream, display: "flex", alignItems: "center", paddingRight: 14 }}>
          <div style={{ fontSize: "0.55rem", color: "rgba(74,53,37,0.6)", fontWeight: 700 }}>قسم المسارات الثلاث</div>
        </div>
        {/* Dark section */}
        <div style={{ height: 38, background: safeColors.sectionDark, display: "flex", alignItems: "center", paddingRight: 14, gap: 8 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 22, height: 18, borderRadius: 5, background: safeColors.sectionCream, opacity: 0.7 }} />
          ))}
          <div style={{ fontSize: "0.55rem", color: "rgba(201,162,75,0.4)", marginRight: 4 }}>الإحصائيات</div>
        </div>
        {/* Dark again — partner */}
        <div style={{ height: 34, background: safeColors.sectionDark, display: "flex", alignItems: "center", paddingRight: 14 }}>
          <div style={{ flex: 1, height: 22, borderRadius: 6, background: safeColors.sectionCream, maxWidth: 220, opacity: 0.8 }} />
          <div style={{ fontSize: "0.55rem", color: "rgba(201,162,75,0.35)", marginRight: 14 }}>بانر الشراكة</div>
        </div>
        {/* Page bg gap */}
        <div style={{ height: 16, background: safeColors.pageBg }} />
        {/* Footer */}
        <div style={{ height: 40, background: safeColors.footerBg, display: "flex", alignItems: "center", paddingRight: 14, gap: 10, borderTop: "1px solid rgba(201,162,75,0.12)" }}>
          <div style={{ width: 28, height: 10, borderRadius: 3, background: "rgba(201,162,75,0.4)" }} />
          <div style={{ flex: 1, display: "flex", gap: 8 }}>
            {[80,60,70].map((w,i) => <div key={i} style={{ width: w, height: 7, borderRadius: 3, background: "rgba(255,255,255,0.06)" }} />)}
          </div>
          <div style={{ fontSize: "0.55rem", color: "rgba(201,162,75,0.4)", marginRight: 8 }}>الفوتر</div>
        </div>
      </div>

      {/* Theme packs */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ color: "#634E40", fontSize: "0.72rem", fontWeight: 700, marginBottom: "0.75rem" }}>🎨 باقات ألوان جاهزة</div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          {THEMES.map(t => (
            <button
              key={t.label}
              onClick={() => setColors(t.colors)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 14px", borderRadius: 999,
                background: "rgba(201,162,75,0.06)",
                border: "1px solid rgba(201,162,75,0.18)",
                cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
                fontSize: "0.78rem", color: "#C9A24B", fontWeight: 700,
                transition: "all 0.18s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(201,162,75,0.14)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(201,162,75,0.06)"; }}
            >
              {/* Mini swatches */}
              <span style={{ display: "flex", gap: 3 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: t.colors.sectionCream, display: "inline-block" }} />
                <span style={{ width: 12, height: 12, borderRadius: 3, background: t.colors.sectionDark,  display: "inline-block" }} />
                <span style={{ width: 12, height: 12, borderRadius: 3, background: t.colors.pageBg,       display: "inline-block" }} />
              </span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Color cards grid — section colors */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1rem" }}>
        <ColorCard
          title="الخلفية الفاتحة"
          subtitle="تؤثر على: المسارات الثلاث، شريط الإحصائيات، بطاقات المزايا، بانر الشراكة"
          value={safeColors.sectionCream}
          onChange={v => up("sectionCream", v)}
          presets={CREAM_PRESETS}
          usedIn={["قسم المسارات الثلاث (HomeHero)", "شريط أرقام الإحصائيات", "بطاقات «لماذا إعلاني؟»", "بطاقة بانر الشراكة"]}
        />
        <ColorCard
          title="الخلفية الداكنة"
          subtitle="تؤثر على: خلفية قسم الإحصائيات والمزايا وخلفية بانر الشراكة"
          value={safeColors.sectionDark}
          onChange={v => up("sectionDark", v)}
          presets={DARK_PRESETS}
          usedIn={["خلفية قسم الإحصائيات", "خلفية قسم «لماذا إعلاني؟»", "خلفية بانر الشراكة الخارجية"]}
        />
        <ColorCard
          title="خلفية الصفحة"
          subtitle="تؤثر على: الخلفية العامة للصفحة وما بين الأقسام"
          value={safeColors.pageBg}
          onChange={v => up("pageBg", v)}
          presets={PAGE_PRESETS}
          usedIn={["خلفية الصفحة الكاملة (body)", "الفراغات بين الأقسام"]}
        />
      </div>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "1.25rem 0" }}>
        <div style={{ flex: 1, height: 1, background: "rgba(201,162,75,0.1)" }} />
        <span style={{ fontSize: "0.7rem", color: "#5A4A3A", fontWeight: 700, whiteSpace: "nowrap" }}>
          🧭 الشريط العلوي والتذييل
        </span>
        <div style={{ flex: 1, height: 1, background: "rgba(201,162,75,0.1)" }} />
      </div>

      {/* Nav + Footer color cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        <ColorCard
          title="خلفية الشريط العلوي (Navbar)"
          subtitle="يُطبَّق على شريط التنقل المثبت في أعلى كل صفحة"
          value={safeColors.navBg}
          onChange={v => up("navBg", v)}
          presets={NAV_PRESETS}
          usedIn={["شريط التنقل (ثابت في الأعلى)", "خلفية القوائم المنسدلة الرئيسية"]}
        />
        <ColorCard
          title="خلفية التذييل (Footer)"
          subtitle="يُطبَّق على قسم الفوتر في أسفل كل صفحة"
          value={safeColors.footerBg}
          onChange={v => up("footerBg", v)}
          presets={FOOTER_PRESETS}
          usedIn={["الفوتر — الروابط السريعة والخدمات", "قسم بيانات التواصل", "شريط الحقوق السفلي"]}
        />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <button
          onClick={handleSave}
          style={{ padding: "0.85rem 2.5rem", borderRadius: 999, background: G, color: "#2C1E15", fontWeight: 800, border: "none", cursor: "pointer", fontSize: "0.95rem", fontFamily: "Tajawal, Cairo, sans-serif" }}
        >
          💾 حفظ الألوان
        </button>
        <button
          onClick={() => setColors(DEFAULT_COLORS)}
          style={{ padding: "0.85rem 1.5rem", borderRadius: 999, background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.25)", color: "#C9A24B", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}
        >
          ↩ استعادة الافتراضي
        </button>
        <div style={{ fontSize: "0.75rem", color: "#4A3525", marginRight: 8 }}>
          💡 الألوان تُحفظ في المتصفح وتُزامَن مع قاعدة البيانات
        </div>
      </div>

    </div>
  );
}
