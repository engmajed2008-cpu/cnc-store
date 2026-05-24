import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { clsx } from "clsx";
import { Phone, Mail, MapPin, Instagram, Twitter, Youtube } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const locale = useLocale() as Locale;
  const isRTL = locale === "ar";

  const navLinks = [
    { key: "home", href: `/${locale}` },
    { key: "services", href: `/${locale}#services` },
    { key: "products", href: `/${locale}/products` },
    { key: "portfolio", href: `/${locale}/portfolio` },
    { key: "about", href: `/${locale}/about` },
    { key: "contact", href: `/${locale}/contact` },
  ] as const;

  return (
    <footer className="relative bg-brand-charcoal border-t border-brand-gold/10 overflow-hidden">
      {/* Background mesh */}
      <div className="absolute inset-0 bg-mesh-gold opacity-30 pointer-events-none" />

      {/* Gold accent line top */}
      <div className="h-px bg-gold-gradient opacity-60" />

      <div className="section-container py-16 relative z-10">
        <div
          className={clsx(
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10",
            isRTL ? "text-right" : "text-left"
          )}
        >
          {/* Brand column */}
          <div className="lg:col-span-1 space-y-5">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 flex-shrink-0">
                <div className="absolute inset-0 bg-gold-gradient rounded-md rotate-45" />
                <div className="absolute inset-1 bg-brand-charcoal rounded-sm rotate-45" />
                <div className="absolute inset-2.5 bg-gold-gradient rounded-sm rotate-45" />
              </div>
              <span className="text-lg font-bold text-gold-gradient">
                {t("company")}
              </span>
            </div>

            <p className="text-brand-silver text-sm leading-relaxed">
              {t("tagline")}
            </p>

            {/* Social links */}
            <div
              className={clsx(
                "flex items-center gap-3",
                isRTL ? "flex-row-reverse justify-end" : "flex-row"
              )}
            >
              {[
                { icon: Instagram, href: "#" },
                { icon: Twitter, href: "#" },
                { icon: Youtube, href: "#" },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-9 h-9 rounded-full border border-brand-gold/20 hover:border-brand-gold/60 flex items-center justify-center text-brand-silver hover:text-brand-gold transition-all duration-300 hover:bg-brand-gold/8"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-5">
            <h3 className="text-brand-gold font-semibold text-sm uppercase tracking-wider">
              {t("links")}
            </h3>
            <ul className="space-y-3">
              {navLinks.map(({ key, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="text-brand-silver hover:text-brand-off-white text-sm transition-colors duration-200 hover:underline underline-offset-4 decoration-brand-gold/50"
                  >
                    {tNav(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-5">
            <h3 className="text-brand-gold font-semibold text-sm uppercase tracking-wider">
              {tNav("services")}
            </h3>
            <ul className="space-y-3 text-brand-silver text-sm">
              {(isRTL
                ? ["دعاية وإعلان", "ديكور فني", "قص CNC", "طلبات خاصة", "تصميم جرافيك"]
                : ["Advertising", "Artistic Decor", "CNC Cutting", "Custom Orders", "Graphic Design"]
              ).map((service) => (
                <li key={service}>
                  <span className="hover:text-brand-off-white transition-colors duration-200 cursor-default">
                    {service}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-5">
            <h3 className="text-brand-gold font-semibold text-sm uppercase tracking-wider">
              {t("contact")}
            </h3>
            <ul className="space-y-4">
              {[
                { icon: Phone, value: t("phone"), href: `tel:${t("phone")}` },
                { icon: Mail, value: t("email"), href: `mailto:${t("email")}` },
                { icon: MapPin, value: t("address"), href: "#" },
              ].map(({ icon: Icon, value, href }) => (
                <li key={value}>
                  <a
                    href={href}
                    className={clsx(
                      "flex items-start gap-3 text-brand-silver hover:text-brand-off-white transition-colors duration-200 text-sm",
                      isRTL ? "flex-row-reverse text-right" : "flex-row text-left"
                    )}
                  >
                    <Icon size={15} className="flex-shrink-0 mt-0.5 text-brand-gold" />
                    <span>{value}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className={clsx(
            "mt-12 pt-6 border-t border-brand-gold/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-brand-silver text-xs",
            isRTL ? "sm:flex-row-reverse" : "sm:flex-row"
          )}
        >
          <p>
            © {new Date().getFullYear()} {t("company")} — {t("rights")}
          </p>
          <div
            className={clsx(
              "flex items-center gap-4",
              isRTL ? "flex-row-reverse" : "flex-row"
            )}
          >
            <Link href="#" className="hover:text-brand-gold transition-colors duration-200">
              {isRTL ? "سياسة الخصوصية" : "Privacy Policy"}
            </Link>
            <span className="opacity-30">·</span>
            <Link href="#" className="hover:text-brand-gold transition-colors duration-200">
              {isRTL ? "الشروط والأحكام" : "Terms of Service"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
