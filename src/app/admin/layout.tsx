"use client";
import { useEffect, useState, useCallback } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { syncFromSupabase, siteStore, DEFAULT_COLORS } from "@/store/siteStore";

const GOLD = "#C9A24B";
const G = "linear-gradient(135deg,#C9A24B,#EBCB7C)";

export type AdminInfo = { email: string; role: string; name?: string };

function AdminLoginForm({ onSuccess }: { onSuccess: (info: AdminInfo) => void }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [err,      setErr]      = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPw,   setShowPw]   = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr("");
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (r.ok) { onSuccess(d.admin); }
      else { setErr(d.error ?? "بيانات غير صحيحة"); }
    } catch {
      setErr("تعذّر الاتصال — تحقق من الاتصال بالإنترنت");
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#FDFBF7",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl",
    }}>
      <div style={{
        width: 380, background: "#F4EFE6", borderRadius: 20,
        border: "1px solid rgba(201,162,75,0.25)",
        boxShadow: "0 24px 64px rgba(44,30,21,0.12)", padding: "2.5rem 2rem",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", margin: "0 auto 0.75rem",
            background: G, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(201,162,75,0.35)",
          }}>
            <span style={{ fontSize: 28, color: "#2C1E15", fontWeight: 900 }}>ع</span>
          </div>
          <div style={{ fontWeight: 900, fontSize: "1.3rem", color: "#2C1E15" }}>لوحة تحكم إعلاني</div>
          <div style={{ fontSize: "0.75rem", color: "#634E40", marginTop: 4 }}>سجّل دخولك للمتابعة</div>
        </div>

        <form onSubmit={submit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.72rem", color: "#634E40", marginBottom: 5, fontWeight: 700 }}>
              البريد الإلكتروني
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required autoFocus dir="ltr" placeholder="admin@e3lani.com"
              style={{
                width: "100%", padding: "0.55rem 0.8rem", borderRadius: 10, boxSizing: "border-box" as const,
                border: "1.5px solid rgba(201,162,75,0.3)", background: "#FDFBF7",
                fontFamily: "Tajawal, Cairo, sans-serif", fontSize: "0.85rem", color: "#2C1E15", outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.72rem", color: "#634E40", marginBottom: 5, fontWeight: 700 }}>
              كلمة المرور
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"} value={password}
                onChange={e => setPassword(e.target.value)} required dir="ltr" placeholder="••••••••"
                style={{
                  width: "100%", padding: "0.55rem 2.4rem 0.55rem 0.8rem",
                  borderRadius: 10, boxSizing: "border-box" as const,
                  border: "1.5px solid rgba(201,162,75,0.3)", background: "#FDFBF7",
                  fontFamily: "Tajawal, Cairo, sans-serif", fontSize: "0.85rem", color: "#2C1E15", outline: "none",
                }}
              />
              <button type="button" onClick={() => setShowPw(p => !p)} style={{
                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "#9A8070", fontSize: "0.72rem",
              }}>{showPw ? "إخفاء" : "عرض"}</button>
            </div>
          </div>

          {err && (
            <div style={{
              padding: "0.5rem 0.75rem", borderRadius: 8, marginBottom: "1rem",
              background: "rgba(180,50,50,0.1)", color: "#B43232",
              fontSize: "0.78rem", fontWeight: 700, textAlign: "center",
            }}>{err}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "0.65rem", borderRadius: 10, border: "none",
            background: loading ? "rgba(201,162,75,0.4)" : G,
            color: "#2C1E15", fontWeight: 900, fontSize: "0.92rem",
            fontFamily: "Tajawal, Cairo, sans-serif", cursor: loading ? "wait" : "pointer",
            boxShadow: loading ? "none" : "0 4px 16px rgba(201,162,75,0.35)",
            transition: "all 0.2s",
          }}>
            {loading ? "جارٍ التحقق..." : "دخول"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [pageBg,    setPageBg]    = useState(DEFAULT_COLORS.pageBg);
  const [footerBg,  setFooterBg]  = useState(DEFAULT_COLORS.footerBg);
  const [authState, setAuthState] = useState<"checking" | "ok" | "login">("checking");
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/me", { credentials: "include" });
      if (r.ok) {
        const d = await r.json();
        setAdminInfo(d.admin ?? null);
        setAuthState("ok");
      } else {
        setAuthState("login");
      }
    } catch {
      setAuthState("login");
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setAdminInfo(null);
    setAuthState("login");
  }, []);

  useEffect(() => {
    checkAuth();
    syncFromSupabase();
    const refresh = () => {
      const c = siteStore.getColors();
      setPageBg(c.pageBg);
      setFooterBg(c.footerBg);
    };
    refresh();
    window.addEventListener("siteStore:saved", refresh);
    return () => window.removeEventListener("siteStore:saved", refresh);
  }, [checkAuth]);

  if (authState === "checking") {
    return (
      <div style={{
        minHeight: "100vh", background: "#FDFBF7",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Tajawal, Cairo, sans-serif", color: GOLD, fontSize: "0.85rem",
      }}>
        جارٍ التحقق...
      </div>
    );
  }

  if (authState === "login") {
    return <AdminLoginForm onSuccess={(info) => { setAdminInfo(info); setAuthState("ok"); }} />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#FDFBF7", color: "#2C1E15", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl" }}>
      <AdminSidebar adminInfo={adminInfo} onLogout={handleLogout} />
      <div style={{ flex: 1, marginRight: 240, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <main style={{ flex: 1, background: pageBg }}>
          {children}
        </main>
        <div style={{
          height: 44, background: footerBg,
          borderTop: "1px solid rgba(201,162,75,0.12)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingInline: "1.75rem", flexShrink: 0,
        }}>
          <span style={{ fontSize: "0.65rem", color: "rgba(201,162,75,0.5)", fontWeight: 700, letterSpacing: "0.08em" }}>
            لوحة تحكم إعلاني
          </span>
          <span style={{ fontSize: "0.58rem", color: "rgba(201,162,75,0.3)", fontFamily: "monospace", direction: "ltr" }}>
            footer: {footerBg} &nbsp;|&nbsp; page: {pageBg}
          </span>
        </div>
      </div>
    </div>
  );
}
