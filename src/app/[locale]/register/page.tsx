"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Eye, EyeOff, UserPlus, Check, X, Phone, Mail, User, Lock } from "lucide-react";
import { GoogleButton } from "@/components/auth/GoogleButton";
import BrandMark from "@/components/brand/BrandMark";

const G  = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

function StrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
  const labels = { ar: ["ضعيفة جداً", "ضعيفة", "متوسطة", "قوية"], en: ["Very weak", "Weak", "Fair", "Strong"] };
  if (!password) return null;
  return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.35rem" }}>
        {[0,1,2,3].map((i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 999,
            background: i < score ? colors[score - 1] : "rgba(255,255,255,0.08)",
            transition: "background 0.3s",
          }} />
        ))}
      </div>
    </div>
  );
}

function PasswordRules({ password, ar }: { password: string; ar: boolean }) {
  const rules = ar
    ? [
        { label: "8 أحرف على الأقل",       ok: password.length >= 8 },
        { label: "حرف كبير (A-Z)",           ok: /[A-Z]/.test(password) },
        { label: "رقم واحد على الأقل",       ok: /[0-9]/.test(password) },
        { label: "رمز خاص (!@#...)",         ok: /[^A-Za-z0-9]/.test(password) },
      ]
    : [
        { label: "At least 8 characters",   ok: password.length >= 8 },
        { label: "One uppercase letter",     ok: /[A-Z]/.test(password) },
        { label: "One number",               ok: /[0-9]/.test(password) },
        { label: "One special character",    ok: /[^A-Za-z0-9]/.test(password) },
      ];
  if (!password) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.3rem 0.75rem", marginTop: "0.5rem" }}>
      {rules.map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.73rem",
          color: r.ok ? "#22c55e" : "#909090" }}>
          {r.ok ? <Check size={11} /> : <X size={11} />}
          {r.label}
        </div>
      ))}
    </div>
  );
}

function InputField({
  id, label, type = "text", value, onChange, placeholder, dir, icon: Icon,
  error, success, suffix, autoComplete,
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; dir?: string;
  icon: React.ElementType; error?: string; success?: boolean;
  suffix?: React.ReactNode; autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? "rgba(239,68,68,0.6)"
    : success
    ? "rgba(34,197,94,0.5)"
    : focused
    ? "rgba(201,162,75,0.6)"
    : "rgba(201,162,75,0.18)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label htmlFor={id} style={{ fontSize: "0.82rem", fontWeight: 600, color: "#C9A24B" }}>{label}</label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <div style={{
          position: "absolute", insetInlineStart: "0.9rem", color: error ? "#ef4444" : focused ? "#C9A24B" : "#555",
          display: "flex", alignItems: "center", pointerEvents: "none", transition: "color 0.2s",
        }}>
          <Icon size={15} />
        </div>
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          dir={dir}
          style={{
            width: "100%", padding: "0.75rem 1rem",
            paddingInlineStart: "2.5rem",
            paddingInlineEnd: suffix ? "3rem" : "1rem",
            borderRadius: 10, border: "1.5px solid " + borderColor,
            background: "rgba(255,255,255,0.04)", color: "#2C1E15",
            fontSize: "0.9rem", outline: "none", fontFamily: "Tajawal, Cairo, sans-serif",
            transition: "border-color 0.2s", boxSizing: "border-box",
          }}
        />
        {suffix && (
          <div style={{ position: "absolute", insetInlineEnd: "0.85rem", display: "flex", alignItems: "center" }}>
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <span style={{ fontSize: "0.73rem", color: "#f87171", display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <X size={11} />{error}
        </span>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const locale = useLocale();
  const ar = locale === "ar";

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    phone: "", password: "", confirmPassword: "",
  });
  const [showPw, setShowPw]         = useState(false);
  const [showCpw, setShowCpw]       = useState(false);
  const [agreed, setAgreed]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [errors, setErrors]         = useState<Record<string,string>>({});

  const set = useCallback((k: string) => (v: string) =>
    setForm((p) => ({ ...p, [k]: v })), []);

  function validate() {
    const e: Record<string,string> = {};
    if (!form.firstName.trim())
      e.firstName = ar ? "الاسم الأول مطلوب" : "First name is required";
    if (!form.lastName.trim())
      e.lastName = ar ? "اسم العائلة مطلوب" : "Last name is required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = ar ? "بريد إلكتروني غير صحيح" : "Invalid email address";
    if (!form.phone.trim() || form.phone.replace(/\D/g,"").length < 9)
      e.phone = ar ? "رقم الجوال غير صحيح" : "Invalid phone number";
    if (form.password.length < 8)
      e.password = ar ? "كلمة المرور قصيرة جداً" : "Password too short";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = ar ? "كلمتا المرور غير متطابقتين" : "Passwords do not match";
    if (!agreed)
      e.agreed = ar ? "يجب الموافقة على الشروط" : "You must accept the terms";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
  }

  // ── Success screen ─────────────────────────────────────────────
  if (submitted) {
    return (
      <div dir={ar ? "rtl" : "ltr"} style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "transparent", fontFamily: "Tajawal, Cairo, sans-serif", padding: "2rem",
      }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%", margin: "0 auto 1.5rem",
            background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Check size={36} color="#22c55e" />
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#2C1E15", margin: "0 0 0.75rem 0" }}>
            {ar ? "تم إنشاء حسابك!" : "Account Created!"}
          </h1>
          <p style={{ color: "#909090", fontSize: "0.9rem", lineHeight: 1.8, margin: "0 0 2rem 0" }}>
            {ar
              ? "مرحباً " + form.firstName + "، تم تسجيل حسابك بنجاح. يمكنك الآن تسجيل الدخول."
              : "Welcome " + form.firstName + "! Your account has been created. You can now sign in."}
          </p>
          <Link href={"/" + locale + "/login"} style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.85rem 2.5rem", borderRadius: 999,
            background: G, color: "#2C1E15", fontWeight: 800,
            fontSize: "0.95rem", textDecoration: "none",
            boxShadow: "0 6px 24px rgba(201,162,75,0.3)",
          }}>
            {ar ? "تسجيل الدخول" : "Sign In"}
          </Link>
        </div>
      </div>
    );
  }

  const pwMatch = Boolean(form.confirmPassword) && form.password === form.confirmPassword;

  // ── Main form ──────────────────────────────────────────────────
  return (
    <div dir={ar ? "rtl" : "ltr"} style={{
      minHeight: "100vh", display: "flex",
      fontFamily: "Tajawal, Cairo, sans-serif", background: "transparent",
    }}>

      {/* Form panel */}
      <div style={{
        flex: "0 0 100%", maxWidth: 520,
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "3rem 2.5rem", background: "#FDFBF7", position: "relative", zIndex: 1,
        overflowY: "auto",
      }}>

        {/* Logo */}
        <div style={{ marginBottom: "2rem" }}>
          <Link href={"/" + locale} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.75rem" }}>
            <BrandMark size={42} />
            <span style={{ fontSize: ar ? "1rem" : "1.15rem", fontWeight: 900, ...GT }}>
              {ar ? "سوق الدعاية والإعلان" : "ADSOUQ"}
            </span>
          </Link>
          <div style={{ marginTop: "1.75rem" }}>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#2C1E15", margin: "0 0 0.35rem 0" }}>
              {ar ? "إنشاء حساب جديد" : "Create Account"}
            </h1>
            <p style={{ color: "#909090", fontSize: "0.85rem", margin: 0 }}>
              {ar ? "أنشئ حسابك وابدأ تجربة التسوق معنا" : "Join us and start your shopping experience"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Name row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <InputField
              id="firstName" label={ar ? "الاسم الأول" : "First Name"}
              value={form.firstName} onChange={set("firstName")}
              placeholder={ar ? "محمد" : "John"}
              icon={User} error={errors.firstName}
              success={!!form.firstName && !errors.firstName}
              autoComplete="given-name"
            />
            <InputField
              id="lastName" label={ar ? "اسم العائلة" : "Last Name"}
              value={form.lastName} onChange={set("lastName")}
              placeholder={ar ? "العلي" : "Smith"}
              icon={User} error={errors.lastName}
              success={!!form.lastName && !errors.lastName}
              autoComplete="family-name"
            />
          </div>

          {/* Email */}
          <InputField
            id="email" label={ar ? "البريد الإلكتروني" : "Email Address"}
            type="email" value={form.email} onChange={set("email")}
            placeholder="example@domain.com" dir="ltr"
            icon={Mail} error={errors.email}
            success={!!form.email && !errors.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)}
            autoComplete="email"
          />

          {/* Phone */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label htmlFor="phone" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#C9A24B" }}>
              {ar ? "رقم الجوال" : "Phone Number"}
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0 0.85rem", borderRadius: 10,
                border: "1.5px solid rgba(201,162,75,0.18)",
                background: "rgba(255,255,255,0.04)",
                color: "#C9A24B", fontSize: "0.85rem", fontWeight: 600, flexShrink: 0,
                whiteSpace: "nowrap",
              }}>
                <span>🇸🇦</span>
                <span dir="ltr">+966</span>
              </div>
              <div style={{ position: "relative", flex: 1 }}>
                <div style={{
                  position: "absolute", insetInlineStart: "0.9rem", top: "50%",
                  transform: "translateY(-50%)", color: errors.phone ? "#ef4444" : "#555",
                  display: "flex", alignItems: "center", pointerEvents: "none",
                }}>
                  <Phone size={15} />
                </div>
                <input
                  id="phone" type="tel" autoComplete="tel"
                  value={form.phone} onChange={(e) => set("phone")(e.target.value)}
                  placeholder={ar ? "5XXXXXXXX" : "5XXXXXXXX"}
                  dir="ltr"
                  style={{
                    width: "100%", padding: "0.75rem 1rem",
                    paddingInlineStart: "2.5rem",
                    borderRadius: 10,
                    border: "1.5px solid " + (errors.phone ? "rgba(239,68,68,0.6)" : "rgba(201,162,75,0.18)"),
                    background: "rgba(255,255,255,0.04)", color: "#2C1E15",
                    fontSize: "0.9rem", outline: "none", fontFamily: "Tajawal, Cairo, sans-serif",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(201,162,75,0.6)")}
                  onBlur={(e)  => (e.target.style.borderColor = errors.phone ? "rgba(239,68,68,0.6)" : "rgba(201,162,75,0.18)")}
                />
              </div>
            </div>
            {errors.phone && (
              <span style={{ fontSize: "0.73rem", color: "#f87171", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <X size={11} />{errors.phone}
              </span>
            )}
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <InputField
              id="password" label={ar ? "كلمة المرور" : "Password"}
              type={showPw ? "text" : "password"}
              value={form.password} onChange={set("password")}
              placeholder="••••••••"
              icon={Lock} error={errors.password}
              autoComplete="new-password"
              suffix={
                <button type="button" onClick={() => setShowPw(!showPw)}
                  aria-label={ar ? "تبديل إظهار كلمة المرور" : "Toggle password visibility"}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#909090", display: "flex", padding: 0 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
            <StrengthBar password={form.password} />
            <PasswordRules password={form.password} ar={ar} />
          </div>

          {/* Confirm Password */}
          <InputField
            id="confirmPassword" label={ar ? "تأكيد كلمة المرور" : "Confirm Password"}
            type={showCpw ? "text" : "password"}
            value={form.confirmPassword} onChange={set("confirmPassword")}
            placeholder="••••••••"
            icon={Lock} error={errors.confirmPassword}
            success={pwMatch}
            autoComplete="new-password"
            suffix={
              <button type="button" onClick={() => setShowCpw(!showCpw)}
                aria-label={ar ? "تبديل إظهار كلمة المرور" : "Toggle password visibility"}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#909090", display: "flex", padding: 0 }}>
                {showCpw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          {/* Terms */}
          <div>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer" }}>
              <input
                type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                style={{ accentColor: "#C9A24B", width: 15, height: 15, marginTop: 3, flexShrink: 0, cursor: "pointer" }}
              />
              <span style={{ fontSize: "0.8rem", color: "#909090", lineHeight: 1.6 }}>
                {ar ? "أوافق على " : "I agree to the "}
                <Link href={"/" + locale + "/terms"} style={{ color: "#C9A24B", textDecoration: "none" }}>
                  {ar ? "الشروط والأحكام" : "Terms of Service"}
                </Link>
                {ar ? " و" : " and "}
                <Link href={"/" + locale + "/privacy"} style={{ color: "#C9A24B", textDecoration: "none" }}>
                  {ar ? "سياسة الخصوصية" : "Privacy Policy"}
                </Link>
              </span>
            </label>
            {errors.agreed && (
              <span style={{ fontSize: "0.73rem", color: "#f87171", display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.3rem" }}>
                <X size={11} />{errors.agreed}
              </span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit" disabled={loading}
            className={loading ? "" : "btn-shine btn-shine-gold"}
            style={{
              marginTop: "0.5rem", padding: "0.9rem", borderRadius: 999,
              background: loading ? "rgba(201,162,75,0.4)" : G,
              border: "none", cursor: loading ? "not-allowed" : "pointer",
              color: "#2C1E15", fontWeight: 800, fontSize: "0.95rem",
              fontFamily: "Tajawal, Cairo, sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              boxShadow: loading ? "none" : "0 6px 24px rgba(201,162,75,0.3)",
              transition: "all 0.2s",
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{
                  width: 16, height: 16, border: "2.5px solid #F4EFE6",
                  borderTopColor: "transparent", borderRadius: "50%",
                  display: "inline-block", animation: "spin 0.7s linear infinite",
                }} />
                {ar ? "جارٍ إنشاء الحساب..." : "Creating account..."}
              </span>
            ) : (
              <>
                <UserPlus size={17} />
                {ar ? "إنشاء الحساب" : "Create Account"}
              </>
            )}
          </button>
        </form>

        {/* Google */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1rem 0 0.75rem" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(201,162,75,0.1)" }} />
          <span style={{ color: "#555", fontSize: "0.75rem" }}>{ar ? "أو سجّل بـ" : "or sign up with"}</span>
          <div style={{ flex: 1, height: 1, background: "rgba(201,162,75,0.1)" }} />
        </div>
        <GoogleButton locale={locale} mode="register" />

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1.25rem 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(201,162,75,0.12)" }} />
          <span style={{ color: "#555", fontSize: "0.78rem" }}>{ar ? "لديك حساب؟" : "Have an account?"}</span>
          <div style={{ flex: 1, height: 1, background: "rgba(201,162,75,0.12)" }} />
        </div>

        <Link href={"/" + locale + "/login"} style={{
          padding: "0.8rem", borderRadius: 999, textDecoration: "none",
          border: "1.5px solid rgba(201,162,75,0.3)", color: "#C9A24B",
          fontWeight: 700, fontSize: "0.88rem", fontFamily: "Tajawal, Cairo, sans-serif",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
        }}>
          {ar ? "تسجيل الدخول" : "Sign In"}
        </Link>

        <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.78rem" }}>
          <Link href={"/" + locale} style={{ color: "#555", textDecoration: "none" }}>
            {ar ? "العودة إلى الموقع" : "Back to site"}
          </Link>
        </p>

        <style dangerouslySetInnerHTML={{ __html: "@keyframes spin { to { transform: rotate(360deg); } }" }} />
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes waveMove    { 0% { transform:translateX(0);   } 100% { transform:translateX(-120px); } }
          @keyframes waveMove2   { 0% { transform:translateX(0);   } 100% { transform:translateX(120px);  } }
          @keyframes hexSpin     { from { transform:rotate(0deg);  } to   { transform:rotate(360deg);     } }
          @keyframes hexSpinRev  { from { transform:rotate(0deg);  } to   { transform:rotate(-360deg);    } }
          @keyframes particleFly { 0% { opacity:0; transform:translateY(0) scale(0.5); } 30%{ opacity:1; } 100% { opacity:0; transform:translateY(-80px) scale(1.2); } }
          @keyframes ripple      { 0%   { r:0;   opacity:0.7; } 100% { r:160; opacity:0; } }
          @keyframes stepIn      { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
          @keyframes glowPulse   { 0%,100% { stroke-opacity:0.5; } 50% { stroke-opacity:1; } }
          @keyframes countUp     { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
          @keyframes drawLine    { from { stroke-dashoffset: 400; } to { stroke-dashoffset: 0; } }
          @keyframes orbit       { from { transform: rotate(0deg)   translateX(110px) rotate(0deg);   }
                                   to   { transform: rotate(360deg) translateX(110px) rotate(-360deg); } }
          @keyframes orbitRev    { from { transform: rotate(0deg)   translateX(80px) rotate(0deg);   }
                                   to   { transform: rotate(-360deg) translateX(80px) rotate(360deg); } }

          .reg-wave1  { animation: waveMove  6s linear infinite; }
          .reg-wave2  { animation: waveMove2 5s linear infinite; }
          .reg-wave3  { animation: waveMove  8s linear infinite; }
          .reg-hex1   { transform-origin:280px 340px; animation: hexSpin    14s linear infinite; }
          .reg-hex2   { transform-origin:280px 340px; animation: hexSpinRev 10s linear infinite; }
          .reg-hex3   { transform-origin:280px 340px; animation: hexSpin    20s linear infinite; }
          .reg-ripple1{ transform-origin:280px 340px; animation: ripple 3.5s ease-out infinite; }
          .reg-ripple2{ transform-origin:280px 340px; animation: ripple 3.5s 1.2s ease-out infinite; }
          .reg-ripple3{ transform-origin:280px 340px; animation: ripple 3.5s 2.4s ease-out infinite; }
          .reg-step1  { animation: stepIn 0.6s 0.2s ease-out both; }
          .reg-step2  { animation: stepIn 0.6s 0.5s ease-out both; }
          .reg-step3  { animation: stepIn 0.6s 0.8s ease-out both; }
          .reg-orbit1 { transform-origin:280px 240px; animation: orbit    7s linear infinite; }
          .reg-orbit2 { transform-origin:280px 240px; animation: orbitRev 5s linear infinite; }
          .reg-title  { animation: countUp 0.8s 0.1s ease-out both; }
          .reg-glow   { animation: glowPulse 2.5s ease-in-out infinite; }
          .reg-line   { stroke-dasharray:400; animation: drawLine 2s ease-out both; }
          .p1 { animation: particleFly 2.5s 0.3s ease-out infinite; }
          .p2 { animation: particleFly 2.5s 0.9s ease-out infinite; }
          .p3 { animation: particleFly 2.5s 1.5s ease-out infinite; }
          .p4 { animation: particleFly 2.5s 2.1s ease-out infinite; }
        ` }} />
      </div>

      {/* Deco panel */}
      <div className="register-deco" style={{
        flex: 1, display: "none", position: "relative", overflow: "hidden", background: "#FDFBF7",
      }}>
        <svg width="100%" height="100%" viewBox="0 0 560 780" preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0 }}>

          {/* Wave layers */}
          <g opacity="0.07" className="reg-wave1">
            {[0,35,70,105,140,175,210,245,280,315,350,385,420,455,490,525,560,595,630,665,700,735,770].map((y,i) => (
              <path key={i} d={`M-120,${y} C-60,${y-18} 0,${y+18} 60,${y} S180,${y-18} 240,${y} S360,${y+18} 420,${y} S540,${y-18} 600,${y} S720,${y+18} 780,${y}`}
                fill="none" stroke="#C9A24B" strokeWidth="0.7"/>
            ))}
          </g>
          <g opacity="0.05" className="reg-wave2">
            {[18,53,88,123,158,193,228,263,298,333,368,403,438,473,508,543,578,613,648,683,718,753].map((y,i) => (
              <path key={i} d={`M-120,${y} C-40,${y+15} 40,${y-15} 120,${y} S280,${y+15} 360,${y} S480,${y-15} 560,${y} S680,${y+15} 760,${y}`}
                fill="none" stroke="#C9A24B" strokeWidth="0.5"/>
            ))}
          </g>

          {/* Ripple rings */}
          <circle className="reg-ripple1" cx="280" cy="240" r="0" fill="none" stroke="rgba(201,162,75,0.4)" strokeWidth="1"/>
          <circle className="reg-ripple2" cx="280" cy="240" r="0" fill="none" stroke="rgba(201,162,75,0.3)" strokeWidth="1"/>
          <circle className="reg-ripple3" cx="280" cy="240" r="0" fill="none" stroke="rgba(201,162,75,0.2)" strokeWidth="1"/>

          {/* Hexagon rings */}
          <g className="reg-hex3">
            <polygon points="280,100 370,152 370,258 280,310 190,258 190,152"
              fill="none" stroke="rgba(201,162,75,0.07)" strokeWidth="1"/>
          </g>
          <g className="reg-hex2">
            <polygon points="280,125 350,166 350,248 280,289 210,248 210,166"
              fill="none" stroke="rgba(201,162,75,0.12)" strokeWidth="1"/>
          </g>
          <g className="reg-hex1">
            <polygon points="280,152 335,183 335,245 280,276 225,245 225,183"
              fill="none" stroke="rgba(201,162,75,0.22)" strokeWidth="1.5"/>
          </g>

          {/* Orbiting dots */}
          <g className="reg-orbit1">
            <circle cx="280" cy="240" r="5" fill="#C9A24B" opacity="0.8"/>
          </g>
          <g className="reg-orbit2">
            <circle cx="280" cy="240" r="3.5" fill="#EBCB7C" opacity="0.6"/>
          </g>

          {/* Center core */}
          <circle cx="280" cy="240" r="22" fill="rgba(201,162,75,0.08)" stroke="rgba(201,162,75,0.3)" strokeWidth="1.5" className="reg-glow"/>
          <circle cx="280" cy="240" r="10" fill="rgba(201,162,75,0.15)" stroke="#C9A24B" strokeWidth="1"/>
          <circle cx="280" cy="240" r="4"  fill="#C9A24B"/>

          {/* Rising particles */}
          <circle className="p1" cx="240" cy="310" r="2.5" fill="#C9A24B" opacity="0"/>
          <circle className="p2" cx="300" cy="325" r="2"   fill="#EBCB7C" opacity="0"/>
          <circle className="p3" cx="260" cy="305" r="3"   fill="#C9A24B" opacity="0"/>
          <circle className="p4" cx="320" cy="318" r="2"   fill="#EBCB7C" opacity="0"/>

          {/* Brand */}
          <text className="reg-title" x="280" y="42" textAnchor="middle"
            fill="#C9A24B" fontFamily="Cairo,sans-serif" fontSize={ar ? "22" : "26"} fontWeight="900">
            {ar ? "سوق الدعاية والإعلان" : "ADSOUQ"}
          </text>
          <text x="280" y="62" textAnchor="middle" fill="#444"
            fontFamily="Cairo,sans-serif" fontSize="9" letterSpacing="4">
            ADSOUQ.SA
          </text>

          {/* Divider line */}
          <line className="reg-line" x1="160" y1="80" x2="400" y2="80"
            stroke="rgba(201,162,75,0.2)" strokeWidth="1"/>

          {/* 3-step journey */}
          <g className="reg-step1">
            <rect x="100" y="360" width="360" height="72" rx="12"
              fill="rgba(201,162,75,0.09)" stroke="rgba(201,162,75,0.3)" strokeWidth="1"/>
            <circle cx="280" cy="376" r="14" fill="rgba(201,162,75,0.9)"/>
            <text x="280" y="381" textAnchor="middle" fill="#F4EFE6"
              fontFamily="Cairo,sans-serif" fontSize="11" fontWeight="900">01</text>
            <text x="280" y="404" textAnchor="middle" fill="#2C1E15"
              fontFamily="Cairo,sans-serif" fontSize="14" fontWeight="700">
              {ar ? "أنشئ حسابك" : "Create Account"}
            </text>
            <text x="280" y="422" textAnchor="middle" fill="#666"
              fontFamily="Cairo,sans-serif" fontSize="11">
              {ar ? "أدخل بياناتك الأساسية" : "Enter your basic details"}
            </text>
          </g>

          {/* Connector */}
          <line x1="280" y1="434" x2="280" y2="448" stroke="rgba(201,162,75,0.25)" strokeWidth="1" strokeDasharray="4 3"/>

          <g className="reg-step2">
            <rect x="100" y="450" width="360" height="72" rx="12"
              fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
            <circle cx="280" cy="466" r="14" fill="rgba(201,162,75,0.12)" stroke="rgba(201,162,75,0.35)" strokeWidth="1"/>
            <text x="280" y="471" textAnchor="middle" fill="#C9A24B"
              fontFamily="Cairo,sans-serif" fontSize="11" fontWeight="900">02</text>
            <text x="280" y="494" textAnchor="middle" fill="#999"
              fontFamily="Cairo,sans-serif" fontSize="14" fontWeight="700">
              {ar ? "تصفّح المنتجات" : "Browse Products"}
            </text>
            <text x="280" y="512" textAnchor="middle" fill="#555"
              fontFamily="Cairo,sans-serif" fontSize="11">
              {ar ? "آلاف الخيارات بانتظارك" : "Thousands of options await"}
            </text>
          </g>

          {/* Connector */}
          <line x1="280" y1="524" x2="280" y2="538" stroke="rgba(201,162,75,0.25)" strokeWidth="1" strokeDasharray="4 3"/>

          <g className="reg-step3">
            <rect x="100" y="540" width="360" height="72" rx="12"
              fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
            <circle cx="280" cy="556" r="14" fill="rgba(201,162,75,0.12)" stroke="rgba(201,162,75,0.35)" strokeWidth="1"/>
            <text x="280" y="561" textAnchor="middle" fill="#C9A24B"
              fontFamily="Cairo,sans-serif" fontSize="11" fontWeight="900">03</text>
            <text x="280" y="584" textAnchor="middle" fill="#999"
              fontFamily="Cairo,sans-serif" fontSize="14" fontWeight="700">
              {ar ? "اطلب بكل سهولة" : "Order Easily"}
            </text>
            <text x="280" y="602" textAnchor="middle" fill="#555"
              fontFamily="Cairo,sans-serif" fontSize="11">
              {ar ? "توصيل سريع لباب منزلك" : "Fast delivery to your door"}
            </text>
          </g>

          <text x="280" y="730" textAnchor="middle" fill="#333"
            fontFamily="Cairo,sans-serif" fontSize="11">
            {ar ? "انضم لأكثر من 500 عميل يثقون بنا" : "Join 500+ customers who trust us"}
          </text>
        </svg>
      </div>

      <style dangerouslySetInnerHTML={{ __html: "@media (min-width: 900px) { .register-deco { display: block !important; } }" }} />
    </div>
  );
}
