"use client";
import { useState, useEffect } from "react";
import {
  Phone, MessageCircle, Mail, MapPin,
  Instagram, Twitter, Facebook, Youtube, Linkedin,
  Music2, Ghost, Globe, Save, CheckCircle,
} from "lucide-react";
import { siteStore, DEFAULT_CONTACT, type ContactInfo } from "@/store/siteStore";

const G = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

type Field = {
  key: keyof ContactInfo;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  prefix?: string;
  hint?: string;
};

const ICON_SIZE = 16;
const iconStyle = { color: "#C9A24B", flexShrink: 0 } as const;

const SECTIONS: { title: string; fields: Field[] }[] = [
  {
    title: "📞 بيانات التواصل",
    fields: [
      {
        key: "whatsapp",
        label: "واتساب",
        placeholder: "966500000000",
        icon: <MessageCircle size={ICON_SIZE} style={iconStyle} />,
        prefix: "wa.me/",
        hint: "أدخل الرقم مع رمز الدولة بدون + (مثال: 966501234567)",
      },
      {
        key: "phone",
        label: "رقم الجوال",
        placeholder: "966500000000",
        icon: <Phone size={ICON_SIZE} style={iconStyle} />,
        prefix: "tel:",
        hint: "يظهر في صفحة التواصل والتذييل",
      },
      {
        key: "email",
        label: "البريد الإلكتروني",
        placeholder: "info@metalart.sa",
        icon: <Mail size={ICON_SIZE} style={iconStyle} />,
        prefix: "mailto:",
      },
    ],
  },
  {
    title: "📍 العنوان",
    fields: [
      {
        key: "address",
        label: "العنوان (عربي)",
        placeholder: "الرياض، المملكة العربية السعودية",
        icon: <MapPin size={ICON_SIZE} style={iconStyle} />,
      },
      {
        key: "addressEn",
        label: "Address (English)",
        placeholder: "Riyadh, Saudi Arabia",
        icon: <MapPin size={ICON_SIZE} style={iconStyle} />,
      },
    ],
  },
  {
    title: "📱 حسابات التواصل الاجتماعي",
    fields: [
      {
        key: "instagram",
        label: "إنستغرام",
        placeholder: "metalart.sa",
        icon: <Instagram size={ICON_SIZE} style={iconStyle} />,
        prefix: "instagram.com/",
      },
      {
        key: "twitter",
        label: "تويتر / X",
        placeholder: "metalart_sa",
        icon: <Twitter size={ICON_SIZE} style={iconStyle} />,
        prefix: "x.com/",
      },
      {
        key: "snapchat",
        label: "سناب شات",
        placeholder: "metalart.sa",
        icon: <Ghost size={ICON_SIZE} style={iconStyle} />,
        prefix: "snapchat.com/add/",
      },
      {
        key: "tiktok",
        label: "تيك توك",
        placeholder: "@metalart.sa",
        icon: <Music2 size={ICON_SIZE} style={iconStyle} />,
        prefix: "tiktok.com/",
      },
      {
        key: "facebook",
        label: "فيسبوك",
        placeholder: "metalart.sa",
        icon: <Facebook size={ICON_SIZE} style={iconStyle} />,
        prefix: "facebook.com/",
      },
      {
        key: "youtube",
        label: "يوتيوب",
        placeholder: "@metalart",
        icon: <Youtube size={ICON_SIZE} style={iconStyle} />,
        prefix: "youtube.com/",
      },
      {
        key: "linkedin",
        label: "لينكد إن",
        placeholder: "company/metalart",
        icon: <Linkedin size={ICON_SIZE} style={iconStyle} />,
        prefix: "linkedin.com/",
      },
    ],
  },
];

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "0.65rem 0.9rem",
  borderRadius: "0 10px 10px 0",
  background: "#F2E8D0",
  border: "1px solid rgba(154,106,42,0.25)",
  borderRight: "none",
  color: "#2C1E15",
  fontSize: "0.88rem",
  fontFamily: "Tajawal, Cairo, sans-serif",
  outline: "none",
  direction: "ltr",
  textAlign: "left" as const,
};

export default function ContactAdminPage() {
  const [contact, setContact] = useState<ContactInfo>(DEFAULT_CONTACT);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = siteStore.getContact();
    if (stored) setContact(stored);
  }, []);

  const up = (key: keyof ContactInfo, val: string) =>
    setContact((c) => ({ ...c, [key]: val }));

  const handleSave = () => {
    siteStore.saveContact(contact);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ padding: "2.5rem", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl", maxWidth: 760 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ color: "#C9A24B", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            لوحة التحكم / بيانات المؤسسة
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, margin: 0, ...GT }}>
            بيانات التواصل 📇
          </h1>
          <p style={{ color: "#666", marginTop: "0.5rem", fontSize: "0.9rem" }}>
            أرقام التواصل والسوشيال ميديا — تُستخدم تلقائياً في جميع أنحاء الموقع
          </p>
        </div>
        <button
          onClick={handleSave}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.75rem 1.75rem", borderRadius: 999, background: G,
            color: "#2C1E15", fontWeight: 700, fontSize: "0.9rem", border: "none",
            cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif",
            boxShadow: "0 6px 20px rgba(201,162,75,0.3)",
          }}
        >
          <Save size={16} />
          حفظ التغييرات
        </button>
      </div>

      {/* Live preview bar */}
      <div style={{
        marginBottom: "2rem", padding: "1rem 1.5rem", borderRadius: 12,
        background: "#F2E8D0", border: "1px solid rgba(201,162,75,0.12)",
        display: "flex", flexWrap: "wrap", gap: "1.25rem", alignItems: "center",
      }}>
        <span style={{ color: "#555", fontSize: "0.72rem", letterSpacing: "0.1em" }}>معاينة سريعة:</span>
        {contact.whatsapp && (
          <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#25D366", fontSize: "0.82rem", textDecoration: "none" }}>
            <MessageCircle size={14} /> {contact.whatsapp}
          </a>
        )}
        {contact.phone && (
          <a href={`tel:${contact.phone}`}
            style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#C9A24B", fontSize: "0.82rem", textDecoration: "none" }}>
            <Phone size={14} /> {contact.phone}
          </a>
        )}
        {contact.email && (
          <a href={`mailto:${contact.email}`}
            style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#C9A24B", fontSize: "0.82rem", textDecoration: "none" }}>
            <Mail size={14} /> {contact.email}
          </a>
        )}
        {contact.address && (
          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#888", fontSize: "0.82rem" }}>
            <MapPin size={14} style={{ color: "#C9A24B" }} /> {contact.address}
          </span>
        )}
      </div>

      {/* Sections */}
      {SECTIONS.map((section) => (
        <div key={section.title} style={{
          marginBottom: "2rem", background: "#F2E8D0",
          border: "1px solid rgba(201,162,75,0.1)", borderRadius: 16, overflow: "hidden",
        }}>
          <div style={{
            padding: "1rem 1.5rem", borderBottom: "1px solid rgba(201,162,75,0.08)",
            fontWeight: 700, fontSize: "0.9rem", color: "#C9A24B",
          }}>
            {section.title}
          </div>
          <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {section.fields.map(({ key, label, placeholder, icon, prefix, hint }) => (
              <div key={key}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#aaa", fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  {icon} {label}
                </label>
                <div style={{ display: "flex", alignItems: "stretch" }}>
                  {prefix && (
                    <div style={{
                      padding: "0.65rem 0.75rem",
                      background: "rgba(201,162,75,0.06)",
                      border: "1px solid rgba(201,162,75,0.15)",
                      borderLeft: "none",
                      borderRadius: "10px 0 0 10px",
                      color: "#555", fontSize: "0.75rem",
                      display: "flex", alignItems: "center", whiteSpace: "nowrap",
                    }}>
                      {prefix}
                    </div>
                  )}
                  <input
                    value={contact[key]}
                    onChange={(e) => up(key, e.target.value)}
                    placeholder={placeholder}
                    style={{
                      ...inputStyle,
                      borderRadius: prefix ? "0 10px 10px 0" : 10,
                      borderRight: prefix ? "none" : "1px solid rgba(154,106,42,0.25)",
                    }}
                  />
                </div>
                {hint && (
                  <div style={{ marginTop: "0.3rem", color: "#555", fontSize: "0.72rem" }}>
                    💡 {hint}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Social media active links */}
      {(contact.instagram || contact.twitter || contact.snapchat || contact.tiktok || contact.facebook || contact.youtube || contact.linkedin) && (
        <div style={{
          padding: "1rem 1.5rem", borderRadius: 12,
          background: "#F2E8D0", border: "1px solid rgba(201,162,75,0.1)",
          marginBottom: "2rem",
        }}>
          <div style={{ color: "#555", fontSize: "0.72rem", marginBottom: "0.75rem", letterSpacing: "0.1em" }}>
            روابط السوشيال ميديا الفعّالة:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {contact.instagram && <a href={`https://instagram.com/${contact.instagram}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.9rem", borderRadius: 999, background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.2)", color: "#C9A24B", fontSize: "0.8rem", textDecoration: "none" }}><Instagram size={13} /> إنستغرام</a>}
            {contact.twitter && <a href={`https://x.com/${contact.twitter}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.9rem", borderRadius: 999, background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.2)", color: "#C9A24B", fontSize: "0.8rem", textDecoration: "none" }}><Twitter size={13} /> تويتر</a>}
            {contact.snapchat && <a href={`https://snapchat.com/add/${contact.snapchat}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.9rem", borderRadius: 999, background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.2)", color: "#C9A24B", fontSize: "0.8rem", textDecoration: "none" }}><Ghost size={13} /> سناب</a>}
            {contact.tiktok && <a href={`https://tiktok.com/${contact.tiktok}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.9rem", borderRadius: 999, background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.2)", color: "#C9A24B", fontSize: "0.8rem", textDecoration: "none" }}><Music2 size={13} /> تيك توك</a>}
            {contact.facebook && <a href={`https://facebook.com/${contact.facebook}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.9rem", borderRadius: 999, background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.2)", color: "#C9A24B", fontSize: "0.8rem", textDecoration: "none" }}><Facebook size={13} /> فيسبوك</a>}
            {contact.youtube && <a href={`https://youtube.com/${contact.youtube}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.9rem", borderRadius: 999, background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.2)", color: "#C9A24B", fontSize: "0.8rem", textDecoration: "none" }}><Youtube size={13} /> يوتيوب</a>}
            {contact.linkedin && <a href={`https://linkedin.com/${contact.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.9rem", borderRadius: 999, background: "rgba(201,162,75,0.08)", border: "1px solid rgba(201,162,75,0.2)", color: "#C9A24B", fontSize: "0.8rem", textDecoration: "none" }}><Linkedin size={13} /> لينكد إن</a>}
          </div>
        </div>
      )}

      {/* Toast */}
      {saved && (
        <div style={{
          position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(135deg,#1a2e1a,#0f1f0f)",
          border: "1px solid rgba(100,200,100,0.3)",
          color: "#6dcc6d", padding: "0.75rem 2rem", borderRadius: 999,
          fontWeight: 600, fontSize: "0.9rem", zIndex: 9999,
          display: "flex", alignItems: "center", gap: "0.5rem",
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        }}>
          <CheckCircle size={16} />
          تم الحفظ بنجاح
        </div>
      )}
    </div>
  );
}
