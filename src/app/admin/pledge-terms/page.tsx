"use client";

/**
 * /admin/pledge-terms — إدارة شروط تعهد الشركاء (ديناميكية)
 * إضافة وحذف وتفعيل/تعطيل الشروط التي تظهر في نموذج الانضمام.
 * يعرض نموذج دخول المشرف عند انتهاء/غياب الجلسة (401).
 */

import { useState, useEffect, useCallback } from "react";

const G = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GOLD = "#C9A24B";

type TermRow = {
  id: string;
  textAr: string;
  textEn: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

export default function AdminPledgeTermsPage() {
  const [needLogin, setNeedLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [terms, setTerms] = useState<TermRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // إضافة شرط جديد
  const [newAr, setNewAr] = useState("");
  const [newEn, setNewEn] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/pledge-terms");
    if (res.status === 401) {
      setNeedLogin(true);
      setLoading(false);
      return;
    }
    if (res.ok) {
      const j = await res.json();
      setTerms(j.terms ?? []);
      setNeedLogin(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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
    load();
  };

  const addTerm = async () => {
    setError(null);
    if (newAr.trim().length < 5) { setError("نص الشرط بالعربية مطلوب (5 أحرف على الأقل)"); return; }
    setAdding(true);
    try {
      const res = await fetch("/api/admin/pledge-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textAr: newAr.trim(), ...(newEn.trim() ? { textEn: newEn.trim() } : {}) }),
      });
      if (res.status === 401) { setNeedLogin(true); return; }
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setError(j.error ?? "تعذّر إضافة الشرط"); return; }
      setNewAr("");
      setNewEn("");
      await load();
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (term: TermRow) => {
    setBusy(term.id);
    try {
      const res = await fetch("/api/admin/pledge-terms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: term.id, isActive: !term.isActive }),
      });
      if (res.status === 401) { setNeedLogin(true); return; }
      await load();
    } finally {
      setBusy(null);
    }
  };

  const deleteTerm = async (term: TermRow) => {
    if (!confirm("حذف الشرط نهائياً — هل أنت متأكد؟")) return;
    setBusy(term.id);
    try {
      const res = await fetch("/api/admin/pledge-terms", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: term.id }),
      });
      if (res.status === 401) { setNeedLogin(true); return; }
      await load();
    } finally {
      setBusy(null);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "0.65rem 1rem", borderRadius: 10,
    border: "1.5px solid rgba(154,106,42,0.25)", background: "#F2E8D0",
    color: "#2C1E15", fontSize: "0.88rem", outline: "none", fontFamily: "Tajawal, Cairo, sans-serif",
  };

  return (
    // الـ layout الأب (/admin/layout.tsx) يعرض الشريط الجانبي — هنا المحتوى فقط
    <div style={{ padding: "2.5rem", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#2C1E15", margin: "0 0 0.4rem" }}>📜 شروط تعهد الشركاء</h1>
        <p style={{ color: "#777", fontSize: "0.85rem", margin: "0 0 2rem" }}>
          الشروط الفعّالة تظهر في نموذج «انضم كشريك» ويجب على كل شريك الموافقة عليها قبل التقديم. الإضافة والحذف يسريان فوراً.
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
            {/* إضافة شرط جديد */}
            <div style={{ background: "#F2E8D0", border: "1px solid rgba(154,106,42,0.25)", borderRadius: 14, padding: "1.5rem", display: "grid", gap: "0.9rem", marginBottom: "2rem", maxWidth: 760 }}>
              <div style={{ fontWeight: 800, color: GOLD, fontSize: "0.92rem" }}>إضافة شرط جديد</div>
              <textarea
                style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
                placeholder="نص الشرط بالعربية (إلزامي)"
                value={newAr}
                onChange={(e) => setNewAr(e.target.value)}
              />
              <textarea
                style={{ ...inputStyle, minHeight: 50, resize: "vertical" }}
                placeholder="النص بالإنجليزية (اختياري)"
                value={newEn}
                onChange={(e) => setNewEn(e.target.value)}
                dir="ltr"
              />
              {error && <div style={{ color: "#f87171", fontSize: "0.8rem" }}>{error}</div>}
              <button
                onClick={addTerm}
                disabled={adding}
                style={{ background: G, color: "#2C1E15", fontWeight: 800, border: "none", borderRadius: 999, padding: "0.65rem 2rem", cursor: adding ? "wait" : "pointer", fontFamily: "Tajawal, Cairo, sans-serif", justifySelf: "start", opacity: adding ? 0.7 : 1 }}
              >
                {adding ? "جاري الإضافة..." : "➕ إضافة الشرط"}
              </button>
            </div>

            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: GOLD, margin: "0 0 1rem" }}>
              الشروط الحالية ({terms.length})
            </h2>
            <div style={{ display: "grid", gap: "0.75rem", maxWidth: 760 }}>
              {terms.length === 0 && <p style={{ color: "#666", fontSize: "0.85rem" }}>لا توجد شروط — أضف أول شرط أعلاه.</p>}
              {terms.map((t, idx) => (
                <div key={t.id} style={{
                  background: "#F2E8D0", borderRadius: 14, padding: "1rem 1.25rem",
                  border: t.isActive ? "1px solid rgba(154,106,42,0.25)" : "1px dashed rgba(120,120,120,0.3)",
                  display: "flex", gap: "1rem", alignItems: "flex-start",
                  opacity: t.isActive ? 1 : 0.55,
                }}>
                  <span style={{ color: GOLD, fontWeight: 900, fontSize: "0.9rem", minWidth: 24, textAlign: "center" }}>{idx + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#2C1E15", fontSize: "0.88rem", lineHeight: 1.8 }}>{t.textAr}</div>
                    {t.textEn && <div dir="ltr" style={{ color: "#5A3E28", fontSize: "0.78rem", marginTop: "0.25rem" }}>{t.textEn}</div>}
                    {!t.isActive && <div style={{ color: "#999", fontSize: "0.72rem", marginTop: "0.35rem" }}>⏸ معطّل — لا يظهر للشركاء</div>}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                    <button
                      onClick={() => toggleActive(t)}
                      disabled={busy === t.id}
                      style={{ background: "rgba(201,162,75,0.08)", color: GOLD, fontWeight: 700, border: "1px solid rgba(201,162,75,0.25)", borderRadius: 999, padding: "0.4rem 1rem", cursor: "pointer", fontSize: "0.76rem", fontFamily: "Tajawal, Cairo, sans-serif", opacity: busy === t.id ? 0.6 : 1 }}
                    >
                      {t.isActive ? "تعطيل" : "تفعيل"}
                    </button>
                    <button
                      onClick={() => deleteTerm(t)}
                      disabled={busy === t.id}
                      style={{ background: "rgba(239,68,68,0.07)", color: "#f87171", fontWeight: 700, border: "1px solid rgba(239,68,68,0.3)", borderRadius: 999, padding: "0.4rem 1rem", cursor: "pointer", fontSize: "0.76rem", fontFamily: "Tajawal, Cairo, sans-serif", opacity: busy === t.id ? 0.6 : 1 }}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
    </div>
  );
}
