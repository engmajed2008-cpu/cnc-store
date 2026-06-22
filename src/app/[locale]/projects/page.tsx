"use client";
import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";

const GOLD = "#C9A24B";
const G = "linear-gradient(135deg,#9A7B36,#E6CA83)";

type SavedProject = {
  id: string;
  name: string;
  type: "raised-letters";
  state: { establishmentType: string; signType: string; city: string; bgW: number; bgH: number };
  layers: unknown[];
  savedAt: number;
};

const SIGN_LABELS: Record<string, string> = {
  parallel: "موازية لسطح الواجهة",
  projecting: "متعامدة على الواجهة",
  acrylic: "لوحة أكريليك",
  "acrylic-indoor": "لوحة أكريليك داخلية",
  "upper-facade": "واجهة الأدوار العليا",
  tenant: "لوحة قائمة بذاتها",
  brand: "علامة تجارية أعلى المبنى",
  entrance: "لوحة مدخل",
};

const EST_LABELS: Record<string, string> = {
  store: "متجر / محل تجاري",
  hotel: "فندق أو مستشفى",
  office: "مكتب داخلي",
  building: "مبنى إداري / تجاري",
  supermarket: "تموينات",
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  return `منذ ${d} يوم`;
}

export default function ProjectsPage() {
  const locale = useLocale();
  const ar = locale === "ar";
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");

  useEffect(() => {
    setIsPro(localStorage.getItem("e3lani_plan") === "pro");
    const raw = localStorage.getItem("e3lani_projects");
    if (raw) {
      try { setProjects(JSON.parse(raw)); } catch {}
    }
    setMounted(true);
  }, []);

  function deleteProject(id: string) {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    localStorage.setItem("e3lani_projects", JSON.stringify(updated));
    setDeleteId(null);
  }

  function renameProject(id: string, name: string) {
    const updated = projects.map(p => p.id === id ? { ...p, name } : p);
    setProjects(updated);
    localStorage.setItem("e3lani_projects", JSON.stringify(updated));
    setRenameId(null);
  }

  if (!mounted) return null;

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: "#FDFBF7", fontFamily: "Tajawal, Cairo, sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#F2E8D0", borderBottom: "1px solid rgba(201,162,75,0.2)", padding: "1rem 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", gap: "0.4rem", fontSize: "0.7rem", color: "#7A5520", marginBottom: 4 }}>
              <Link href={`/${locale}`} style={{ color: GOLD, textDecoration: "none" }}>الرئيسية</Link>
              <span>›</span>
              <span style={{ color: "#2C1E15" }}>مشاريعي</span>
            </div>
            <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900, color: "#2C1E15" }}>
              مشاريعي <span style={{ background: G, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>المحفوظة</span>
            </h1>
          </div>
          <Link href={`/${locale}/configure/signs/raised-letters`}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.65rem 1.4rem",
              borderRadius: 999, background: G, color: "#2C1E15", textDecoration: "none",
              fontWeight: 800, fontSize: "0.88rem", boxShadow: "0 4px 16px rgba(154,106,42,0.3)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            مشروع جديد
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* Pro gate */}
        {!isPro && (
          <div style={{ textAlign: "center", padding: "4rem 2rem", borderRadius: 20,
            background: "linear-gradient(135deg,#2C1E15,#1A1008)", border: "1px solid rgba(201,162,75,0.2)",
            maxWidth: 480, margin: "0 auto" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>🔒</div>
            <h2 style={{ color: "#F4ECDD", fontWeight: 800, margin: "0 0 12px" }}>ميزة حفظ المشاريع</h2>
            <p style={{ color: "rgba(244,236,221,0.7)", lineHeight: 1.7, margin: "0 0 24px", fontSize: "0.9rem" }}>
              تتوفر ميزة حفظ التصاميم والعودة إليها لاحقاً للمشتركين في الخطة الاحترافية فقط.
            </p>
            <Link href={`/${locale}/configure/signs/raised-letters`}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.8rem 2rem",
                borderRadius: 999, background: G, color: "#2C1E15", textDecoration: "none",
                fontWeight: 800, fontSize: "0.95rem", boxShadow: "0 6px 20px rgba(154,106,42,0.35)" }}>
              ✦ ترقية للخطة الاحترافية
            </Link>
          </div>
        )}

        {/* Empty state */}
        {isPro && projects.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16, opacity: 0.4 }}>🎨</div>
            <h2 style={{ color: "#2C1E15", fontWeight: 800, margin: "0 0 10px" }}>لا توجد مشاريع محفوظة بعد</h2>
            <p style={{ color: "#7A5520", margin: "0 0 24px" }}>ابدأ بتصميم لوحتك واحفظها للعودة إليها لاحقاً.</p>
            <Link href={`/${locale}/configure/signs/raised-letters`}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.75rem 1.8rem",
                borderRadius: 999, background: G, color: "#2C1E15", textDecoration: "none",
                fontWeight: 800, fontSize: "0.9rem" }}>
              ابدأ تصميماً جديداً
            </Link>
          </div>
        )}

        {/* Projects grid */}
        {isPro && projects.length > 0 && (
          <>
            <p style={{ color: "#7A5520", fontSize: "0.85rem", margin: "0 0 1.5rem" }}>
              {projects.length} مشروع محفوظ · يُخزَّن في هذا المتصفح
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1.25rem" }}>
              {projects.map(p => (
                <div key={p.id} style={{ background: "#FFF8EC", borderRadius: 16, border: "1px solid rgba(201,162,75,0.2)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)", overflow: "hidden", transition: "box-shadow 0.2s" }}>

                  {/* Card header */}
                  <div style={{ background: "linear-gradient(135deg,#2C1E15,#1A1008)", padding: "1.1rem 1.25rem",
                    display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(201,162,75,0.15)",
                        border: "1px solid rgba(201,162,75,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                        🎨
                      </div>
                      <div>
                        {renameId === p.id ? (
                          <input
                            autoFocus value={renameName}
                            onChange={e => setRenameName(e.target.value)}
                            onBlur={() => { if (renameName.trim()) renameProject(p.id, renameName.trim()); else setRenameId(null); }}
                            onKeyDown={e => { if (e.key === "Enter" && renameName.trim()) renameProject(p.id, renameName.trim()); if (e.key === "Escape") setRenameId(null); }}
                            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(201,162,75,0.5)", borderRadius: 6,
                              color: "#F4ECDD", padding: "2px 8px", fontSize: "0.9rem", fontFamily: "inherit", width: 140 }}
                          />
                        ) : (
                          <div style={{ color: "#F4ECDD", fontWeight: 700, fontSize: "0.92rem", cursor: "pointer" }}
                            onDoubleClick={() => { setRenameId(p.id); setRenameName(p.name); }}>
                            {p.name}
                          </div>
                        )}
                        <div style={{ color: "rgba(201,162,75,0.6)", fontSize: "0.68rem", marginTop: 2 }}>
                          {timeAgo(p.savedAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1rem" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.72rem", padding: "2px 10px", borderRadius: 999,
                          background: "rgba(201,162,75,0.1)", border: "1px solid rgba(201,162,75,0.25)", color: "#7A5520", fontWeight: 600 }}>
                          {SIGN_LABELS[p.state?.signType] || p.state?.signType || "—"}
                        </span>
                        <span style={{ fontSize: "0.72rem", padding: "2px 10px", borderRadius: 999,
                          background: "rgba(44,30,21,0.06)", border: "1px solid rgba(44,30,21,0.1)", color: "#5A4A3A" }}>
                          {EST_LABELS[p.state?.establishmentType] || "—"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#9A7A5A" }}>
                        📐 {p.state?.bgW || "—"} × {p.state?.bgH || "—"} سم
                        {p.layers?.length > 0 && <span> · {p.layers.length} عناصر</span>}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <Link href={`/${locale}/configure/signs/raised-letters?project=${p.id}`}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          padding: "0.6rem", borderRadius: 10, background: G, color: "#2C1E15",
                          textDecoration: "none", fontWeight: 800, fontSize: "0.84rem" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        متابعة التصميم
                      </Link>
                      <button
                        onClick={() => { setRenameId(p.id); setRenameName(p.name); }}
                        title="إعادة تسمية"
                        style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(154,106,42,0.25)",
                          background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A7A5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteId(p.id)}
                        title="حذف"
                        style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(220,38,38,0.2)",
                          background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setDeleteId(null)}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#FDFBF7", borderRadius: 16, padding: "1.75rem", width: "min(90vw,380px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)", fontFamily: "inherit" }} dir="rtl">
            <h3 style={{ margin: "0 0 10px", fontSize: "1rem", fontWeight: 800, color: "#2C1E15" }}>حذف المشروع؟</h3>
            <p style={{ margin: "0 0 1.2rem", fontSize: "0.85rem", color: "#7A5520", lineHeight: 1.6 }}>
              سيُحذف المشروع نهائياً من المتصفح ولا يمكن التراجع عن هذا الإجراء.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => deleteProject(deleteId)}
                style={{ flex: 1, padding: "0.65rem", borderRadius: 999, border: "none", cursor: "pointer",
                  background: "#dc2626", color: "#fff", fontWeight: 800, fontSize: "0.9rem", fontFamily: "inherit" }}>
                حذف
              </button>
              <button onClick={() => setDeleteId(null)}
                style={{ padding: "0.65rem 1.2rem", borderRadius: 999, border: "1px solid rgba(154,106,42,0.3)",
                  background: "transparent", color: "#7A5520", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem" }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
