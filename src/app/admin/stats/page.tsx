"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { siteStore, DEFAULT_STATS, DEFAULT_WHY_CARDS, type Stat, type WhyCard } from "@/store/siteStore";

const IconPicker = dynamic(() => import("@/components/admin/IconPicker"), { ssr: false });

const G  = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

const inp: React.CSSProperties = {
  width: "100%", padding: "0.55rem 0.8rem", borderRadius: 8,
  border: "1px solid rgba(154,106,42,0.25)", background: "#F2E8D0",
  color: "#2C1E15", fontSize: "0.85rem", fontFamily: "Tajawal, Cairo, sans-serif",
  outline: "none", boxSizing: "border-box",
};

function FieldHint({ text }: { text: string }) {
  return <div style={{ fontSize: "0.7rem", color: "#4A3525", marginTop: 4 }}>{text}</div>;
}
function CharCount({ value, max }: { value: string | undefined | null; max: number }) {
  // NULLFIX-V3
  const safe = value == null ? "" : String(value);
  const over = safe.length > max;
  return (
    <span style={{ fontSize: "0.68rem", color: over ? "#ef4444" : safe.length > max * 0.8 ? "#C9A24B" : "#4A3525" }}>
      {safe.length}/{max}
    </span>
  );
}

function makeBlankWhy(cards: WhyCard[]): WhyCard {
  return {
    id: Math.max(0, ...cards.map(c => c.id)) + 1,
    icon: "✨",
    titleAr: "ميزة جديدة",
    titleEn: "New Feature",
    descAr: "",
    descEn: "",
  };
}

export default function StatsAdminPage() {
  const [mounted, setMounted]   = useState(false);
  const [tab, setTab]           = useState<"stats" | "why">("stats");
  const [stats, setStats]       = useState<Stat[]>(DEFAULT_STATS ?? []);
  const [why, setWhy]           = useState<WhyCard[]>(DEFAULT_WHY_CARDS ?? []);
  const [editingWhy, setEditingWhy] = useState<WhyCard | null>(null);
  const [isNewWhy, setIsNewWhy] = useState(false);
  const [delWhy, setDelWhy]     = useState<number | null>(null);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    const s = siteStore.getStats();
    if (s?.length) setStats(s);
    const w = siteStore.getWhyCards();
    if (w?.length) setWhy(w);
    setMounted(true);
  }, []);

  const toast = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  // ── Stats helpers ────────────────────────────────────────────────────────
  const updateStat = (i: number, field: keyof Stat, val: string) => {
    const arr = [...stats]; arr[i] = { ...arr[i], [field]: val }; setStats(arr);
  };
  const addStat    = () => setStats([...stats, { value: "0", suffix: "", icon: "⭐", label: "إحصائية جديدة", labelEn: "New Stat" }]);
  const removeStat = (i: number) => setStats(stats.filter((_, idx) => idx !== i));
  const saveStats  = () => { siteStore.saveStats(stats); toast(); };

  // ── Why helpers ──────────────────────────────────────────────────────────
  const upWhy = <K extends keyof WhyCard>(f: K, v: WhyCard[K]) =>
    setEditingWhy(s => s ? { ...s, [f]: v } : s);

  const saveWhy = () => {
    if (!editingWhy) return;
    const next = isNewWhy
      ? [...why, editingWhy]
      : why.map(c => c.id === editingWhy.id ? editingWhy : c);
    setWhy(next);
    siteStore.saveWhyCards(next);
    setEditingWhy(null);
    setIsNewWhy(false);
    toast();
  };
  const deleteWhy = (id: number) => {
    const next = why.filter(c => c.id !== id);
    setWhy(next);
    siteStore.saveWhyCards(next);
    setDelWhy(null);
    toast();
  };

  if (!mounted) return (
    <div style={{ padding: "2.5rem", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl", color: "#C9A24B", opacity: 0.4 }}>
      جاري التحميل…
    </div>
  );

  const TAB: React.CSSProperties = {
    padding: "0.65rem 1.6rem", borderRadius: 999, fontWeight: 700,
    fontSize: "0.88rem", border: "none", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
    transition: "all 0.18s",
  };

  // Guard against undefined state during hydration recovery re-renders
  const safeStats = Array.isArray(stats) ? stats : (DEFAULT_STATS ?? []);
  const safeWhy   = Array.isArray(why)   ? why   : (DEFAULT_WHY_CARDS ?? []);

  return (
    <div style={{ padding: "2.5rem", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl", minHeight: "100vh", background: "#F4EFE6" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ color: "#C9A24B", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
          لوحة التحكم / الإحصائيات والمزايا
        </div>
        <h1 style={{ fontSize: "1.9rem", fontWeight: 900, margin: 0, ...GT }}>الإحصائيات والمزايا 📊</h1>
        <p style={{ color: "#5A4A3A", marginTop: "0.4rem", fontSize: "0.88rem" }}>
          عدّل أرقام الإحصائيات وبطاقات «لماذا إعلاني؟» الظاهرة في الصفحة الرئيسية
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
        <button onClick={() => setTab("stats")} style={{
          ...TAB,
          background: tab === "stats" ? G : "rgba(201,162,75,0.08)",
          color: tab === "stats" ? "#2C1E15" : "#C9A24B",
          border: tab === "stats" ? "none" : "1px solid rgba(201,162,75,0.25)",
        }}>
          📊 الإحصائيات ({safeStats.length})
        </button>
        <button onClick={() => setTab("why")} style={{
          ...TAB,
          background: tab === "why" ? G : "rgba(201,162,75,0.08)",
          color: tab === "why" ? "#2C1E15" : "#C9A24B",
          border: tab === "why" ? "none" : "1px solid rgba(201,162,75,0.25)",
        }}>
          🌟 لماذا إعلاني؟ ({safeWhy.length})
        </button>
      </div>

      {/* Toast */}
      {saved && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: G, color: "#2C1E15", padding: "0.75rem 2rem", borderRadius: 999, fontWeight: 700, fontSize: "0.9rem", boxShadow: "0 8px 32px rgba(201,162,75,0.4)" }}>
          ✓ تم الحفظ وتحديث الموقع
        </div>
      )}

      {/* ══════════ TAB: STATS ══════════ */}
      {tab === "stats" && (
        <div>
          {/* Live preview */}
          <div style={{ marginBottom: "1.75rem", padding: "1.5rem", borderRadius: 14, background: "#E2CFA8", border: "1px solid rgba(74,53,37,0.12)", display: "grid", gridTemplateColumns: `repeat(${safeStats.length}, 1fr)`, gap: 0, overflow: "hidden" }}>
            {safeStats.map((s, i) => (
              <div key={i} style={{ textAlign: "center", padding: "20px 12px", borderInlineEnd: i < safeStats.length - 1 ? "1px solid rgba(74,53,37,0.1)" : "none" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: "1.7rem", fontWeight: 900, background: "linear-gradient(135deg,#9A6A2A,#C9A24B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {s.value}{s.suffix}
                </div>
                <div style={{ fontSize: 12, color: "#5A3E28", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Stat rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {safeStats.map((stat, i) => (
              <div key={i} style={{ padding: "1.25rem 1.5rem", borderRadius: 14, background: "#F2E8D0", border: "1px solid rgba(201,162,75,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                  <span style={{ color: "#C9A24B", fontSize: "0.75rem", fontWeight: 700 }}>إحصائية {i + 1}</span>
                  {safeStats.length > 1 && (
                    <button onClick={() => removeStat(i)} style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.2)", color: "#e05555", cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  )}
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", color: "#5A3E28", fontSize: "0.68rem", marginBottom: 8 }}>الأيقونة</label>
                  <IconPicker value={stat.icon} onChange={v => updateStat(i, "icon", v)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "64px 120px 1fr 1fr", gap: "0.65rem", alignItems: "start" }}>
                  <div>
                    <label style={{ display: "block", color: "#5A3E28", fontSize: "0.68rem", marginBottom: 4 }}>الرقم</label>
                    <input value={stat.value} onChange={e => updateStat(i, "value", e.target.value)} type="number" style={inp} />
                  </div>
                  <div>
                    <label style={{ display: "block", color: "#5A3E28", fontSize: "0.68rem", marginBottom: 4 }}>اللاحقة</label>
                    <input value={stat.suffix} onChange={e => updateStat(i, "suffix", e.target.value)} placeholder="+ أو /7" style={inp} dir="ltr" />
                    <FieldHint text="مثال: + أو /7 أو %"/>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <label style={{ color: "#5A3E28", fontSize: "0.68rem" }}>التسمية (عربي)</label>
                      <CharCount value={stat.label} max={20} />
                    </div>
                    <input value={stat.label} onChange={e => updateStat(i, "label", e.target.value)} style={inp} />
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <label style={{ color: "#5A3E28", fontSize: "0.68rem" }}>Label (EN)</label>
                      <CharCount value={stat.labelEn || ""} max={20} />
                    </div>
                    <input value={stat.labelEn || ""} onChange={e => updateStat(i, "labelEn", e.target.value)} style={inp} dir="ltr" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button onClick={saveStats} style={{ padding: "0.75rem 2rem", borderRadius: 999, background: G, color: "#2C1E15", fontWeight: 800, border: "none", cursor: "pointer", fontSize: "0.9rem" }}>
              💾 حفظ الإحصائيات
            </button>
            <button onClick={addStat} style={{ padding: "0.75rem 1.25rem", borderRadius: 999, background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.25)", color: "#C9A24B", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
              + إضافة إحصائية
            </button>
            <button onClick={() => { setStats(DEFAULT_STATS); }} style={{ padding: "0.75rem 1.25rem", borderRadius: 999, background: "transparent", border: "1px solid rgba(201,162,75,0.15)", color: "#5A4A3A", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>
              ↩ استعادة الافتراضي
            </button>
          </div>
        </div>
      )}

      {/* ══════════ TAB: WHY ══════════ */}
      {tab === "why" && (
        <div>
          {/* Cards grid */}
          <div style={{ display: "grid", gridTemplateColumns: safeWhy.length <= 2 ? `repeat(${safeWhy.length}, 1fr)` : "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
            {safeWhy.map(card => (
              <div key={card.id} style={{ borderRadius: 16, border: "1px solid rgba(201,162,75,0.12)", background: "#E2CFA8", padding: "1.5rem", position: "relative" }}>
                {/* Delete confirm */}
                {delWhy === card.id && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.82)", borderRadius: 16, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 16 }}>
                    <p style={{ color: "#2C1E15", fontWeight: 700, fontSize: 13, textAlign: "center" }}>حذف «{card.titleAr}»؟</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => deleteWhy(card.id)} style={{ padding: "5px 18px", borderRadius: 999, background: "#dc2626", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 12 }}>نعم احذف</button>
                      <button onClick={() => setDelWhy(null)} style={{ padding: "5px 14px", borderRadius: 999, background: "rgba(255,255,255,0.2)", color: "#ccc", border: "none", cursor: "pointer", fontSize: 12 }}>إلغاء</button>
                    </div>
                  </div>
                )}
                <div style={{ fontSize: 32, marginBottom: 10 }}>{card.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#2C1E15", marginBottom: 6 }}>{card.titleAr}</div>
                <p style={{ color: "#5A3E28", fontSize: 12.5, lineHeight: 1.75, marginBottom: 16 }}>{card.descAr}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setEditingWhy({ ...card }); setIsNewWhy(false); }} style={{ flex: 1, padding: "6px 0", borderRadius: 999, background: "rgba(154,106,42,0.9)", color: "#fff", fontSize: "0.78rem", fontWeight: 700, border: "none", cursor: "pointer" }}>
                    ✏️ تعديل
                  </button>
                  {safeWhy.length > 1 && (
                    <button onClick={() => setDelWhy(card.id)} style={{ padding: "6px 12px", borderRadius: 999, background: "rgba(220,38,38,0.1)", color: "#f87171", fontSize: "0.78rem", border: "1px solid rgba(220,38,38,0.25)", cursor: "pointer" }}>🗑</button>
                  )}
                </div>
              </div>
            ))}

            {/* Add card */}
            <button
              onClick={() => { setIsNewWhy(true); setEditingWhy(makeBlankWhy(safeWhy)); }}
              style={{ borderRadius: 16, border: "2px dashed rgba(201,162,75,0.25)", background: "#F2E8D0", minHeight: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", color: "rgba(201,162,75,0.4)", transition: "all 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(201,162,75,0.07)"; (e.currentTarget as HTMLElement).style.color = "#C9A24B"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(201,162,75,0.03)"; (e.currentTarget as HTMLElement).style.color = "rgba(201,162,75,0.4)"; }}
            >
              <span style={{ fontSize: 32 }}>+</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>إضافة ميزة جديدة</span>
            </button>
          </div>

          <button onClick={() => { setWhy(DEFAULT_WHY_CARDS); siteStore.saveWhyCards(DEFAULT_WHY_CARDS); toast(); }} style={{ padding: "0.65rem 1.25rem", borderRadius: 999, background: "transparent", border: "1px solid rgba(201,162,75,0.15)", color: "#5A4A3A", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>
            ↩ استعادة الافتراضي
          </button>
        </div>
      )}

      {/* ── WHY Edit Modal ── */}
      {editingWhy && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#F2E8D0", borderRadius: 20, padding: "2rem", width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", border: "1px solid rgba(154,106,42,0.25)" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, ...GT }}>
                {isNewWhy ? "➕ إضافة ميزة جديدة" : `✏️ تعديل: ${editingWhy.titleAr}`}
              </h2>
              <button onClick={() => { setEditingWhy(null); setIsNewWhy(false); }} style={{ background: "none", border: "none", color: "#666", fontSize: "1.6rem", cursor: "pointer" }}>×</button>
            </div>

            {/* Icon */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, marginBottom: 8 }}>
                الأيقونة — إيموجي أو صورة مرفوعة
              </label>
              <IconPicker value={editingWhy.icon} onChange={v => upWhy("icon", v)} />
              <FieldHint text="الأيقونة تظهر فوق العنوان مباشرة على البطاقة" />
            </div>

            {/* Titles */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700 }}>العنوان (عربي)</label>
                  <CharCount value={editingWhy.titleAr} max={40} />
                </div>
                <input value={editingWhy.titleAr} onChange={e => upWhy("titleAr", e.target.value)} style={inp} />
                <FieldHint text="جملة قصيرة تصف الميزة • حد أقصى 40 حرفاً" />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700 }}>Title (EN)</label>
                  <CharCount value={editingWhy.titleEn} max={50} />
                </div>
                <input value={editingWhy.titleEn} onChange={e => upWhy("titleEn", e.target.value)} style={inp} dir="ltr" />
                <FieldHint text="Short feature title • max 50 chars" />
              </div>
            </div>

            {/* Descriptions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.75rem" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700 }}>الوصف (عربي)</label>
                  <CharCount value={editingWhy.descAr} max={120} />
                </div>
                <textarea value={editingWhy.descAr} onChange={e => upWhy("descAr", e.target.value)} style={{ ...inp, resize: "vertical", minHeight: 90 }} />
                <FieldHint text="1-2 جملة تشرح الميزة بالتفصيل • حد أقصى 120 حرفاً" />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700 }}>Description (EN)</label>
                  <CharCount value={editingWhy.descEn} max={150} />
                </div>
                <textarea value={editingWhy.descEn} onChange={e => upWhy("descEn", e.target.value)} style={{ ...inp, resize: "vertical", minHeight: 90 }} dir="ltr" />
                <FieldHint text="1-2 sentences describing the feature • max 150 chars" />
              </div>
            </div>

            {/* Preview */}
            <div style={{ marginBottom: "1.75rem", padding: "1.25rem", borderRadius: 12, background: "#E2CFA8", border: "1px solid rgba(74,53,37,0.12)" }}>
              <div style={{ color: "#9A6A2A", fontSize: "0.68rem", fontWeight: 700, marginBottom: 10 }}>معاينة:</div>
              <div style={{ fontSize: 30, marginBottom: 8 }}>{editingWhy.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#2C1E15", marginBottom: 6 }}>{editingWhy.titleAr}</div>
              <p style={{ color: "#5A3E28", fontSize: 12.5, lineHeight: 1.75, margin: 0 }}>{editingWhy.descAr}</p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={saveWhy} style={{ padding: "0.75rem 2rem", borderRadius: 999, background: G, color: "#2C1E15", fontWeight: 800, border: "none", cursor: "pointer" }}>
                {isNewWhy ? "➕ إضافة" : "💾 حفظ"}
              </button>
              <button onClick={() => { setEditingWhy(null); setIsNewWhy(false); }} style={{ padding: "0.75rem 1.5rem", borderRadius: 999, background: "rgba(201,162,75,0.1)", color: "#C9A24B", fontWeight: 600, border: "1px solid rgba(201,162,75,0.25)", cursor: "pointer" }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

