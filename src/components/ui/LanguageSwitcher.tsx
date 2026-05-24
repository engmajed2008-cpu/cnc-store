"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { localeConfig, type Locale } from "@/lib/i18n";
import { clsx } from "clsx";

interface LanguageSwitcherProps {
  variant?: "pill" | "minimal" | "dropdown";
  className?: string;
}

export function LanguageSwitcher({
  variant = "pill",
  className,
}: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("common");

  const targetLocale: Locale = locale === "ar" ? "en" : "ar";
  const targetConfig = localeConfig[targetLocale];

  const handleSwitch = () => {
    // Replace the current locale prefix with the target locale
    const newPath = pathname.replace(`/${locale}`, `/${targetLocale}`);

    startTransition(() => {
      router.push(newPath || `/${targetLocale}`);
    });
  };

  if (variant === "minimal") {
    return (
      <button
        onClick={handleSwitch}
        disabled={isPending}
        className={clsx(
          "flex items-center gap-2 text-sm font-medium transition-all duration-300",
          "text-brand-silver hover:text-brand-gold",
          isPending && "opacity-50 cursor-wait",
          className
        )}
        aria-label={t("switchLang")}
      >
        <span className="text-base">{targetConfig.flag}</span>
        <span>{targetConfig.label}</span>
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <button
        onClick={handleSwitch}
        disabled={isPending}
        className={clsx(
          "relative flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-semibold",
          "border border-brand-gold/25 hover:border-brand-gold/60",
          "text-brand-gold-light hover:text-brand-gold",
          "bg-brand-gold/5 hover:bg-brand-gold/10",
          "transition-all duration-300",
          "overflow-hidden group",
          isPending && "opacity-60 cursor-wait",
          className
        )}
        aria-label={t("switchLang")}
      >
        {/* Shimmer on hover */}
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-brand-gold/10 to-transparent" />

        <span className="text-base leading-none">{targetConfig.flag}</span>
        <span className="relative z-10">{targetConfig.label}</span>

        {/* Direction indicator */}
        <span className="text-xs opacity-50 relative z-10">
          {targetConfig.dir === "rtl" ? "←" : "→"}
        </span>
      </button>
    );
  }

  // Dropdown variant (for mobile nav etc.)
  return (
    <div className={clsx("relative", className)}>
      <button
        onClick={handleSwitch}
        disabled={isPending}
        className={clsx(
          "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl",
          "bg-brand-steel/50 hover:bg-brand-steel border border-brand-gold/15 hover:border-brand-gold/30",
          "text-brand-off-white transition-all duration-300",
          isPending && "opacity-60 cursor-wait"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{localeConfig[locale].flag}</span>
          <span className="text-sm font-medium">{localeConfig[locale].label}</span>
        </div>
        <div className="flex items-center gap-1 text-brand-silver text-xs">
          <span>→</span>
          <span className="text-lg">{targetConfig.flag}</span>
          <span className="font-medium">{targetConfig.label}</span>
        </div>
      </button>
    </div>
  );
}
