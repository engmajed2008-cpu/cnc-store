"use client";
import { useState, useEffect, useCallback } from "react";

// ── Design tokens ─────────────────────────────────────────────
const BG    = "#FDFBF7";
const CARD  = "#F4EFE6";
const GOLD  = "#C9A24B";
const G     = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const TEXT  = "#2C1E15";
const MUTED = "#634E40";
const BORDER= "rgba(201,162,75,0.22)";
const ERR   = "#B43232";

const inp: React.CSSProperties = {
  width: "100%", padding: "0.42rem 0.65rem", borderRadius: 8, boxSizing: "border-box",
  border: `1.5px solid ${BORDER}`, background: BG, color: TEXT,
  fontFamily: "Tajawal, Cairo, sans-serif", fontSize: "0.82rem", outline: "none",
};
const btn = (active = true): React.CSSProperties => ({
  padding: "0.45rem 1.1rem", borderRadius: 9, cursor: active ? "pointer" : "not-allowed",
  border: "none", fontFamily: "Tajawal, Cairo, sans-serif", fontWeight: 700, fontSize: "0.8rem",
  background: active ? G : "rgba(201,162,75,0.25)", color: active ? TEXT : "#9A8070",
  boxShadow: active ? "0 2px 10px rgba(201,162,75,0.25)" : "none",
});
const dangerBtn: React.CSSProperties = {
  padding: "0.32rem 0.7rem", borderRadius: 7, cursor: "pointer",
  border: "1px solid rgba(180,50,50,0.25)", background: "transparent",
  color: ERR, fontSize: "0.7rem", fontWeight: 700,
  fontFamily: "Tajawal, Cairo, sans-serif",
};

// ── Types ──────────────────────────────────────────────────────
type LightingType = {
  id: string; slug: string; nameAr: string; nameEn: string;
  descriptionAr: string; basePriceSar: number; iconEmoji: string;
  isActive: boolean; sortOrder: number;
};
type FaceOption = {
  id: string; slug: string; nameAr: string; nameEn: string; descriptionAr: string;
  hasColorPicker: boolean; priceSar: number; gradientCss: string; iconEmoji: string;
  isActive: boolean; sortOrder: number; lightingTypeId: string;
  lightingType?: { nameAr: string; slug: string };
};
type SideMetal = {
  id: string; slug: string; nameAr: string; nameEn: string;
  descriptionAr: string; priceSar: number; gradientCss: string; iconEmoji: string;
  isActive: boolean; sortOrder: number;
};
type SideAddon = {
  id: string; slug: string; nameAr: string; nameEn: string;
  descriptionAr: string; priceSar: number; iconEmoji: string;
  isActive: boolean; sortOrder: number;
};
type LightColor = {
  id: string; slug: string; nameAr: string; nameEn: string;
  hexColor: string; priceSar: number; isColored: boolean;
  isActive: boolean; sortOrder: number;
};

type Tab = "lighting" | "face" | "metals" | "addons" | "colors";

// ── Badge helper ───────────────────────────────────────────────
function ActiveBadge({ v }: { v: boolean }) {
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 12, fontSize: "0.67rem", fontWeight: 700,
      background: v ? "rgba(46,122,62,0.12)" : "rgba(180,50,50,0.1)",
      color: v ? "#2E7A3E" : ERR,
    }}>{v ? "نشط" : "موقوف"}</span>
  );
}

// ── Generic price/toggle toggle row ────────────────────────────
function PriceCell({ v }: { v: number }) {
  return <span style={{ color: GOLD, fontWeight: 700 }}>{v === 0 ? "مجاناً" : `${v} ر.س`}</span>;
}

// ═══════════════════════════════════════════════════════════════
//  TAB: Lighting Types
// ═══════════════════════════════════════════════════════════════
function LightingTab() {
  const [rows, setRows]   = useState<LightingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]   = useState({ nameAr: "", nameEn: "", descriptionAr: "", basePriceSar: 0, iconEmoji: "💡", sortOrder: 0, isActive: true });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/configurator/lighting-types", { credentials: "include" });
    const d = await r.json();
    setRows(d.lightingTypes ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setErr("");
    const r = await fetch("/api/admin/configurator/lighting-types", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, slug: form.nameEn.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }),
    });
    if (r.ok) { setForm({ nameAr: "", nameEn: "", descriptionAr: "", basePriceSar: 0, iconEmoji: "💡", sortOrder: 0, isActive: true }); load(); }
    else { const d = await r.json(); setErr(JSON.stringify(d.error)); }
    setSaving(false);
  };

  const toggle = async (row: LightingType) => {
    await fetch(`/api/admin/configurator/lighting-types/${row.id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !row.isActive }),
    });
    load();
  };

  const updatePrice = async (row: LightingType, price: number) => {
    await fetch(`/api/admin/configurator/lighting-types/${row.id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ basePriceSar: price }),
    });
    load();
  };

  return (
    <div>
      <SectionCard title="إضافة نوع إضاءة جديد">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
          <Field label="الاسم بالعربية"><input style={inp} value={form.nameAr} onChange={e => setForm(p => ({ ...p, nameAr: e.target.value }))} /></Field>
          <Field label="الاسم بالإنجليزية (يُنشئ slug تلقائياً)"><input style={inp} dir="ltr" value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} /></Field>
          <Field label="الوصف"><input style={inp} value={form.descriptionAr} onChange={e => setForm(p => ({ ...p, descriptionAr: e.target.value }))} /></Field>
          <Field label="السعر الأساسي (ر.س)"><input style={inp} type="number" min={0} value={form.basePriceSar} onChange={e => setForm(p => ({ ...p, basePriceSar: +e.target.value }))} /></Field>
          <Field label="أيقونة"><input style={inp} value={form.iconEmoji} onChange={e => setForm(p => ({ ...p, iconEmoji: e.target.value }))} /></Field>
          <Field label="ترتيب العرض"><input style={inp} type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: +e.target.value }))} /></Field>
        </div>
        {err && <div style={{ color: ERR, fontSize: "0.72rem", marginTop: "0.5rem" }}>{err}</div>}
        <div style={{ marginTop: "0.75rem" }}>
          <button onClick={save} disabled={saving || !form.nameAr || !form.nameEn} style={btn(!saving && !!form.nameAr && !!form.nameEn)}>
            {saving ? "جارٍ الحفظ..." : "+ إضافة"}
          </button>
        </div>
      </SectionCard>

      <div style={{ marginTop: "1.25rem" }}>
        {loading ? <Spinner /> : rows.map(row => (
          <RowCard key={row.id}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, flexWrap: "wrap" }}>
              <span style={{ fontSize: "1.1rem" }}>{row.iconEmoji}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.85rem", color: TEXT }}>{row.nameAr}</div>
                <div style={{ fontSize: "0.65rem", color: MUTED, direction: "ltr" }}>{row.slug}</div>
              </div>
              <ActiveBadge v={row.isActive} />
              <PriceCell v={row.basePriceSar} />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <InlinePriceEdit value={row.basePriceSar} onSave={v => updatePrice(row, v)} />
              <button onClick={() => toggle(row)} style={{ ...dangerBtn, color: row.isActive ? ERR : "#2E7A3E", borderColor: row.isActive ? "rgba(180,50,50,0.25)" : "rgba(46,122,62,0.25)" }}>
                {row.isActive ? "إيقاف" : "تفعيل"}
              </button>
            </div>
          </RowCard>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TAB: Face Options
// ═══════════════════════════════════════════════════════════════
function FaceOptionsTab() {
  const [rows, setRows]   = useState<FaceOption[]>([]);
  const [lTypes, setLTypes] = useState<LightingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]   = useState({ nameAr: "", nameEn: "", descriptionAr: "", hasColorPicker: false, priceSar: 0, gradientCss: "", iconEmoji: "🔲", isActive: true, sortOrder: 0, lightingTypeId: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [r1, r2] = await Promise.all([
      fetch("/api/admin/configurator/face-options", { credentials: "include" }),
      fetch("/api/admin/configurator/lighting-types", { credentials: "include" }),
    ]);
    const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
    setRows(d1.faceOptions ?? []);
    setLTypes(d2.lightingTypes ?? []);
    if (!form.lightingTypeId && d2.lightingTypes?.length) setForm(p => ({ ...p, lightingTypeId: d2.lightingTypes[0].id }));
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setErr("");
    const r = await fetch("/api/admin/configurator/face-options", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, slug: form.nameEn.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }),
    });
    if (r.ok) { setForm(p => ({ ...p, nameAr: "", nameEn: "", descriptionAr: "", priceSar: 0, gradientCss: "", iconEmoji: "🔲", hasColorPicker: false })); load(); }
    else { const d = await r.json(); setErr(JSON.stringify(d.error)); }
    setSaving(false);
  };

  const toggle = async (row: FaceOption) => {
    await fetch(`/api/admin/configurator/face-options/${row.id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !row.isActive }),
    });
    load();
  };

  const updatePrice = async (row: FaceOption, price: number) => {
    await fetch(`/api/admin/configurator/face-options/${row.id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceSar: price }),
    });
    load();
  };

  return (
    <div>
      <SectionCard title="إضافة خيار وجه جديد">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
          <Field label="نوع الإضاءة">
            <select style={inp} value={form.lightingTypeId} onChange={e => setForm(p => ({ ...p, lightingTypeId: e.target.value }))}>
              {lTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.nameAr}</option>)}
            </select>
          </Field>
          <Field label="الاسم بالعربية"><input style={inp} value={form.nameAr} onChange={e => setForm(p => ({ ...p, nameAr: e.target.value }))} /></Field>
          <Field label="الاسم بالإنجليزية"><input style={inp} dir="ltr" value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} /></Field>
          <Field label="السعر الإضافي (ر.س)"><input style={inp} type="number" min={0} value={form.priceSar} onChange={e => setForm(p => ({ ...p, priceSar: +e.target.value }))} /></Field>
          <Field label="الوصف"><input style={inp} value={form.descriptionAr} onChange={e => setForm(p => ({ ...p, descriptionAr: e.target.value }))} /></Field>
          <Field label="أيقونة"><input style={inp} value={form.iconEmoji} onChange={e => setForm(p => ({ ...p, iconEmoji: e.target.value }))} /></Field>
          <Field label="تدرّج CSS (gradient)"><input style={inp} dir="ltr" value={form.gradientCss} onChange={e => setForm(p => ({ ...p, gradientCss: e.target.value }))} placeholder="linear-gradient(135deg,#f8f8f8,#e0e0e0)" /></Field>
          <Field label="">
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", marginTop: "1.5rem" }}>
              <input type="checkbox" checked={form.hasColorPicker} onChange={e => setForm(p => ({ ...p, hasColorPicker: e.target.checked }))} style={{ accentColor: GOLD, width: 15, height: 15 }} />
              <span style={{ fontSize: "0.8rem", color: TEXT }}>يفتح منتقي الألوان (أكريليك ملوّن)</span>
            </label>
          </Field>
        </div>
        {err && <div style={{ color: ERR, fontSize: "0.72rem", marginTop: "0.5rem" }}>{err}</div>}
        <div style={{ marginTop: "0.75rem" }}>
          <button onClick={save} disabled={saving || !form.nameAr || !form.nameEn || !form.lightingTypeId} style={btn(!saving && !!form.nameAr && !!form.nameEn)}>
            {saving ? "جارٍ الحفظ..." : "+ إضافة"}
          </button>
        </div>
      </SectionCard>

      <div style={{ marginTop: "1.25rem" }}>
        {loading ? <Spinner /> : rows.map(row => (
          <RowCard key={row.id}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, flexWrap: "wrap" }}>
              <span style={{ fontSize: "1rem" }}>{row.iconEmoji}</span>
              {row.gradientCss && <span style={{ width: 28, height: 28, borderRadius: 7, background: row.gradientCss, border: `1px solid ${BORDER}`, flexShrink: 0, display: "inline-block" }} />}
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.82rem", color: TEXT }}>{row.nameAr}</div>
                <div style={{ fontSize: "0.62rem", color: MUTED }}>{row.lightingType?.nameAr ?? row.lightingTypeId} · {row.hasColorPicker ? "🎨 منتقي ألوان" : "لون ثابت"}</div>
              </div>
              <ActiveBadge v={row.isActive} />
              <PriceCell v={row.priceSar} />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <InlinePriceEdit value={row.priceSar} onSave={v => updatePrice(row, v)} />
              <button onClick={() => toggle(row)} style={{ ...dangerBtn, color: row.isActive ? ERR : "#2E7A3E", borderColor: row.isActive ? "rgba(180,50,50,0.25)" : "rgba(46,122,62,0.25)" }}>
                {row.isActive ? "إيقاف" : "تفعيل"}
              </button>
            </div>
          </RowCard>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Generic CRUD Tab (for side metals, addons, light colors)
// ═══════════════════════════════════════════════════════════════
type GenericRow = { id: string; slug: string; nameAr: string; priceSar: number; isActive: boolean; iconEmoji?: string; hexColor?: string; isColored?: boolean };

function GenericTab({
  apiBase, label, extraFields,
}: {
  apiBase: string;
  label: string;
  extraFields?: (form: Record<string, unknown>, set: (p: Record<string, unknown>) => void) => React.ReactNode;
}) {
  const [rows, setRows] = useState<GenericRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Record<string, unknown>>({ nameAr: "", nameEn: "", descriptionAr: "", priceSar: 0, iconEmoji: "✨", isActive: true, sortOrder: 0 });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const setF = useCallback((patch: Record<string, unknown>) => setForm(p => ({ ...p, ...patch })), []);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(apiBase, { credentials: "include" });
    const d = await r.json();
    const key = Object.keys(d).find(k => Array.isArray(d[k]));
    setRows(key ? d[key] : []);
    setLoading(false);
  }, [apiBase]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setErr("");
    const slug = (form.nameEn as string).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const r = await fetch(apiBase, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, slug }),
    });
    if (r.ok) { setForm({ nameAr: "", nameEn: "", descriptionAr: "", priceSar: 0, iconEmoji: "✨", isActive: true, sortOrder: 0 }); load(); }
    else { const d = await r.json(); setErr(JSON.stringify(d.error)); }
    setSaving(false);
  };

  const toggle = async (row: GenericRow) => {
    await fetch(`${apiBase}/${row.id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !row.isActive }),
    });
    load();
  };

  const updatePrice = async (row: GenericRow, price: number) => {
    await fetch(`${apiBase}/${row.id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceSar: price }),
    });
    load();
  };

  return (
    <div>
      <SectionCard title={`إضافة ${label} جديد`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
          <Field label="الاسم بالعربية"><input style={inp} value={form.nameAr as string} onChange={e => setF({ nameAr: e.target.value })} /></Field>
          <Field label="الاسم بالإنجليزية"><input style={inp} dir="ltr" value={form.nameEn as string} onChange={e => setF({ nameEn: e.target.value })} /></Field>
          <Field label="الوصف"><input style={inp} value={form.descriptionAr as string} onChange={e => setF({ descriptionAr: e.target.value })} /></Field>
          <Field label="السعر (ر.س)"><input style={inp} type="number" min={0} value={form.priceSar as number} onChange={e => setF({ priceSar: +e.target.value })} /></Field>
          {extraFields?.(form, setF)}
        </div>
        {err && <div style={{ color: ERR, fontSize: "0.72rem", marginTop: "0.5rem" }}>{err}</div>}
        <div style={{ marginTop: "0.75rem" }}>
          <button onClick={save} disabled={saving || !(form.nameAr as string) || !(form.nameEn as string)} style={btn(!saving && !!(form.nameAr as string) && !!(form.nameEn as string))}>
            {saving ? "جارٍ الحفظ..." : "+ إضافة"}
          </button>
        </div>
      </SectionCard>

      <div style={{ marginTop: "1.25rem" }}>
        {loading ? <Spinner /> : rows.map(row => (
          <RowCard key={row.id}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, flexWrap: "wrap" }}>
              {row.hexColor && <span style={{ width: 24, height: 24, borderRadius: "50%", background: row.hexColor, border: `1px solid ${BORDER}`, flexShrink: 0, display: "inline-block", boxShadow: `0 0 8px ${row.hexColor}88` }} />}
              {row.iconEmoji && !row.hexColor && <span style={{ fontSize: "1rem" }}>{row.iconEmoji}</span>}
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.82rem", color: TEXT }}>{row.nameAr}</div>
                <div style={{ fontSize: "0.62rem", color: MUTED, direction: "ltr" }}>{row.slug}</div>
              </div>
              {row.isColored !== undefined && (
                <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: "0.63rem", fontWeight: 700, background: row.isColored ? "rgba(175,82,222,0.12)" : "rgba(52,199,89,0.12)", color: row.isColored ? "#AF52DE" : "#2E7A3E" }}>
                  {row.isColored ? "ملوّن (+سعر)" : "قياسي (مجاناً)"}
                </span>
              )}
              <ActiveBadge v={row.isActive} />
              <PriceCell v={row.priceSar} />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <InlinePriceEdit value={row.priceSar} onSave={v => updatePrice(row, v)} />
              <button onClick={() => toggle(row)} style={{ ...dangerBtn, color: row.isActive ? ERR : "#2E7A3E", borderColor: row.isActive ? "rgba(180,50,50,0.25)" : "rgba(46,122,62,0.25)" }}>
                {row.isActive ? "إيقاف" : "تفعيل"}
              </button>
            </div>
          </RowCard>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function ConfiguratorAdminPage() {
  const [tab, setTab] = useState<Tab>("lighting");

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "lighting", label: "أنواع الإضاءة", icon: "💡" },
    { id: "face",     label: "خيارات الوجه",  icon: "🔲" },
    { id: "metals",   label: "معادن الجوانب", icon: "🔩" },
    { id: "addons",   label: "الإضافات",      icon: "✨" },
    { id: "colors",   label: "ألوان الإضاءة", icon: "🌈" },
  ];

  return (
    <div style={{ padding: "1.75rem", maxWidth: 860, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 900, color: TEXT, margin: 0 }}>
          🏗️ مصمّم الحروف البارزة v2
        </h1>
        <p style={{ fontSize: "0.75rem", color: MUTED, marginTop: 4, marginBottom: 0 }}>
          إدارة خيارات الإضاءة · الوجه · الجوانب · الإضافات · الألوان — الأسعار تقديرية واسترشادية للعملاء
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "0.45rem 0.9rem", borderRadius: 10, cursor: "pointer",
            border: `1.5px solid ${tab === t.id ? GOLD : BORDER}`,
            background: tab === t.id ? "rgba(201,162,75,0.1)" : CARD,
            color: tab === t.id ? GOLD : MUTED,
            fontFamily: "Tajawal, Cairo, sans-serif", fontWeight: tab === t.id ? 800 : 600, fontSize: "0.8rem",
            transition: "all 0.15s",
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "lighting" && <LightingTab />}
      {tab === "face"     && <FaceOptionsTab />}
      {tab === "metals"   && (
        <GenericTab
          apiBase="/api/admin/configurator/side-metals"
          label="معدن جانب"
          extraFields={(form, set) => (
            <>
              <Field label="أيقونة"><input style={inp} value={form.iconEmoji as string} onChange={e => set({ iconEmoji: e.target.value })} /></Field>
              <Field label="تدرّج CSS"><input style={inp} dir="ltr" value={form.gradientCss as string ?? ""} onChange={e => set({ gradientCss: e.target.value })} placeholder="linear-gradient(135deg,#8a9098,#c8cdd4)" /></Field>
            </>
          )}
        />
      )}
      {tab === "addons"   && (
        <GenericTab
          apiBase="/api/admin/configurator/side-addons"
          label="إضافة"
          extraFields={(form, set) => (
            <Field label="أيقونة"><input style={inp} value={form.iconEmoji as string} onChange={e => set({ iconEmoji: e.target.value })} /></Field>
          )}
        />
      )}
      {tab === "colors"   && (
        <GenericTab
          apiBase="/api/admin/configurator/light-colors"
          label="لون إضاءة"
          extraFields={(form, set) => (
            <>
              <Field label="اللون (HEX)">
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input type="color" value={(form.hexColor as string) || "#FFC65C"} onChange={e => set({ hexColor: e.target.value })} style={{ width: 42, height: 34, borderRadius: 7, cursor: "pointer", border: `1px solid ${BORDER}`, padding: 2 }} />
                  <input style={{ ...inp, flex: 1 }} dir="ltr" value={(form.hexColor as string) || ""} onChange={e => set({ hexColor: e.target.value })} placeholder="#FFC65C" />
                </div>
              </Field>
              <Field label="">
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", marginTop: "1.5rem" }}>
                  <input type="checkbox" checked={form.isColored as boolean ?? false} onChange={e => set({ isColored: e.target.checked })} style={{ accentColor: GOLD, width: 15, height: 15 }} />
                  <span style={{ fontSize: "0.8rem", color: TEXT }}>لون ملوّن (بسعر إضافي)</span>
                </label>
              </Field>
            </>
          )}
        />
      )}
    </div>
  );
}

// ── Shared mini-components ─────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: "1.1rem 1.25rem", boxShadow: "0 2px 8px rgba(44,30,21,0.06)" }}>
      <div style={{ fontWeight: 800, fontSize: "0.85rem", color: TEXT, marginBottom: "0.85rem" }}>{title}</div>
      {children}
    </div>
  );
}

function RowCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "space-between", padding: "0.7rem 1rem", background: CARD, borderRadius: 11, border: `1px solid ${BORDER}`, marginBottom: "0.5rem", flexWrap: "wrap" }}>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      {label && <label style={{ display: "block", fontSize: "0.67rem", color: MUTED, fontWeight: 700, marginBottom: 4 }}>{label}</label>}
      {children}
    </div>
  );
}

function Spinner() {
  return <div style={{ textAlign: "center", color: GOLD, padding: "1.5rem", fontSize: "0.8rem" }}>جارٍ التحميل...</div>;
}

function InlinePriceEdit({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value);
  if (!editing) return (
    <button onClick={() => { setV(value); setEditing(true); }} style={{ ...dangerBtn, color: MUTED, borderColor: BORDER }}>
      تعديل السعر
    </button>
  );
  return (
    <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
      <input type="number" value={v} min={0} onChange={e => setV(+e.target.value)} style={{ ...inp, width: 76, padding: "0.28rem 0.45rem" }} />
      <button onClick={() => { onSave(v); setEditing(false); }} style={{ ...dangerBtn, color: "#2E7A3E", borderColor: "rgba(46,122,62,0.3)", padding: "0.28rem 0.6rem" }}>✓</button>
      <button onClick={() => setEditing(false)} style={{ ...dangerBtn, padding: "0.28rem 0.6rem" }}>✕</button>
    </div>
  );
}
