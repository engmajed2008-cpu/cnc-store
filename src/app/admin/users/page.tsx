"use client";
import { useState, useEffect, useMemo } from "react";
import { AdminSidebar } from "@/app/admin/AdminSidebar";
import { Search, Users, UserCheck, UserX, RefreshCw, Shield, Mail, Chrome } from "lucide-react";

const G = "linear-gradient(135deg,#C9A24B,#EBCB7C)";

type User = {
  id: string; email: string; name: string; avatar: string | null;
  provider: string; createdAt: string; lastSignIn: string | null;
  confirmed: boolean; banned: boolean;
};

function ProviderBadge({ provider }: { provider: string }) {
  const isGoogle = provider === "google";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      padding: "0.2rem 0.65rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 600,
      background: isGoogle ? "rgba(234,67,53,0.12)" : "rgba(201,162,75,0.1)",
      border: "1px solid " + (isGoogle ? "rgba(234,67,53,0.25)" : "rgba(201,162,75,0.2)"),
      color: isGoogle ? "#ea4335" : "#C9A24B",
    }}>
      {isGoogle ? <Chrome size={10} /> : <Mail size={10} />}
      {isGoogle ? "Google" : "Email"}
    </span>
  );
}

function Avatar({ user }: { user: User }) {
  const initials = (user.name || user.email).slice(0, 2).toUpperCase();
  if (user.avatar) {
    return <img src={user.avatar} alt={user.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(201,162,75,0.2)" }} />;
  }
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%", background: G,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "0.75rem", fontWeight: 800, color: "#2C1E15", flexShrink: 0,
    }}>{initials}</div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div style={{
      background: "#F2E8D0", borderRadius: 14, padding: "1.25rem 1.5rem",
      border: "1px solid rgba(154,106,42,0.25)",
      display: "flex", alignItems: "center", gap: "1rem",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: color + "18", border: "1px solid " + color + "30",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#2C1E15", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: "0.75rem", color: "#5A3E28", marginTop: "0.25rem" }}>{label}</div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<"all" | "google" | "email" | "banned">("all");
  const [togglingId, setToggling] = useState<string | null>(null);

  const [needLogin, setNeedLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 401) {
        setNeedLogin(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUsers(data.users ?? []);
      setNeedLogin(false);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

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
    fetchUsers();
  };

  async function toggleBan(user: User) {
    setToggling(user.id);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, banned: !user.banned }),
    });
    if (res.status === 401) {
      setNeedLogin(true);
      setToggling(null);
      return;
    }
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, banned: !u.banned } : u));
    setToggling(null);
  }

  const loginInputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "0.65rem 1rem", borderRadius: 10,
    border: "1.5px solid rgba(154,106,42,0.25)", background: "#F2E8D0",
    color: "#2C1E15", fontSize: "0.88rem", outline: "none", fontFamily: "Tajawal, Cairo, sans-serif",
  };

  const filtered = useMemo(() => {
    let list = users;
    if (filter === "google")  list = list.filter((u) => u.provider === "google");
    if (filter === "email")   list = list.filter((u) => u.provider === "email");
    if (filter === "banned")  list = list.filter((u) => u.banned);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) => u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q));
    }
    return list;
  }, [users, filter, search]);

  const stats = useMemo(() => ({
    total:   users.length,
    google:  users.filter((u) => u.provider === "google").length,
    email:   users.filter((u) => u.provider === "email").length,
    banned:  users.filter((u) => u.banned).length,
  }), [users]);

  function fmt(date: string | null) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#FDFBF7", fontFamily: "Tajawal, Cairo, sans-serif", display: "flex" }}>
      <AdminSidebar />
      <main style={{ flex: 1, marginLeft: 0, marginRight: 240, padding: "2.5rem" }}>

        {needLogin ? (
          <div style={{ maxWidth: 380, background: "#F2E8D0", border: "1px solid rgba(154,106,42,0.25)", borderRadius: 14, padding: "1.75rem", display: "grid", gap: "0.9rem" }}>
            <div style={{ fontWeight: 800, color: "#2C1E15" }}>دخول المشرف</div>
            <input style={loginInputStyle} placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            <input style={loginInputStyle} placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} type="password"
              onKeyDown={(e) => e.key === "Enter" && login()} />
            {loginError && <div style={{ color: "#f87171", fontSize: "0.8rem" }}>{loginError}</div>}
            <button onClick={login} style={{ background: G, color: "#2C1E15", fontWeight: 800, border: "none", borderRadius: 999, padding: "0.65rem", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>
              دخول
            </button>
          </div>
        ) : (
        <>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "0.7rem", color: "#C9A24B", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
            إدارة المستخدمين
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#2C1E15", margin: 0 }}>
              حسابات العملاء
            </h1>
            <button onClick={fetchUsers} disabled={loading} style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.6rem 1.2rem", borderRadius: 999,
              border: "1.5px solid rgba(201,162,75,0.3)", background: "transparent",
              color: "#C9A24B", fontSize: "0.82rem", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
            }}>
              <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              تحديث
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <StatCard icon={Users}     label="إجمالي العملاء"    value={stats.total}  color="#C9A24B" />
          <StatCard icon={Chrome}    label="دخلوا بـ Google"    value={stats.google} color="#ea4335" />
          <StatCard icon={Mail}      label="دخلوا بالبريد"      value={stats.email}  color="#4285f4" />
          <StatCard icon={Shield}    label="محظورون"            value={stats.banned} color="#ef4444" />
        </div>

        {/* Search + Filter */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search size={15} style={{ position: "absolute", top: "50%", right: "1rem", transform: "translateY(-50%)", color: "#555", pointerEvents: "none" }} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو البريد..."
              style={{
                width: "100%", padding: "0.7rem 2.5rem 0.7rem 1rem",
                borderRadius: 10, border: "1.5px solid rgba(154,106,42,0.25)",
                background: "#F2E8D0", color: "#2C1E15",
                fontSize: "0.85rem", outline: "none", fontFamily: "Tajawal, Cairo, sans-serif",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(201,162,75,0.5)")}
              onBlur={(e)  => (e.target.style.borderColor = "rgba(201,162,75,0.15)")}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["all","google","email","banned"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "0.6rem 1.1rem", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600,
                border: "1.5px solid " + (filter === f ? "rgba(201,162,75,0.5)" : "rgba(201,162,75,0.15)"),
                background: filter === f ? "rgba(201,162,75,0.12)" : "transparent",
                color: filter === f ? "#C9A24B" : "#666",
                cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
              }}>
                {f === "all" ? "الكل" : f === "google" ? "Google" : f === "email" ? "بريد" : "محظور"}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "#F2E8D0", borderRadius: 16, border: "1px solid rgba(154,106,42,0.25)", overflow: "hidden" }}>
          {/* Table header */}
          <div style={{
            display: "grid", gridTemplateColumns: "2.5fr 1.5fr 1fr 1fr 1fr 80px",
            padding: "0.85rem 1.5rem",
            borderBottom: "1px solid rgba(154,106,42,0.2)",
            fontSize: "0.72rem", color: "#5A3E28", fontWeight: 700, letterSpacing: "0.1em",
          }}>
            <span>العميل</span>
            <span>طريقة التسجيل</span>
            <span>تاريخ الانضمام</span>
            <span>آخر دخول</span>
            <span>الحالة</span>
            <span></span>
          </div>

          {loading ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "#555" }}>
              <div style={{ width: 32, height: 32, border: "3px solid rgba(201,162,75,0.2)", borderTopColor: "#C9A24B", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
              جارٍ التحميل...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "#555", fontSize: "0.9rem" }}>
              لا توجد نتائج
            </div>
          ) : (
            filtered.map((user, i) => (
              <div key={user.id} style={{
                display: "grid", gridTemplateColumns: "2.5fr 1.5fr 1fr 1fr 1fr 80px",
                padding: "1rem 1.5rem", alignItems: "center",
                borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                background: user.banned ? "rgba(239,68,68,0.03)" : "transparent",
                transition: "background 0.2s",
              }}
                onMouseEnter={(e) => { if (!user.banned) (e.currentTarget as HTMLElement).style.background = "rgba(201,162,75,0.03)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = user.banned ? "rgba(239,68,68,0.03)" : "transparent"; }}
              >
                {/* User info */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Avatar user={user} />
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: user.banned ? "#888" : "#2C1E15" }}>
                      {user.name || "—"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#666" }} dir="ltr">{user.email}</div>
                  </div>
                </div>

                {/* Provider */}
                <div><ProviderBadge provider={user.provider} /></div>

                {/* Joined */}
                <div style={{ fontSize: "0.78rem", color: "#888" }}>{fmt(user.createdAt)}</div>

                {/* Last sign in */}
                <div style={{ fontSize: "0.78rem", color: "#888" }}>{fmt(user.lastSignIn)}</div>

                {/* Status */}
                <div>
                  {user.banned ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.65rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 600, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
                      <UserX size={10} /> محظور
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.65rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 600, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }}>
                      <UserCheck size={10} /> نشط
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div>
                  <button
                    onClick={() => toggleBan(user)}
                    disabled={togglingId === user.id}
                    title={user.banned ? "رفع الحظر" : "حظر المستخدم"}
                    style={{
                      padding: "0.4rem 0.8rem", borderRadius: 8, fontSize: "0.72rem", fontWeight: 600,
                      border: "1px solid " + (user.banned ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"),
                      background: user.banned ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                      color: user.banned ? "#4ade80" : "#f87171",
                      cursor: togglingId === user.id ? "not-allowed" : "pointer",
                      fontFamily: "Tajawal, Cairo, sans-serif", opacity: togglingId === user.id ? 0.5 : 1,
                    }}
                  >
                    {user.banned ? "رفع الحظر" : "حظر"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer count */}
        {!loading && (
          <div style={{ marginTop: "1rem", textAlign: "left", fontSize: "0.75rem", color: "#555" }}>
            {filtered.length} من {users.length} عميل
          </div>
        )}

        </>
        )}
      </main>
      <style dangerouslySetInnerHTML={{ __html: "@keyframes spin { to { transform: rotate(360deg); } }" }} />
    </div>
  );
}
