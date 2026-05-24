"use client";

import { useState, useCallback } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { clsx } from "clsx";
import { useCart, MATERIAL_LABELS, FINISH_LABELS, URGENCY_LABELS } from "@/store/cartStore";
import { formatSAR, formatUSD } from "@/lib/priceCalculator";
import type { Locale } from "@/lib/i18n";

// ─────────────────────────────────────────────────────────────
// Translations (inline — no server fetch needed for client page)
// ─────────────────────────────────────────────────────────────
const T = {
  ar: {
    title: "سلة التسوق", empty: "سلتك فارغة", emptyDesc: "لم تضف أي منتجات بعد. اكتشف خدماتنا وابدأ طلبك.",
    startShopping: "ابدأ التسوق", continueShopping: "مواصلة التسوق",
    item: "منتج", items: "منتجات", pcs: "قطعة",
    material: "المادة", thickness: "السماكة", dimensions: "الأبعاد", qty: "الكمية",
    finish: "التشطيب", urgency: "التسليم", design: "ملف التصميم", area: "المساحة",
    unitPrice: "سعر القطعة", totalPrice: "الإجمالي", remove: "حذف",
    editQty: "تعديل الكمية", addNote: "إضافة ملاحظة", note: "ملاحظة",
    notePlaceholder: "مثال: اللون أحمر غامق، حواف مشطوفة...",
    orderSummary: "ملخص الطلب", subtotal: "المجموع الجزئي",
    shipping: "الشحن", shippingFree: "مجاني", shippingNote: "الشحن مجاني للطلبات فوق 500 ر.س",
    vat: "ضريبة القيمة المضافة (15%)", coupon: "كود الخصم", couponApply: "تطبيق",
    couponSuccess: "تم تطبيق كود الخصم!", couponError: "كود خاطئ أو منتهي الصلاحية",
    couponRemove: "إزالة الكود", total: "الإجمالي", checkout: "إتمام الشراء",
    whatsapp: "اطلب عبر واتساب", clearCart: "تفريغ السلة",
    currency: "ر.س", currencyUSD: "USD", exchangeNote: "1 USD = 3.75 SAR",
    mm: "ملم", cm: "سم", m2: "م²",
    confirmClear: "هل أنت متأكد من تفريغ السلة؟",
    noFile: "لا يوجد",
    discount: "خصم",
    bulkBadge: "خصم كمية",
  },
  en: {
    title: "Shopping Cart", empty: "Your cart is empty", emptyDesc: "You haven't added any products yet. Explore our services and start your order.",
    startShopping: "Start Shopping", continueShopping: "Continue Shopping",
    item: "item", items: "items", pcs: "pcs",
    material: "Material", thickness: "Thickness", dimensions: "Dimensions", qty: "Quantity",
    finish: "Finish", urgency: "Delivery", design: "Design File", area: "Area",
    unitPrice: "Unit Price", totalPrice: "Total", remove: "Remove",
    editQty: "Edit Quantity", addNote: "Add Note", note: "Note",
    notePlaceholder: "e.g. Dark red color, beveled edges...",
    orderSummary: "Order Summary", subtotal: "Subtotal",
    shipping: "Shipping", shippingFree: "Free", shippingNote: "Free shipping on orders over 500 SAR",
    vat: "VAT (15%)", coupon: "Discount Code", couponApply: "Apply",
    couponSuccess: "Coupon applied successfully!", couponError: "Invalid or expired coupon code",
    couponRemove: "Remove Code", total: "Total", checkout: "Proceed to Checkout",
    whatsapp: "Order via WhatsApp", clearCart: "Clear Cart",
    currency: "SAR", currencyUSD: "USD", exchangeNote: "1 USD = 3.75 SAR",
    mm: "mm", cm: "cm", m2: "m²",
    confirmClear: "Are you sure you want to clear the cart?",
    noFile: "None",
    discount: "Discount",
    bulkBadge: "Bulk discount",
  },
};

// ─────────────────────────────────────────────────────────────
// Inline SVG icons
// ─────────────────────────────────────────────────────────────
const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconTag = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Cart Item Card
// ─────────────────────────────────────────────────────────────
function CartItemCard({ item, t, locale, isRTL }: {
  item: ReturnType<typeof useCart>["state"]["items"][0];
  t: typeof T["ar"];
  locale: string;
  isRTL: boolean;
}) {
  const { removeItem, updateQty, updateNote } = useCart();
  const [editingQty, setEditingQty] = useState(false);
  const [tempQty, setTempQty] = useState(item.input.quantity);
  const [showNote, setShowNote] = useState(!!item.note);
  const [noteValue, setNoteValue] = useState(item.note ?? "");
  const [removing, setRemoving] = useState(false);

  const lang = locale as "ar" | "en";
  const mat = MATERIAL_LABELS[item.input.material]?.[lang] ?? item.input.material;
  const fin = FINISH_LABELS[item.input.finish]?.[lang]   ?? item.input.finish;
  const urg = URGENCY_LABELS[item.input.urgency]?.[lang] ?? item.input.urgency;

  const hasBulk = item.input.quantity >= 5;

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(() => removeItem(item.id), 350);
  };

  const handleQtySave = () => {
    if (tempQty >= 1 && tempQty <= 500) updateQty(item.id, tempQty);
    setEditingQty(false);
  };

  const handleNoteSave = () => {
    updateNote(item.id, noteValue);
    setShowNote(!!noteValue);
  };

  const specChips = [
    { label: t.material,   val: mat },
    { label: t.thickness,  val: `${item.input.thicknessMm} ${t.mm}` },
    { label: t.dimensions, val: `${item.input.widthCm} × ${item.input.heightCm} ${t.cm}` },
    { label: t.area,       val: `${item.price.areaCm2.toLocaleString()} cm² (${item.price.areaM2} ${t.m2})` },
    { label: t.finish,     val: fin },
    { label: t.urgency,    val: urg },
  ];

  return (
    <div className={clsx(
      "glass-card rounded-2xl overflow-hidden border border-brand-gold/15",
      "transition-all duration-350",
      removing ? "opacity-0 scale-95 max-h-0" : "opacity-100 scale-100"
    )}>
      {/* Header row */}
      <div className={clsx(
        "flex items-start justify-between gap-4 p-5 border-b border-brand-gold/[0.08]",
        isRTL ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Material icon + title */}
        <div className={clsx("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
          <div className="w-12 h-12 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-xl flex-shrink-0">
            {item.input.material === "steel"    && "🔩"}
            {item.input.material === "acrylic"  && "💎"}
            {item.input.material === "cladding" && "🏗️"}
            {item.input.material === "wood"     && "🪵"}
          </div>
          <div className={isRTL ? "text-right" : "text-left"}>
            <p className="text-brand-off-white font-bold text-sm">
              {locale === "ar" ? "قص CNC" : "CNC Cutting"} — {mat}
            </p>
            <p className="text-brand-silver/60 text-xs mt-0.5 font-mono">
              {item.input.widthCm}×{item.input.heightCm}cm · {item.input.thicknessMm}{t.mm}
            </p>
            {hasBulk && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-semibold">
                <IconCheck /> {t.bulkBadge}
              </span>
            )}
          </div>
        </div>

        {/* Remove */}
        <button
          onClick={handleRemove}
          className="text-brand-silver/40 hover:text-red-400 transition-colors duration-200 p-1.5 rounded-lg hover:bg-red-400/10 flex-shrink-0"
        >
          <IconTrash />
        </button>
      </div>

      {/* Spec chips */}
      <div className="px-5 py-4 flex flex-wrap gap-2">
        {specChips.map(({ label, val }) => (
          <div key={label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-steel/60 border border-brand-gold/10">
            <span className="text-brand-silver/50 text-[10px] uppercase tracking-wide">{label}:</span>
            <span className="text-brand-off-white/80 text-xs font-medium">{val}</span>
          </div>
        ))}
        {item.designFileName && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <span className="text-blue-400/70 text-[10px]">{t.design}:</span>
            <span className="text-blue-300 text-xs font-medium truncate max-w-[120px]">{item.designFileName}</span>
          </div>
        )}
      </div>

      {/* Quantity + price row */}
      <div className={clsx(
        "flex items-center justify-between gap-4 px-5 pb-4",
        isRTL ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Qty editor */}
        <div className={clsx("flex items-center gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
          {!editingQty ? (
            <>
              <span className="text-brand-silver/60 text-xs">{t.qty}:</span>
              <span className="text-brand-off-white font-mono font-bold text-sm">
                {item.input.quantity} {t.pcs}
              </span>
              <button
                onClick={() => { setTempQty(item.input.quantity); setEditingQty(true); }}
                className="text-brand-gold/60 hover:text-brand-gold transition-colors p-1 rounded"
              >
                <IconEdit />
              </button>
            </>
          ) : (
            <div className={clsx("flex items-center gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
              <button onClick={() => setTempQty(Math.max(1, tempQty - 1))}
                className="w-7 h-7 rounded-lg bg-brand-steel/60 border border-brand-gold/20 text-brand-silver hover:text-brand-gold flex items-center justify-center font-bold">−</button>
              <input
                type="number" min={1} max={500} value={tempQty}
                onChange={e => setTempQty(parseInt(e.target.value) || 1)}
                className="w-16 text-center bg-brand-steel border border-brand-gold/30 rounded-lg px-2 py-1 text-brand-off-white font-mono text-sm focus:outline-none focus:border-brand-gold/60"
              />
              <button onClick={() => setTempQty(Math.min(500, tempQty + 1))}
                className="w-7 h-7 rounded-lg bg-brand-steel/60 border border-brand-gold/20 text-brand-silver hover:text-brand-gold flex items-center justify-center font-bold">+</button>
              <button onClick={handleQtySave}
                className="px-3 py-1 rounded-lg bg-brand-gold text-brand-charcoal text-xs font-bold hover:bg-brand-gold-light transition-colors">
                {locale === "ar" ? "حفظ" : "Save"}
              </button>
              <button onClick={() => setEditingQty(false)}
                className="px-3 py-1 rounded-lg border border-brand-gold/20 text-brand-silver text-xs hover:text-brand-off-white transition-colors">
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </button>
            </div>
          )}
        </div>

        {/* Prices */}
        <div className={clsx("text-end space-y-0.5", isRTL ? "text-left" : "text-right")}>
          <p className="text-brand-gold font-black text-lg">
            {formatSAR(item.price.totalSAR, locale)} <span className="text-sm font-bold">{t.currency}</span>
          </p>
          <p className="text-brand-silver/50 text-xs font-mono">
            ≈ ${formatUSD(item.price.totalUSD)}
          </p>
          {item.input.quantity > 1 && (
            <p className="text-brand-silver/40 text-[11px]">
              {t.unitPrice}: {formatSAR(item.price.perUnitSAR, locale)} {t.currency}
            </p>
          )}
        </div>
      </div>

      {/* Note section */}
      <div className="px-5 pb-4">
        {!showNote ? (
          <button
            onClick={() => setShowNote(true)}
            className={clsx(
              "flex items-center gap-1.5 text-brand-gold/60 hover:text-brand-gold text-xs transition-colors",
              isRTL ? "flex-row-reverse" : "flex-row"
            )}
          >
            <IconTag /> {t.addNote}
          </button>
        ) : (
          <div className="space-y-2">
            <label className="text-brand-silver/60 text-xs">{t.note}</label>
            <div className={clsx("flex gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
              <input
                type="text"
                value={noteValue}
                onChange={e => setNoteValue(e.target.value)}
                placeholder={t.notePlaceholder}
                className={clsx(
                  "flex-1 bg-brand-steel/60 border border-brand-gold/15 rounded-xl px-3 py-2 text-brand-off-white text-xs",
                  "focus:outline-none focus:border-brand-gold/40 placeholder:text-brand-silver/30",
                  isRTL ? "text-right" : "text-left"
                )}
              />
              <button onClick={handleNoteSave}
                className="px-3 py-2 rounded-xl bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-xs font-semibold hover:bg-brand-gold/20 transition-colors">
                {locale === "ar" ? "حفظ" : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Order Summary Panel
// ─────────────────────────────────────────────────────────────
function OrderSummary({ t, locale, isRTL }: { t: typeof T["ar"]; locale: string; isRTL: boolean }) {
  const { state, totals, applyCoupon, removeCoupon } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleCoupon = () => {
    if (!couponInput.trim()) return;
    const ok = applyCoupon(couponInput.trim());
    setCouponMsg({ type: ok ? "success" : "error", text: ok ? t.couponSuccess : t.couponError });
    if (ok) setCouponInput("");
    setTimeout(() => setCouponMsg(null), 4000);
  };

  const rows = [
    { label: t.subtotal, value: formatSAR(totals.subtotalSAR, locale), currency: t.currency, color: "text-brand-off-white" },
    ...(totals.couponSAR > 0 ? [{ label: `${t.discount} (${state.couponCode})`, value: `-${formatSAR(totals.couponSAR, locale)}`, currency: t.currency, color: "text-green-400" }] : []),
    { label: t.shipping, value: totals.shippingSAR === 0 ? t.shippingFree : formatSAR(totals.shippingSAR, locale), currency: totals.shippingSAR === 0 ? "" : t.currency, color: totals.shippingSAR === 0 ? "text-green-400" : "text-brand-off-white" },
    { label: t.vat, value: formatSAR(totals.vatSAR, locale), currency: t.currency, color: "text-brand-silver" },
  ];

  return (
    <div className="space-y-4 sticky top-24">
      <div className="glass-card rounded-2xl overflow-hidden border border-brand-gold/20">
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-gold/10 bg-brand-gold/[0.04]">
          <h2 className={clsx("text-brand-gold font-bold text-sm uppercase tracking-wider", isRTL ? "text-right" : "text-left")}>
            {t.orderSummary}
          </h2>
        </div>

        <div className="px-6 py-5 space-y-3.5">
          {rows.map(({ label, value, currency, color }) => (
            <div key={label} className={clsx("flex items-center justify-between", isRTL ? "flex-row-reverse" : "flex-row")}>
              <span className="text-brand-silver/70 text-sm">{label}</span>
              <span className={clsx("font-semibold text-sm", color)}>
                {value} {currency && <span className="text-xs font-normal opacity-70">{currency}</span>}
              </span>
            </div>
          ))}

          {/* Total */}
          <div className={clsx("flex items-center justify-between pt-3 border-t border-brand-gold/15", isRTL ? "flex-row-reverse" : "flex-row")}>
            <span className="text-brand-off-white font-bold">{t.total}</span>
            <div className={clsx("text-end", isRTL ? "text-left" : "text-right")}>
              <p className="text-brand-gold font-black text-xl">{formatSAR(totals.totalSAR, locale)} <span className="text-sm">{t.currency}</span></p>
              <p className="text-brand-silver/50 text-xs font-mono">≈ ${formatUSD(totals.totalUSD)} {t.currencyUSD}</p>
            </div>
          </div>

          {/* Shipping note */}
          {totals.shippingSAR > 0 && (
            <p className={clsx("text-brand-silver/40 text-xs", isRTL ? "text-right" : "text-left")}>{t.shippingNote}</p>
          )}
        </div>

        {/* Coupon */}
        <div className="px-6 pb-5 border-t border-brand-gold/10 pt-4 space-y-3">
          {state.couponCode ? (
            <div className={clsx("flex items-center justify-between gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
              <div className={clsx("flex items-center gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
                <span className="text-green-400"><IconCheck /></span>
                <span className="text-green-400 text-sm font-mono font-bold">{state.couponCode}</span>
              </div>
              <button onClick={removeCoupon} className="text-brand-silver/50 hover:text-red-400 text-xs transition-colors">{t.couponRemove}</button>
            </div>
          ) : (
            <>
              <p className="text-brand-silver/60 text-xs">{t.coupon}</p>
              <div className={clsx("flex gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
                <input
                  type="text" value={couponInput}
                  onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && handleCoupon()}
                  placeholder="METAL15"
                  className={clsx(
                    "flex-1 bg-brand-steel border border-brand-gold/20 rounded-xl px-3 py-2.5",
                    "text-brand-off-white font-mono text-sm focus:outline-none focus:border-brand-gold/50",
                    "placeholder:text-brand-silver/25",
                    isRTL ? "text-right" : "text-left"
                  )}
                />
                <button onClick={handleCoupon}
                  className="px-4 py-2.5 rounded-xl bg-brand-gold/10 border border-brand-gold/25 text-brand-gold text-sm font-bold hover:bg-brand-gold/20 transition-colors whitespace-nowrap">
                  {t.couponApply}
                </button>
              </div>
              {couponMsg && (
                <p className={clsx("text-xs", couponMsg.type === "success" ? "text-green-400" : "text-red-400")}>
                  {couponMsg.text}
                </p>
              )}
              <p className={clsx("text-brand-silver/30 text-[10px] font-mono", isRTL ? "text-right" : "text-left")}>
                {locale === "ar" ? "جرّب: WELCOME10 · METAL15 · VIP20" : "Try: WELCOME10 · METAL15 · VIP20"}
              </p>
            </>
          )}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 space-y-2.5">
          <Link href={`/${locale}/checkout`}
            className="w-full btn-primary justify-center text-sm font-bold py-3.5 rounded-xl flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
            </svg>
            {t.checkout}
          </Link>

          <a href={`https://wa.me/966500000000?text=${encodeURIComponent(
            locale === "ar"
              ? `طلب جديد:\n${state.items.map(i => `• ${i.materialLabel.ar} ${i.input.widthCm}×${i.input.heightCm}cm × ${i.input.quantity} قطعة = ${i.price.totalSAR} ر.س`).join("\n")}\n\nالإجمالي: ${totals.totalSAR} ر.س`
              : `New Order:\n${state.items.map(i => `• ${i.materialLabel.en} ${i.input.widthCm}×${i.input.heightCm}cm × ${i.input.quantity} pcs = ${i.price.totalSAR} SAR`).join("\n")}\n\nTotal: ${totals.totalSAR} SAR`
          )}`}
            target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-green-500/30 bg-green-500/[0.07] text-green-400 hover:bg-green-500/[0.12] text-sm font-semibold transition-colors">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {t.whatsapp}
          </a>
        </div>

        <div className={clsx("px-6 pb-5 text-brand-silver/30 text-[11px] font-mono", isRTL ? "text-right" : "text-left")}>
          {t.exchangeNote}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Cart Page Component
// ─────────────────────────────────────────────────────────────
export default function CartPageClient() {
  const locale = useLocale() as Locale;
  const isRTL = locale === "ar";
  const t = T[locale] ?? T.ar;
  const { state, totals, clearCart } = useCart();

  const isEmpty = state.items.length === 0;

  return (
    <main className="min-h-screen bg-brand-charcoal pt-20">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-brand-steel/40 to-brand-charcoal border-b border-brand-gold/10 py-10">
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: "linear-gradient(rgba(201,168,76,1) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,1) 1px,transparent 1px)",
          backgroundSize: "55px 55px",
        }} />
        <div className="section-container relative z-10">
          <nav className={clsx("flex items-center gap-2 text-xs text-brand-silver/50 mb-4 flex-wrap", isRTL ? "flex-row-reverse" : "flex-row")}>
            <Link href={`/${locale}`} className="hover:text-brand-gold transition-colors">
              {isRTL ? "الرئيسية" : "Home"}
            </Link>
            <span className={clsx("opacity-40", isRTL ? "rotate-180" : "")}>›</span>
            <span className="text-brand-gold">{t.title}</span>
          </nav>
          <div className={clsx("flex items-center gap-4", isRTL ? "flex-row-reverse" : "flex-row")}>
            <h1 className="text-2xl sm:text-3xl font-black text-brand-off-white">{t.title}</h1>
            {!isEmpty && (
              <span className="px-3 py-1 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-gold text-sm font-bold">
                {totals.itemCount} {totals.itemCount === 1 ? t.item : t.items}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="section-container py-10">
        {isEmpty ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 rounded-3xl bg-brand-steel/60 border border-brand-gold/15 flex items-center justify-center text-5xl mb-6">
              🛒
            </div>
            <h2 className="text-xl font-bold text-brand-off-white mb-2">{t.empty}</h2>
            <p className="text-brand-silver/60 text-sm max-w-sm mb-8">{t.emptyDesc}</p>
            <Link href={`/${locale}/products/cnc`} className="btn-primary">
              {t.startShopping}
            </Link>
          </div>
        ) : (
          /* ── Cart content ── */
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-8 items-start">
            {/* Left: Items */}
            <div className="space-y-4 min-w-0">
              {/* Top bar */}
              <div className={clsx("flex items-center justify-between", isRTL ? "flex-row-reverse" : "flex-row")}>
                <Link href={`/${locale}/products/cnc`}
                  className={clsx("flex items-center gap-2 text-brand-silver/70 hover:text-brand-gold text-sm transition-colors", isRTL ? "flex-row-reverse" : "flex-row")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={isRTL ? "" : "rotate-180"}>
                    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                  </svg>
                  {t.continueShopping}
                </Link>
                <button
                  onClick={() => { if (confirm(t.confirmClear)) clearCart(); }}
                  className="text-brand-silver/40 hover:text-red-400 text-xs transition-colors flex items-center gap-1.5"
                >
                  <IconTrash /> {t.clearCart}
                </button>
              </div>

              {/* Item cards */}
              {state.items.map(item => (
                <CartItemCard key={item.id} item={item} t={t} locale={locale} isRTL={isRTL} />
              ))}
            </div>

            {/* Right: Summary */}
            <OrderSummary t={t} locale={locale} isRTL={isRTL} />
          </div>
        )}
      </div>
    </main>
  );
}
