"use client";
import Link from "next/link";
import { useState } from "react";
import type { AdminInfo } from "./layout";

type GroupKey = "site" | "store" | "clients" | "partners";

const BG        = "#F4EFE6";
const BORDER    = "rgba(154,106,42,0.22)";
const TEXT      = "#2C1E15";
const TEXT_MUTED= "#7A5020";
const TEXT_DIM  = "#B89060";
const GOLD      = "#9A6A2A";
const HOVER_BG  = "rgba(154,106,42,0.13)";
const ACT_BG    = "rgba(154,106,42,0.2)";
const G         = "linear-gradient(135deg,#C9A24B,#EBCB7C)";

const siteItems = [
  { href: "/admin",            icon: "🗺️", label: "خريطة الصفحة الرئيسية" },
  { href: "/admin/slider",     icon: "🎠", label: "السلايدر" },
  { href: "/admin/home-paths", icon: "🛤️", label: "المسارات الرئيسية" },
  { href: "/admin/stats",      icon: "📊", label: "الإحصائيات والمزايا" },
  { href: "/admin/partner-banner", icon: "🤝", label: "بانر الشراكة" },
  { href: "/admin/colors",     icon: "🎨", label: "ألوان الموقع" },
  { href: "/admin/contact",    icon: "📇", label: "بيانات التواصل" },
];

const storeItems = [
  { href: "/admin/store/main",         icon: "🗂️", label: "الأقسام الرئيسية" },
  { href: "/admin/store/sub",          icon: "📂", label: "الأقسام الفرعية" },
  { href: "/admin/store/products",     icon: "📦", label: "المنتجات" },
  { href: "/admin/store/pricing",      icon: "💰", label: "أسعار الحروف LED" },
  { href: "/admin/store/fonts",        icon: "🔤", label: "خطوط المصمّم" },
  { href: "/admin/store/materials",    icon: "🔩", label: "خامات الحروف (قديم)" },
  { href: "/admin/store/configurator", icon: "🏗️", label: "مصمّم الحروف v2" },
];

const clientItems = [
  { href: "/admin/users",      icon: "👥", label: "العملاء" },
  { href: "/admin/complaints", icon: "🔔", label: "الشكاوي" },
];

const partnerItems = [
  { href: "/admin/partners",     icon: "🤝", label: "طلبات الانضمام" },
  { href: "/admin/pledge-terms", icon: "📜", label: "شروط التعهد" },
];

const groups: { key: GroupKey; label: string; items: typeof siteItems }[] = [
  { key: "site",     label: "إدارة الصفحة الرئيسية", items: siteItems },
  { key: "store",    label: "إدارة المنتجات",          items: storeItems },
  { key: "clients",  label: "إدارة العملاء",            items: clientItems },
  { key: "partners", label: "إدارة الشركاء",           items: partnerItems },
];

function NavLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href} prefetch={false}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: "0.7rem",
        padding: "0.65rem 1rem 0.65rem 1.75rem", borderRadius: 9,
        color: hov ? TEXT : TEXT_MUTED, fontSize: "0.87rem", textDecoration: "none",
        background: hov ? HOVER_BG : "transparent",
        transition: "background 0.18s, color 0.18s",
      }}
    >
      <span style={{ fontSize: "1rem", flexShrink: 0 }}>{icon}</span>
      <span style={{ fontWeight: hov ? 700 : 500 }}>{label}</span>
    </Link>
  );
}

function GroupHeader({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", padding: "0.72rem 1rem", borderRadius: 10, border: "none",
        background: open ? ACT_BG : "transparent",
        cursor: "pointer", textAlign: "right", transition: "background 0.22s",
      }}
      onMouseEnter={(e) => { if (!open) (e.currentTarget as HTMLElement).style.background = HOVER_BG; }}
      onMouseLeave={(e) => { if (!open) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <span style={{ fontSize: "0.83rem", fontWeight: 800, color: open ? GOLD : TEXT_MUTED, transition: "color 0.2s" }}>
        {label}
      </span>
      <span style={{
        fontSize: "0.7rem", color: open ? GOLD : TEXT_DIM,
        display: "inline-block",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.28s cubic-bezier(.4,0,.2,1), color 0.2s",
      }}>▾</span>
    </button>
  );
}

export function AdminSidebar({
  adminInfo,
  onLogout,
}: {
  adminInfo: AdminInfo | null;
  onLogout: () => void;
}) {
  const [openGroup, setOpenGroup] = useState<GroupKey | null>("site");
  const [logoutLoading, setLogoutLoading] = useState(false);

  const toggle = (key: GroupKey) => setOpenGroup((prev) => (prev === key ? null : key));

  const handleLogout = async () => {
    setLogoutLoading(true);
    await onLogout();
    setLogoutLoading(false);
  };

  const initials = adminInfo?.name
    ? adminInfo.name.trim()[0]
    : adminInfo?.email?.[0]?.toUpperCase() ?? "م";

  return (
    <aside style={{
      width: 240, background: BG, borderLeft: `1px solid ${BORDER}`,
      display: "flex", flexDirection: "column",
      position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 100,
      boxShadow: "-4px 0 24px rgba(0,0,0,0.18)",
    }}>
      {/* Logo */}
      <div style={{ padding: "1.5rem 1.25rem", borderBottom: `1px solid ${BORDER}`, background: "rgba(0,0,0,0.06)" }}>
        <div style={{
          fontWeight: 900, fontSize: "1rem",
          background: "linear-gradient(135deg,#9A6A2A,#C9A24B)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>سوق الدعاية والإعلان</div>
        <div style={{ fontSize: "0.65rem", color: TEXT_MUTED, marginTop: "0.2rem", fontWeight: 600 }}>لوحة التحكم</div>
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1, padding: "0.75rem",
        display: "flex", flexDirection: "column", gap: "0.15rem",
        overflowY: "auto", overflowX: "hidden",
      }}>
        {groups.map((g, gi) => {
          const isOpen = openGroup === g.key;
          return (
            <div key={g.key}>
              {gi > 0 && <div style={{ height: 1, background: BORDER, margin: "0.35rem 0.25rem" }} />}
              <GroupHeader label={g.label} open={isOpen} onToggle={() => toggle(g.key)} />
              <div style={{
                overflow: "hidden",
                maxHeight: isOpen ? g.items.length * 46 + 16 + "px" : "0px",
                opacity: isOpen ? 1 : 0,
                transition: "max-height 0.32s cubic-bezier(.4,0,.2,1), opacity 0.22s ease",
              }}>
                <div style={{ paddingBottom: 6 }}>
                  {g.items.map((item) => <NavLink key={item.href} {...item} />)}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer — admin info + actions */}
      <div style={{ borderTop: `1px solid ${BORDER}`, background: "rgba(0,0,0,0.05)" }}>

        {/* Admin avatar + info */}
        {adminInfo && (
          <div style={{ padding: "0.9rem 1.25rem 0.65rem", display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: G, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.95rem", fontWeight: 900, color: "#2C1E15",
              boxShadow: "0 2px 8px rgba(201,162,75,0.35)",
            }}>{initials}</div>
            <div style={{ minWidth: 0 }}>
              {adminInfo.name && (
                <div style={{ fontSize: "0.8rem", fontWeight: 800, color: TEXT, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {adminInfo.name}
                </div>
              )}
              <div style={{ fontSize: "0.65rem", color: TEXT_MUTED, direction: "ltr", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {adminInfo.email}
              </div>
            </div>
          </div>
        )}

        {/* Profile settings link */}
        <div style={{ paddingInline: "1rem", paddingBottom: "0.4rem" }}>
          <Link href="/admin/profile" prefetch={false} style={{
            display: "flex", alignItems: "center", gap: "0.55rem",
            padding: "0.5rem 0.75rem", borderRadius: 9,
            color: TEXT_MUTED, fontSize: "0.8rem", textDecoration: "none",
            fontWeight: 600, transition: "background 0.18s, color 0.18s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = HOVER_BG; (e.currentTarget as HTMLElement).style.color = TEXT; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = TEXT_MUTED; }}
          >
            <span>⚙️</span><span>إعدادات الحساب</span>
          </Link>
        </div>

        {/* View site + logout */}
        <div style={{ display: "flex", gap: 6, padding: "0.4rem 1rem 1rem" }}>
          <Link href="/ar" target="_blank" prefetch={false} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem",
            color: TEXT_MUTED, fontSize: "0.75rem", textDecoration: "none", fontWeight: 600,
            padding: "0.45rem 0.5rem", borderRadius: 9, transition: "background 0.18s",
            border: `1px solid ${BORDER}`, background: "transparent",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = HOVER_BG; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <span>🌐</span><span>الموقع</span>
          </Link>

          <button onClick={handleLogout} disabled={logoutLoading} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem",
            color: "#B43232", fontSize: "0.75rem", fontWeight: 700,
            padding: "0.45rem 0.5rem", borderRadius: 9, cursor: logoutLoading ? "wait" : "pointer",
            border: "1px solid rgba(180,50,50,0.25)", background: "transparent",
            fontFamily: "Tajawal, Cairo, sans-serif", transition: "background 0.18s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(180,50,50,0.08)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <span>🚪</span><span>{logoutLoading ? "..." : "خروج"}</span>
          </button>
        </div>

      </div>
    </aside>
  );
}
