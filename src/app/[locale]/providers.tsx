"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { syncFromSupabase, siteStore } from "@/store/siteStore";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const INNER_PAGE_BG = "#FDFBF7";

export function Providers({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: AbstractIntlMessages;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/` || pathname === "/";

  // Sync once on mount
  useEffect(() => { syncFromSupabase(); }, []);

  // Update body background on every route change
  useEffect(() => {
    const applyBg = () => {
      const { pageBg } = siteStore.getColors();
      document.body.style.background = isHome ? pageBg : INNER_PAGE_BG;
    };
    applyBg();
    window.addEventListener("siteStore:saved", applyBg);
    return () => window.removeEventListener("siteStore:saved", applyBg);
  }, [isHome]);

  return (
    <ThemeProvider>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Riyadh">
        <Navbar locale={locale} />
        {children}
        <Footer />
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}
