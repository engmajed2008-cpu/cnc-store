"use client";
import { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Script from "next/script";

const G   = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT  = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" as const };
const PRICE_SAR = 29;
const PRICE_HALALAS = PRICE_SAR * 100;

const PRO_FEATURES = [
  "٣ تعديلات مشمولة لكل تصميم",
  "استيراد السجل التجاري (OCR)",
  "معاينة واجهة المحل الواقعية",
  "ملف امتثال PDF جاهز للتقديم",
  "ملفات قص جاهزة للإنتاج",
  "حفظ التصاميم واسترجاعها",
  "جميع الخطوط والألوان",
];

declare global {
  interface Window { Moyasar?: { init: (opts: Record<string, unknown>) => void }; }
}

export default function DesignerProPayPage() {
  const locale = useLocale();
  const ar = locale === "ar";
  const [back, setBack] = useState(`/${locale}/configure/signs/raised-letters`);
  const [userName, setUserName] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [paid, setPaid] = useState(false);
  const [moyasarReady, setMoyasarReady] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const moyasarKey = process.env.NEXT_PUBLIC_MOYASAR_KEY;

  // Read back URL
  useEffect(() => {
    const b = new URLSearchParams(window.location.search).get("back");
    if (b && b.startsWith("/")) setBack(b);
  }, []);

  // Check auth — redirect to login if not signed in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        const payPath = window.location.pathname + window.location.search;
        window.location.replace(`/${locale}/login?next=${encodeURIComponent(payPath)}`);
        return;
      }
      const u = data.session.user;
      const name =
        u.user_metadata?.full_name ||
        u.user_metadata?.name ||
        u.email?.split("@")[0] ||
        null;
      setUserName(name ? String(name).split(" ")[0] : null);
      setAuthChecked(true);
    });
  }, [locale]);

  // Init Moyasar after SDK loads (if key is configured)
  useEffect(() => {
    if (!moyasarReady || !authChecked || !formRef.current || !moyasarKey) return;
    if (!window.Moyasar) return;

    window.Moyasar.init({
      element: ".mysr-form",
      amount: PRICE_HALALAS,
      currency: "SAR",
      description: ar ? "الخطة الاحترافية — إعلاني" : "Pro Plan — E3lani",
      publishable_api_key: moyasarKey,
      callback_url:
        window.location.origin +
        `/api/pay/designer-confirm?back=${encodeURIComponent(back)}`,
      methods: ["creditcard", "applepay", "stcpay"],
      on_completed: () => {
        unlockPro();
      },
    });
  }, [moyasarReady, authChecked, moyasarKey, back, ar]);

  function unlockPro() {
    sessionStorage.setItem("e3lani_plan", "pro");
    sessionStorage.setItem("e3lani_revisions", "3");
    setPaid(true);
    setTimeout(() => window.location.replace(back), 1800);
  }

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FDFBF7", fontFamily: "Tajawal, Cairo, sans-serif" }}>
        <div style={{ width: 32, height: 32, border: "3px solid rgba(201,162,75,0.3)", borderTopColor: "#C9A24B", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (paid) {
    return (
      <div dir={ar ? "rtl" : "ltr"} style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#FDFBF7", fontFamily: "Tajawal, Cairo, sans-serif", gap: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#22c55e,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, boxShadow: "0 8px 32px rgba(34,197,94,0.3)" }}>✓</div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#2C1E15", margin: 0 }}>
          {ar ? "تم الدفع بنجاح!" : "Payment Successful!"}
        </h2>
        <p style={{ color: "#634E40", margin: 0 }}>{ar ? "جارٍ تفعيل الخطة الاحترافية…" : "Activating Pro Plan…"}</p>
      </div>
    );
  }

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: "#FDFBF7", fontFamily: "Tajawal, Cairo, sans-serif" }}>
      {/* Moyasar SDK */}
      {moyasarKey && (
        <>
          <link rel="stylesheet" href="https://cdn.moyasar.com/mpf/1.14.3/moyasar.css" />
          <Script
            src="https://cdn.moyasar.com/mpf/1.14.3/moyasar.js"
            onLoad={() => setMoyasarReady(true)}
          />
        </>
      )}

      {/* Header */}
      <div style={{ padding: "1.25rem 2rem", borderBottom: "1px solid rgba(201,162,75,0.12)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href={`/${locale}`} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <img src="/brand/e3lani-mark.svg" alt="إعلاني" style={{ height: 36 }} />
          <span style={{ fontSize: "0.85rem", color: "#C9A24B", fontWeight: 700, letterSpacing: "0.1em" }}>E3LANI.COM</span>
        </Link>
        {userName && (
          <span style={{ fontSize: "0.82rem", color: "#634E40" }}>
            {ar ? `أهلاً، ${userName}` : `Hi, ${userName}`}
          </span>
        )}
      </div>

      {/* Main */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "3rem 1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem" }}
        className="pay-grid">
        <style>{`
          @media (max-width: 680px) { .pay-grid { grid-template-columns: 1fr !important; } }
          @keyframes spin { to { transform: rotate(360deg); } }
          .mysr-form { direction: ltr; }
        `}</style>

        {/* Left — Plan Summary */}
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.3rem 0.9rem", borderRadius: 999, background: "rgba(201,162,75,0.1)", border: "1px solid rgba(201,162,75,0.25)", marginBottom: "1.25rem" }}>
            <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#C9A24B", letterSpacing: "0.08em" }}>✦ الخطة الاحترافية</span>
          </div>

          <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.2rem)", fontWeight: 900, color: "#2C1E15", margin: "0 0 0.5rem 0", lineHeight: 1.2 }}>
            {ar ? "احصل على الخطة الاحترافية" : "Get the Pro Plan"}
          </h1>
          <p style={{ color: "#634E40", fontSize: "0.95rem", lineHeight: 1.7, margin: "0 0 2rem 0" }}>
            {ar
              ? "صمّم لوحتك الإعلانية باحتراف مع كامل الأدوات، ملفات الإنتاج، وضمان الامتثال البلدي."
              : "Design your signage professionally with full tools, production files, and municipal compliance."}
          </p>

          {/* Price card */}
          <div style={{ padding: "1.5rem", borderRadius: 16, background: "linear-gradient(135deg,#2C1E15,#1A1008)", border: "1px solid rgba(201,162,75,0.25)", marginBottom: "1.5rem", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,162,75,0.12),transparent 70%)", pointerEvents: "none" }} />
            <div style={{ fontSize: "0.72rem", color: "rgba(201,162,75,0.6)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>
              {ar ? "السعر لكل تصميم" : "PRICE PER DESIGN"}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: "3rem", fontWeight: 900, ...GT }}>{PRICE_SAR}</span>
              <span style={{ fontSize: "1.1rem", color: "#EBCB7C", fontWeight: 700 }}>ر.س</span>
            </div>
            <div style={{ fontSize: "0.78rem", color: "rgba(201,162,75,0.55)", marginTop: 6 }}>
              {ar ? "تُحسم من فاتورة التنفيذ إذا أكملت الطلب عبر المنصة" : "Deducted from execution invoice if you complete the order"}
            </div>
          </div>

          {/* Features */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PRO_FEATURES.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(201,162,75,0.12)", border: "1.5px solid rgba(201,162,75,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#C9A24B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span style={{ fontSize: "0.88rem", color: "#634E40", fontWeight: 600 }}>{f}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "1.5rem", padding: "0.9rem 1.2rem", borderRadius: 12, background: "rgba(201,162,75,0.05)", border: "1px solid rgba(201,162,75,0.12)", fontSize: "0.8rem", color: "#9A6A2A", lineHeight: 1.6 }}>
            🔒 {ar ? "دفع آمن — بياناتك محمية بتشفير SSL. لا يتم تخزين بيانات البطاقة." : "Secure payment — your data is SSL-encrypted. Card details are never stored."}
          </div>

          <Link href={back} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: "1rem", fontSize: "0.82rem", color: "#9A6A2A", textDecoration: "none" }}>
            {ar ? "← رجوع للمصمم بدون ترقية" : "← Back to designer without upgrade"}
          </Link>
        </div>

        {/* Right — Payment Form */}
        <div>
          <div style={{ padding: "2rem", borderRadius: 20, background: "#fff", border: "1px solid rgba(201,162,75,0.15)", boxShadow: "0 8px 40px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#2C1E15", margin: "0 0 1.5rem 0", textAlign: "center" }}>
              {ar ? "إتمام الدفع" : "Complete Payment"}
            </h2>

            {moyasarKey ? (
              /* Moyasar SDK will inject the form here */
              <div ref={formRef} className="mysr-form" />
            ) : (
              /* Dev / no-key fallback */
              <DevPaymentForm ar={ar} onPay={unlockPro} priceSAR={PRICE_SAR} />
            )}
          </div>

          <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#aaa", marginTop: "1rem" }}>
            {ar
              ? "بالدفع توافق على شروط الخدمة. المبلغ غير قابل للاسترداد بعد تفعيل التصميم."
              : "By paying you agree to our terms. Amount is non-refundable after design activation."}
          </p>
        </div>
      </div>
    </div>
  );
}

function DevPaymentForm({ ar, onPay, priceSAR }: { ar: boolean; onPay: () => void; priceSAR: number }) {
  const [busy, setBusy] = useState(false);

  function handle() {
    setBusy(true);
    // Simulate payment processing
    setTimeout(() => { onPay(); }, 1200);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Simulated card fields */}
      <div style={{ padding: "1rem", borderRadius: 10, background: "rgba(201,162,75,0.04)", border: "1px dashed rgba(201,162,75,0.3)", textAlign: "center", fontSize: "0.78rem", color: "#9A6A2A" }}>
        {ar
          ? "⚙️ وضع الاختبار — لم يُضَف مفتاح Moyasar بعد"
          : "⚙️ Test mode — Moyasar key not configured yet"}
      </div>

      {/* Mock card UI */}
      {[
        { label: ar ? "رقم البطاقة" : "Card number", placeholder: "4111 1111 1111 1111" },
        { label: ar ? "تاريخ الانتهاء" : "Expiry", placeholder: "MM/YY" },
        { label: ar ? "CVV" : "CVV", placeholder: "•••" },
      ].map((f) => (
        <div key={f.label} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#634E40" }}>{f.label}</label>
          <input
            placeholder={f.placeholder}
            dir="ltr"
            disabled
            style={{ padding: "0.65rem 0.9rem", borderRadius: 8, border: "1.5px solid rgba(201,162,75,0.2)", background: "#FDFBF7", fontSize: "0.9rem", color: "#aaa", fontFamily: "monospace" }}
          />
        </div>
      ))}

      <button
        onClick={handle}
        disabled={busy}
        style={{ marginTop: 8, padding: "0.9rem", borderRadius: 999, border: "none", cursor: busy ? "not-allowed" : "pointer", background: busy ? "rgba(201,162,75,0.4)" : G, color: "#2C1E15", fontWeight: 800, fontSize: "0.95rem", fontFamily: "Tajawal, Cairo, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: busy ? "none" : "0 6px 20px rgba(201,162,75,0.35)" }}>
        {busy ? (
          <>
            <span style={{ width: 16, height: 16, border: "2px solid #2C1E15", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
            {ar ? "جارٍ المعالجة…" : "Processing…"}
          </>
        ) : (
          <>
            🔒 {ar ? `ادفع ${priceSAR} ر.س` : `Pay ${priceSAR} SAR`}
          </>
        )}
      </button>

      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 4 }}>
        {["Visa", "Mastercard", "مدى", "STC Pay", "Apple Pay"].map((m) => (
          <span key={m} style={{ fontSize: "0.68rem", color: "#aaa", padding: "2px 6px", border: "1px solid #eee", borderRadius: 4 }}>{m}</span>
        ))}
      </div>
    </div>
  );
}
