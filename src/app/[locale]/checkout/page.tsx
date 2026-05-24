"use client";

import { useState, useCallback } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { clsx } from "clsx";
import { useCart } from "@/store/cartStore";
import { formatSAR, formatUSD } from "@/lib/priceCalculator";
import type { Locale } from "@/lib/i18n";

// ─────────────────────────────────────────────────────────────
// Translations
// ─────────────────────────────────────────────────────────────
const T = {
  ar: {
    title: "إتمام الشراء",
    backToCart: "العودة للسلة",
    step1: "بيانات العميل",
    step2: "طريقة الدفع",
    step3: "تأكيد الطلب",
    // Customer info
    customerInfo: "بيانات العميل",
    fullName: "الاسم الكامل",
    fullNamePh: "أدخل اسمك الكامل",
    mobile: "رقم الجوال",
    mobilePh: "05XXXXXXXX",
    email: "البريد الإلكتروني (اختياري)",
    emailPh: "example@email.com",
    city: "المدينة",
    cityPh: "اختر المدينة",
    district: "الحي",
    districtPh: "اسم الحي",
    street: "الشارع",
    streetPh: "اسم الشارع ورقم المبنى",
    zipCode: "الرمز البريدي",
    zipCodePh: "XXXXX",
    notes: "ملاحظات للتوصيل",
    notesPh: "أي تعليمات خاصة للتوصيل...",
    // Payment
    paymentMethod: "طريقة الدفع",
    payMada: "مدى",
    payMadaDesc: "الدفع الفوري ببطاقة مدى",
    payVisa: "فيزا / ماستركارد",
    payVisaDesc: "بطاقة ائتمان أو مدين",
    payTabby: "تابي — اشتري الآن وادفع لاحقاً",
    payTabbyDesc: "4 أقساط بدون فوائد",
    payTamara: "تمارا — أقساط ميسّرة",
    payTamaraDesc: "3 أو 6 أقساط شهرية",
    payApple: "Apple Pay",
    payAppleDesc: "الدفع السريع عبر Apple Pay",
    payTransfer: "تحويل بنكي",
    payTransferDesc: "IBAN المصرف الأهلي",
    payWhatsapp: "دفع عند الاستلام / واتساب",
    payWhatsappDesc: "تواصل معنا للترتيب",
    // Summary
    orderSummary: "ملخص الطلب",
    subtotal: "المجموع الجزئي",
    shipping: "الشحن",
    shippingFree: "مجاني",
    vat: "ضريبة القيمة المضافة",
    discount: "خصم",
    total: "الإجمالي",
    currency: "ر.س",
    currencyUSD: "USD",
    // Buttons
    nextStep: "الخطوة التالية",
    prevStep: "السابق",
    placeOrder: "تأكيد وإتمام الطلب",
    processing: "جاري معالجة الطلب...",
    // Validation
    required: "هذا الحقل مطلوب",
    invalidMobile: "رقم الجوال غير صحيح (يجب أن يبدأ بـ 05)",
    invalidEmail: "البريد الإلكتروني غير صحيح",
    selectPayment: "يرجى اختيار طريقة الدفع",
    // Success
    successTitle: "تم استلام طلبك! 🎉",
    successDesc: "سيتواصل معك فريقنا خلال ساعات لتأكيد الطلب وتفاصيل الدفع.",
    successOrderNum: "رقم الطلب",
    successWhatsapp: "تتبع طلبك عبر واتساب",
    successBack: "العودة للرئيسية",
    // Cities
    cities: ["جدة", "الرياض", "مكة المكرمة", "المدينة المنورة", "الدمام", "الخبر", "الطائف", "أبها", "تبوك", "حائل", "القصيم", "جازان", "نجران", "الباحة", "عرعر"],
    pcs: "قطعة",
    mm: "ملم",
    cm: "سم",
  },
  en: {
    title: "Checkout",
    backToCart: "Back to Cart",
    step1: "Customer Info",
    step2: "Payment Method",
    step3: "Confirm Order",
    customerInfo: "Customer Information",
    fullName: "Full Name",
    fullNamePh: "Enter your full name",
    mobile: "Mobile Number",
    mobilePh: "05XXXXXXXX",
    email: "Email Address (optional)",
    emailPh: "example@email.com",
    city: "City",
    cityPh: "Select City",
    district: "District",
    districtPh: "District name",
    street: "Street",
    streetPh: "Street name and building number",
    zipCode: "ZIP Code",
    zipCodePh: "XXXXX",
    notes: "Delivery Notes",
    notesPh: "Any special delivery instructions...",
    paymentMethod: "Payment Method",
    payMada: "Mada",
    payMadaDesc: "Instant payment via Mada card",
    payVisa: "Visa / Mastercard",
    payVisaDesc: "Credit or debit card",
    payTabby: "Tabby — Buy Now, Pay Later",
    payTabbyDesc: "4 interest-free installments",
    payTamara: "Tamara — Easy Installments",
    payTamaraDesc: "3 or 6 monthly payments",
    payApple: "Apple Pay",
    payAppleDesc: "Fast checkout with Apple Pay",
    payTransfer: "Bank Transfer",
    payTransferDesc: "IBAN: Al Rajhi / NCB",
    payWhatsapp: "Cash on Delivery / WhatsApp",
    payWhatsappDesc: "Contact us to arrange",
    orderSummary: "Order Summary",
    subtotal: "Subtotal",
    shipping: "Shipping",
    shippingFree: "Free",
    vat: "VAT (15%)",
    discount: "Discount",
    total: "Total",
    currency: "SAR",
    currencyUSD: "USD",
    nextStep: "Next Step",
    prevStep: "Previous",
    placeOrder: "Confirm & Place Order",
    processing: "Processing your order...",
    required: "This field is required",
    invalidMobile: "Invalid mobile number (must start with 05)",
    invalidEmail: "Invalid email address",
    selectPayment: "Please select a payment method",
    successTitle: "Order Received! 🎉",
    successDesc: "Our team will contact you within hours to confirm the order and payment details.",
    successOrderNum: "Order Number",
    successWhatsapp: "Track your order via WhatsApp",
    successBack: "Back to Home",
    cities: ["Jeddah", "Riyadh", "Makkah", "Madinah", "Dammam", "Khobar", "Taif", "Abha", "Tabuk", "Hail", "Qassim", "Jizan", "Najran", "Baha", "Arar"],
    pcs: "pcs",
    mm: "mm",
    cm: "cm",
  },
};

// ─────────────────────────────────────────────────────────────
// Payment Gateways Config
// ─────────────────────────────────────────────────────────────
interface PaymentGateway {
  id: string;
  logo: string;
  color: string;
  border: string;
  badge?: string;
  redirectToGateway?: boolean;
}

const GATEWAYS: PaymentGateway[] = [
  { id: "mada",     logo: "🟢", color: "from-green-900/40 to-green-950/60", border: "border-green-500/30", badge: "محلي" },
  { id: "visa",     logo: "💳", color: "from-blue-900/40 to-blue-950/60",  border: "border-blue-500/30" },
  { id: "tabby",    logo: "⚡", color: "from-purple-900/40 to-purple-950/60", border: "border-purple-500/30", badge: "BNPL" },
  { id: "tamara",   logo: "🌙", color: "from-indigo-900/40 to-indigo-950/60", border: "border-indigo-500/30", badge: "BNPL" },
  { id: "apple",    logo: "🍎", color: "from-zinc-800/40 to-zinc-900/60",  border: "border-zinc-500/30" },
  { id: "transfer", logo: "🏦", color: "from-amber-900/40 to-amber-950/60", border: "border-amber-500/30" },
  { id: "whatsapp", logo: "💬", color: "from-emerald-900/40 to-emerald-950/60", border: "border-emerald-500/30" },
];

// ─────────────────────────────────────────────────────────────
// Form field types
// ─────────────────────────────────────────────────────────────
interface CustomerForm {
  fullName:  string;
  mobile:    string;
  email:     string;
  city:      string;
  district:  string;
  street:    string;
  zipCode:   string;
  notes:     string;
}

type FormErrors = Partial<Record<keyof CustomerForm, string>>;

// ─────────────────────────────────────────────────────────────
// Form Field Component
// ─────────────────────────────────────────────────────────────
function Field({
  label, required, error, children, isRTL,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode; isRTL: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className={clsx("flex items-center gap-1 text-sm font-semibold text-brand-off-white/80", isRTL ? "flex-row-reverse justify-end" : "flex-row")}>
        {label}
        {required && <span className="text-brand-gold text-xs">*</span>}
      </label>
      {children}
      {error && <p className={clsx("text-red-400 text-xs", isRTL ? "text-right" : "text-left")}>{error}</p>}
    </div>
  );
}

const inputCls = (isRTL: boolean, hasError?: boolean) => clsx(
  "w-full bg-brand-steel/60 border rounded-xl px-4 py-3 text-brand-off-white text-sm",
  "focus:outline-none transition-all duration-200 placeholder:text-brand-silver/25",
  isRTL ? "text-right" : "text-left",
  hasError ? "border-red-500/60 focus:border-red-500" : "border-brand-gold/15 focus:border-brand-gold/50 focus:bg-brand-steel/80"
);

// ─────────────────────────────────────────────────────────────
// Step Indicator
// ─────────────────────────────────────────────────────────────
function StepBar({ step, t, isRTL }: { step: number; t: typeof T["ar"]; isRTL: boolean }) {
  const steps = [t.step1, t.step2, t.step3];
  return (
    <div className={clsx("flex items-center justify-center gap-0 mb-10", isRTL ? "flex-row-reverse" : "flex-row")}>
      {steps.map((label, i) => {
        const num = i + 1;
        const active = step === num;
        const done = step > num;
        return (
          <div key={i} className={clsx("flex items-center", isRTL ? "flex-row-reverse" : "flex-row")}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={clsx(
                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300",
                active ? "border-brand-gold bg-brand-gold text-brand-charcoal scale-110" :
                done   ? "border-brand-gold bg-brand-gold/20 text-brand-gold" :
                         "border-brand-gold/20 bg-brand-steel/60 text-brand-silver/50"
              )}>
                {done ? "✓" : num}
              </div>
              <span className={clsx("text-[11px] font-medium whitespace-nowrap hidden sm:block",
                active ? "text-brand-gold" : done ? "text-brand-gold/70" : "text-brand-silver/40"
              )}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={clsx("w-16 sm:w-24 h-0.5 mx-2 transition-all duration-500",
                step > num + 1 ? "bg-brand-gold" : step > num ? "bg-brand-gold/50" : "bg-brand-gold/15"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Checkout Page
// ─────────────────────────────────────────────────────────────
export default function CheckoutPageClient() {
  const locale = useLocale() as Locale;
  const isRTL = locale === "ar";
  const t = T[locale] ?? T.ar;
  const lang = locale as "ar" | "en";
  const { state, totals, clearCart } = useCart();

  // Multi-step state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<CustomerForm>({
    fullName: "", mobile: "", email: "", city: "", district: "", street: "", zipCode: "", notes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [paymentError, setPaymentError] = useState("");

  const setField = useCallback((key: keyof CustomerForm, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: "" }));
  }, []);

  // ── Validation ──
  const validateStep1 = (): boolean => {
    const errs: FormErrors = {};
    if (!form.fullName.trim()) errs.fullName = t.required;
    if (!form.mobile.match(/^05\d{8}$/)) errs.mobile = t.invalidMobile;
    if (form.email && !form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = t.invalidEmail;
    if (!form.city) errs.city = t.required;
    if (!form.district.trim()) errs.district = t.required;
    if (!form.street.trim()) errs.street = t.required;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    if (!selectedPayment) { setPaymentError(t.selectPayment); return false; }
    setPaymentError("");
    return true;
  };

  // ── Navigation ──
  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step < 3) setStep(s => (s + 1) as 1 | 2 | 3);
  };

  const prevStep = () => { if (step > 1) setStep(s => (s - 1) as 1 | 2 | 3); };

  // ── Submit ──
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      /**
       * 🔌 PAYMENT GATEWAY INTEGRATION STUB
       * =====================================
       * Replace the setTimeout below with real gateway calls:
       *
       * ① Moyasar (recommended for SA):
       *    POST https://api.moyasar.com/v1/payments
       *    Headers: { Authorization: `Basic ${btoa(MOYASAR_PUBLISHABLE_KEY + ":")}` }
       *    Body: { amount: totals.totalSAR * 100, currency: "SAR", source: { type: "creditcard", ... } }
       *
       * ② HyperPay (bank card):
       *    POST https://eu-test.oppwa.com/v1/checkouts
       *    Body: { entityId, amount, currency: "SAR", paymentType: "DB" }
       *
       * ③ Tabby BNPL:
       *    POST https://api.tabby.ai/api/v2/checkout
       *    Body: { merchant_code, lang, payment: { amount, currency, buyer, order } }
       *
       * ④ Tamara BNPL:
       *    POST https://api.tamara.co/checkout
       *    Body: { order_reference_id, total_amount, items, consumer, ... }
       *
       * ⑤ STC Pay:
       *    POST https://b2b.stcpay.com.sa/b2b/payment/v1/
       *    Requires OAuth2 token from STC Pay merchant portal
       *
       * ⑥ After gateway callback/redirect:
       *    - Verify payment status server-side
       *    - Save order to your database
       *    - Send confirmation SMS via Taqnyat / Unifonic
       *    - Send confirmation email via Resend / Postmark
       */
      await new Promise(resolve => setTimeout(resolve, 2000));

      const orderNum = `MA-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      setOrderNumber(orderNum);
      clearCart();
    } catch (err) {
      console.error("Payment error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // Success screen
  // ─────────────────────────────────────────────────────────
  if (orderNumber) {
    return (
      <main className="min-h-screen bg-brand-charcoal pt-20 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center text-5xl mx-auto mb-6 animate-fade-up opacity-0 stagger-1" style={{ animationFillMode: "forwards" }}>
            ✅
          </div>
          <h1 className="text-2xl font-black text-brand-off-white mb-3 animate-fade-up opacity-0 stagger-2" style={{ animationFillMode: "forwards" }}>
            {t.successTitle}
          </h1>
          <p className="text-brand-silver/70 text-sm mb-4 animate-fade-up opacity-0 stagger-3" style={{ animationFillMode: "forwards" }}>
            {t.successDesc}
          </p>
          <div className="glass-card rounded-2xl p-5 mb-6 animate-fade-up opacity-0 stagger-4" style={{ animationFillMode: "forwards" }}>
            <p className="text-brand-silver/60 text-xs mb-1">{t.successOrderNum}</p>
            <p className="text-brand-gold font-black text-2xl font-mono">{orderNumber}</p>
          </div>
          <div className="flex flex-col gap-3 animate-fade-up opacity-0 stagger-5" style={{ animationFillMode: "forwards" }}>
            <a href={`https://wa.me/966500000000?text=${encodeURIComponent(isRTL ? `تتبع طلب رقم: ${orderNumber}` : `Track order: ${orderNumber}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 font-semibold hover:bg-green-500/15 transition-colors">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              {t.successWhatsapp}
            </a>
            <Link href={`/${locale}`} className="btn-secondary justify-center">{t.successBack}</Link>
          </div>
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────
  // Checkout layout
  // ─────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-brand-charcoal pt-20">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-brand-steel/40 to-brand-charcoal border-b border-brand-gold/10 py-8">
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: "linear-gradient(rgba(201,168,76,1) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,1) 1px,transparent 1px)",
          backgroundSize: "55px 55px",
        }} />
        <div className="section-container relative z-10">
          <nav className={clsx("flex items-center gap-2 text-xs text-brand-silver/50 mb-4 flex-wrap", isRTL ? "flex-row-reverse" : "flex-row")}>
            <Link href={`/${locale}`} className="hover:text-brand-gold transition-colors">{isRTL ? "الرئيسية" : "Home"}</Link>
            <span className={clsx("opacity-40", isRTL ? "rotate-180" : "")}>›</span>
            <Link href={`/${locale}/cart`} className="hover:text-brand-gold transition-colors">{isRTL ? "السلة" : "Cart"}</Link>
            <span className={clsx("opacity-40", isRTL ? "rotate-180" : "")}>›</span>
            <span className="text-brand-gold">{t.title}</span>
          </nav>
          <h1 className={clsx("text-2xl font-black text-brand-off-white", isRTL ? "text-right" : "text-left")}>{t.title}</h1>
        </div>
      </div>

      <div className="section-container py-8">
        {/* Step indicator */}
        <StepBar step={step} t={t} isRTL={isRTL} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-8 items-start">

          {/* ── Left: Steps ── */}
          <div className="min-w-0">

            {/* ─── STEP 1: Customer Info ─── */}
            {step === 1 && (
              <div className="glass-card rounded-2xl p-6 md:p-8 space-y-5">
                <h2 className={clsx("text-brand-gold font-bold text-base uppercase tracking-wider", isRTL ? "text-right" : "text-left")}>
                  {t.customerInfo}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={t.fullName} required error={errors.fullName} isRTL={isRTL}>
                    <input type="text" value={form.fullName} onChange={e => setField("fullName", e.target.value)}
                      placeholder={t.fullNamePh} className={inputCls(isRTL, !!errors.fullName)} />
                  </Field>
                  <Field label={t.mobile} required error={errors.mobile} isRTL={isRTL}>
                    <input type="tel" value={form.mobile} onChange={e => setField("mobile", e.target.value)}
                      placeholder={t.mobilePh} dir="ltr" className={clsx(inputCls(false, !!errors.mobile), "font-mono")} />
                  </Field>
                </div>

                <Field label={t.email} error={errors.email} isRTL={isRTL}>
                  <input type="email" value={form.email} onChange={e => setField("email", e.target.value)}
                    placeholder={t.emailPh} dir="ltr" className={inputCls(false, !!errors.email)} />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={t.city} required error={errors.city} isRTL={isRTL}>
                    <select value={form.city} onChange={e => setField("city", e.target.value)}
                      className={clsx(inputCls(isRTL, !!errors.city), "cursor-pointer")}>
                      <option value="">{t.cityPh}</option>
                      {t.cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label={t.district} required error={errors.district} isRTL={isRTL}>
                    <input type="text" value={form.district} onChange={e => setField("district", e.target.value)}
                      placeholder={t.districtPh} className={inputCls(isRTL, !!errors.district)} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4">
                  <Field label={t.street} required error={errors.street} isRTL={isRTL}>
                    <input type="text" value={form.street} onChange={e => setField("street", e.target.value)}
                      placeholder={t.streetPh} className={inputCls(isRTL, !!errors.street)} />
                  </Field>
                  <Field label={t.zipCode} isRTL={isRTL}>
                    <input type="text" value={form.zipCode} onChange={e => setField("zipCode", e.target.value)}
                      placeholder={t.zipCodePh} dir="ltr" className={clsx(inputCls(false), "font-mono")} />
                  </Field>
                </div>

                <Field label={t.notes} isRTL={isRTL}>
                  <textarea value={form.notes} onChange={e => setField("notes", e.target.value)}
                    placeholder={t.notesPh} rows={3}
                    className={clsx(inputCls(isRTL), "resize-none")} />
                </Field>
              </div>
            )}

            {/* ─── STEP 2: Payment ─── */}
            {step === 2 && (
              <div className="glass-card rounded-2xl p-6 md:p-8 space-y-5">
                <h2 className={clsx("text-brand-gold font-bold text-base uppercase tracking-wider", isRTL ? "text-right" : "text-left")}>
                  {t.paymentMethod}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {GATEWAYS.map(gw => {
                    const nameKey = `pay${gw.id.charAt(0).toUpperCase() + gw.id.slice(1)}` as keyof typeof t;
                    const descKey = `${nameKey}Desc` as keyof typeof t;
                    return (
                      <button
                        key={gw.id}
                        onClick={() => { setSelectedPayment(gw.id); setPaymentError(""); }}
                        className={clsx(
                          "relative p-4 rounded-2xl border text-left transition-all duration-300 group w-full",
                          isRTL ? "text-right" : "text-left",
                          selectedPayment === gw.id
                            ? `border-brand-gold bg-gradient-to-br ${gw.color} shadow-[0_0_0_1px_rgba(201,168,76,0.3)]`
                            : `${gw.border} bg-brand-steel/40 hover:border-opacity-60`
                        )}
                      >
                        {/* Selected dot */}
                        <div className={clsx(
                          "absolute top-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                          isRTL ? "left-3" : "right-3",
                          selectedPayment === gw.id ? "border-brand-gold bg-brand-gold" : "border-brand-gold/25"
                        )}>
                          {selectedPayment === gw.id && <span className="text-brand-charcoal text-[10px]">✓</span>}
                        </div>

                        {gw.badge && (
                          <span className={clsx(
                            "absolute top-3 px-1.5 py-0.5 rounded text-[9px] font-bold",
                            isRTL ? "left-10" : "right-10",
                            "bg-brand-gold/20 text-brand-gold"
                          )}>{gw.badge}</span>
                        )}

                        <div className={clsx("flex items-center gap-3 mb-2", isRTL ? "flex-row-reverse" : "flex-row")}>
                          <span className="text-2xl">{gw.logo}</span>
                          <span className="text-brand-off-white font-bold text-sm">{t[nameKey] as string}</span>
                        </div>
                        <p className={clsx("text-brand-silver/60 text-xs leading-snug", isRTL ? "text-right" : "text-left")}>
                          {t[descKey] as string}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {paymentError && (
                  <p className={clsx("text-red-400 text-sm", isRTL ? "text-right" : "text-left")}>{paymentError}</p>
                )}

                {/* Bank transfer details */}
                {selectedPayment === "transfer" && (
                  <div className={clsx("p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 space-y-2", isRTL ? "text-right" : "text-left")}>
                    <p className="text-amber-400 text-xs font-bold">{isRTL ? "بيانات التحويل البنكي" : "Bank Transfer Details"}</p>
                    <div className="font-mono text-xs space-y-1.5 text-brand-off-white/80">
                      <p>{isRTL ? "البنك:" : "Bank:"} <span className="text-brand-gold">المصرف الأهلي السعودي (NCB)</span></p>
                      <p>IBAN: <span className="text-brand-gold">SA00 0000 0000 0000 0000 0000</span></p>
                      <p>{isRTL ? "المستفيد:" : "Beneficiary:"} <span className="text-brand-gold">{isRTL ? "شركة ميتال آرت" : "Metal Art Company"}</span></p>
                    </div>
                  </div>
                )}

                {/* STC Pay / Moyasar integration note */}
                {(selectedPayment === "mada" || selectedPayment === "visa") && (
                  <div className={clsx("p-4 rounded-xl bg-brand-gold/[0.05] border border-brand-gold/15 space-y-1", isRTL ? "text-right" : "text-left")}>
                    <p className="text-brand-gold text-xs font-bold">
                      {isRTL ? "🔒 مدفوعات آمنة عبر Moyasar" : "🔒 Secure payments via Moyasar"}
                    </p>
                    <p className="text-brand-silver/50 text-xs">
                      {isRTL
                        ? "ستُحوَّل إلى صفحة الدفع الآمنة المدعومة من Moyasar بعد تأكيد الطلب."
                        : "You will be redirected to a secure Moyasar-powered payment page after confirming your order."}
                    </p>
                  </div>
                )}

                {(selectedPayment === "tabby" || selectedPayment === "tamara") && (
                  <div className={clsx("p-4 rounded-xl bg-purple-500/[0.06] border border-purple-500/20 space-y-1", isRTL ? "text-right" : "text-left")}>
                    <p className="text-purple-300 text-xs font-bold">
                      {isRTL ? "اشتري الآن وادفع على أقساط" : "Buy Now, Pay Later"}
                    </p>
                    <p className="text-brand-silver/50 text-xs">
                      {selectedPayment === "tabby"
                        ? (isRTL ? "4 أقساط متساوية كل أسبوعين، بدون فوائد أو رسوم مخفية." : "4 equal payments every 2 weeks, no interest or hidden fees.")
                        : (isRTL ? "3 أو 6 أقساط شهرية ميسّرة، مناسب للمشاريع الكبيرة." : "3 or 6 easy monthly installments, ideal for larger projects.")}
                    </p>
                    <p className="text-brand-silver/40 text-[11px]">
                      {isRTL
                        ? `دفع أول قسط: ${formatSAR(totals.totalSAR / (selectedPayment === "tabby" ? 4 : 3), locale)} ر.س`
                        : `First payment: ${formatSAR(totals.totalSAR / (selectedPayment === "tabby" ? 4 : 3), locale)} SAR`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ─── STEP 3: Confirm ─── */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Customer summary */}
                <div className="glass-card rounded-2xl p-6 space-y-4">
                  <h3 className={clsx("text-brand-gold font-bold text-sm uppercase tracking-wider", isRTL ? "text-right" : "text-left")}>
                    {t.step1}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: t.fullName, value: form.fullName },
                      { label: t.mobile, value: form.mobile },
                      { label: t.city, value: form.city },
                      { label: t.district, value: form.district },
                    ].map(({ label, value }) => (
                      <div key={label} className={isRTL ? "text-right" : "text-left"}>
                        <p className="text-brand-silver/50 text-xs">{label}</p>
                        <p className="text-brand-off-white text-sm font-semibold">{value || "—"}</p>
                      </div>
                    ))}
                  </div>
                  <div className={isRTL ? "text-right" : "text-left"}>
                    <p className="text-brand-silver/50 text-xs">{t.street}</p>
                    <p className="text-brand-off-white text-sm font-semibold">{form.street} {form.zipCode && `(${form.zipCode})`}</p>
                  </div>
                </div>

                {/* Payment summary */}
                <div className="glass-card rounded-2xl p-6">
                  <h3 className={clsx("text-brand-gold font-bold text-sm uppercase tracking-wider mb-4", isRTL ? "text-right" : "text-left")}>
                    {t.step2}
                  </h3>
                  <div className={clsx("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
                    <span className="text-2xl">{GATEWAYS.find(g => g.id === selectedPayment)?.logo}</span>
                    <div className={isRTL ? "text-right" : "text-left"}>
                      <p className="text-brand-off-white font-semibold text-sm">
                        {t[`pay${selectedPayment.charAt(0).toUpperCase() + selectedPayment.slice(1)}` as keyof typeof t] as string}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items confirm */}
                <div className="glass-card rounded-2xl p-6 space-y-3">
                  <h3 className={clsx("text-brand-gold font-bold text-sm uppercase tracking-wider", isRTL ? "text-right" : "text-left")}>
                    {isRTL ? "المنتجات" : "Items"}
                  </h3>
                  {state.items.map(item => (
                    <div key={item.id} className={clsx(
                      "flex items-center justify-between gap-3 py-3 border-b border-brand-gold/[0.08] last:border-0",
                      isRTL ? "flex-row-reverse" : "flex-row"
                    )}>
                      <div className={clsx("flex items-center gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
                        <span className="text-xl">
                          {item.input.material === "steel" && "🔩"}
                          {item.input.material === "acrylic" && "💎"}
                          {item.input.material === "cladding" && "🏗️"}
                          {item.input.material === "wood" && "🪵"}
                        </span>
                        <div className={isRTL ? "text-right" : "text-left"}>
                          <p className="text-brand-off-white text-sm font-medium">{item.materialLabel[lang]}</p>
                          <p className="text-brand-silver/50 text-xs font-mono">
                            {item.input.widthCm}×{item.input.heightCm}{t.cm} · {item.input.thicknessMm}{t.mm} · ×{item.input.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="text-brand-gold font-bold text-sm font-mono">{formatSAR(item.price.totalSAR, locale)} {t.currency}</span>
                    </div>
                  ))}
                </div>

                {/* Final total highlight */}
                <div className="glass-card rounded-2xl p-5 border border-brand-gold/30 bg-brand-gold/[0.04]">
                  <div className={clsx("flex items-center justify-between", isRTL ? "flex-row-reverse" : "flex-row")}>
                    <span className="text-brand-off-white font-bold">{t.total}</span>
                    <div className={clsx(isRTL ? "text-left" : "text-right")}>
                      <p className="text-brand-gold font-black text-2xl">{formatSAR(totals.totalSAR, locale)} <span className="text-base">{t.currency}</span></p>
                      <p className="text-brand-silver/50 text-xs font-mono">≈ ${formatUSD(totals.totalUSD)} {t.currencyUSD}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className={clsx("flex items-center gap-3 mt-6", isRTL ? "flex-row-reverse" : "flex-row")}>
              {step > 1 && (
                <button onClick={prevStep}
                  className="px-6 py-3 rounded-xl border border-brand-gold/20 text-brand-silver hover:text-brand-off-white hover:border-brand-gold/40 text-sm font-semibold transition-all duration-200">
                  {t.prevStep}
                </button>
              )}
              {step < 3 ? (
                <button onClick={nextStep} className="btn-primary flex-1 sm:flex-none justify-center text-sm font-bold py-3.5 rounded-xl">
                  {t.nextStep}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={isRTL ? "rotate-180" : ""}>
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={isSubmitting}
                  className={clsx(
                    "btn-primary flex-1 sm:flex-none justify-center text-sm font-bold py-3.5 rounded-xl",
                    isSubmitting && "opacity-70 cursor-not-allowed !transform-none !shadow-none"
                  )}>
                  {isSubmitting ? (
                    <><span className="inline-block w-4 h-4 border-2 border-brand-charcoal/40 border-t-brand-charcoal rounded-full animate-spin" /> {t.processing}</>
                  ) : (
                    <><span>✓</span> {t.placeOrder}</>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* ── Right: Order summary ── */}
          <div className="sticky top-24 space-y-4">
            <div className="glass-card rounded-2xl overflow-hidden border border-brand-gold/20">
              <div className="px-5 py-4 border-b border-brand-gold/10 bg-brand-gold/[0.04]">
                <h3 className={clsx("text-brand-gold font-bold text-sm uppercase tracking-wider", isRTL ? "text-right" : "text-left")}>{t.orderSummary}</h3>
              </div>
              <div className="px-5 py-4 space-y-3">
                {state.items.map(item => (
                  <div key={item.id} className={clsx("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
                    <span className="text-lg flex-shrink-0">
                      {item.input.material === "steel" && "🔩"}
                      {item.input.material === "acrylic" && "💎"}
                      {item.input.material === "cladding" && "🏗️"}
                      {item.input.material === "wood" && "🪵"}
                    </span>
                    <div className={clsx("flex-1 min-w-0", isRTL ? "text-right" : "text-left")}>
                      <p className="text-brand-off-white text-xs font-semibold truncate">{item.materialLabel[lang]}</p>
                      <p className="text-brand-silver/50 text-[11px] font-mono">×{item.input.quantity} {t.pcs}</p>
                    </div>
                    <span className="text-brand-gold text-sm font-bold font-mono flex-shrink-0">
                      {formatSAR(item.price.totalSAR, locale)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5 space-y-2.5 border-t border-brand-gold/10 pt-4">
                {[
                  { label: t.subtotal, val: `${formatSAR(totals.subtotalSAR, locale)} ${t.currency}`, cls: "text-brand-off-white" },
                  ...(totals.couponSAR > 0 ? [{ label: t.discount, val: `-${formatSAR(totals.couponSAR, locale)} ${t.currency}`, cls: "text-green-400" }] : []),
                  { label: t.shipping, val: totals.shippingSAR === 0 ? t.shippingFree : `${formatSAR(totals.shippingSAR, locale)} ${t.currency}`, cls: totals.shippingSAR === 0 ? "text-green-400" : "text-brand-off-white" },
                  { label: t.vat, val: `${formatSAR(totals.vatSAR, locale)} ${t.currency}`, cls: "text-brand-silver" },
                ].map(({ label, val, cls }) => (
                  <div key={label} className={clsx("flex items-center justify-between text-xs", isRTL ? "flex-row-reverse" : "flex-row")}>
                    <span className="text-brand-silver/60">{label}</span>
                    <span className={clsx("font-semibold", cls)}>{val}</span>
                  </div>
                ))}
                <div className={clsx("flex items-center justify-between pt-2 border-t border-brand-gold/15", isRTL ? "flex-row-reverse" : "flex-row")}>
                  <span className="text-brand-off-white font-bold text-sm">{t.total}</span>
                  <div className={clsx(isRTL ? "text-left" : "text-right")}>
                    <p className="text-brand-gold font-black">{formatSAR(totals.totalSAR, locale)} <span className="text-xs">{t.currency}</span></p>
                    <p className="text-brand-silver/40 text-[11px] font-mono">≈ ${formatUSD(totals.totalUSD)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security badges */}
            <div className="glass-card rounded-2xl p-4">
              <div className={clsx("grid grid-cols-3 gap-3 text-center", isRTL ? "direction-rtl" : "")}>
                {[
                  { icon: "🔒", label: isRTL ? "دفع آمن" : "Secure Pay" },
                  { icon: "✅", label: isRTL ? "ضمان الجودة" : "Quality Guarantee" },
                  { icon: "📦", label: isRTL ? "شحن موثوق" : "Reliable Shipping" },
                ].map(({ icon, label }) => (
                  <div key={label} className="space-y-1">
                    <div className="text-xl">{icon}</div>
                    <p className="text-brand-silver/60 text-[10px] leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
