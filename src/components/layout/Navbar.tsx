"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "@/components/theme/ThemeProvider";
import BrandMark from "@/components/brand/BrandMark";
import { siteStore, DEFAULT_COLORS } from "@/store/siteStore";

const G         = "linear-gradient(135deg, #C9A24B, #EBCB7C)";
const NAV_TEXT  = "#2C1E15";
const NAV_MUTED = "#634E40";
const NAV_GOLD  = "#C9A24B";
// للقوائم المنسدلة البيضاء فقط
const BRAND_DARK  = "#2C1B12";
const BRAND_MUTED = "#4A3525";

type Child = {
  ar: string; en: string; href: string;
  icon?: string; descAr?: string; descEn?: string;
};
type MenuItem = {
  key: string; ar: string; en: string;
  href: string | null; children: Child[];
};

const menuItems: MenuItem[] = [
  {
    key: "products",
    ar: "المنتجات", en: "Products",
    href: "/products",
    children: [
      { ar: "اللوحات والأفتات",    en: "Signs & Signage",       href: "/configure/signs",       icon: "🪧", descAr: "اختر المادة والمقاس واحصل على سعر فوري",             descEn: "Choose material & size, get instant price" },
      { ar: "البنرات والفلكسات",   en: "Banners & Flex",        href: "/products/banners",     icon: "🎌", descAr: "طباعة رقمية فائقة الجودة على الفلكس بأي مقاس",           descEn: "High-quality digital printing on flex at any size" },
      { ar: "الأعلام والراياة",    en: "Flags",                 href: "/products/flags",       icon: "🚩", descAr: "أعلام ترويجية وراياة للفعاليات والشركات",                 descEn: "Promotional flags and banners for events and companies" },
      { ar: "الملصقات والستيكر",   en: "Stickers & Labels",     href: "/products/stickers",    icon: "🏷️", descAr: "ملصقات مقطوعة أو مستمرة لكل الأسطح والبيئات",           descEn: "Cut or continuous stickers for all surfaces" },
      { ar: "منتجات ترويجية",      en: "Promotional Products",  href: "/products/promotional", icon: "🎁", descAr: "أقلام وأكواب وملابس وغيرها بشعارك المطبوع",              descEn: "Pens, mugs, apparel and more with your logo" },
      { ar: "معارض وإكسبو",        en: "Exhibitions & Expo",    href: "/products/tradeshow",   icon: "🏛️", descAr: "أجنحة معرضية متكاملة وأنظمة عرض احترافية",              descEn: "Complete exhibition booths and display systems" },
    ],
  },
  {
    key: "configure",
    ar: "صمّم وسعّر", en: "Design & Price",
    href: "/configure",
    children: [
      { ar: "لافتات وأفتات",       en: "Signs & Signage",       href: "/configure/signs",    icon: "🪧", descAr: "اختر المادة والمقاس واحصل على سعر فوري",                  descEn: "Choose material & size, get instant price" },
      { ar: "حروف LED بارزة",      en: "3D LED Letters",        href: "/configure/led",      icon: "💡", descAr: "حروف ثلاثية الأبعاد مضيئة بخطوط عربية وإنجليزية",       descEn: "3D illuminated letters in Arabic and English fonts" },
      { ar: "بنرات وفلكسات",       en: "Banners & Flex",        href: "/configure/banners",  icon: "🖨️", descAr: "حدد المقاس والكمية وارفع ملفك مباشرةً",                  descEn: "Set size and quantity and upload your file directly" },
      { ar: "ملصقات وستيكر",       en: "Stickers & Labels",     href: "/configure/stickers", icon: "✂️", descAr: "قص بالشكل أو مستطيل، لامع أو غير لامع",                 descEn: "Custom cut or rectangle, glossy or matte" },
      { ar: "لوحات أكريليك",       en: "Acrylic Boards",        href: "/configure/acrylic",  icon: "🔲", descAr: "لوحات شفافة أو ملونة بطباعة أمامية وخلفية",             descEn: "Clear or colored boards with front/back printing" },
      { ar: "منتجات ترويجية",      en: "Promo Items",           href: "/configure/promo",    icon: "🎁", descAr: "أكواب وأقلام وملابس بشعارك، الكمية تحدد السعر",          descEn: "Mugs, pens, apparel with your logo" },
    ],
  },
  {
    key: "request",
    ar: "سعّر مشروعك", en: "Price Your Project",
    href: "/request/new",
    children: [],
  },
  {
    key: "join",
    ar: "انضم شريكاً", en: "Join as Partner",
    href: "/join",
    children: [],
  },
];

export default function Navbar({ locale }: { locale: string }) {
  const ar = locale === "ar";
  const other = ar ? "en" : "ar";
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const [navBg, setNavBg] = useState(DEFAULT_COLORS.navBg);

  useEffect(() => {
    const refresh = () => setNavBg(siteStore.getColors().navBg);
    refresh();
    window.addEventListener("siteStore:saved", refresh);
    return () => window.removeEventListener("siteStore:saved", refresh);
  }, []);
  const [switchLocalePath, setSwitchLocalePath] = useState(`/${other}`);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    setSwitchLocalePath(pathname.replace(/^\/(ar|en)/, `/${other}`));
  }, [pathname, other]);

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openMenuRef = useRef<string | null>(null);

  const openDropdown = (key: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openMenuRef.current = key;
    setOpenMenu(key);
  };
  const closeDropdown = () => {
    closeTimer.current = setTimeout(() => {
      openMenuRef.current = null;
      setOpenMenu(null);
    }, 120);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (openMenuRef.current) setOpenMenu(openMenuRef.current);
  };

  const [accountOpen, setAccountOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const extractName = (user: { user_metadata?: { full_name?: string; name?: string }; email?: string } | null) => {
      if (!user) return null;
      const full = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || null;
      return full ? full.split(" ")[0] : null;
    };
    supabase.auth.getSession().then(({ data }) => setUserName(extractName(data.session?.user ?? null)));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => setUserName(extractName(session?.user ?? null)));
    return () => listener.subscription.unsubscribe();
  }, []);

  const navRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        openMenuRef.current = null;
        setOpenMenu(null);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeMenu = menuItems.find((m) => m.key === openMenu);

  return (
    <nav
      ref={navRef}
      dir={ar ? "rtl" : "ltr"}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        background: navBg,
        borderBottom: openMenu ? "1px solid rgba(201,162,75,0.22)" : "1px solid rgba(201,162,75,0.18)",
        fontFamily: "Tajawal, Cairo, sans-serif",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      {/* ROW 1 — Logo / Search / Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0.6rem 0.9rem" : "0.7rem 2.5rem", borderBottom: "1px solid rgba(201,162,75,0.08)", gap: isMobile ? "0.5rem" : "1rem", flexWrap: isMobile ? "wrap" : "nowrap" }}>

        <Link href={`/${locale}`} style={{ display: "flex", alignItems: "center", gap: "0.65rem", textDecoration: "none", flexShrink: 0 }}>
          {ar ? (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.9rem" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.18rem" }}>
                <div style={{ height: isMobile ? 34 : 44, display: "flex", alignItems: "center" }}>
                  <img src="/brand/e3lani-mark.svg" alt="إعلاني" style={{ height: isMobile ? 34 : 44, width: "auto", display: "block" }} />
                </div>
                <span dir="ltr" style={{ fontSize: "0.66rem", color: NAV_GOLD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 800 }}>E3LANI.COM</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.18rem" }}>
                <div style={{ height: isMobile ? 34 : 44, display: "flex", alignItems: "center" }}>
                  <img src="/brand/e3lani-word.svg" alt="إعلاني" style={{ height: isMobile ? 34 : 44, width: "auto", display: "block" }} />
                </div>
                <span style={{ fontSize: "0.78rem", color: NAV_MUTED, fontWeight: 600, whiteSpace: "nowrap" }}>سوق الدعاية والإعلان</span>
              </div>
            </div>
          ) : (
            <>
              <BrandMark size={48} />
              <div>
                <div style={{ fontWeight: 700, fontSize: "1.15rem", lineHeight: 1.25, background: G, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>E3lani</div>
                <div dir="ltr" style={{ fontSize: "0.55rem", color: NAV_GOLD, letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 700, marginTop: "0.15rem" }}>E3LANI.COM</div>
                <div style={{ fontSize: "0.55rem", color: NAV_MUTED }}>Advertising &amp; Signage Market</div>
              </div>
            </>
          )}
        </Link>

        <div style={{ flex: isMobile ? "1 1 100%" : 1, order: isMobile ? 3 : undefined, maxWidth: isMobile ? "100%" : 520, position: "relative" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={ar ? "ابحث عن منتج..." : "Search for a product..."}
            style={{ width: "100%", padding: ar ? "0.55rem 1.2rem 0.55rem 2.8rem" : "0.55rem 2.8rem 0.55rem 1.2rem", borderRadius: 999, border: "1.5px solid rgba(201,162,75,0.2)", background: "rgba(255,255,255,0.06)", color: NAV_TEXT, fontSize: "0.85rem", outline: "none", fontFamily: "Tajawal, Cairo, sans-serif", boxSizing: "border-box" }}
          />
          <span style={{ position: "absolute", top: "50%", [ar ? "left" : "right"]: "0.9rem", transform: "translateY(-50%)", color: NAV_MUTED, pointerEvents: "none", display: "flex" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0 }}>
          <Link href={switchLocalePath} style={{ padding: "0.38rem 0.9rem", borderRadius: 999, border: "1.5px solid rgba(201,162,75,0.25)", background: "rgba(201,162,75,0.06)", color: NAV_TEXT, fontSize: "0.78rem", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
            {ar ? "🇬🇧 EN" : "🇸🇦 AR"}
          </Link>

          <div ref={accountRef} style={{ position: "relative" }}>
            <button
              onClick={() => setAccountOpen(!accountOpen)}
              style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.38rem 0.9rem", borderRadius: 999, border: accountOpen ? `1.5px solid ${NAV_GOLD}` : "1.5px solid rgba(201,162,75,0.2)", background: accountOpen ? "rgba(201,162,75,0.1)" : "transparent", color: NAV_TEXT, fontSize: "0.78rem", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif", whiteSpace: "nowrap", transition: "all 0.2s", fontWeight: 600 }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              {userName ? (
                <span style={{ color: NAV_TEXT, fontWeight: 700 }}>{ar ? `مرحباً ${userName}` : `Hi, ${userName}`}</span>
              ) : (
                <span>{ar ? "حسابي" : "My Account"}</span>
              )}
              <span style={{ fontSize: "0.55rem", transition: "transform 0.2s", transform: accountOpen ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block" }}>▼</span>
            </button>

            {accountOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", [ar ? "right" : "left"]: 0, minWidth: 200, background: "#FFFFFF", border: "1px solid rgba(74,53,37,0.2)", borderRadius: 12, boxShadow: "0 20px 40px rgba(44,27,18,0.12)", overflow: "hidden", zIndex: 1100 }}>
                {userName ? (
                  <>
                    <Link href={`/${locale}/profile`} onClick={() => setAccountOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.85rem 1.1rem", color: BRAND_DARK, fontSize: "0.85rem", textDecoration: "none", borderBottom: "1px solid rgba(74,53,37,0.08)", fontWeight: 600 }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(74,53,37,0.04)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}><span>👤</span><span>{ar ? "ملفي الشخصي" : "My Profile"}</span></Link>
                    <Link href={`/${locale}/orders`} onClick={() => setAccountOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.85rem 1.1rem", color: BRAND_MUTED, fontSize: "0.85rem", textDecoration: "none", borderBottom: "1px solid rgba(74,53,37,0.08)" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(74,53,37,0.04)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}><span>📦</span><span>{ar ? "طلباتي" : "My Orders"}</span></Link>
                    <Link href={`/${locale}/projects`} onClick={() => setAccountOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.85rem 1.1rem", color: BRAND_MUTED, fontSize: "0.85rem", textDecoration: "none", borderBottom: "1px solid rgba(74,53,37,0.08)" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(74,53,37,0.04)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}><span>🎨</span><span>{ar ? "مشاريعي" : "My Projects"}</span></Link>
                    <Link href={`/${locale}/complaints`} onClick={() => setAccountOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.85rem 1.1rem", color: BRAND_MUTED, fontSize: "0.85rem", textDecoration: "none", borderBottom: "1px solid rgba(74,53,37,0.08)" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(74,53,37,0.04)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}><span>🔔</span><span>{ar ? "شكاواي" : "My Complaints"}</span></Link>
                    <button onClick={async () => { setAccountOpen(false); await supabase.auth.signOut(); setUserName(null); }} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.85rem 1.1rem", color: "#dc2626", fontSize: "0.85rem", background: "transparent", border: "none", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif", width: "100%", textAlign: ar ? "right" : "left", fontWeight: 600 }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.05)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}><span>🚪</span><span>{ar ? "تسجيل الخروج" : "Sign Out"}</span></button>
                  </>
                ) : (
                  <>
                    <Link href={`/${locale}/login`} onClick={() => setAccountOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.85rem 1.1rem", color: BRAND_DARK, fontSize: "0.85rem", textDecoration: "none", borderBottom: "1px solid rgba(74,53,37,0.08)", fontWeight: 600 }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(74,53,37,0.04)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}><span>🔑</span><span>{ar ? "تسجيل الدخول" : "Sign In"}</span></Link>
                    <Link href={`/${locale}/register`} onClick={() => setAccountOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.85rem 1.1rem", color: BRAND_MUTED, fontSize: "0.85rem", textDecoration: "none", borderBottom: "1px solid rgba(74,53,37,0.08)" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(74,53,37,0.04)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}><span>✨</span><span>{ar ? "تسجيل جديد" : "Create Account"}</span></Link>
                    <button onClick={() => setAccountOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.85rem 1.1rem", color: "#9A7A5A", fontSize: "0.8rem", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: ar ? "right" : "left", fontFamily: "inherit" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(74,53,37,0.04)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}><span>👤</span><span>{ar ? "متابعة كضيف" : "Continue as Guest"}</span></button>
                  </>
                )}
              </div>
            )}
          </div>

          <Link href={`/${locale}/cart`} style={{ position: "relative", display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.38rem 0.9rem", borderRadius: 999, border: "1.5px solid rgba(201,162,75,0.35)", background: "rgba(201,162,75,0.1)", color: NAV_GOLD, fontSize: "0.78rem", textDecoration: "none", whiteSpace: "nowrap", fontWeight: 700 }}>
            <span style={{ position: "relative" }}>
              🛒
              <span style={{ position: "absolute", top: -6, right: -6, width: 15, height: 15, borderRadius: "50%", background: NAV_GOLD, color: "#2C1E15", fontSize: "0.6rem", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>0</span>
            </span>
            <span>{ar ? "السلة" : "Cart"}</span>
          </Link>
        </div>
      </div>

      {/* ROW 2 — Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: isMobile ? "flex-start" : "center", padding: isMobile ? "0 0.5rem" : "0 2.5rem", gap: "0.25rem", overflowX: isMobile ? "auto" : "visible", WebkitOverflowScrolling: "touch" }}>
        {menuItems.map((item) => (
          <div key={item.key}>
            {item.children.length === 0 && item.href ? (
              <Link
                href={`/${locale}${item.href}`}
                style={{ display: "flex", alignItems: "center", padding: "0.75rem 1.1rem", color: NAV_TEXT, fontSize: "0.88rem", fontWeight: 600, fontFamily: "Tajawal, Cairo, sans-serif", whiteSpace: "nowrap", textDecoration: "none" }}
              >
                {ar ? item.ar : item.en}
              </Link>
            ) : (
              <button
                onMouseEnter={() => openDropdown(item.key)}
                onMouseLeave={closeDropdown}
                onClick={() => item.href && (window.location.href = `/${locale}${item.href}`)}
                style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.75rem 1.1rem", background: "transparent", border: "none", color: openMenu === item.key ? NAV_GOLD : NAV_TEXT, fontSize: "0.88rem", fontWeight: openMenu === item.key ? 800 : 600, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif", borderBottom: openMenu === item.key ? `2px solid ${NAV_GOLD}` : "2px solid transparent", transition: "all 0.2s", whiteSpace: "nowrap" }}
              >
                {ar ? item.ar : item.en}
                <span style={{ fontSize: "0.6rem", transition: "transform 0.2s", transform: openMenu === item.key ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block" }}>▼</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ─── MEGA MENU ─── */}
      {openMenu && activeMenu && activeMenu.children.length > 0 && (
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={closeDropdown}
          style={{
            position: "absolute", top: "100%", left: 0, right: 0,
            background: "#1A1008",
            borderTop: "1px solid rgba(201,162,75,0.12)",
            borderBottom: "1px solid rgba(201,162,75,0.18)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.55)",
            zIndex: 998,
            padding: "28px 2.5rem 32px",
          }}
        >
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 3, height: 18, borderRadius: 2, background: NAV_GOLD }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: NAV_GOLD, letterSpacing: "0.06em" }}>
                  {ar ? (activeMenu.key === "configure" ? "اختر ما تريد تصميمه" : "تصفح الفئات") : "Browse categories"}
                </span>
              </div>
              {activeMenu.href && (
                <Link
                  href={`/${locale}${activeMenu.href}`}
                  onClick={() => setOpenMenu(null)}
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: NAV_MUTED, textDecoration: "none", fontWeight: 600, transition: "color 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = NAV_GOLD; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = NAV_MUTED; }}
                >
                  <span>{ar ? "عرض الكل" : "View all"}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d={ar ? "M19 12H5m7 7-7-7 7-7" : "M5 12h14m-7-7 7 7-7 7"}/></svg>
                </Link>
              )}
            </div>

            {/* Cards grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: 10 }}>
              {activeMenu.children.map((child, i) => (
                <MegaCard
                  key={i}
                  href={`/${locale}${child.href}`}
                  icon={child.icon ?? ""}
                  title={ar ? child.ar : child.en}
                  desc={ar ? (child.descAr ?? "") : (child.descEn ?? "")}
                  rtl={ar}
                  onClick={() => setOpenMenu(null)}
                />
              ))}
            </div>

            {/* Footer hint for configure */}
            {activeMenu.key === "configure" && (
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(201,162,75,0.08)", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13 }}>⬆️</span>
                <span style={{ fontSize: 12, color: NAV_MUTED }}>
                  {ar ? "يمكنك أيضاً رفع ملف تصميمك مباشرةً من أي صفحة" : "You can also upload your design file directly from any page"}
                </span>
                <Link href={`/${locale}/configure`} onClick={() => setOpenMenu(null)} style={{ fontSize: 12, color: NAV_GOLD, textDecoration: "underline", fontWeight: 700 }}>
                  {ar ? "ابدأ الآن" : "Start now"}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function MegaCard({ href, icon, title, desc, rtl, onClick }: {
  href: string; icon: string; title: string; desc: string; rtl: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "flex-start", gap: 14,
        padding: "16px 18px",
        borderRadius: 12,
        border: hovered ? "1px solid rgba(154,106,42,0.45)" : "1px solid rgba(154,106,42,0.18)",
        background: hovered ? "#EBE3D3" : "#2C1E15",
        textDecoration: "none",
        transition: "all 0.18s ease",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.08)",
        direction: rtl ? "rtl" : "ltr",
      }}
    >
      <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: hovered ? "#7A5218" : "#2C1E15", transition: "color 0.18s", whiteSpace: "nowrap" }}>{title}</span>
          <svg
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round"
            style={{ color: "rgba(201,162,75,0.4)", opacity: hovered ? 1 : 0, transition: "opacity 0.18s", flexShrink: 0 }}
          >
            <path d={rtl ? "M19 12H5m7 7-7-7 7-7" : "M5 12h14m-7-7 7 7-7 7"} />
          </svg>
        </div>
        <p style={{ fontSize: 12, color: "#6B5040", lineHeight: 1.6, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{desc}</p>
      </div>
    </Link>
  );
}
