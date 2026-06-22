// أيقونات SVG مخصصة للموقع — مستوحاة من Lucide Icons (MIT license)
// الاستخدام: القيمة المحفوظة = "svgicon:{id}"

export type IconDef = {
  id: string;
  label: string;
  category: "stats" | "ads" | "quality";
};

export const ICON_CATEGORIES = {
  stats:   "إحصائيات وأرقام",
  ads:     "دعاية وإعلان",
  quality: "جودة وأعمال",
} as const;

// ─── Icon content (inner SVG elements, no wrapper) ────────────────────────────

const ICON_CONTENT: Record<string, string> = {
  // ── إحصائيات ─────────────────────────────────────────────────────────────
  trophy:
    '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>' +
    '<path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>' +
    '<path d="M4 22h16"/>' +
    '<path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.23 7 22"/>' +
    '<path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.23 17 22"/>' +
    '<path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',

  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>' +
    '<circle cx="9" cy="7" r="4"/>' +
    '<path d="M22 21v-2a4 4 0 0 0-3-3.87"/>' +
    '<path d="M16 3.13a4 4 0 0 1 0 7.75"/>',

  "map-pin":
    '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>' +
    '<circle cx="12" cy="10" r="3"/>',

  phone:
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.58 1.36h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',

  star:
    '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',

  "bar-chart":
    '<line x1="18" x2="18" y1="20" y2="10"/>' +
    '<line x1="12" x2="12" y1="20" y2="4"/>' +
    '<line x1="6" x2="6" y1="20" y2="16"/>',

  clock:
    '<circle cx="12" cy="12" r="10"/>' +
    '<polyline points="12 6 12 12 16 14"/>',

  home:
    '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>' +
    '<polyline points="9 22 9 12 15 12 15 22"/>',

  // ── دعاية وإعلان ─────────────────────────────────────────────────────────
  megaphone:
    '<path d="m3 11 18-5v12L3 14v-3z"/>' +
    '<path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',

  flag:
    '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>' +
    '<line x1="4" x2="4" y1="22" y2="15"/>',

  layout:
    '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>' +
    '<line x1="3" x2="21" y1="9" y2="9"/>' +
    '<line x1="9" x2="9" y1="21" y2="9"/>',

  image:
    '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>' +
    '<circle cx="9" cy="9" r="2"/>' +
    '<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',

  zap:
    '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',

  sparkles:
    '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',

  globe:
    '<circle cx="12" cy="12" r="10"/>' +
    '<line x1="2" x2="22" y1="12" y2="12"/>' +
    '<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',

  target:
    '<circle cx="12" cy="12" r="10"/>' +
    '<circle cx="12" cy="12" r="6"/>' +
    '<circle cx="12" cy="12" r="2"/>',

  // ── جودة وأعمال ──────────────────────────────────────────────────────────
  shield:
    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',

  "check-circle":
    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>' +
    '<polyline points="22 4 12 14.01 9 11.01"/>',

  award:
    '<circle cx="12" cy="8" r="6"/>' +
    '<path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',

  diamond:
    '<path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z"/>',

  crown:
    '<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>',

  lock:
    '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>' +
    '<path d="M7 11V7a5 5 0 0 1 10 0v4"/>',

  rocket:
    '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>' +
    '<path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>' +
    '<path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>' +
    '<path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',

  infinity:
    '<path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4z"/>' +
    '<path d="M12 12c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z"/>',
};

// ─── Icon metadata ────────────────────────────────────────────────────────────

export const SITE_ICONS: IconDef[] = [
  // إحصائيات
  { id: "trophy",     label: "كأس جائزة",   category: "stats"   },
  { id: "users",      label: "فريق / عملاء", category: "stats"   },
  { id: "map-pin",    label: "موقع / منطقة", category: "stats"   },
  { id: "phone",      label: "هاتف / تواصل", category: "stats"   },
  { id: "star",       label: "نجمة / تقييم", category: "stats"   },
  { id: "bar-chart",  label: "إحصائية",      category: "stats"   },
  { id: "clock",      label: "ساعة / وقت",   category: "stats"   },
  { id: "home",       label: "مقر / مبنى",   category: "stats"   },
  // دعاية وإعلان
  { id: "megaphone",  label: "إعلان / مكبر", category: "ads"     },
  { id: "flag",       label: "علم / راية",   category: "ads"     },
  { id: "layout",     label: "لافتة / تصميم",category: "ads"     },
  { id: "image",      label: "صورة / بانر",  category: "ads"     },
  { id: "zap",        label: "سرعة / طاقة",  category: "ads"     },
  { id: "sparkles",   label: "تألق / مميز",  category: "ads"     },
  { id: "globe",      label: "عالمي / انتشار",category: "ads"    },
  { id: "target",     label: "هدف / دقة",    category: "ads"     },
  // جودة وأعمال
  { id: "shield",     label: "حماية / أمان", category: "quality" },
  { id: "check-circle",label: "موثوق / مؤكد",category: "quality" },
  { id: "award",      label: "جائزة / تميز", category: "quality" },
  { id: "diamond",    label: "جوهرة / جودة", category: "quality" },
  { id: "crown",      label: "تاج / ريادة",  category: "quality" },
  { id: "lock",       label: "أمان / سرية",  category: "quality" },
  { id: "rocket",     label: "انطلاق / نمو", category: "quality" },
  { id: "infinity",   label: "استمرارية",    category: "quality" },
];

export const ICON_MAP = Object.fromEntries(
  SITE_ICONS.map(i => [i.id, i])
) as Record<string, IconDef>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isSvgIcon(v: string | undefined | null): boolean {
  return typeof v === "string" && v.startsWith("svgicon:");
}

export function getIconId(v: string): string {
  return v.startsWith("svgicon:") ? v.slice(8) : v;
}

// ─── SvgIcon component ────────────────────────────────────────────────────────

export function SvgIcon({
  id,
  size = 24,
  color = "#C9A24B",
  strokeWidth = 2,
}: {
  id: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const content = ICON_CONTENT[id];
  if (!content) return <span style={{ fontSize: size * 0.8, lineHeight: 1, color }}>◆</span>;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      style={{ display: "block", flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
