"use client";
import { useEffect, useState } from "react";
import { FONT_CATALOG, FONT_VARIABLE_CLASSES, DEFAULT_ENABLED_FONT_IDS, type FontDef } from "@/lib/fonts";

const GOLD = "#C9A24B";

export default function FontsAdminPage() {
  const [enabled, setEnabled] = useState<string[]>(DEFAULT_ENABLED_FONT_IDS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/site-config?key=design_fonts")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d?.value) && d.value.length) setEnabled(d.value as string[]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) =>
    setEnabled(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));

  const save = async () => {
    setSaving(true); setMsg("");
    try {
      const r = await fetch("/api/site-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "design_fonts", value: enabled }),
      });
      const d = await r.json().catch(() => ({}));
      setMsg(r.ok ? "✓ تم الحفظ — ستظهر للعملاء فوراً" : (d?.error || "تعذّر الحفظ"));
    } catch {
      setMsg("تعذّر الحفظ — تحقّق من الاتصال");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 4000);
    }
  };

  const ar = FONT_CATALOG.filter(f => f.lang === "ar");
  const en = FONT_CATALOG.filter(f => f.lang === "en");

  const Card = (f: FontDef) => {
    const on = enabled.includes(f.id);
    return (
      <button
        key={f.id}
        onClick={() => toggle(f.id)}
        style={{
          textAlign: "right", padding: "0.9rem 1rem", borderRadius: 12, cursor: "pointer",
          border: `1.5px solid ${on ? GOLD : "rgba(255,255,255,0.08)"}`,
          background: on ? "rgba(201,162,75,0.07)" : "#141414",
          display: "flex", flexDirection: "column", gap: "0.5rem",
        }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 800, color: on ? GOLD : "#ccc", fontFamily: "Tajawal, Cairo, sans-serif" }}>{f.label}</span>
          <span style={{
            fontSize: "0.6rem", fontWeight: 800, padding: "2px 9px", borderRadius: 999,
            background: on ? "rgba(52,199,89,0.15)" : "rgba(255,255,255,0.06)",
            color: on ? "#4ade80" : "#888", border: `1px solid ${on ? "rgba(52,199,89,0.4)" : "rgba(255,255,255,0.12)"}`,
          }}>{on ? "مُفعّل" : "مُلغى"}</span>
        </div>
        <div style={{ fontFamily: `${f.family}, Tajawal, Cairo, sans-serif`, fontWeight: 800, fontSize: "1.7rem", color: "#2C1E15", lineHeight: 1.2 }}>
          {f.lang === "ar" ? "أبجد هوز ١٢٣" : "Abcde 123"}
        </div>
      </button>
    );
  };

  const sectionTitle: React.CSSProperties = { fontSize: "0.7rem", fontWeight: 800, color: "rgba(201,162,75,0.7)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "1.5rem 0 0.6rem" };
  const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "0.7rem" };

  return (
    <div className={FONT_VARIABLE_CLASSES} style={{ padding: "2rem 2.5rem", maxWidth: 1000, fontFamily: "Tajawal, Cairo, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 900, margin: 0, color: "#2C1E15" }}>🔤 خطوط المصمّم</h1>
          <p style={{ fontSize: "0.85rem", color: "#999", marginTop: "0.35rem", maxWidth: 560, lineHeight: 1.7 }}>
            فعّل أو ألغِ الخطوط التي تظهر للعميل في صفحة تصميم الحروف البارزة. التغييرات تُحفظ مركزياً وتظهر لكل العملاء.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          {msg && <span style={{ fontSize: "0.8rem", color: msg.startsWith("✓") ? "#4ade80" : "#f87171", fontWeight: 700 }}>{msg}</span>}
          <button onClick={save} disabled={saving || loading}
            style={{ padding: "0.7rem 1.6rem", borderRadius: 10, border: "none", cursor: saving ? "wait" : "pointer",
              background: "linear-gradient(135deg,#C9A24B,#EBCB7C)", color: "#2C1E15", fontWeight: 800, fontSize: "0.9rem", fontFamily: "Tajawal, Cairo, sans-serif", opacity: saving || loading ? 0.6 : 1 }}>
            {saving ? "جارٍ الحفظ…" : "حفظ التغييرات"}
          </button>
        </div>
      </div>

      <div style={{ marginTop: "1rem", fontSize: "0.78rem", color: "#bbb" }}>
        المُفعّل: <b style={{ color: GOLD }}>{enabled.length}</b> من {FONT_CATALOG.length} خطاً
        {enabled.length === 0 && <span style={{ color: "#f87171", marginInlineStart: 8 }}>— يجب تفعيل خط واحد على الأقل</span>}
      </div>

      <div style={sectionTitle}>الخطوط العربية</div>
      <div style={grid}>{ar.map(Card)}</div>

      <div style={sectionTitle}>الخطوط اللاتينية</div>
      <div style={grid}>{en.map(Card)}</div>
    </div>
  );
}
