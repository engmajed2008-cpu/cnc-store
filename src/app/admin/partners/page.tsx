"use client";

/**
 * /admin/partners — مراجعة طلبات انضمام الشركاء (موافقة يدوية دائماً)
 * يعرض نموذج دخول المشرف عند انتهاء/غياب الجلسة (401).
 */

import { useState, useEffect, useCallback } from "react";

const G = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GOLD = "#C9A24B";

const KIND_LABELS: Record<string, string> = {
  AD_AGENCY: "وكالة دعاية وإعلان",
  MANUFACTURER: "منشأة صناعة دعاية وإعلان",
  SUPPLIER: "مورد مواد",
};

type PartnerRow = {
  id: string;
  companyName: string;
  crNumber: string | null;
  crNumberType?: string | null; // CR | UNIFIED
  crDocUrl?: string | null;
  ownerIdNumber?: string | null;
  ownerIdDocUrl?: string | null;
  pledgeAcceptedAt?: string | null;
  city?: string | null;
  kind?: "AD_AGENCY" | "MANUFACTURER";
  verified: boolean;
  isAnchor?: boolean;
  createdAt: string;
  profile: { fullName: string; email: string | null; phone: string | null; role: string };
  amana: { nameAr: string } | null;
};

export default function AdminPartnersPage() {
  const [needLogin, setNeedLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [agencies, setAgencies] = useState<PartnerRow[]>([]);
  const [suppliers, setSuppliers] = useState<PartnerRow[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (all: boolean) => {
    setLoading(true);
    const res = await fetch(`/api/admin/partners?status=${all ? "all" : "pending"}`);
    if (res.status === 401) {
      setNeedLogin(true);
      setLoading(false);
      return;
    }
    if (res.ok) {
      const j = await res.json();
      setAgencies(j.agencies ?? []);
      setSuppliers(j.suppliers ?? []);
      setNeedLogin(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(showAll); }, [load, showAll]);

  const login = async () => {
    setLoginError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setLoginError(j.error ?? "تعذّر تسجيل الدخول"); return; }
    setPassword("");
    load(showAll);
  };

  const decide = async (type: "agency" | "supplier", id: string, action: "approve" | "reject", isVerified = false) => {
    const msg = isVerified
      ? "حذف العضوية سيلغي تفعيل الشريك ويعيد حسابه عميلاً عادياً — هل أنت متأكد؟"
      : "رفض الطلب سيحذفه — هل أنت متأكد؟";
    if (action === "reject" && !confirm(msg)) return;
    setBusy(id);
    try {
      const res = await fetch("/api/admin/partners/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, action }),
      });
      if (res.status === 401) { setNeedLogin(true); return; }
      await load(showAll);
    } finally {
      setBusy(null);
    }
  };

  const Card = ({ row, type }: { row: PartnerRow; type: "agency" | "supplier" }) => (
    <div style={{ background: "#F2E8D0", border: "1px solid rgba(154,106,42,0.25)", borderRadius: 14, padding: "1.25rem 1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ minWidth: 240 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
          <span style={{ fontWeight: 800, color: "#2C1E15", fontSize: "0.95rem" }}>{row.companyName}</span>
          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: GOLD, background: "rgba(201,162,75,0.1)", border: "1px solid rgba(201,162,75,0.25)", borderRadius: 999, padding: "0.15rem 0.6rem" }}>
            {KIND_LABELS[type === "supplier" ? "SUPPLIER" : row.kind ?? "AD_AGENCY"]}
          </span>
          {row.verified && (
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#6dcc6d", background: "rgba(100,200,100,0.08)", border: "1px solid rgba(100,200,100,0.25)", borderRadius: 999, padding: "0.15rem 0.6rem" }}>
              مفعّلة
            </span>
          )}
        </div>
        <div style={{ fontSize: "0.78rem", color: "#5A3E28", display: "flex", flexWrap: "wrap", gap: "0.4rem 1.25rem" }}>
          <span>👤 {row.profile.fullName || "—"}</span>
          <span>✉️ {row.profile.email ?? "—"}</span>
          <span>📱 {row.profile.phone ?? "—"}</span>
          <span>🧾 {row.crNumberType === "UNIFIED" ? "الرقم الموحد" : "س.ت"}: {row.crNumber ?? "—"}</span>
          {row.crDocUrl ? (
            <a href={row.crDocUrl} target="_blank" rel="noreferrer" style={{ color: GOLD, textDecoration: "underline" }}>
              📎 عرض السجل التجاري
            </a>
          ) : (
            <span style={{ color: "#666" }}>📎 لا يوجد مستند</span>
          )}
          <span>🪪 هوية المالك: {row.ownerIdNumber ?? "—"}</span>
          {row.ownerIdDocUrl ? (
            <a href={row.ownerIdDocUrl} target="_blank" rel="noreferrer" style={{ color: GOLD, textDecoration: "underline" }}>
              🪪 عرض هوية المالك
            </a>
          ) : (
            <span style={{ color: "#666" }}>🪪 لا توجد صورة هوية</span>
          )}
          <span>
            📜 التعهد: {row.pledgeAcceptedAt
              ? `موافَق عليه ${new Date(row.pledgeAcceptedAt).toLocaleDateString("ar-SA")}`
              : "—"}
          </span>
          <span>🏙️ {row.city ?? "—"}</span>
          <span>🏛️ {row.amana?.nameAr ?? (row.city ? "أمانة غير مطابَقة — تُضبط يدوياً" : "—")}</span>
          <span>🗓️ {new Date(row.createdAt).toLocaleDateString("ar-SA")}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {!row.verified && (
          <button onClick={() => decide(type, row.id, "approve")} disabled={busy === row.id}
            style={{ background: G, color: "#2C1E15", fontWeight: 800, border: "none", borderRadius: 999, padding: "0.5rem 1.4rem", cursor: "pointer", fontSize: "0.82rem", fontFamily: "Tajawal, Cairo, sans-serif", opacity: busy === row.id ? 0.6 : 1 }}>
            موافقة وتفعيل
          </button>
        )}
        {!row.isAnchor && (
          <button onClick={() => decide(type, row.id, "reject", row.verified)} disabled={busy === row.id}
            style={{ background: "rgba(239,68,68,0.07)", color: "#f87171", fontWeight: 700, border: "1px solid rgba(239,68,68,0.3)", borderRadius: 999, padding: "0.5rem 1.4rem", cursor: "pointer", fontSize: "0.82rem", fontFamily: "Tajawal, Cairo, sans-serif", opacity: busy === row.id ? 0.6 : 1 }}>
            {row.verified ? "حذف العضوية" : "رفض"}
          </button>
        )}
        {row.isAnchor && (
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: GOLD, background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.25)", borderRadius: 999, padding: "0.45rem 1rem" }}>
            ⚓ وكالة المرساة
          </span>
        )}
      </div>
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "0.65rem 1rem", borderRadius: 10,
    border: "1.5px solid rgba(154,106,42,0.25)", background: "#F2E8D0",
    color: "#2C1E15", fontSize: "0.88rem", outline: "none", fontFamily: "Tajawal, Cairo, sans-serif",
  };

  return (
    // الـ layout الأب (/admin/layout.tsx) يعرض الشريط الجانبي — هنا المحتوى فقط
    <div style={{ padding: "2.5rem", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#2C1E15", margin: "0 0 0.4rem" }}>طلبات الشركاء</h1>
        <p style={{ color: "#777", fontSize: "0.85rem", margin: "0 0 2rem" }}>
          الموافقة يدوية دائماً — تحقق من السجل التجاري قبل التفعيل. الموافقة ترقّي الحساب (وكالة/مصنع → AGENCY، مورد → SUPPLIER).
        </p>

        {needLogin ? (
          <div style={{ maxWidth: 380, background: "#F2E8D0", border: "1px solid rgba(154,106,42,0.25)", borderRadius: 14, padding: "1.75rem", display: "grid", gap: "0.9rem" }}>
            <div style={{ fontWeight: 800, color: "#2C1E15" }}>دخول المشرف</div>
            <input style={inputStyle} placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            <input style={inputStyle} placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} type="password"
              onKeyDown={(e) => e.key === "Enter" && login()} />
            {loginError && <div style={{ color: "#f87171", fontSize: "0.8rem" }}>{loginError}</div>}
            <button onClick={login} style={{ background: G, color: "#2C1E15", fontWeight: 800, border: "none", borderRadius: 999, padding: "0.65rem", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>
              دخول
            </button>
          </div>
        ) : loading ? (
          <p style={{ color: "#888" }}>جاري التحميل...</p>
        ) : (
          <>
            <label style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#999", fontSize: "0.82rem", marginBottom: "1.5rem", cursor: "pointer" }}>
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
              عرض الكل (شامل المفعّلة)
            </label>

            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: GOLD, margin: "0.5rem 0 1rem" }}>
              الوكالات والمصانع ({agencies.length})
            </h2>
            <div style={{ display: "grid", gap: "0.75rem", marginBottom: "2.25rem" }}>
              {agencies.length === 0 && <p style={{ color: "#666", fontSize: "0.85rem" }}>لا توجد طلبات.</p>}
              {agencies.map((a) => <Card key={a.id} row={a} type="agency" />)}
            </div>

            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: GOLD, margin: "0 0 1rem" }}>
              موردو المواد ({suppliers.length})
            </h2>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {suppliers.length === 0 && <p style={{ color: "#666", fontSize: "0.85rem" }}>لا توجد طلبات.</p>}
              {suppliers.map((s) => <Card key={s.id} row={s} type="supplier" />)}
            </div>
          </>
        )}
    </div>
  );
}
