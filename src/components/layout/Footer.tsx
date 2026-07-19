"use client";
import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { clsx } from "clsx";
import { Phone, Mail, MapPin, Instagram, Twitter, Youtube, MessageCircle } from "lucide-react";
import { siteStore, DEFAULT_CONTACT, DEFAULT_COLORS, type ContactInfo } from "@/store/siteStore";
import BrandMark from "@/components/brand/BrandMark";
type Locale = "ar" | "en";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const locale = useLocale() as Locale;
  const isRTL = locale === "ar";
  const [contact, setContact]     = useState<ContactInfo>(DEFAULT_CONTACT);
  const [footerBg, setFooterBg]   = useState(DEFAULT_COLORS.footerBg);

  useEffect(() => {
    const refresh = () => {
      setContact(siteStore.getContact());
      setFooterBg(siteStore.getColors().footerBg);
    };
    refresh();
    window.addEventListener("siteStore:saved", refresh);
    return () => window.removeEventListener("siteStore:saved", refresh);
  }, []);

  const navLinks = [
    { key: "home",      href: "/" + locale },
    { key: "services",  href: "/" + locale + "#services" },
    { key: "products",  href: "/" + locale + "/products" },
    { key: "portfolio", href: "/" + locale + "/portfolio" },
    { key: "about",     href: "/" + locale + "/about" },
    { key: "contact",   href: "/" + locale + "/contact" },
  ] as const;

  const socialLinks = [
    { icon: Instagram, href: contact.instagram ? "https://instagram.com/" + contact.instagram : "" },
    { icon: Twitter,   href: contact.twitter   ? "https://x.com/"         + contact.twitter   : "" },
    { icon: Youtube,   href: contact.youtube   ? "https://youtube.com/"   + contact.youtube   : "" },
  ];

  return (
    <footer
      className="relative border-t border-brand-gold/10 overflow-hidden"
      style={{ background: footerBg }}
    >
      <div className="absolute inset-0 bg-mesh-gold opacity-30 pointer-events-none" />
      <div className="h-px bg-gold-gradient opacity-60" />

      <div className="section-container py-16 relative z-10">
        <div className={clsx("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10", isRTL ? "text-right" : "text-left")}>

          {/* Brand */}
          <div className="lg:col-span-1 space-y-5">
            {isRTL ? (
              /* ترتيب رباعي كالتصميم — الرمز فوق الدومين، «إعلاني» فوق الوصف، بارتفاع متساوٍ */
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                  <div style={{ height: 50, display: "flex", alignItems: "center" }}>
                    <img src="/brand/e3lani-mark.svg" alt="إعلاني" style={{ height: 50, width: "auto", display: "block" }} />
                  </div>
                  <span dir="ltr" style={{ fontSize: "0.7rem", color: "#EBCB7C", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 800 }}>E3LANI.COM</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                  <div style={{ height: 50, display: "flex", alignItems: "center" }}>
                    <img src="/brand/e3lani-word.svg" alt="إعلاني" style={{ height: 50, width: "auto", display: "block" }} />
                  </div>
                  <span style={{ fontSize: "0.82rem", color: "#634E40", fontWeight: 600, whiteSpace: "nowrap" }}>سوق الدعاية والإعلان</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <BrandMark size={56} />
                <span className="text-lg font-bold text-gold-gradient" style={{ fontFamily: "var(--font-brand), 'IBM Plex Sans Arabic', sans-serif" }}>{t("company")}</span>
              </div>
            )}
            <p className="text-brand-silver text-sm leading-relaxed">{t("tagline")}</p>
            <div className={clsx("flex items-center gap-3", isRTL ? "flex-row-reverse justify-end" : "flex-row")}>
              {socialLinks.map(({ icon: Icon, href }, i) =>
                href ? (
                  <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                    className="btn-shine"
                    style={{
                      width: 40, height: 40, borderRadius: "50%",
                      border: "1.5px solid rgba(201,162,75,0.4)",
                      background: "rgba(201,162,75,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#C9A24B", transition: "all 0.2s",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(201,162,75,0.18)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,162,75,0.8)";
                      (e.currentTarget as HTMLElement).style.color = "#EBCB7C";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(201,162,75,0.08)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,162,75,0.4)";
                      (e.currentTarget as HTMLElement).style.color = "#C9A24B";
                    }}
                  >
                    <Icon size={18} />
                  </a>
                ) : (
                  <span key={i} style={{
                    width: 40, height: 40, borderRadius: "50%",
                    border: "1.5px solid rgba(201,162,75,0.15)",
                    background: "rgba(201,162,75,0.03)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "rgba(201,162,75,0.25)",
                  }}>
                    <Icon size={18} />
                  </span>
                )
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-5">
            <h3 className="text-brand-gold font-semibold text-sm uppercase tracking-wider">{t("links")}</h3>
            <ul className="space-y-3">
              {navLinks.map(({ key, href }) => (
                <li key={key}>
                  <Link href={href} className="text-brand-silver hover:text-brand-off-white text-sm transition-colors hover:underline underline-offset-4 decoration-brand-gold/50">
                    {tNav(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-5">
            <h3 className="text-brand-gold font-semibold text-sm uppercase tracking-wider">{tNav("services")}</h3>
            <ul className="space-y-3 text-brand-silver text-sm">
              {(isRTL
                ? ["دعاية وإعلان", "ديكور فني", "قص CNC", "طلبات خاصة", "تصميم جرافيك"]
                : ["Advertising", "Artistic Decor", "CNC Cutting", "Custom Orders", "Graphic Design"]
              ).map((s) => (
                <li key={s}><span className="hover:text-brand-off-white transition-colors cursor-default">{s}</span></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-5">
            <h3 className="text-brand-gold font-semibold text-sm uppercase tracking-wider">{t("contact")}</h3>
            <ul className="space-y-4">
              {contact.whatsapp && (
                <li>
                  <a href={"https://wa.me/" + contact.whatsapp} target="_blank" rel="noopener noreferrer"
                    className={clsx("flex items-start gap-3 text-brand-silver hover:text-brand-off-white transition-colors text-sm", isRTL ? "flex-row-reverse text-right" : "flex-row text-left")}>
                    <MessageCircle size={15} className="flex-shrink-0 mt-0.5 text-brand-gold" />
                    <span dir="ltr">+{contact.whatsapp}</span>
                  </a>
                </li>
              )}
              {contact.phone && contact.phone !== contact.whatsapp && (
                <li>
                  <a href={"tel:" + contact.phone}
                    className={clsx("flex items-start gap-3 text-brand-silver hover:text-brand-off-white transition-colors text-sm", isRTL ? "flex-row-reverse text-right" : "flex-row text-left")}>
                    <Phone size={15} className="flex-shrink-0 mt-0.5 text-brand-gold" />
                    <span dir="ltr">+{contact.phone}</span>
                  </a>
                </li>
              )}
              {contact.email && (
                <li>
                  <a href={"mailto:" + contact.email}
                    className={clsx("flex items-start gap-3 text-brand-silver hover:text-brand-off-white transition-colors text-sm", isRTL ? "flex-row-reverse text-right" : "flex-row text-left")}>
                    <Mail size={15} className="flex-shrink-0 mt-0.5 text-brand-gold" />
                    <span>{contact.email}</span>
                  </a>
                </li>
              )}
              {contact.address && (
                <li>
                  <div className={clsx("flex items-start gap-3 text-brand-silver text-sm", isRTL ? "flex-row-reverse text-right" : "flex-row text-left")}>
                    <MapPin size={15} className="flex-shrink-0 mt-0.5 text-brand-gold" />
                    <span>{isRTL ? contact.address : (contact.addressEn || contact.address)}</span>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={clsx("mt-12 pt-6 border-t border-brand-gold/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-brand-silver text-xs", isRTL ? "sm:flex-row-reverse" : "sm:flex-row")}>
          <p>© {new Date().getFullYear()} {t("company")} — {t("rights")}</p>
          <div className={clsx("flex items-center gap-4", isRTL ? "flex-row-reverse" : "flex-row")}>
            <Link href="#" className="hover:text-brand-gold transition-colors">{isRTL ? "سياسة الخصوصية" : "Privacy Policy"}</Link>
            <span className="opacity-30">·</span>
            <Link href="#" className="hover:text-brand-gold transition-colors">{isRTL ? "الشروط والأحكام" : "Terms of Service"}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
