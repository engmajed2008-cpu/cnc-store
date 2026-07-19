"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { GoogleButton } from "@/components/auth/GoogleButton";
import BrandMark from "@/components/brand/BrandMark";
import { supabase } from "@/lib/supabaseClient";

const G  = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

export default function LoginPage() {
  const locale = useLocale();
  const ar = locale === "ar";

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [nextPath, setNextPath] = useState<string | undefined>(undefined);

  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("next");
    if (n && n.startsWith("/")) setNextPath(n);
    // إذا كان مسجلاً مسبقاً — وجّهه مباشرة
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && n && n.startsWith("/")) {
        window.location.replace(n);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError(ar ? "يرجى تعبئة جميع الحقول" : "Please fill in all fields");
      return;
    }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(ar ? "البريد أو كلمة المرور غير صحيحة" : "Invalid email or password");
      return;
    }
    // العودة إلى الصفحة الطالبة (مثل /join) أو الرئيسية
    const next = new URLSearchParams(window.location.search).get("next");
    window.location.assign(next && next.startsWith("/") ? next : "/" + locale);
  }

  return (
    <div
      dir={ar ? "rtl" : "ltr"}
      style={{
        minHeight: "100vh", display: "flex",
        fontFamily: "Tajawal, Cairo, sans-serif", background: "transparent",
      }}
    >
      {/* ── Form panel ──────────────────────────────────────────── */}
      <div style={{
        flex: "0 0 100%", maxWidth: 480,
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "3rem 2.5rem", background: "#FDFBF7",
        position: "relative", zIndex: 1,
      }}>

        {/* Logo */}
        <div style={{ marginBottom: "2.5rem" }}>
          <Link href={"/" + locale} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.75rem" }}>
            <BrandMark size={44} />
            <span style={{ fontSize: ar ? "1.05rem" : "1.25rem", fontWeight: 900, ...GT }}>
              {ar ? "سوق الدعاية والإعلان" : "ADSOUQ"}
            </span>
          </Link>
          <div style={{ marginTop: "2rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#2C1E15", margin: "0 0 0.4rem 0" }}>
              {ar ? "أهلاً بك" : "Welcome Back"}
            </h1>
            <p style={{ color: "#909090", fontSize: "0.88rem", margin: 0 }}>
              {ar ? "سجّل دخولك لمتابعة طلباتك والاستمتاع بعروض حصرية" : "Sign in to track your orders and enjoy exclusive offers"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
            <label htmlFor="email" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#C9A24B" }}>
              {ar ? "البريد الإلكتروني" : "Email"}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@domain.com"
              dir="ltr"
              style={{
                padding: "0.75rem 1rem", borderRadius: 10,
                border: "1.5px solid rgba(201,162,75,0.2)",
                background: "rgba(255,255,255,0.04)", color: "#2C1E15",
                fontSize: "0.9rem", outline: "none", transition: "border-color 0.2s",
                fontFamily: "Tajawal, Cairo, sans-serif",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(201,162,75,0.6)")}
              onBlur={(e)  => (e.target.style.borderColor = "rgba(201,162,75,0.2)")}
            />
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
            <label htmlFor="password" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#C9A24B" }}>
              {ar ? "كلمة المرور" : "Password"}
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "0.75rem 1rem",
                  paddingInlineEnd: "3rem",
                  borderRadius: 10, border: "1.5px solid rgba(201,162,75,0.2)",
                  background: "rgba(255,255,255,0.04)", color: "#2C1E15",
                  fontSize: "0.9rem", outline: "none", transition: "border-color 0.2s",
                  fontFamily: "Tajawal, Cairo, sans-serif", boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(201,162,75,0.6)")}
                onBlur={(e)  => (e.target.style.borderColor = "rgba(201,162,75,0.2)")}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label={ar ? (showPw ? "إخفاء كلمة المرور" : "إظهار كلمة المرور") : (showPw ? "Hide password" : "Show password")}
                style={{
                  position: "absolute", top: "50%", insetInlineEnd: "0.85rem",
                  transform: "translateY(-50%)", background: "none",
                  border: "none", cursor: "pointer", color: "#909090",
                  display: "flex", alignItems: "center", padding: 0,
                }}
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Remember + Forget */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.82rem", color: "#909090" }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ accentColor: "#C9A24B", width: 15, height: 15, cursor: "pointer" }}
              />
              {ar ? "تذكرني" : "Remember me"}
            </label>
            <Link href={"/" + locale + "/forgot-password"} style={{ fontSize: "0.82rem", color: "#C9A24B", textDecoration: "none" }}>
              {ar ? "نسيت كلمة المرور؟" : "Forgot password?"}
            </Link>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: "0.7rem 1rem", borderRadius: 8,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5", fontSize: "0.82rem",
            }} role="alert">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={loading ? "" : "btn-shine btn-shine-gold"}
            style={{
              padding: "0.85rem", borderRadius: 999,
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
                {ar ? "جارٍ الدخول..." : "Signing in..."}
              </span>
            ) : (
              <>
                <LogIn size={17} />
                {ar ? "دخول" : "Sign In"}
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1.5rem 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(201,162,75,0.12)" }} />
          <span style={{ color: "#555", fontSize: "0.78rem" }}>{ar ? "أو" : "or"}</span>
          <div style={{ flex: 1, height: 1, background: "rgba(201,162,75,0.12)" }} />
        </div>

        {/* Google */}
        <GoogleButton locale={locale} mode="login" next={nextPath} />

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1.25rem 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(201,162,75,0.08)" }} />
          <span style={{ color: "#555", fontSize: "0.75rem" }}>{ar ? "حساب جديد؟" : "New here?"}</span>
          <div style={{ flex: 1, height: 1, background: "rgba(201,162,75,0.08)" }} />
        </div>

        {/* Register CTA */}
        <Link
          href={"/" + locale + "/register"}
          className="btn-shine btn-shine-outline"
          style={{
            padding: "0.85rem", borderRadius: 999, textDecoration: "none",
            border: "1.5px solid rgba(201,162,75,0.3)",
            color: "#C9A24B", fontWeight: 700, fontSize: "0.9rem",
            fontFamily: "Tajawal, Cairo, sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(201,162,75,0.08)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,162,75,0.6)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,162,75,0.3)";
          }}
        >
          <UserPlus size={17} />
          {ar ? "إنشاء حساب جديد" : "Create New Account"}
        </Link>

        {/* Back to site */}
        <p style={{ marginTop: "1.75rem", textAlign: "center", fontSize: "0.8rem", color: "#555" }}>
          <Link href={"/" + locale} style={{ color: "#909090", textDecoration: "none" }}>
            {ar ? "العودة إلى الموقع" : "Back to site"}
          </Link>
        </p>

        <style dangerouslySetInnerHTML={{ __html: "@keyframes spin { to { transform: rotate(360deg); } }" }} />
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes rotateSlow  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
          @keyframes rotateRev   { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }
          @keyframes pulse       { 0%,100% { opacity:0.15; r:75; } 50% { opacity:0.35; r:82; } }
          @keyframes pulseCore   { 0%,100% { opacity:1; r:4; } 50% { opacity:0.5; r:7; } }
          @keyframes scan        { 0% { transform: translateY(-220px); opacity:0; } 10%,90% { opacity:1; } 100% { transform: translateY(220px); opacity:0; } }
          @keyframes fadeInUp    { from { opacity:0; transform:translateY(12px); } to { opacity:0.7; transform:translateY(0); } }
          @keyframes dashMove    { to { stroke-dashoffset: -40; } }
          @keyframes blinkDot    { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
          @keyframes floatBadge  { 0%,100% { transform:translateY(0);   } 50% { transform:translateY(-6px); } }
          @keyframes floatBadge2 { 0%,100% { transform:translateY(0);   } 50% { transform:translateY(6px);  } }
          @keyframes drawPentagon { from { stroke-dashoffset: 650; } to { stroke-dashoffset: 0; } }
          @keyframes glowRing    { 0%,100% { stroke-opacity:0.45; } 50% { stroke-opacity:0.9; } }

          .deco-ring-outer  { transform-origin:280px 400px; animation: rotateSlow 18s linear infinite; }
          .deco-ring-mid    { transform-origin:280px 400px; animation: rotateRev  12s linear infinite; }
          .deco-pentagon    { stroke-dasharray:650; animation: drawPentagon 2.5s ease-out forwards, glowRing 4s 2.5s ease-in-out infinite; }
          .deco-scan        { animation: scan 4s ease-in-out infinite; }
          .deco-core        { animation: pulseCore 2s ease-in-out infinite; }
          .deco-inner-ring  { animation: pulse 3s ease-in-out infinite; }
          .deco-dash-h      { stroke-dasharray: 5 5; animation: dashMove 1.5s linear infinite; }
          .deco-dash-v      { stroke-dasharray: 5 5; animation: dashMove 2s linear infinite; }
          .deco-badge-1     { animation: fadeInUp 0.8s 0.3s ease-out both, floatBadge  3s 1.1s ease-in-out infinite; }
          .deco-badge-2     { animation: fadeInUp 0.8s 0.6s ease-out both, floatBadge2 3.5s 1.4s ease-in-out infinite; }
          .deco-badge-3     { animation: fadeInUp 0.8s 0.9s ease-out both, floatBadge  4s   1.7s ease-in-out infinite; }
          .deco-badge-4     { animation: fadeInUp 0.8s 1.2s ease-out both, floatBadge2 3.2s 2s   ease-in-out infinite; }
          .deco-top-dot     { animation: blinkDot 1.5s ease-in-out infinite; }
          .deco-title       { animation: fadeInUp 1s 0.1s ease-out both; }
        ` }} />
      </div>

      {/* ── Decorative panel (hidden on mobile) ──────────────────── */}
      <div
        style={{ flex: 1, position: "relative", overflow: "hidden", display: "none", background: "#FDFBF7" }}
        className="login-deco"
      >
        {/* SVG — CNC grid design */}
        <svg
          width="100%" height="100%"
          viewBox="0 0 560 800"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: "absolute", inset: 0 }}
        >
          {/* Diagonal grid lines */}
          <g opacity="0.06">
            {[-280,-140,0,140,280,420,560,700].map((x, i) => (
              <line key={"d"+i} x1={x} y1="0" x2={x+800} y2="800" stroke="#C9A24B" strokeWidth="0.8"/>
            ))}
            {[-280,-140,0,140,280,420,560,700].map((x, i) => (
              <line key={"v"+i} x1={x} y1="800" x2={x+800} y2="0" stroke="#C9A24B" strokeWidth="0.8"/>
            ))}
          </g>
          {/* Vertical + horizontal faint grid */}
          <g opacity="0.04">
            {[0,80,160,240,320,400,480,560].map((x, i) => (
              <line key={"gv"+i} x1={x} y1="0" x2={x} y2="800" stroke="#C9A24B" strokeWidth="0.5"/>
            ))}
            {[0,80,160,240,320,400,480,560,640,720,800].map((y, i) => (
              <line key={"gh"+i} x1="0" y1={y} x2="560" y2={y} stroke="#C9A24B" strokeWidth="0.5"/>
            ))}
          </g>
          {/* Outer ring — rotates clockwise */}
          <circle className="deco-ring-outer" cx="280" cy="400" r="200" fill="none" stroke="rgba(201,162,75,0.1)" strokeWidth="1" strokeDasharray="12 6"/>
          {/* Mid ring — rotates counter-clockwise */}
          <circle className="deco-ring-mid" cx="280" cy="400" r="140" fill="none" stroke="rgba(201,162,75,0.18)" strokeWidth="1" strokeDasharray="8 8"/>
          {/* Inner ring — pulses */}
          <circle className="deco-inner-ring" cx="280" cy="400" r="75" fill="none" stroke="rgba(201,162,75,0.22)" strokeWidth="1.5"/>

          {/* Scan line */}
          <g style={{ overflow: "hidden" }} clipPath="url(#innerClip)">
            <line className="deco-scan" x1="100" y1="400" x2="460" y2="400" stroke="rgba(201,162,75,0.25)" strokeWidth="1"/>
          </g>
          <defs>
            <clipPath id="innerClip">
              <circle cx="280" cy="400" r="200"/>
            </clipPath>
          </defs>

          {/* Pentagon — draws itself on load */}
          <polygon
            className="deco-pentagon"
            points="280,270 385,340 350,460 210,460 175,340"
            fill="none" stroke="rgba(201,162,75,0.55)" strokeWidth="1.5"
          />
          <polygon
            points="280,295 362,352 333,448 227,448 198,352"
            fill="none" stroke="rgba(201,162,75,0.12)" strokeWidth="0.8"
          />

          {/* Crosshair lines — animated dashes */}
          <line className="deco-dash-v" x1="280" y1="200" x2="280" y2="325" stroke="rgba(201,162,75,0.4)" strokeWidth="1" strokeDasharray="5 5"/>
          <line className="deco-dash-h" x1="80"  y1="400" x2="205" y2="400" stroke="rgba(201,162,75,0.3)" strokeWidth="1" strokeDasharray="5 5"/>
          <line className="deco-dash-h" x1="355" y1="400" x2="480" y2="400" stroke="rgba(201,162,75,0.3)" strokeWidth="1" strokeDasharray="5 5"/>
          <line className="deco-dash-v" x1="280" y1="475" x2="280" y2="600" stroke="rgba(201,162,75,0.4)" strokeWidth="1" strokeDasharray="5 5"/>

          {/* Center — pulses */}
          <circle cx="280" cy="400" r="12" fill="rgba(201,162,75,0.08)" stroke="rgba(201,162,75,0.4)" strokeWidth="1"/>
          <circle className="deco-core" cx="280" cy="400" r="4" fill="#C9A24B"/>

          {/* Top target — blinks */}
          <g className="deco-top-dot">
            <circle cx="280" cy="200" r="6" fill="none" stroke="#C9A24B" strokeWidth="1.5"/>
            <circle cx="280" cy="200" r="2.5" fill="#C9A24B"/>
            <line x1="273" y1="200" x2="267" y2="200" stroke="#C9A24B" strokeWidth="1"/>
            <line x1="287" y1="200" x2="293" y2="200" stroke="#C9A24B" strokeWidth="1"/>
            <line x1="280" y1="193" x2="280" y2="187" stroke="#C9A24B" strokeWidth="1"/>
            <line x1="280" y1="207" x2="280" y2="213" stroke="#C9A24B" strokeWidth="1"/>
          </g>

          {/* Corner marks */}
          {([[60,100],[500,100],[60,700],[500,700]] as [number,number][]).map(([x,y],i) => (
            <g key={"c"+i}>
              <line x1={x-14} y1={y} x2={x+14} y2={y} stroke="rgba(201,162,75,0.3)" strokeWidth="1"/>
              <line x1={x} y1={y-14} x2={x} y2={y+14} stroke="rgba(201,162,75,0.3)" strokeWidth="1"/>
              <circle cx={x} cy={y} r="3" fill="none" stroke="rgba(201,162,75,0.5)" strokeWidth="1"/>
            </g>
          ))}

          {/* Floating badge labels */}
          <g className="deco-badge-1">
            <rect x="28" y="305" width="96" height="34" rx="7" fill="rgba(201,162,75,0.07)" stroke="rgba(201,162,75,0.4)" strokeWidth="1"/>
            <text x="76" y="327" textAnchor="middle" fill="#C9A24B" fontFamily="Cairo,sans-serif" fontSize="12" fontWeight="700">دقة عالية</text>
          </g>
          <g className="deco-badge-2">
            <rect x="436" y="305" width="96" height="34" rx="7" fill="rgba(201,162,75,0.07)" stroke="rgba(201,162,75,0.4)" strokeWidth="1"/>
            <text x="484" y="327" textAnchor="middle" fill="#C9A24B" fontFamily="Cairo,sans-serif" fontSize="12" fontWeight="700">تصميم مميز</text>
          </g>
          <g className="deco-badge-3">
            <rect x="28" y="461" width="96" height="34" rx="7" fill="rgba(201,162,75,0.07)" stroke="rgba(201,162,75,0.4)" strokeWidth="1"/>
            <text x="76" y="483" textAnchor="middle" fill="#C9A24B" fontFamily="Cairo,sans-serif" fontSize="12" fontWeight="700">جودة معتمدة</text>
          </g>
          <g className="deco-badge-4">
            <rect x="436" y="461" width="96" height="34" rx="7" fill="rgba(201,162,75,0.07)" stroke="rgba(201,162,75,0.4)" strokeWidth="1"/>
            <text x="484" y="483" textAnchor="middle" fill="#C9A24B" fontFamily="Cairo,sans-serif" fontSize="12" fontWeight="700">قص CNC</text>
          </g>

          {/* Brand name */}
          <text className="deco-title" x="280" y="158" textAnchor="middle" fill="#C9A24B" fontFamily="Cairo,sans-serif" fontSize={ar ? "24" : "30"} fontWeight="900" opacity="0.95">
            {ar ? "سوق الدعاية والإعلان" : "ADSOUQ"}
          </text>
          <text className="deco-title" x="280" y="182" textAnchor="middle" fill="#555" fontFamily="Cairo,sans-serif" fontSize="10" letterSpacing="4">
            ADSOUQ.SA
          </text>
          {/* Bottom tagline */}
          <text x="280" y="655" textAnchor="middle" fill="#3a3a3a" fontFamily="Cairo,sans-serif" fontSize="12">
            {ar ? "دعاية · ديكور · قص CNC" : "Advertising · Decor · CNC Cutting"}
          </text>
        </svg>
      </div>

      <style dangerouslySetInnerHTML={{ __html: "@media (min-width: 768px) { .login-deco { display: block !important; } }" }} />
    </div>
  );
}
