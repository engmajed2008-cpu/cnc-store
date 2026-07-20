"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { User, Mail, Phone, MapPin, Save, LogOut, ShoppingBag, Settings, Camera, Check } from "lucide-react";
import dynamic from "next/dynamic";
import type { AddressData } from "@/components/address/AddressPicker";

const AddressPicker = dynamic(() => import("@/components/address/AddressPicker").then(m => m.AddressPicker), { ssr: false });
import { supabase } from "@/lib/supabaseClient";
import BrandMark from "@/components/brand/BrandMark";

const G  = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

type UserData = {
  id: string; email: string; name: string;
  phone: string; city: string; avatar: string | null; provider: string;
};

function NavTab({ href, icon: Icon, label, active }: { href: string; icon: React.ElementType; label: string; active?: boolean }) {
  return (
    <Link href={href} style={{
      display: "flex", alignItems: "center", gap: "0.6rem",
      padding: "0.7rem 1.1rem", borderRadius: 10, textDecoration: "none",
      background: active ? "rgba(201,162,75,0.1)" : "transparent",
      border: "1px solid " + (active ? "rgba(201,162,75,0.25)" : "transparent"),
      color: active ? "#C9A24B" : "#888", fontSize: "0.85rem", fontWeight: active ? 700 : 500,
      transition: "all 0.2s",
    }}>
      <Icon size={16} />
      {label}
    </Link>
  );
}

export default function ProfilePage() {
  const locale = useLocale();
  const ar = locale === "ar";
  const [user, setUser]       = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [form, setForm]       = useState({ name: "", phone: "", city: "" });
  const [savedAddress, setSavedAddress] = useState<AddressData | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = "/" + locale + "/login"; return; }
      const u = data.user;
      const userData: UserData = {
        id:       u.id,
        email:    u.email ?? "",
        name:     u.user_metadata?.full_name ?? u.user_metadata?.name ?? "",
        phone:    u.user_metadata?.phone ?? "",
        city:     u.user_metadata?.city ?? "",
        avatar:   u.user_metadata?.avatar_url ?? null,
        provider: u.app_metadata?.provider ?? "email",
      };
      setUser(userData);
      setForm({ name: userData.name, phone: userData.phone, city: userData.city });
      const addr = u.user_metadata?.address ?? null;
      if (addr) setSavedAddress(addr as AddressData);
      setLoading(false);
    });
  }, [locale]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.auth.updateUser({ data: { full_name: form.name, phone: form.phone, city: form.city } });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/" + locale;
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, border: "3px solid rgba(201,162,75,0.2)", borderTopColor: "#C9A24B", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style dangerouslySetInnerHTML={{ __html: "@keyframes spin{to{transform:rotate(360deg)}}" }} />
    </div>
  );

  if (!user) return null;

  const initials = (user.name || user.email).slice(0, 2).toUpperCase();

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: "transparent", fontFamily: "Tajawal, Cairo, sans-serif" }}>

      {/* Top bar */}
      <div style={{ borderBottom: "1px solid rgba(201,162,75,0.08)", background: "rgba(13,13,13,0.95)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href={"/" + locale} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <BrandMark size={34} />
            <span style={{ fontSize: ar ? "0.9rem" : "1rem", fontWeight: 900, ...GT }}>{ar ? "سوق الدعاية والإعلان" : "E3lani"}</span>
          </Link>
          <button onClick={handleLogout} style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.45rem 1rem", borderRadius: 999,
            border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)",
            color: "#f87171", fontSize: "0.78rem", fontWeight: 600,
            cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
          }}>
            <LogOut size={13} />
            {ar ? "تسجيل الخروج" : "Sign Out"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 2rem", display: "grid", gridTemplateColumns: "280px 1fr", gap: "2rem" }} className="profile-grid">

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Avatar card */}
          <div style={{ background: "#F4EFE6", borderRadius: 16, border: "1px solid rgba(201,162,75,0.1)", padding: "2rem 1.5rem", textAlign: "center" }}>
            <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 1rem" }}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(201,162,75,0.3)" }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 900, color: "#2C1E15" }}>{initials}</div>
              )}
              {user.provider === "google" && (
                <div style={{ position: "absolute", bottom: 2, [ar ? "left" : "right"]: 2, width: 22, height: 22, borderRadius: "50%", background: "#fff", border: "2px solid #FDFBF7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="13" height="13" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                </div>
              )}
            </div>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: "#2C1E15", marginBottom: "0.25rem" }}>{user.name || (ar ? "العميل" : "Customer")}</div>
            <div style={{ fontSize: "0.75rem", color: "#666" }} dir="ltr">{user.email}</div>
          </div>

          {/* Nav */}
          <div style={{ background: "#F4EFE6", borderRadius: 16, border: "1px solid rgba(201,162,75,0.1)", padding: "0.75rem" }}>
            <NavTab href={"/" + locale + "/profile"} icon={Settings} label={ar ? "الملف الشخصي" : "Profile"} active />
            <NavTab href={"/" + locale + "/orders"}  icon={ShoppingBag} label={ar ? "طلباتي" : "My Orders"} />
          </div>
        </div>

        {/* Form */}
        <div style={{ background: "#F4EFE6", borderRadius: 16, border: "1px solid rgba(201,162,75,0.1)", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#2C1E15", margin: "0 0 0.4rem 0" }}>
            {ar ? "معلوماتي الشخصية" : "Personal Information"}
          </h2>
          <p style={{ fontSize: "0.82rem", color: "#666", margin: "0 0 2rem 0" }}>
            {ar ? "يمكنك تعديل بياناتك في أي وقت" : "You can update your details anytime"}
          </p>

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#C9A24B" }}>{ar ? "الاسم الكامل" : "Full Name"}</label>
              <div style={{ position: "relative" }}>
                <User size={15} style={{ position: "absolute", top: "50%", [ar?"right":"left"]: "0.9rem", transform: "translateY(-50%)", color: "#555", pointerEvents: "none" }} />
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder={ar ? "اسمك الكامل" : "Your full name"}
                  style={{ width: "100%", padding: "0.75rem 1rem", paddingInlineStart: "2.5rem", borderRadius: 10, border: "1.5px solid rgba(201,162,75,0.15)", background: "rgba(255,255,255,0.04)", color: "#2C1E15", fontSize: "0.9rem", outline: "none", fontFamily: "Tajawal, Cairo, sans-serif", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor="rgba(201,162,75,0.5)")}
                  onBlur={(e)  => (e.target.style.borderColor="rgba(201,162,75,0.15)")}
                />
              </div>
            </div>

            {/* Email (readonly) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#555" }}>{ar ? "البريد الإلكتروني" : "Email"}</label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", top: "50%", [ar?"right":"left"]: "0.9rem", transform: "translateY(-50%)", color: "#444", pointerEvents: "none" }} />
                <input value={user.email} readOnly dir="ltr"
                  style={{ width: "100%", padding: "0.75rem 1rem", paddingInlineStart: "2.5rem", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "#555", fontSize: "0.9rem", outline: "none", fontFamily: "Tajawal, Cairo, sans-serif", boxSizing: "border-box", cursor: "not-allowed" }}
                />
              </div>
              <span style={{ fontSize: "0.72rem", color: "#444" }}>{ar ? "لا يمكن تغيير البريد الإلكتروني" : "Email cannot be changed"}</span>
            </div>

            {/* Phone */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#C9A24B" }}>{ar ? "رقم الجوال" : "Phone"}</label>
              <div style={{ position: "relative" }}>
                <Phone size={15} style={{ position: "absolute", top: "50%", [ar?"right":"left"]: "0.9rem", transform: "translateY(-50%)", color: "#555", pointerEvents: "none" }} />
                <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+966 5X XXX XXXX" dir="ltr"
                  style={{ width: "100%", padding: "0.75rem 1rem", paddingInlineStart: "2.5rem", borderRadius: 10, border: "1.5px solid rgba(201,162,75,0.15)", background: "rgba(255,255,255,0.04)", color: "#2C1E15", fontSize: "0.9rem", outline: "none", fontFamily: "Tajawal, Cairo, sans-serif", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor="rgba(201,162,75,0.5)")}
                  onBlur={(e)  => (e.target.style.borderColor="rgba(201,162,75,0.15)")}
                />
              </div>
            </div>

            {/* City */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#C9A24B" }}>{ar ? "المدينة" : "City"}</label>
              <div style={{ position: "relative" }}>
                <MapPin size={15} style={{ position: "absolute", top: "50%", [ar?"right":"left"]: "0.9rem", transform: "translateY(-50%)", color: "#555", pointerEvents: "none" }} />
                <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  placeholder={ar ? "مثال: الرياض" : "e.g. Riyadh"}
                  style={{ width: "100%", padding: "0.75rem 1rem", paddingInlineStart: "2.5rem", borderRadius: 10, border: "1.5px solid rgba(201,162,75,0.15)", background: "rgba(255,255,255,0.04)", color: "#2C1E15", fontSize: "0.9rem", outline: "none", fontFamily: "Tajawal, Cairo, sans-serif", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor="rgba(201,162,75,0.5)")}
                  onBlur={(e)  => (e.target.style.borderColor="rgba(201,162,75,0.15)")}
                />
              </div>
            </div>

            <button type="submit" disabled={saving} style={{
              marginTop: "0.5rem", padding: "0.85rem", borderRadius: 999,
              background: saved ? "rgba(34,197,94,0.2)" : saving ? "rgba(201,162,75,0.35)" : G,
              border: saved ? "1.5px solid rgba(34,197,94,0.4)" : "none",
              color: saved ? "#4ade80" : "#2C1E15", fontWeight: 800, fontSize: "0.92rem",
              fontFamily: "Tajawal, Cairo, sans-serif", cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              transition: "all 0.3s",
            }}>
              {saving ? (
                <><span style={{ width:16,height:16,border:"2.5px solid #F4EFE6",borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite" }}/>{ar?"جارٍ الحفظ...":"Saving..."}</>
              ) : saved ? (
                <><Check size={17}/>{ar?"تم الحفظ!":"Saved!"}</>
              ) : (
                <><Save size={17}/>{ar?"حفظ التغييرات":"Save Changes"}</>
              )}
            </button>
          </form>
        </div>

        {/* Address Picker — full width below the grid */}
      </div>

      {/* Address section */}
      <div style={{ maxWidth: 1100, margin: "0 auto 3rem", padding: "0 2rem" }}>
        <AddressPicker
          locale={locale}
          value={savedAddress}
          onSave={async (addr) => {
            await supabase.auth.updateUser({ data: { address: addr } });
            setSavedAddress(addr);
          }}
        />
      </div>

      <style dangerouslySetInnerHTML={{ __html: "@keyframes spin{to{transform:rotate(360deg)}} @media(max-width:768px){.profile-grid{grid-template-columns:1fr!important}}" }} />
    </div>
  );
}
