"use client";

/**
 * /join — انضمام الشركاء إلى سوق الدعاية والإعلان
 * النموذج يظهر مباشرة بلا بوابة دخول:
 *  - زائر جديد: حقول إنشاء الحساب ضمن نفس النموذج (تسجيل + طلب بخطوة واحدة)
 *  - مستخدم مسجَّل دخوله: يقدّم الطلب على حسابه الحالي مباشرة
 * التفعيل يدوي من إدارة المنصة دائماً.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { supabase } from "@/lib/supabaseClient";
import BrandMark from "@/components/brand/BrandMark";
import { GoogleButton } from "@/components/auth/GoogleButton";

const GOLD = "#C9A24B";
const G = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" as const };

type EntityType = "AD_AGENCY" | "MANUFACTURER" | "SUPPLIER";

const ENTITY_TYPES: { value: EntityType; ar: string; en: string; descAr: string; descEn: string; icon: string }[] = [
  {
    value: "AD_AGENCY",
    ar: "وكالة دعاية وإعلان",
    en: "Advertising Agency",
    descAr: "تستقبل طلبات العملاء وتقدّم عروض أسعار وتدير التنفيذ",
    descEn: "Receives customer requests, submits offers, manages execution",
    icon: "📣",
  },
  {
    value: "MANUFACTURER",
    ar: "منشأة متخصصة بصناعة الدعاية والإعلان",
    en: "Signage Manufacturer",
    descAr: "مصنع أو ورشة تنفّذ اللوحات واللافتات وتقدّم عروضاً مباشرة",
    descEn: "Factory or workshop producing signs, bids directly",
    icon: "🏭",
  },
  {
    value: "SUPPLIER",
    ar: "مورد لمواد الدعاية والإعلان",
    en: "Materials Supplier",
    descAr: "يبيع الخامات والمواد للوكالات والمصانع (كتالوج B2B)",
    descEn: "Sells materials to agencies and manufacturers (B2B catalog)",
    icon: "📦",
  },
];

type Application = { type: string; companyName: string; verified: boolean; role: string } | null;

export default function JoinPage() {
  const locale = useLocale();
  const ar = locale === "ar";

  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [application, setApplication] = useState<Application>(null);
  const [checkingApp, setCheckingApp] = useState(false); // فحص طلب سابق يجري بالخلفية — لا يحجب النموذج

  // بيانات الحساب (لغير المسجَّلين)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState(""); // إعادة إدخال كلمة المرور للتأكد

  // ── تأكيد البريد الإلكتروني برمز — يشمل حسابات Google ──
  const [emailOtpAvailable, setEmailOtpAvailable] = useState(false);
  const [emailStep, setEmailStep] = useState<"idle" | "sent" | "verified">("idle");
  const [emailCode, setEmailCode] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailDevCode, setEmailDevCode] = useState<string | null>(null);
  const [emailProof, setEmailProof] = useState<string | null>(null);
  const [emailResendIn, setEmailResendIn] = useState(0);

  useEffect(() => {
    if (emailResendIn <= 0) return;
    const t = setTimeout(() => setEmailResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [emailResendIn]);

  // بيانات المنشأة
  const [entityType, setEntityType] = useState<EntityType | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [phone, setPhone] = useState("");

  // الأمانة ← المدن التابعة لها (تُجلب من القاعدة — قابلة للتوسع بصفوف جديدة)
  type AmanaOption = { id: string; nameAr: string; nameEn: string; cities: { id: string; nameAr: string; nameEn: string }[] };
  const [amanat, setAmanat] = useState<AmanaOption[]>([]);
  const [amanaId, setAmanaId] = useState("");
  const [cityId, setCityId] = useState("");
  const selectedAmana = amanat.find((a) => a.id === amanaId) ?? null;

  // نوع رقم المنشأة: سجل تجاري | الرقم الموحد
  const [crNumberType, setCrNumberType] = useState<"CR" | "UNIFIED">("CR");

  // المستندات المرفوعة (السجل التجاري + هوية المالك)
  type UploadedDoc = { path: string; proof: string; name: string } | null;
  const [crDoc, setCrDoc] = useState<UploadedDoc>(null);
  const [crDocBusy, setCrDocBusy] = useState(false);
  const [crDocError, setCrDocError] = useState<string | null>(null);

  // هوية المالك
  const [ownerIdNumber, setOwnerIdNumber] = useState("");
  const [ownerDoc, setOwnerDoc] = useState<UploadedDoc>(null);
  const [ownerDocBusy, setOwnerDocBusy] = useState(false);
  const [ownerDocError, setOwnerDocError] = useState<string | null>(null);

  // التعهد — شروط ديناميكية تُدار من لوحة التحكم
  type PledgeTermRow = { id: string; textAr: string; textEn: string | null };
  const [pledgeTerms, setPledgeTerms] = useState<PledgeTermRow[]>([]);
  const [pledgeChecked, setPledgeChecked] = useState(false);
  const [pledgeOpen, setPledgeOpen] = useState(false);

  const uploadDoc = async (
    file: File,
    kind: "cr" | "owner-id",
    setDoc: (d: UploadedDoc) => void,
    setBusy: (b: boolean) => void,
    setErr: (e: string | null) => void
  ) => {
    setErr(null);
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setErr(ar ? "الصيغ المسموحة: JPG / PNG / WEBP / PDF" : "Allowed: JPG / PNG / WEBP / PDF");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr(ar ? "حجم الملف يتجاوز 5MB" : "File exceeds 5MB");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      const res = await fetch("/api/partners/upload-cr", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.error ?? (ar ? "تعذّر رفع الملف" : "Upload failed"));
        return;
      }
      setDoc({ path: j.storagePath, proof: j.docProof, name: j.fileName || file.name });
    } finally {
      setBusy(false);
    }
  };

  const uploadCrDoc = (f: File) => uploadDoc(f, "cr", setCrDoc, setCrDocBusy, setCrDocError);
  const uploadOwnerDoc = (f: File) => uploadDoc(f, "owner-id", setOwnerDoc, setOwnerDocBusy, setOwnerDocError);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // ── تحقق الجوال OTP ──
  const [otpAvailable, setOtpAvailable] = useState(false);
  const [otpStep, setOtpStep] = useState<"idle" | "sent" | "verified">("idle");
  const [otpCode, setOtpCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [phoneProof, setPhoneProof] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const fullPhone = "+9665" + phone;

  const sendOtp = async () => {
    setOtpError(null);
    if (!/^\d{8}$/.test(phone)) {
      setOtpError(ar ? "أكمل رقم الجوال أولاً (8 أرقام)" : "Complete the mobile number first (8 digits)");
      return;
    }
    setOtpBusy(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setOtpError(j.error ?? (ar ? "تعذّر الإرسال" : "Failed to send")); return; }
      setOtpStep("sent");
      setOtpCode("");
      setDevCode(j.devCode ?? null);
      setResendIn(60);
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyOtp = async () => {
    setOtpError(null);
    if (!/^\d{6}$/.test(otpCode)) {
      setOtpError(ar ? "أدخل الرمز المكوّن من 6 أرقام" : "Enter the 6-digit code");
      return;
    }
    setOtpBusy(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, code: otpCode }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setOtpError(j.error ?? (ar ? "الرمز غير صحيح" : "Invalid code")); return; }
      setPhoneProof(j.phoneProof);
      setOtpStep("verified");
      setDevCode(null);
    } finally {
      setOtpBusy(false);
    }
  };

  // البريد المطلوب تأكيده: بريد الحساب للمسجَّلين (يشمل Google) أو المُدخل للزوار
  const confirmEmail = (token ? userEmail ?? "" : email.trim()).toLowerCase();

  const sendEmailOtp = async () => {
    setEmailError(null);
    if (!/^\S+@\S+\.\S+$/.test(confirmEmail)) {
      setEmailError(ar ? "أدخل بريداً إلكترونياً صالحاً أولاً" : "Enter a valid email first");
      return;
    }
    setEmailBusy(true);
    try {
      const res = await fetch("/api/otp/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: confirmEmail }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setEmailError(j.error ?? (ar ? "تعذّر الإرسال" : "Failed to send")); return; }
      setEmailStep("sent");
      setEmailCode("");
      setEmailDevCode(j.devCode ?? null);
      setEmailResendIn(60);
    } finally {
      setEmailBusy(false);
    }
  };

  const verifyEmailOtp = async () => {
    setEmailError(null);
    if (!/^\d{6}$/.test(emailCode)) {
      setEmailError(ar ? "أدخل الرمز المكوّن من 6 أرقام" : "Enter the 6-digit code");
      return;
    }
    setEmailBusy(true);
    try {
      const res = await fetch("/api/otp/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: confirmEmail, code: emailCode }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setEmailError(j.error ?? (ar ? "الرمز غير صحيح" : "Invalid code")); return; }
      setEmailProof(j.emailProof);
      setEmailStep("verified");
      setEmailDevCode(null);
    } finally {
      setEmailBusy(false);
    }
  };

  // تغيير البريد يلغي تأكيداً سابقاً (للزوار)
  const onEmailChange = (value: string) => {
    setEmail(value);
    if (emailStep !== "idle") {
      setEmailStep("idle");
      setEmailProof(null);
      setEmailCode("");
      setEmailError(null);
      setEmailDevCode(null);
    }
  };

  // إرشادات قوة كلمة المرور — تتحقق حيّاً أثناء الكتابة وتُفرض في السيرفر أيضاً
  const pwRules = [
    { ok: password.length >= 8, ar: "8 أحرف على الأقل", en: "At least 8 characters" },
    { ok: /[A-Z]/.test(password), ar: "حرف كبير (A–Z)", en: "Uppercase letter (A–Z)" },
    { ok: /[a-z]/.test(password), ar: "حرف صغير (a–z)", en: "Lowercase letter (a–z)" },
    { ok: /\d/.test(password), ar: "رقم (0–9)", en: "Number (0–9)" },
    { ok: /[^A-Za-z0-9]/.test(password), ar: "رمز خاص (! @ # $ …)", en: "Special character (! @ # $ …)" },
  ];
  const pwStrong = pwRules.every((r) => r.ok);
  const pwMatch = password2.length > 0 && password === password2;

  // تغيير الرقم يلغي تحققاً سابقاً
  const onPhoneChange = (value: string) => {
    const clean = value.replace(/\D/g, "").slice(0, 8);
    if (clean !== phone) {
      setPhone(clean);
      setOtpStep("idle");
      setPhoneProof(null);
      setOtpCode("");
      setOtpError(null);
      setDevCode(null);
    }
  };

  useEffect(() => {
    // كاش جلسة (10 دقائق) للبيانات شبه الثابتة — زيارات متكررة بلا انتظار للقاعدة
    const cacheGet = (key: string) => {
      try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const { t, v } = JSON.parse(raw);
        return Date.now() - t > 10 * 60_000 ? null : v;
      } catch { return null; }
    };
    const cacheSet = (key: string, v: unknown) => {
      try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v })); } catch {}
    };

    (async () => {
      // الأمانات ومدنها + حالة OTP + شروط التعهد تُجلب بالخلفية — لا تحجب ظهور النموذج
      const cachedAmanat = cacheGet("join_amanat_v1") as AmanaOption[] | null;
      if (cachedAmanat?.length) {
        setAmanat(cachedAmanat);
        if (cachedAmanat.length === 1) setAmanaId(cachedAmanat[0].id);
      }
      fetch("/api/amanat").then(async (r) => {
        if (r.ok) {
          const j = await r.json();
          const list: AmanaOption[] = j.amanat ?? [];
          setAmanat(list);
          cacheSet("join_amanat_v1", list);
          // أمانة واحدة فقط حالياً (جدة) — تُختار تلقائياً
          if (list.length === 1) setAmanaId(list[0].id);
        }
      }).catch(() => {});

      const cachedFlags = cacheGet("join_otp_flags_v1") as { sms: boolean; email: boolean } | null;
      if (cachedFlags) {
        setOtpAvailable(cachedFlags.sms);
        setEmailOtpAvailable(cachedFlags.email);
      }
      Promise.all([
        fetch("/api/otp/send").then((r) => (r.ok ? r.json() : { enabled: false })),
        fetch("/api/otp/email/send").then((r) => (r.ok ? r.json() : { enabled: false })),
      ]).then(([sms, em]) => {
        setOtpAvailable(Boolean(sms.enabled));
        setEmailOtpAvailable(Boolean(em.enabled));
        cacheSet("join_otp_flags_v1", { sms: Boolean(sms.enabled), email: Boolean(em.enabled) });
      }).catch(() => {});

      const cachedPledge = cacheGet("join_pledge_v1") as PledgeTermRow[] | null;
      if (cachedPledge?.length) setPledgeTerms(cachedPledge);
      fetch("/api/partners/pledge").then(async (r) => {
        if (r.ok) {
          const j = await r.json();
          setPledgeTerms(j.terms ?? []);
          cacheSet("join_pledge_v1", j.terms ?? []);
        }
      }).catch(() => {});

      // الجلسة محلية (فورية) — النموذج يظهر مباشرة للجميع
      const { data } = await supabase.auth.getSession();
      const t = data.session?.access_token ?? null;
      setToken(t);
      setUserEmail(data.session?.user?.email ?? null);
      const metaName =
        data.session?.user?.user_metadata?.full_name ??
        data.session?.user?.user_metadata?.name ??
        "";
      if (metaName) setFullName(metaName);

      setLoading(false);

      if (!t) return;

      // فحص وجود طلب سابق — بالخلفية ولا يؤخر العرض؛ عند وجوده تُستبدل الصفحة ببطاقة الحالة
      setCheckingApp(true);
      fetch("/api/partners", { headers: { Authorization: `Bearer ${t}` } })
        .then(async (r) => {
          if (r.ok) {
            const j = await r.json();
            setApplication(j.application);
          }
        })
        .catch(() => {})
        .finally(() => setCheckingApp(false));
    })();
  }, []);

  const submit = async () => {
    setError(null);
    if (!entityType) { setError(ar ? "اختر نوع المنشأة أولاً" : "Select your entity type first"); return; }
    if (companyName.trim().length < 2) { setError(ar ? "اسم المنشأة مطلوب" : "Company name is required"); return; }
    if (!/^\d{10}$/.test(crNumber.trim())) {
      setError(crNumberType === "CR"
        ? (ar ? "أدخل رقم السجل التجاري (10 أرقام)" : "Enter the CR number (10 digits)")
        : (ar ? "أدخل الرقم الموحد للمنشأة (10 أرقام)" : "Enter the Unified number (10 digits)"));
      return;
    }
    if (crNumberType === "UNIFIED" && !crNumber.trim().startsWith("7")) { setError(ar ? "الرقم الموحد للمنشأة يبدأ بالرقم 7" : "The Unified number starts with 7"); return; }
    if (!crDoc) { setError(ar ? "أرفق صورة السجل التجاري" : "Attach the CR document"); return; }
    if (!/^[12]\d{9}$/.test(ownerIdNumber.trim())) { setError(ar ? "أدخل رقم هوية المالك (10 أرقام تبدأ بـ1 أو 2)" : "Enter the owner ID number (10 digits, starts with 1 or 2)"); return; }
    if (!ownerDoc) { setError(ar ? "أرفق صورة هوية المالك" : "Attach the owner ID document"); return; }
    if (!pledgeChecked) { setError(ar ? "يجب الموافقة على التعهد أولاً" : "You must accept the pledge first"); return; }
    if (!amanaId) { setError(ar ? "اختر الأمانة التابع لها" : "Select the Amana"); return; }
    if (!cityId) { setError(ar ? "اختر المدينة" : "Select the city"); return; }
    // اسم المسؤول وجواله إلزاميان — يُعتمدان لهوية الحساب في لوحة التحكم
    if (fullName.trim().length < 2) { setError(ar ? "اسم المسؤول مطلوب" : "Contact name is required"); return; }
    if (!/^\d{8}$/.test(phone)) { setError(ar ? "أكمل رقم الجوال: 8 أرقام بعد ‎+966 5" : "Complete the mobile: 8 digits after +966 5"); return; }
    if (otpAvailable && otpStep !== "verified") { setError(ar ? "تحقق من رقم الجوال أولاً (زر إرسال الرمز)" : "Verify your mobile number first"); return; }

    if (!token) {
      if (!/^\S+@\S+\.\S+$/.test(email)) { setError(ar ? "البريد الإلكتروني غير صالح" : "Invalid email"); return; }
      if (!pwStrong) { setError(ar ? "أكمل شروط كلمة المرور القوية (انظر الإرشادات أسفل الحقل)" : "Meet all the strong-password requirements"); return; }
      if (password !== password2) { setError(ar ? "كلمتا المرور غير متطابقتين — أعد إدخالهما" : "Passwords do not match"); return; }
    }
    // تأكيد البريد إلزامي — سواء سجّل الشريك بحساب Google أو أدخل بريده بنفسه
    if (emailOtpAvailable && emailStep !== "verified") {
      setError(ar ? "أكّد بريدك الإلكتروني أولاً (زر إرسال رمز التأكيد)" : "Confirm your email first (send code button)");
      return;
    }

    setSubmitting(true);
    try {
      if (token) {
        // مسجَّل دخوله — تقديم الطلب على الحساب الحالي
        const res = await fetch("/api/partners", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            entityType,
            fullName: fullName.trim(),
            phone: "+9665" + phone,
            ...(phoneProof ? { phoneProof } : {}),
            ...(emailProof ? { emailProof } : {}),
            companyName: companyName.trim(),
            crNumberType,
            crNumber: crNumber.trim(),
            crDocPath: crDoc!.path,
            crDocProof: crDoc!.proof,
            ownerIdNumber: ownerIdNumber.trim(),
            ownerIdDocPath: ownerDoc!.path,
            ownerIdDocProof: ownerDoc!.proof,
            pledgeAccepted: true,
            amanaId,
            cityId,
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) { setError(j.error ?? (ar ? "تعذّر إرسال الطلب" : "Failed to submit")); return; }
      } else {
        // زائر جديد — إنشاء الحساب وتقديم الطلب بخطوة واحدة
        const res = await fetch("/api/partners/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: email.trim(),
            ...(emailProof ? { emailProof } : {}),
            password,
            entityType,
            companyName: companyName.trim(),
            crNumberType,
            crNumber: crNumber.trim(),
            crDocPath: crDoc!.path,
            crDocProof: crDoc!.proof,
            ownerIdNumber: ownerIdNumber.trim(),
            ownerIdDocPath: ownerDoc!.path,
            ownerIdDocProof: ownerDoc!.proof,
            pledgeAccepted: true,
            amanaId,
            cityId,
            phone: "+9665" + phone,
            ...(phoneProof ? { phoneProof } : {}),
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) { setError(j.error ?? (ar ? "تعذّر إرسال الطلب" : "Failed to submit")); return; }
        // دخول تلقائي بالحساب الجديد
        await supabase.auth.signInWithPassword({ email: email.trim(), password }).catch(() => {});
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  const page = (content: React.ReactNode) => (
    <div dir={ar ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: "transparent", fontFamily: "Tajawal, Cairo, sans-serif", padding: "3rem 1.5rem" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <Link href={"/" + locale} style={{ textDecoration: "none", display: "inline-flex", alignItems: "flex-start", gap: "1.1rem", marginBottom: "2rem" }}>
          {ar ? (
            /* ترتيب رباعي كالتصميم — الرمز فوق الدومين، «إعلاني» فوق الوصف، بارتفاع متساوٍ */
            <>
              <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
                <span style={{ height: 60, display: "flex", alignItems: "center" }}>
                  <img src="/brand/e3lani-mark.svg" alt="إعلاني" style={{ height: 60, width: "auto", display: "block" }} />
                </span>
                <span dir="ltr" style={{ fontSize: "0.78rem", color: "#EBCB7C", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 800 }}>E3LANI.COM</span>
              </span>
              <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
                <span style={{ height: 60, display: "flex", alignItems: "center" }}>
                  <img src="/brand/e3lani-word.svg" alt="إعلاني" style={{ height: 60, width: "auto", display: "block" }} />
                </span>
                <span style={{ fontSize: "0.95rem", color: "#634E40", fontWeight: 600, whiteSpace: "nowrap" }}>سوق الدعاية والإعلان</span>
              </span>
            </>
          ) : (
            <>
              <BrandMark size={72} />
              <span>
                <span style={{ display: "block", fontFamily: "var(--font-brand), 'IBM Plex Sans Arabic', sans-serif", fontSize: "1.15rem", fontWeight: 700, lineHeight: 1.25, ...GT }}>
                  E3lani
                </span>
                <span style={{ display: "block", fontSize: "0.6rem", color: "#909090" }}>Advertising &amp; Signage Market</span>
              </span>
            </>
          )}
        </Link>
        {content}
      </div>
    </div>
  );

  if (loading) {
    return page(<p style={{ color: "#888" }}>{ar ? "جاري التحميل..." : "Loading..."}</p>);
  }

  if (application) {
    const typeLabel = ENTITY_TYPES.find((t) => t.value === application.type);
    return page(
      <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid rgba(201,162,75,0.2)`, borderRadius: 16, padding: "2.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{application.verified ? "✅" : "⏳"}</div>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#2C1E15", margin: "0 0 0.5rem" }}>
          {application.verified
            ? (ar ? "عضويتك مفعّلة" : "Your membership is active")
            : (ar ? "طلبك قيد المراجعة" : "Your application is under review")}
        </h1>
        <p style={{ color: "#999", fontSize: "0.95rem", margin: 0 }}>
          {application.companyName} — {ar ? typeLabel?.ar : typeLabel?.en}
        </p>
        {!application.verified && (
          <p style={{ color: "#777", fontSize: "0.85rem", marginTop: "1.25rem" }}>
            {ar
              ? "سيتم إعلامك بتفعيل الحساب بعد مراجعة البيانات من فريق إدارة الموقع."
              : "You will be notified once your account is activated after our team reviews your information."}
          </p>
        )}
      </div>
    );
  }

  if (done) {
    return page(
      <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid rgba(201,162,75,0.2)`, borderRadius: 16, padding: "2.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🎉</div>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#2C1E15", margin: "0 0 0.5rem" }}>
          {ar ? "تم استلام طلب الانضمام" : "Application received"}
        </h1>
        <p style={{ color: "#999", fontSize: "0.95rem", margin: 0 }}>
          {ar
            ? "سيتم إعلامك بتفعيل الحساب بعد مراجعة البيانات من فريق إدارة الموقع."
            : "You will be notified once your account is activated after our team reviews your information."}
        </p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "0.7rem 1rem", borderRadius: 10,
    border: "1.5px solid rgba(201,162,75,0.2)", background: "rgba(255,255,255,0.04)",
    color: "#eee", fontSize: "0.9rem", outline: "none", fontFamily: "Tajawal, Cairo, sans-serif",
  };
  // خيارات القوائم المنسدلة — خلفية ذهبية (الهوية) ونص أسود واضح
  const optionStyle: React.CSSProperties = {
    background: GOLD, color: "#2C1E15", fontWeight: 700,
  };
  const labelStyle: React.CSSProperties = { display: "block", color: "#bbb", fontSize: "0.82rem", fontWeight: 700, marginBottom: "0.4rem" };
  const sectionTitleStyle: React.CSSProperties = { color: GOLD, fontSize: "0.9rem", fontWeight: 800, margin: "0 0 0.25rem" };

  // صندوق رفع مستند — يُستخدم للسجل التجاري وهوية المالك
  const docBox = (
    doc: UploadedDoc,
    busy: boolean,
    err: string | null,
    onFile: (f: File) => void,
    onRemove: () => void
  ) => (
    <>
      {doc ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.7rem 1rem", borderRadius: 10, border: "1.5px solid rgba(100,200,100,0.45)", background: "rgba(100,200,100,0.06)" }}>
          <span style={{ color: "#6dcc6d", fontWeight: 700, fontSize: "0.85rem" }}>✓</span>
          <span dir="ltr" style={{ color: "#ccc", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{doc.name}</span>
          <button type="button" onClick={onRemove}
            style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "0.78rem", fontFamily: "Tajawal, Cairo, sans-serif", fontWeight: 700 }}>
            {ar ? "إزالة" : "Remove"}
          </button>
        </div>
      ) : (
        <label style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
          padding: "0.7rem 1rem", borderRadius: 10, cursor: busy ? "wait" : "pointer",
          border: "1.5px dashed rgba(201,162,75,0.35)", background: "rgba(201,162,75,0.04)",
          color: GOLD, fontSize: "0.82rem", fontWeight: 700,
        }}>
          <span>📎</span>
          <span>{busy ? (ar ? "جاري الرفع..." : "Uploading...") : (ar ? "اضغط لرفع الصورة (صورة أو PDF — حتى 5MB)" : "Click to upload (image or PDF — up to 5MB)")}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            style={{ display: "none" }}
            disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
          />
        </label>
      )}
      {err && (
        <p style={{ color: "#f87171", fontSize: "0.76rem", margin: "0.45rem 0 0" }}>{err}</p>
      )}
    </>
  );

  return page(
    <>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#2C1E15", margin: "0 0 0.5rem" }}>
        {ar ? "انضم كشريك" : "Join as a Partner"}
      </h1>
      <p style={{ color: "#999", fontSize: "0.95rem", margin: "0 0 2rem" }}>
        {ar
          ? "اختر نوع منشأتك وقدّم بياناتها — سيتم إعلامك بتفعيل الحساب بعد مراجعة البيانات من فريق إدارة الموقع."
          : "Select your entity type and submit its details — you will be notified once your account is activated after our team reviews your information."}
      </p>

      {checkingApp && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#888", fontSize: "0.78rem", margin: "-1.25rem 0 1.5rem" }}>
          <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", border: "2px solid rgba(201,162,75,0.3)", borderTopColor: GOLD, animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          {ar ? "جاري التحقق من وجود طلب سابق على حسابك..." : "Checking for an existing application on your account..."}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.9rem", marginBottom: "2rem" }}>
        {ENTITY_TYPES.map((t) => {
          const selected = entityType === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setEntityType(t.value)}
              style={{
                textAlign: ar ? "right" : "left", cursor: "pointer", padding: "1.1rem",
                borderRadius: 14, fontFamily: "Tajawal, Cairo, sans-serif",
                border: selected ? `2px solid ${GOLD}` : "1.5px solid rgba(201,162,75,0.18)",
                background: selected ? "rgba(201,162,75,0.08)" : "rgba(255,255,255,0.03)",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{t.icon}</div>
              <div style={{ color: selected ? GOLD : "#eee", fontWeight: 800, fontSize: "0.92rem", marginBottom: "0.35rem" }}>
                {ar ? t.ar : t.en}
              </div>
              <div style={{ color: "#888", fontSize: "0.78rem", lineHeight: 1.6 }}>
                {ar ? t.descAr : t.descEn}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,162,75,0.15)", borderRadius: 16, padding: "1.75rem", display: "grid", gap: "1.1rem" }}>

        {!token && (
          <>
            <div style={sectionTitleStyle}>{ar ? "بيانات الحساب" : "Account details"}</div>

            {/* تسجيل سريع بحساب Google — يعود لنفس الصفحة لإكمال البيانات */}
            <GoogleButton locale={locale} mode="register" next={`/${locale}/join`} />
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#666", fontSize: "0.75rem" }}>
              <span style={{ flex: 1, height: 1, background: "rgba(201,162,75,0.12)" }} />
              <span>{ar ? "أو أنشئ حساباً بالبريد" : "or create an account with email"}</span>
              <span style={{ flex: 1, height: 1, background: "rgba(201,162,75,0.12)" }} />
            </div>

            {/* البريد + زر رمز التأكيد */}
            <div>
              <label style={labelStyle}>{ar ? "البريد الإلكتروني" : "Email"}</label>
              <div dir="ltr" style={{ display: "flex", alignItems: "stretch" }}>
                <input
                  style={{
                    ...inputStyle,
                    borderRadius: emailOtpAvailable ? "10px 0 0 10px" : 10,
                    ...(emailStep === "verified" ? { borderColor: "rgba(100,200,100,0.45)" } : {}),
                  }}
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="email@company.com" type="email" autoComplete="email"
                  readOnly={emailStep === "verified"}
                />
                {emailOtpAvailable && (
                  emailStep === "verified" ? (
                    <span style={{
                      display: "flex", alignItems: "center", gap: "0.3rem", padding: "0 0.9rem",
                      borderRadius: "0 10px 10px 0", border: "1.5px solid rgba(100,200,100,0.45)", borderLeft: "none",
                      background: "rgba(100,200,100,0.08)", color: "#6dcc6d", fontSize: "0.78rem", fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}>
                      ✓ {ar ? "تم التأكيد" : "Confirmed"}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={sendEmailOtp}
                      disabled={emailBusy || emailResendIn > 0}
                      style={{
                        padding: "0 1rem", borderRadius: "0 10px 10px 0",
                        border: "1.5px solid rgba(201,162,75,0.4)", borderLeft: "none",
                        background: "rgba(201,162,75,0.12)", color: GOLD,
                        fontSize: "0.78rem", fontWeight: 800, fontFamily: "Tajawal, Cairo, sans-serif",
                        cursor: emailBusy || emailResendIn > 0 ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap", opacity: emailBusy ? 0.6 : 1,
                      }}
                    >
                      {emailBusy
                        ? "..."
                        : emailResendIn > 0
                        ? (ar ? `إعادة بعد ${emailResendIn}` : `Resend in ${emailResendIn}`)
                        : emailStep === "sent"
                        ? (ar ? "إعادة الإرسال" : "Resend")
                        : (ar ? "إرسال رمز التأكيد" : "Send code")}
                    </button>
                  )
                )}
              </div>

              {emailOtpAvailable && emailStep === "sent" && (
                <div style={{ marginTop: "0.75rem" }}>
                  <div dir="ltr" style={{ display: "flex", gap: "0.6rem" }}>
                    <input
                      style={{ ...inputStyle, maxWidth: 180, textAlign: "center", letterSpacing: "0.35em", fontWeight: 700 }}
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="••••••"
                      autoComplete="one-time-code"
                    />
                    <button
                      type="button"
                      onClick={verifyEmailOtp}
                      disabled={emailBusy}
                      style={{
                        background: G, color: "#2C1E15", fontWeight: 800, fontSize: "0.82rem",
                        padding: "0 1.4rem", borderRadius: 10, border: "none",
                        cursor: emailBusy ? "wait" : "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
                        opacity: emailBusy ? 0.7 : 1,
                      }}
                    >
                      {ar ? "تأكيد" : "Confirm"}
                    </button>
                  </div>
                  <p style={{ color: "#777", fontSize: "0.72rem", margin: "0.45rem 0 0" }}>
                    {ar ? "أدخل الرمز المرسل إلى بريدك الإلكتروني." : "Enter the code sent to your email."}
                    {emailDevCode && (
                      <span style={{ color: "#EBCB7C" }}>
                        {" "}{ar ? `(وضع التطوير — الرمز: ${emailDevCode})` : ` (dev mode — code: ${emailDevCode})`}
                      </span>
                    )}
                  </p>
                </div>
              )}
              {emailError && (
                <p style={{ color: "#f87171", fontSize: "0.76rem", margin: "0.45rem 0 0" }}>{emailError}</p>
              )}
            </div>

            {/* كلمة المرور + تأكيدها */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.1rem" }}>
              <div>
                <label style={labelStyle}>{ar ? "كلمة المرور" : "Password"}</label>
                <input style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" type="password" autoComplete="new-password" dir="ltr" />
              </div>
              <div>
                <label style={labelStyle}>{ar ? "تأكيد كلمة المرور" : "Confirm password"}</label>
                <input
                  style={{
                    ...inputStyle,
                    ...(password2.length > 0
                      ? { borderColor: pwMatch ? "rgba(100,200,100,0.45)" : "rgba(239,68,68,0.45)" }
                      : {}),
                  }}
                  value={password2} onChange={(e) => setPassword2(e.target.value)}
                  placeholder="••••••••" type="password" autoComplete="new-password" dir="ltr" />
                {password2.length > 0 && (
                  <p style={{ fontSize: "0.72rem", margin: "0.35rem 0 0", color: pwMatch ? "#6dcc6d" : "#f87171" }}>
                    {pwMatch
                      ? (ar ? "✓ كلمتا المرور متطابقتان" : "✓ Passwords match")
                      : (ar ? "✗ كلمتا المرور غير متطابقتين" : "✗ Passwords do not match")}
                  </p>
                )}
              </div>
            </div>

            {/* إرشادات كلمة المرور القوية — تتحول ✓ أثناء الكتابة */}
            <div style={{
              border: pwStrong ? "1px solid rgba(100,200,100,0.35)" : "1px solid rgba(201,162,75,0.15)",
              background: pwStrong ? "rgba(100,200,100,0.04)" : "rgba(255,255,255,0.02)",
              borderRadius: 10, padding: "0.7rem 1rem",
            }}>
              <div style={{ color: pwStrong ? "#6dcc6d" : "#bbb", fontSize: "0.76rem", fontWeight: 800, marginBottom: "0.4rem" }}>
                {pwStrong
                  ? (ar ? "✓ كلمة المرور قوية" : "✓ Strong password")
                  : (ar ? "شروط كلمة المرور القوية:" : "Strong password requirements:")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.25rem 1rem" }}>
                {pwRules.map((r, i) => (
                  <span key={i} style={{ fontSize: "0.74rem", color: r.ok ? "#6dcc6d" : "#888" }}>
                    {r.ok ? "✓" : "•"} {ar ? r.ar : r.en}
                  </span>
                ))}
              </div>
            </div>
            <p style={{ color: "#777", fontSize: "0.75rem", margin: 0 }}>
              {ar
                ? "لديك حساب بالفعل؟ "
                : "Already have an account? "}
              <Link href={`/${locale}/login?next=/${locale}/join`} style={{ color: GOLD }}>
                {ar ? "سجّل دخولك" : "Sign in"}
              </Link>
              {ar ? " ثم عُد لهذه الصفحة." : " then come back to this page."}
            </p>
            <div style={{ height: 1, background: "rgba(201,162,75,0.12)" }} />
          </>
        )}

        <div style={sectionTitleStyle}>{ar ? "بيانات المسؤول" : "Contact person"}</div>
        <p style={{ color: "#777", fontSize: "0.75rem", margin: "-0.5rem 0 0" }}>
          {ar
            ? "يُعتمد الاسم ورقم الجوال للتواصل والدخول إلى لوحة تحكم حسابك."
            : "The name and mobile number will be used for contact and your account dashboard."}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.1rem" }}>
          <div>
            <label style={labelStyle}>{ar ? "اسم المسؤول" : "Contact name"}</label>
            <input style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder={ar ? "الاسم الكامل" : "Full name"} autoComplete="name" />
          </div>
          <div>
            <label style={labelStyle}>{ar ? "رقم الجوال" : "Mobile number"}</label>
            <div dir="ltr" style={{ display: "flex", alignItems: "stretch" }}>
              <span style={{
                display: "flex", alignItems: "center", padding: "0 0.9rem",
                borderRadius: "10px 0 0 10px", border: "1.5px solid rgba(201,162,75,0.2)", borderRight: "none",
                background: "rgba(201,162,75,0.08)", color: GOLD, fontSize: "0.9rem", fontWeight: 700,
                whiteSpace: "nowrap", userSelect: "none",
              }}>
                +966
              </span>
              {/* الـ 5 ثابتة في بداية الأرقام المدخلة */}
              <span style={{
                display: "flex", alignItems: "center", paddingLeft: "0.9rem",
                borderTop: `1.5px solid ${otpStep === "verified" ? "rgba(100,200,100,0.45)" : "rgba(201,162,75,0.2)"}`,
                borderBottom: `1.5px solid ${otpStep === "verified" ? "rgba(100,200,100,0.45)" : "rgba(201,162,75,0.2)"}`,
                background: "rgba(255,255,255,0.04)", color: "#eee",
                fontSize: "0.9rem", letterSpacing: "0.12em", userSelect: "none",
              }}>
                5
              </span>
              <input
                style={{
                  ...inputStyle,
                  borderLeft: "none",
                  padding: "0.7rem 1rem 0.7rem 0.15rem",
                  borderRadius: otpAvailable ? "0" : "0 10px 10px 0",
                  letterSpacing: "0.12em",
                  ...(otpStep === "verified" ? { borderColor: "rgba(100,200,100,0.45)" } : {}),
                }}
                value={phone}
                onChange={(e) => onPhoneChange(e.target.value)}
                inputMode="numeric"
                maxLength={8}
                placeholder="XXXXXXXX"
                autoComplete="tel-national"
                readOnly={otpStep === "verified"}
              />
              {otpAvailable && (
                otpStep === "verified" ? (
                  <span style={{
                    display: "flex", alignItems: "center", gap: "0.3rem", padding: "0 0.9rem",
                    borderRadius: "0 10px 10px 0", border: "1.5px solid rgba(100,200,100,0.45)", borderLeft: "none",
                    background: "rgba(100,200,100,0.08)", color: "#6dcc6d", fontSize: "0.78rem", fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}>
                    ✓ {ar ? "تم التحقق" : "Verified"}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={otpBusy || resendIn > 0}
                    style={{
                      padding: "0 1rem", borderRadius: "0 10px 10px 0",
                      border: "1.5px solid rgba(201,162,75,0.4)", borderLeft: "none",
                      background: "rgba(201,162,75,0.12)", color: GOLD,
                      fontSize: "0.78rem", fontWeight: 800, fontFamily: "Tajawal, Cairo, sans-serif",
                      cursor: otpBusy || resendIn > 0 ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap", opacity: otpBusy ? 0.6 : 1,
                    }}
                  >
                    {otpBusy
                      ? (ar ? "..." : "...")
                      : resendIn > 0
                      ? (ar ? `إعادة بعد ${resendIn}` : `Resend in ${resendIn}`)
                      : otpStep === "sent"
                      ? (ar ? "إعادة الإرسال" : "Resend")
                      : (ar ? "إرسال الرمز" : "Send code")}
                  </button>
                )
              )}
            </div>

            {otpAvailable && otpStep === "sent" && (
              <div style={{ marginTop: "0.75rem" }}>
                <div dir="ltr" style={{ display: "flex", gap: "0.6rem" }}>
                  <input
                    style={{ ...inputStyle, maxWidth: 180, textAlign: "center", letterSpacing: "0.35em", fontWeight: 700 }}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••••"
                    autoComplete="one-time-code"
                  />
                  <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={otpBusy}
                    style={{
                      background: G, color: "#2C1E15", fontWeight: 800, fontSize: "0.82rem",
                      padding: "0 1.4rem", borderRadius: 10, border: "none",
                      cursor: otpBusy ? "wait" : "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
                      opacity: otpBusy ? 0.7 : 1,
                    }}
                  >
                    {ar ? "تحقق" : "Verify"}
                  </button>
                </div>
                <p style={{ color: "#777", fontSize: "0.72rem", margin: "0.45rem 0 0" }}>
                  {ar ? "أدخل الرمز المرسل إلى جوالك عبر رسالة نصية." : "Enter the code sent to your mobile via SMS."}
                  {devCode && (
                    <span style={{ color: "#EBCB7C" }}>
                      {" "}{ar ? `(وضع التطوير — الرمز: ${devCode})` : ` (dev mode — code: ${devCode})`}
                    </span>
                  )}
                </p>
              </div>
            )}

            {otpError && (
              <p style={{ color: "#f87171", fontSize: "0.76rem", margin: "0.45rem 0 0" }}>{otpError}</p>
            )}
          </div>
        </div>
        <div style={{ height: 1, background: "rgba(201,162,75,0.12)" }} />

        {token && userEmail && (
          <div style={{
            background: "rgba(201,162,75,0.06)",
            border: emailStep === "verified" ? "1px solid rgba(100,200,100,0.4)" : "1px solid rgba(201,162,75,0.2)",
            borderRadius: 10, padding: "0.65rem 1rem", fontSize: "0.82rem", color: "#ccc",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span>✉️</span>
              <span style={{ flex: 1 }}>
                {ar ? "البريد الإلكتروني: " : "Email: "}
                <span dir="ltr" style={{ color: GOLD, fontWeight: 700 }}>{userEmail}</span>
              </span>
              {/* تأكيد البريد إلزامي — يشمل من سجّل بحساب Google */}
              {emailOtpAvailable && (
                emailStep === "verified" ? (
                  <span style={{ color: "#6dcc6d", fontWeight: 700, fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                    ✓ {ar ? "تم تأكيد البريد" : "Email confirmed"}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={sendEmailOtp}
                    disabled={emailBusy || emailResendIn > 0}
                    style={{
                      padding: "0.35rem 0.9rem", borderRadius: 999,
                      border: "1.5px solid rgba(201,162,75,0.4)",
                      background: "rgba(201,162,75,0.12)", color: GOLD,
                      fontSize: "0.76rem", fontWeight: 800, fontFamily: "Tajawal, Cairo, sans-serif",
                      cursor: emailBusy || emailResendIn > 0 ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap", opacity: emailBusy ? 0.6 : 1,
                    }}
                  >
                    {emailBusy
                      ? "..."
                      : emailResendIn > 0
                      ? (ar ? `إعادة بعد ${emailResendIn}` : `Resend in ${emailResendIn}`)
                      : emailStep === "sent"
                      ? (ar ? "إعادة الإرسال" : "Resend")
                      : (ar ? "إرسال رمز التأكيد" : "Send confirmation code")}
                  </button>
                )
              )}
            </div>

            {emailOtpAvailable && emailStep === "sent" && (
              <div style={{ marginTop: "0.75rem" }}>
                <div dir="ltr" style={{ display: "flex", gap: "0.6rem" }}>
                  <input
                    style={{ ...inputStyle, maxWidth: 180, textAlign: "center", letterSpacing: "0.35em", fontWeight: 700 }}
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••••"
                    autoComplete="one-time-code"
                  />
                  <button
                    type="button"
                    onClick={verifyEmailOtp}
                    disabled={emailBusy}
                    style={{
                      background: G, color: "#2C1E15", fontWeight: 800, fontSize: "0.82rem",
                      padding: "0 1.4rem", borderRadius: 10, border: "none",
                      cursor: emailBusy ? "wait" : "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
                      opacity: emailBusy ? 0.7 : 1,
                    }}
                  >
                    {ar ? "تأكيد" : "Confirm"}
                  </button>
                </div>
                <p style={{ color: "#777", fontSize: "0.72rem", margin: "0.45rem 0 0" }}>
                  {ar ? "أدخل الرمز المرسل إلى بريدك الإلكتروني." : "Enter the code sent to your email."}
                  {emailDevCode && (
                    <span style={{ color: "#EBCB7C" }}>
                      {" "}{ar ? `(وضع التطوير — الرمز: ${emailDevCode})` : ` (dev mode — code: ${emailDevCode})`}
                    </span>
                  )}
                </p>
              </div>
            )}
            {emailError && (
              <p style={{ color: "#f87171", fontSize: "0.76rem", margin: "0.45rem 0 0" }}>{emailError}</p>
            )}
          </div>
        )}

        <div style={sectionTitleStyle}>{ar ? "بيانات المنشأة" : "Company details"}</div>
        <div>
          <label style={labelStyle}>{ar ? "اسم المنشأة (كما في السجل التجاري)" : "Company name (as in CR)"}</label>
          <input style={inputStyle} value={companyName} onChange={(e) => setCompanyName(e.target.value)}
            placeholder={ar ? "مثال: وكالة الوطن للدعاية والإعلان" : "e.g. Al-Watan Advertising Agency"} />
        </div>
        {/* خياران للإدخال: السجل التجاري أو الرقم الموحد */}
        <div>
          <label style={labelStyle}>{ar ? "نوع رقم المنشأة" : "Establishment number type"}</label>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            {([
              { v: "CR" as const, arL: "رقم السجل التجاري", enL: "CR number" },
              { v: "UNIFIED" as const, arL: "الرقم الموحد للمنشأة", enL: "Unified number" },
            ]).map((o) => {
              const selected = crNumberType === o.v;
              return (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setCrNumberType(o.v)}
                  style={{
                    padding: "0.5rem 1.1rem", borderRadius: 999, cursor: "pointer",
                    fontFamily: "Tajawal, Cairo, sans-serif", fontSize: "0.82rem", fontWeight: 800,
                    border: selected ? `1.5px solid ${GOLD}` : "1.5px solid rgba(201,162,75,0.25)",
                    background: selected ? "rgba(201,162,75,0.14)" : "rgba(255,255,255,0.03)",
                    color: selected ? GOLD : "#999",
                  }}
                >
                  {ar ? o.arL : o.enL}
                </button>
              );
            })}
          </div>
        </div>

        {/* الرقم + صورة السجل التجاري في نفس الصف */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.1rem", alignItems: "start" }}>
          <div>
            <label style={labelStyle}>
              {crNumberType === "CR"
                ? (ar ? "رقم السجل التجاري" : "CR number")
                : (ar ? "الرقم الموحد للمنشأة" : "Unified establishment number")}
            </label>
            <input style={inputStyle} value={crNumber}
              onChange={(e) => setCrNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
              inputMode="numeric" maxLength={10}
              placeholder="XXXXXXXXXX"
              dir="ltr" />
          </div>
          <div>
            <label style={labelStyle}>{ar ? "صورة السجل التجاري" : "CR document"}</label>
            {docBox(crDoc, crDocBusy, crDocError, uploadCrDoc, () => setCrDoc(null))}
          </div>
        </div>

        {/* رقم هوية المالك + صورتها في نفس الصف */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.1rem", alignItems: "start" }}>
          <div>
            <label style={labelStyle}>{ar ? "رقم هوية المالك" : "Owner ID number"}</label>
            <input style={inputStyle} value={ownerIdNumber}
              onChange={(e) => setOwnerIdNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
              inputMode="numeric" maxLength={10}
              placeholder="XXXXXXXXXX"
              dir="ltr" />
          </div>
          <div>
            <label style={labelStyle}>{ar ? "صورة هوية المالك" : "Owner ID document"}</label>
            {docBox(ownerDoc, ownerDocBusy, ownerDocError, uploadOwnerDoc, () => setOwnerDoc(null))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.1rem" }}>
          <div>
            <label style={labelStyle}>{ar ? "الأمانة التابع لها" : "Amana (region)"}</label>
            <select
              style={{ ...inputStyle, appearance: "auto" }}
              value={amanaId}
              onChange={(e) => { setAmanaId(e.target.value); setCityId(""); }}
            >
              <option value="" style={optionStyle}>
                {amanat.length === 0
                  ? (ar ? "جاري التحميل..." : "Loading...")
                  : (ar ? "اختر الأمانة..." : "Select Amana...")}
              </option>
              {amanat.map((a) => (
                <option key={a.id} value={a.id} style={optionStyle}>{ar ? a.nameAr : a.nameEn}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{ar ? "المدينة" : "City"}</label>
            <select
              style={{ ...inputStyle, appearance: "auto", opacity: selectedAmana ? 1 : 0.55 }}
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              disabled={!selectedAmana}
            >
              <option value="" style={optionStyle}>
                {!selectedAmana
                  ? (ar ? "اختر الأمانة أولاً" : "Select the Amana first")
                  : (ar ? "اختر المدينة..." : "Select city...")}
              </option>
              {selectedAmana?.cities.map((c) => (
                <option key={c.id} value={c.id} style={optionStyle}>{ar ? c.nameAr : c.nameEn}</option>
              ))}
            </select>
          </div>
        </div>

        {/* التعهد — الموافقة إلزامية، والشروط تُعرض من لوحة التحكم */}
        <div style={{ border: pledgeChecked ? "1px solid rgba(100,200,100,0.4)" : "1px solid rgba(201,162,75,0.25)", borderRadius: 10, padding: "0.8rem 1rem", background: pledgeChecked ? "rgba(100,200,100,0.05)" : "rgba(201,162,75,0.04)" }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem", cursor: "pointer", color: "#ccc", fontSize: "0.85rem", lineHeight: 1.7 }}>
            <input
              type="checkbox"
              checked={pledgeChecked}
              onChange={(e) => setPledgeChecked(e.target.checked)}
              style={{ accentColor: GOLD, width: 17, height: 17, marginTop: 3, flexShrink: 0, cursor: "pointer" }}
            />
            <span>
              {ar ? "أقرّ وأتعهد بالالتزام بشروط " : "I acknowledge and agree to the "}
              <button
                type="button"
                onClick={() => setPledgeOpen(true)}
                style={{ background: "none", border: "none", color: GOLD, fontWeight: 800, cursor: "pointer", padding: 0, fontFamily: "Tajawal, Cairo, sans-serif", fontSize: "0.85rem", textDecoration: "underline" }}
              >
                {ar ? "تعهد الشركاء" : "Partner Pledge"}
              </button>
              {ar ? " — اضغط على الرابط للاطلاع على الشروط كاملة." : " — click the link to view the full terms."}
            </span>
          </label>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", borderRadius: 10, padding: "0.7rem 1rem", fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          style={{
            background: G, color: "#2C1E15", fontWeight: 800, fontSize: "0.95rem",
            padding: "0.85rem", borderRadius: 999, border: "none",
            cursor: submitting ? "wait" : "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? (ar ? "جاري الإرسال..." : "Submitting...") : (ar ? "إرسال طلب الانضمام" : "Submit Application")}
        </button>
      </div>

      {/* نافذة الاطلاع على التعهد */}
      {pledgeOpen && (
        <div
          onClick={() => setPledgeOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            dir={ar ? "rtl" : "ltr"}
            style={{ background: "#F4EFE6", border: "1px solid rgba(201,162,75,0.35)", borderRadius: 16, padding: "1.75rem", maxWidth: 580, width: "100%", maxHeight: "80vh", overflowY: "auto", fontFamily: "Tajawal, Cairo, sans-serif" }}
          >
            <h2 style={{ color: GOLD, fontSize: "1.1rem", fontWeight: 900, margin: "0 0 0.75rem" }}>
              📜 {ar ? "تعهد الشركاء" : "Partner Pledge"}
            </h2>
            <p style={{ color: "#bbb", fontSize: "0.85rem", margin: "0 0 1rem", lineHeight: 1.8 }}>
              {ar
                ? "أتعهد بصفتي ممثلاً نظامياً للمنشأة، عند الانضمام لسوق الدعاية والإعلان، بالالتزام بما يلي:"
                : "As the authorized representative of the establishment, by joining E3lani I pledge to comply with the following:"}
            </p>
            {pledgeTerms.length === 0 ? (
              <p style={{ color: "#888", fontSize: "0.85rem" }}>{ar ? "جاري تحميل الشروط..." : "Loading terms..."}</p>
            ) : (
              <ol style={{ margin: 0, paddingInlineStart: "1.4rem", display: "grid", gap: "0.6rem", listStyleType: "decimal" }}>
                {pledgeTerms.map((t) => (
                  <li key={t.id} style={{ color: "#ddd", fontSize: "0.87rem", lineHeight: 1.8 }}>
                    {ar ? t.textAr : (t.textEn || t.textAr)}
                  </li>
                ))}
              </ol>
            )}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={() => { setPledgeChecked(true); setPledgeOpen(false); }}
                style={{ flex: 1, background: G, color: "#2C1E15", fontWeight: 800, fontSize: "0.88rem", padding: "0.7rem", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}
              >
                {ar ? "أوافق وأتعهد" : "I agree and pledge"}
              </button>
              <button
                type="button"
                onClick={() => setPledgeOpen(false)}
                style={{ background: "none", border: "1.5px solid rgba(201,162,75,0.3)", color: "#bbb", fontWeight: 700, fontSize: "0.88rem", padding: "0.7rem 1.4rem", borderRadius: 999, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}
              >
                {ar ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
