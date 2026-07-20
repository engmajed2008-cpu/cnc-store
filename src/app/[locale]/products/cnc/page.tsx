import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { clsx } from "clsx";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CNCConfigurator } from "@/components/product/CNCConfigurator";
import type { Locale } from "@/lib/i18n";

export async function generateMetadata() {
  const t = await getTranslations("cncProduct");
  return { title: `${t("pageTitle")} | E3lani`, description: t("pageSubtitle") };
}

// ── FAQ data ─────────────────────────────────────────────────
async function FAQSection({ locale }: { locale: Locale }) {
  const isRTL = locale === "ar";
  const faqs =
    locale === "ar"
      ? [
          { q: "ما هو الحد الأدنى للطلب؟", a: "لا يوجد حد أدنى للكمية، لكن يُطبّق حد أدنى للقيمة يختلف حسب نوع المادة." },
          { q: "كم تستغرق عملية القص؟", a: "الطلبات القياسية تُنجز خلال 7-10 أيام عمل. الطلبات العاجلة خلال 24-48 ساعة بتكلفة إضافية." },
          { q: "هل تقبلون ملفات AutoCAD؟", a: "نعم، نقبل DWG وDXF وPDF وSVG وAI وEPS. يُفضّل إرسال ملف DXF للدقة القصوى." },
          { q: "ما هي دقة القص؟", a: "دقة ±0.1 ملم باستخدام ليزر الألياف الضوئية للمعادن، وليزر CO2 للأكريليك والخشب." },
          { q: "هل يوجد توصيل لخارج جدة؟", a: "نعم، نوصّل لجميع مناطق المملكة العربية السعودية عبر شركات شحن معتمدة." },
        ]
      : [
          { q: "What is the minimum order?", a: "There's no minimum quantity, but a minimum order value applies depending on the material type." },
          { q: "How long does cutting take?", a: "Standard orders are completed in 7-10 business days. Urgent orders in 24-48 hours with an additional fee." },
          { q: "Do you accept AutoCAD files?", a: "Yes, we accept DWG, DXF, PDF, SVG, AI, and EPS. DXF is preferred for maximum precision." },
          { q: "What is the cutting precision?", a: "±0.1 mm precision using fiber laser for metals and CO2 laser for acrylic and wood." },
          { q: "Do you deliver outside Jeddah?", a: "Yes, we deliver across all regions of Saudi Arabia via trusted shipping partners." },
        ];

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div key={i} className="glass-card rounded-2xl">
  <div className={clsx(
    "flex items-center justify-between px-6 py-4",
    "text-brand-off-white font-semibold text-sm",
    isRTL ? "flex-row-reverse" : "flex-row"
  )}>
    <span>{faq.q}</span>
  </div>
  <div className={clsx("px-6 pb-5 text-brand-silver/80 text-sm leading-relaxed", isRTL ? "text-right" : "text-left")}>
    {faq.a}
  </div>
</div>
      ))}
    </div>
  );
}

// ── Tech specs sidebar content ────────────────────────────────
async function TechSpecs({ locale }: { locale: Locale }) {
  const t = await getTranslations("cncProduct");
  const isRTL = locale === "ar";
  const specs = [
    { label: t("toleranceLabel"),  value: t("toleranceValue"),  icon: "🎯" },
    { label: t("maxSizeLabel"),    value: t("maxSizeValue"),     icon: "📐" },
    { label: t("fileFormatsLabel"),value: "DWG, DXF, PDF, AI, SVG", icon: "📂" },
    { label: t("machineLabel"),    value: t("machineValue"),     icon: "⚙️" },
    { label: t("certificateLabel"),value: t("certificateValue"), icon: "🏅" },
  ];
  const features = [
    t("feature1"), t("feature2"), t("feature3"),
    t("feature4"), t("feature5"), t("feature6"),
  ];

  return (
    <div className="space-y-8">
      {/* Tech specs */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className={clsx("text-brand-gold font-bold text-sm uppercase tracking-wider mb-5", isRTL ? "text-right" : "text-left")}>
          {t("specsTitle")}
        </h3>
        <div className="space-y-3.5">
          {specs.map(({ label, value, icon }) => (
            <div key={label} className={clsx("flex items-start gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
              <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
              <div className={clsx("flex-1", isRTL ? "text-right" : "text-left")}>
                <p className="text-brand-silver/60 text-xs mb-0.5">{label}</p>
                <p className="text-brand-off-white text-sm font-semibold">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features list */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className={clsx("text-brand-gold font-bold text-sm uppercase tracking-wider mb-5", isRTL ? "text-right" : "text-left")}>
          {t("featuresTitle")}
        </h3>
        <ul className="space-y-2.5">
          {features.map((feat) => (
            <li key={feat} className={clsx("flex items-start gap-2.5 text-sm text-brand-silver", isRTL ? "flex-row-reverse text-right" : "flex-row")}>
              <span className="w-5 h-5 rounded-full bg-brand-gold/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-brand-gold text-[10px]">✓</span>
              </span>
              {feat}
            </li>
          ))}
        </ul>
      </div>

      {/* CNC machine visual */}
      <div className="glass-card rounded-2xl p-6 overflow-hidden relative">
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <defs>
              <pattern id="tech-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M0 0h20v20H0z" fill="none" stroke="#C9A24B" strokeWidth=".4"/>
              </pattern>
            </defs>
            <rect width="300" height="200" fill="url(#tech-grid)"/>
            <circle cx="150" cy="100" r="50" fill="none" stroke="#C9A24B" strokeWidth="1" strokeDasharray="5 3"/>
            <circle cx="150" cy="100" r="30" fill="none" stroke="#EBCB7C" strokeWidth=".8"/>
            <circle cx="150" cy="100" r="8" fill="#C9A24B" opacity=".5"/>
            <line x1="100" y1="100" x2="142" y2="100" stroke="#C9A24B" strokeWidth=".8"/>
            <line x1="158" y1="100" x2="200" y2="100" stroke="#C9A24B" strokeWidth=".8"/>
            <line x1="150" y1="50" x2="150" y2="92" stroke="#C9A24B" strokeWidth=".8"/>
            <line x1="150" y1="108" x2="150" y2="150" stroke="#C9A24B" strokeWidth=".8"/>
          </svg>
        </div>
        <div className="relative z-10 text-center py-4">
          <p className="text-brand-gold font-mono text-xs tracking-[0.2em] uppercase mb-2">FIBER LASER CNC</p>
          <p className="text-brand-silver/60 text-xs">4000W • 3000×1500mm • IPG Photonics</p>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default async function CNCProductPage() {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("cncProduct");
  const isRTL = locale === "ar";

  return (
    <>
      <Navbar locale={locale} />
      <div className="min-h-screen bg-brand-charcoal pt-20">

        {/* ── Hero banner ── */}
        <div className="relative overflow-hidden bg-gradient-to-b from-brand-steel/60 to-brand-charcoal border-b border-brand-gold/10">
          {/* BG grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(201,162,75,1) 1px,transparent 1px),linear-gradient(90deg,rgba(201,162,75,1) 1px,transparent 1px)",
              backgroundSize: "55px 55px",
            }}
          />
          {/* Gold glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[300px] opacity-[0.06] pointer-events-none"
            style={{ background: "radial-gradient(circle,#C9A24B 0%,transparent 70%)" }} />

          <div className="section-container py-12 relative z-10">
            {/* Breadcrumb */}
            <nav className={clsx("flex items-center gap-2 text-xs text-brand-silver/60 mb-6 flex-wrap", isRTL ? "flex-row-reverse" : "flex-row")}>
              <Link href={`/${locale}`} className="hover:text-brand-gold transition-colors">{t("breadcrumbHome")}</Link>
              <span className={clsx("opacity-40", isRTL ? "rotate-180" : "")}>›</span>
              <Link href={`/${locale}/products`} className="hover:text-brand-gold transition-colors">{t("breadcrumbProducts")}</Link>
              <span className={clsx("opacity-40", isRTL ? "rotate-180" : "")}>›</span>
              <span className="text-brand-gold">{t("breadcrumbCNC")}</span>
            </nav>

            <div className={clsx("flex items-start gap-5", isRTL ? "flex-row-reverse" : "flex-row")}>
              {/* Icon */}
              <div className="relative w-16 h-16 flex-shrink-0">
                <div className="absolute inset-0 bg-gold-gradient rounded-2xl rotate-45 opacity-90" />
                <div className="absolute inset-[6px] bg-brand-charcoal rounded-xl rotate-45" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">⚙️</div>
              </div>

              <div className={isRTL ? "text-right" : "text-left"}>
                <div className={clsx("flex items-center gap-2 mb-2", isRTL ? "flex-row-reverse" : "flex-row")}>
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-gold/10 border border-brand-gold/25 text-brand-gold text-[10px] font-mono tracking-wider uppercase">
                    CNC
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/25 text-green-400 text-[10px] font-mono">
                    {isRTL ? "● متوفر" : "● Available"}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-brand-off-white mb-2">{t("pageTitle")}</h1>
                <p className="text-brand-silver/70 text-sm max-w-xl">{t("pageSubtitle")}</p>
              </div>
            </div>

            {/* Quick stats bar */}
            <div className={clsx(
              "grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8",
            )}>
              {[
                { icon: "🎯", val: "±0.1mm", label: isRTL ? "دقة القص" : "Cutting Precision" },
                { icon: "⚡", val: isRTL ? "24 ساعة" : "24 hrs",  label: isRTL ? "أسرع تسليم" : "Fastest Delivery" },
                { icon: "📐", val: "3×1.5m",  label: isRTL ? "أقصى حجم" : "Max Sheet Size" },
                { icon: "🏅", val: "ISO",     label: "9001:2015" },
              ].map(({ icon, val, label }) => (
                <div key={label} className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-steel/40 border border-brand-gold/10",
                  isRTL ? "flex-row-reverse text-right" : "flex-row text-left"
                )}>
                  <span className="text-lg">{icon}</span>
                  <div>
                    <p className="text-brand-gold font-bold text-sm font-mono">{val}</p>
                    <p className="text-brand-silver/60 text-[11px]">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="section-container py-12">
          <div className={clsx("grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-10", isRTL ? "xl:rtl" : "")}>

            {/* Configurator + FAQ */}
            <div className="space-y-10 min-w-0">
              {/* Section header */}
              <div className={isRTL ? "text-right" : "text-left"}>
                <span className="text-brand-gold text-xs font-mono tracking-[0.2em] uppercase opacity-70">
                  {isRTL ? "خصّص طلبك" : "Customize Your Order"}
                </span>
                <h2 className="text-xl font-extrabold text-brand-off-white mt-1">{t("configTitle")}</h2>
                <p className="text-brand-silver/60 text-sm mt-1">{t("configSubtitle")}</p>
              </div>

              {/* The interactive configurator */}
              <CNCConfigurator />

              {/* FAQ */}
              <div>
                <h2 className={clsx("text-xl font-extrabold text-brand-off-white mb-6", isRTL ? "text-right" : "text-left")}>
                  {t("faqTitle")}
                </h2>
                <FAQSection locale={locale} />
              </div>
            </div>

            {/* Tech specs sidebar (desktop) */}
            <div className="hidden xl:block">
              <div className="sticky top-24">
                <TechSpecs locale={locale} />
              </div>
            </div>
          </div>

          {/* Tech specs (mobile) */}
          <div className="xl:hidden mt-10">
            <TechSpecs locale={locale} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
