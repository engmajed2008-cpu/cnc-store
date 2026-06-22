/**
 * BrandWordmark — كلمة العلامة بالنص: «إعلاني» + E3LANI.COM
 *
 * نصّي قابل للتعديل (لون، حجم، خط، تباعد أحرف، إظهار الدومين)
 * — مستقلٌّ تماماً عن BrandLogo فيستخدم بجواره أو فوقه أو يُحذف.
 * يفترض RTL من سياق الأب؛ في LTR استخدم prop dir="ltr".
 *
 * variant:
 *   "dark"  — على الخلفية البنية: «إعلاني» كريمي + دومين ذهبي
 *   "cream" — على الخلفية الكريمية: «إعلاني» بني داكن + دومين برونزي
 *   "gold"  — تدرج ذهبي على كلمة «إعلاني» (للهيرو والصفحات الفاخرة)
 */

import React from "react";

const G_GOLD = "linear-gradient(135deg,#EBCB7C 0%,#C9A24B 50%,#8C6822 100%)";

type Variant = "dark" | "cream" | "gold";

export default function BrandWordmark({
  variant = "dark",
  size = 1, // مضاعف الحجم: 1 افتراضي، 1.5 للـ hero، 0.7 للنافبار المصغّر
  showDomain = true,
  showDescriptor = true,
  dir,
  ar = true, // إن كان false يُعرض "E3lani" بدل "إعلاني"
}: {
  variant?: Variant;
  size?: number;
  showDomain?: boolean;
  showDescriptor?: boolean;
  dir?: "rtl" | "ltr";
  ar?: boolean;
}) {
  // ألوان لكل خلفية — مدروسة للتباين العالي
  const palette =
    variant === "cream"
      ? { name: "#F4EFE6", domain: "#9A6A2A", descriptor: "#5C4A36" }
      : { name: "#F4EFE6", domain: "#C9A24B", descriptor: "#634E40" };

  const nameStyle: React.CSSProperties =
    variant === "gold"
      ? {
          background: G_GOLD,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          color: "transparent",
        }
      : { color: palette.name };

  // أحجام محسوبة بـ rem ليرث rhythm الموقع
  const nameSize = (1.05 * size).toFixed(3) + "rem";
  const domainSize = (0.55 * size).toFixed(3) + "rem";
  const descriptorSize = (0.55 * size).toFixed(3) + "rem";

  return (
    <div
      dir={dir}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        lineHeight: 1.25,
        fontFamily:
          "'IBM Plex Sans Arabic', 'Cairo', 'Segoe UI', sans-serif",
      }}
    >
      <span style={{ fontWeight: 900, fontSize: nameSize, ...nameStyle }}>
        {ar ? "إعلاني" : "E3lani"}
      </span>
      {showDomain && (
        <span
          dir="ltr"
          style={{
            fontSize: domainSize,
            color: palette.domain,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          E3LANI.COM
        </span>
      )}
      {showDescriptor && (
        <span style={{ fontSize: descriptorSize, color: palette.descriptor }}>
          {ar ? "سوق الدعاية والإعلان" : "Advertising & Signage Market"}
        </span>
      )}
    </div>
  );
}
