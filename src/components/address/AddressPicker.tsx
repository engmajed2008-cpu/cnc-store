"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
const MapboxPickerDynamic = dynamic(() => import("./MapboxPicker"), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────
export type AddressData = {
  method: "map" | "national" | "manual";
  nationalCode?: string;
  lat?: number;
  lng?: number;
  street?: string;
  district?: string;
  city?: string;
  postalCode?: string;
  building?: string;
  fullAddress?: string;
};

type Props = {
  locale?: string;
  value?: AddressData | null;
  onChange?: (address: AddressData) => void;
  onSave?: (address: AddressData) => Promise<void>;
};

// ─── Colors ──────────────────────────────────────────────────────────────────
const GOLD = "#C9A24B";
const GOLD_DIM = "rgba(201,162,75,0.15)";
const GOLD_BORDER = "rgba(201,162,75,0.3)";
const BG = "#F4EFE6";
const BG2 = "#F4EFE6";
const BG3 = "#222222";

// ─── National short address format: 4 letters + 4 digits (e.g. RHAB1234) ─────
const SHORT_ADDR_RE = /^[A-Za-z؀-ۿ]{4}\d{4}$/;

function formatNationalCode(raw: string): string {
  // Remove spaces, uppercase
  const clean = raw.replace(/\s+/g, "").toUpperCase().slice(0, 8);
  if (clean.length > 4) return clean.slice(0, 4) + " " + clean.slice(4);
  return clean;
}

// ─── Input field ─────────────────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, maxLength, hint, error, dir,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; maxLength?: number; hint?: string;
  error?: string; dir?: "ltr" | "rtl";
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <label style={{ fontSize: "0.78rem", color: "#aaa", fontWeight: 600 }}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        dir={dir}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: BG3, border: "1.5px solid " + (error ? "#e05555" : focused ? GOLD_BORDER : "rgba(255,255,255,0.08)"),
          borderRadius: 10, padding: "0.75rem 1rem", color: "#f0f0f0",
          fontSize: "0.9rem", outline: "none", transition: "border-color 0.2s",
          width: "100%", boxSizing: "border-box",
        }}
      />
      {hint && !error && <span style={{ fontSize: "0.72rem", color: "#666" }}>{hint}</span>}
      {error && <span style={{ fontSize: "0.72rem", color: "#e05555" }}>{error}</span>}
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────
function Tab({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
      gap: "0.3rem", padding: "0.75rem 0.5rem", borderRadius: 12, border: "none",
      cursor: "pointer", transition: "all 0.2s",
      background: active ? GOLD_DIM : "transparent",
      outline: active ? "1.5px solid " + GOLD_BORDER : "1.5px solid transparent",
    }}>
      <span style={{ fontSize: "1.3rem" }}>{icon}</span>
      <span style={{ fontSize: "0.72rem", fontWeight: active ? 700 : 500, color: active ? GOLD : "#888" }}>{label}</span>
    </button>
  );
}

// ─── Map picker — uses Mapbox GL JS ──────────────────────────────────────────
function MapPicker({
  ar, onSelect,
}: {
  ar: boolean;
  onSelect: (lat: number, lng: number, address: string) => void;
}) {
  return (
    <MapboxPickerDynamic
      ar={ar}
      onSelect={(lat, lng, address) => onSelect(lat, lng, address)}
    />
  );
}

// ─── National Address Method ──────────────────────────────────────────────────
function NationalAddressForm({
  ar, value, onChange,
}: { ar: boolean; value: string; onChange: (v: string, valid: boolean) => void }) {
  const [raw, setRaw] = useState(value || "");
  const [status, setStatus] = useState<"idle" | "loading" | "found" | "error">("idle");
  const [result, setResult] = useState<{
    city?: string; district?: string; street?: string;
    buildingNumber?: string; zipCode?: string; additional?: string;
  } | null>(null);

  const formatted = formatNationalCode(raw);
  const clean = raw.replace(/\s+/g, "");
  const isValid = SHORT_ADDR_RE.test(clean);

  const handleChange = (v: string) => {
    // Allow only letters + numbers, max 8 chars
    const cleaned = v.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
    setRaw(cleaned);
    setStatus("idle");
    setResult(null);
    onChange(cleaned, SHORT_ADDR_RE.test(cleaned));
  };

  // Lookup via Saudi National Address API
  const lookup = async () => {
    if (!isValid) return;
    setStatus("loading");
    try {
      const lang = ar ? "A" : "E";
      const res  = await fetch(`/api/na/short?code=${clean}&lang=${lang}`);
      if (!res.ok) throw new Error("API error");
      const data = await res.json() as {
        Addresses?: Array<{
          City?: string; CityEn?: string;
          District?: string; DistrictEn?: string;
          Street?: string; StreetEn?: string;
          BuildingNumber?: string;
          ZipCode?: string;
          AdditionalNumber?: string;
          ShortAddress?: string;
        }>;
      };

      const addr = data?.Addresses?.[0];
      if (addr) {
        setStatus("found");
        setResult({
          city:     ar ? addr.City     : (addr.CityEn     ?? addr.City),
          district: ar ? addr.District : (addr.DistrictEn ?? addr.District),
          street:   ar ? addr.Street   : (addr.StreetEn   ?? addr.Street),
          buildingNumber: addr.BuildingNumber,
          zipCode:        addr.ZipCode,
          additional:     addr.AdditionalNumber,
        });
        onChange(clean, true);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* What is national address? */}
      <div style={{
        padding: "0.85rem 1rem", borderRadius: 12,
        background: "rgba(201,162,75,0.06)", border: "1px solid rgba(201,162,75,0.12)",
        display: "flex", gap: "0.75rem", alignItems: "flex-start",
      }}>
        <span style={{ fontSize: "1.3rem" }}>🏷️</span>
        <div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: GOLD, marginBottom: "0.3rem" }}>
            {ar ? "ما هو العنوان الوطني المختصر؟" : "What is the National Short Address?"}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#888", lineHeight: 1.6 }}>
            {ar
              ? "رمز مكوّن من 4 أحرف + 4 أرقام يحدد موقعك بدقة في المملكة العربية السعودية. مثال: RHAB1234"
              : "A code of 4 letters + 4 digits that precisely identifies your location in Saudi Arabia. Example: RHAB1234"}
          </div>
        </div>
      </div>

      {/* Input + lookup */}
      <div>
        <label style={{ fontSize: "0.78rem", color: "#aaa", fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>
          {ar ? "العنوان الوطني المختصر" : "National Short Address"}
        </label>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "stretch" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              value={formatted}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={ar ? "مثال: RHAB 1234" : "e.g. RHAB 1234"}
              dir="ltr"
              style={{
                width: "100%", background: BG3,
                border: "1.5px solid " + (isValid && clean.length === 8 ? GOLD_BORDER : clean.length > 0 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.08)"),
                borderRadius: 10, padding: "0.85rem 1rem",
                color: "#f0f0f0", fontSize: "1.05rem", fontFamily: "monospace",
                letterSpacing: "0.12em", outline: "none", boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
            />
            {isValid && (
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: "1rem" }}>✅</span>
            )}
          </div>
          <button
            onClick={lookup}
            disabled={!isValid || status === "loading"}
            style={{
              padding: "0 1.25rem", borderRadius: 10, border: "none", cursor: isValid ? "pointer" : "not-allowed",
              background: isValid ? "linear-gradient(135deg,#C9A24B,#EBCB7C)" : "rgba(255,255,255,0.06)",
              color: isValid ? "#2C1E15" : "#555", fontWeight: 700, fontSize: "0.85rem",
              transition: "all 0.2s", whiteSpace: "nowrap",
            }}
          >
            {status === "loading" ? "⏳" : (ar ? "بحث" : "Search")}
          </button>
        </div>
        {clean.length > 0 && clean.length < 8 && (
          <p style={{ fontSize: "0.72rem", color: "#666", marginTop: "0.35rem" }}>
            {ar ? `${8 - clean.length} أحرف/أرقام متبقية` : `${8 - clean.length} characters remaining`}
          </p>
        )}
      </div>

      {/* Result */}
      {status === "found" && result && (
        <div style={{
          padding: "1rem", borderRadius: 12,
          background: "rgba(201,162,75,0.08)", border: "1.5px solid " + GOLD_BORDER,
        }}>
          <div style={{ fontSize: "0.75rem", color: GOLD, fontWeight: 700, marginBottom: "0.6rem" }}>
            {ar ? "✅ تم العثور على العنوان" : "✅ Address Found"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {[
              [ar ? "المدينة" : "City",           result.city],
              [ar ? "الحي" : "District",           result.district],
              [ar ? "الشارع" : "Street",           result.street],
              [ar ? "رقم المبنى" : "Building No.", result.buildingNumber],
              [ar ? "الرمز البريدي" : "Zip Code",  result.zipCode],
              [ar ? "الرقم الإضافي" : "Additional", result.additional],
              [ar ? "العنوان المختصر" : "Short Address", formatted],
            ].filter(([,v]) => v).map(([k, v]) => (
              <div key={k} style={{ background: BG3, borderRadius: 8, padding: "0.5rem 0.75rem" }}>
                <div style={{ fontSize: "0.68rem", color: "#666" }}>{k}</div>
                <div style={{ fontSize: "0.82rem", color: "#ddd", fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {status === "error" && (
        <div style={{ padding: "0.7rem 1rem", borderRadius: 10, background: "rgba(224,85,85,0.1)", border: "1px solid rgba(224,85,85,0.3)", fontSize: "0.8rem", color: "#e08888" }}>
          {ar ? "⚠️ لم يتم العثور على العنوان. تحقق من الرمز." : "⚠️ Address not found. Please check the code."}
        </div>
      )}

      {/* How to find it */}
      <div style={{ padding: "0.75rem 1rem", borderRadius: 10, background: BG3, display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <span style={{ fontSize: "0.9rem" }}>🔍</span>
        <div style={{ fontSize: "0.75rem", color: "#777", lineHeight: 1.6 }}>
          {ar
            ? <>ابحث عن عنوانك الوطني عبر موقع <span style={{ color: GOLD }}>sp.com.sa</span> أو تطبيق البريد السعودي.</>
            : <>Find your national address at <span style={{ color: GOLD }}>sp.com.sa</span> or the Saudi Post app.</>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Manual Address Form ──────────────────────────────────────────────────────
function ManualForm({
  ar, value, onChange,
}: {
  ar: boolean;
  value: Partial<AddressData>;
  onChange: (v: Partial<AddressData>) => void;
}) {
  const saudiCities = ar
    ? ["الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام", "الخبر", "أبها", "تبوك", "القصيم", "حائل", "جازان", "نجران", "الطائف", "الجبيل", "ينبع"]
    : ["Riyadh", "Jeddah", "Makkah", "Madinah", "Dammam", "Khobar", "Abha", "Tabuk", "Qassim", "Hail", "Jazan", "Najran", "Taif", "Jubail", "Yanbu"];

  const [cityOpen, setCityOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      {/* City selector */}
      <div style={{ position: "relative" }}>
        <label style={{ fontSize: "0.78rem", color: "#aaa", fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>
          {ar ? "المدينة *" : "City *"}
        </label>
        <button
          onClick={() => setCityOpen(v => !v)}
          style={{
            width: "100%", background: BG3,
            border: "1.5px solid " + (cityOpen ? GOLD_BORDER : "rgba(255,255,255,0.08)"),
            borderRadius: 10, padding: "0.75rem 1rem",
            color: value.city ? "#f0f0f0" : "#555", fontSize: "0.9rem",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            cursor: "pointer", transition: "border-color 0.2s", textAlign: ar ? "right" : "left",
          }}
        >
          <span>{value.city || (ar ? "اختر المدينة..." : "Select city...")}</span>
          <span style={{ transform: cityOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
        </button>
        {cityOpen && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
            background: "#1e1e1e", border: "1.5px solid " + GOLD_BORDER,
            borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            maxHeight: 200, overflowY: "auto",
          }}>
            {saudiCities.map(c => (
              <button key={c} onClick={() => { onChange({ ...value, city: c }); setCityOpen(false); }}
                style={{
                  width: "100%", padding: "0.65rem 1rem", border: "none",
                  background: value.city === c ? GOLD_DIM : "transparent",
                  color: value.city === c ? GOLD : "#ccc", fontSize: "0.87rem",
                  cursor: "pointer", textAlign: ar ? "right" : "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = GOLD_DIM)}
                onMouseLeave={e => (e.currentTarget.style.background = value.city === c ? GOLD_DIM : "transparent")}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2-col grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <Field label={ar ? "الحي" : "District"} value={value.district || ""}
          onChange={v => onChange({ ...value, district: v })}
          placeholder={ar ? "مثال: النخيل" : "e.g. Al Nakheel"} />
        <Field label={ar ? "الرمز البريدي" : "Postal Code"} value={value.postalCode || ""}
          onChange={v => onChange({ ...value, postalCode: v.replace(/\D/g, "").slice(0, 5) })}
          placeholder={ar ? "12345" : "12345"} maxLength={5} dir="ltr" />
      </div>

      <Field label={ar ? "اسم الشارع" : "Street Name"} value={value.street || ""}
        onChange={v => onChange({ ...value, street: v })}
        placeholder={ar ? "مثال: شارع الملك فهد" : "e.g. King Fahd Road"} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <Field label={ar ? "رقم المبنى" : "Building No."} value={value.building || ""}
          onChange={v => onChange({ ...value, building: v })}
          placeholder={ar ? "مثال: 1234" : "e.g. 1234"} maxLength={10} dir="ltr" />
        <Field label={ar ? "الرقم الإضافي (اختياري)" : "Additional No."} value={value.postalCode || ""}
          onChange={v => onChange({ ...value, postalCode: v })}
          placeholder={ar ? "مثال: 5678" : "e.g. 5678"} maxLength={10} dir="ltr" />
      </div>
    </div>
  );
}

// ─── Main AddressPicker ───────────────────────────────────────────────────────
export function AddressPicker({ locale = "ar", value, onChange, onSave }: Props) {
  const ar = locale === "ar";
  const [method, setMethod] = useState<"map" | "national" | "manual">(value?.method || "map");
  const [mapData, setMapData] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [nationalCode, setNationalCode] = useState(value?.nationalCode || "");
  const [manualData, setManualData] = useState<Partial<AddressData>>(value || {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const getAddress = (): AddressData => {
    if (method === "map") return { method, lat: mapData?.lat, lng: mapData?.lng, fullAddress: mapData?.address };
    if (method === "national") return { method, nationalCode, fullAddress: nationalCode };
    return { method, ...manualData };
  };

  const isComplete = () => {
    if (method === "map") return !!mapData;
    if (method === "national") return SHORT_ADDR_RE.test(nationalCode);
    return !!(manualData.city && manualData.street);
  };

  const handleSave = async () => {
    if (!isComplete() || !onSave) return;
    setSaving(true);
    try {
      await onSave(getAddress());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onChange?.(getAddress());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{
      background: BG2, borderRadius: 18,
      border: "1.5px solid rgba(201,162,75,0.15)",
      overflow: "hidden", fontFamily: "Tajawal, Cairo, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: "1.25rem 1.5rem",
        borderBottom: "1px solid rgba(201,162,75,0.1)",
        background: "rgba(201,162,75,0.04)",
        display: "flex", alignItems: "center", gap: "0.75rem",
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: "linear-gradient(135deg,#C9A24B,#EBCB7C)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.1rem",
        }}>📦</div>
        <div>
          <div style={{ fontWeight: 800, color: "#f0f0f0", fontSize: "1rem" }}>
            {ar ? "عنوان التوصيل" : "Delivery Address"}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#777", marginTop: "0.15rem" }}>
            {ar ? "سيُستخدم هذا العنوان لشحن طلبك" : "This address will be used to ship your order"}
          </div>
        </div>
      </div>

      <div style={{ padding: "1.5rem" }}>
        {/* Method tabs */}
        <div style={{
          display: "flex", gap: "0.5rem", marginBottom: "1.5rem",
          background: BG, borderRadius: 14, padding: "0.4rem",
        }}>
          <Tab icon="🗺️" label={ar ? "من الخريطة" : "From Map"} active={method === "map"} onClick={() => setMethod("map")} />
          <Tab icon="🏷️" label={ar ? "عنوان وطني" : "Short Address"} active={method === "national"} onClick={() => setMethod("national")} />
          <Tab icon="✍️" label={ar ? "إدخال يدوي" : "Manual"} active={method === "manual"} onClick={() => setMethod("manual")} />
        </div>

        {/* Method content */}
        {method === "map" && (
          <MapPicker ar={ar} onSelect={(lat, lng, address) => setMapData({ lat, lng, address })} />
        )}
        {method === "national" && (
          <NationalAddressForm ar={ar} value={nationalCode} onChange={(v) => setNationalCode(v)} />
        )}
        {method === "manual" && (
          <ManualForm ar={ar} value={manualData} onChange={setManualData} />
        )}

        {/* Save button */}
        {onSave && (
          <button
            onClick={handleSave}
            disabled={!isComplete() || saving}
            style={{
              marginTop: "1.25rem", width: "100%",
              padding: "0.9rem", borderRadius: 12, border: "none",
              background: isComplete() ? "linear-gradient(135deg,#C9A24B,#EBCB7C)" : "rgba(255,255,255,0.05)",
              color: isComplete() ? "#2C1E15" : "#555",
              fontSize: "0.9rem", fontWeight: 800, cursor: isComplete() ? "pointer" : "not-allowed",
              transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            }}
          >
            {saving ? "⏳" : saved ? "✅" : "💾"}
            {saving ? (ar ? "جاري الحفظ..." : "Saving...") : saved ? (ar ? "تم الحفظ!" : "Saved!") : (ar ? "حفظ العنوان" : "Save Address")}
          </button>
        )}

        {/* Shipping partners note */}
        <div style={{
          marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: 10,
          background: "rgba(201,162,75,0.04)", border: "1px solid rgba(201,162,75,0.08)",
          display: "flex", alignItems: "center", gap: "0.6rem",
        }}>
          <span style={{ fontSize: "0.9rem" }}>🚚</span>
          <span style={{ fontSize: "0.72rem", color: "#666" }}>
            {ar
              ? "يدعم التوصيل عبر: أرامكس، DHL، سمسا، SMSA، ناقل — سيتم الربط التلقائي بأقرب شركة حسب موقعك"
              : "Supports delivery via: Aramex, DHL, SMSA, Naqel — auto-matched to the nearest carrier by location"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default AddressPicker;
