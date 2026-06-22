"use client";
import { useState, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────
export type LightingType = {
  id: string; slug: string; nameAr: string; descriptionAr: string;
  basePriceSar: number; iconEmoji: string;
};
export type FaceOption = {
  id: string; slug: string; nameAr: string; descriptionAr: string;
  hasColorPicker: boolean; priceSar: number; gradientCss: string; iconEmoji: string;
  lightingTypeId: string;
};
export type SideMetal = {
  id: string; slug: string; nameAr: string; descriptionAr: string;
  priceSar: number; gradientCss: string; iconEmoji: string;
};
export type SideAddon = {
  id: string; slug: string; nameAr: string; descriptionAr: string;
  priceSar: number; iconEmoji: string;
};
export type LightColor = {
  id: string; slug: string; nameAr: string; hexColor: string;
  priceSar: number; isColored: boolean;
};

export type LightingSelection = {
  lightingTypeId: string;
  lightingTypeSlug?: string;
  faceOptionId: string;
  faceColor: string;        // hex, only when hasColorPicker
  sideMetalId: string;
  sideMetalSlug?: string;
  addonIds: string[];
  lightColorId: string;
  letterDepthCm: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onApply: (sel: LightingSelection) => void;
  initial?: Partial<LightingSelection>;
};

// ── Design tokens ──────────────────────────────────────────────
const GOLD  = "#C9A24B";
const G     = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const TEXT  = "#2C1E15";
const MUTED = "#634E40";
const BG    = "#FDFBF7";
const CARD  = "#F4EFE6";
const BORD  = "rgba(154,106,42,0.18)";
const STEPS = ["نوع الإضاءة", "خيار الوجه", "معدن الجوانب", "الإضافات", "لون الإضاءة"];

const DEFAULT_SEL: LightingSelection = {
  lightingTypeId: "",
  faceOptionId: "",
  faceColor: "#FFFFFF",
  sideMetalId: "",
  addonIds: [],
  lightColorId: "",
  letterDepthCm: 5,
};

function calcPrice(
  lt: LightingType | undefined,
  fo: FaceOption | undefined,
  sm: SideMetal | undefined,
  addons: SideAddon[],
  lc: LightColor | undefined,
): number {
  return (lt?.basePriceSar ?? 0)
    + (fo?.priceSar ?? 0)
    + (sm?.priceSar ?? 0)
    + addons.reduce((s, a) => s + a.priceSar, 0)
    + (lc?.priceSar ?? 0);
}

// ── Main modal ─────────────────────────────────────────────────
export default function LightingConfiguratorModal({ open, onClose, onApply, initial }: Props) {
  const [step, setStep] = useState(0);
  const [sel, setSel] = useState<LightingSelection>({ ...DEFAULT_SEL, ...initial });

  // Data loaded from APIs
  const [lightingTypes, setLightingTypes] = useState<LightingType[]>([]);
  const [faceOptions, setFaceOptions] = useState<FaceOption[]>([]);
  const [sideMetals, setSideMetals] = useState<SideMetal[]>([]);
  const [sideAddons, setSideAddons] = useState<SideAddon[]>([]);
  const [lightColors, setLightColors] = useState<LightColor[]>([]);
  const [loading, setLoading] = useState(true);

  const patch = useCallback((p: Partial<LightingSelection>) => setSel(prev => ({ ...prev, ...p })), []);

  useEffect(() => {
    if (!open) return;
    setSel({ ...DEFAULT_SEL, ...initial });
    setStep(0);
    setLoading(true);
    Promise.all([
      fetch("/api/configurator/lighting-types").then(r => r.json()),
      fetch("/api/configurator/face-options").then(r => r.json()),
      fetch("/api/configurator/side-metals").then(r => r.json()),
      fetch("/api/configurator/side-addons").then(r => r.json()),
      fetch("/api/configurator/light-colors").then(r => r.json()),
    ]).then(([lt, fo, sm, sa, lc]) => {
      setLightingTypes(lt.lightingTypes ?? []);
      setFaceOptions(fo.faceOptions ?? []);
      setSideMetals(sm.sideMetals ?? []);
      setSideAddons(sa.sideAddons ?? []);
      setLightColors(lc.lightColors ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  // Derived
  const activeLT = lightingTypes.find(lt => lt.id === sel.lightingTypeId);
  const activeFO = faceOptions.find(fo => fo.id === sel.faceOptionId);
  const activeSM = sideMetals.find(sm => sm.id === sel.sideMetalId);
  const activeLCs = lightColors.filter(lc => sel.addonIds.includes(lc.id));
  const activeLC = lightColors.find(lc => lc.id === sel.lightColorId);
  const selectedAddons = sideAddons.filter(sa => sel.addonIds.includes(sa.id));
  const estimatedPrice = calcPrice(activeLT, activeFO, activeSM, selectedAddons, activeLC);
  const filteredFaceOptions = faceOptions.filter(fo => fo.lightingTypeId === sel.lightingTypeId);

  // Step navigation guards
  const canNext = [
    !!sel.lightingTypeId,
    !!sel.faceOptionId,
    !!sel.sideMetalId,
    true, // addons optional
    !!sel.lightColorId,
  ];

  const handleApply = () => {
    onApply({ ...sel, lightingTypeSlug: activeLT?.slug, sideMetalSlug: activeSM?.slug });
    onClose();
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1200,
      background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem", fontFamily: "Tajawal, Cairo, sans-serif",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "min(700px, 96vw)", maxHeight: "92vh",
        background: BG, borderRadius: 20,
        border: "1.5px solid rgba(201,162,75,0.28)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.55)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "0.9rem 1.25rem", borderBottom: `1px solid ${BORD}`,
          background: CARD,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: "1rem", color: TEXT }}>🏗️ مصمّم الحروف البارزة</div>
            <div style={{ fontSize: "0.63rem", color: MUTED, marginTop: 2 }}>اختر خيارات الإضاءة والخامة — السعر تقديري واسترشادي</div>
          </div>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: 9, cursor: "pointer",
            border: `1px solid ${BORD}`, background: BG, color: MUTED, fontSize: "1rem",
          }}>✕</button>
        </div>

        {/* Step indicator */}
        <div style={{ padding: "0.75rem 1.25rem 0", background: CARD, borderBottom: `1px solid ${BORD}` }}>
          <div style={{ display: "flex", gap: "0.2rem", alignItems: "center" }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.2rem", flex: i < STEPS.length - 1 ? "1 1 auto" : undefined }}>
                <button onClick={() => { if (i < step || canNext.slice(0, i).every(Boolean)) setStep(i); }} style={{
                  width: 26, height: 26, borderRadius: "50%", cursor: "pointer", border: "none",
                  fontFamily: "Tajawal, Cairo, sans-serif", fontWeight: 900, fontSize: "0.7rem",
                  background: i < step ? G : i === step ? GOLD : "rgba(154,106,42,0.15)",
                  color: i <= step ? TEXT : MUTED,
                  flexShrink: 0,
                }}>{i + 1}</button>
                <span style={{ fontSize: "0.62rem", fontWeight: i === step ? 800 : 500, color: i === step ? TEXT : MUTED, whiteSpace: "nowrap" }}>{s}</span>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: i < step ? GOLD : BORD, minWidth: 8 }} />}
              </div>
            ))}
          </div>
          <div style={{ height: 10 }} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.1rem 1.25rem" }}>
          {loading ? (
            <div style={{ textAlign: "center", color: GOLD, padding: "2rem" }}>جارٍ تحميل الخيارات...</div>
          ) : (
            <>
              {step === 0 && (
                <StepSection title="اختر نوع الإضاءة" subtitle="يحدد نوع الإضاءة خيارات الوجه المتاحة">
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                    {lightingTypes.map(lt => (
                      <OptionCard
                        key={lt.id}
                        selected={sel.lightingTypeId === lt.id}
                        onClick={() => patch({ lightingTypeId: lt.id, faceOptionId: "" })}
                        icon={lt.iconEmoji}
                        title={lt.nameAr}
                        desc={lt.descriptionAr}
                        price={lt.basePriceSar}
                      />
                    ))}
                    {lightingTypes.length === 0 && <EmptyState text="لا توجد أنواع إضاءة — أضفها من لوحة التحكم" />}
                  </div>
                </StepSection>
              )}

              {step === 1 && (
                <StepSection title="اختر خيار الوجه" subtitle={activeLT ? `الخيارات المتاحة لـ ${activeLT.nameAr}` : ""}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                    {filteredFaceOptions.map(fo => (
                      <div key={fo.id}>
                        <OptionCard
                          selected={sel.faceOptionId === fo.id}
                          onClick={() => patch({ faceOptionId: fo.id })}
                          gradient={fo.gradientCss}
                          icon={fo.iconEmoji}
                          title={fo.nameAr}
                          desc={fo.descriptionAr}
                          price={fo.priceSar}
                        />
                        {/* Color picker when this face option is selected and has hasColorPicker */}
                        {sel.faceOptionId === fo.id && fo.hasColorPicker && (
                          <div style={{
                            marginTop: 6, padding: "0.65rem 0.9rem", borderRadius: 10,
                            background: "rgba(201,162,75,0.07)", border: `1px solid rgba(201,162,75,0.2)`,
                          }}>
                            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: MUTED, marginBottom: 6 }}>اختر لون الأكريليك</div>
                            <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
                              {["#F5F5F5","#141414","#C0392B","#1F4E8C","#1F7A4D","#C9A24B","#D4D4D4","#B06A3B"].map(hex => (
                                <button key={hex} onClick={() => patch({ faceColor: hex })} style={{
                                  width: 30, height: 30, borderRadius: 8, background: hex, cursor: "pointer",
                                  border: `2.5px solid ${sel.faceColor === hex ? GOLD : BORD}`,
                                  boxShadow: sel.faceColor === hex ? "0 0 0 2px rgba(201,162,75,0.3)" : "none",
                                }} />
                              ))}
                              <label style={{ position: "relative", width: 30, height: 30, borderRadius: 8, overflow: "hidden", cursor: "pointer", display: "inline-block", border: `2.5px solid ${BORD}`, background: "conic-gradient(from 0deg,#ff3b30,#ffcc00,#34c759,#007aff,#af52de,#ff3b30)" }}>
                                <input type="color" value={sel.faceColor} onChange={e => patch({ faceColor: e.target.value })} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {filteredFaceOptions.length === 0 && <EmptyState text="لا توجد خيارات وجه لهذا النوع من الإضاءة" />}
                  </div>
                </StepSection>
              )}

              {step === 2 && (
                <StepSection title="اختر معدن الجوانب" subtitle="الجوانب المعدنية تُحيط بالحرف وتُبرز شكله">
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                    {sideMetals.map(sm => (
                      <OptionCard
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
                    {sideMetals.length === 0 && <EmptyState text="لا توجد معادن جوانب — أضفها من لوحة التحكم" />}
                  </div>
                </StepSection>
              )}

              {step === 3 && (
                <StepSection title="الإضافات الاختيارية" subtitle="يمكن اختيار أكثر من إضافة في آنٍ واحد">
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                    {sideAddons.map(sa => {
                      const on = sel.addonIds.includes(sa.id);
                      return (
                        <div key={sa.id} onClick={() => patch({ addonIds: on ? sel.addonIds.filter(id => id !== sa.id) : [...sel.addonIds, sa.id] })} style={{
                          display: "flex", alignItems: "center", gap: "0.75rem",
                          padding: "0.7rem 0.9rem", borderRadius: 12, cursor: "pointer",
                          border: `1.5px solid ${on ? GOLD : BORD}`,
                          background: on ? "rgba(201,162,75,0.08)" : CARD,
                          boxShadow: on ? "0 0 14px rgba(201,162,75,0.16)" : "none",
                          transition: "all 0.18s",
                        }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                            background: on ? G : "rgba(154,106,42,0.12)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "1rem",
                          }}>{sa.iconEmoji}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: "0.83rem", color: on ? GOLD : TEXT }}>{sa.nameAr}</div>
                            {sa.descriptionAr && <div style={{ fontSize: "0.63rem", color: MUTED, marginTop: 1 }}>{sa.descriptionAr}</div>}
                          </div>
                          <div style={{ flexShrink: 0 }}>
                            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: on ? GOLD : MUTED }}>
                              {sa.priceSar === 0 ? "مجاناً" : `+${sa.priceSar} ر.س`}
                            </div>
                          </div>
                          <div style={{
                            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                            border: `2px solid ${on ? GOLD : BORD}`,
                            background: on ? GOLD : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {on && <span style={{ color: TEXT, fontSize: "0.65rem", fontWeight: 900 }}>✓</span>}
                          </div>
                        </div>
                      );
                    })}
                    {sideAddons.length === 0 && <EmptyState text="لا توجد إضافات متاحة حالياً" />}
                    <div style={{ padding: "0.5rem 0.75rem", borderRadius: 9, background: "rgba(201,162,75,0.06)", border: `1px solid ${BORD}`, fontSize: "0.63rem", color: MUTED }}>
                      💡 يمكنك تخطي هذه الخطوة والمتابعة بدون إضافات
                    </div>
                  </div>
                </StepSection>
              )}

              {step === 4 && (
                <StepSection title="اختر لون الإضاءة" subtitle="الألوان القياسية مجانية — الألوان الملوّنة بسعر إضافي">
                  {/* Standard */}
                  <div style={{ marginBottom: "0.9rem" }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: 800, color: MUTED, marginBottom: "0.5rem" }}>الألوان القياسية (مجاناً)</div>
                    <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                      {lightColors.filter(lc => !lc.isColored).map(lc => (
                        <ColorBubble key={lc.id} lc={lc} selected={sel.lightColorId === lc.id} onSelect={() => patch({ lightColorId: lc.id })} />
                      ))}
                    </div>
                  </div>
                  {/* Colored */}
                  {lightColors.some(lc => lc.isColored) && (
                    <div>
                      <div style={{ fontSize: "0.7rem", fontWeight: 800, color: MUTED, marginBottom: "0.5rem" }}>ألوان مضيئة (بسعر إضافي)</div>
                      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                        {lightColors.filter(lc => lc.isColored).map(lc => (
                          <ColorBubble key={lc.id} lc={lc} selected={sel.lightColorId === lc.id} onSelect={() => patch({ lightColorId: lc.id })} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Depth control */}
                  <div style={{ marginTop: "1.1rem", padding: "0.65rem 0.85rem", borderRadius: 11, background: CARD, border: `1px solid ${BORD}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "0.8rem", color: TEXT }}>بروز الحرف (العمق)</div>
                        <div style={{ fontSize: "0.6rem", color: MUTED }}>سُمك الحرف البارز</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <DepthBtn onClick={() => patch({ letterDepthCm: Math.max(2, sel.letterDepthCm - 1) })}>−</DepthBtn>
                        <span style={{ minWidth: 52, textAlign: "center", fontWeight: 900, fontSize: "0.9rem", color: GOLD }}>
                          {sel.letterDepthCm} <span style={{ fontSize: "0.6rem", color: MUTED }}>سم</span>
                        </span>
                        <DepthBtn onClick={() => patch({ letterDepthCm: Math.min(25, sel.letterDepthCm + 1) })}>+</DepthBtn>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.45rem" }}>
                      {[3, 5, 8, 12].map(v => (
                        <button key={v} onClick={() => patch({ letterDepthCm: v })} style={{
                          flex: 1, padding: "0.3rem", borderRadius: 7, cursor: "pointer",
                          fontFamily: "Tajawal, Cairo, sans-serif", fontSize: "0.65rem", fontWeight: 700,
                          border: `1.5px solid ${sel.letterDepthCm === v ? GOLD : BORD}`,
                          background: sel.letterDepthCm === v ? "rgba(201,162,75,0.1)" : BG,
                          color: sel.letterDepthCm === v ? GOLD : MUTED,
                        }}>{v} سم</button>
                      ))}
                    </div>
                  </div>
                </StepSection>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "0.8rem 1.25rem", borderTop: `1px solid ${BORD}`,
          background: CARD,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem",
        }}>
          {/* Price estimate */}
          <div>
            {estimatedPrice > 0 && (
              <div style={{ fontSize: "0.7rem", color: MUTED }}>
                السعر التقديري لكل 20 سم: <span style={{ color: GOLD, fontWeight: 900, fontSize: "0.88rem" }}>{estimatedPrice} ر.س</span>
                <span style={{ fontSize: "0.58rem", display: "block", color: MUTED, opacity: 0.7 }}>سعر استرشادي — المورد يحدد السعر الفعلي</span>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} style={{
                padding: "0.55rem 1.1rem", borderRadius: 10, cursor: "pointer",
                border: `1.5px solid ${BORD}`, background: BG,
                color: MUTED, fontFamily: "Tajawal, Cairo, sans-serif", fontWeight: 700, fontSize: "0.82rem",
              }}>
                ← رجوع
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => { if (canNext[step]) setStep(s => s + 1); }} disabled={!canNext[step]} style={{
                padding: "0.55rem 1.4rem", borderRadius: 10, cursor: canNext[step] ? "pointer" : "not-allowed",
                border: "none", fontFamily: "Tajawal, Cairo, sans-serif", fontWeight: 900, fontSize: "0.85rem",
                background: canNext[step] ? G : "rgba(201,162,75,0.3)",
                color: canNext[step] ? TEXT : "#9A8070",
                boxShadow: canNext[step] ? "0 3px 12px rgba(201,162,75,0.28)" : "none",
              }}>
                التالي →
              </button>
            ) : (
              <button onClick={handleApply} disabled={!canNext[step]} style={{
                padding: "0.55rem 1.6rem", borderRadius: 10, cursor: canNext[step] ? "pointer" : "not-allowed",
                border: "none", fontFamily: "Tajawal, Cairo, sans-serif", fontWeight: 900, fontSize: "0.85rem",
                background: canNext[step] ? G : "rgba(201,162,75,0.3)",
                color: canNext[step] ? TEXT : "#9A8070",
                boxShadow: canNext[step] ? "0 3px 14px rgba(201,162,75,0.35)" : "none",
              }}>
                تطبيق الخيارات ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────
function StepSection({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: "0.9rem" }}>
        <div style={{ fontWeight: 900, fontSize: "0.92rem", color: TEXT }}>{title}</div>
        {subtitle && <div style={{ fontSize: "0.65rem", color: MUTED, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function OptionCard({ selected, onClick, icon, title, desc, price, gradient }: {
  selected: boolean; onClick: () => void;
  icon?: string; title: string; desc?: string; price?: number; gradient?: string;
}) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: "0.75rem",
      padding: "0.7rem 0.9rem", borderRadius: 12, cursor: "pointer",
      border: `1.5px solid ${selected ? GOLD : BORD}`,
      background: selected ? "rgba(201,162,75,0.08)" : CARD,
      boxShadow: selected ? "0 0 16px rgba(201,162,75,0.18)" : "none",
      textAlign: "right", width: "100%", transition: "all 0.18s",
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
        background: gradient || (selected ? G : "rgba(154,106,42,0.12)"),
        display: "flex", alignItems: "center", justifyContent: "center",
        border: `1px solid ${selected ? "rgba(201,162,75,0.4)" : BORD}`,
      }}>
        {!gradient && <span style={{ fontSize: "1.2rem" }}>{icon}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: "0.85rem", color: selected ? GOLD : TEXT }}>{title}</div>
        {desc && <div style={{ fontSize: "0.63rem", color: MUTED, marginTop: 2, lineHeight: 1.4 }}>{desc}</div>}
      </div>
      {price !== undefined && (
        <div style={{ flexShrink: 0, fontWeight: 700, fontSize: "0.78rem", color: selected ? GOLD : MUTED }}>
          {price === 0 ? "مُضمَّن" : `+${price} ر.س`}
        </div>
      )}
      <div style={{
        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${selected ? GOLD : BORD}`,
        background: selected ? GOLD : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {selected && <span style={{ color: TEXT, fontSize: "0.6rem", fontWeight: 900 }}>✓</span>}
      </div>
    </button>
  );
}

function ColorBubble({ lc, selected, onSelect }: { lc: LightColor; selected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect} title={lc.nameAr} style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      cursor: "pointer", background: "none", border: "none", padding: 0,
    }}>
      <span style={{
        width: 38, height: 38, borderRadius: "50%", display: "block",
        background: lc.hexColor,
        boxShadow: selected ? `0 0 0 3px ${GOLD}, 0 0 12px ${lc.hexColor}` : `0 0 8px ${lc.hexColor}66`,
        border: `2.5px solid ${selected ? GOLD : "rgba(154,106,42,0.18)"}`,
        transition: "all 0.18s",
      }} />
      <span style={{ fontSize: "0.6rem", fontWeight: selected ? 800 : 500, color: selected ? GOLD : MUTED }}>{lc.nameAr}</span>
      {lc.priceSar > 0 && <span style={{ fontSize: "0.56rem", color: MUTED }}>+{lc.priceSar} ر.س</span>}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "1.5rem", color: MUTED, fontSize: "0.75rem", background: CARD, borderRadius: 10, border: `1px dashed ${BORD}` }}>
      {text}
    </div>
  );
}

function DepthBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      width: 28, height: 28, borderRadius: 8, cursor: "pointer",
      border: `1px solid ${BORD}`, background: BG,
      color: GOLD, fontSize: "1rem", fontWeight: 900, lineHeight: 1,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>{children}</button>
  );
}
