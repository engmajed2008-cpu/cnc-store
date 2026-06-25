"use client";
import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";

const GOLD = "#C9A24B";
const G = "linear-gradient(135deg,#C9A24B,#EBCB7C)";

const COL: Record<string, { hex: string; label: string }> = {
  gold:   { hex: "#C9A24B", label: "ذهبي" },
  silver: { hex: "#D4D4D4", label: "فضي" },
  white:  { hex: "#F5F5F5", label: "أبيض" },
  black:  { hex: "#141414", label: "أسود" },
  red:    { hex: "#C0392B", label: "أحمر" },
  blue:   { hex: "#1F4E8C", label: "أزرق" },
  green:  { hex: "#1F7A4D", label: "أخضر" },
  copper: { hex: "#B06A3B", label: "نحاسي" },
};

export type LetterTypeDef = {
  slug: string; nameAr: string; nameEn: string; tagAr: string;
  faceMaterial: string; sideMaterial: string; lighting: string;
  rateMultiplier: number; gradientCss: string; availableColors: string[];
  colorful: boolean;
};

export type SideStyleDef = {
  slug: string; nameAr: string; descriptionAr: string;
  priceAddPercent: number; metalOnly: boolean; icon: string;
};

export type FontOpt = { id: string; label: string; family: string };

export type MaterialSelection = {
  typeId: string;
  sideMat: string;
  faceColorId: string;
  sideColorId: string;
  faceCustomColor: string;
  sideCustomColor: string;
  faceBorder: boolean;
  sideStyleId: string;
  uniMat: boolean;
  lightTypeId: string;
  lightTempId: string;
  letterDepthCm: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onApply: (sel: MaterialSelection) => void;
  letterTypes: LetterTypeDef[];
  sideStyles: SideStyleDef[];
  fonts: FontOpt[];
  initial: MaterialSelection;
  group: "text" | "content";
};

const MAT_AR: Record<string, string> = { acrylic: "أكريليك", stainless: "إستانلس", zincor: "زنكور", aluminum: "ألومنيوم" };

const LIGHT_TEMPS = [
  { id: "warm",    label: "أصفر دافئ",  glow: "#FFC65C" },
  { id: "neutral", label: "أبيض طبيعي", glow: "#FFE9C7" },
  { id: "cool",    label: "أبيض بارد",  glow: "#CFE6FF" },
];

// الأنواع الخمسة للوحات حسب الإضاءة
type PanelType = {
  id: string; nameAr: string; descAr: string; tags: string[];
  gradient: string; lightTypeId: string;
  typeId: string; sideMat: string; uniMat: boolean;
  faceColorId: string; sideColorId: string;
  availableColors: string[];
};

const PANEL_TYPES: PanelType[] = [
  {
    id: "front-lit", nameAr: "إضاءة أمامية", descAr: "الوجه الأمامي للحرف مضيء — يخرج الضوء من الوجه",
    tags: ["وجه أكريليك", "جوانب معدنية", "ضوء أمامي"],
    gradient: "linear-gradient(135deg,#0d1b2e 0%,#1a4a8a 50%,#6ab0f5 100%)",
    lightTypeId: "front", typeId: "acrylic", sideMat: "aluminum", uniMat: false,
    faceColorId: "white", sideColorId: "silver",
    availableColors: ["white","black","red","blue","green","gold","copper","silver"],
  },
  {
    id: "back-lit", nameAr: "إضاءة خلفية", descAr: "هالة ضوئية خلف الحرف — الضوء يخرج من الخلف",
    tags: ["هالة خلفية", "جوانب زنكور", "وجه معدن"],
    gradient: "linear-gradient(135deg,#1a0800,#8B4513 50%,#FFB347 100%)",
    lightTypeId: "back", typeId: "zincor", sideMat: "zincor", uniMat: true,
    faceColorId: "gold", sideColorId: "gold",
    availableColors: ["gold","silver","copper","white","black"],
  },
  {
    id: "side-lit", nameAr: "إضاءة جانبية", descAr: "الضوء يخرج من جوانب الحرف — تأثير هالة معدنية",
    tags: ["جوانب مخصصة", "وجه معدن", "ضوء جانبي"],
    gradient: "linear-gradient(135deg,#001a00,#1a5c1a 50%,#5cdb5c 100%)",
    lightTypeId: "front", typeId: "acrylic", sideMat: "stainless", uniMat: false,
    faceColorId: "white", sideColorId: "silver",
    availableColors: ["white","silver","gold","black","red","blue"],
  },
  {
    id: "non-lit", nameAr: "بدون إضاءة", descAr: "حروف صمّاء — تعمل بالضوء الطبيعي",
    tags: ["إستانلس", "ألومنيوم", "زنكور", "بلا كهرباء"],
    gradient: "linear-gradient(135deg,#2a2a2a,#5a5a5a 50%,#9a9a9a 100%)",
    lightTypeId: "none", typeId: "stainless", sideMat: "stainless", uniMat: true,
    faceColorId: "silver", sideColorId: "silver",
    availableColors: ["silver","gold","black","white","copper"],
  },
  {
    id: "mix-lit", nameAr: "إضاءة مختلطة", descAr: "أمامية + خلفية معاً — توهج من كل الاتجاهات",
    tags: ["توهج كامل", "أمامية + خلفية"],
    gradient: "linear-gradient(135deg,#1a0033,#6a0dad 50%,#d896ff 100%)",
    lightTypeId: "double", typeId: "acrylic", sideMat: "acrylic", uniMat: true,
    faceColorId: "white", sideColorId: "white",
    availableColors: ["white","gold","red","blue","green","copper"],
  },
];

const DEFAULT_WORD = "إعلاني";

const depthBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8, cursor: "pointer",
  border: "1px solid rgba(154,106,42,0.25)", background: "#FDFBF7",
  color: "#9A6A2A", fontSize: "1rem", fontWeight: 900, lineHeight: 1,
  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};

const zoomBtn: React.CSSProperties = {
  width: 22, height: 22, borderRadius: 6, cursor: "pointer",
  border: "1px solid rgba(201,162,75,0.3)", background: "rgba(255,255,255,0.08)",
  color: "#F4ECDD", fontSize: "0.85rem", fontWeight: 900, lineHeight: 1,
  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};

// map lightTypeId → panelType id (best guess for initial)
function derivePanelId(s: MaterialSelection): string {
  if (s.lightTypeId === "none")   return "non-lit";
  if (s.lightTypeId === "back")   return "back-lit";
  if (s.lightTypeId === "double") return "mix-lit";
  if (s.lightTypeId === "front")  return s.sideMat === "stainless" ? "side-lit" : "front-lit";
  return "";
}

export default function MaterialModal({ open, onClose, onApply, letterTypes, sideStyles, fonts, initial, group }: Props) {
  const [sel, setSel] = useState<MaterialSelection>(initial);
  const [panelTypeId, setPanelTypeId] = useState<string>(() => derivePanelId(initial));
  const [previewText, setPreviewText] = useState(DEFAULT_WORD);
  const [fontId, setFontId] = useState(fonts[0]?.id || "cairo");
  const [nightView, setNightView] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewStretchX, setPreviewStretchX] = useState(100);
  const [previewStretchY, setPreviewStretchY] = useState(100);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSel(initial);
      setPanelTypeId(derivePanelId(initial));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = useCallback((p: Partial<MaterialSelection>) => setSel(prev => ({ ...prev, ...p })), []);

  const selectPanelType = useCallback((pt: PanelType) => {
    setPanelTypeId(pt.id);
    patch({
      typeId: pt.typeId, sideMat: pt.sideMat, uniMat: pt.uniMat,
      lightTypeId: pt.lightTypeId, faceColorId: pt.faceColorId,
      sideColorId: pt.sideColorId, faceCustomColor: "", sideCustomColor: "",
      faceBorder: false,
      sideStyleId: pt.lightTypeId === "none" ? "solid" : sel.sideStyleId,
    });
  }, [patch, sel.sideStyleId]);

  if (!open) return null;

  const activePT = PANEL_TYPES.find(pt => pt.id === panelTypeId);
  const colors = activePT?.availableColors ?? ["gold", "silver", "white", "black"];
  const isMetalSide = sel.sideMat !== "acrylic";
  const hasLighting = sel.lightTypeId !== "none";
  const showSideStyles = isMetalSide && hasLighting;
  const frameEligible = sel.typeId === "acrylic" && (sel.sideMat === "stainless" || sel.sideMat === "zincor");
  const activeSS = sideStyles.find(ss => ss.slug === sel.sideStyleId);

  const faceHex = sel.faceCustomColor || COL[sel.faceColorId]?.hex || "#D4D4D4";
  const sideHex = sel.sideCustomColor || COL[sel.sideColorId]?.hex || "#D4D4D4";
  const activeFont = fonts.find(f => f.id === fontId) || fonts[0];
  const glowHex = LIGHT_TEMPS.find(t => t.id === sel.lightTempId)?.glow || "#FFE9C7";

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem", fontFamily: "Tajawal, Cairo, sans-serif",
      backdropFilter: "blur(6px)",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "min(1080px, 96vw)", maxHeight: "92vh",
        background: "#FDFBF7", borderRadius: 18,
        border: `1.5px solid rgba(201,162,75,0.3)`,
        boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,162,75,0.1)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.85rem 1.2rem", borderBottom: "1px solid rgba(154,106,42,0.15)",
          background: "rgba(244,239,230,0.8)",
        }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: "1rem", color: "#2C1E15" }}>
              🔩 اختيار خامة {group === "text" ? "النصوص" : "المحتويات"}
            </div>
            <div style={{ fontSize: "0.65rem", color: "#634E40", marginTop: 2 }}>
              غيّر الخامة واللون والإضاءة والخط — النموذج يتحدّث مباشرة
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: 10, cursor: "pointer",
            border: "1px solid rgba(154,106,42,0.2)", background: "#F4EFE6",
            color: "#634E40", fontSize: "1.1rem", fontWeight: 700,
          }}>✕</button>
        </div>

        {/* Body — fixed row, no wrap, each side scrolls independently */}
        <div style={{
          flex: 1, minHeight: 0,
          display: "flex", flexDirection: "row",
          overflow: "hidden",
        }}>
          {/* ─── Options panel — LEFT (narrower, scrollable) ─── */}
          <div ref={scrollRef} style={{
            flex: "0 0 42%", minWidth: 260, maxWidth: 400,
            overflowY: "auto", overflowX: "hidden",
            padding: "0.85rem 1rem",
            display: "flex", flexDirection: "column", gap: "0.75rem",
            borderInlineEnd: "1px solid rgba(154,106,42,0.12)",
          }}>

            {/* 1. نوع اللوحة — الخمسة الكروت الرئيسية */}
            <Section title="نوع اللوحة" icon="✦">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {PANEL_TYPES.map(pt => {
                  const on = panelTypeId === pt.id;
                  return (
                    <button key={pt.id} onClick={() => selectPanelType(pt)} style={{
                      display: "flex", alignItems: "center", borderRadius: 11, overflow: "hidden",
                      cursor: "pointer", padding: 0, textAlign: "right",
                      border: `2px solid ${on ? GOLD : "rgba(154,106,42,0.15)"}`,
                      background: on ? "rgba(201,162,75,0.07)" : "#F4EFE6",
                      boxShadow: on ? `0 0 14px rgba(201,162,75,0.2)` : "none",
                      transition: "all 0.18s",
                    }}>
                      {/* شريط اللون */}
                      <div style={{
                        width: 44, height: 54, flexShrink: 0,
                        background: pt.gradient,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ fontFamily: "Cairo,sans-serif", fontWeight: 900, fontSize: "1rem", color: "rgba(255,255,255,0.9)", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>أ</span>
                      </div>
                      {/* النص */}
                      <div style={{ flex: 1, padding: "0.35rem 0.6rem", minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: "0.78rem", color: on ? GOLD : "#2C1E15", marginBottom: 1 }}>{pt.nameAr}</div>
                        <div style={{ fontSize: "0.57rem", color: "#634E40", lineHeight: 1.4, marginBottom: 3 }}>{pt.descAr}</div>
                        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                          {pt.tags.map(tag => (
                            <span key={tag} style={{
                              fontSize: "0.5rem", padding: "1px 5px", borderRadius: 5,
                              background: on ? "rgba(201,162,75,0.2)" : "rgba(154,106,42,0.07)",
                              color: on ? GOLD : "#9A7A46", fontWeight: 700,
                            }}>{tag}</span>
                          ))}
                        </div>
                      </div>
                      {/* مؤشر */}
                      <div style={{ padding: "0 0.55rem", flexShrink: 0 }}>
                        <span style={{
                          width: 16, height: 16, borderRadius: "50%", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          border: `2px solid ${on ? GOLD : "rgba(154,106,42,0.25)"}`,
                          background: on ? GOLD : "transparent",
                        }}>
                          {on && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2C1E15" }} />}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* الخيارات التفصيلية — بعد اختيار النوع */}
            {activePT && (<>

              {/* 2. لون الحرف */}
              <Section title="لون الحرف" icon="🎨">
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div>
                    <div style={{ fontSize: "0.6rem", color: "#634E40", fontWeight: 700, marginBottom: "0.25rem" }}>
                      {sel.uniMat ? "لون الحرف (وجه + جوانب)" : "لون الوجه"}
                    </div>
                    <ColorRow
                      colors={colors}
                      selectedId={sel.faceCustomColor ? "" : sel.faceColorId}
                      customHex={sel.faceCustomColor}
                      allowCustom={true}
                      onPickPreset={id => patch(sel.uniMat
                        ? { faceColorId: id, faceCustomColor: "", sideColorId: id, sideCustomColor: "" }
                        : { faceColorId: id, faceCustomColor: "" })}
                      onPickCustom={h => patch(sel.uniMat
                        ? { faceCustomColor: h, sideCustomColor: h }
                        : { faceCustomColor: h })}
                    />
                  </div>
                  {!sel.uniMat && (
                    <div>
                      <div style={{ fontSize: "0.6rem", color: "#634E40", fontWeight: 700, marginBottom: "0.25rem" }}>لون الجوانب</div>
                      <ColorRow
                        colors={colors}
                        selectedId={sel.sideCustomColor ? "" : sel.sideColorId}
                        customHex={sel.sideCustomColor}
                        allowCustom={true}
                        onPickPreset={id => patch({ sideColorId: id, sideCustomColor: "" })}
                        onPickCustom={h => patch({ sideCustomColor: h })}
                      />
                    </div>
                  )}
                </div>
              </Section>

              {/* 3. درجة الإضاءة + العمق — صفّين جنباً إلى جنب */}
              <Section title={hasLighting ? "الإضاءة والعمق" : "عمق الحرف"} icon={hasLighting ? "💡" : "📐"}>
                {hasLighting && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.35rem", marginBottom: "0.5rem" }}>
                    {LIGHT_TEMPS.map(t => {
                      const on = sel.lightTempId === t.id;
                      return (
                        <button key={t.id} onClick={() => patch({ lightTempId: t.id })} style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                          padding: "0.35rem 0.2rem", borderRadius: 8, cursor: "pointer",
                          fontFamily: "Tajawal, Cairo, sans-serif", fontSize: "0.6rem", fontWeight: 700,
                          border: `1.5px solid ${on ? GOLD : "rgba(154,106,42,0.15)"}`,
                          background: on ? "rgba(201,162,75,0.08)" : "#F4EFE6",
                          color: on ? GOLD : "#2C1E15",
                        }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: t.glow, boxShadow: `0 0 5px ${t.glow}`, flexShrink: 0 }} />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                )}
                {/* عمق الحرف */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <button onClick={() => patch({ letterDepthCm: Math.max(2, sel.letterDepthCm - 1) })} style={depthBtn}>−</button>
                  <div style={{ flex: 1, display: "flex", gap: "0.3rem" }}>
                    {[3, 5, 8, 12].map(v => {
                      const on = sel.letterDepthCm === v;
                      return (
                        <button key={v} onClick={() => patch({ letterDepthCm: v })} style={{
                          flex: 1, padding: "0.3rem 0.1rem", borderRadius: 7, cursor: "pointer",
                          fontFamily: "Tajawal, Cairo, sans-serif", fontSize: "0.62rem", fontWeight: 700,
                          border: `1.5px solid ${on ? GOLD : "rgba(154,106,42,0.15)"}`,
                          background: on ? "rgba(201,162,75,0.08)" : "#F4EFE6",
                          color: on ? GOLD : "#634E40",
                        }}>{v}</button>
                      );
                    })}
                  </div>
                  <button onClick={() => patch({ letterDepthCm: Math.min(25, sel.letterDepthCm + 1) })} style={depthBtn}>+</button>
                  <span style={{ fontSize: "0.6rem", color: "#8A7A66", fontWeight: 700, flexShrink: 0 }}>{sel.letterDepthCm} سم</span>
                </div>
              </Section>

              {/* 4. خامة الجوانب */}
              {!sel.uniMat && (
                <Section title="خامة الجوانب" icon="🔩">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.35rem" }}>
                    {(["aluminum","stainless","zincor"] as const).map(mat => {
                      const on = sel.sideMat === mat;
                      const labels: Record<string, string> = { aluminum: "ألومنيوم", stainless: "إستانلس", zincor: "زنكور" };
                      return (
                        <button key={mat} onClick={() => patch({ sideMat: mat })} style={{
                          padding: "0.4rem 0.2rem", borderRadius: 8, cursor: "pointer",
                          fontFamily: "Tajawal, Cairo, sans-serif", fontSize: "0.65rem", fontWeight: 700,
                          border: `1.5px solid ${on ? GOLD : "rgba(154,106,42,0.15)"}`,
                          background: on ? "rgba(201,162,75,0.08)" : "#F4EFE6",
                          color: on ? GOLD : "#2C1E15",
                        }}>{labels[mat]}</button>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* 5. كنتور */}
              {group === "text" && !sel.uniMat && frameEligible && (
                <Section title="كنتور حول الأحرف" icon="⬡">
                  <label style={{
                    display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer",
                    padding: "0.5rem 0.6rem", borderRadius: 9,
                    background: sel.faceBorder ? "rgba(201,162,75,0.08)" : "#F4EFE6",
                    border: `1.5px solid ${sel.faceBorder ? GOLD + "55" : "rgba(154,106,42,0.15)"}`,
                  }}>
                    <input type="checkbox" checked={sel.faceBorder}
                      onChange={e => patch({ faceBorder: e.target.checked })}
                      style={{ accentColor: GOLD, width: 15, height: 15 }} />
                    <div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#2C1E15" }}>إضافة كنتور</div>
                      <div style={{ fontSize: "0.57rem", color: "#634E40" }}>حدّ يتبع شكل كل حرف بخامة الجوانب</div>
                    </div>
                  </label>
                </Section>
              )}

              {/* 6. نمط الجوانب */}
              {showSideStyles && (
                <Section title="نمط الجوانب (تخريم)" icon="◈">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.35rem" }}>
                    {sideStyles.map(ss => {
                      const on = sel.sideStyleId === ss.slug;
                      return (
                        <button key={ss.slug} onClick={() => patch({ sideStyleId: ss.slug })} style={{
                          textAlign: "center", padding: "0.45rem 0.25rem", borderRadius: 9, cursor: "pointer",
                          fontFamily: "Tajawal, Cairo, sans-serif",
                          border: `1.5px solid ${on ? GOLD : "rgba(154,106,42,0.15)"}`,
                          background: on ? "rgba(201,162,75,0.08)" : "#F4EFE6",
                        }}>
                          <div style={{ fontSize: "1rem", color: on ? GOLD : "#5A4A3A" }}>{ss.icon}</div>
                          <div style={{ fontSize: "0.6rem", fontWeight: 800, color: on ? GOLD : "#2C1E15" }}>{ss.nameAr}</div>
                          {ss.priceAddPercent > 0 && <div style={{ fontSize: "0.5rem", color: "#B07820" }}>+{ss.priceAddPercent}%</div>}
                        </button>
                      );
                    })}
                  </div>
                </Section>
              )}
            </>)}

            {!activePT && (
              <div style={{ textAlign: "center", padding: "1.5rem 1rem", color: "#9A7A46", fontSize: "0.72rem", lineHeight: 2 }}>
                <div style={{ fontSize: "1.8rem", marginBottom: 6 }}>☝️</div>
                اختر نوع اللوحة أعلاه
                <br /><span style={{ fontSize: "0.62rem", color: "#B0956B" }}>ستظهر خيارات الألوان والمقاسات هنا</span>
              </div>
            )}
          </div>

          {/* ─── 3D Preview panel — RIGHT (fills full height) ─── */}
          <div style={{
            flex: 1, minWidth: 0,
            display: "flex", flexDirection: "column",
            background: nightView
              ? "radial-gradient(ellipse at 50% 40%, #0a0806 0%, #050403 70%, #000 100%)"
              : "radial-gradient(ellipse at 50% 35%, #2a2018 0%, #1a1410 60%, #120d08 100%)",
            position: "relative",
            transition: "background 0.4s",
            overflow: "hidden",
          }}>
            <div style={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden" }}>
              <Letter3DText
                text={previewText || DEFAULT_WORD}
                fontFamily={activeFont?.family || "Cairo, sans-serif"}
                faceHex={faceHex}
                sideHex={sideHex}
                faceMaterial={sel.typeId}
                faceBorder={sel.faceBorder && frameEligible}
                sideStyleSlug={showSideStyles ? sel.sideStyleId : "solid"}
                lightTypeId={sel.lightTypeId}
                glowHex={glowHex}
                depthCm={sel.letterDepthCm}
                nightView={nightView}
                zoom={previewZoom}
                stretchX={previewStretchX}
                stretchY={previewStretchY}
                onZoomChange={setPreviewZoom}
                onStretchXChange={setPreviewStretchX}
                onStretchYChange={setPreviewStretchY}
              />
            </div>

            {/* زر معاينة تأثير الإنارة (وضع ليلي) */}
            {hasLighting && (
              <button onClick={() => setNightView(v => !v)} style={{
                position: "absolute", top: 10, insetInlineStart: 10, zIndex: 4,
                display: "flex", alignItems: "center", gap: 6,
                padding: "0.4rem 0.7rem", borderRadius: 9, cursor: "pointer",
                fontFamily: "Tajawal, Cairo, sans-serif", fontSize: "0.7rem", fontWeight: 800,
                border: `1px solid ${nightView ? GOLD : "rgba(201,162,75,0.35)"}`,
                background: nightView ? GOLD : "rgba(0,0,0,0.45)",
                color: nightView ? "#2C1E15" : "#F4ECDD",
                backdropFilter: "blur(4px)",
                boxShadow: nightView ? "0 0 14px rgba(201,162,75,0.4)" : "none",
              }}>
                {nightView ? "☀️ وضع النهار" : "🌙 شاهد الإنارة"}
              </button>
            )}

            {/* Preview controls bar — text + font */}
            <div style={{
              padding: "0.6rem 0.75rem",
              background: "rgba(0,0,0,0.35)",
              borderTop: "1px solid rgba(201,162,75,0.18)",
              display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap",
            }}>
              <input
                value={previewText}
                onChange={e => setPreviewText(e.target.value)}
                placeholder={DEFAULT_WORD}
                maxLength={14}
                style={{
                  flex: "1 1 110px", minWidth: 90, padding: "0.4rem 0.6rem", borderRadius: 8,
                  border: "1px solid rgba(201,162,75,0.3)", background: "rgba(255,255,255,0.07)",
                  color: "#F4ECDD", fontFamily: "Tajawal, Cairo, sans-serif", fontSize: "0.8rem",
                  outline: "none", direction: "rtl",
                }}
              />
              <select
                value={fontId}
                onChange={e => setFontId(e.target.value)}
                style={{
                  flex: "1 1 110px", minWidth: 90, padding: "0.4rem 0.5rem", borderRadius: 8,
                  border: "1px solid rgba(201,162,75,0.3)", background: "rgba(255,255,255,0.07)",
                  color: "#F4ECDD", fontFamily: "Tajawal, Cairo, sans-serif", fontSize: "0.78rem",
                  outline: "none", cursor: "pointer",
                }}
              >
                {fonts.map(f => (
                  <option key={f.id} value={f.id} style={{ color: "#2C1E15" }}>{f.label}</option>
                ))}
              </select>
            </div>
            {/* أشرطة التحكم: حجم + مد أفقي + مد رأسي */}
            <div style={{
              padding: "0.5rem 0.75rem", background: "rgba(0,0,0,0.3)",
              borderTop: "1px solid rgba(201,162,75,0.12)",
              display: "flex", flexDirection: "column", gap: "0.35rem",
            }}>
              {/* حجم الحرف */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.6rem", color: "rgba(201,162,75,0.8)", fontWeight: 700, minWidth: 60, textAlign: "right" }}>حجم الحرف</span>
                <button onClick={() => setPreviewZoom(z => Math.max(0.4, +(z - 0.1).toFixed(1)))} style={zoomBtn}>−</button>
                <input type="range" min={40} max={240} step={5} value={Math.round(previewZoom * 100)}
                  onChange={e => setPreviewZoom(+e.target.value / 100)}
                  style={{ flex: 1, accentColor: GOLD, cursor: "pointer", height: 4 }} />
                <button onClick={() => setPreviewZoom(z => Math.min(2.4, +(z + 0.1).toFixed(1)))} style={zoomBtn}>+</button>
                <span style={{ fontSize: "0.62rem", color: GOLD, fontWeight: 800, minWidth: 32, textAlign: "center" }}>{Math.round(previewZoom * 100)}%</span>
                <button onClick={() => { setPreviewZoom(1); setPreviewStretchX(100); setPreviewStretchY(100); }} title="إعادة تعيين" style={{ ...zoomBtn, fontSize: "0.7rem" }}>↺</button>
              </div>
              {/* مد أفقي */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.6rem", color: "rgba(201,162,75,0.8)", fontWeight: 700, minWidth: 60, textAlign: "right" }}>مد أفقي</span>
                <button onClick={() => setPreviewStretchX(x => Math.max(40, x - 5))} style={zoomBtn}>−</button>
                <input type="range" min={40} max={200} step={5} value={previewStretchX}
                  onChange={e => setPreviewStretchX(+e.target.value)}
                  style={{ flex: 1, accentColor: GOLD, cursor: "pointer", height: 4 }} />
                <button onClick={() => setPreviewStretchX(x => Math.min(200, x + 5))} style={zoomBtn}>+</button>
                <span style={{ fontSize: "0.62rem", color: GOLD, fontWeight: 800, minWidth: 32, textAlign: "center" }}>{previewStretchX}%</span>
                <div style={{ width: 24 }} />
              </div>
              {/* مد رأسي */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.6rem", color: "rgba(201,162,75,0.8)", fontWeight: 700, minWidth: 60, textAlign: "right" }}>مد رأسي</span>
                <button onClick={() => setPreviewStretchY(y => Math.max(40, y - 5))} style={zoomBtn}>−</button>
                <input type="range" min={40} max={200} step={5} value={previewStretchY}
                  onChange={e => setPreviewStretchY(+e.target.value)}
                  style={{ flex: 1, accentColor: GOLD, cursor: "pointer", height: 4 }} />
                <button onClick={() => setPreviewStretchY(y => Math.min(200, y + 5))} style={zoomBtn}>+</button>
                <span style={{ fontSize: "0.62rem", color: GOLD, fontWeight: 800, minWidth: 32, textAlign: "center" }}>{previewStretchY}%</span>
                <div style={{ width: 24 }} />
              </div>
              <div style={{ textAlign: "center", fontSize: "0.54rem", color: "rgba(201,162,75,0.4)", marginTop: 1 }}>
                🖱️ اسحب لتدوير · عجلة الماوس للتكبير
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: "0.8rem 1.2rem", borderTop: "1px solid rgba(154,106,42,0.15)",
          background: "rgba(244,239,230,0.8)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem",
        }}>
          <div style={{ fontSize: "0.65rem", color: "#634E40", lineHeight: 1.5 }}>
            {activePT && <><b style={{ color: "#2C1E15" }}>{activePT.nameAr}</b> · </>}
            <span style={{ color: faceHex === sideHex ? faceHex : undefined }}>
              {sel.faceCustomColor ? "لون مخصص" : COL[sel.faceColorId]?.label || sel.faceColorId}
            </span>
            {!sel.uniMat && faceHex !== sideHex && (
              <> / جوانب: <span style={{ color: sideHex }}>{sel.sideCustomColor ? "مخصص" : COL[sel.sideColorId]?.label || sel.sideColorId}</span></>
            )}
            {hasLighting && ` · ${activePT?.nameAr ?? ""} 💡`}
            {sel.faceBorder && frameEligible && " · كنتور"}
            {activeSS && activeSS.slug !== "solid" && showSideStyles && ` · ${activeSS.nameAr}`}
          </div>
          <button onClick={() => { onApply(sel); onClose(); }} style={{
            padding: "0.6rem 2rem", borderRadius: 11, border: "none", cursor: "pointer",
            fontFamily: "Tajawal, Cairo, sans-serif", fontWeight: 900, fontSize: "0.85rem",
            background: G, color: "#2C1E15", boxShadow: "0 4px 16px rgba(201,162,75,0.3)",
          }}>
            تطبيق ✓
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Section wrapper ─── */
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", gap: "0.4rem",
        marginBottom: "0.5rem", paddingBottom: "0.35rem",
        borderBottom: "1px solid rgba(154,106,42,0.12)",
      }}>
        <span style={{ fontSize: "0.9rem" }}>{icon}</span>
        <span style={{ fontWeight: 800, fontSize: "0.78rem", color: "#2C1E15" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

/* ─── Color swatch row ─── */
function ColorRow({ colors, selectedId, customHex, allowCustom, onPickPreset, onPickCustom }: {
  colors: string[]; selectedId: string; customHex: string; allowCustom: boolean;
  onPickPreset: (id: string) => void; onPickCustom: (hex: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", alignItems: "flex-start" }}>
      {colors.map(id => {
        const c = COL[id]; if (!c) return null;
        const on = selectedId === id;
        return (
          <button key={id} onClick={() => onPickPreset(id)} title={c.label} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            cursor: "pointer", background: "none", border: "none", padding: 0,
          }}>
            <span style={{
              width: 34, height: 34, borderRadius: 9, background: c.hex,
              border: `2.5px solid ${on ? GOLD : "rgba(154,106,42,0.15)"}`,
              boxShadow: on ? "0 0 0 2px rgba(201,162,75,0.3)" : "none", display: "block",
            }} />
            <span style={{ fontSize: "0.58rem", color: on ? GOLD : "#8A7A66" }}>{c.label}</span>
          </button>
        );
      })}
      {allowCustom && (
        <label title="ألوان أخرى" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}>
          <span style={{
            position: "relative", width: 34, height: 34, borderRadius: 9, overflow: "hidden", display: "block",
            border: `2.5px solid ${customHex ? GOLD : "rgba(154,106,42,0.15)"}`,
            boxShadow: customHex ? "0 0 0 2px rgba(201,162,75,0.3)" : "none",
            background: customHex || "conic-gradient(from 0deg,#ff3b30,#ffcc00,#34c759,#00c7be,#007aff,#af52de,#ff2d55,#ff3b30)",
          }}>
            <input type="color" value={customHex || "#888888"} onChange={e => onPickCustom(e.target.value)}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", border: "none", padding: 0 }} />
          </span>
          <span style={{ fontSize: "0.58rem", color: customHex ? GOLD : "#8A7A66" }}>أخرى</span>
        </label>
      )}
    </div>
  );
}

/* شدّة توهّج التخريم لكل طبقة عمق حسب النمط — تعطي كل نمط بصمة بصرية مميّزة على الجدار الجانبي */
function perfIntensity(slug: string, i: number, n: number): number {
  const t = i / Math.max(1, n - 1);
  switch (slug) {
    case "dots":     return Math.cos(i * 1.5) > 0.55 ? 1 : 0.1;          // نقاط متباعدة مضيئة
    case "slots":    return (i % 4 < 2) ? 0.95 : 0.1;                    // شرائح أفقية متناوبة
    case "squares":  return (i % 5 < 2) ? 0.9 : 0.08;                    // مربعات منتظمة
    case "diamonds": return Math.abs(((i % 6) / 6) * 2 - 1) < 0.4 ? 1 : 0.1; // إيقاع معيّني
    case "arabic":   return 0.4 + 0.45 * Math.abs(Math.sin(i * 0.95 + t)); // زخرفة دافئة كثيفة
    default:         return 0;
  }
}

/* ─── Realistic 3D extruded text preview (pure CSS 3D) ───
   يبني الحرف البارز بتكديس نسخ من النص في عمق Z (الجوانب) مع وجه معدني/زجاجي واقعي،
   ويُظهر التخريم كضوء يشعّ من الجوانب بنمط الاختيار، ووضع ليلي لمعاينة الإنارة. */
function Letter3DText({ text, fontFamily, faceHex, sideHex, faceMaterial, faceBorder, sideStyleSlug, lightTypeId, glowHex, depthCm, nightView, zoom, stretchX, stretchY, onZoomChange, onStretchXChange, onStretchYChange }: {
  text: string; fontFamily: string; faceHex: string; sideHex: string; faceMaterial: string;
  faceBorder: boolean; sideStyleSlug: string; lightTypeId: string; glowHex: string;
  depthCm: number; nightView: boolean;
  zoom: number; stretchX: number; stretchY: number;
  onZoomChange: (v: number) => void; onStretchXChange: (v: number) => void; onStretchYChange: (v: number) => void;
}) {
  const setZoom = onZoomChange;
  const setStretchX = onStretchXChange;
  const setStretchY = onStretchYChange;
  const [rotY, setRotY] = useState(-40);
  const [rotX, setRotX] = useState(-16);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(64);

  // ملاءمة حجم الخط لعرض المنطقة وطول الكلمة
  useLayoutEffect(() => {
    const w = wrapRef.current?.clientWidth || 300;
    const len = Math.max(2, [...text].length);
    const fit = Math.floor((w * 0.82) / (len * 0.62));
    setFontSize(Math.max(30, Math.min(96, fit)));
  }, [text]);

  const onDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch { /* تجاهل أحداث المؤشّر الاصطناعية */ }
  }, []);
  const onMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    setRotY(p => Math.max(-75, Math.min(75, p + dx * 0.45)));
    setRotX(p => Math.max(-50, Math.min(50, p - dy * 0.45)));
    last.current = { x: e.clientX, y: e.clientY };
  }, []);
  const onUp = useCallback(() => { dragging.current = false; }, []);

  // منع scroll الصفحة عند استخدام عجلة الماوس فوق المعاينة
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setZoom(z => Math.max(0.5, Math.min(2.4, z - e.deltaY * 0.0015)));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const hasGlow = lightTypeId !== "none";
  const frontLit = lightTypeId === "front" || lightTypeId === "double";
  const backLit = lightTypeId === "back" || lightTypeId === "double";
  const perforated = sideStyleSlug !== "solid" && hasGlow;

  // عمق البروز بالبكسل مشتقّ من بروز الحرف (سم) + عدد طبقات التكديس
  // (طبقات أكثف من العمق تضمن جداراً مصمتاً بلا فجوات بين النسخ)
  const depth  = Math.max(16, Math.min(80, Math.round(depthCm * 4.4)));
  const layers = Math.max(22, Math.min(54, Math.round(depth * 1.3)));

  // وجه الحرف — واقعي حسب الخامة × وضع الإضاءة
  const faceFill = frontLit && nightView
    ? faceFillLit(faceMaterial, faceHex, glowHex)
    : frontLit
      ? materialFace(faceMaterial, adjustBrightness(faceHex, 20))  // نهار: إضاءة هادئة
      : materialFace(faceMaterial, faceHex);

  // النص الأساسي المشترك
  const textBase: React.CSSProperties = {
    position: "absolute", inset: 0, margin: "auto",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily, fontWeight: 900, fontSize, lineHeight: 1.05,
    whiteSpace: "nowrap", direction: "rtl", userSelect: "none",
  };

  // قوّة التوهّج تزيد في الوضع الليلي
  const glowMul = nightView ? 1.8 : 1;

  // نصف قطر البلوم يختلف: الأكريليك ينتشر أكثر لأنه شفّاف
  const bloomR1 = faceMaterial === "acrylic" ? Math.round(14 * glowMul) : Math.round(8 * glowMul);
  const bloomR2 = faceMaterial === "acrylic" ? Math.round(40 * glowMul) : Math.round(20 * glowMul);
  const faceBrightBoost = nightView ? (faceMaterial === "acrylic" ? 1.35 : 1.18) : 1.05;

  // فلتر الوجه — يختلف حسب حالة الإضاءة
  const faceFilter = frontLit
    ? `drop-shadow(0 0 ${bloomR1}px ${glowHex}) drop-shadow(0 0 ${bloomR2}px ${glowHex}88) brightness(${faceBrightBoost})`
    : nightView
      ? "brightness(0.45)"
      : "drop-shadow(0 3px 6px rgba(0,0,0,0.5))";

  return (
    <div
      ref={wrapRef}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
      style={{
        position: "relative",
        width: "100%", height: "100%", cursor: dragging.current ? "grabbing" : "grab",
        display: "flex", alignItems: "center", justifyContent: "center",
        perspective: 1100, userSelect: "none", touchAction: "none",
      }}
    >

      <div style={{
        position: "relative", width: "85%", height: "70%",
        transformStyle: "preserve-3d",
        transform: `scale(${zoom}) scaleX(${stretchX / 100}) scaleY(${stretchY / 100}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
        transition: dragging.current ? "none" : "transform 0.25s ease-out",
      }}>
        {/* هالة خلفية — طبقتان ليلاً (خارجية ناعمة + داخلية مركّزة) لعمق الهالة الواقعي */}
        {backLit && (
          <>
            <div style={{
              ...textBase, transform: `translateZ(-34px)`,
              color: glowHex,
              filter: `blur(${nightView ? 32 : 14}px) brightness(${nightView ? 2.6 : 1.4})`,
              opacity: nightView ? 0.92 : 0.48,
            }}>{text}</div>
            {nightView && (
              <div style={{
                ...textBase, transform: `translateZ(-16px)`,
                color: glowHex,
                filter: `blur(9px) brightness(3.2)`,
                opacity: 0.58,
              }}>{text}</div>
            )}
          </>
        )}

        {/* طبقات الجوانب (العمق) — مكدّسة من الظهر (z=0) حتى الوجه (z=depth) فتُكوّن جداراً مصمتاً */}
        {Array.from({ length: layers }).map((_, i) => {
          const t = i / (layers - 1);            // 0 = ظهر, 1 = أمام (تحت الوجه)
          const z = t * depth;
          // تظليل نِسبي (ضرب): الجوانب أغمق دائماً من الوجه مهما كان اللون (فاتح أو غامق) —
          // أغمق في الظهر (×0.30) وأفتح قرب الوجه (×0.72) لإبراز السماكة بتباين قوي ثابت
          let shade = scaleBrightness(sideHex, 0.30 + t * 0.42);
          // في الوضع الليلي تَعتِم الجوانب المصمتة (لا ضوء يخرج منها)
          if (nightView && !perforated) shade = adjustBrightness(shade, -55);
          // التخريم المضيء: شدّة التوهّج بنمط الاختيار
          let glowAmt = 0;
          if (perforated) {
            glowAmt = perfIntensity(sideStyleSlug, i, layers);
            shade = mix(shade, glowHex, Math.min(1, glowAmt * (nightView ? 0.95 : 0.6)));
          }
          return (
            <div key={i} style={{
              ...textBase, transform: `translateZ(${z}px)`,
              color: shade,
              filter: glowAmt > 0.5 ? `drop-shadow(0 0 ${4 * glowMul}px ${glowHex})` : undefined,
            }}>{text}</div>
          );
        })}

        {/* الوجه الأمامي — خامة واقعية + فلتر الإضاءة المحسوب */}
        <div style={{
          ...textBase, transform: `translateZ(${depth + 0.5}px)`,
          backgroundImage: faceFill,
          WebkitBackgroundClip: "text", backgroundClip: "text",
          WebkitTextFillColor: "transparent", color: "transparent",
          WebkitTextStroke: faceBorder ? `2px ${sideHex}` : undefined,
          filter: faceFilter,
        }}>{text}</div>

        {/* بلوم أمامي — ضبابية الضوء المنتشرة من الوجه المضيء (أمامية / مزدوجة) */}
        {frontLit && (
          <div aria-hidden style={{
            ...textBase, transform: `translateZ(${depth + 4}px)`,
            color: glowHex,
            filter: `blur(${faceMaterial === "acrylic"
              ? (nightView ? 26 : 11)
              : (nightView ? 16 : 5)}px) brightness(${nightView ? 2.4 : 1.3})`,
            opacity: nightView
              ? (faceMaterial === "acrylic" ? 0.90 : 0.62)
              : (faceMaterial === "acrylic" ? 0.44 : 0.24),
            pointerEvents: "none",
          }}>{text}</div>
        )}

        {/* لمعة زجاجية فوق الوجه المعدني/الأكريليك — مخفية في وضع الإضاءة الأمامية الليلي */}
        {(faceMaterial === "stainless" || faceMaterial === "acrylic") && !(nightView && frontLit) && (
          <div aria-hidden style={{
            ...textBase, transform: `translateZ(${depth + 1.5}px)`,
            backgroundImage: faceMaterial === "stainless"
              ? "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.42) 44%, rgba(255,255,255,0.18) 50%, transparent 62%)"
              : "linear-gradient(135deg, rgba(255,255,255,0.38) 0%, transparent 45%, rgba(255,255,255,0.12) 70%, transparent 100%)",
            WebkitBackgroundClip: "text", backgroundClip: "text",
            WebkitTextFillColor: "transparent", color: "transparent",
            pointerEvents: "none",
            opacity: nightView ? 0.2 : 0.85,
          }}>{text}</div>
        )}
      </div>
    </div>
  );
}

/* وجه الحرف في وضع الإضاءة الأمامية الليلي — محاكاة واقعية لكل خامة
   faceHex = لون الحرف المختار | glowHex = درجة حرارة LED (للبلوم الخارجي فقط) */
function faceFillLit(faceMaterial: string, faceHex: string, glowHex: string): string {
  if (faceMaterial === "acrylic") {
    // أكريليك: الضوء يخترق جسم الحرف ← اللون المختار هو الأساس، يتّقد من الداخل
    // مركز: نسخة فاتحة جداً من لون الحرف (كأن الضوء يفجّر منتصفه)
    // حافة: نسخة أغمق مشبعة للتباين
    const peak  = adjustBrightness(faceHex, 115);
    const bright = adjustBrightness(faceHex, 60);
    const edge  = adjustBrightness(faceHex, -22);
    return `radial-gradient(ellipse 80% 65% at 42% 36%, ${peak} 0%, ${bright} 22%, ${faceHex} 55%, ${edge} 100%)`;
  }
  if (faceMaterial === "stainless") {
    // إستانلس: سطح معدني يعكس ضوء LED — مزج اللون المعدني بضوء المصدر
    const specular = mix(faceHex, glowHex, 0.72);
    const hot      = adjustBrightness(specular, 90);
    return `linear-gradient(128deg, ${hot} 0%, ${adjustBrightness(faceHex, 55)} 22%, ${mix(faceHex, glowHex, 0.5)} 50%, ${adjustBrightness(faceHex, 32)} 78%, ${hot} 100%)`;
  }
  // زنكور / ألومنيوم — سطح مطلي، LED تضيء وجهه مباشرةً (لا تخترقه)
  const lit = mix(faceHex, glowHex, 0.30);   // تلوين طفيف بضوء المصدر
  return `linear-gradient(152deg, ${adjustBrightness(lit, 68)} 0%, ${lit} 50%, ${adjustBrightness(faceHex, -28)} 100%)`;
}

/* وجه الخامة الواقعي حسب نوع المادة */
function materialFace(material: string, hex: string): string {
  if (material === "stainless") {
    // معدن عاكس: تدرّج متعدد المحطات يحاكي انعكاس الستانلس المصقول
    return `linear-gradient(150deg, ${adjustBrightness(hex, 70)} 0%, ${hex} 22%, ${adjustBrightness(hex, -45)} 42%, ${adjustBrightness(hex, 55)} 58%, ${adjustBrightness(hex, -30)} 78%, ${hex} 100%)`;
  }
  if (material === "acrylic") {
    // أكريليك ملمّع: لمعان زجاجي ناعم
    return `linear-gradient(160deg, ${adjustBrightness(hex, 55)} 0%, ${hex} 50%, ${adjustBrightness(hex, -25)} 100%)`;
  }
  // زنكور / ألومنيوم مطلي: مطفي بلمسة تدرّج خفيفة
  return `linear-gradient(160deg, ${adjustBrightness(hex, 26)} 0%, ${hex} 62%, ${adjustBrightness(hex, -16)} 100%)`;
}

/* تظليل نِسبي: ضرب سطوع كل قناة بمعامل (0..1+) — يبقي الجوانب أغمق من الوجه لأي لون */
function scaleBrightness(hex: string, factor: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * factor)));
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * factor)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function adjustBrightness(hex: string, amount: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (n & 255) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/* مزج لونين بنسبة t (0..1) */
function mix(a: string, b: string, t: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return a;
  const na = parseInt(a.slice(1), 16), nb = parseInt(b.slice(1), 16);
  const r = Math.round(((na >> 16) & 255) * (1 - t) + ((nb >> 16) & 255) * t);
  const g = Math.round(((na >> 8) & 255) * (1 - t) + ((nb >> 8) & 255) * t);
  const bl = Math.round((na & 255) * (1 - t) + (nb & 255) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}
