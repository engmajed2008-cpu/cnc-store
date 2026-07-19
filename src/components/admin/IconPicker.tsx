"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { SITE_ICONS, ICON_CATEGORIES, isSvgIcon, getIconId, SvgIcon } from "@/lib/siteIcons";

const ImageUploader = dynamic(() => import("./ImageUploader"), { ssr: false });

interface IconPickerProps {
  value: string;
  onChange: (val: string) => void;
}

type Mode = "emoji" | "icon" | "image";
type Cat  = keyof typeof ICON_CATEGORIES;

function isUrl(v: string | undefined | null): boolean {
  if (!v) return false;
  return v.startsWith("http") || v.startsWith("/") || v.startsWith("data:");
}

function getMode(v: string): Mode {
  if (isSvgIcon(v)) return "icon";
  if (isUrl(v))     return "image";
  return "emoji";
}

const SIZE_SPECS = [
  { label: "المقاس المثالي",   val: "64×64 أو 128×128 بكسل" },
  { label: "الصيغ المقبولة",   val: "PNG · SVG · WebP" },
  { label: "الحجم الأقصى",     val: "500 KB" },
  { label: "الخلفية",          val: "شفافة (PNG/SVG) مُفضَّلة" },
];

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const safe = value ?? "";
  const [mode, setMode]     = useState<Mode>(getMode(safe));
  const [cat, setCat]       = useState<Cat>("stats");

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "4px 14px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700,
    border: active ? "none" : "1px solid rgba(154,106,42,0.3)",
    background: active ? "linear-gradient(135deg,#C9A24B,#EBCB7C)" : "transparent",
    color: active ? "#2C1E15" : "#6B5040",
    cursor: "pointer", transition: "all 0.18s", fontFamily: "Tajawal, Cairo, sans-serif",
  });

  const catTabStyle = (active: boolean): React.CSSProperties => ({
    padding: "3px 10px", borderRadius: 999, fontSize: "0.68rem", fontWeight: 700,
    border: active ? "1px solid rgba(154,106,42,0.55)" : "1px solid rgba(154,106,42,0.25)",
    background: active ? "rgba(154,106,42,0.18)" : "transparent",
    color: active ? "#7A5218" : "#9A6A2A",
    cursor: "pointer", transition: "all 0.16s", fontFamily: "Tajawal, Cairo, sans-serif",
  });

  const selectedId = isSvgIcon(safe) ? getIconId(safe) : null;
  const filteredIcons = SITE_ICONS.filter(i => i.category === cat);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* Preview + Mode tabs */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 14px", borderRadius: 10,
        background: "#F2E8D0",
        border: "1px solid rgba(154,106,42,0.25)",
      }}>
        {/* Preview box */}
        <div style={{
          width: 52, height: 52, borderRadius: 10,
          background: "rgba(0,0,0,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, overflow: "hidden",
          border: "1px solid rgba(154,106,42,0.25)",
        }}>
          {isSvgIcon(safe) ? (
            <SvgIcon id={getIconId(safe)} size={34} />
          ) : isUrl(safe) ? (
            <img src={safe} alt="" style={{ width: 36, height: 36, objectFit: "contain" }} />
          ) : (
            <span style={{ fontSize: 30, lineHeight: 1 }}>{safe || "?"}</span>
          )}
        </div>

        {/* Label */}
        <div>
          <div style={{ fontSize: "0.72rem", color: "#5A3E28", marginBottom: 2 }}>المعاينة الحالية</div>
          <div style={{ fontSize: "0.68rem", color: "#9A6A2A" }}>
            {isSvgIcon(safe) ? "أيقونة مخصصة" : isUrl(safe) ? "صورة مرفوعة" : "إيموجي / رمز"}
          </div>
        </div>

        {/* Mode tabs — emoji / icon-library / image (v2) */}
        <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
          <button type="button" style={tabStyle(mode === "emoji")} onClick={() => setMode("emoji")}>إيموجي</button>
          <button type="button" style={tabStyle(mode === "icon")}  onClick={() => setMode("icon")}>أيقونات</button>
          <button type="button" style={tabStyle(mode === "image")} onClick={() => setMode("image")}>صورة</button>
        </div>
      </div>

      {/* ── Emoji mode ── */}
      {mode === "emoji" && (
        <div>
          <input
            value={isUrl(safe) || isSvgIcon(safe) ? "" : safe}
            onChange={e => onChange(e.target.value)}
            placeholder="🏆"
            style={{
              width: "100%", padding: "0.55rem 0.8rem", borderRadius: 8, fontSize: "1.5rem",
              textAlign: "center", border: "1px solid rgba(154,106,42,0.25)",
              background: "#F2E8D0", color: "#2C1E15",
              outline: "none", boxSizing: "border-box", fontFamily: "Tajawal, Cairo, sans-serif",
            }}
          />
          <div style={{ fontSize: "0.7rem", color: "#5A4A3A", marginTop: 6, lineHeight: 1.7 }}>
            اكتب أي إيموجي أو انسخه من{" "}
            <a href="https://emojipedia.org" target="_blank" rel="noopener noreferrer" style={{ color: "#C9A24B" }}>emojipedia.org</a>
            {" "}— على ويندوز:{" "}
            <span style={{ background: "rgba(201,162,75,0.1)", padding: "1px 6px", borderRadius: 4, color: "#C9A24B", fontFamily: "monospace", fontSize: "0.68rem" }}>Win + .</span>
          </div>
        </div>
      )}

      {/* ── Icon library mode ── */}
      {mode === "icon" && (
        <div style={{
          borderRadius: 10, border: "1px solid rgba(154,106,42,0.25)",
          background: "#F2E8D0", overflow: "hidden",
        }}>
          {/* Category filter */}
          <div style={{
            display: "flex", gap: 6, padding: "10px 12px", flexWrap: "wrap",
            borderBottom: "1px solid rgba(154,106,42,0.18)",
            background: "rgba(154,106,42,0.06)",
          }}>
            {(Object.keys(ICON_CATEGORIES) as Cat[]).map(k => (
              <button key={k} style={catTabStyle(cat === k)} onClick={() => setCat(k)}>
                {ICON_CATEGORIES[k]}
              </button>
            ))}
          </div>

          {/* Icon grid */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(8, 1fr)",
            gap: 4, padding: 10,
          }}>
            {filteredIcons.map(icon => {
              const isSelected = selectedId === icon.id;
              return (
                <button
                  key={icon.id}
                  title={icon.label}
                  onClick={() => onChange(`svgicon:${icon.id}`)}
                  style={{
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: 4, padding: "8px 4px", borderRadius: 8,
                    border: isSelected
                      ? "1px solid rgba(154,106,42,0.7)"
                      : "1px solid transparent",
                    background: isSelected
                      ? "rgba(154,106,42,0.16)"
                      : "rgba(154,106,42,0.05)",
                    cursor: "pointer",
                    transition: "all 0.16s",
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLElement).style.background = "rgba(154,106,42,0.12)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(154,106,42,0.35)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLElement).style.background = "rgba(154,106,42,0.05)";
                      (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                    }
                  }}
                >
                  <SvgIcon
                    id={icon.id}
                    size={26}
                    color={isSelected ? "#7A5218" : "#9A6A2A"}
                    strokeWidth={isSelected ? 2.5 : 1.75}
                  />
                  <span style={{
                    fontSize: "0.53rem", color: isSelected ? "#7A5218" : "#6A5040",
                    lineHeight: 1.2, textAlign: "center", maxWidth: 52,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {icon.label.split(" / ")[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div style={{
            padding: "8px 14px",
            borderTop: "1px solid rgba(154,106,42,0.18)",
            fontSize: "0.65rem", color: "#5A4A3A", lineHeight: 1.6,
          }}>
            ✦ 24 أيقونة SVG احترافية بهوية «إعلاني» — مصممة للعرض على الخلفيات الداكنة والفاتحة
          </div>
        </div>
      )}

      {/* ── Image upload mode ── */}
      {mode === "image" && (
        <div>
          <ImageUploader
            value={isUrl(safe) ? safe : null}
            onChange={onChange}
            folder="icons"
            label="رفع أيقونة"
          />

          {/* Size guidelines */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: "6px 12px", marginTop: 10,
            padding: "12px 14px", borderRadius: 8,
            background: "#F2E8D0",
            border: "1px solid rgba(154,106,42,0.25)",
          }}>
            <div style={{ gridColumn: "1 / -1", fontSize: "0.68rem", color: "#9A6A2A", fontWeight: 700, marginBottom: 4 }}>
              📐 مواصفات الأيقونة
            </div>
            {SIZE_SPECS.map(s => (
              <div key={s.label} style={{ fontSize: "0.68rem", color: "#5A4A3A", lineHeight: 1.6 }}>
                <span style={{ color: "#7A5218", fontWeight: 700 }}>{s.label}: </span>
                {s.val}
              </div>
            ))}
            <div style={{ gridColumn: "1 / -1", marginTop: 6, padding: "8px 10px", borderRadius: 6, background: "rgba(154,106,42,0.12)", fontSize: "0.67rem", color: "#7A5A30", lineHeight: 1.7 }}>
              💡 <strong>نصيحة:</strong> الأيقونات الشفافة (PNG بخلفية شفافة أو SVG) تبدو أفضل على الخلفيات الداكنة والفاتحة. تجنب الخلفيات البيضاء الصلبة.
            </div>
          </div>

          {/* Reset to emoji */}
          {isUrl(safe) && (
            <button
              onClick={() => { onChange("✨"); setMode("emoji"); }}
              style={{ marginTop: 8, padding: "4px 12px", borderRadius: 999, background: "transparent", border: "1px solid rgba(201,162,75,0.2)", color: "#7A5A30", fontSize: "0.72rem", cursor: "pointer", fontFamily: "Tajawal, Cairo, sans-serif" }}
            >
              ↩ العودة لإيموجي
            </button>
          )}
        </div>
      )}
    </div>
  );
}
