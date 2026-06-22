"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { clsx } from "clsx";
import { ArrowUpRight } from "lucide-react";
type Locale = "ar" | "en";

// â"€â"€ Category Data â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
interface Category {
  id: string;
  icon: string;
  labelKey: string;
  href: string;
  bgClass: string;
  svgPattern: string;
  gridClass: string;
  badgeCode: string;
}

const categories: Category[] = [
  {
    id: "cnc",
    icon: "⚙",
    labelKey: "cnc",
    href: "/products?cat=cnc",
    bgClass: "from-[#2C1E15] via-[#F2E8D8] to-[#EEDDD5]",
    badgeCode: "CNC",
    gridClass: "md:col-span-1 md:row-span-2",
    svgPattern: `
      <defs>
        <pattern id="cg-{id}" width="45" height="45" patternUnits="userSpaceOnUse">
          <path d="M0 0h45v45H0z" fill="none" stroke="#C9A24B" stroke-width=".3" opacity=".2"/>
          <circle cx="0" cy="0" r="1.2" fill="#C9A24B" opacity=".25"/>
          <circle cx="45" cy="0" r="1.2" fill="#C9A24B" opacity=".25"/>
          <circle cx="0" cy="45" r="1.2" fill="#C9A24B" opacity=".25"/>
          <circle cx="45" cy="45" r="1.2" fill="#C9A24B" opacity=".25"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cg-{id})"/>
      <circle cx="50%" cy="48%" r="28%" fill="none" stroke="#C9A24B" stroke-width="1.2" stroke-dasharray="7 4" opacity=".25"/>
      <circle cx="50%" cy="48%" r="20%" fill="none" stroke="#9A6A2A" stroke-width=".8" opacity=".2"/>
      <circle cx="50%" cy="48%" r="7%" fill="#2C1E15" stroke="#C9A24B" stroke-width="1.5" opacity=".6"/>
      <circle cx="50%" cy="48%" r="2.5%" fill="#C9A24B" opacity=".7"/>
      <line x1="22%" y1="48%" x2="43%" y2="48%" stroke="#C9A24B" stroke-width=".8" opacity=".3"/>
      <line x1="57%" y1="48%" x2="78%" y2="48%" stroke="#C9A24B" stroke-width=".8" opacity=".3"/>
      <line x1="50%" y1="20%" x2="50%" y2="41%" stroke="#C9A24B" stroke-width=".8" opacity=".3"/>
      <line x1="50%" y1="55%" x2="50%" y2="76%" stroke="#C9A24B" stroke-width=".8" opacity=".3"/>
      <line x1="50%" y1="20%" x2="50%" y2="15%" stroke="#C9A24B" stroke-width="1.2" opacity=".35"/>
      <line x1="78%" y1="48%" x2="83%" y2="48%" stroke="#C9A24B" stroke-width="1.2" opacity=".35"/>
      <line x1="50%" y1="76%" x2="50%" y2="82%" stroke="#C9A24B" stroke-width="1.2" opacity=".35"/>
      <line x1="22%" y1="48%" x2="17%" y2="48%" stroke="#C9A24B" stroke-width="1.2" opacity=".35"/>
    `,
  },
  {
    id: "decor",
    icon: "✦",
    labelKey: "decor",
    href: "/products?cat=decor",
    bgClass: "from-[#2C1E15] via-[#F3EADA] to-[#EFE5D7]",
    badgeCode: "DECOR",
    gridClass: "md:col-span-1 md:row-span-1",
    svgPattern: `
      <defs>
        <pattern id="ap-{id}" width="70" height="70" patternUnits="userSpaceOnUse">
          <path d="M35 0L70 35L35 70L0 35Z" fill="none" stroke="#C9A24B" stroke-width=".4" opacity=".15"/>
          <circle cx="35" cy="35" r="22" fill="none" stroke="#9A6A2A" stroke-width=".35" opacity=".12"/>
          <circle cx="35" cy="35" r="9" fill="none" stroke="#C9A24B" stroke-width=".35" opacity=".18"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ap-{id})"/>
      <g transform="translate(50%,50%)">
        <polygon points="0,-38 11,-11 38,0 11,11 0,38 -11,11 -38,0 -11,-11" fill="none" stroke="#9A6A2A" stroke-width="1.2" opacity=".35"/>
        <polygon points="0,-25 7,-7 25,0 7,7 0,25 -7,7 -25,0 -7,-7" fill="none" stroke="#C9A24B" stroke-width=".8" opacity=".3"/>
        <circle r="10" fill="#2C1E15" stroke="#C9A24B" stroke-width="1.2" opacity=".7"/>
        <circle r="4" fill="#C9A24B" opacity=".6"/>
      </g>
    `,
  },
  {
    id: "signs",
    icon: "◈",
    labelKey: "signs",
    href: "/products?cat=signs",
    bgClass: "from-[#2C1E15] via-[#F1E7D8] to-[#EDE2D5]",
    badgeCode: "SIGNS",
    gridClass: "md:col-span-1 md:row-span-1",
    svgPattern: `
      <defs>
        <pattern id="sp-{id}" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="1.5" fill="#C9A24B" opacity=".08"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#sp-{id})"/>
      <rect x="12%" y="20%" width="76%" height="55%" rx="6" fill="none" stroke="#C9A24B" stroke-width="1.2" stroke-dasharray="7 3" opacity=".25"/>
      <rect x="18%" y="26%" width="64%" height="43%" rx="4" fill="rgba(201,162,75,.02)" stroke="#9A6A2A" stroke-width=".7" opacity=".2"/>
      <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" font-family="JetBrains Mono" font-size="9%" font-weight="700" fill="#C9A24B" opacity=".4">SIGN</text>
      <line x1="22%" y1="78%" x2="78%" y2="78%" stroke="#C9A24B" stroke-width=".5" opacity=".2"/>
      <circle cx="50%" cy="84%" r="3%" fill="none" stroke="#C9A24B" stroke-width=".8" opacity=".2"/>
      <line x1="50%" y1="87%" x2="50%" y2="94%" stroke="#C9A24B" stroke-width=".8" opacity=".2"/>
    `,
  },
  {
    id: "ads",
    icon: "◎",
    labelKey: "advertising",
    href: "/products?cat=ads",
    bgClass: "from-[#2C1E15] via-[#F0E6D9] to-[#ECE1D6]",
    badgeCode: "ADS",
    gridClass: "md:col-span-1 md:row-span-1",
    svgPattern: `
      <defs>
        <pattern id="adp-{id}" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="9" cy="9" r="1.4" fill="#C9A24B" opacity=".08"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#adp-{id})"/>
      <path d="M10%,60% Q25%,25% 50%,40% Q75%,55% 90%,20%" fill="none" stroke="#9A6A2A" stroke-width="1.3" opacity=".3" stroke-dasharray="5 3"/>
      <circle cx="50%" cy="40%" r="3%" fill="#C9A24B" opacity=".4"/>
      <circle cx="25%" cy="42%" r="2%" fill="#9A6A2A" opacity=".25"/>
      <circle cx="75%" cy="38%" r="2%" fill="#9A6A2A" opacity=".25"/>
      <line x1="25%" y1="42%" x2="50%" y2="40%" stroke="#C9A24B" stroke-width=".6" opacity=".2" stroke-dasharray="3 2"/>
      <line x1="75%" y1="38%" x2="50%" y2="40%" stroke="#C9A24B" stroke-width=".6" opacity=".2" stroke-dasharray="3 2"/>
    `,
  },
  {
    id: "design",
    icon: "✏",
    labelKey: "design",
    href: "/products?cat=design",
    bgClass: "from-[#2C1E15] via-[#F2E8D8] to-[#EEE3D4]",
    badgeCode: "DESIGN",
    gridClass: "md:col-span-2 md:row-span-1",
    svgPattern: `
      <defs>
        <pattern id="dp-{id}" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="8" cy="8" r="1" fill="#C9A24B" opacity=".08"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dp-{id})"/>
      <line x1="33%" y1="0" x2="33%" y2="100%" stroke="#C9A24B" stroke-width=".4" opacity=".12"/>
      <line x1="66%" y1="0" x2="66%" y2="100%" stroke="#C9A24B" stroke-width=".4" opacity=".12"/>
      <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#C9A24B" stroke-width=".4" opacity=".12"/>
      <path d="M5%,75% C20%,15% 35%,80% 50%,45% S75%,15% 95%,65%" fill="none" stroke="#9A6A2A" stroke-width="1.4" opacity=".3" stroke-dasharray="5 3"/>
      <circle cx="50%" cy="45%" r="2.5%" fill="#C9A24B" opacity=".4"/>
      <circle cx="20%" cy="48%" r="1.5%" fill="none" stroke="#C9A24B" stroke-width="1" opacity=".25"/>
      <circle cx="80%" cy="42%" r="1.5%" fill="none" stroke="#C9A24B" stroke-width="1" opacity=".25"/>
      <rect x="76%" y="15%" width="7%" height="7%" rx="2" fill="#C9A24B" opacity=".35"/>
      <rect x="85%" y="15%" width="7%" height="7%" rx="2" fill="#9A6A2A" opacity=".3"/>
      <rect x="80.5%" y="24%" width="7%" height="7%" rx="2" fill="#C9A24B" opacity=".25"/>
    `,
  },
];

// â"€â"€ Card Component â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
function CategoryCard({
  cat,
  label,
  desc,
  index,
  isRTL,
  locale,
}: {
  cat: Category;
  label: string;
  desc: string;
  index: number;
  isRTL: boolean;
  locale: string;
}) {
  const svgFilled = cat.svgPattern.replace(/{id}/g, cat.id);

  return (
    <Link
      href={`/${locale}${cat.href}`}
      className={clsx(
        "group relative rounded-2xl overflow-hidden cursor-pointer",
        "border border-brand-gold/30 hover:border-brand-gold/60",
        "transition-all duration-500 hover:-translate-y-1.5 hover:scale-[1.01]",
        "hover:shadow-[0_24px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(201,162,75,0.15)]",
        cat.gridClass,
        // min heights
        cat.id === "cnc" ? "min-h-[280px] md:min-h-0" : "min-h-[200px] md:min-h-0"
      )}
      style={{
        animationDelay: `${index * 0.1}s`,
      }}
    >
      {/* BG gradient */}
      <div className={clsx("absolute inset-0 bg-gradient-to-br transition-opacity duration-500", cat.bgClass)} />

      {/* SVG pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.85] transition-transform duration-700 group-hover:scale-[1.04]"
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        dangerouslySetInnerHTML={{ __html: svgFilled }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent transition-all duration-500 group-hover:from-black/25" />

      {/* Shimmer sweep on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-brand-gold/[0.08] to-transparent pointer-events-none" />

      {/* Content */}
      <div
        className={clsx(
          "absolute inset-0 p-5 flex flex-col justify-between z-10",
          isRTL ? "items-end text-right" : "items-start text-left"
        )}
      >
        {/* Top row: icon + arrow */}
        <div className={clsx("flex items-start w-full", isRTL ? "flex-row-reverse" : "flex-row", "justify-between")}>
          {/* Icon */}
          <div
            className={clsx(
              "w-11 h-11 rounded-xl flex items-center justify-center text-xl",
              "bg-brand-gold/[0.2] border border-brand-gold/40 text-[#F4EFE6]",
              "transition-all duration-400 group-hover:bg-brand-gold/[0.3] group-hover:scale-110 group-hover:border-brand-gold/60"
            )}
          >
            {cat.icon}
          </div>

          {/* Arrow button */}
          <div
            className={clsx(
              "w-8 h-8 rounded-full flex items-center justify-center",
              "border border-brand-gold/40 bg-brand-gold/[0.15] text-[#F4EFE6]",
              "opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100",
              "transition-all duration-400 delay-100"
            )}
          >
            <ArrowUpRight size={14} />
          </div>
        </div>

        {/* Bottom: badge + title + desc */}
        <div className="space-y-1.5">
          {/* Badge â€" appears on hover */}
          <div
            className={clsx(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
              "bg-brand-gold/[0.2] border border-brand-gold/40",
              "text-[#F4EFE6] text-[0.6rem] font-mono tracking-[0.1em] uppercase w-fit",
              "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0",
              "transition-all duration-400"
            )}
          >
            <span className="w-1 h-1 rounded-full bg-[#F4EFE6]" />
            {cat.badgeCode}
          </div>

          <h3 className="text-[#F4EFE6] font-bold leading-tight"
            style={{ fontSize: "clamp(0.95rem,2vw,1.15rem)" }}>
            {label}
          </h3>

          <p
            className={clsx(
              "text-[#ECE3D2] text-xs leading-relaxed",
              "opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-14",
              "transition-all duration-400 overflow-hidden"
            )}
          >
            {desc}
          </p>
        </div>
      </div>
    </Link>
  );
}

// â"€â"€ Main Component â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
export function CategoryGrid() {
  const t = useTranslations("categories");
  const locale = useLocale() as Locale;
  const isRTL = locale === "ar";

  const categoryData: Record<string, { label: string; desc: string }> = {
    cnc: { label: t("cnc.title"), desc: t("cnc.desc") },
    decor: { label: t("decor.title"), desc: t("decor.desc") },
    signs: { label: t("signs.title"), desc: t("signs.desc") },
    advertising: { label: t("advertising.title"), desc: t("advertising.desc") },
    design: { label: t("design.title"), desc: t("design.desc") },
  };

  return (
    <section id="categories" className="py-24 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-brand-steel/20" />

      <div className="section-container relative z-10">
        {/* Section header */}
        <div className={clsx("mb-14", isRTL ? "text-right" : "text-left")}>
          <span className="inline-block text-brand-gold text-xs font-mono tracking-[0.22em] uppercase mb-3 opacity-80">
            {isRTL ? "أقسامنا" : "Our Categories"}
          </span>
          <h2 className="font-extrabold text-brand-off-white mb-3 leading-[1.12]"
            style={{ fontSize: "clamp(1.9rem,4.5vw,3rem)" }}>
            {isRTL ? (
              <>كل ما تحتاجه <span className="text-gold-gradient">تحت سقف واحد</span></>
            ) : (
              <>Everything You Need <span className="text-gold-gradient">Under One Roof</span></>
            )}
          </h2>
          <p className="text-brand-silver leading-relaxed max-w-xl"
            style={{ fontSize: "clamp(.9rem,1.6vw,1rem)" }}>
            {isRTL
              ? "خمسة أقسام متخصصة تجمع الإبداع الفني مع التقنية المتقدمة، لنقدم لك حلولاً متكاملة لا مثيل لها"
              : "Five specialized sections combining artistic creativity with advanced technology, delivering unparalleled integrated solutions"}
          </p>
          <div className={clsx("mt-5 h-0.5 w-14 bg-gold-gradient rounded-full", isRTL ? "me-auto" : "ms-0")} />
        </div>

        {/* Grid */}
        <div
          className={clsx(
            "grid gap-3.5",
            // Mobile: 1 col, sm: 2 col, md: 3 col with specific row spans
            "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
            "md:grid-rows-[320px_220px]"
          )}
        >
          {categories.map((cat, idx) => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              label={categoryData[cat.labelKey]?.label ?? cat.badgeCode}
              desc={categoryData[cat.labelKey]?.desc ?? ""}
              index={idx}
              isRTL={isRTL}
              locale={locale}
            />
          ))}
        </div>

        {/* "View all" link */}
        <div className={clsx("mt-10 flex", isRTL ? "justify-end" : "justify-start")}>
          <Link
            href={`/${locale}/products`}
            className={clsx(
              "inline-flex items-center gap-2 text-sm text-brand-gold hover:text-brand-gold-light",
              "border-b border-brand-gold/30 hover:border-brand-gold pb-px",
              "transition-all duration-300",
              isRTL ? "flex-row-reverse" : "flex-row"
            )}
          >
            {isRTL ? "عرض جميع المنتجات" : "View All Products"}
            <ArrowUpRight size={14} className={clsx("transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5", isRTL && "rotate-180")} />
          </Link>
        </div>
      </div>
    </section>
  );
}

