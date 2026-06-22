"use client";
import { useState, useEffect } from "react";

const G  = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

type Section = "profile" | "password" | "forgot";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: "0.72rem", color: "#634E40", marginBottom: 5, fontWeight: 700 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} style={{
      width: "100%", padding: "0.55rem 0.85rem", borderRadius: 10, boxSizing: "border-box" as const,
      border: "1.5px solid rgba(201,162,75,0.3)", background: "#FDFBF7",
      fontFamily: "Tajawal, Cairo, sans-serif", fontSize: "0.85rem", color: "#2C1E15",
      outline: "none", ...props.style,
    }} />
  );
}

function Btn({ children, loading, danger, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; danger?: boolean }) {
  return (
    <button {...props} disabled={loading || props.disabled} style={{
      padding: "0.6rem 1.6rem", borderRadius: 10, border: "none",
      background: danger ? "rgba(180,50,50,0.1)" : loading ? "rgba(201,162,75,0.4)" : G,
      color: danger ? "#B43232" : "#2C1E15",
      fontWeight: 800, fontSize: "0.88rem",
      fontFamily: "Tajawal, Cairo, sans-serif",
      cursor: loading ? "wait" : "pointer",
      boxShadow: loading || danger ? "none" : "0 4px 14px rgba(201,162,75,0.3)",
      transition: "all 0.2s",
      ...props.style,
    }}>
      {loading ? "جارٍ..." : children}
    </button>
  );
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{
      padding: "0.55rem 0.9rem", borderRadius: 9, marginBottom: "1rem",
      background: ok ? "rgba(30,130,70,0.12)" : "rgba(180,50,50,0.1)",
      color: ok ? "#1A7A42" : "#B43232",
      fontSize: "0.8rem", fontWeight: 700, border: ok ? "1px solid rgba(30,130,70,0.2)" : "1px solid rgba(180,50,50,0.2)",
    }}>{msg}</div>
  );
}

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "#F4EFE6", borderRadius: 16,
      border: "1px solid rgba(201,162,75,0.18)",
      padding: "1.75rem", marginBottom: "1.5rem",
      boxShadow: "0 2px 12px rgba(44,30,21,0.06)",
    }}>
      <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.05rem", fontWeight: 900, color: "#2C1E15" }}>{title}</h2>
      {desc && <p style={{ margin: "0 0 1.25rem", fontSize: "0.78rem", color: "#634E40" }}>{desc}</p>}
      <div style={{ marginTop: desc ? 0 : "1rem" }}>{children}</div>
    </div>
  );
}

/* ─── Profile section ─────────────────────────────────────────────── */
function ProfileSection() {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [role,    setRole]    = useState("");
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/admin/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (d.admin) { setName(d.admin.name ?? ""); setEmail(d.admin.email ?? ""); setRole(d.admin.role ?? ""); }
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setToast(null);
    const r = await fetch("/api/admin/update-profile", {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const d = await r.json();
    setToast({ msg: r.ok ? "تم حفظ البيانات بنجاح ✓" : d.error ?? "حدث خطأ", ok: r.ok });
    setSaving(false);
  };

  if (loading) return <p style={{ color: "#9A8070", fontSize: "0.82rem" }}>جارٍ التحميل...</p>;

  return (
    <>
      {toast && <Toast {...toast} />}
      <Field label="الاسم الكامل">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="اسمك" />
      </Field>
      <Field label="البريد الإلكتروني">
        <Input value={email} readOnly dir="ltr" style={{ background: "#F0EBE1", color: "#9A8070", cursor: "not-allowed" }} />
        <div style={{ fontSize: "0.68rem", color: "#9A8070", marginTop: 4 }}>
          لا يمكن تغيير البريد بعد الإنشاء
        </div>
      </Field>
      <Field label="الصلاحية">
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 12px", borderRadius: 999,
          background: "rgba(201,162,75,0.12)", color: "#9A6A2A",
          fontSize: "0.75rem", fontWeight: 800,
          border: "1px solid rgba(201,162,75,0.25)",
        }}>
          {role === "super_admin" ? "⭐ مدير رئيسي" : role}
        </div>
      </Field>
      <Btn loading={saving} onClick={save}>حفظ البيانات</Btn>
    </>
  );
}

/* ─── Change password section ─────────────────────────────────────── */
function ChangePasswordSection() {
  const [cur,     setCur]     = useState("");
  const [next,    setNext]    = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null);
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) { setToast({ msg: "كلمة المرور الجديدة وتأكيدها غير متطابقتين", ok: false }); return; }
    if (next.length < 8)  { setToast({ msg: "كلمة المرور لا تقل عن 8 أحرف", ok: false }); return; }
    setLoading(true); setToast(null);
    const r = await fetch("/api/admin/change-password", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: cur, newPassword: next }),
    });
    const d = await r.json();
    if (r.ok) { setCur(""); setNext(""); setConfirm(""); }
    setToast({ msg: r.ok ? "تم تغيير كلمة المرور بنجاح ✓" : d.error ?? "حدث خطأ", ok: r.ok });
    setLoading(false);
  };

  const PwField = ({ label, val, setVal, show, setShow }: {
    label: string; val: string; setVal: (v: string) => void; show: boolean; setShow: (v: boolean) => void;
  }) => (
    <Field label={label}>
      <div style={{ position: "relative" }}>
        <Input type={show ? "text" : "password"} value={val} onChange={e => setVal(e.target.value)}
          dir="ltr" placeholder="••••••••" required
          style={{ paddingLeft: "2.8rem" }} />
        <button type="button" onClick={() => setShow(!show)} style={{
          position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer", color: "#9A8070", fontSize: "0.72rem",
        }}>{show ? "إخفاء" : "عرض"}</button>
      </div>
    </Field>
  );

  return (
    <form onSubmit={submit}>
      {toast && <Toast {...toast} />}
      <PwField label="كلمة المرور الحالية" val={cur} setVal={setCur} show={showCur} setShow={setShowCur} />
      <PwField label="كلمة المرور الجديدة (8 أحرف على الأقل)" val={next} setVal={setNext} show={showNew} setShow={setShowNew} />
      <Field label="تأكيد كلمة المرور الجديدة">
        <Input type={showNew ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)}
          dir="ltr" placeholder="••••••••" required />
      </Field>
      <Btn loading={loading} type="submit">تغيير كلمة المرور</Btn>
    </form>
  );
}

/* ─── Forgot password section ─────────────────────────────────────── */
function ForgotPasswordSection() {
  const [step,    setStep]    = useState<"email" | "otp" | "done">("email");
  const [email,   setEmail]   = useState("");
  const [code,    setCode]    = useState("");
  const [pw,      setPw]      = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null);
  const [devCode, setDevCode] = useState("");

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setToast(null);
    const r = await fetch("/api/admin/forgot-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const d = await r.json();
    if (r.ok) {
      if (d.devCode) setDevCode(d.devCode);
      setStep("otp");
      setToast({ msg: `تم إرسال رمز التحقق إلى ${email} — صالح ${d.ttlMinutes ?? 10} دقائق`, ok: true });
    } else {
      setToast({ msg: d.error ?? "حدث خطأ", ok: false });
    }
    setLoading(false);
  };

  const resetPw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== confirm) { setToast({ msg: "كلمتا المرور غير متطابقتين", ok: false }); return; }
    if (pw.length < 8)  { setToast({ msg: "كلمة المرور لا تقل عن 8 أحرف", ok: false }); return; }
    setLoading(true); setToast(null);
    const r = await fetch("/api/admin/reset-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword: pw }),
    });
    const d = await r.json();
    if (r.ok) { setStep("done"); setToast({ msg: "تم إعادة تعيين كلمة المرور — يمكنك تسجيل الدخول الآن ✓", ok: true }); }
    else { setToast({ msg: d.error ?? "حدث خطأ", ok: false }); }
    setLoading(false);
  };

  if (step === "done") return (
    <>
      {toast && <Toast {...toast} />}
      <p style={{ fontSize: "0.82rem", color: "#634E40" }}>تم إعادة تعيين كلمة المرور بنجاح.</p>
    </>
  );

  return (
    <>
      {toast && <Toast {...toast} />}
      {devCode && (
        <div style={{
          padding: "0.55rem 0.9rem", borderRadius: 9, marginBottom: "1rem",
          background: "rgba(201,162,75,0.12)", color: "#7A4A00",
          fontSize: "0.78rem", fontWeight: 700, fontFamily: "monospace",
          border: "1px solid rgba(201,162,75,0.25)",
        }}>
          🧪 بيئة تطوير — الرمز: <strong>{devCode}</strong>
        </div>
      )}

      {step === "email" && (
        <form onSubmit={sendOtp}>
          <Field label="البريد الإلكتروني للحساب">
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
              dir="ltr" placeholder="admin@e3lani.com" required />
          </Field>
          <Btn loading={loading} type="submit">إرسال رمز التحقق</Btn>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={resetPw}>
          <Field label="رمز التحقق (6 أرقام)">
            <Input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              dir="ltr" placeholder="123456" maxLength={6}
              style={{ letterSpacing: "0.4em", fontSize: "1.1rem", textAlign: "center" }} />
          </Field>
          <Field label="كلمة المرور الجديدة">
            <Input type="password" value={pw} onChange={e => setPw(e.target.value)} dir="ltr" placeholder="••••••••" required />
          </Field>
          <Field label="تأكيد كلمة المرور">
            <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} dir="ltr" placeholder="••••••••" required />
          </Field>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Btn loading={loading} type="submit">تعيين كلمة المرور</Btn>
            <Btn danger type="button" onClick={() => { setStep("email"); setToast(null); setDevCode(""); }}>
              تغيير البريد
            </Btn>
          </div>
        </form>
      )}
    </>
  );
}

/* ─── Main page ───────────────────────────────────────────────────── */
export default function AdminProfilePage() {
  const tabs: { id: Section; label: string; icon: string }[] = [
    { id: "profile",  label: "بيانات الحساب",     icon: "👤" },
    { id: "password", label: "تغيير كلمة المرور", icon: "🔑" },
    { id: "forgot",   label: "نسيت كلمة المرور",  icon: "🔐" },
  ];
  const [tab, setTab] = useState<Section>("profile");

  return (
    <div style={{ padding: "2.5rem", fontFamily: "Tajawal, Cairo, sans-serif", maxWidth: 600 }}>

      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ color: "#C9A24B", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
          لوحة التحكم / إعدادات الحساب
        </div>
        <h1 style={{ fontSize: "1.9rem", fontWeight: 900, margin: 0, ...GT }}>إعدادات الحساب ⚙️</h1>
        <p style={{ color: "#5A4A3A", marginTop: "0.35rem", fontSize: "0.88rem" }}>
          إدارة بياناتك الشخصية وأمان حسابك
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "0.5rem 1.1rem", borderRadius: 10, border: "none",
            background: tab === t.id ? G : "rgba(201,162,75,0.1)",
            color: tab === t.id ? "#2C1E15" : "#9A6A2A",
            fontWeight: 800, fontSize: "0.82rem",
            fontFamily: "Tajawal, Cairo, sans-serif", cursor: "pointer",
            boxShadow: tab === t.id ? "0 3px 10px rgba(201,162,75,0.3)" : "none",
            transition: "all 0.18s",
          }}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "profile" && (
        <Card title="بيانات الحساب" desc="عدّل اسمك المعروض في لوحة التحكم">
          <ProfileSection />
        </Card>
      )}
      {tab === "password" && (
        <Card title="تغيير كلمة المرور" desc="يُنصح بكلمة مرور قوية تحتوي حروفاً وأرقاماً ورموزاً">
          <ChangePasswordSection />
        </Card>
      )}
      {tab === "forgot" && (
        <Card title="استعادة كلمة المرور" desc="سنرسل رمز تحقق إلى بريدك الإلكتروني لإعادة تعيين كلمة المرور">
          <ForgotPasswordSection />
        </Card>
      )}
    </div>
  );
}
