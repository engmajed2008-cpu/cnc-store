"use client";

/**
 * Cart Store — E3lani
 * Pure React context + localStorage persistence, no extra dependencies.
 * Each item carries the full PriceInput + computed PriceBreakdown.
 */

import { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import type { PriceInput, PriceBreakdown } from "@/lib/priceCalculator";
import { calculatePrice, MATERIAL_RATES } from "@/lib/priceCalculator";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
export interface CartItem {
  id: string;               // uuid
  addedAt: number;          // timestamp
  input: PriceInput;        // all user choices
  price: PriceBreakdown;    // computed breakdown
  designFileName?: string;  // uploaded file name (if any)
  note?: string;            // custom note
  // Human-readable labels
  materialLabel: Record<"ar" | "en", string>;
  finishLabel:   Record<"ar" | "en", string>;
  urgencyLabel:  Record<"ar" | "en", string>;
}

export interface CartState {
  items: CartItem[];
  couponCode: string;
  couponDiscount: number; // 0-1 (percentage)
}

// ─────────────────────────────────────────────────────────────
// Human-readable label maps
// ─────────────────────────────────────────────────────────────
export const MATERIAL_LABELS: Record<string, Record<"ar" | "en", string>> = {
  steel:    { ar: "حديد / ستيل",           en: "Steel / Iron" },
  acrylic:  { ar: "أكريليك",               en: "Acrylic" },
  cladding: { ar: "كلادينج ألمنيوم",       en: "Aluminum Cladding" },
  wood:     { ar: "خشب MDF",               en: "MDF Wood" },
};

export const FINISH_LABELS: Record<string, Record<"ar" | "en", string>> = {
  raw:       { ar: "خام (بدون تشطيب)",    en: "Raw (No finish)" },
  painted:   { ar: "مطلي بالدهان",         en: "Spray Painted" },
  powder:    { ar: "طلاء بودرة",           en: "Powder Coating" },
  anodized:  { ar: "أنودايز",              en: "Anodized" },
};

export const URGENCY_LABELS: Record<string, Record<"ar" | "en", string>> = {
  standard: { ar: "قياسي (7-10 أيام)",    en: "Standard (7-10 days)" },
  express:  { ar: "سريع (3-5 أيام)",      en: "Express (3-5 days)" },
  urgent:   { ar: "عاجل (24-48 ساعة)",    en: "Urgent (24-48 hrs)" },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function makeId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function buildCartItem(
  input: PriceInput,
  designFileName?: string,
  note?: string
): CartItem | null {
  const price = calculatePrice(input);
  if (!price) return null;

  return {
    id: makeId(),
    addedAt: Date.now(),
    input,
    price,
    designFileName,
    note,
    materialLabel: MATERIAL_LABELS[input.material] ?? { ar: input.material, en: input.material },
    finishLabel:   FINISH_LABELS[input.finish]     ?? { ar: input.finish,   en: input.finish },
    urgencyLabel:  URGENCY_LABELS[input.urgency]   ?? { ar: input.urgency,  en: input.urgency },
  };
}

// Recompute totals across all items
export interface CartTotals {
  subtotalSAR:  number;
  vatSAR:       number;
  shippingSAR:  number;
  couponSAR:    number;
  totalSAR:     number;
  totalUSD:     number;
  itemCount:    number;
}

export function computeCartTotals(items: CartItem[], couponDiscount = 0): CartTotals {
  const subtotal = items.reduce((s, i) => s + i.price.subtotalSAR, 0);
  const couponSAR = Math.round(subtotal * couponDiscount * 100) / 100;
  const afterCoupon = subtotal - couponSAR;
  const shipping = afterCoupon >= 500 ? 0 : 45; // free shipping above 500 SAR
  const vat = Math.round(afterCoupon * 0.15 * 100) / 100;
  const total = afterCoupon + vat + shipping;
  return {
    subtotalSAR:  Math.round(subtotal * 100) / 100,
    vatSAR:       vat,
    shippingSAR:  shipping,
    couponSAR:    Math.round(couponSAR * 100) / 100,
    totalSAR:     Math.round(total * 100) / 100,
    totalUSD:     Math.round((total / 3.75) * 100) / 100,
    itemCount:    items.reduce((s, i) => s + i.input.quantity, 0),
  };
}

// ─────────────────────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────────────────────
type CartAction =
  | { type: "ADD";        item: CartItem }
  | { type: "REMOVE";     id: string }
  | { type: "UPDATE_QTY"; id: string; quantity: number }
  | { type: "UPDATE_NOTE"; id: string; note: string }
  | { type: "CLEAR" }
  | { type: "APPLY_COUPON"; code: string; discount: number }
  | { type: "REMOVE_COUPON" }
  | { type: "HYDRATE"; state: CartState };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD":
      return { ...state, items: [...state.items, action.item] };

    case "REMOVE":
      return { ...state, items: state.items.filter(i => i.id !== action.id) };

    case "UPDATE_QTY": {
      return {
        ...state,
        items: state.items.map(item => {
          if (item.id !== action.id) return item;
          const newInput = { ...item.input, quantity: action.quantity };
          const newPrice = calculatePrice(newInput);
          if (!newPrice) return item;
          return { ...item, input: newInput, price: newPrice };
        }),
      };
    }

    case "UPDATE_NOTE":
      return {
        ...state,
        items: state.items.map(i => i.id === action.id ? { ...i, note: action.note } : i),
      };

    case "CLEAR":
      return { items: [], couponCode: "", couponDiscount: 0 };

    case "APPLY_COUPON":
      return { ...state, couponCode: action.code, couponDiscount: action.discount };

    case "REMOVE_COUPON":
      return { ...state, couponCode: "", couponDiscount: 0 };

    case "HYDRATE":
      return action.state;

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────
import React from "react";

interface CartContextValue {
  state: CartState;
  totals: CartTotals;
  addItem:      (input: PriceInput, designFileName?: string, note?: string) => boolean;
  removeItem:   (id: string) => void;
  updateQty:    (id: string, qty: number) => void;
  updateNote:   (id: string, note: string) => void;
  clearCart:    () => void;
  applyCoupon:  (code: string) => boolean;
  removeCoupon: () => void;
}

export const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "metalart_cart_v1";
const KNOWN_COUPONS: Record<string, number> = {
  "WELCOME10": 0.10,
  "METAL15":   0.15,
  "VIP20":     0.20,
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [], couponCode: "", couponDiscount: 0,
  });

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "HYDRATE", state: JSON.parse(raw) });
    } catch {}
  }, []);

  // Persist every change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const totals = computeCartTotals(state.items, state.couponDiscount);

  const addItem = useCallback((input: PriceInput, designFileName?: string, note?: string) => {
    const item = buildCartItem(input, designFileName, note);
    if (!item) return false;
    dispatch({ type: "ADD", item });
    return true;
  }, []);

  const removeItem  = useCallback((id: string) => dispatch({ type: "REMOVE", id }), []);
  const updateQty   = useCallback((id: string, qty: number) => dispatch({ type: "UPDATE_QTY", id, quantity: qty }), []);
  const updateNote  = useCallback((id: string, note: string) => dispatch({ type: "UPDATE_NOTE", id, note }), []);
  const clearCart   = useCallback(() => dispatch({ type: "CLEAR" }), []);
  const removeCoupon = useCallback(() => dispatch({ type: "REMOVE_COUPON" }), []);

  const applyCoupon = useCallback((code: string) => {
    const discount = KNOWN_COUPONS[code.toUpperCase()];
    if (discount) {
      dispatch({ type: "APPLY_COUPON", code: code.toUpperCase(), discount });
      return true;
    }
    return false;
  }, []);

  return React.createElement(CartContext.Provider, {
    value: { state, totals, addItem, removeItem, updateQty, updateNote, clearCart, applyCoupon, removeCoupon },
  }, children);
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
