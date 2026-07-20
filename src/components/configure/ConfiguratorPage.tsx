"use client";
import { useIsMobile } from "@/lib/useIsMobile";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { siteStore, DEFAULT_CONFIGURE_CATEGORIES, type ConfigureCategory } from "@/store/siteStore";

type Locale = "ar" | "en";

/* ─────────────────────────── STATIC PRICING DATA ─────────────────────────── */

const SIGNS_MATERIALS = [
  { key: "acm",     ar: "ألومنيوم كومبوزيت ACM", en: "ACM Panel",          priceM2: 180, icon: "🟦" },
  { key: "acrylic", ar: "أكريليك",                en: "Acrylic",             priceM2: 320, icon: "🔵" },
  { key: "steel",   ar: "حديد (قطع ليزر)",         en: "Steel (Laser Cut)",   priceM2: 260, icon: "⬛" },
  { key: "mdf",     ar: "خشب MDF",                 en: "MDF Wood",            priceM2: 140, icon: "🟫" },
];
const SIGNS_FINISHES = [
  { key: "none",  ar: "بدون طباعة",       en: "No Print",         extraM2: 0 },
  { key: "print", ar: "طباعة ديجيتال",    en: "Digital Print",    extraM2: 60 },
  { key: "uv",    ar: "طباعة UV مباشرة",  en: "Direct UV Print",  extraM2: 100 },
];

const BANNERS_MATERIALS = [
  { key: "flex_std",  ar: "فلكس عادي 440g",        en: "Standard Flex 440g",   priceM2: 25 },
  { key: "flex_prem", ar: "فلكس ممتاز 550g",        en: "Premium Flex 550g",    priceM2: 40 },
  { key: "mesh",      ar: "شبكي Mesh",               en: "Mesh Banner",          priceM2: 55 },
  { key: "backlit",   ar: "بانر مضيء Backlit",       en: "Backlit Banner",       priceM2: 70 },
];

const FLAGS_SIZES = [
  { key: "sm", ar: "صغير 70×100 سم",    en: "Small 70×100cm",     price: 45 },
  { key: "md", ar: "متوسط 100×150 سم",  en: "Medium 100×150cm",   price: 75 },
  { key: "lg", ar: "كبير 150×225 سم",   en: "Large 150×225cm",    price: 120 },
  { key: "xl", ar: "جامبو 200×300 سم",  en: "Jumbo 200×300cm",    price: 200 },
];
const FLAGS_FABRICS = [
  { key: "satin",    ar: "ستان",              en: "Satin",          mult: 1.0 },
  { key: "taffeta",  ar: "تافيتا (سُمك أعلى)", en: "Taffeta",       mult: 1.15 },
  { key: "nylon",    ar: "نايلون للخارج",      en: "Outdoor Nylon", mult: 1.2 },
];

const STICKERS_MATS = [
  { key: "pvc",    ar: "PVC لاصق عادي",   en: "Standard PVC",    pricePer100cm2: 4 },
  { key: "chrome", ar: "فضي كروم",         en: "Silver Chrome",   pricePer100cm2: 7 },
  { key: "clear",  ar: "شفاف Clear",       en: "Transparent",     pricePer100cm2: 5 },
];

const PROMO_PRODUCTS = [
  { key: "cup",      ar: "أكواب مطبوعة",    en: "Printed Cups",        unitSAR: 18,  minQty: 50  },
  { key: "tshirt",   ar: "تيشيرت مطبوع",   en: "Printed T-Shirts",    unitSAR: 35,  minQty: 24  },
  { key: "pen",      ar: "أقلام مطبوعة",    en: "Printed Pens",        unitSAR: 8,   minQty: 100 },
  { key: "bag",      ar: "حقائب ترويجية",   en: "Promotional Bags",    unitSAR: 45,  minQty: 24  },
  { key: "umbrella", ar: "مظلات مطبوعة",    en: "Printed Umbrellas",   unitSAR: 85,  minQty: 12  },
];

const EXPO_UNITS = [
  { key: "rollup",  ar: "بانر رول-آب 85×200 سم",  en: "Roll-up Banner 85×200cm",    price: 180  },
  { key: "popup",   ar: "خلفية بوب-آب 3×2 م",      en: "Pop-up Display 3×2m",        price: 1200 },
  { key: "booth",   ar: "بوث معرض 3×3 م",          en: "Exhibition Booth 3×3m",      price: 4500 },
  { key: "wall",    ar: "جدار عرض 4 م",             en: "Display Wall 4m",            price: 2200 },
];

/* ─────────────────────────── SVG PATTERNS ─────────────────────────── */

const SVG_PATTERNS: Record<string, string> = {
  signs: `
    <defs><pattern id="cp-signs" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="1.4" fill="#C9A24B" opacity=".1"/>
    </pattern></defs>
    <rect width="100%" height="100%" fill="url(#cp-signs)"/>
    <rect x="10%" y="18%" width="80%" height="58%" rx="6" fill="none" stroke="#C9A24B" stroke-width="1.2" stroke-dasharray="7 3" opacity=".4"/>
    <rect x="16%" y="24%" width="68%" height="46%" rx="4" fill="rgba(201,162,75,.04)" stroke="#EBCB7C" stroke-width=".7" opacity=".3"/>
    <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="11%" font-weight="700" fill="#C9A24B" opacity=".5">SIGN</text>
    <line x1="22%" y1="79%" x2="78%" y2="79%" stroke="#C9A24B" stroke-width=".5" opacity=".25"/>
  `,
  banners: `
    <defs><pattern id="cp-banners" width="18" height="18" patternUnits="userSpaceOnUse">
      <circle cx="9" cy="9" r="1.2" fill="#C9A24B" opacity=".1"/>
    </pattern></defs>
    <rect width="100%" height="100%" fill="url(#cp-banners)"/>
    <rect x="30%" y="8%" width="40%" height="84%" rx="4" fill="none" stroke="#C9A24B" stroke-width="1.2" stroke-dasharray="6 3" opacity=".4"/>
    <rect x="35%" y="13%" width="30%" height="74%" rx="3" fill="rgba(201,162,75,.05)" stroke="#EBCB7C" stroke-width=".7" opacity=".3"/>
    <circle cx="50%" cy="5%" r="2%" fill="#C9A24B" opacity=".6"/>
    <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="7%" fill="#C9A24B" opacity=".4">BANNER</text>
  `,
  flags: `
    <defs><pattern id="cp-flags" width="22" height="22" patternUnits="userSpaceOnUse">
      <path d="M0 0h22v22H0z" fill="none" stroke="#C9A24B" stroke-width=".25" opacity=".12"/>
    </pattern></defs>
    <rect width="100%" height="100%" fill="url(#cp-flags)"/>
    <line x1="25%" y1="10%" x2="25%" y2="90%" stroke="#C9A24B" stroke-width="1.8" opacity=".5"/>
    <path d="M25%,12% L75%,25% L25%,45%" fill="rgba(201,162,75,.12)" stroke="#C9A24B" stroke-width="1.1" opacity=".55"/>
    <path d="M25%,48% L70%,60% L25%,72%" fill="rgba(201,162,75,.07)" stroke="#EBCB7C" stroke-width=".8" opacity=".4"/>
    <circle cx="25%" cy="10%" r="2%" fill="#C9A24B" opacity=".7"/>
  `,
  stickers: `
    <defs><pattern id="cp-stickers" width="30" height="30" patternUnits="userSpaceOnUse">
      <circle cx="15" cy="15" r="1.5" fill="#C9A24B" opacity=".1"/>
    </pattern></defs>
    <rect width="100%" height="100%" fill="url(#cp-stickers)"/>
    <circle cx="50%" cy="48%" r="32%" fill="none" stroke="#C9A24B" stroke-width="1.2" stroke-dasharray="6 4" opacity=".35"/>
    <circle cx="50%" cy="48%" r="22%" fill="rgba(201,162,75,.05)" stroke="#EBCB7C" stroke-width=".8" opacity=".3"/>
    <circle cx="50%" cy="48%" r="10%" fill="rgba(201,162,75,.1)" stroke="#C9A24B" stroke-width="1.2" opacity=".5"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="7%" fill="#C9A24B" opacity=".45">◆</text>
  `,
  promo: `
    <defs><pattern id="cp-promo" width="16" height="16" patternUnits="userSpaceOnUse">
      <circle cx="8" cy="8" r="1" fill="#C9A24B" opacity=".1"/>
    </pattern></defs>
    <rect width="100%" height="100%" fill="url(#cp-promo)"/>
    <path d="M10%,60% Q25%,20% 50%,38% Q75%,56% 90%,18%" fill="none" stroke="#EBCB7C" stroke-width="1.4" opacity=".4" stroke-dasharray="5 3"/>
    <circle cx="50%" cy="38%" r="3.5%" fill="#C9A24B" opacity=".5"/>
    <circle cx="25%" cy="40%" r="2.2%" fill="none" stroke="#C9A24B" stroke-width="1" opacity=".4"/>
    <circle cx="75%" cy="36%" r="2.2%" fill="none" stroke="#C9A24B" stroke-width="1" opacity=".4"/>
    <text x="50%" y="72%" text-anchor="middle" font-family="monospace" font-size="6.5%" fill="#C9A24B" opacity=".35">PROMO</text>
  `,
  expo: `
    <defs><pattern id="cp-expo" width="45" height="45" patternUnits="userSpaceOnUse">
      <path d="M0 0h45v45H0z" fill="none" stroke="#C9A24B" stroke-width=".3" opacity=".2"/>
      <circle cx="0" cy="0" r="1" fill="#C9A24B" opacity=".35"/>
      <circle cx="45" cy="45" r="1" fill="#C9A24B" opacity=".35"/>
    </pattern></defs>
    <rect width="100%" height="100%" fill="url(#cp-expo)"/>
    <rect x="15%" y="30%" width="70%" height="50%" rx="4" fill="rgba(201,162,75,.06)" stroke="#C9A24B" stroke-width="1" opacity=".4"/>
    <rect x="22%" y="22%" width="18%" height="28%" rx="3" fill="rgba(201,162,75,.08)" stroke="#EBCB7C" stroke-width=".8" opacity=".45"/>
    <rect x="60%" y="22%" width="18%" height="28%" rx="3" fill="rgba(201,162,75,.08)" stroke="#EBCB7C" stroke-width=".8" opacity=".45"/>
    <rect x="41%" y="20%" width="18%" height="20%" rx="3" fill="rgba(201,162,75,.1)" stroke="#C9A24B" stroke-width="1" opacity=".5"/>
  `,
};

/* ─────────────────────────── PRICE HELPERS ─────────────────────────── */

interface PriceResult { subtotal: number; vat: number; total: number; breakdown: string[] }

function calcSigns(mat: string, finish: string, wCm: number, hCm: number, qty: number, isAr: boolean): PriceResult | null {
  const m = SIGNS_MATERIALS.find((x) => x.key === mat);
  const f = SIGNS_FINISHES.find((x) => x.key === finish);
  if (!m || !f || wCm <= 0 || hCm <= 0 || qty <= 0) return null;
  const areaM2 = (wCm / 100) * (hCm / 100);
  const matCost = areaM2 * m.priceM2;
  const finCost = areaM2 * f.extraM2;
  const unitPrice = Math.max(matCost + finCost, 50);
  const subtotal = unitPrice * qty;
  const vat = subtotal * 0.15;
  const label = (ar: string, en: string) => (isAr ? ar : en);
  return {
    subtotal, vat, total: subtotal + vat,
    breakdown: [
      `${label("المادة", "Material")}: ${(matCost * qty).toFixed(0)} ${label("ر.س", "SAR")}`,
      f.extraM2 > 0 ? `${label("الطباعة", "Print")}: ${(finCost * qty).toFixed(0)} ${label("ر.س", "SAR")}` : "",
      `${label("الكمية", "Qty")}: ${qty}`,
    ].filter(Boolean),
  };
}

function calcBanners(mat: string, wM: number, hM: number, qty: number, isAr: boolean): PriceResult | null {
  const m = BANNERS_MATERIALS.find((x) => x.key === mat);
  if (!m || wM <= 0 || hM <= 0 || qty <= 0) return null;
  const areaM2 = wM * hM;
  const unitPrice = Math.max(areaM2 * m.priceM2, 30);
  const subtotal = unitPrice * qty;
  const vat = subtotal * 0.15;
  const label = (ar: string, en: string) => (isAr ? ar : en);
  return {
    subtotal, vat, total: subtotal + vat,
    breakdown: [
      `${label("المساحة", "Area")}: ${areaM2.toFixed(2)} م²`,
      `${label("سعر المتر", "Price/m²")}: ${m.priceM2} ${label("ر.س", "SAR")}`,
      `${label("الكمية", "Qty")}: ${qty}`,
    ],
  };
}

function calcFlags(size: string, fabric: string, qty: number, isAr: boolean): PriceResult | null {
  const s = FLAGS_SIZES.find((x) => x.key === size);
  const f = FLAGS_FABRICS.find((x) => x.key === fabric);
  if (!s || !f || qty <= 0) return null;
  const unitPrice = s.price * f.mult;
  const subtotal = unitPrice * qty;
  const vat = subtotal * 0.15;
  const label = (ar: string, en: string) => (isAr ? ar : en);
  return {
    subtotal, vat, total: subtotal + vat,
    breakdown: [
      `${label("سعر الوحدة", "Unit price")}: ${unitPrice.toFixed(0)} ${label("ر.س", "SAR")}`,
      `${label("القماش", "Fabric")}: ×${f.mult}`,
      `${label("الكمية", "Qty")}: ${qty}`,
    ],
  };
}

function calcStickers(mat: string, wCm: number, hCm: number, qty: number, isAr: boolean): PriceResult | null {
  const m = STICKERS_MATS.find((x) => x.key === mat);
  if (!m || wCm <= 0 || hCm <= 0 || qty <= 0) return null;
  const area100 = (wCm * hCm) / 100;
  const unitPrice = Math.max(area100 * m.pricePer100cm2, 5);
  const subtotal = unitPrice * qty;
  const vat = subtotal * 0.15;
  const label = (ar: string, en: string) => (isAr ? ar : en);
  return {
    subtotal, vat, total: subtotal + vat,
    breakdown: [
      `${label("المساحة", "Area")}: ${(wCm * hCm).toFixed(0)} سم²`,
      `${label("سعر الوحدة", "Unit price")}: ${unitPrice.toFixed(1)} ${label("ر.س", "SAR")}`,
      `${label("الكمية", "Qty")}: ${qty}`,
    ],
  };
}

function calcPromo(product: string, qty: number, isAr: boolean): PriceResult | null {
  const p = PROMO_PRODUCTS.find((x) => x.key === product);
  if (!p || qty <= 0) return null;
  const effectiveQty = Math.max(qty, p.minQty);
  const subtotal = p.unitSAR * effectiveQty;
  const vat = subtotal * 0.15;
  const label = (ar: string, en: string) => (isAr ? ar : en);
  return {
    subtotal, vat, total: subtotal + vat,
    breakdown: [
      `${label("سعر الوحدة", "Unit price")}: ${p.unitSAR} ${label("ر.س", "SAR")}`,
      effectiveQty !== qty ? `${label("الحد الأدنى", "Min qty")}: ${p.minQty}` : "",
      `${label("الكمية", "Qty")}: ${effectiveQty}`,
    ].filter(Boolean),
  };
}

function calcExpo(unit: string, qty: number, isAr: boolean): PriceResult | null {
  const u = EXPO_UNITS.find((x) => x.key === unit);
  if (!u || qty <= 0) return null;
  const subtotal = u.price * qty;
  const vat = subtotal * 0.15;
  const label = (ar: string, en: string) => (isAr ? ar : en);
  return {
    subtotal, vat, total: subtotal + vat,
    breakdown: [
      `${label("سعر الوحدة", "Unit price")}: ${u.price} ${label("ر.س", "SAR")}`,
      `${label("الكمية", "Qty")}: ${qty}`,
    ],
  };
}

/* ─────────────────────────── ANIMATED NUMBER ─────────────────────────── */

function AnimatedNum({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    const from = prev.current;
    const to = value;
    const dur = 350;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * ease);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else prev.current = to;
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value]);

  return <>{display.toFixed(decimals)}</>;
}

/* ─────────────────────────── SHARED UI ─────────────────────────── */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color: "#7A5218", marginBottom: 8, letterSpacing: "0.04em" }}>
      {children}
    </div>
  );
}

function NumInput({
  value, onChange, min = 1, max, step = 1, placeholder,
}: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; placeholder?: string }) {
  return (
    <input
      type="number"
      value={value || ""}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        width: "100%",
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid rgba(74,53,37,0.2)",
        background: "#FBF6EE",
        color: "#2C1E15",
        fontSize: 15,
        fontWeight: 600,
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  );
}

function ChipGroup<T extends string>({
  options, value, onChange, label, isAr,
}: {
  options: { key: T; ar: string; en: string }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
  isAr: boolean;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((o) => {
        const sel = value === o.key;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: sel ? "1.5px solid #C9A24B" : "1px solid rgba(74,53,37,0.18)",
              background: sel ? "rgba(201,162,75,0.12)" : "#FBF6EE",
              color: sel ? "#7A5218" : "#5A3E28",
              fontSize: 13,
              fontWeight: sel ? 800 : 500,
              cursor: "pointer",
              transition: "all 0.18s",
            }}
          >
            {isAr ? o.ar : o.en}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── CONFIGURATORS ─────────────────────────── */

function SignsForm({ isAr, onPrice }: { isAr: boolean; onPrice: (r: PriceResult | null) => void }) {
  const [mat, setMat] = useState("acm");
  const [finish, setFinish] = useState("none");
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);
  const [qty, setQty] = useState(1);
  const L = (ar: string, en: string) => isAr ? ar : en;

  useEffect(() => { onPrice(calcSigns(mat, finish, w, h, qty, isAr)); }, [mat, finish, w, h, qty, isAr]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <FieldLabel>{L("المادة", "Material")}</FieldLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {SIGNS_MATERIALS.map((m) => {
            const sel = mat === m.key;
            return (
              <button key={m.key} onClick={() => setMat(m.key)} style={{
                padding: "12px 14px", borderRadius: 12, textAlign: isAr ? "right" : "left",
                border: sel ? "1.5px solid #C9A24B" : "1px solid rgba(74,53,37,0.15)",
                background: sel ? "rgba(201,162,75,0.1)" : "#FBF6EE",
                cursor: "pointer", transition: "all 0.18s",
              }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{m.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: sel ? "#7A5218" : "#2C1E15" }}>
                  {isAr ? m.ar : m.en}
                </div>
                <div style={{ fontSize: 11, color: "#9A6A2A", marginTop: 2 }}>
                  {m.priceM2} {L("ر.س/م²", "SAR/m²")}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel>{L("الأبعاد (سم)", "Dimensions (cm)")}</FieldLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "#9A6A2A", marginBottom: 4 }}>{L("العرض", "Width")}</div>
            <NumInput value={w} onChange={setW} min={10} placeholder={L("مثال: 120", "e.g. 120")} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#9A6A2A", marginBottom: 4 }}>{L("الارتفاع", "Height")}</div>
            <NumInput value={h} onChange={setH} min={10} placeholder={L("مثال: 80", "e.g. 80")} />
          </div>
        </div>
        {w > 0 && h > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#9A6A2A" }}>
            {L("المساحة", "Area")}: {((w / 100) * (h / 100)).toFixed(3)} م²
          </div>
        )}
      </div>

      <div>
        <FieldLabel>{L("الإنهاء والطباعة", "Finish & Print")}</FieldLabel>
        <ChipGroup options={SIGNS_FINISHES} value={finish as any} onChange={setFinish as any} isAr={isAr} />
      </div>

      <div>
        <FieldLabel>{L("الكمية", "Quantity")}</FieldLabel>
        <NumInput value={qty} onChange={setQty} min={1} max={10000} />
      </div>
    </div>
  );
}

function BannersForm({ isAr, onPrice }: { isAr: boolean; onPrice: (r: PriceResult | null) => void }) {
  const [mat, setMat] = useState("flex_std");
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);
  const [qty, setQty] = useState(1);
  const L = (ar: string, en: string) => isAr ? ar : en;

  useEffect(() => { onPrice(calcBanners(mat, w, h, qty, isAr)); }, [mat, w, h, qty, isAr]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <FieldLabel>{L("نوع المادة", "Material Type")}</FieldLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {BANNERS_MATERIALS.map((m) => {
            const sel = mat === m.key;
            return (
              <button key={m.key} onClick={() => setMat(m.key)} style={{
                padding: "12px 16px", borderRadius: 12, textAlign: isAr ? "right" : "left",
                border: sel ? "1.5px solid #C9A24B" : "1px solid rgba(74,53,37,0.15)",
                background: sel ? "rgba(201,162,75,0.1)" : "#FBF6EE",
                cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: sel ? "#7A5218" : "#2C1E15" }}>
                  {isAr ? m.ar : m.en}
                </span>
                <span style={{ fontSize: 12, color: "#9A6A2A" }}>{m.priceM2} {L("ر.س/م²", "SAR/m²")}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel>{L("الأبعاد (متر)", "Dimensions (meters)")}</FieldLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "#9A6A2A", marginBottom: 4 }}>{L("العرض", "Width")}</div>
            <NumInput value={w} onChange={setW} min={0.5} step={0.5} placeholder="1.0" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#9A6A2A", marginBottom: 4 }}>{L("الارتفاع", "Height")}</div>
            <NumInput value={h} onChange={setH} min={0.5} step={0.5} placeholder="2.0" />
          </div>
        </div>
        {w > 0 && h > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#9A6A2A" }}>
            {L("المساحة", "Area")}: {(w * h).toFixed(2)} م²
          </div>
        )}
      </div>

      <div>
        <FieldLabel>{L("الكمية", "Quantity")}</FieldLabel>
        <NumInput value={qty} onChange={setQty} min={1} />
      </div>
    </div>
  );
}

function FlagsForm({ isAr, onPrice }: { isAr: boolean; onPrice: (r: PriceResult | null) => void }) {
  const [size, setSize] = useState("md");
  const [fabric, setFabric] = useState("satin");
  const [qty, setQty] = useState(1);
  const L = (ar: string, en: string) => isAr ? ar : en;

  useEffect(() => { onPrice(calcFlags(size, fabric, qty, isAr)); }, [size, fabric, qty, isAr]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <FieldLabel>{L("الحجم", "Size")}</FieldLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {FLAGS_SIZES.map((s) => {
            const sel = size === s.key;
            return (
              <button key={s.key} onClick={() => setSize(s.key)} style={{
                padding: "14px 12px", borderRadius: 12, textAlign: "center",
                border: sel ? "1.5px solid #C9A24B" : "1px solid rgba(74,53,37,0.15)",
                background: sel ? "rgba(201,162,75,0.1)" : "#FBF6EE",
                cursor: "pointer",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: sel ? "#7A5218" : "#2C1E15", marginBottom: 4 }}>
                  {isAr ? s.ar : s.en}
                </div>
                <div style={{ fontSize: 12, color: "#9A6A2A" }}>{L("من", "from")} {s.price} {L("ر.س", "SAR")}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel>{L("نوع القماش", "Fabric Type")}</FieldLabel>
        <ChipGroup options={FLAGS_FABRICS} value={fabric as any} onChange={setFabric as any} isAr={isAr} />
      </div>

      <div>
        <FieldLabel>{L("الكمية", "Quantity")}</FieldLabel>
        <NumInput value={qty} onChange={setQty} min={1} />
      </div>
    </div>
  );
}

function StickersForm({ isAr, onPrice }: { isAr: boolean; onPrice: (r: PriceResult | null) => void }) {
  const [mat, setMat] = useState("pvc");
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);
  const [qty, setQty] = useState(1);
  const L = (ar: string, en: string) => isAr ? ar : en;

  useEffect(() => { onPrice(calcStickers(mat, w, h, qty, isAr)); }, [mat, w, h, qty, isAr]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <FieldLabel>{L("نوع المادة", "Material")}</FieldLabel>
        <ChipGroup options={STICKERS_MATS} value={mat as any} onChange={setMat as any} isAr={isAr} />
      </div>

      <div>
        <FieldLabel>{L("الأبعاد (سم)", "Dimensions (cm)")}</FieldLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "#9A6A2A", marginBottom: 4 }}>{L("العرض", "Width")}</div>
            <NumInput value={w} onChange={setW} min={5} placeholder={L("مثال: 20", "e.g. 20")} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#9A6A2A", marginBottom: 4 }}>{L("الارتفاع", "Height")}</div>
            <NumInput value={h} onChange={setH} min={5} placeholder={L("مثال: 10", "e.g. 10")} />
          </div>
        </div>
      </div>

      <div>
        <FieldLabel>{L("الكمية", "Quantity")}</FieldLabel>
        <NumInput value={qty} onChange={setQty} min={1} />
      </div>
    </div>
  );
}

function PromoForm({ isAr, onPrice }: { isAr: boolean; onPrice: (r: PriceResult | null) => void }) {
  const [product, setProduct] = useState("cup");
  const [qty, setQty] = useState(50);
  const L = (ar: string, en: string) => isAr ? ar : en;

  useEffect(() => { onPrice(calcPromo(product, qty, isAr)); }, [product, qty, isAr]);

  const p = PROMO_PRODUCTS.find((x) => x.key === product);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <FieldLabel>{L("نوع المنتج", "Product Type")}</FieldLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PROMO_PRODUCTS.map((pr) => {
            const sel = product === pr.key;
            return (
              <button key={pr.key} onClick={() => { setProduct(pr.key); setQty(pr.minQty); }} style={{
                padding: "12px 16px", borderRadius: 12, textAlign: isAr ? "right" : "left",
                border: sel ? "1.5px solid #C9A24B" : "1px solid rgba(74,53,37,0.15)",
                background: sel ? "rgba(201,162,75,0.1)" : "#FBF6EE",
                cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: sel ? "#7A5218" : "#2C1E15" }}>
                  {isAr ? pr.ar : pr.en}
                </span>
                <div style={{ textAlign: isAr ? "left" : "right" }}>
                  <div style={{ fontSize: 12, color: "#9A6A2A" }}>{pr.unitSAR} {L("ر.س/قطعة", "SAR/unit")}</div>
                  <div style={{ fontSize: 11, color: "#634E40" }}>{L("حد أدنى", "Min")}: {pr.minQty}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel>{L("الكمية", "Quantity")} {p && `(${L("حد أدنى", "min")}: ${p.minQty})`}</FieldLabel>
        <NumInput value={qty} onChange={setQty} min={p?.minQty ?? 1} />
      </div>
    </div>
  );
}

function ExpoForm({ isAr, onPrice }: { isAr: boolean; onPrice: (r: PriceResult | null) => void }) {
  const [unit, setUnit] = useState("rollup");
  const [qty, setQty] = useState(1);
  const L = (ar: string, en: string) => isAr ? ar : en;

  useEffect(() => { onPrice(calcExpo(unit, qty, isAr)); }, [unit, qty, isAr]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <FieldLabel>{L("نوع الوحدة", "Unit Type")}</FieldLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {EXPO_UNITS.map((u) => {
            const sel = unit === u.key;
            return (
              <button key={u.key} onClick={() => setUnit(u.key)} style={{
                padding: "14px 12px", borderRadius: 12, textAlign: "center",
                border: sel ? "1.5px solid #C9A24B" : "1px solid rgba(74,53,37,0.15)",
                background: sel ? "rgba(201,162,75,0.1)" : "#FBF6EE",
                cursor: "pointer",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: sel ? "#7A5218" : "#2C1E15", marginBottom: 4 }}>
                  {isAr ? u.ar : u.en}
                </div>
                <div style={{ fontSize: 12, color: "#9A6A2A" }}>{L("من", "from")} {u.price.toLocaleString()} {L("ر.س", "SAR")}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel>{L("الكمية", "Quantity")}</FieldLabel>
        <NumInput value={qty} onChange={setQty} min={1} />
      </div>
    </div>
  );
}

/* ─────────────────────────── REQUEST FORM ─────────────────────────── */

function RequestForm({
  isAr, category, price, locale, onSuccess,
}: {
  isAr: boolean; category: string; price: PriceResult | null; locale: string; onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const L = (ar: string, en: string) => isAr ? ar : en;

  const valid = name.trim().length > 1 && phone.trim().length >= 9;

  const handleSubmit = async () => {
    if (!valid) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    onSuccess();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: "1px solid rgba(74,53,37,0.18)",
    background: "#FBF6EE",
    color: "#2C1E15",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  return (
    <div style={{
      background: "#F4EFE6",
      border: "1px solid rgba(74,53,37,0.12)",
      borderRadius: 16,
      padding: "28px 28px 24px",
      marginTop: 28,
    }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#2C1E15", marginBottom: 4 }}>
        {L("أرسل الطلب للشركاء القريبين منك", "Send request to nearby partners")}
      </div>
      <div style={{ fontSize: 13, color: "#9A6A2A", marginBottom: 22 }}>
        {L("سيتلقى شركاؤنا المعتمدون طلبك ويرسلون عروضهم الفعلية — أنت تختار", "Our certified partners will receive your request and send real offers — you choose")}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <FieldLabel>{L("الاسم", "Name")} *</FieldLabel>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)}
            placeholder={L("الاسم الكامل", "Full name")} />
        </div>
        <div>
          <FieldLabel>{L("الجوال", "Mobile")} *</FieldLabel>
          <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="05xxxxxxxx" dir="ltr" />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <FieldLabel>{L("المدينة", "City")}</FieldLabel>
        <input style={inputStyle} value={city} onChange={(e) => setCity(e.target.value)}
          placeholder={L("مثال: جدة، الرياض", "e.g. Jeddah, Riyadh")} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <FieldLabel>{L("ملاحظات إضافية", "Additional Notes")}</FieldLabel>
        <textarea
          style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={L("أي تفاصيل إضافية، ألوان، تصميم خاص...", "Any extra details, colors, custom design...")}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!valid || loading}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 12,
          border: "none",
          background: valid ? "linear-gradient(135deg, #C9A24B, #B38F3A)" : "rgba(74,53,37,0.12)",
          color: valid ? "#2C1E15" : "#634E40",
          fontSize: 15,
          fontWeight: 900,
          cursor: valid ? "pointer" : "default",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {loading ? (
          <span style={{ display: "inline-block", width: 18, height: 18, border: "2px solid rgba(44,30,21,0.25)", borderTopColor: "#2C1E15", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        ) : (
          <>
            <span>{L("أرسل الطلب للشركاء", "Send to Partners")}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d={isAr ? "M19 12H5m7 7-7-7 7-7" : "M5 12h14m-7-7 7 7-7 7"} />
            </svg>
          </>
        )}
      </button>

      {!valid && (
        <div style={{ marginTop: 10, fontSize: 11, color: "#634E40", textAlign: "center" }}>
          {L("* الاسم والجوال مطلوبان", "* Name and mobile are required")}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── PRICE PANEL ─────────────────────────── */

function PricePanel({ price, isAr }: { price: PriceResult | null; isAr: boolean }) {
  const L = (ar: string, en: string) => isAr ? ar : en;

  return (
    <div style={{
      position: "sticky",
      top: 100,
      background: "#F4EFE6",
      border: "1px solid rgba(74,53,37,0.15)",
      borderRadius: 16,
      padding: "24px",
      minWidth: 260,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#9A6A2A", letterSpacing: "0.08em", marginBottom: 16 }}>
        {L("السعر التقديري", "ESTIMATED PRICE")}
      </div>

      {price ? (
        <>
          <div style={{
            fontSize: "2.2rem",
            fontWeight: 900,
            background: "linear-gradient(135deg, #C9A24B, #EBCB7C)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1,
            marginBottom: 4,
          }}>
            <AnimatedNum value={price.total} decimals={0} /> <span style={{ fontSize: "1rem" }}>{L("ر.س", "SAR")}</span>
          </div>
          <div style={{ fontSize: 11, color: "#9A6A2A", marginBottom: 20 }}>
            {L("شامل ضريبة القيمة المضافة ١٥٪", "incl. 15% VAT")}
          </div>

          <div style={{ borderTop: "1px solid rgba(74,53,37,0.1)", paddingTop: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#9A6A2A", fontWeight: 700, marginBottom: 10 }}>
              {L("التفصيل", "BREAKDOWN")}
            </div>
            {price.breakdown.map((line, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#5A3E28", marginBottom: 6 }}>
                <span>{line}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px dashed rgba(74,53,37,0.12)", marginTop: 10, paddingTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#5A3E28", marginBottom: 4 }}>
                <span>{L("قبل الضريبة", "Before VAT")}</span>
                <span>{price.subtotal.toFixed(0)} {L("ر.س", "SAR")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#5A3E28" }}>
                <span>{L("ضريبة ١٥٪", "VAT 15%")}</span>
                <span>{price.vat.toFixed(0)} {L("ر.س", "SAR")}</span>
              </div>
            </div>
          </div>

          <div style={{
            background: "rgba(154,106,42,0.08)",
            border: "1px solid rgba(154,106,42,0.2)",
            borderRadius: 10,
            padding: "10px 12px",
            fontSize: 11,
            color: "#7A5218",
            lineHeight: 1.6,
          }}>
            ⚡ {L("هذا سعر تقديري فقط. العرض النهائي يصلك من الشركاء.", "This is an estimate. Final pricing comes from partners.")}
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "32px 16px" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
          <div style={{ fontSize: 13, color: "#9A6A2A", lineHeight: 1.7 }}>
            {L("أدخل المواصفات لتظهر التكلفة التقديرية هنا", "Enter specs to see the estimated cost here")}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── CATEGORY CARD ─────────────────────────── */

function CategoryCard({
  cat, selected, isAr, onClick,
}: { cat: ConfigureCategory; selected: boolean; isAr: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const svgContent = SVG_PATTERNS[cat.key] ?? SVG_PATTERNS.signs;
  const name = isAr ? cat.nameAr : cat.nameEn;
  const desc = isAr ? cat.descAr : cat.descEn;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        height: 240,
        border: selected
          ? "1.5px solid rgba(201,162,75,0.7)"
          : hovered
          ? "1px solid rgba(201,162,75,0.4)"
          : "1px solid rgba(201,162,75,0.1)",
        background: "transparent",
        padding: 0,
        transition: "border-color 0.3s, transform 0.3s, box-shadow 0.3s",
        transform: hovered || selected ? "translateY(-4px) scale(1.01)" : "none",
        boxShadow: selected
          ? "0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,162,75,0.2)"
          : hovered
          ? "0 16px 40px rgba(0,0,0,0.4)"
          : "none",
      }}
    >
      {/* Background gradient */}
      <div style={{ position: "absolute", inset: 0, background: cat.gradient }} />

      {/* SVG pattern */}
      {cat.image ? (
        <img src={cat.image} alt={name}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.75, transition: "transform 0.5s", transform: hovered ? "scale(1.05)" : "scale(1)" }}
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

      {/* Dark overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: hovered
          ? "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.15) 100%)"
          : "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.08) 100%)",
        transition: "all 0.4s",
      }} />

      {/* Shimmer sweep on hover */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(90deg, transparent, rgba(201,162,75,0.08), transparent)",
        transform: hovered ? "translateX(100%)" : "translateX(-100%)",
        transition: "transform 0.6s ease",
        pointerEvents: "none",
      }} />

      {/* Selected checkmark */}
      {selected && (
        <div style={{
          position: "absolute", top: 12, [isAr ? "left" : "right"]: 12,
          width: 22, height: 22, borderRadius: "50%",
          background: "#C9A24B",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 10,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F4EFE6" strokeWidth="3.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}

      {/* Arrow icon (hover) */}
      <div style={{
        position: "absolute", top: 12, [isAr ? "right" : "left"]: 12,
        width: 28, height: 28, borderRadius: "50%",
        border: "1px solid rgba(201,162,75,0.25)",
        background: "rgba(201,162,75,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#C9A24B",
        opacity: hovered ? 1 : 0,
        transform: hovered ? "scale(1)" : "scale(0.75)",
        transition: "all 0.3s 0.1s",
        zIndex: 10,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d={isAr ? "M19 5L5 19M5 5h14v14" : "M5 19L19 5M19 19V5H5"} />
        </svg>
      </div>

      {/* Content */}
      <div style={{
        position: "absolute", inset: 0,
        padding: "16px 18px",
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
        textAlign: isAr ? "right" : "left",
        zIndex: 10,
      }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "3px 10px", borderRadius: 999,
          background: "rgba(201,162,75,0.1)", border: "1px solid rgba(201,162,75,0.2)",
          color: "#C9A24B", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em",
          marginBottom: 8, width: "fit-content",
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0)" : "translateY(6px)",
          transition: "all 0.3s",
        }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#C9A24B", display: "block" }} />
          {cat.badge}
        </div>

        <h3 style={{
          color: "#2C1E15", fontWeight: 800, margin: "0 0 6px 0",
          fontSize: "clamp(0.95rem, 2vw, 1.1rem)", lineHeight: 1.3,
        }}>
          {name}
        </h3>

        <p style={{
          color: "#9A9080", fontSize: 12, lineHeight: 1.6, margin: 0,
          maxHeight: hovered ? 64 : 0,
          opacity: hovered ? 1 : 0,
          overflow: "hidden",
          transition: "all 0.35s",
        }}>
          {desc}
        </p>
      </div>
    </button>
  );
}

/* ─────────────────────────── MAIN PAGE ─────────────────────────── */

export default function ConfiguratorPage({ locale }: { locale: string }) {
  const isMobile = useIsMobile();
  const isAr = locale === "ar";
  const L = (ar: string, en: string) => isAr ? ar : en;

  const [categories, setCategories] = useState<ConfigureCategory[]>(DEFAULT_CONFIGURE_CATEGORIES);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [price, setPrice] = useState<PriceResult | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const configRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = siteStore.getConfigureCategories();
    if (stored && stored.length > 0) setCategories(stored);
  }, []);

  const handleSelectCat = (key: string) => {
    setSelectedCat(key);
    setPrice(null);
    setSubmitted(false);
    setTimeout(() => configRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const cat = categories.find((c) => c.key === selectedCat);

  const renderForm = () => {
    if (!selectedCat) return null;
    switch (selectedCat) {
      case "signs":    return <SignsForm   isAr={isAr} onPrice={setPrice} />;
      case "banners":  return <BannersForm isAr={isAr} onPrice={setPrice} />;
      case "flags":    return <FlagsForm   isAr={isAr} onPrice={setPrice} />;
      case "stickers": return <StickersForm isAr={isAr} onPrice={setPrice} />;
      case "promo":    return <PromoForm   isAr={isAr} onPrice={setPrice} />;
      case "expo":     return <ExpoForm    isAr={isAr} onPrice={setPrice} />;
      default:         return null;
    }
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <main dir={isAr ? "rtl" : "ltr"} style={{ background: "transparent", minHeight: "100vh" }}>

        {/* ── Page header ── */}
        <div style={{
          position: "relative", overflow: "hidden",
          background: "linear-gradient(180deg, #F4EFE6 0%, #FDFBF7 100%)",
          padding: "80px 24px 56px",
          borderBottom: "1px solid rgba(201,162,75,0.08)",
        }}>
          {/* Grid bg */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(201,162,75,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(201,162,75,0.03) 1px,transparent 1px)",
            backgroundSize: "50px 50px",
          }} />
          {/* Gold glow */}
          <div style={{
            position: "absolute", top: -100, [isAr ? "right" : "left"]: -100,
            width: 500, height: 500, borderRadius: "50%",
            background: "radial-gradient(circle,rgba(201,162,75,0.07) 0%,transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28, fontSize: 13, color: "#6B5040" }}>
              <Link href={`/${locale}`} style={{ color: "#C9A24B", textDecoration: "none" }}>{L("الرئيسية", "Home")}</Link>
              <span style={{ opacity: 0.4 }}>›</span>
              <span>{L("صمّم وسعّر", "Design & Price")}</span>
            </div>

            {/* Eyebrow */}
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(201,162,75,0.7)", letterSpacing: "0.2em", textTransform: "uppercase" as const, fontFamily: "monospace", marginBottom: 12 }}>
              {L("المسار الثاني — إعلاني", "Track Two — E3lani")}
            </div>

            <h1 style={{ color: "#2C1E15", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, marginBottom: 14, lineHeight: 1.15 }}>
              {isAr ? (
                <>صمّم منتجك واحصل على <span style={{ background: "linear-gradient(135deg,#C9A24B,#EBCB7C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>سعر تقديري</span></>
              ) : (
                <>Design & get an <span style={{ background: "linear-gradient(135deg,#C9A24B,#EBCB7C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>instant estimate</span></>
              )}
            </h1>
            <p style={{ color: "#888", fontSize: 15, lineHeight: 1.8, maxWidth: 560, margin: "0 0 28px" }}>
              {L(
                "اختر نوع المنتج، حدّد المواصفات، وشاهد التكلفة التقديرية فوراً — ثم يُرسَل طلبك للشركاء القريبين منك وتختار من عروضهم الفعلية.",
                "Choose product type, set specs, see an instant estimate — your request is then sent to nearby partners and you choose from their real offers."
              )}
            </p>
            <div style={{ width: 56, height: 3, borderRadius: 999, background: "linear-gradient(135deg,#C9A24B,#EBCB7C)", marginRight: isAr ? 0 : "auto", marginLeft: isAr ? "auto" : 0 }} />

            {/* Steps */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 28, flexWrap: "wrap" }}>
              {[
                L("اختر النوع", "Choose Type"),
                L("حدّد المواصفات", "Set Specs"),
                L("سعر تقديري", "Estimate"),
                L("عروض من الشركاء", "Partner Offers"),
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                      background: selectedCat && i <= 1 ? "#C9A24B" : "rgba(201,162,75,0.15)",
                      color: selectedCat && i <= 1 ? "#2C1E15" : "#C9A24B",
                      fontSize: 10, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>{i + 1}</div>
                    <span style={{ fontSize: 12, color: selectedCat && i <= 1 ? "#EBCB7C" : "#5A4030", fontWeight: 600, whiteSpace: "nowrap" }}>{step}</span>
                  </div>
                  {i < 3 && <span style={{ color: "#3D2B18", fontSize: 11, margin: "0 2px" }}>←</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Category grid ── */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 0" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(201,162,75,0.7)", letterSpacing: "0.2em", textTransform: "uppercase" as const, fontFamily: "monospace", marginBottom: 20 }}>
            {L("— اختر نوع المنتج", "— CHOOSE PRODUCT TYPE")}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: 14 }}>
            {categories.map((c) => (
              <CategoryCard
                key={c.key}
                cat={c}
                selected={selectedCat === c.key}
                isAr={isAr}
                onClick={() => handleSelectCat(c.key)}
              />
            ))}
          </div>
        </div>

        {/* ── Configurator ── */}
        {selectedCat && cat && (
          <div ref={configRef} style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#9A6A2A", marginBottom: 20, letterSpacing: "0.06em" }}>
              {L(`— ${cat.ar}`, `— ${cat.en}`)}
            </div>

            {submitted ? (
              /* Success state */
              <div style={{
                background: "#F4EFE6", border: "1px solid rgba(74,53,37,0.15)",
                borderRadius: 20, padding: "56px 40px", textAlign: "center",
              }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#2C1E15", marginBottom: 12 }}>
                  {L("تم إرسال طلبك!", "Request sent!")}
                </div>
                <div style={{ fontSize: 14, color: "#5A3E28", lineHeight: 1.8, maxWidth: 440, margin: "0 auto 28px" }}>
                  {L(
                    "وصل طلبك للشركاء المعتمدين في منطقتك. ستتلقى عروضهم الفعلية قريباً — أنت تختار الأفضل.",
                    "Your request reached certified partners in your area. You'll receive their real offers soon — you choose the best."
                  )}
                </div>
                <button
                  onClick={() => { setSubmitted(false); setSelectedCat(null); }}
                  style={{
                    padding: "12px 28px", borderRadius: 12, border: "none",
                    background: "linear-gradient(135deg, #C9A24B, #B38F3A)",
                    color: "#2C1E15", fontSize: 14, fontWeight: 800, cursor: "pointer",
                  }}
                >
                  {L("تسعير منتج آخر", "Price another product")}
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: 24, alignItems: "start" }}>
                {/* Left: form + request */}
                <div>
                  <div style={{
                    background: "#F4EFE6", border: "1px solid rgba(74,53,37,0.12)",
                    borderRadius: 16, padding: "28px",
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#2C1E15", marginBottom: 4 }}>
                      {L("حدّد المواصفات", "Set your specs")}
                    </div>
                    <div style={{ fontSize: 13, color: "#9A6A2A", marginBottom: 24 }}>
                      {L("السعر يتحدث فورياً مع كل تغيير", "Price updates instantly with every change")}
                    </div>
                    {renderForm()}
                  </div>

                  {/* Request form */}
                  <RequestForm
                    isAr={isAr}
                    category={selectedCat}
                    price={price}
                    locale={locale}
                    onSuccess={() => setSubmitted(true)}
                  />
                </div>

                {/* Right: price panel */}
                <PricePanel price={price} isAr={isAr} />
              </div>
            )}
          </div>
        )}

        {/* Padding when no category selected */}
        {!selectedCat && <div style={{ height: 80 }} />}
      </main>
    </>
  );
}
