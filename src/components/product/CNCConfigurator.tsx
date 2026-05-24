"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { clsx } from "clsx";
import {
  calculatePrice,
  MATERIAL_RATES,
  FINISH_RATES,
  URGENCY_MULTIPLIERS,
  formatSAR,
  formatUSD,
  type PriceBreakdown,
} from "@/lib/priceCalculator";
import type { Locale } from "@/lib/i18n";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface UploadedFile {
  name: string;
  size: number;
  type: string;
  preview?: string;
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

/** Animated number counter */
function AnimatedNumber({
  value,
  decimals = 0,
}: {
  value: number;
  decimals?: number;
}) {
  const [displayed, setDisplayed] = useState(value);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef({ from: value, to: value, startTime: 0 });
  const DURATION = 500;

  useEffect(() => {
    const from = displayed;
    const to = value;
    startRef.current = { from, to, startTime: performance.now() };

    const animate = (now: number) => {
      const elapsed = now - startRef.current.startTime;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      const current = startRef.current.from + (startRef.current.to - startRef.current.from) * eased;
      setDisplayed(current);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return <>{displayed.toFixed(decimals)}</>;
}

/** Segmented control row */
function SegmentedControl({
  options,
  value,
  onChange,
  isRTL,
}: {
  options: { value: string; label: string; sub?: string }[];
  value: string;
  onChange: (v: string) => void;
  isRTL: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx(
            "flex-1 min-w-[120px] px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-250",
            "text-center leading-tight",
            value === opt.value
              ? "border-brand-gold bg-brand-gold/10 text-brand-gold"
              : "border-brand-gold/15 bg-brand-steel/40 text-brand-silver hover:border-brand-gold/35 hover:text-brand-off-white"
          )}
        >
          <span className="block">{opt.label}</span>
          {opt.sub && (
            <span className="block text-[10px] opacity-60 mt-0.5 font-normal">{opt.sub}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Number input with +/- controls */
function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  isRTL,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  isRTL: boolean;
}) {
  return (
    <div className={clsx("flex items-center gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        className="w-9 h-9 rounded-lg border border-brand-gold/20 bg-brand-steel/60 text-brand-silver hover:text-brand-gold hover:border-brand-gold/50 transition-all duration-200 flex items-center justify-center font-bold text-lg flex-shrink-0"
        aria-label="decrease"
      >−</button>
      <div className="flex-1 relative">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
          }}
          className={clsx(
            "w-full bg-brand-steel/60 border border-brand-gold/15 rounded-xl px-3 py-2.5",
            "text-brand-off-white font-mono text-sm focus:outline-none focus:border-brand-gold/50 focus:bg-brand-steel/80",
            "transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            isRTL ? "text-right pr-3" : "text-left pl-3"
          )}
        />
      </div>
      <span className="text-brand-silver text-xs font-mono flex-shrink-0 min-w-[24px]">{suffix}</span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        className="w-9 h-9 rounded-lg border border-brand-gold/20 bg-brand-steel/60 text-brand-silver hover:text-brand-gold hover:border-brand-gold/50 transition-all duration-200 flex items-center justify-center font-bold text-lg flex-shrink-0"
        aria-label="increase"
      >+</button>
    </div>
  );
}

/** Section label */
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="text-brand-off-white/80 text-sm font-semibold mb-3 flex items-center gap-1.5">
      {children}
      {required && <span className="text-brand-gold text-xs">*</span>}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────
// Price Panel
// ─────────────────────────────────────────────────────────────
function PricePanel({
  price,
  locale,
  isRTL,
  t,
  onAddToCart,
  onQuote,
}: {
  price: PriceBreakdown | null;
  locale: string;
  isRTL: boolean;
  t: ReturnType<typeof useTranslations>;
  onAddToCart: () => void;
  onQuote: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const rows: { label: string; sarKey: keyof PriceBreakdown; show?: boolean }[] = [
    { label: t("priceMaterial"),  sarKey: "materialCostSAR" },
    { label: t("priceCutting"),   sarKey: "cuttingCostSAR" },
    { label: t("priceFinish"),    sarKey: "finishCostSAR" },
    { label: t("priceUrgency"),   sarKey: "urgencyFeeSAR" },
  ];

  return (
    <div className="sticky top-24 space-y-4">
      {/* Main price card */}
      <div className="glass-card rounded-2xl overflow-hidden border border-brand-gold/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-gold/10 to-brand-gold/5 px-6 py-4 border-b border-brand-gold/15">
          <p className="text-brand-gold text-xs font-mono tracking-[0.15em] uppercase mb-1">
            {t("priceTitle")}
          </p>
          <div className={clsx("flex items-baseline gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
            {price ? (
              <>
                <span className="text-3xl font-black text-gold-gradient">
                  <AnimatedNumber value={price.totalSAR} />
                </span>
                <span className="text-brand-gold text-sm font-bold">{t("currency")}</span>
                <span className="text-brand-silver text-xs mx-1">≈</span>
                <span className="text-brand-silver text-base font-semibold">
                  $<AnimatedNumber value={price.totalUSD} decimals={2} />
                </span>
                <span className="text-brand-silver/60 text-xs">{t("currencyUSD")}</span>
              </>
            ) : (
              <span className="text-brand-silver text-sm">{t("enterDimensions")}</span>
            )}
          </div>
          {price && (
            <p className={clsx("text-brand-silver/60 text-xs mt-1.5", isRTL ? "text-right" : "text-left")}>
              {t("pricePerUnit")}: <span className="text-brand-gold font-mono">{formatSAR(price.perUnitSAR, locale)}</span> {t("currency")}
              <span className="mx-1.5 opacity-40">|</span>
              <span className="text-brand-silver/70">${formatUSD(price.perUnitUSD)}</span>
            </p>
          )}
        </div>

        {/* Breakdown */}
        {price && (
          <div className="px-6 py-4 space-y-3">
            {/* Toggle breakdown */}
            <button
              onClick={() => setExpanded(!expanded)}
              className={clsx(
                "w-full flex items-center justify-between text-xs text-brand-silver/80 hover:text-brand-gold transition-colors duration-200 pb-2 border-b border-brand-gold/10",
                isRTL ? "flex-row-reverse" : "flex-row"
              )}
            >
              <span className="font-semibold tracking-wide">{t("priceBreakdown")}</span>
              <span className={clsx("transition-transform duration-300", expanded ? "rotate-180" : "")}>▾</span>
            </button>

            {/* Breakdown rows */}
            <div className={clsx("overflow-hidden transition-all duration-400", expanded ? "max-h-64 opacity-100" : "max-h-0 opacity-0")}>
              <div className="space-y-2.5 pt-1">
                {rows.map((row) => {
                  const val = price[row.sarKey] as number;
                  if (val === 0) return null;
                  return (
                    <div key={row.sarKey} className={clsx("flex items-center justify-between text-xs", isRTL ? "flex-row-reverse" : "flex-row")}>
                      <span className="text-brand-silver/70">{row.label}</span>
                      <span className="text-brand-off-white font-mono">
                        {formatSAR(val, locale)} {t("currency")}
                      </span>
                    </div>
                  );
                })}
                <div className={clsx("flex items-center justify-between text-xs pt-2 border-t border-brand-gold/10", isRTL ? "flex-row-reverse" : "flex-row")}>
                  <span className="text-brand-silver/70">{t("priceSubtotal")}</span>
                  <span className="text-brand-off-white font-mono">{formatSAR(price.subtotalSAR, locale)} {t("currency")}</span>
                </div>
                <div className={clsx("flex items-center justify-between text-xs", isRTL ? "flex-row-reverse" : "flex-row")}>
                  <span className="text-brand-silver/70">{t("priceVAT")}</span>
                  <span className="text-brand-off-white font-mono">{formatSAR(price.vatSAR, locale)} {t("currency")}</span>
                </div>
              </div>
            </div>

            {/* Total row */}
            <div className={clsx("flex items-center justify-between pt-2 border-t border-brand-gold/20", isRTL ? "flex-row-reverse" : "flex-row")}>
              <span className="text-brand-off-white font-bold text-sm">{t("priceTotal")}</span>
              <div className={clsx("flex items-baseline gap-1.5", isRTL ? "flex-row-reverse" : "flex-row")}>
                <span className="text-brand-gold font-black text-lg">{formatSAR(price.totalSAR, locale)}</span>
                <span className="text-brand-gold text-xs font-bold">{t("currency")}</span>
              </div>
            </div>

            {/* Min order notice */}
            {price.isMinimumApplied && (
              <div className={clsx("flex items-start gap-2 p-3 rounded-xl bg-amber-500/[0.08] border border-amber-500/20 text-xs text-amber-400/80", isRTL ? "flex-row-reverse text-right" : "flex-row")}>
                <span className="mt-0.5 flex-shrink-0">⚠</span>
                <span>{locale === "ar" ? "طُبّق الحد الأدنى للطلب" : "Minimum order value applied"}</span>
              </div>
            )}
          </div>
        )}

        {/* Exchange rate note */}
        {price && (
          <div className={clsx("px-6 pb-4 text-[11px] text-brand-silver/40 font-mono", isRTL ? "text-right" : "text-left")}>
            {t("exchangeRate")}: 1 USD = 3.75 SAR
          </div>
        )}
      </div>

      {/* CTA buttons */}
      <div className="space-y-2.5">
        <button
          onClick={onAddToCart}
          disabled={!price}
          className={clsx(
            "w-full btn-primary justify-center text-sm font-bold py-3.5 rounded-xl",
            !price && "opacity-40 cursor-not-allowed !transform-none !shadow-none"
          )}
        >
          {/* Cart icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          {t("addToCartBtn")}
        </button>

        <button
          onClick={onQuote}
          disabled={!price}
          className={clsx(
            "w-full btn-secondary justify-center text-sm py-3.5 rounded-xl",
            !price && "opacity-40 cursor-not-allowed !transform-none"
          )}
        >
          {t("requestQuoteBtn")}
        </button>

        <a
          href="https://wa.me/966500000000"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-green-500/30 bg-green-500/[0.07] text-green-400 hover:bg-green-500/[0.12] hover:border-green-500/50 transition-all duration-250 text-sm font-semibold"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {t("whatsappBtn")}
        </a>
      </div>

      {/* Price note */}
      <p className={clsx("text-brand-silver/40 text-[11px] leading-relaxed", isRTL ? "text-right" : "text-left")}>
        {t("priceNote")}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// File Upload
// ─────────────────────────────────────────────────────────────
function FileUpload({
  t,
  isRTL,
  file,
  onFileChange,
}: {
  t: ReturnType<typeof useTranslations>;
  isRTL: boolean;
  file: UploadedFile | null;
  onFileChange: (f: UploadedFile | null) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED = [".dwg", ".dxf", ".pdf", ".ai", ".svg", ".eps"];
  const MAX_MB = 50;

  const handleFile = (raw: File) => {
    const ext = "." + raw.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED.includes(ext)) return;
    if (raw.size > MAX_MB * 1024 * 1024) return;
    onFileChange({ name: raw.name, size: raw.size, type: raw.type });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const formatBytes = (b: number) => {
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
  };

  const extIcon: Record<string, string> = {
    pdf: "📄", svg: "🎨", ai: "🎨", dwg: "📐", dxf: "📐", eps: "🖼"
  };
  const fileExt = file?.name.split(".").pop()?.toLowerCase() ?? "";

  return (
    <div>
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={clsx(
            "relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer",
            "transition-all duration-300",
            isDragging
              ? "border-brand-gold/70 bg-brand-gold/[0.06] scale-[1.01]"
              : "border-brand-gold/20 bg-brand-steel/30 hover:border-brand-gold/40 hover:bg-brand-steel/50"
          )}
        >
          {/* Upload icon */}
          <div className="w-14 h-14 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>

          <p className="text-brand-off-white/80 text-sm mb-1.5">
            {t("uploadDragDrop")}{" "}
            <span className="text-brand-gold font-semibold underline underline-offset-2">
              {t("uploadBrowse")}
            </span>
          </p>
          <p className="text-brand-silver/50 text-xs mb-0.5">{t("uploadFormats")}</p>
          <p className="text-brand-silver/40 text-xs">{t("uploadMaxSize")}</p>

          {/* File type badges */}
          <div className="flex flex-wrap justify-center gap-1.5 mt-4">
            {["DWG", "DXF", "PDF", "AI", "SVG", "EPS"].map((ext) => (
              <span key={ext} className="px-2 py-0.5 rounded-md bg-brand-gold/8 border border-brand-gold/15 text-brand-gold/70 text-[10px] font-mono">
                {ext}
              </span>
            ))}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      ) : (
        /* Uploaded state */
        <div className={clsx(
          "flex items-center gap-4 p-4 rounded-2xl",
          "border border-green-500/25 bg-green-500/[0.05]",
          isRTL ? "flex-row-reverse" : "flex-row"
        )}>
          <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-xl flex-shrink-0">
            {extIcon[fileExt] ?? "📁"}
          </div>
          <div className={clsx("flex-1 min-w-0", isRTL ? "text-right" : "text-left")}>
            <p className="text-brand-off-white text-sm font-semibold truncate">{file.name}</p>
            <div className={clsx("flex items-center gap-2 mt-0.5", isRTL ? "flex-row-reverse justify-end" : "flex-row")}>
              <span className="text-green-400/80 text-xs">✓ {t("uploadSuccess")}</span>
              <span className="text-brand-silver/40 text-xs">·</span>
              <span className="text-brand-silver/50 text-xs font-mono">{formatBytes(file.size)}</span>
            </div>
          </div>
          <button
            onClick={() => onFileChange(null)}
            className="flex-shrink-0 text-brand-silver/50 hover:text-red-400 transition-colors duration-200 p-1.5 rounded-lg hover:bg-red-400/10"
            title={t("uploadRemove")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* No design link */}
      <p className={clsx("mt-3 text-xs text-brand-silver/50", isRTL ? "text-right" : "text-left")}>
        {t("noDesignNote")}{" "}
        <a href="#" className="text-brand-gold hover:underline">{t("noDesignLink")}</a>
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Material Card
// ─────────────────────────────────────────────────────────────
function MaterialCard({
  materialKey,
  isSelected,
  onSelect,
  isRTL,
  t,
}: {
  materialKey: string;
  isSelected: boolean;
  onSelect: () => void;
  isRTL: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const mat = MATERIAL_RATES[materialKey];
  const labelKey = `material${materialKey.charAt(0).toUpperCase() + materialKey.slice(1)}` as any;
  const descKey = `${labelKey}Desc` as any;

  return (
    <button
      onClick={onSelect}
      className={clsx(
        "relative p-4 rounded-2xl border text-left w-full transition-all duration-300 group",
        isRTL ? "text-right" : "text-left",
        isSelected
          ? "border-brand-gold bg-brand-gold/[0.08] shadow-[0_0_0_1px_rgba(201,168,76,0.3)]"
          : "border-brand-gold/12 bg-brand-steel/40 hover:border-brand-gold/30 hover:bg-brand-steel/60"
      )}
    >
      {/* Selected indicator */}
      <div className={clsx(
        "absolute top-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300",
        isRTL ? "left-3" : "right-3",
        isSelected ? "border-brand-gold bg-brand-gold" : "border-brand-gold/25"
      )}>
        {isSelected && <span className="text-brand-charcoal text-[10px]">✓</span>}
      </div>

      <div className={clsx("flex items-start gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
        {/* Icon */}
        <div className={clsx(
          "w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-all duration-300",
          isSelected ? "bg-brand-gold/15 scale-105" : "bg-brand-steel/60"
        )}>
          {mat.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-brand-off-white text-sm font-semibold leading-tight">{t(labelKey)}</p>
          <p className="text-brand-silver/60 text-xs mt-0.5 leading-snug">{t(descKey)}</p>
          <p className="text-brand-gold/70 text-[10px] font-mono mt-1">
            {new Intl.NumberFormat("ar-SA").format(mat.basePricePerCm2 * 100)} SAR/100cm²
          </p>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Configurator
// ─────────────────────────────────────────────────────────────
export function CNCConfigurator() {
  const t = useTranslations("cncProduct");
  const locale = useLocale() as Locale;
  const isRTL = locale === "ar";

  // State
  const [material, setMaterial] = useState<string>("");
  const [thickness, setThickness] = useState<number>(3);
  const [width, setWidth] = useState<number>(50);
  const [height, setHeight] = useState<number>(50);
  const [quantity, setQuantity] = useState<number>(1);
  const [finish, setFinish] = useState<string>("raw");
  const [urgency, setUrgency] = useState<string>("standard");
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  // Computed
  const selectedMat = material ? MATERIAL_RATES[material] : null;
  const thicknessOptions = selectedMat?.thicknessOptions ?? [3, 5, 6, 10];

  // Update thickness when material changes
  const handleMaterialChange = useCallback((mat: string) => {
    setMaterial(mat);
    const opts = MATERIAL_RATES[mat]?.thicknessOptions ?? [];
    setThickness(opts[0] ?? 3);
  }, []);

  // Calculated price (runs every render — lightweight)
  const price = material && width > 0 && height > 0
    ? calculatePrice({ material, thicknessMm: thickness, widthCm: width, heightCm: height, quantity, finish, urgency })
    : null;

  const finishOptions = [
    { value: "raw",      label: t("finishRaw") },
    { value: "painted",  label: t("finishPainted") },
    { value: "powder",   label: t("finishPowder") },
    { value: "anodized", label: t("finishAnodized"), disabled: material !== "cladding" },
  ].filter(o => !(o as any).disabled);

  const urgencyOptions = [
    { value: "standard", label: t("urgencyStandard") },
    { value: "express",  label: t("urgencyExpress") },
    { value: "urgent",   label: t("urgencyUrgent") },
  ];

  const handleAddToCart = () => {
    if (!price) return;
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const handleQuote = () => {
    if (!price) return;
    const msg = locale === "ar"
      ? `طلب عرض سعر CNC:\nالمادة: ${material}\nالسماكة: ${thickness}mm\nالأبعاد: ${width}×${height}cm\nالكمية: ${quantity}\nالإجمالي المقدر: ${price.totalSAR} ر.س`
      : `CNC Quote Request:\nMaterial: ${material}\nThickness: ${thickness}mm\nDimensions: ${width}×${height}cm\nQty: ${quantity}\nEst. Total: ${price.totalSAR} SAR`;
    window.open(`https://wa.me/966500000000?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Area display
  const areaCm2 = width * height;
  const areaM2 = areaCm2 / 10000;

  return (
    <div className={clsx("grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] gap-8 items-start", isRTL ? "lg:rtl" : "")}>
      {/* ── Left: Config form ── */}
      <div className="space-y-6">

        {/* ① Material */}
        <div className="glass-card rounded-2xl p-6">
          <div className={clsx("flex items-center gap-3 mb-5", isRTL ? "flex-row-reverse" : "flex-row")}>
            <div className="w-7 h-7 rounded-full bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold text-xs font-bold flex-shrink-0">
              {isRTL ? "١" : "1"}
            </div>
            <div>
              <p className="text-brand-off-white font-bold text-base">{t("materialLabel")}</p>
              <p className="text-brand-silver/60 text-xs">{isRTL ? "اختر نوع المادة الأساسية" : "Choose your base material"}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.keys(MATERIAL_RATES).map((key) => (
              <MaterialCard
                key={key}
                materialKey={key}
                isSelected={material === key}
                onSelect={() => handleMaterialChange(key)}
                isRTL={isRTL}
                t={t}
              />
            ))}
          </div>
        </div>

        {/* ② Thickness */}
        <div className={clsx("glass-card rounded-2xl p-6 transition-all duration-300", !material && "opacity-50 pointer-events-none")}>
          <div className={clsx("flex items-center gap-3 mb-5", isRTL ? "flex-row-reverse" : "flex-row")}>
            <div className="w-7 h-7 rounded-full bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold text-xs font-bold flex-shrink-0">
              {isRTL ? "٢" : "2"}
            </div>
            <div>
              <p className="text-brand-off-white font-bold text-base">{t("thicknessLabel")}</p>
              <p className="text-brand-silver/60 text-xs">{isRTL ? "السماكة تؤثر على تكلفة القص" : "Thickness affects cutting cost"}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {thicknessOptions.map((mm) => (
              <button
                key={mm}
                onClick={() => setThickness(mm)}
                className={clsx(
                  "px-4 py-2.5 rounded-xl border text-sm font-mono font-semibold transition-all duration-200",
                  thickness === mm
                    ? "border-brand-gold bg-brand-gold/10 text-brand-gold shadow-[0_0_12px_rgba(201,168,76,0.2)]"
                    : "border-brand-gold/15 bg-brand-steel/40 text-brand-silver hover:border-brand-gold/35 hover:text-brand-off-white"
                )}
              >
                {mm} <span className="text-xs opacity-60">{t("thicknessUnit")}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ③ Dimensions + Quantity */}
        <div className={clsx("glass-card rounded-2xl p-6 transition-all duration-300", !material && "opacity-50 pointer-events-none")}>
          <div className={clsx("flex items-center gap-3 mb-5", isRTL ? "flex-row-reverse" : "flex-row")}>
            <div className="w-7 h-7 rounded-full bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold text-xs font-bold flex-shrink-0">
              {isRTL ? "٣" : "3"}
            </div>
            <div>
              <p className="text-brand-off-white font-bold text-base">{t("dimensionsLabel")}</p>
              <p className="text-brand-silver/60 text-xs">{isRTL ? "أدخل الأبعاد بالسنتيمتر" : "Enter dimensions in centimeters"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <div>
              <Label>{t("widthLabel")} ({t("dimensionsUnit")})</Label>
              <NumberInput value={width} onChange={setWidth} min={1} max={300} step={5} suffix={t("dimensionsUnit")} isRTL={isRTL} />
            </div>
            <div>
              <Label>{t("heightLabel")} ({t("dimensionsUnit")})</Label>
              <NumberInput value={height} onChange={setHeight} min={1} max={150} step={5} suffix={t("dimensionsUnit")} isRTL={isRTL} />
            </div>
          </div>

          {/* Area readout */}
          {width > 0 && height > 0 && (
            <div className={clsx(
              "flex items-center gap-4 p-3 rounded-xl bg-brand-gold/[0.05] border border-brand-gold/15 mb-5",
              isRTL ? "flex-row-reverse" : "flex-row"
            )}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
              <span className="text-brand-silver/70 text-xs">{t("areaLabel")}:</span>
              <span className="text-brand-gold font-mono text-sm font-bold">
                {areaCm2.toLocaleString()} cm²
              </span>
              <span className="text-brand-silver/40 text-xs">({areaM2.toFixed(3)} {t("areaUnit")})</span>
            </div>
          )}

          <div>
            <Label>{t("quantityLabel")}</Label>
            <NumberInput value={quantity} onChange={setQuantity} min={1} max={500} step={1} suffix={t("quantityUnit")} isRTL={isRTL} />
            {quantity >= 5 && (
              <p className={clsx("text-green-400/80 text-xs mt-2", isRTL ? "text-right" : "text-left")}>
                ✓ {quantity >= 20
                  ? (locale === "ar" ? "خصم كمية 10% مطبّق" : "Bulk discount 10% applied")
                  : (locale === "ar" ? "خصم كمية 5% مطبّق" : "Bulk discount 5% applied")}
              </p>
            )}
          </div>
        </div>

        {/* ④ Finish */}
        <div className={clsx("glass-card rounded-2xl p-6 transition-all duration-300", !material && "opacity-50 pointer-events-none")}>
          <div className={clsx("flex items-center gap-3 mb-5", isRTL ? "flex-row-reverse" : "flex-row")}>
            <div className="w-7 h-7 rounded-full bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold text-xs font-bold flex-shrink-0">
              {isRTL ? "٤" : "4"}
            </div>
            <div>
              <p className="text-brand-off-white font-bold text-base">{t("finishLabel")}</p>
              <p className="text-brand-silver/60 text-xs">{isRTL ? "نوع التشطيب النهائي" : "Surface finish type"}</p>
            </div>
          </div>
          <SegmentedControl
            options={finishOptions}
            value={finish}
            onChange={setFinish}
            isRTL={isRTL}
          />
        </div>

        {/* ⑤ Urgency */}
        <div className="glass-card rounded-2xl p-6">
          <div className={clsx("flex items-center gap-3 mb-5", isRTL ? "flex-row-reverse" : "flex-row")}>
            <div className="w-7 h-7 rounded-full bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold text-xs font-bold flex-shrink-0">
              {isRTL ? "٥" : "5"}
            </div>
            <div>
              <p className="text-brand-off-white font-bold text-base">{t("urgencyLabel")}</p>
              <p className="text-brand-silver/60 text-xs">{isRTL ? "وقت التسليم المطلوب" : "Required delivery time"}</p>
            </div>
          </div>
          <SegmentedControl
            options={urgencyOptions}
            value={urgency}
            onChange={setUrgency}
            isRTL={isRTL}
          />
        </div>

        {/* ⑥ File Upload */}
        <div className="glass-card rounded-2xl p-6">
          <div className={clsx("flex items-center gap-3 mb-5", isRTL ? "flex-row-reverse" : "flex-row")}>
            <div className="w-7 h-7 rounded-full bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold text-xs font-bold flex-shrink-0">
              {isRTL ? "٦" : "6"}
            </div>
            <div>
              <p className="text-brand-off-white font-bold text-base">{t("designUploadTitle")}</p>
              <p className="text-brand-silver/60 text-xs">{t("designUploadSubtitle")}</p>
            </div>
          </div>
          <FileUpload t={t} isRTL={isRTL} file={uploadedFile} onFileChange={setUploadedFile} />
        </div>

        {/* Added to cart toast */}
        {addedToCart && (
          <div className={clsx(
            "fixed bottom-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl",
            "bg-green-500 text-white font-semibold shadow-2xl",
            "animate-fade-up",
            isRTL ? "left-6" : "right-6"
          )}>
            <span>✓</span>
            <span>{locale === "ar" ? "تمت الإضافة إلى السلة!" : "Added to cart!"}</span>
          </div>
        )}
      </div>

      {/* ── Right: Sticky price panel ── */}
      <PricePanel
        price={price}
        locale={locale}
        isRTL={isRTL}
        t={t}
        onAddToCart={handleAddToCart}
        onQuote={handleQuote}
      />
    </div>
  );
}
