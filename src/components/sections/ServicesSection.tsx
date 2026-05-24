import { useTranslations, useLocale } from "next-intl";
import { clsx } from "clsx";
import { Megaphone, Palette, Cpu, Check } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export function ServicesSection() {
  const t = useTranslations("services");
  const locale = useLocale() as Locale;
  const isRTL = locale === "ar";

  const services = [
    {
      key: "advertising",
      icon: Megaphone,
      gradient: "from-amber-500/20 to-yellow-600/10",
      border: "border-amber-500/20 hover:border-amber-400/50",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
    },
    {
      key: "decor",
      icon: Palette,
      gradient: "from-brand-gold/20 to-brand-gold-dark/10",
      border: "border-brand-gold/20 hover:border-brand-gold/50",
      iconBg: "bg-brand-gold/10",
      iconColor: "text-brand-gold",
    },
    {
      key: "cnc",
      icon: Cpu,
      gradient: "from-zinc-400/20 to-zinc-600/10",
      border: "border-zinc-500/20 hover:border-zinc-400/50",
      iconBg: "bg-zinc-400/10",
      iconColor: "text-zinc-300",
    },
  ] as const;

  return (
    <section id="services" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-brand-steel/30" />

      <div className="section-container relative z-10">
        {/* Section header */}
        <div
          className={clsx(
            "mb-16",
            isRTL ? "text-right" : "text-left"
          )}
        >
          <span className="inline-block text-brand-gold text-sm font-medium uppercase tracking-[0.2em] mb-4 opacity-80">
            {isRTL ? "ماذا نقدم" : "What We Offer"}
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-brand-off-white mb-4">
            {t("title")}
          </h2>
          <p className="text-brand-silver text-lg max-w-xl">
            {t("subtitle")}
          </p>

          {/* Decorative gold bar */}
          <div
            className={clsx(
              "mt-6 h-0.5 w-24 bg-gold-gradient",
              isRTL ? "ms-auto" : ""
            )}
          />
        </div>

        {/* Service cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map(({ key, icon: Icon, gradient, border, iconBg, iconColor }, idx) => (
            <div
              key={key}
              className={clsx(
                "group relative glass-card p-8 cursor-default",
                "transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-gold/5",
                border,
                isRTL ? "text-right" : "text-left"
              )}
              style={{ animationDelay: `${idx * 0.15}s` }}
            >
              {/* Gradient background on hover */}
              <div
                className={clsx(
                  "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  gradient
                )}
              />

              {/* Index number */}
              <span className="absolute top-6 end-6 text-6xl font-black text-brand-gold/5 group-hover:text-brand-gold/10 transition-all duration-500 font-mono">
                0{idx + 1}
              </span>

              <div className="relative z-10 space-y-5">
                {/* Icon */}
                <div
                  className={clsx(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                    iconBg
                  )}
                >
                  <Icon size={26} className={iconColor} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-brand-off-white">
                  {t(`${key}.title` as any)}
                </h3>

                {/* Description */}
                <p className="text-brand-silver text-sm leading-relaxed">
                  {t(`${key}.description` as any)}
                </p>

                {/* Features list */}
                <ul className="space-y-2.5">
                  {(t.raw(`${key}.features`) as string[]).map(
                    (feature: string) => (
                      <li
                        key={feature}
                        className={clsx(
                          "flex items-center gap-2.5 text-sm text-brand-silver",
                          isRTL ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <span className="w-4 h-4 rounded-full bg-brand-gold/15 flex items-center justify-center flex-shrink-0">
                          <Check size={10} className="text-brand-gold" />
                        </span>
                        {feature}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
