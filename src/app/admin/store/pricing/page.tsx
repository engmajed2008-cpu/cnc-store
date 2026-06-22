"use client";
import { useState, useEffect } from "react";
import { siteStore, DEFAULT_LED_PRICING, type LedLettersPricing } from "@/store/siteStore";

const G  = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

function PriceField({ label, hint, value, onChange, min = 0, step = 0.5 }: {
  label: string; hint: string; value: number; onChange: (v: number) => void; min?: number; step?: number;
}) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label style={{ display: "block", color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.3rem" }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <input
          type="number" min={min} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ width: 100, padding: "0.6rem 0.9rem", borderRadius: 10, background: "rgba(0,0,0,0.06)", border: "1px solid rgba(154,106,42,0.25)", color: "#2C1E15", fontWeight: 700, fontSize: "1rem", fontFamily: "Tajawal, Cairo, sans-serif", outline: "none", textAlign: "center" }}
        />
        <span style={{ fontSize: "0.8rem", color: "#5A3E28" }}>{hint}</span>
      </div>
    </div>
  );
}

export default function PricingAdminPage() {
  const [pricing, setPricing] = useState<LedLettersPricing>(DEFAULT_LED_PRICING);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setPricing(siteStore.getLedPricing()); }, []);

  const up = (field: keyof LedLettersPricing, val: number) =>
    setPricing(p => ({ ...p, [field]: val }));

  const handleSave = () => {
    siteStore.saveLedPricing(pricing);
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  // Preview calculation
  const previewPrice = Math.max(
    pricing.acrylicPerCmPerLetter * 30 * 5 * pricing.frontLitMultiplier,
    pricing.minimumOrder
  );

  return (
    <div style={{ padding: "2.5rem", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ color: "#C9A24B", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
          لوحة التحكم / إدارة المنتجات / التسعير
        </div>
        <h1 style={{ fontSize: "1.9rem", fontWeight: 900, margin: 0, ...GT }}>إدارة أسعار الحروف البارزة 💡</h1>
        <p style={{ color: "#666", marginTop: "0.4rem", fontSize: "0.85rem" }}>
          تحكم في أسعار حروف LED — تُحسب تلقائياً في صفحة الطلب
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "2rem", alignItems: "start" }}>

        {/* Pricing fields */}
        <div>

          {/* Material prices */}
          <div style={{ background: "#F2E8D0", borderRadius: 16, padding: "1.5rem", border: "1px solid rgba(154,106,42,0.25)", marginBottom: "1.5rem" }}>
            <h2 style={{ fontWeight: 800, ...GT, fontSize: "1.1rem", margin: "0 0 1.25rem 0" }}>💰 أسعار المواد (ريال/سم/حرف)</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <PriceField label="🟡 أكريليك" hint="ريال/سم/حرف" value={pricing.acrylicPerCmPerLetter} onChange={v => up("acrylicPerCmPerLetter", v)} />
              <PriceField label="⬜ ألمنيوم" hint="ريال/سم/حرف" value={pricing.aluminumPerCmPerLetter} onChange={v => up("aluminumPerCmPerLetter", v)} />
              <PriceField label="🔲 ستانلس ستيل" hint="ريال/سم/حرف" value={pricing.stainlessPerCmPerLetter} onChange={v => up("stainlessPerCmPerLetter", v)} />
            </div>
          </div>

          {/* Lighting multipliers */}
          <div style={{ background: "#F2E8D0", borderRadius: 16, padding: "1.5rem", border: "1px solid rgba(154,106,42,0.25)", marginBottom: "1.5rem" }}>
            <h2 style={{ fontWeight: 800, ...GT, fontSize: "1.1rem", margin: "0 0 0.5rem 0" }}>✨ مضاعفات نوع الإضاءة</h2>
            <p style={{ color: "#5A3E28", fontSize: "0.78rem", margin: "0 0 1.25rem 0" }}>
              يُضرب في السعر الأساسي — 1.0 = بدون مضاعفة
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <PriceField label="💡 إضاءة أمامية" hint="مضاعف (1.0 = عادي)" value={pricing.frontLitMultiplier} onChange={v => up("frontLitMultiplier", v)} min={1} step={0.1} />
              <PriceField label="✨ إضاءة خلفية" hint="مضاعف" value={pricing.backLitMultiplier} onChange={v => up("backLitMultiplier", v)} min={1} step={0.1} />
              <PriceField label="🌟 إضاءة مزدوجة" hint="مضاعف" value={pricing.doubleLitMultiplier} onChange={v => up("doubleLitMultiplier", v)} min={1} step={0.1} />
            </div>
          </div>

          {/* Other */}
          <div style={{ background: "#F2E8D0", borderRadius: 16, padding: "1.5rem", border: "1px solid rgba(154,106,42,0.25)" }}>
            <h2 style={{ fontWeight: 800, ...GT, fontSize: "1.1rem", margin: "0 0 1.25rem 0" }}>⚙️ إعدادات أخرى</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <PriceField label="الحد الأدنى للطلب" hint="ريال" value={pricing.minimumOrder} onChange={v => up("minimumOrder", v)} />
              <PriceField label="رسوم التركيب" hint="ريال (0 = مجاناً)" value={pricing.installationFee} onChange={v => up("installationFee", v)} />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div style={{ position: "sticky", top: 80 }}>
          <div style={{ background: "#F2E8D0", borderRadius: 16, padding: "1.5rem", border: "2px solid rgba(154,106,42,0.3)" }}>
            <h3 style={{ fontWeight: 800, ...GT, margin: "0 0 1rem 0" }}>👁️ معاينة التسعير</h3>
            <p style={{ color: "#5A3E28", fontSize: "0.75rem", margin: "0 0 1.25rem 0" }}>مثال: أكريليك، 30سم، 5 حروف، إضاءة أمامية</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.25rem" }}>
              {[
                ["أكريليك 30سم × 5 حروف", Math.max(pricing.acrylicPerCmPerLetter * 30 * 5, pricing.minimumOrder)],
                ["ألمنيوم 30سم × 5 حروف", Math.max(pricing.aluminumPerCmPerLetter * 30 * 5, pricing.minimumOrder)],
                ["ستانلس 30سم × 5 حروف", Math.max(pricing.stainlessPerCmPerLetter * 30 * 5, pricing.minimumOrder)],
              ].map(([label, val]) => (
                <div key={label as string} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0.75rem", borderRadius: 8, background: "rgba(201,162,75,0.05)" }}>
                  <span style={{ fontSize: "0.78rem", color: "#5A3E28" }}>{label as string}</span>
                  <span style={{ fontWeight: 700, color: "#C9A24B" }}>{(val as number).toLocaleString()} ر.س</span>
                </div>
              ))}
            </div>

            <button onClick={handleSave} style={{
              width: "100%", padding: "0.85rem", borderRadius: 12, border: "none",
              background: G, color: "#2C1E15", fontWeight: 900, fontSize: "0.95rem",
              cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
              boxShadow: "0 6px 20px rgba(201,162,75,0.3)",
            }}>
              {saved ? "✅ تم الحفظ!" : "💾 حفظ الأسعار"}
            </button>

            <p style={{ fontSize: "0.7rem", color: "#5A3E28", textAlign: "center", margin: "0.75rem 0 0" }}>
              التغييرات تنعكس فوراً على صفحة الطلب
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
