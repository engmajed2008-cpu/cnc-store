"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { clsx } from "clsx";
import { Menu, X, ShoppingCart } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isRTL = locale === "ar";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { key: "home"      as const, href: `/${locale}` },
    { key: "services"  as const, href: `/${locale}#services` },
    { key: "products"  as const, href: `/${locale}/products/cnc` },
    { key: "portfolio" as const, href: `/${locale}/portfolio` },
    { key: "about"     as const, href: `/${locale}/about` },
    { key: "contact"   as const, href: `/${locale}/contact` },
  ];

  return (
    <>
      <header className={clsx(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500",
        isScrolled
          ? "bg-brand-charcoal/95 backdrop-blur-xl border-b border-brand-gold/10 py-3 shadow-[0_4px_40px_rgba(0,0,0,0.5)]"
          : "bg-transparent py-5"
      )}>
        <div className="section-container flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-3 group flex-shrink-0">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 bg-gold-gradient rounded-[9px] rotate-45 group-hover:rotate-[55deg] transition-transform duration-500" />
              <div className="absolute inset-[5px] bg-brand-charcoal rounded-[5px] rotate-45" />
              <div className="absolute inset-[10px] bg-gold-gradient rounded-[3px] rotate-45 group-hover:rotate-[30deg] transition-transform duration-700" />
            </div>
            <div className="leading-tight">
              <span className="block text-[1.05rem] font-black text-gold-gradient">
                {isRTL ? "إعلاني" : "E3lani"}
              </span>
              <span className="block text-[9px] text-brand-silver tracking-[0.16em] uppercase font-mono">
                {isRTL ? "قص CNC احترافي" : "Pro CNC Cutting"}
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <ul className={clsx("hidden lg:flex items-center gap-0.5 list-none", isRTL ? "flex-row-reverse" : "flex-row")}>
            {navLinks.map(({ key, href }) => (
              <li key={key}>
                <Link href={href} className="relative px-4 py-2 text-sm text-brand-silver hover:text-brand-off-white transition-colors duration-200 group block">
                  <span className="relative z-10">{t(key)}</span>
                  <span className="absolute inset-0 rounded-lg bg-brand-gold/[0.07] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className={clsx("flex items-center gap-2.5", isRTL ? "flex-row-reverse" : "flex-row")}>
            <LanguageSwitcher variant="pill" />
            <Link href={`/${locale}/cart`} className="relative p-2.5 rounded-full border border-brand-gold/15 hover:border-brand-gold/40 text-brand-silver hover:text-brand-gold transition-all duration-300">
              <ShoppingCart size={16} />
            </Link>
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="lg:hidden flex flex-col items-center justify-center gap-[5px] w-10 h-10 rounded-xl border border-brand-gold/15"
            >
              <span className={clsx("block w-5 h-[1.5px] bg-brand-silver rounded-full transition-all duration-300", isMobileOpen && "rotate-45 translate-y-[6.5px] !bg-brand-gold")} />
              <span className={clsx("block w-5 h-[1.5px] bg-brand-silver rounded-full transition-all duration-300", isMobileOpen && "opacity-0")} />
              <span className={clsx("block w-5 h-[1.5px] bg-brand-silver rounded-full transition-all duration-300", isMobileOpen && "-rotate-45 -translate-y-[6.5px] !bg-brand-gold")} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile backdrop */}
      <div onClick={() => setIsMobileOpen(false)} className={clsx("fixed inset-0 z-40 lg:hidden bg-black/60 backdrop-blur-sm transition-opacity duration-400", isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")} />

      {/* Mobile drawer */}
      <aside className={clsx(
        "fixed top-0 bottom-0 w-[300px] max-w-[85vw] z-[45] lg:hidden bg-brand-steel flex flex-col shadow-2xl transition-transform duration-[450ms]",
        isRTL ? clsx("right-0 border-l border-brand-gold/10", isMobileOpen ? "translate-x-0" : "translate-x-full") : clsx("left-0 border-r border-brand-gold/10", isMobileOpen ? "translate-x-0" : "-translate-x-full")
      )}>
        <div className={clsx("flex items-center justify-between p-5 border-b border-brand-gold/10", isRTL ? "flex-row-reverse" : "flex-row")}>
          <span className="text-brand-gold font-bold text-sm">{isRTL ? "القائمة" : "Menu"}</span>
          <button onClick={() => setIsMobileOpen(false)} className="p-1.5 rounded-lg text-brand-silver hover:text-brand-gold">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 p-5 space-y-1">
          {navLinks.map(({ key, href }) => (
            <Link key={key} href={href} onClick={() => setIsMobileOpen(false)}
              className={clsx("flex items-center gap-3 px-4 py-3.5 rounded-xl text-brand-silver hover:text-brand-off-white hover:bg-brand-gold/[0.07] transition-all duration-200 text-sm", isRTL ? "flex-row-reverse" : "flex-row")}>
              <span className="w-5 h-px bg-brand-gold/50 flex-shrink-0" />
              {t(key)}
            </Link>
          ))}
        </nav>
        <div className="p-5 border-t border-brand-gold/10">
          <LanguageSwitcher variant="dropdown" />
        </div>
      </aside>
    </>
  );
}
