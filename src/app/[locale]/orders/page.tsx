"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ShoppingBag, Settings, LogOut, Package, Clock, CheckCircle, XCircle, Truck, Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import BrandMark from "@/components/brand/BrandMark";

const G  = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

type Order = {
  id: string; number: string; date: string; status: OrderStatus;
  total: number; items: { name: string; qty: number; price: number }[];
};

const STATUS_CONFIG: Record<OrderStatus, { label: string; labelAr: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:    { label: "Pending",    labelAr: "قيد الانتظار", color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  icon: Clock },
  processing: { label: "Processing", labelAr: "جارٍ التجهيز", color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  icon: Package },
  shipped:    { label: "Shipped",    labelAr: "تم الشحن",     color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",  icon: Truck },
  delivered:  { label: "Delivered",  labelAr: "تم التسليم",   color: "#22c55e", bg: "rgba(34,197,94,0.1)",   icon: CheckCircle },
  cancelled:  { label: "Cancelled",  labelAr: "ملغي",         color: "#ef4444", bg: "rgba(239,68,68,0.1)",   icon: XCircle },
};

// طلبات تجريبية حتى يتم ربط قاعدة البيانات
const DEMO_ORDERS: Order[] = [
  { id: "1", number: "ORD-2025-001", date: "2025-05-20", status: "delivered", total: 850,  items: [{ name: "لوحة معدنية مخصصة", qty: 2, price: 350 }, { name: "قص CNC", qty: 1, price: 150 }] },
  { id: "2", number: "ORD-2025-002", date: "2025-05-26", status: "shipped",   total: 1200, items: [{ name: "ديكور واجهة", qty: 1, price: 1200 }] },
  { id: "3", number: "ORD-2025-003", date: "2025-05-29", status: "processing",total: 450,  items: [{ name: "بنرات إعلانية", qty: 3, price: 150 }] },
  { id: "4", number: "ORD-2025-004", date: "2025-05-30", status: "pending",   total: 320,  items: [{ name: "ملصقات فينيل", qty: 10, price: 32 }] },
];

function StatusBadge({ status, ar }: { status: OrderStatus; ar: boolean }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.35rem",
      padding: "0.3rem 0.8rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700,
      background: cfg.bg, color: cfg.color,
      border: "1px solid " + cfg.color + "30",
    }}>
      <Icon size={12} />
      {ar ? cfg.labelAr : cfg.label}
    </span>
  );
}

function NavTab({ href, icon: Icon, label, active }: { href: string; icon: React.ElementType; label: string; active?: boolean }) {
  return (
    <Link href={href} style={{
      display: "flex", alignItems: "center", gap: "0.6rem",
      padding: "0.7rem 1.1rem", borderRadius: 10, textDecoration: "none",
      background: active ? "rgba(201,162,75,0.1)" : "transparent",
      border: "1px solid " + (active ? "rgba(201,162,75,0.25)" : "transparent"),
      color: active ? "#C9A24B" : "#888", fontSize: "0.85rem", fontWeight: active ? 700 : 500,
    }}>
      <Icon size={16} />{label}
    </Link>
  );
}

export default function OrdersPage() {
  const locale = useLocale();
  const ar = locale === "ar";
  const [user, setUser]         = useState<{ name: string; email: string; avatar: string | null } | null>(null);
  const [orders]                = useState<Order[]>(DEMO_ORDERS);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = "/" + locale + "/login"; return; }
      const u = data.user;
      setUser({ name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? "", email: u.email ?? "", avatar: u.user_metadata?.avatar_url ?? null });
    });
  }, [locale]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/" + locale;
  }

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search && !o.number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total:     orders.length,
    active:    orders.filter((o) => ["pending","processing","shipped"].includes(o.status)).length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    spent:     orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0),
  };

  if (!user) return (
    <div style={{ minHeight: "100vh", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, border: "3px solid rgba(201,162,75,0.2)", borderTopColor: "#C9A24B", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style dangerouslySetInnerHTML={{ __html: "@keyframes spin{to{transform:rotate(360deg)}}" }} />
    </div>
  );

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: "transparent", fontFamily: "Tajawal, Cairo, sans-serif" }}>

      {/* Top bar */}
      <div style={{ borderBottom: "1px solid rgba(201,162,75,0.08)", background: "rgba(13,13,13,0.95)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href={"/" + locale} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <BrandMark size={34} />
            <span style={{ fontSize: ar ? "0.9rem" : "1rem", fontWeight: 900, ...GT }}>{ar ? "سوق الدعاية والإعلان" : "E3lani"}</span>
          </Link>
          <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 1rem", borderRadius: 999, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)", color: "#f87171", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}>
            <LogOut size={13} />{ar ? "تسجيل الخروج" : "Sign Out"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 2rem", display: "grid", gridTemplateColumns: "280px 1fr", gap: "2rem" }} className="orders-grid">

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ background: "#F4EFE6", borderRadius: 16, border: "1px solid rgba(201,162,75,0.1)", padding: "1.5rem", textAlign: "center" }}>
            {user.avatar ? (
              <img src={user.avatar} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(201,162,75,0.25)", margin: "0 auto 0.75rem", display: "block" }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: 900, color: "#2C1E15", margin: "0 auto 0.75rem" }}>
                {(user.name || user.email).slice(0,2).toUpperCase()}
              </div>
            )}
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#2C1E15" }}>{user.name || (ar ? "العميل" : "Customer")}</div>
            <div style={{ fontSize: "0.72rem", color: "#666", marginTop: "0.2rem" }} dir="ltr">{user.email}</div>
          </div>
          <div style={{ background: "#F4EFE6", borderRadius: 16, border: "1px solid rgba(201,162,75,0.1)", padding: "0.75rem" }}>
            <NavTab href={"/" + locale + "/profile"} icon={Settings}     label={ar ? "الملف الشخصي" : "Profile"} />
            <NavTab href={"/" + locale + "/orders"}  icon={ShoppingBag}  label={ar ? "طلباتي" : "My Orders"} active />
          </div>
        </div>

        {/* Main */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))", gap: "0.75rem" }}>
            {[
              { label: ar?"إجمالي الطلبات":"Total Orders",   value: stats.total,               suffix: "" },
              { label: ar?"طلبات نشطة":"Active Orders",      value: stats.active,              suffix: "" },
              { label: ar?"تم التسليم":"Delivered",          value: stats.delivered,           suffix: "" },
              { label: ar?"إجمالي الإنفاق":"Total Spent",    value: stats.spent.toLocaleString(),suffix: ar?" ر.س":" SAR" },
            ].map((s,i) => (
              <div key={i} style={{ background: "#F4EFE6", borderRadius: 12, padding: "1rem 1.25rem", border: "1px solid rgba(201,162,75,0.1)" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#2C1E15" }}>{s.value}{s.suffix}</div>
                <div style={{ fontSize: "0.72rem", color: "#666", marginTop: "0.2rem" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Header + search */}
          <div style={{ background: "#F4EFE6", borderRadius: 16, border: "1px solid rgba(201,162,75,0.1)", overflow: "hidden" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(201,162,75,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#2C1E15", margin: 0 }}>{ar ? "سجل الطلبات" : "Order History"}</h2>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <div style={{ position: "relative" }}>
                  <Search size={13} style={{ position: "absolute", top: "50%", [ar?"right":"left"]: "0.75rem", transform: "translateY(-50%)", color: "#555", pointerEvents: "none" }} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={ar?"رقم الطلب...":"Order number..."}
                    style={{ padding: "0.5rem 0.75rem", paddingInlineStart: "2.2rem", borderRadius: 8, border: "1px solid rgba(201,162,75,0.15)", background: "rgba(255,255,255,0.04)", color: "#2C1E15", fontSize: "0.78rem", outline: "none", fontFamily: "Tajawal, Cairo, sans-serif" }}
                    onFocus={(e) => (e.target.style.borderColor="rgba(201,162,75,0.4)")}
                    onBlur={(e)  => (e.target.style.borderColor="rgba(201,162,75,0.15)")}
                  />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid rgba(201,162,75,0.15)", background: "#F4EFE6", color: "#888", fontSize: "0.78rem", outline: "none", fontFamily: "Tajawal, Cairo, sans-serif", cursor: "pointer" }}>
                  <option value="all">{ar?"كل الحالات":"All Status"}</option>
                  {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map((s) => (
                    <option key={s} value={s}>{ar ? STATUS_CONFIG[s].labelAr : STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: "4rem", textAlign: "center" }}>
                <ShoppingBag size={40} color="rgba(201,162,75,0.2)" style={{ margin: "0 auto 1rem", display: "block" }} />
                <p style={{ color: "#555", fontSize: "0.88rem" }}>{ar ? "لا توجد طلبات" : "No orders found"}</p>
              </div>
            ) : filtered.map((order) => (
              <div key={order.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  style={{ padding: "1.1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: "1rem", flexWrap: "wrap" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(201,162,75,0.03)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Package size={18} color="#C9A24B" />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#2C1E15" }} dir="ltr">{order.number}</div>
                      <div style={{ fontSize: "0.72rem", color: "#666" }}>{new Date(order.date).toLocaleDateString(ar?"ar-SA":"en-US",{year:"numeric",month:"short",day:"numeric"})}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    <StatusBadge status={order.status} ar={ar} />
                    <div style={{ textAlign: ar?"left":"right" }}>
                      <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#C9A24B" }}>{order.total.toLocaleString()} {ar?"ر.س":"SAR"}</div>
                      <div style={{ fontSize: "0.7rem", color: "#555" }}>{order.items.length} {ar?"منتج":"item(s)"}</div>
                    </div>
                    <span style={{ color: "#555", fontSize: "0.8rem", transform: expanded===order.id?"rotate(180deg)":"rotate(0)", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
                  </div>
                </div>

                {expanded === order.id && (
                  <div style={{ padding: "0 1.5rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.9rem", borderRadius: 8, background: "rgba(255,255,255,0.02)" }}>
                          <div style={{ fontSize: "0.85rem", color: "#CCC" }}>{item.name} <span style={{ color: "#555" }}>x{item.qty}</span></div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#C9A24B" }}>{(item.price * item.qty).toLocaleString()} {ar?"ر.س":"SAR"}</div>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0.9rem", marginTop: "0.25rem", borderTop: "1px solid rgba(201,162,75,0.1)" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#888" }}>{ar?"المجموع":"Total"}</span>
                        <span style={{ fontSize: "1rem", fontWeight: 900, color: "#C9A24B" }}>{order.total.toLocaleString()} {ar?"ر.س":"SAR"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: "@keyframes spin{to{transform:rotate(360deg)}} @media(max-width:768px){.orders-grid{grid-template-columns:1fr!important}}" }} />
    </div>
  );
}
