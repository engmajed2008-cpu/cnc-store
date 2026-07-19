"use client";
import { useState, useEffect, useCallback } from "react";
import type {
  LightingType, FaceOption, SideMetal, SideAddon, LightColor, LightingSelection,
} from "./LightingConfiguratorModal";

export type { LightingSelection };

// ── Tokens ─────────────────────────────────────────────────────────────────────
const GOLD  = "#C9A24B";
const G     = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const TEXT  = "#2C1E15";
const MUTED = "#634E40";
const BG    = "#FDFBF7";
const CARD  = "#F4EFE6";
const BORD  = "rgba(154,106,42,0.18)";

// ── الأنواع الرئيسية الخمسة (ثابتة — تُثرى من API إن كانت نشطة) ─────────────
const MAIN_TYPES = [
  {
    slug: "front-lit",
    nameAr: "إضاءة أمامية",
    descAr: "الوجه الأمامي مضيء — يخرج الضوء من الوجه",
    tags: ["وجه أكريليك", "جوانب معدنية", "ضوء أمامي"],
    gradient: "linear-gradient(135deg,#0d1b2e 0%,#1a4a8a 50%,#6ab0f5 100%)",
  },
  {
    slug: "back-lit",
    nameAr: "إضاءة خلفية",
    descAr: "الضوء خلف الحرف — تأثير الهالة المضيئة",
    tags: ["وجه معدن", "هالة ضوئية", "أناقة ليلية"],
    gradient: "linear-gradient(135deg,#1a0a00 0%,#7a2e00 50%,#f0a040 100%)",
  },
  {
    slug: "side-lit",
    nameAr: "إضاءة جانبية",
    descAr: "الضوء يخرج من جوانب الحرف — تأثير ثلاثي الأبعاد",
    tags: ["وجه معدن", "جوانب مضيئة", "3D"],
    gradient: "linear-gradient(135deg,#001a0d 0%,#0d5c30 50%,#3dcc80 100%)",
  },
  {
    slug: "non-lit",
    nameAr: "بدون إضاءة",
    descAr: "حروف بارزة صلبة — متينة وكلاسيكية",
    tags: ["وجه معدن", "جوانب معدنية", "بدون ضوء"],
    gradient: "linear-gradient(135deg,#1a1a1a 0%,#505050 50%,#a0a0a0 100%)",
  },
  {
    slug: "mix-lit",
    nameAr: "إضاءة مختلطة",
    descAr: "دمج أكثر من نوع إضاءة في نفس التصميم",
    tags: ["تصميم مخصص", "متعدد الأنواع", "مميز"],
    gradient: "linear-gradient(135deg,#150020 0%,#6a0080 50%,#e040fb 100%)",
  },
];

// ── Props ───────────────────────────────────────────────────────────────────────
type Props = {
  onApply: (sel: LightingSelection) => void;
  initial?: Partial<LightingSelection>;
};

const DEFAULT_SEL: LightingSelection = {
  lightingTypeId: "", faceOptionId: "", faceColor: "#FFFFFF",
  sideMetalId: "", addonIds: [], lightColorId: "", letterDepthCm: 5,
};

// ── Main Component ──────────────────────────────────────────────────────────────
export default function LightingConfiguratorInline({ onApply, initial }: Props) {
  const [sel, setSel]               = useState<LightingSelection>({ ...DEFAULT_SEL, ...initial });
  const [applied, setApplied]       = useState(false);

  const [apiTypes, setApiTypes]     = useState<LightingType[]>([]);
  const [faceOptions, setFaceOptions] = useState<FaceOption[]>([]);
  const [sideMetals, setSideMetals] = useState<SideMetal[]>([]);
  const [sideAddons, setSideAddons] = useState<SideAddon[]>([]);
  const [lightColors, setLightColors] = useState<LightColor[]>([]);
  const [loading, setLoading]       = useState(true);

  const patch = useCallback((p: Partial<LightingSelection>) => {
    setSel(prev => ({ ...prev, ...p }));
    setApplied(false);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/configurator/lighting-types").then(r => r.json()),
      fetch("/api/configurator/face-options").then(r => r.json()),
      fetch("/api/configurator/side-metals").then(r => r.json()),
      fetch("/api/configurator/side-addons").then(r => r.json()),
      fetch("/api/configurator/light-colors").then(r => r.json()),
    ]).then(([lt, fo, sm, sa, lc]) => {
      setApiTypes(lt.lightingTypes ?? []);
      setFaceOptions(fo.faceOptions ?? []);
      setSideMetals(sm.sideMetals ?? []);
      setSideAddons(sa.sideAddons ?? []);
      setLightColors(lc.lightColors ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // النوع المختار من الـ API (نشط + له بيانات)
  const selectedApiType = apiTypes.find(t => t.id === sel.lightingTypeId);
  const filteredFaces   = faceOptions.filter(fo => fo.lightingTypeId === sel.lightingTypeId);
  const activeFO        = faceOptions.find(fo => fo.id === sel.faceOptionId);
  const activeLC        = lightColors.find(lc => lc.id === sel.lightColorId);
  const selectedAddons  = sideAddons.filter(sa => sel.addonIds.includes(sa.id));

  // هل الاختيار مكتمل؟
  const canApply = !!sel.lightingTypeId && (
    // إذا كان النوع نشطاً → يجب اختيار وجه + جوانب + لون إضاءة
    selectedApiType
      ? !!sel.faceOptionId && !!sel.sideMetalId && !!sel.lightColorId
      : true // نوع قيد الإعداد → يُقبل كما هو
  );

  if (loading) return (
    <div style={{ textAlign: "center", padding: "1.2rem", color: GOLD, fontSize: "0.78rem", fontFamily: "Cairo,sans-serif" }}>
      جارٍ تحميل الخيارات...
    </div>
  );

  return (
    <div style={{ fontFamily: "Tajawal, Cairo, sans-serif" }}>

      {/* ══ الكروت الخمسة — أنواع الإضاءة ══════════════════════════════════════ */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
        {MAIN_TYPES.map(mt => {
          const apiType  = apiTypes.find(t => t.slug === mt.slug);
          const isActive = !!apiType;
          const isSelected = sel.lightingTypeId !== "" && apiType?.id === sel.lightingTypeId;
          // نوع غير نشط + لا يوجد بيانات API → "قيد الإعداد"
          const isComing = !isActive;

          return (
            <div key={mt.slug}>
              {/* ── الكرت الرئيسي ── */}
              <button
                onClick={() => {
                  if (isComing) return;
                  patch({ lightingTypeId: apiType!.id, faceOptionId: "", sideMetalId: "", addonIds: [], lightColorId: "" });
                }}
                disabled={isComing}
                style={{
                  width: "100%", display: "flex", alignItems: "stretch",
                  borderRadius: isSelected ? "12px 12px 0 0" : 12,
                  overflow: "hidden", cursor: isComing ? "default" : "pointer",
                  padding: 0, border: `1.5px solid ${isSelected ? GOLD : isComing ? "rgba(154,106,42,0.1)" : BORD}`,
                  background: isSelected ? "rgba(201,162,75,0.07)" : isComing ? "rgba(154,106,42,0.03)" : CARD,
                  boxShadow: isSelected ? "0 0 16px rgba(201,162,75,0.2)" : "none",
                  transition: "all 0.2s",
                  opacity: isComing ? 0.55 : 1,
                }}
              >
                {/* Gradient swatch */}
                <div style={{
                  width: 52, flexShrink: 0, background: mt.gradient,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                }}>
                  {isSelected && (
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "rgba(201,162,75,0.22)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ color: "#fff", fontSize: "1rem", fontWeight: 900 }}>✓</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, padding: "0.6rem 0.75rem", textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontWeight: 900, fontSize: "0.83rem", color: isSelected ? GOLD : isComing ? MUTED : TEXT }}>
                      {mt.nameAr}
                    </span>
                    {isComing && (
                      <span style={{ fontSize: "0.56rem", padding: "1px 6px", borderRadius: 20, background: "rgba(154,106,42,0.12)", color: MUTED, fontWeight: 700 }}>
                        قيد الإعداد
                      </span>
                    )}
                    {apiType && (
                      <span style={{ fontSize: "0.56rem", padding: "1px 6px", borderRadius: 20, background: "rgba(201,162,75,0.12)", color: GOLD, fontWeight: 700 }}>
                        متاح
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.6rem", color: MUTED, marginBottom: 5, lineHeight: 1.3 }}>{mt.descAr}</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {mt.tags.map(tag => (
                      <span key={tag} style={{
                        fontSize: "0.55rem", padding: "1px 7px", borderRadius: 10,
                        background: isSelected ? "rgba(201,162,75,0.14)" : "rgba(154,106,42,0.08)",
                        color: isSelected ? GOLD : MUTED, fontWeight: 600,
                      }}>{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Price badge */}
                {apiType && (
                  <div style={{
                    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 0.8rem",
                    borderRight: `1px solid ${BORD}`,
                  }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.68rem", fontWeight: 900, color: isSelected ? GOLD : MUTED }}>
                        {apiType.basePriceSar}
                      </div>
                      <div style={{ fontSize: "0.52rem", color: MUTED }}>ر.س/م</div>
                    </div>
                  </div>
                )}
              </button>

              {/* ══ الخيارات الفرعية — تنكشف عند اختيار هذا النوع ═══════════════ */}
              {isSelected && (
                <div style={{
                  border: `1.5px solid ${GOLD}`,
                  borderTop: "none",
                  borderRadius: "0 0 12px 12px",
                  background: BG,
                  padding: "0.85rem 0.75rem",
                  display: "flex", flexDirection: "column", gap: "0.9rem",
                }}>

                  {/* ── خيار الوجه ── */}
                  {filteredFaces.length > 0 && (
                    <SubSection title="خيار الوجه" required>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        {filteredFaces.map(fo => (
                          <div key={fo.id}>
                            <OptionRow
                              selected={sel.faceOptionId === fo.id}
                              onClick={() => patch({ faceOptionId: fo.id })}
                              gradient={fo.gradientCss}
                              icon={fo.iconEmoji}
                              title={fo.nameAr}
                              desc={fo.descriptionAr}
                              price={fo.priceSar}
                            />
                            {sel.faceOptionId === fo.id && fo.hasColorPicker && (
                              <div style={{ marginTop: 5, padding: "0.55rem 0.75rem", borderRadius: "0 0 9px 9px", background: "rgba(201,162,75,0.06)", border: `1px solid rgba(201,162,75,0.18)`, borderTop: "none" }}>
                                <div style={{ fontSize: "0.63rem", fontWeight: 700, color: MUTED, marginBottom: 5 }}>لون الأكريليك</div>
                                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                                  {["#F5F5F5","#141414","#C0392B","#1F4E8C","#1F7A4D","#C9A24B","#D4D4D4","#B06A3B"].map(hex => (
                                    <button key={hex} onClick={() => patch({ faceColor: hex })} style={{
                                      width: 24, height: 24, borderRadius: 6, background: hex, cursor: "pointer",
                                      border: `2.5px solid ${sel.faceColor === hex ? GOLD : BORD}`,
                                    }} />
                                  ))}
                                  <label style={{ position: "relative", width: 24, height: 24, borderRadius: 6, overflow: "hidden", cursor: "pointer", display: "inline-block", border: `2px solid ${BORD}`, background: "conic-gradient(from 0deg,#ff3b30,#ffcc00,#34c759,#007aff,#af52de,#ff3b30)" }}>
                                    <input type="color" value={sel.faceColor} onChange={e => patch({ faceColor: e.target.value })} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </SubSection>
                  )}

                  {/* ── معدن الجوانب ── */}
                  {sideMetals.length > 0 && (
                    <SubSection title="معدن الجوانب" required>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        {sideMetals.map(sm => (
                          <OptionRow
                            key={sm.id}
                            selected={sel.sideMetalId === sm.id}
                            onClick={() => patch({ sideMetalId: sm.id })}
                            gradient={sm.gradientCss}
                            icon={sm.iconEmoji}
                            title={sm.nameAr}
                            desc={sm.descriptionAr}
                            price={sm.priceSar}
                          />
                        ))}
                      </div>
                    </SubSection>
                  )}

                  {/* ── الإضافات (اختيارية) ── */}
                  {sideAddons.length > 0 && (
                    <SubSection title="إضافات اختيارية">
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        {sideAddons.map(sa => {
                          const on = sel.addonIds.includes(sa.id);
                          return (
                            <div key={sa.id}
                              onClick={() => patch({ addonIds: on ? sel.addonIds.filter(id => id !== sa.id) : [...sel.addonIds, sa.id] })}
                              style={{
                                display: "flex", alignItems: "center", gap: "0.55rem",
                                padding: "0.5rem 0.65rem", borderRadius: 9, cursor: "pointer",
                                border: `1.5px solid ${on ? GOLD : BORD}`,
                                background: on ? "rgba(201,162,75,0.07)" : CARD,
                                transition: "all 0.15s",
                              }}>
                              <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: on ? G : "rgba(154,106,42,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem" }}>{sa.iconEmoji}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 800, fontSize: "0.76rem", color: on ? GOLD : TEXT }}>{sa.nameAr}</div>
                                {sa.descriptionAr && <div style={{ fontSize: "0.58rem", color: MUTED }}>{sa.descriptionAr}</div>}
                              </div>
                              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: on ? GOLD : MUTED, flexShrink: 0 }}>
                                {sa.priceSar === 0 ? "مجاناً" : `+${sa.priceSar} ر.س`}
                              </span>
                              <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `2px solid ${on ? GOLD : BORD}`, background: on ? GOLD : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {on && <span style={{ color: TEXT, fontSize: "0.55rem", fontWeight: 900 }}>✓</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </SubSection>
                  )}

                  {/* ── لون الإضاءة ── */}
                  {lightColors.length > 0 && (
                    <SubSection title="لون الإضاءة" required>
                      <div>
                        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: MUTED, marginBottom: "0.4rem" }}>الألوان القياسية (مجاناً)</div>
                        <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", marginBottom: "0.65rem" }}>
                          {lightColors.filter(lc => !lc.isColored).map(lc => (
                            <ColorBubble key={lc.id} lc={lc} selected={sel.lightColorId === lc.id} onSelect={() => patch({ lightColorId: lc.id })} />
                          ))}
                        </div>
                        {lightColors.some(lc => lc.isColored) && <>
                          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: MUTED, marginBottom: "0.4rem" }}>ألوان مضيئة (بسعر إضافي)</div>
                          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                            {lightColors.filter(lc => lc.isColored).map(lc => (
                              <ColorBubble key={lc.id} lc={lc} selected={sel.lightColorId === lc.id} onSelect={() => patch({ lightColorId: lc.id })} />
                            ))}
                          </div>
                        </>}
                      </div>
                    </SubSection>
                  )}

                  {/* ── بروز الحرف ── */}
                  <SubSection title="بروز الحرف">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                      <div style={{ fontSize: "0.6rem", color: MUTED }}>سُمك الحرف البارز بالسنتيمتر</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <DepthBtn onClick={() => patch({ letterDepthCm: Math.max(2, sel.letterDepthCm - 1) })}>−</DepthBtn>
                        <span style={{ minWidth: 44, textAlign: "center", fontWeight: 900, fontSize: "0.88rem", color: GOLD }}>
                          {sel.letterDepthCm} <span style={{ fontSize: "0.56rem", color: MUTED }}>سم</span>
                        </span>
                        <DepthBtn onClick={() => patch({ letterDepthCm: Math.min(25, sel.letterDepthCm + 1) })}>+</DepthBtn>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      {[3, 5, 8, 12].map(v => (
                        <button key={v} onClick={() => patch({ letterDepthCm: v })} style={{
                          flex: 1, padding: "0.28rem", borderRadius: 7, cursor: "pointer",
                          fontFamily: "Tajawal, Cairo, sans-serif", fontSize: "0.62rem", fontWeight: 700,
                          border: `1.5px solid ${sel.letterDepthCm === v ? GOLD : BORD}`,
                          background: sel.letterDepthCm === v ? "rgba(201,162,75,0.1)" : BG,
                          color: sel.letterDepthCm === v ? GOLD : MUTED,
                        }}>{v} سم</button>
                      ))}
                    </div>
                  </SubSection>

                  {/* ── زر التطبيق ── */}
                  <button
                    onClick={() => { onApply(sel); setApplied(true); }}
                    disabled={!canApply}
                    style={{
                      width: "100%", padding: "0.6rem", borderRadius: 10, cursor: canApply ? "pointer" : "not-allowed",
                      border: "none", fontFamily: "Tajawal, Cairo, sans-serif", fontWeight: 900, fontSize: "0.85rem",
                      background: !canApply ? "rgba(201,162,75,0.25)" : applied ? "rgba(30,160,60,0.85)" : G,
                      color: !canApply ? "#9A8070" : applied ? "#fff" : TEXT,
                      boxShadow: canApply ? "0 3px 12px rgba(201,162,75,0.3)" : "none",
                      transition: "background 0.25s",
                    }}
                  >
                    {applied ? "✓ تم حفظ الخيارات" : "تطبيق الخيارات"}
                  </button>

                  {/* ملخص مختصر بعد التطبيق */}
                  {applied && (
                    <div style={{ fontSize: "0.65rem", color: "#1F6A30", fontWeight: 700, display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {activeFO && <span>✓ {activeFO.nameAr}</span>}
                      {sel.sideMetalId && <span>· {sideMetals.find(s => s.id === sel.sideMetalId)?.nameAr}</span>}
                      {activeLC && <span>· {activeLC.nameAr}</span>}
                      {selectedAddons.length > 0 && <span>· {selectedAddons.length} إضافة</span>}
                      <span>· عمق {sel.letterDepthCm} سم</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────────

function SubSection({ title, required, children }: { title: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "0.66rem", fontWeight: 800, color: MUTED, marginBottom: "0.45rem", display: "flex", alignItems: "center", gap: 4 }}>
        {title}
        {required && <span style={{ fontSize: "0.54rem", color: GOLD, fontWeight: 700 }}>*</span>}
      </div>
      {children}
    </div>
  );
}

function OptionRow({ selected, onClick, icon, title, desc, price, gradient }: {
  selected: boolean; onClick: () => void;
  icon?: string; title: string; desc?: string; price?: number; gradient?: string;
}) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: "0.6rem",
      padding: "0.55rem 0.7rem", borderRadius: 10, cursor: "pointer",
      border: `1.5px solid ${selected ? GOLD : BORD}`,
      background: selected ? "rgba(201,162,75,0.07)" : CARD,
      boxShadow: selected ? "0 0 12px rgba(201,162,75,0.15)" : "none",
      textAlign: "right", width: "100%", transition: "all 0.15s",
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        background: gradient || (selected ? G : "rgba(154,106,42,0.1)"),
        border: `1px solid ${selected ? "rgba(201,162,75,0.35)" : BORD}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {!gradient && <span style={{ fontSize: "1rem" }}>{icon}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: "0.78rem", color: selected ? GOLD : TEXT }}>{title}</div>
        {desc && <div style={{ fontSize: "0.59rem", color: MUTED, marginTop: 1 }}>{desc}</div>}
      </div>
      {price !== undefined && (
        <div style={{ flexShrink: 0, fontSize: "0.7rem", fontWeight: 700, color: selected ? GOLD : MUTED }}>
          {price === 0 ? "مُضمَّن" : `+${price} ر.س`}
        </div>
      )}
      <div style={{
        width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${selected ? GOLD : BORD}`,
        background: selected ? GOLD : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {selected && <span style={{ color: TEXT, fontSize: "0.55rem", fontWeight: 900 }}>✓</span>}
      </div>
    </button>
  );
}

function ColorBubble({ lc, selected, onSelect }: { lc: LightColor; selected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect} title={lc.nameAr} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", background: "none", border: "none", padding: 0 }}>
      <span style={{
        width: 32, height: 32, borderRadius: "50%", display: "block", background: lc.hexColor,
        boxShadow: selected ? `0 0 0 3px ${GOLD}, 0 0 8px ${lc.hexColor}` : `0 0 5px ${lc.hexColor}55`,
        border: `2px solid ${selected ? GOLD : BORD}`, transition: "all 0.15s",
      }} />
      <span style={{ fontSize: "0.56rem", fontWeight: selected ? 800 : 500, color: selected ? GOLD : MUTED }}>{lc.nameAr}</span>
      {lc.priceSar > 0 && <span style={{ fontSize: "0.52rem", color: MUTED }}>+{lc.priceSar}</span>}
    </button>
  );
}

function DepthBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      width: 24, height: 24, borderRadius: 6, cursor: "pointer",
      border: `1px solid ${BORD}`, background: BG, color: GOLD,
      fontSize: "0.9rem", fontWeight: 900,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>{children}</button>
  );
}
