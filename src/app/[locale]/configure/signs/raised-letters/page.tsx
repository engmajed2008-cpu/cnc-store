"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import Link from "next/link";
import { useLocale } from "next-intl";
import { analyzeSvgString, type SvgAnalysis } from "@/lib/design/analyzeSvg";
import { FONT_CATALOG, FONT_BY_ID as FONT_CAT_BY_ID, DEFAULT_ENABLED_FONT_IDS, FONT_VARIABLE_CLASSES } from "@/lib/fonts";
import Sign3DPreview from "@/components/product/Sign3DPreview";
import SignMockupPreview from "@/components/product/SignMockupPreview";
import MaterialModal, { type MaterialSelection } from "@/components/product/MaterialModal";

// ─── Constants ────────────────────────────────────────────────────────────────
const GOLD = "#C9A24B";
const G    = "linear-gradient(135deg,#C9A24B,#EBCB7C)";
const GT   = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" as const };

const MAX_UPLOAD_MB = 25; // الحد الأقصى لحجم ملف التصميم المرفوع

// عمق افتراضي يتناسب مع مقاس اللوحة (أكبر بُعد) — كلما كبرت الأبعاد زاد العمق
// مُعايَر بحيث لوحة 220 سم ≈ خلفية 8 سم وحرف 5 سم (القيم الافتراضية الحالية)
function suitableDepths(maxDimCm: number): { bgD: number; letterDepthCm: number } {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));
  return {
    bgD: clamp(maxDimCm / 55, 2, 13),           // عمق الخلفية (نصف القيمة السابقة)
    letterDepthCm: clamp(maxDimCm / 88, 1, 10), // عمق الحرف البارز (نصف القيمة السابقة)
  };
}
const LABOR_PER_CM = 0.9;
const MIN_ORDER    = 300;
const LED_RATE     = 0.08;
const PERIM_FACTOR = 2.5;

// ─── Lightbox face materials ──────────────────────────────────────────────────
const LIGHTBOX_FACES = [
  { id: "lexan",   label: "لكسان",   desc: "بولي كربونات · متين",        rateM2: 85  },
  { id: "acrylic", label: "أكريليك", desc: "شفاف / ملون · لمعان",        rateM2: 65  },
  { id: "flex",    label: "فيلكس",   desc: "طباعة رقمية · مرن",          rateM2: 45  },
];

const RATES = {
  logoDifficulty: 1.6,
  qrDifficulty: 1.4,
  background: {
    cladding:    { label: "كلادينج",       rate: 240, illuminated: false },
    cementBoard: { label: "أسمنت بورد",    rate: 170, illuminated: false },
    lightbox:    { label: "خلفية مضيئة",   rate: 320, illuminated: true  },
  } as Record<string, { label: string; rate: number; illuminated: boolean }>,
  bgDepthAddPerCm: 6,
  install: { perMeter: 120, bgPerM2: 90, wallDirectSurcharge: 1.4, craneFee: 1500, craneHeightM: 6, outsideJeddahFee: 800 },
  vat: 0.15,
  offer: { active: true, label: "عرض الافتتاح", percent: 15, endsInDays: 5 },
};

// الخطوط من الكتالوج المشترك (محمّلة فعلياً عبر next/font) — العائلة = الاسم الحقيقي المحمّل
const FONTS_AR = FONT_CATALOG.filter(f => f.lang === "ar");
const FONTS_EN = FONT_CATALOG.filter(f => f.lang === "en");
const FONT_BY_ID = FONT_CAT_BY_ID;

const COL: Record<string, { hex: string; label: string }> = {
  gold:   { hex: "#C9A24B", label: "ذهبي" },
  silver: { hex: "#D4D4D4", label: "فضي" },
  white:  { hex: "#F5F5F5", label: "أبيض" },
  black:  { hex: "#141414", label: "أسود" },
  red:    { hex: "#C0392B", label: "أحمر" },
  blue:   { hex: "#1F4E8C", label: "أزرق" },
  green:  { hex: "#1F7A4D", label: "أخضر" },
  copper: { hex: "#B06A3B", label: "نحاسي" },
};

const BG_COLORS = [
  { id: "silver",   hex: "#C0C4C8", label: "رمادي فاتح"  },
  { id: "white",    hex: "#F2F2F0", label: "أبيض"        },
  { id: "offwhite", hex: "#EDE8DF", label: "أبيض كريمي"  },
  { id: "black",    hex: "#F4EFE6", label: "أسود"        },
  { id: "darkgray", hex: "#3a3a3a", label: "رمادي داكن"  },
  { id: "beige",    hex: "#C8B89A", label: "بيج"         },
  { id: "gold",     hex: "#C9A24B", label: "ذهبي"        },
  { id: "blue",     hex: "#1F4E8C", label: "أزرق"        },
  { id: "green",    hex: "#2D5A27", label: "أخضر"        },
  { id: "red",      hex: "#8B1A1A", label: "أحمر"        },
  { id: "brown",    hex: "#6B4226", label: "بني"         },
  { id: "custom",   hex: "",        label: "مخصص"        },
];

// كتالوج الخامات — لكل خامة: معدّل، تدرّج، ألوان، وصلاحيتها كوجه/جوانب، وهل تقبل
// التلوين (colorful: للتصاميم الملوّنة). الستانلس معدن أحادي اللون فلا يصلح للملوّن.
const SIGN_TYPES = [
  { id: "stainless", label: "ستانلس ستيل", tag: "فاخر · عاكس", rate: 2.8,
    grad: "linear-gradient(135deg,#3a3a3a,#9aa0a6 45%,#e9edf0 60%,#7c7f84)",
    colors: ["gold", "silver"], face: true, side: true, colorful: false },
  { id: "acrylic",   label: "أكريليك ملمّع", tag: "ألوان متعددة · لمعان", rate: 0.75,
    grad: "linear-gradient(135deg,#10212b,#163b4a 60%,#0c2630)",
    colors: ["white", "black", "red", "blue", "green", "gold"], face: true, side: true, colorful: true },
  { id: "zincor",    label: "زنكور", tag: "مطلي · متعدد الألوان", rate: 1.5,
    grad: "linear-gradient(135deg,#2a2118,#5a4a36 55%,#241c12)",
    colors: ["white", "black", "red", "blue", "green", "gold", "silver"], face: true, side: true, colorful: true },
  { id: "aluminum",  label: "ألومنيوم مطلي", tag: "مرن · اقتصادي", rate: 1.2,
    grad: "linear-gradient(135deg,#241a0d,#3a2c12 60%,#1c1407)",
    colors: ["white", "black", "red", "blue", "green", "gold", "copper", "silver"], face: true, side: true, colorful: true },
];
const FACE_MATS = (colored: boolean) => SIGN_TYPES.filter(t => t.face && (!colored || t.colorful));
const SIDE_MATS = SIGN_TYPES.filter(t => t.side);
const TYPE_BY_ID: Record<string, typeof SIGN_TYPES[0]> = {};
SIGN_TYPES.forEach(t => { TYPE_BY_ID[t.id] = t; });
const MAT_RATE = (id: string) => (TYPE_BY_ID[id] || SIGN_TYPES[0]).rate;

// أنماط جوانب الحروف (المخرّمة) — ثابتة كـ fallback، تُحمَّل ديناميكياً من DB عند التشغيل
type SideStyleDef = { slug: string; nameAr: string; descriptionAr: string; priceAddPercent: number; metalOnly: boolean; icon: string };
const FALLBACK_SIDE_STYLES: SideStyleDef[] = [
  { slug: "solid",    nameAr: "صماء",          descriptionAr: "جانب مصمت — الخيار الأساسي",      priceAddPercent: 0,  metalOnly: true, icon: "▬" },
  { slug: "dots",     nameAr: "نقاط دائرية",   descriptionAr: "ثقوب دائرية — ضوء ناعم",          priceAddPercent: 8,  metalOnly: true, icon: "⁞" },
  { slug: "slots",    nameAr: "شرائح أفقية",   descriptionAr: "فتحات مستطيلة — ضوء مخطط",        priceAddPercent: 8,  metalOnly: true, icon: "☰" },
  { slug: "squares",  nameAr: "مربعات هندسية", descriptionAr: "فتحات مربعة — مظهر عصري",         priceAddPercent: 10, metalOnly: true, icon: "▦" },
  { slug: "diamonds", nameAr: "معينات",        descriptionAr: "فتحات ماسية — مظهر فاخر",         priceAddPercent: 10, metalOnly: true, icon: "◆" },
  { slug: "arabic",   nameAr: "نمط عربي",      descriptionAr: "زخرفة عربية — ضوء دافئ ومتوهج",  priceAddPercent: 15, metalOnly: true, icon: "✦" },
];

const LIGHT_TYPES = [
  { id: "none",   label: "بدون إضاءة", hint: "حروف صماء",      ledFactor: 0 },
  { id: "front",  label: "أمامية +35%", hint: "وجه مضيء",      ledFactor: 0.35 },
  { id: "back",   label: "خلفية +45%",  hint: "هالة خلف الحرف", ledFactor: 0.45 },
  { id: "double", label: "مزدوجة +65%", hint: "أمامية + خلفية", ledFactor: 0.65 },
];
const LIGHT_TEMPS = [
  { id: "warm",    label: "أصفر دافئ",  k: "3000K", glow: "#FFC65C" },
  { id: "neutral", label: "أبيض طبيعي", k: "4000K", glow: "#FFE9C7" },
  { id: "cool",    label: "أبيض بارد",  k: "6500K", glow: "#CFE6FF" },
];

// ─── Types ────────────────────────────────────────────────────────────────────
type TextLayer  = { kind: "text";  id: string; text: string; lang: string; fontId: string; heightCm: number; colorId: string; colorHex?: string; x: number; y: number; stretchX?: number; stretchY?: number };
type LogoLayer  = { kind: "logo";  id: string; src: string; widthCm: number; x: number; y: number; stretchX?: number; stretchY?: number };
type QRLayer    = { kind: "qr";    id: string; value: string; sizeCm: number; x: number; y: number; stretchX?: number; stretchY?: number };
// تصميم SVG مرفوع: يُقرأ ويُعرض ويُسعَّر تلقائياً — perimScale = محيط القص (سم) لكل 1 سم من العرض
type SvgLayer   = { kind: "svg";   id: string; src: string; name: string; widthCm: number; aspect: number; perimScale: number; x: number; y: number; text?: string; colorId?: string; originalColors?: boolean; stretchX?: number; stretchY?: number };
// شكل هندسي ملوّن: مستطيل | دائرة | خط | مثلث — يوضع خلف النصوص أو فوقها حسب ترتيب الطبقات
type ShapeLayer = { kind: "shape"; id: string; shapeType: "rect" | "circle" | "line" | "triangle"; colorHex: string; widthCm: number; heightCm: number; x: number; y: number; rotation?: number; stretchX?: number; stretchY?: number };
type Layer = TextLayer | LogoLayer | QRLayer | SvgLayer | ShapeLayer;

type AppState = {
  mount: string; bgMode: string; bgMaterial: string; lightboxFace: string; bgW: number; bgH: number; bgD: number; bgColorId: string; bgCustomColor: string;
  wallW: number; wallH: number;
  // مقاس مفترض لمنطقة الرسم عند غياب الإطار (لا يُسعّر)؛ signW/H = مساحة المحتوى الفعلية للتسعير
  bgAssumed: boolean; signW: number; signH: number;
  typeId: string; faceColorId: string; sideColorId: string;
  // مجموعة النصوص: typeId = خامة الوجه · sideMat = خامة الجوانب · faceBorder = إطار
  sideMat: string; faceBorder: boolean; coloredDesign: boolean;
  faceCustomColor: string; sideCustomColor: string; // لون التصميم الأصلي المستخرج (وجه/جوانب)
  // مجموعة اللوجوهات والمحتويات الأخرى (خامة مستقلة عن النصوص)
  cTypeId: string; cSideMat: string; cFaceColorId: string; cSideColorId: string;
  cFaceCustomColor: string; cSideCustomColor: string;
  // هل خامة الوجه = خامة الجوانب لكل مجموعة؟ (true → خيار واحد للاثنين وبلا إطار)
  uniMatText: boolean; uniMatContent: boolean;
  sideStyleId: string; // نمط الجوانب: "solid" | "dots" | "slots" | "squares" | "diamonds" | "arabic"
  lightTypeId: string; lightTempId: string; bgLightTempId: string; night: boolean;
  contentMode: string; uploadName: string | null; letterDepthCm: number;
  wantInstall: boolean; installRegion: string; installHeightM: number; craneNeeded: boolean;
  nationalAddress: string;
  // الموقع: المدينة + نوع الشارع → تُحدِّد الأمانة التي تُطبَّق اشتراطاتها على التصميم
  city: string; streetType: string;
  // نوع المنشأة + نوع اللوحة + سياق الواجهة (أساس فحص اشتراطات الأمانة)
  establishmentType: string; signType: string; facadeWidthCm: number; windowHeightCm: number; signBottomM: number;
  // التموينات: هل للمحل علامة تجارية مسجلة؟ (بدونها يلزم التصميم الموحّد)
  hasTrademark: boolean;
  zoom: number; guides: boolean;
};

// ─── المدن ونطاق الأمانات (المرحلة الأولى: نطاق أمانة محافظة جدة) ──────────────
// مدينة جدة + جميع المحافظات/المراكز التابعة لأمانة محافظة جدة (الإحداثيات تقديرية لمراكز المدن)
const CITIES: { id: string; name: string; amana: string; lat: number; lng: number }[] = [
  { id: "jeddah",        name: "جدة",               amana: "أمانة محافظة جدة", lat: 21.5433, lng: 39.1728 },
  { id: "rabigh",        name: "رابغ",              amana: "أمانة محافظة جدة", lat: 22.7986, lng: 39.0349 },
  { id: "khulais",       name: "خليص",              amana: "أمانة محافظة جدة", lat: 22.1561, lng: 39.3160 },
  { id: "kamil",         name: "الكامل",            amana: "أمانة محافظة جدة", lat: 21.2200, lng: 40.0600 },
  { id: "laith",         name: "الليث",             amana: "أمانة محافظة جدة", lat: 20.1489, lng: 40.2680 },
  { id: "muzaylif",      name: "المظيلف",           amana: "أمانة محافظة جدة", lat: 20.4700, lng: 40.0500 },
  { id: "qunfudhah",     name: "القنفذة",           amana: "أمانة محافظة جدة", lat: 19.1264, lng: 41.0789 },
  { id: "qawz",          name: "القوز",             amana: "أمانة محافظة جدة", lat: 19.6500, lng: 41.3000 },
  { id: "adham",         name: "أضم",               amana: "أمانة محافظة جدة", lat: 20.7800, lng: 41.3500 },
  { id: "shawaq",        name: "الشواق",            amana: "أمانة محافظة جدة", lat: 19.6000, lng: 41.2000 },
  { id: "ardiyahSouth",  name: "العرضية الجنوبية",  amana: "أمانة محافظة جدة", lat: 19.9300, lng: 41.9500 },
  { id: "ardiyahNorth",  name: "العرضية الشمالية",  amana: "أمانة محافظة جدة", lat: 20.0500, lng: 41.7800 },
  { id: "hajr",          name: "حجر",               amana: "أمانة محافظة جدة", lat: 19.8000, lng: 41.4000 },
  { id: "haly",          name: "حلي",               amana: "أمانة محافظة جدة", lat: 18.5200, lng: 41.4300 },
  { id: "sabtAljarah",   name: "سبت الجارة",        amana: "أمانة محافظة جدة", lat: 19.7400, lng: 41.5500 },
  { id: "ghamiqah",      name: "غميقة",             amana: "أمانة محافظة جدة", lat: 19.4000, lng: 41.1000 },
];
const cityById = (id: string) => CITIES.find(c => c.id === id) || CITIES[0];

// أنواع اللوحات (تُطبَّق على مراحل — المرحلة الأولى: الموازية لسطح الواجهة)
const SIGN_KINDS = [
  { id: "parallel",        label: "موازية لسطح الواجهة",                         ready: true },
  { id: "acrylic",         label: "لوحة أكريليك",                                ready: true },
  { id: "acrylic-indoor",  label: "لوحة أكريليك داخلية",                        ready: true },
  { id: "upper-facade",    label: "لوحة على واجهة المبنى بالأدوار العليا",      ready: true },
  { id: "tenant",          label: "لوحة قائمة بذاتها",                          ready: true },
  { id: "projecting",      label: "متعامدة على الواجهة",                         ready: false },
  { id: "brand",           label: "علامة تجارية (أعلى المبنى)",                  ready: false },
  { id: "entrance",        label: "لوحة مدخل",                                   ready: false },
  { id: "directory",       label: "تعريفية جامعة",                               ready: false },
  { id: "flags",           label: "أعلام",                                        ready: false },
  { id: "freestanding",    label: "قائمة بذاتها",                               ready: false },
];

// نوع المنشأة يحدّد أنواع اللوحات المسموح بها (دليل أمانة جدة)
const ESTABLISHMENTS = [
  { id: "store",        label: "متجر / محل تجاري",       kinds: ["parallel", "acrylic", "projecting", "entrance"], special: false },
  { id: "hotel",        label: "فندق أو مستشفى",         kinds: ["parallel", "acrylic", "entrance", "projecting", "brand", "directory", "flags"], special: false },
  { id: "office",       label: "مكتب داخلي",             kinds: ["acrylic-indoor", "upper-facade", "tenant"], special: false },
  { id: "building",     label: "مبنى إداري / تجاري",    kinds: ["brand", "upper-facade", "tenant"], special: false },
  { id: "supermarket",  label: "تموينات (سوبر ماركت)",   kinds: ["parallel"], special: true },
];
const estById = (id: string) => ESTABLISHMENTS.find(e => e.id === id) || ESTABLISHMENTS[0];

// محتويات اللوحة المطلوبة حسب نوع المنشأة (إجباري/اختياري) — تُعرض في خطوة «المحتويات»
type ContentReq = { key: "arname" | "qr" | "enname" | "logo" | "phone"; label: string; icon: string; hint?: string };
function contentSpec(estType: string): { mandatory: ContentReq[]; optional: ContentReq[] } {
  if (estType === "supermarket") return {
    mandatory: [
      { key: "arname", label: "اسم المنشأة بالعربية", icon: "أ", hint: "مطابق لاسم السجل التجاري" },
      { key: "qr",     label: "رقم السجل التجاري (CR)", icon: "▦", hint: "إلزامي على لوحة التموينات" },
    ],
    optional: [
      { key: "enname", label: "اسم المنشأة بالإنجليزية", icon: "A", hint: "يتطلّب علامة تجارية مسجّلة" },
      { key: "logo",  label: "الشعار الموحّد", icon: "🖼", hint: "ضمن التصميم الأخضر الموحّد" },
      { key: "phone", label: "رقم التواصل", icon: "✆" },
    ],
  };
  // متجر / مستشفى / فندق — لوحة موازية (دليل أمانة جدة)
  return {
    mandatory: [
      { key: "arname", label: "الاسم التجاري بالعربية", icon: "أ", hint: "إلزامي على كل لوحة" },
      { key: "qr",     label: "الرمز التجاري (QR)", icon: "▦", hint: "يربط اللوحة بالسجل التجاري" },
    ],
    optional: [
      { key: "enname", label: "الاسم بالإنجليزية", icon: "A", hint: "يتطلّب علامة تجارية مسجّلة" },
      { key: "logo",   label: "الشعار / اللوجو", icon: "🖼", hint: "يتطلّب علامة تجارية مسجّلة" },
      { key: "phone",  label: "رقم التواصل", icon: "✆" },
    ],
  };
}
// ألوان لوحات التموينات الموحّدة (وزارة البلديات والإسكان):
// Pantone 328 = خلفية رئيسية داكنة | Pantone 7480 = شريط سفلي فاتح | Pantone 115 = لوجو أصفر
const SUPERMARKET_GREEN       = "#006B54"; // Pantone 328 C — خلفية اللوحة الرئيسية (أخضر غامق)
const SUPERMARKET_STRIP_CM    = 12; // ارتفاع الشريط السفلي ثابت 12 سم بغض النظر عن ارتفاع اللوحة
const SUPERMARKET_STRIP_COLOR = "#3DB16B";          // Pantone 7480 C — الشريط السفلي (أخضر فاتح)
const SUPERMARKET_CART_SRC    = "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjY3MTQgMjAxMTEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZmlsbD0iI0ZBRDcxRiIgZmlsbC1ydWxlPSJub256ZXJvIiBkPSJNMTMzMDEuNTQgMjAxMTAuNzljLTE2MDIuMywwIC0yODk4LjI2LC0xMjkzLjcxIC0yODk4LjI2LC0yODk2LjAyIDAsLTE2MDIuMyAxMjk1Ljk3LC0yODk4LjI2IDI4OTguMjYsLTI4OTguMjYgMTYwNC40LDAgMjkwMC4yOCwxMjk1Ljk3IDI5MDAuMjgsMjg5OC4yNiAwLDE2MDIuMzEgLTEyOTUuODgsMjg5Ni4wMiAtMjkwMC4yOCwyODk2LjAyem0wIC00MDg5Ljc2Yy02ODAuOTYsMCAtMTE5My43NSw1NDQuNzIgLTExOTMuNzUsMTE5My43NSAwLDY0Ni44NiA1MTIuNzksMTE5MS41OCAxMTkzLjc1LDExOTEuNTggNjQ4Ljk1LDAgMTE5My43NSwtNTQ0LjcyIDExOTMuNzUsLTExOTEuNTggMCwtNjQ5LjAzIC01NDQuOCwtMTE5My43NSAtMTE5My43NSwtMTE5My43NXoiLz48cGF0aCBmaWxsPSIjRkFENzFGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0yMDIyNS43MiAyMDExMC43OWMtMTYwMi4zMSwwIC0yODk4LjE5LC0xMjkzLjcxIC0yODk4LjE5LC0yODk2LjAyIDAsLTE2MDIuMyAxMjk1Ljg4LC0yODk4LjI2IDI4OTguMTksLTI4OTguMjYgMTYwNC40OCwwIDI5MzQuMzgsMTI5NS45NyAyOTM0LjM4LDI4OTguMjYgMCwxNjAyLjMxIC0xMzI5LjksMjg5Ni4wMiAtMjkzNC4zOCwyODk2LjAyem0wIC00MDg5Ljc2Yy02NDYuODYsMCAtMTE5My43NSw1NDQuNzIgLTExOTMuNzUsMTE5My43NSAwLDY0Ni44NiA1NDYuODgsMTE5MS41OCAxMTkzLjc1LDExOTEuNTggNjgzLjA1LDAgMTIyNy44NCwtNTQ0LjcyIDEyMjcuODQsLTExOTEuNTggMCwtNjQ5LjAzIC01NDQuOCwtMTE5My43NSAtMTIyNy44NCwtMTE5My43NXoiLz48cGF0aCBmaWxsPSIjRkFENzFGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xNjU0Mi4zNCAxNDA0NC4xOWMtNjY1MS44NiwwIC0xMjE0MS44OSwtNTExMy40MSAtMTI3NTYuODMsLTExNTkwLjc1bC0yNTU3Ljc0IDBjLTY4My4wNSwwIC0xMjI3Ljc2LC01NDQuNzIgLTEyMjcuNzYsLTEyMjcuNzYgMCwtNjgwLjk2IDU0NC43MiwtMTIyNS42OCAxMjI3Ljc2LC0xMjI1LjY4bDQ5NzkuMzQgMCAwIDEyMjUuNjhjMCw1Njk0LjI0IDQ2MzguODIsMTAzMzAuOTcgMTAzMzUuMjMsMTAzMzAuOTcgMzEwNC41NiwwIDYwMDIuODMsLTEzNjQuMDEgNzk4MS43NiwtMzc1MS40OSA0NDIuNTgsLTUxMC43IDEyMjcuNzYsLTU3OC44MiAxNzM4LjQ2LC0xMzYuMTYgNTEyLjg3LDQwOC41NiA2MTUuMDEsMTE5My43NSAxNzIuNDMsMTcwNC40NSAtMjQ1NS42MSwyOTY2LjMxIC02MDM5LjAxLDQ2NzAuNzUgLTk4OTIuNjUsNDY3MC43NXoiLz48L3N2Zz4=";

// ─── محرّك فحص الامتثال لاشتراطات أمانة جدة (المرحلة 1: اللوحة الموازية) ─────────
// يُعيد قائمة مخالفات: {id, msg, fix?} — fix = تصحيح تلقائي يُطبَّق على الحالة.
type ComplianceWarn = { id: string; msg: string; fix?: Partial<AppState> };
type SavedProject = { id: string; name: string; type: "raised-letters"; state: AppState; layers: Layer[]; savedAt: number };
function complianceWarnings(s: AppState, layers: Layer[]): ComplianceWarn[] {
  if (s.signType !== "parallel") return [];
  const w: ComplianceWarn[] = [];
  const isSuper = s.establishmentType === "supermarket";
  const hasArabic = layers.some(l => l.kind === "text" && l.lang === "ar" && (l.text || "").trim());
  const hasQR = layers.some(l => l.kind === "qr");

  if (isSuper) {
    // ── اشتراطات لافتة التموينات (دليل وزارة البلديات والإسكان) ──
    // الارتفاع لا يقل عن 80 سم
    if (s.bgH < 80) w.push({ id: "sup-h", msg: `ارتفاع لافتة التموينات ${s.bgH} سم أقل من الحد الأدنى 80 سم.`, fix: { bgH: 80 } });
    // العرض لا يقل عن 300 سم
    if (s.bgW < 300) w.push({ id: "sup-w", msg: `عرض لافتة التموينات ${s.bgW} سم أقل من الحد الأدنى 300 سم.`, fix: { bgW: 300 } });
    // عرض الواجهة لا يقل عن 300 سم
    if (s.facadeWidthCm > 0 && s.facadeWidthCm < 300)
      w.push({ id: "sup-facade-w", msg: `عرض واجهة المحل ${s.facadeWidthCm} سم أقل من الحد الأدنى للتموينات (300 سم).` });
    // العرض = عرض واجهة المتجر
    if (s.facadeWidthCm > 0 && s.bgW !== s.facadeWidthCm)
      w.push({ id: "sup-wfit", msg: `عرض اللافتة يجب أن يساوي عرض واجهة المتجر (${s.facadeWidthCm} سم).`, fix: { bgW: s.facadeWidthCm } });
    // البروز لا يزيد عن 50 سم
    if (s.letterDepthCm > 50) w.push({ id: "sup-protr", msg: `بروز اللافتة ${s.letterDepthCm} سم يتجاوز الحد المسموح للتموينات (50 سم).`, fix: { letterDepthCm: 50 } });
    if (!hasArabic) w.push({ id: "arname", msg: "اسم المنشأة (حسب السجل التجاري) إلزامي — أضِف نصاً عربياً." });
    if (!hasQR) w.push({ id: "sup-cr", msg: "رقم السجل التجاري إلزامي على لافتة التموينات — أضِفه من خطوة «النص والشعار»." });
    // بدون علامة تجارية مسجلة → يلزم التصميم الموحّد (لون أخضر + خط سُكَّر)
    if (!s.hasTrademark) {
      if (s.bgCustomColor && s.bgCustomColor.toLowerCase() !== SUPERMARKET_GREEN.toLowerCase())
        w.push({ id: "sup-color", msg: "لافتة بدون علامة تجارية مسجلة يجب أن تتبع اللون الأخضر الموحّد.", fix: { bgCustomColor: SUPERMARKET_GREEN, bgColorId: "" } });
      if (layers.some(l => l.kind === "text" && l.fontId !== "sukar"))
        w.push({ id: "sup-font", msg: "لافتة بدون علامة تجارية مسجلة يجب أن تستخدم الخط الموحّد (سُكَّر بلاك)." });
    }
  } else {
    // ── اشتراطات اللوحة الموازية العامة (دليل أمانة جدة) ──
    const maxH = Math.floor((s.windowHeightCm || 0) / 3);
    if (maxH > 0 && s.bgH > maxH)
      w.push({ id: "height", msg: `ارتفاع اللوحة ${s.bgH} سم يتجاوز الحد المسموح (ثلث ارتفاع نافذة العرض = ${maxH} سم).`, fix: { bgH: maxH } });
    if (s.facadeWidthCm > 0 && s.bgW > s.facadeWidthCm)
      w.push({ id: "width", msg: `عرض اللوحة ${s.bgW} سم يتجاوز عرض واجهة المحل (${s.facadeWidthCm} سم).`, fix: { bgW: s.facadeWidthCm } });
    if (s.signBottomM < 2.4)
      w.push({ id: "bottom", msg: `ارتفاع الحد السفلي للوحة ${s.signBottomM} م أقل من الحد الأدنى 2.40 م.`, fix: { signBottomM: 2.4 } });
    const withBg = s.mount === "background" && s.bgMode === "add";
    const maxProtr = withBg ? 20 : 25;
    if (s.letterDepthCm > maxProtr)
      w.push({ id: "protrusion", msg: `بروز الأحرف ${s.letterDepthCm} سم يتجاوز الحد المسموح (${maxProtr} سم${withBg ? " مع وجود خلفية" : ""}).`, fix: { letterDepthCm: maxProtr } });
    if (!hasArabic) w.push({ id: "arname", msg: "الاسم العربي إلزامي على اللوحة — أضِف نصاً عربياً من خطوة «النص والشعار»." });
    if (!hasQR) w.push({ id: "code", msg: "الرمز التجاري (QR) إلزامي — أضِفه من خطوة «النص والشعار»." });
  }

  // ── لوحة واجهة الأدوار العليا: تشترط استئجار الدور بالكامل ──
  if (s.signType === "upper-facade")
    w.push({ id: "upperFacadeFullFloor", msg: "لوحة الواجهة بالأدوار العليا مشروطة باستئجار الدور الذي تقع فيه المنشأة بالكامل — لا يُسمح بها عند مشاركة الدور مع مستأجرين آخرين." });

  // ── قواعد مشتركة ──
  const cols = new Set<string>([s.faceColorId, s.sideColorId, s.cFaceColorId, ...layers.map(l => (l as { colorId?: string }).colorId || "")].filter(Boolean));
  if (cols.has("red") && cols.has("green"))
    w.push({ id: "redgreen", msg: "يُوصى بتجنّب دمج اللونين الأحمر والأخضر معاً (صعوبة الرؤية لمصابي عمى الألوان)." });
  return w;
}
// لون علامة الصح فوق لون مُختار: أسود على الألوان الفاتحة، أبيض على الغامقة (حسب اللمعان)
const tickColor = (hex?: string) => {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return "#000";
  const n = parseInt(hex.slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#000" : "#fff";
};
const SEL_RED = "#E51C1C"; // لون إطار اللون المُختار
const osmEmbed = (lat: number, lng: number) => {
  const d = 0.06;
  const bbox = `${(lng - d).toFixed(4)},${(lat - d).toFixed(4)},${(lng + d).toFixed(4)},${(lat + d).toFixed(4)}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(4)},${lng.toFixed(4)}`;
};

// قائمة منسدلة قابلة للبحث/الكتابة لاختيار المدينة
function CitySelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = CITIES.find(c => c.id === value);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQ(""); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const filtered = CITIES.filter(c => c.name.includes(q.trim()));
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          value={open ? q : (selected?.name ?? "")}
          onChange={e => { setQ(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => { setOpen(true); setQ(""); }}
          placeholder="ابحث أو اختر المدينة…"
          style={{ width: "100%", padding: "0.55rem 2rem 0.55rem 0.8rem", borderRadius: 9, background: "#FDFBF7", border: `1.5px solid ${open ? GOLD : "rgba(154,106,42,0.3)"}`, color: "#2C1E15", fontSize: "0.85rem", fontFamily: "Cairo,sans-serif", outline: "none", boxSizing: "border-box" }}
        />
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: GOLD, fontSize: "0.7rem", pointerEvents: "none" }}>▾</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", insetInline: 0, zIndex: 40, background: "#FFFCF6", border: "1px solid rgba(154,106,42,0.3)", borderRadius: 10, boxShadow: "0 8px 24px rgba(44,30,21,0.18)", maxHeight: 210, overflowY: "auto" }}>
          {filtered.length === 0 && <div style={{ padding: "0.6rem 0.8rem", fontSize: "0.78rem", color: "#8A7A66", fontFamily: "Cairo,sans-serif" }}>لا توجد نتائج</div>}
          {filtered.map(c => {
            const on = c.id === value;
            return (
              <button key={c.id} onClick={() => { onChange(c.id); setOpen(false); setQ(""); }}
                style={{ width: "100%", textAlign: "right", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "0.5rem 0.8rem", background: on ? "rgba(201,162,75,0.12)" : "transparent", border: "none", borderBottom: "1px solid rgba(154,106,42,0.08)", cursor: "pointer", fontFamily: "Cairo,sans-serif", color: on ? GOLD : "#2C1E15", fontSize: "0.82rem", fontWeight: on ? 800 : 600 }}>
                <span>{c.name}</span>
                <span style={{ fontSize: "0.58rem", color: "#8A7A66" }}>{c.amana}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 8);
const rr  = (n: number) => Math.round(n).toLocaleString("ar-SA");

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

let _mc: CanvasRenderingContext2D | null = null;

function measureTextCm(text: string, family: string, heightCm: number): number {
  if (typeof window === "undefined") return heightCm * 0.8;
  try {
    if (!_mc) _mc = document.createElement("canvas").getContext("2d");
    if (!_mc) return heightCm * 0.8;
    _mc.font = `900 ${heightCm}px ${family}, Tajawal, Cairo, sans-serif`;
    return Math.max(heightCm * 0.6, _mc.measureText(text || " ").width);
  } catch {
    return heightCm * 0.8;
  }
}

// ─── مسح بكسل Canvas للحصول على حدود الحروف الفعلية ────────────────────────
type TightBounds = { topOffset: number; height: number; widthPx: number };
const _tightCache = new Map<string, TightBounds>();

function measureTightBounds(text: string, family: string, fontPx: number): TightBounds {
  const key = `${text}|${family}|${Math.round(fontPx)}`;
  if (_tightCache.has(key)) return _tightCache.get(key)!;
  const fallback: TightBounds = { topOffset: fontPx * 0.08, height: fontPx * 0.85, widthPx: fontPx };
  if (typeof window === "undefined") return fallback;
  try {
    const SC = 2; // رسم بضعف الحجم لدقة أعلى
    const fp = fontPx * SC;
    const PAD = fp;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    ctx.font = `900 ${fp}px ${family}, Tajawal, Cairo, sans-serif`;
    const tw = ctx.measureText(text || "أ").width;
    canvas.width  = Math.ceil(tw + PAD * 2);
    canvas.height = Math.ceil(fp * 2.5);
    ctx.font = `900 ${fp}px ${family}, Tajawal, Cairo, sans-serif`;
    ctx.fillStyle = "#000";
    ctx.fillText(text || "أ", PAD, fp * 1.5); // baseline عند 1.5 × fp

    const { data, width: W, height: H } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let minY = H, maxY = -1, minX = W, maxX = -1;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (data[(y * W + x) * 4 + 3] > 15) {
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }
    if (maxY < 0) return fallback; // الخط لم يُحمَّل بعد

    // Canvas: baseline عند fp*1.5 — نحسب المسافات منه
    const aboveBaseline = fp * 1.5 - minY; // ارتفاع الحروف فوق الخط
    const belowBaseline = maxY - fp * 1.5; // عمق الحروف تحت الخط

    // CSS مع lineHeight:1 — موضع baseline يعتمد على fontBoundingBoxAscent
    const m = ctx.measureText(text || "أ");
    const fBBA = (m as any).fontBoundingBoxAscent ?? fp * 0.85;
    const fBBD = (m as any).fontBoundingBoxDescent ?? fp * 0.15;
    const baselineCSS = (fontPx + fBBA/SC - fBBD/SC) / 2;

    const result: TightBounds = {
      topOffset: baselineCSS - aboveBaseline / SC,
      height:    (aboveBaseline + belowBaseline) / SC,
      widthPx:   (maxX - minX) / SC,
    };
    // لا تُخزّن إلا إذا كان الخط محمّلاً فعلاً — قياس بخط بديل يبقى خاطئاً في الكاش
    let fontReady = true;
    try { fontReady = (document as any).fonts?.check?.(`900 ${Math.round(fontPx)}px ${family}`) ?? true; } catch { /* اعتبره جاهزاً */ }
    if (fontReady) _tightCache.set(key, result);
    return result;
  } catch {
    return fallback;
  }
}

// ─── قراءة ملف SVG: الأبعاد + مجموع أطوال المسارات (محيط القص) ──────────────
// متسامح مع ملفات Illustrator/Inkscape: تحليل XML ثم HTML كبديل، وأبعاد من فك
// ترميز الصورة عند غياب viewBox، وإنشاء الطبقة حتى لو فشل قياس المحيط.
async function parseSvgFile(file: File): Promise<{ src: string; aspect: number; perimScale: number } | null> {
  let text: string;
  try { text = await file.text(); } catch { return null; }
  return parseSvgText(text);
}

type ParsedSvg = { src: string; aspect: number; perimScale: number; bbox?: { x: number; y: number; w: number; h: number } };
async function parseSvgText(text: string): Promise<ParsedSvg | null> {
  text = text.replace(/^﻿/, ""); // إزالة BOM إن وجد

  // 1) data URL — يبقى صالحاً للعرض حتى لو فشل التحليل
  let src: string;
  try { src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(text)))}`; }
  catch { src = `data:image/svg+xml,${encodeURIComponent(text)}`; }

  // 2) تحليل: XML أولاً ثم HTML كخطة بديلة (أكثر تسامحاً مع الأخطاء)
  let svg: Element | null = null;
  try {
    const doc = new DOMParser().parseFromString(text, "image/svg+xml");
    if (!doc.querySelector("parsererror")) svg = doc.querySelector("svg");
  } catch { /* نجرب HTML */ }
  if (!svg) {
    try { svg = new DOMParser().parseFromString(text, "text/html").querySelector("svg"); } catch { /* نكمل بدونه */ }
  }

  // 3) الأبعاد المرجعية + مجموع أطوال المسارات
  let vbW = 0, vbH = 0, total = 0;
  let bbox: ParsedSvg["bbox"];
  if (svg) {
    const vb = svg.getAttribute("viewBox");
    if (vb) { const p = vb.trim().split(/[\s,]+/).map(parseFloat); vbW = p[2] || 0; vbH = p[3] || 0; }
    if (!vbW || !vbH) {
      vbW = parseFloat((svg.getAttribute("width") || "").replace(/[^\d.]/g, "")) || 0;
      vbH = parseFloat((svg.getAttribute("height") || "").replace(/[^\d.]/g, "")) || 0;
    }
    try {
      const holder = document.createElement("div");
      holder.style.cssText = "position:absolute;left:-99999px;top:0;width:1px;height:1px;overflow:hidden";
      const clone = svg.cloneNode(true) as SVGSVGElement;
      holder.appendChild(clone);
      document.body.appendChild(holder);
      holder.querySelectorAll("path,line,polyline,polygon,circle,ellipse,rect").forEach(el => {
        try {
          const g = el as SVGGeometryElement;
          if (typeof g.getTotalLength === "function") total += g.getTotalLength();
        } catch { /* عنصر غير قابل للقياس */ }
      });
      // قصّ viewBox على حدود الرسم الفعلي — artboard كبير حول تصميم صغير يجعله يظهر ضئيلاً
      try {
        const bb = clone.getBBox();
        if (bb && bb.width > 0 && bb.height > 0) {
          bbox = { x: bb.x, y: bb.y, w: bb.width, h: bb.height };
          // قص دقيق على حدود الحبر بلا حاشية — حتى تطابق الأبعاد المكتوبة أداة القياس
          clone.setAttribute("viewBox", `${bb.x} ${bb.y} ${bb.width} ${bb.height}`);
          clone.removeAttribute("width");
          clone.removeAttribute("height");
          if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
          vbW = bb.width;
          vbH = bb.height;
          const serialized = new XMLSerializer().serializeToString(clone);
          try { src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(serialized)))}`; }
          catch { src = `data:image/svg+xml,${encodeURIComponent(serialized)}`; }
        }
      } catch (e) { console.warn("SVG bbox crop failed:", e); }
      document.body.removeChild(holder);
    } catch (e) { console.warn("SVG perimeter measurement failed:", e); }
  }

  // 4) أبعاد بديلة من تحميل الصورة نفسها — وفحص نهائي أن المتصفح يستطيع عرضها
  try {
    const probe = await loadImg(src, 8000);
    if (!vbW || !vbH) { vbW = probe.naturalWidth || 0; vbH = probe.naturalHeight || 0; }
  } catch (e) {
    console.warn("SVG image load failed:", e);
    if (!svg) return null; // لا تحليل ولا عرض — ملف غير صالح فعلاً
  }
  if (!vbW) vbW = 100;
  if (!vbH) vbH = vbW * 0.6;

  return { src, aspect: vbH / vbW, perimScale: vbW ? total / vbW : 0, bbox };
}

// ─── تحويل الصور النقطية وPDF إلى مسارات (مثل cadout: vectorization تلقائي) ──
const _loadedScripts = new Map<string, Promise<void>>();
function loadScript(src: string): Promise<void> {
  if (!_loadedScripts.has(src)) {
    _loadedScripts.set(src, new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => res();
      s.onerror = () => { _loadedScripts.delete(src); rej(new Error("script load failed: " + src)); };
      document.head.appendChild(s);
    }));
  }
  return _loadedScripts.get(src)!;
}

// تحميل صورة بطريقة موثوقة (onload بدل decode — الأخير قد يعلّق مع object URLs)
function loadImg(src: string, timeoutMs = 15000): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    const to = setTimeout(() => rej(new Error("image load timeout")), timeoutMs);
    img.onload = () => { clearTimeout(to); res(img); };
    img.onerror = () => { clearTimeout(to); rej(new Error("image load error")); };
    img.src = src;
  });
}

// صورة → canvas (بخلفية بيضاء للشفافية وبدقة محدودة للأداء)
async function fileToCanvas(file: File, maxDim = 1200): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImg(url);
    const sc = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.naturalWidth * sc));
    c.height = Math.max(1, Math.round(img.naturalHeight * sc));
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c;
  } finally { URL.revokeObjectURL(url); }
}

// نص مستخرج من PDF (إحداثيات بالبكسل على الـ canvas)
type PdfText = { str: string; xPx: number; basePx: number; hPx: number; wPx: number };

// PDF (أو AI بتوافق PDF) → canvas لأول صفحة + النصوص المستخرجة (تُمسح من الصورة)
// widthCm/heightCm: الأبعاد الفيزيائية الحقيقية من صفحة الـ PDF (1 نقطة = 1/72 إنش)
async function pdfFileToCanvas(file: File, maxDim = 1600): Promise<{ canvas: HTMLCanvasElement; texts: PdfText[]; widthCm: number; heightCm: number } | null> {
  // مستضافة محلياً — CSP يمنع سكربتات CDN الخارجية (script-src 'self')
  const PDFJS = "/vendor";
  await loadScript(`${PDFJS}/pdf.min.js`);
  const pdfjs = (window as any).pdfjsLib;
  if (!pdfjs) return null;
  pdfjs.GlobalWorkerOptions.workerSrc = `${PDFJS}/pdf.worker.min.js`;
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const page = await doc.getPage(1);
  const vp1 = page.getViewport({ scale: 1 });
  // الأبعاد الحقيقية: نقاط الـ PDF → سم (نقطة = 1/72 إنش، إنش = 2.54 سم)
  const widthCm = (vp1.width / 72) * 2.54;
  const heightCm = (vp1.height / 72) * 2.54;
  const scale = Math.min(4, maxDim / Math.max(vp1.width, vp1.height));
  const vp = page.getViewport({ scale });
  const c = document.createElement("canvas");
  c.width = Math.ceil(vp.width);
  c.height = Math.ceil(vp.height);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  // intent="print" يتجاوز requestAnimationFrame فلا يعلق الرسم في التبويبات الخلفية
  await page.render({ canvasContext: ctx, viewport: vp, intent: "print" }).promise;

  // استخراج النصوص بمواضعها (إحداثيات الـ canvas)
  let texts: PdfText[] = [];
  try {
    const content = await page.getTextContent();
    texts = (content.items as any[])
      .filter(it => (it.str || "").trim())
      .map(it => {
        const m = pdfjs.Util.transform(vp.transform, it.transform);
        const hPx = Math.hypot(m[2], m[3]) || Math.abs(m[3]);
        return { str: it.str as string, xPx: m[4], basePx: m[5], hPx, wPx: (it.width || 0) * scale };
      })
      .filter(t => t.hPx > 2);
    // ملاحظة: لا نمسح النصوص هنا — تُمسح بعد التحقق البصري في handleUploadFile،
    // وما لا يطابق شكله الأصلي يبقى رسومات بمساراته (مطابقة مضمونة)
  } catch (e) { console.warn("PDF text extraction failed:", e); }

  return { canvas: c, texts, widthCm, heightCm };
}

// تجميع نصوص PDF المجزأة في أسطر كاملة
function groupPdfTexts(items: PdfText[]): PdfText[] {
  type Frag = PdfText & { idx: number };
  type Line = { items: Frag[]; basePx: number; hPx: number };
  // كل جزء سطر مبدئي، ثم دمج متكرر حتى الاستقرار: سطران = سطر واحد إذا تقارب
  // خطا الأساس (تسامح 75% من الارتفاع الأكبر) — تباعد الأسطر الحقيقي ≥ 120%
  const lines: Line[] = items.map((t, idx) => ({ items: [{ ...t, idx }], basePx: t.basePx, hPx: t.hPx }));
  let merged = true;
  while (merged) {
    merged = false;
    outer:
    for (let i = 0; i < lines.length; i++)
      for (let j = i + 1; j < lines.length; j++) {
        const A = lines[i], B = lines[j];
        if (Math.abs(A.basePx - B.basePx) < Math.max(4, Math.max(A.hPx, B.hPx) * 0.75)) {
          A.items.push(...B.items);
          A.basePx = A.items.reduce((s, it) => s + it.basePx, 0) / A.items.length;
          A.hPx = Math.max(A.hPx, B.hPx);
          lines.splice(j, 1);
          merged = true;
          break outer;
        }
      }
  }
  return lines.map(L => {
    // ترتيب القراءة = ترتيب التدفق الأصلي للملف — أدق للعربية من الفرز بالمواضع
    L.items.sort((a, b) => a.idx - b.idx);
    const str = L.items.map(i => i.str.normalize("NFKC")).join(" ").replace(/\s+/g, " ").trim();
    const x1 = Math.min(...L.items.map(i => i.xPx));
    const x2 = Math.max(...L.items.map(i => i.xPx + i.wPx));
    return { str, xPx: x1, wPx: Math.max(1, x2 - x1), basePx: L.basePx, hPx: L.hPx };
  }).filter(L => L.str);
}

// ─── تحقق بصري من النص المستخرج ─────────────────────────────────────────────
// PDF العربية كثيراً ما تخزن النص بترتيب بصري أو ترميز مخصص فيخرج مقلوباً.
// نرسم كل مرشح ونقارن توزيع حبره بالبكسلات الأصلية ونعتمد الأقرب.
function colProfile(img: ImageData): number[] {
  const { width: w, height: h, data } = img;
  const p = new Array(w).fill(0);
  for (let x = 0; x < w; x++)
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 4;
      if (data[i + 3] > 20 && (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) < 200) p[x]++;
    }
  return p;
}
// معامل ارتباط بيرسون بين توزيعي الحبر العموديين
function profileCorr(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 4) return 0;
  let ma = 0, mb = 0;
  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
  ma /= n; mb /= n;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < n; i++) { const da = a[i] - ma, db = b[i] - mb; dot += da * db; na += da * da; nb += db * db; }
  return dot / (Math.sqrt(na * nb) || 1);
}
function renderTextScore(region: ImageData, str: string, hPx: number): number {
  const w = region.width, h = region.height;
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d")!;
  x.fillStyle = "#fff"; x.fillRect(0, 0, w, h);
  x.fillStyle = "#000";
  x.font = `${Math.max(8, Math.round(hPx))}px ${getComputedStyle(document.body).fontFamily || "Arial"}`;
  x.textBaseline = "alphabetic";
  const tw = x.measureText(str).width || 1;
  x.save(); x.scale(w / tw, 1); x.fillText(str, 0, hPx * 1.1); x.restore();
  return profileCorr(colProfile(region), colProfile(x.getImageData(0, 0, w, h)));
}
// اللون السائد لحبر المنطقة → أقرب لون من لوحة ألوان المتجر (يحافظ على لون التصميم)
function regionColorId(img: ImageData): string | undefined {
  const { data } = img;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 20) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < 215) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
    }
  }
  if (n < 10) return undefined;
  r /= n; g /= n; b /= n;
  let bestId: string | undefined, bestD = Infinity;
  Object.entries(COL).forEach(([id, c]) => {
    const cr = parseInt(c.hex.slice(1, 3), 16), cg = parseInt(c.hex.slice(3, 5), 16), cb = parseInt(c.hex.slice(5, 7), 16);
    const d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
    if (d < bestD) { bestD = d; bestId = id; }
  });
  return bestId;
}

// مرشحات الترتيب للعربية: كما هو / كلمات معكوسة / حروف معكوسة / كلاهما
function pickBestTextCandidate(region: ImageData, t: PdfText): { str: string; score: number } {
  const cands = new Set([t.str]);
  if (/[؀-ۿ]/.test(t.str)) {
    const words = t.str.split(" ");
    const revChars = (s: string) => (/[؀-ۿ]/.test(s) ? Array.from(s).reverse().join("") : s);
    cands.add(words.slice().reverse().join(" "));
    cands.add(words.map(revChars).join(" "));
    cands.add(words.map(revChars).reverse().join(" "));
  }
  let best = { str: t.str, score: -1 };
  cands.forEach(s => {
    try {
      const sc = renderTextScore(region, s, t.hPx);
      if (sc > best.score) best = { str: s, score: sc };
    } catch { /* تجاهل المرشح الفاشل */ }
  });
  return best;
}

// canvas → SVG مسارات عبر imagetracerjs
async function rasterToSvgText(canvas: HTMLCanvasElement): Promise<string> {
  await loadScript("/vendor/imagetracer.js"); // محلي — CSP يمنع CDN خارجي
  const IT = (window as any).ImageTracer;
  if (!IT) throw new Error("ImageTracer not loaded");
  const imgd = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
  return IT.imagedataToSVG(imgd, {
    ltres: 1, qtres: 1, pathomit: 8, numberofcolors: 8,
    strokewidth: 0, blurradius: 0, roundcoords: 1, viewbox: true,
  });
}

// إزالة مسارات الخلفية الفاتحة الناتجة عن التتبع (الخلفية البيضاء ليست جزءاً من القص)
function stripLightBg(svgText: string): string {
  try {
    const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) return svgText;
    svg.querySelectorAll("path").forEach(p => {
      const f = (p.getAttribute("fill") || "").trim();
      const m = f.match(/rgb\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
      if (m) {
        const lum = 0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3];
        if (lum > 235) p.remove();
      } else if (/^(#fff(fff)?|white)$/i.test(f)) p.remove();
    });
    return new XMLSerializer().serializeToString(svg);
  } catch { return svgText; }
}

// اللون السائد لحبر صورة (hex) — لتمثيل لون التصميم الأصلي
function dominantColor(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext("2d")!;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 30) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < 230) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
    }
  }
  if (n < 8) return "";
  const hx = (v: number) => Math.round(v / n).toString(16).padStart(2, "0");
  return "#" + hx(r) + hx(g) + hx(b);
}

// هل لون التصميم معدني (ذهبي/فضي)؟ → ستانلس ستيل؛ وإلا ملوّن → زنكور
function metallicMatch(hex: string): "gold" | "silver" | null {
  if (!hex || hex.length < 7) return null;
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const sat = max ? (max - min) / max : 0;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  if (sat < 0.18 && lum > 90) return "silver";              // رمادي/فضي
  if (r > 120 && g > 90 && b < g * 0.75 && r >= g && r - b > 40) return "gold"; // ذهبي
  return null;
}

// صندوق المحتوى الفعلي (أصغر مستطيل يحوي البكسلات غير البيضاء) — لتجاهل هوامش الصفحة
function contentBBox(canvas: HTMLCanvasElement): { x: number; y: number; w: number; h: number } {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width, H = canvas.height;
  const { data } = ctx.getImageData(0, 0, W, H);
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (data[i + 3] > 20 && (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) < 240) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { x: 0, y: 0, w: W, h: H }; // لا محتوى
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

// كشف إطار مرسوم (مستطيل border حول التصميم): خطّان أفقيان طويلان (أعلى/أسفل)
// وخطّان رأسيان (يمين/يسار) قرب المحيط → يُعيد صندوق الإطار، وإلا null
function detectFrameBox(canvas: HTMLCanvasElement): { x: number; y: number; w: number; h: number } | null {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width, H = canvas.height;
  const { data } = ctx.getImageData(0, 0, W, H);
  const dark = (x: number, y: number) => {
    const i = (y * W + x) * 4;
    return data[i + 3] > 20 && (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) < 200;
  };
  const minSpanH = W * 0.55, minSpanV = H * 0.55;
  // نتجاهل حافة الـ artboard (أول/آخر ~2% بكسل): حدّ الصفحة ليس إطاراً مرسوماً
  const mX = Math.max(3, Math.round(W * 0.02)), mY = Math.max(3, Math.round(H * 0.02));
  // أطول امتداد متصل في صف/عمود
  const rowRun = (y: number) => { let best = 0, x = 0; while (x < W) { if (!dark(x, y)) { x++; continue; } let x2 = x; while (x2 < W && dark(x2, y)) x2++; if (x2 - x > best) best = x2 - x; x = x2; } return best; };
  const colRun = (x: number) => { let best = 0, y = 0; while (y < H) { if (!dark(x, y)) { y++; continue; } let y2 = y; while (y2 < H && dark(x, y2)) y2++; if (y2 - y > best) best = y2 - y; y = y2; } return best; };
  let top = -1, bot = -1, left = -1, right = -1;
  for (let y = mY; y < H - mY; y++) if (rowRun(y) >= minSpanH) { if (top < 0) top = y; bot = y; }
  for (let x = mX; x < W - mX; x++) if (colRun(x) >= minSpanV) { if (left < 0) left = x; right = x; }
  if (top < 0 || bot <= top || left < 0 || right <= left) return null;
  // يجب أن تكون الخطوط قرب المحيط وتشكّل مستطيلاً معقولاً
  if (top > H * 0.35 || bot < H * 0.65 || left > W * 0.35 || right < W * 0.65) return null;
  if (bot - top < H * 0.4 || right - left < W * 0.4) return null;
  return { x: left, y: top, w: right - left, h: bot - top };
}

// ─── حذف الإطارات وخطوط التقسيم (تُحذف ولا تدخل في القص) ────────────────────
// خط = امتداد متصل رفيع (سماكة ≤ 7px) وطويل (≥ 8% من البعد) — يُمسح أينما كان،
// فتنفصل الشعارات التي كان الإطار يصلها ببعضها
function eraseFrameLines(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width, H = canvas.height;
  const { data } = ctx.getImageData(0, 0, W, H);
  const dark = (x: number, y: number) => {
    const i = (y * W + x) * 4;
    return data[i + 3] > 20 && (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) < 240;
  };
  ctx.fillStyle = "#fff";
  const THIN = 7;
  const minLenH = Math.max(40, W * 0.08);
  const minLenV = Math.max(40, H * 0.08);
  // خطوط أفقية: امتدادات متصلة في الصف رفيعة عمودياً
  for (let y = 0; y < H; y++) {
    let x = 0;
    while (x < W) {
      if (!dark(x, y)) { x++; continue; }
      let x2 = x;
      while (x2 < W && dark(x2, y)) x2++;
      const len = x2 - x;
      if (len >= minLenH) {
        let thin = 0;
        for (const fr of [0.2, 0.5, 0.8]) {
          const xi = Math.min(W - 1, (x + len * fr) | 0);
          let up = 0, dn = 0;
          while (y - up - 1 >= 0 && dark(xi, y - up - 1)) up++;
          while (y + dn + 1 < H && dark(xi, y + dn + 1)) dn++;
          if (up + dn + 1 <= THIN) thin++;
        }
        if (thin >= 2) ctx.fillRect(x - 1, y - 1, len + 2, 3);
      }
      x = x2;
    }
  }
  // خطوط رأسية: امتدادات متصلة في العمود رفيعة أفقياً
  for (let x = 0; x < W; x++) {
    let y = 0;
    while (y < H) {
      if (!dark(x, y)) { y++; continue; }
      let y2 = y;
      while (y2 < H && dark(x, y2)) y2++;
      const len = y2 - y;
      if (len >= minLenV) {
        let thin = 0;
        for (const fr of [0.2, 0.5, 0.8]) {
          const yi = Math.min(H - 1, (y + len * fr) | 0);
          let lf = 0, rt = 0;
          while (x - lf - 1 >= 0 && dark(x - lf - 1, yi)) lf++;
          while (x + rt + 1 < W && dark(x + rt + 1, yi)) rt++;
          if (lf + rt + 1 <= THIN) thin++;
        }
        if (thin >= 2) ctx.fillRect(x - 1, y - 1, 3, len + 2);
      }
      y = y2;
    }
  }
}

// ─── تقسيم XY-cut: يفصل المحتويات منطقياً (لوجو | نص | سطر عربي | سطر إنجليزي) ──
// تحليل تخطيط مستندي كلاسيكي: قصّ عمودي ثم أفقي (يفصل الأعمدة والأسطر دون تقطيع
// الكلمات)، ثم تمريرة لاحقة تفصل أي فجوة عمودية «شاذة كبيرة» داخل المقطع (فاصل
// عناصر مثل مغسلة|لوجو متجاوران تحت سطر يملأ الأعمدة). الفاصل = فجوة ≥ 35 سم
// فيزيائياً وشاذة عن باقي الفجوات (≥ 1.7× الوسيط) فلا تتقطّع كلمات النص المتباعدة.
// مُختبَر على ملفات عملاء حقيقية (الجيلوجيا، الغسلة).
function xyCutSegments(canvas: HTMLCanvasElement, cmPerPx?: number): { x: number; y: number; w: number; h: number }[] {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width, H = canvas.height;
  const { data } = ctx.getImageData(0, 0, W, H);
  const ink = (x: number, y: number) => {
    const i = (y * W + x) * 4;
    return data[i + 3] > 20 && (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) < 240;
  };
  const Vt = Math.max(12, W * 0.012); // عتبة الفجوة العمودية (فصل الأعمدة/اللوجو)
  const Ht = Math.max(8, H * 0.03);   // عتبة الفجوة الأفقية (فصل الأسطر)
  // إسقاط الحبر على محور: axis=0 أعمدة، axis=1 صفوف
  const proj = (x0: number, y0: number, x1: number, y1: number, axis: 0 | 1) => {
    const n = axis === 0 ? x1 - x0 : y1 - y0;
    const p = new Uint8Array(n);
    for (let k = 0; k < n; k++) {
      let has = false;
      if (axis === 0) { const x = x0 + k; for (let y = y0; y < y1; y++) if (ink(x, y)) { has = true; break; } }
      else { const y = y0 + k; for (let x = x0; x < x1; x++) if (ink(x, y)) { has = true; break; } }
      p[k] = has ? 1 : 0;
    }
    return p;
  };
  // أكبر فجوة (شريط أصفار) متجاهلاً الأطراف
  const biggestGap = (p: Uint8Array) => {
    let best = 0, at = -1, i = 0, n = p.length;
    while (i < n && !p[i]) i++;
    let e = n; while (e > 0 && !p[e - 1]) e--;
    let j = i;
    while (j < e) { if (p[j]) { j++; continue; } const s = j; while (j < e && !p[j]) j++; if (j - s > best) { best = j - s; at = s + (((j - s) / 2) | 0); } }
    return { len: best, at };
  };
  // كل الفجوات (لكشف الشاذة) متجاهلاً الأطراف
  const allGaps = (p: Uint8Array) => {
    const g: { len: number; at: number }[] = [];
    let i = 0, n = p.length; while (i < n && !p[i]) i++;
    let e = n; while (e > 0 && !p[e - 1]) e--;
    let j = i;
    while (j < e) { if (p[j]) { j++; continue; } const s = j; while (j < e && !p[j]) j++; g.push({ len: j - s, at: s + (((j - s) / 2) | 0) }); }
    return g;
  };
  // الصندوق المحيط بالحبر داخل منطقة
  const tight = (x0: number, y0: number, x1: number, y1: number) => {
    let a = x1, b = y1, c = x0, d = y0, any = false;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (ink(x, y)) { any = true; if (x < a) a = x; if (x > c) c = x; if (y < b) b = y; if (y > d) d = y; }
    return any ? { x0: a, y0: b, x1: c + 1, y1: d + 1 } : null;
  };
  type Reg = { x0: number; y0: number; x1: number; y1: number };
  const split = (r: Reg, axis: 0 | 1, thr: number, depth: number): Reg[] => {
    const bb = tight(r.x0, r.y0, r.x1, r.y1);
    if (!bb) return [];
    if (depth > 8) return [bb];
    const g = biggestGap(proj(bb.x0, bb.y0, bb.x1, bb.y1, axis));
    if (g.len < thr) return [bb];
    if (axis === 0) { const xc = bb.x0 + g.at; return [...split({ ...bb, x1: xc }, axis, thr, depth + 1), ...split({ ...bb, x0: xc }, axis, thr, depth + 1)]; }
    const yc = bb.y0 + g.at;
    return [...split({ ...bb, y1: yc }, axis, thr, depth + 1), ...split({ ...bb, y0: yc }, axis, thr, depth + 1)];
  };
  const cols = split({ x0: 0, y0: 0, x1: W, y1: H }, 0, Vt, 0); // عمودي أولاً
  const base: Reg[] = [];
  cols.forEach(c => split(c, 1, Ht, 0).forEach(r => base.push(r)));

  // تمريرة لاحقة: افصل أي فجوة عمودية «شاذة كبيرة» داخل المقطع (فاصل عناصر متجاورة)
  // الفاصل = فجوة ≥ 35 سم فيزيائياً (أو W*0.08 إن جُهل المقياس) وشاذة (≥1.7× الوسيط)
  const floorObj = cmPerPx && cmPerPx > 0 ? Math.max(40, 35 / cmPerPx) : W * 0.08;
  const median = (a: number[]) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };
  const postV = (r: Reg, depth: number): Reg[] => {
    const bb = tight(r.x0, r.y0, r.x1, r.y1);
    if (!bb) return [];
    if (depth > 10) return [bb];
    const gaps = allGaps(proj(bb.x0, bb.y0, bb.x1, bb.y1, 0));
    if (!gaps.length) return [bb];
    const best = gaps.reduce((a, b) => (b.len > a.len ? b : a));
    const med = median(gaps.map(g => g.len));
    const isObjGap = best.len >= floorObj && (gaps.length === 1 || best.len >= 1.7 * med);
    if (!isObjGap) return [bb];
    const xc = bb.x0 + best.at;
    return [...postV({ ...bb, x1: xc }, depth + 1), ...postV({ ...bb, x0: xc }, depth + 1)];
  };
  const out: { x: number; y: number; w: number; h: number }[] = [];
  base.forEach(b => postV(b, 0).forEach(r => out.push({ x: r.x0, y: r.y0, w: r.x1 - r.x0, h: r.y1 - r.y0 })));
  return out.filter(b => b.w > 8 && b.h > 8).sort((a, b) => b.w * b.h - a.w * a.h);
}

// رسترة طبقة نص إلى canvas (أسود على أبيض) بأبعادها الفعلية بالسنتيمتر — لتمكين الدمج/الفصل على النصوص
function textRaster(l: TextLayer): { canvas: HTMLCanvasElement; wCm: number; hCm: number } {
  const f = FONT_BY_ID[l.fontId] || FONT_BY_ID["cairo"];
  const sx = l.stretchX ?? 1, sy = l.stretchY ?? 1;
  const PXCM = 8;
  const fontPx = Math.max(8, l.heightCm * PXCM);
  const fontStr = `900 ${fontPx}px ${f.family}, Tajawal, Cairo, sans-serif`;
  const txt = l.text || "أ";
  const meas = document.createElement("canvas").getContext("2d")!;
  meas.font = fontStr;
  const m = meas.measureText(txt);
  const asc  = m.actualBoundingBoxAscent  || fontPx * 0.8;
  const desc = m.actualBoundingBoxDescent || fontPx * 0.2;
  const left  = m.actualBoundingBoxLeft  || 0;
  const right = (m.actualBoundingBoxRight ?? m.width) || m.width;
  const inkW = Math.max(1, Math.ceil(left + right));
  const inkH = Math.max(1, Math.ceil(asc + desc));
  const pad = Math.ceil(fontPx * 0.12);
  const cw = Math.max(1, Math.round(inkW * sx) + 2 * pad);
  const ch = Math.max(1, Math.round(inkH * sy) + 2 * pad);
  const canvas = document.createElement("canvas"); canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cw, ch);
  ctx.fillStyle = "#000";
  ctx.font = fontStr;
  ctx.textBaseline = "alphabetic";
  ctx.setTransform(sx, 0, 0, sy, pad, pad);
  ctx.fillText(txt, left, asc);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return { canvas, wCm: cw / PXCM, hCm: ch / PXCM };
}

// قياس أصغر فجوة أفقية بين كتل الحبر (كنسبة من الارتفاع) — لتحديد أقصى سُمك للكنتور دون دمج الحروف
const _gapCache = new Map<string, number>();
async function measureMinInkGap(src: string): Promise<number> {
  if (_gapCache.has(src)) return _gapCache.get(src)!;
  let ratio = 0.16;
  try {
    const img = await loadImg(src);
    const H = 140;
    const W = Math.max(1, Math.round(H * (img.width / Math.max(1, img.height))));
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0, W, H);
    const data = ctx.getImageData(0, 0, W, H).data;
    // عمود فيه حبر = أي بكسل غير شفاف وغير أبيض
    const inkCol: boolean[] = new Array(W).fill(false);
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        const i = (y * W + x) * 4;
        if (data[i + 3] > 50 && !(data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235)) { inkCol[x] = true; break; }
      }
    }
    const minReal = Math.ceil(H * 0.02); // تجاهل الفجوات الشعرية (حروف متّصلة)
    const gaps: number[] = []; let run = 0, seenInk = false;
    for (let x = 0; x < W; x++) {
      if (inkCol[x]) { if (seenInk && run > 0) gaps.push(run); run = 0; seenInk = true; }
      else if (seenInk) run++;
    }
    const real = gaps.filter(g => g >= minReal);
    const minGap = real.length ? Math.min(...real) : H * 0.18;
    ratio = Math.min(0.4, minGap / H);
  } catch { /* احتفظ بالافتراضي */ }
  _gapCache.set(src, ratio);
  return ratio;
}

// فصل يدوي: يقصّ الصورة عند أكبر فجوة بيضاء (عمودية أو أفقية) إلى جزأين
function splitAtLargestGap(canvas: HTMLCanvasElement): { x: number; y: number; w: number; h: number }[] {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width, H = canvas.height;
  const { data } = ctx.getImageData(0, 0, W, H);
  const ink = (x: number, y: number) => {
    const i = (y * W + x) * 4;
    return data[i + 3] > 20 && (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) < 240;
  };
  const proj = (axis: 0 | 1) => {
    const n = axis === 0 ? W : H; const p = new Uint8Array(n);
    for (let k = 0; k < n; k++) { let has = false; if (axis === 0) { for (let y = 0; y < H; y++) if (ink(k, y)) { has = true; break; } } else { for (let x = 0; x < W; x++) if (ink(x, k)) { has = true; break; } } p[k] = has ? 1 : 0; }
    return p;
  };
  const biggest = (p: Uint8Array) => {
    let best = 0, at = -1, i = 0, n = p.length; while (i < n && !p[i]) i++; let e = n; while (e > 0 && !p[e - 1]) e--;
    let j = i; while (j < e) { if (p[j]) { j++; continue; } const s = j; while (j < e && !p[j]) j++; if (j - s > best) { best = j - s; at = s + (((j - s) / 2) | 0); } }
    return { len: best, at };
  };
  const v = biggest(proj(0)), hh = biggest(proj(1));
  if (Math.max(v.len, hh.len) < 4) return [{ x: 0, y: 0, w: W, h: H }];
  if (v.len >= hh.len) return [{ x: 0, y: 0, w: v.at, h: H }, { x: v.at, y: 0, w: W - v.at, h: H }];
  return [{ x: 0, y: 0, w: W, h: hh.at }, { x: 0, y: hh.at, w: W, h: H - hh.at }];
}

// ─── عزل عناصر التصميم (شعارات/رموز) عبر المكونات المتصلة بكسلياً ────────────
// شبكة خلايا 4px + تمدد لدمج الأجزاء المتقاربة ثم BFS — يعيد صناديق العناصر
function segmentCanvas(canvas: HTMLCanvasElement): { x: number; y: number; w: number; h: number }[] {
  const ctx = canvas.getContext("2d")!;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const cell = 4;
  const gw = Math.ceil(canvas.width / cell), gh = Math.ceil(canvas.height / cell);
  const occ = new Uint8Array(gw * gh);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (data[i + 3] > 20 && lum < 240) occ[((y / cell) | 0) * gw + ((x / cell) | 0)] = 1;
    }
  }
  // تمدد لدمج أجزاء العنصر الواحد (حروف شعار متقاربة مثلاً)
  const R = 2;
  const dil = new Uint8Array(occ);
  for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
    if (!occ[gy * gw + gx]) continue;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const ny = gy + dy, nx = gx + dx;
      if (ny >= 0 && ny < gh && nx >= 0 && nx < gw) dil[ny * gw + nx] = 1;
    }
  }
  const seen = new Uint8Array(gw * gh);
  const clusters: { x: number; y: number; w: number; h: number }[] = [];
  for (let st = 0; st < gw * gh; st++) {
    if (!dil[st] || seen[st]) continue;
    let minX = gw, maxX = -1, minY = gh, maxY = -1, hasInk = false;
    const stack = [st];
    seen[st] = 1;
    while (stack.length) {
      const cur = stack.pop()!;
      const cy = (cur / gw) | 0, cx = cur % gw;
      if (occ[cur]) hasInk = true;
      if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const ny = cy + dy, nx = cx + dx;
        if (ny < 0 || ny >= gh || nx < 0 || nx >= gw) continue;
        const ni = ny * gw + nx;
        if (dil[ni] && !seen[ni]) { seen[ni] = 1; stack.push(ni); }
      }
    }
    if (!hasInk) continue;
    const x = Math.max(0, minX * cell - 2), y = Math.max(0, minY * cell - 2);
    const w = Math.min(canvas.width, (maxX + 1) * cell + 2) - x;
    const h = Math.min(canvas.height, (maxY + 1) * cell + 2) - y;
    if (w > 8 && h > 8) clusters.push({ x, y, w, h });
  }
  return clusters.sort((a, b) => b.w * b.h - a.w * a.h);
}

function estPerimeterCm(text: string, heightCm: number): number {
  const chars = (text || "").replace(/\s/g, "").length || 1;
  return chars * heightCm * PERIM_FACTOR;
}
function priceRun(p: number, d: number, r: number) {
  const side = p * d * r, labor = p * LABOR_PER_CM;
  return { side, labor, total: side + labor };
}
function priceLighting(area: number, f: number) { return f > 0 ? area * f * LED_RATE : 0; }
function priceBackground(bg: { add: boolean; material: string; lightboxFace?: string; widthCm: number; heightCm: number; depthCm: number }): number {
  if (!bg.add) return 0;
  const aM2 = (bg.widthCm * bg.heightCm) / 10000;
  const mat = RATES.background[bg.material];
  if (!mat) return 0;
  let cost = aM2 * (mat.rate + bg.depthCm * RATES.bgDepthAddPerCm);
  // For lightbox: add face material cost
  if (bg.material === "lightbox" && bg.lightboxFace) {
    const face = LIGHTBOX_FACES.find(f => f.id === bg.lightboxFace);
    if (face) cost += aM2 * face.rateM2;
  }
  return cost;
}
function priceInstall(o: { totalMeters: number; bgAreaM2: number; wallDirect: boolean; craneNeeded: boolean; outsideJeddah: boolean }) {
  let base = o.totalMeters * RATES.install.perMeter + o.bgAreaM2 * RATES.install.bgPerM2;
  if (o.wallDirect) base *= RATES.install.wallDirectSurcharge;
  if (o.craneNeeded) base += RATES.install.craneFee;
  if (o.outsideJeddah) base += RATES.install.outsideJeddahFee;
  return base;
}

// ─── Shared UI atoms ──────────────────────────────────────────────────────────
const stepBtn: React.CSSProperties = { width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#2A231B", color: "#ddd", cursor: "pointer", fontSize: "1.05rem", flexShrink: 0, fontWeight: 700 };

function StepCard({ n, title, sub, done, children }: { n: string; title: string; sub?: string; done?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ background: "#F4EFE6", borderRadius: 16, border: "1px solid rgba(201,162,75,0.12)", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "1rem 1.1rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: done ? G : "rgba(201,162,75,0.1)", border: `1.5px solid ${done ? "transparent" : "rgba(201,162,75,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800, color: done ? "#2C1E15" : GOLD }}>
          {done ? "✓" : n}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#2C1E15" }}>{title}</div>
          {sub && <div style={{ fontSize: "0.72rem", color: "#ccc", marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
      <div style={{ padding: "1.1rem", flex: 1 }}>{children}</div>
    </div>
  );
}

function AccordionSection({ title, icon, num, done, open, onToggle, onConfirm, children }: { title: string; icon: string; num?: number; done?: boolean; open: boolean; onToggle: () => void; onConfirm?: () => void; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 14, border: `1px solid ${done ? "rgba(201,162,75,0.25)" : "rgba(154,106,42,0.2)"}`, overflow: "hidden", background: "#F2E8D0" }}>
      <button onClick={onToggle} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 1rem", background: "none", border: "none", cursor: "pointer", fontFamily: "Cairo,sans-serif", textAlign: "right" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
          {num != null && <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: "50%", background: done ? G : "rgba(154,106,42,0.18)", color: done ? "#2C1E15" : "#9A6A2A", fontSize: "0.66rem", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{num}</span>}
          <span style={{ fontSize: "0.9rem" }}>{icon}</span>
          <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#2C1E15", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
          {done && <span style={{ width: 18, height: 18, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: "#2C1E15", fontWeight: 900 }}>✓</span>}
          <span style={{ color: "#5A4A3A", fontSize: "0.75rem", display: "inline-block", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
        </div>
      </button>
      {open && (
        <div style={{ padding: "0.1rem 1rem 1rem", borderTop: "1px solid rgba(154,106,42,0.18)" }}>
          {children}
          {onConfirm && (
            <button type="button" onClick={onConfirm}
              style={{ marginTop: "1rem", width: "100%", padding: "0.7rem", borderRadius: 10, cursor: "pointer", fontFamily: "Cairo,sans-serif", fontWeight: 800, fontSize: "0.82rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.15s",
                border: done ? "1px solid rgba(46,122,62,0.45)" : "none", background: done ? "rgba(46,122,62,0.1)" : G, color: done ? "#2E7A3E" : "#2C1E15" }}>
              {done ? "✓ تم اعتماد هذه المرحلة — تعديل" : "اعتماد المرحلة والمتابعة ←"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Choice({ options, value, onChange, cols }: { options: { v: string; label: string; sub?: string; icon?: string }[]; value: string; onChange: (v: string) => void; cols?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: cols ? `repeat(${cols},1fr)` : "1fr 1fr", gap: "0.5rem" }}>
      {options.map(o => {
        const on = value === o.v;
        return (
          <button key={o.v} onClick={() => onChange(o.v)} style={{ padding: "0.7rem 0.6rem", borderRadius: 12, cursor: "pointer", fontFamily: "Cairo,sans-serif", textAlign: "center", border: `1.5px solid ${on ? GOLD : "rgba(154,106,42,0.2)"}`, background: on ? "#2C1E15" : "#E8DAC0", color: on ? GOLD : "#5A4A3A", transition: "all 0.15s" }}>
            {o.icon && <div style={{ marginBottom: 3 }}>{o.icon}</div>}
            <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>{o.label}</div>
            {o.sub && <div style={{ fontSize: "0.66rem", color: on ? "rgba(201,162,75,0.7)" : "#7A6A5A", marginTop: 2 }}>{o.sub}</div>}
          </button>
        );
      })}
    </div>
  );
}

function Stepper({ label, value, onChange, min, max, step = 5, presets, suffix = "سم", onHelp }: { label?: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; presets?: number[]; suffix?: string; onHelp?: () => void }) {
  // Local raw string — lets user type freely; clamps only on blur
  const [raw, setRaw] = useState(String(value));
  const [focused, setFocused] = useState(false);

  // Sync when parent value changes (e.g. preset click or stepper button)
  useEffect(() => {
    if (!focused) setRaw(String(value));
  }, [value, focused]);

  const commit = (str: string) => {
    const n = parseInt(str, 10);
    const clamped = isNaN(n) ? value : Math.min(max, Math.max(min, n));
    setRaw(String(clamped));
    onChange(clamped);
  };

  return (
    <div>
      {label && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "0.35rem" }}>
          <span style={{ fontSize: "0.72rem", color: "#5A4A3A", fontWeight: 700 }}>{label}</span>
          {onHelp && (
            <button type="button" onClick={onHelp} title="توضيح بالرسم"
              style={{ width: 16, height: 16, borderRadius: "50%", border: `1px solid ${GOLD}`, background: "rgba(201,162,75,0.12)", color: GOLD, fontSize: "0.62rem", fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0, flexShrink: 0 }}>؟</button>
          )}
        </div>
      )}
      <div style={{ display: "flex", gap: "0.3rem", alignItems: "center", direction: "ltr" }}>
        <button onClick={() => { const v2 = Math.max(min, value - step); onChange(v2); setRaw(String(v2)); }} style={{ ...stepBtn, background: "#E8DAC0", border: "1px solid rgba(154,106,42,0.25)", color: "#2C1E15" }}>−</button>
        <input
          type="text"
          inputMode="numeric"
          value={raw}
          onChange={e => setRaw(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); commit(raw); }}
          onKeyDown={e => { if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); } }}
          style={{ flex: 1, textAlign: "center", padding: "0.45rem 0.3rem", borderRadius: 8, background: "#F2E8D0", border: `1.5px solid ${focused ? "rgba(201,162,75,0.55)" : "rgba(154,106,42,0.25)"}`, color: "#2C1E15", fontSize: "0.92rem", fontWeight: 700, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s", minWidth: 0 }}
        />
        {suffix && <span style={{ fontSize: "0.68rem", color: "#5A4A3A", fontFamily: "Cairo,sans-serif", minWidth: "1.4rem", textAlign: "center", flexShrink: 0 }}>{suffix}</span>}
        <button onClick={() => { const v2 = Math.min(max, value + step); onChange(v2); setRaw(String(v2)); }} style={{ ...stepBtn, background: "#E8DAC0", border: "1px solid rgba(154,106,42,0.25)", color: "#2C1E15" }}>+</button>
      </div>
      {presets && (
        <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
          {presets.map(v => { const a = value === v; return (
            <button key={v} onClick={() => { onChange(v); setRaw(String(v)); }} style={{ padding: "0.15rem 0.55rem", borderRadius: 999, fontSize: "0.62rem", cursor: "pointer", fontFamily: "Cairo,sans-serif", border: `1px solid ${a ? "rgba(201,162,75,0.5)" : "rgba(154,106,42,0.25)"}`, background: a ? "rgba(201,162,75,0.1)" : "transparent", color: a ? GOLD : "#5A4A3A", transition: "all 0.15s" }}>{v}</button>
          ); })}
        </div>
      )}
    </div>
  );
}

function Swatches({ ids, value, onChange }: { ids: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
      {ids.map(id => { const c = COL[id]; const on = value === id; return (
        <button key={id} onClick={() => onChange(id)} title={c?.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", background: "none", border: "none", padding: 0 }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: c?.hex, border: `2.5px solid ${on ? GOLD : "rgba(255,255,255,0.12)"}`, boxShadow: on ? "0 0 0 2px rgba(201,162,75,0.3)" : "none", display: "block" }} />
          <span style={{ fontSize: "0.6rem", color: on ? GOLD : "#777" }}>{c?.label}</span>
        </button>
      ); })}
    </div>
  );
}

// ─── CustomColorSwatch: اختيار «ألوان أخرى» (أي لون) — يُتاح لغير الستانلس ستيل ───
function CustomColorSwatch({ active, hex, onPick }: { active: boolean; hex: string; onPick: (v: string) => void }) {
  return (
    <label title="ألوان أخرى (أي لون)" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}>
      <span style={{ position: "relative", width: 30, height: 30, borderRadius: 8, overflow: "hidden", display: "block",
        border: `2.5px solid ${active ? GOLD : "rgba(255,255,255,0.18)"}`, boxShadow: active ? "0 0 0 2px rgba(201,162,75,0.3)" : "none",
        background: active && hex ? hex : "conic-gradient(from 0deg,#ff3b30,#ffcc00,#34c759,#00c7be,#007aff,#af52de,#ff2d55,#ff3b30)" }}>
        <input type="color" value={hex || "#888888"} onChange={e => onPick(e.target.value)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", border: "none", padding: 0 }} />
      </span>
      <span style={{ fontSize: "0.6rem", color: active ? GOLD : "#777" }}>أخرى</span>
    </label>
  );
}

// ─── DimInput: مقبض أبعاد قابل للتحرير ───────────────────────────────────────
function DimInput({ label, value, unit, readOnly, style, onChange }: {
  label: string; value: number; unit: string; readOnly?: boolean;
  style?: React.CSSProperties;
  onChange?: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw]         = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    const n = parseInt(raw, 10);
    if (!isNaN(n) && onChange) onChange(n);
    setEditing(false);
  };

  return (
    <div style={style} onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
      <span style={{ fontSize: "0.65rem", color: "#C7B79A", marginInlineEnd: 3, fontWeight: 600 }}>{label}</span>
      {editing && !readOnly ? (
        <input ref={inputRef} autoFocus value={raw} inputMode="numeric"
          onChange={e => setRaw(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          style={{ width: 34, background: "rgba(201,162,75,0.15)", border: `1px solid ${GOLD}`, outline: "none", color: "#FFFFFF", fontWeight: 800, fontSize: "0.78rem", fontFamily: "Cairo,sans-serif", textAlign: "center", borderRadius: 4, padding: "0 2px" }} />
      ) : (
        <span
          style={{ color: "#FFFFFF", fontWeight: 900, cursor: readOnly ? "default" : "text", minWidth: 24, textAlign: "center", display: "inline-block", fontSize: "0.82rem" }}
          onDoubleClick={() => { if (!readOnly) { setRaw(String(value)); setEditing(true); } }}
          onClick={() => { if (!readOnly) { setRaw(String(value)); setEditing(true); } }}>
          {value}
        </span>
      )}
      <span style={{ fontSize: "0.65rem", color: GOLD, marginInlineStart: 2, fontWeight: 600 }}>{unit}</span>
    </div>
  );
}

// ─── Design Canvas ────────────────────────────────────────────────────────────
// رمز QR حقيقي قابل للمسح — يُرمّز القيمة فعلياً (وليس نمطاً زخرفياً)
function RealQR({ value }: { value: string }) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value || "https://e3lani.com", { margin: 1, errorCorrectionLevel: "M", width: 320, color: { dark: "#000000", light: "#FFFFFF" } })
      .then(u => { if (alive) setUrl(u); })
      .catch(() => { if (alive) setUrl(""); });
    return () => { alive = false; };
  }, [value]);
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt="QR" style={{ width: "100%", height: "100%", display: "block", imageRendering: "pixelated" }} /> : null;
}

function Ruler({ horizontal, length, cm, offset = 0 }: { horizontal: boolean; length: number; cm: number; offset?: number }) {
  const ticks = 6;
  const labels = Array.from({ length: ticks + 1 }, (_, i) => Math.round((cm / ticks) * i));
  if (horizontal) return (
    <div style={{ position: "absolute", top: 6, insetInlineStart: offset, width: length, height: 20 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 14, borderTop: `1.5px solid ${GOLD}50` }} />
      {labels.map((v, i) => <div key={i} style={{ position: "absolute", left: `${(i / ticks) * 100}%`, transform: "translateX(-50%)", top: 0 }}><div style={{ width: 1, height: 6, background: `${GOLD}60`, margin: "8px auto 0" }} /><div style={{ fontSize: "0.55rem", color: "#ccc", fontFamily: "Cairo,sans-serif", marginTop: -16 }}>{v}</div></div>)}
    </div>
  );
  return (
    <div style={{ position: "absolute", insetInlineStart: 6, top: 30, width: 26, height: length }}>
      <div style={{ position: "absolute", top: 0, bottom: 0, insetInlineEnd: 4, borderInlineEnd: `1.5px solid ${GOLD}50` }} />
      {labels.map((v, i) => <div key={i} style={{ position: "absolute", top: `${(i / ticks) * 100}%`, transform: "translateY(-50%)", insetInlineEnd: 8, fontSize: "0.55rem", color: "#ccc", fontFamily: "Cairo,sans-serif" }}>{v}</div>)}
    </div>
  );
}

function DesignCanvas({ area, bg, faceColorId, faceCustomColor, contentColorId, contentCustomColor, light, layers, selectedId, onSelect, onMove, onMoveRaw, onResize, onUpdate, bgLightTempId, night, guides, zoom, materialLabel, faceBorder, frameColor, mergeSel, mergeMode, onSetMergeMode, onToggleMerge, onMerge, onSplit, supStrip }: {
  area: { w: number; h: number };
  bg: { add: boolean; showColor?: boolean; material: string; widthCm: number; heightCm: number; depthCm: number; colorHex?: string; illuminated?: boolean };
  faceColorId: string; faceCustomColor?: string; contentColorId?: string; contentCustomColor?: string; light: { typeId: string; tempId: string };
  materialLabel?: string;
  faceBorder?: boolean; frameColor?: string;
  layers: Layer[]; selectedId: string | null;
  onSelect: (id: string) => void; onMove: (id: string, x: number, y: number) => void;
  onMoveRaw: (id: string, x: number, y: number) => void;
  onResize: (id: string, newSizeCm: number) => void;
  onUpdate: (id: string, patch: Partial<Layer>) => void;
  bgLightTempId?: string;
  night: boolean; guides: boolean; zoom: number;
  // أدوات الدمج/الفصل
  mergeSel: string[]; mergeMode: boolean;
  onSetMergeMode: (v: boolean) => void; onToggleMerge: (id: string) => void;
  onMerge: () => void; onSplit: (id: string) => void;
  supStrip?: number; // نسبة مئوية من ارتفاع الكانفاس لشريط التموينات السفلي (مثلاً 19.6)
}) {
  const panelRef      = useRef<HTMLDivElement>(null);
  const dragId        = useRef<string | null>(null);
  const dragStart     = useRef<{ x: number; y: number } | null>(null); // نقطة بداية الضغط للعتبة
  const dragLive      = useRef(false); // true بعد تجاوز عتبة 5px
  const resizeRef     = useRef<{ id: string; startX: number; startY: number; origSize: number; cx: number; cy: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [fontTick, setFontTick] = useState(0);
  useEffect(() => {
    setMounted(true);
    // أعِد القياس عند اكتمال تحميل الخطوط
    document.fonts?.ready.then(() => {
      _tightCache.clear();
      setFontTick(t => t + 1);
    });
  }, []);

  const MAXW = 640, MAXH = 470;
  const fit = Math.min(MAXW / area.w, MAXH / area.h);
  const scale = fit * zoom;
  const boardW = area.w * scale, boardH = area.h * scale;

  const temp    = LIGHT_TEMPS.find(t => t.id === light.tempId)   || LIGHT_TEMPS[0];
  const bgTemp  = LIGHT_TEMPS.find(t => t.id === bgLightTempId)  || LIGHT_TEMPS[0];
  const lit     = light.typeId !== "none";
  const glow    = temp.glow;
  const bgGlow  = bgTemp.glow;
  // كنتور (حدّ حول الأحرف) بلون خامة الجوانب — للنصوص فقط، وسُمكه نسبة من ارتفاع الحرف (≈ سمك الحدّ)
  const contourOn  = !!faceBorder;
  const contourCol = contourOn ? (frameColor || "#9aa0a6") : "transparent";
  const CONTOUR_RATIO = 0.05; // أقصى نسبة للكنتور من ارتفاع الحرف (يُخفَّض تلقائياً حسب فجوة الحروف)
  // قياس فجوة الحروف لكل تصميم (مخبّأ) لتحديد أقصى سُمك للكنتور دون تداخل
  const [, setGapTick] = useState(0);
  const gapRatioRef = useRef<Map<string, number>>(new Map());
  const getGapRatio = (src: string) => {
    const m = gapRatioRef.current;
    if (m.has(src)) return m.get(src)!;
    m.set(src, 0.16); // افتراضي مؤقت يمنع تكرار القياس
    measureMinInkGap(src).then(r => { m.set(src, r); setGapTick(t => t + 1); });
    return 0.16;
  };

  const SAFE_CM   = 5;
  const safeXPct  = (SAFE_CM / area.w) * 100;
  const safeYPct  = (SAFE_CM / area.h) * 100;

  const getPct = useCallback((cx: number, cy: number) => {
    if (!panelRef.current) return { x: 50, y: 50 };
    const r = panelRef.current.getBoundingClientRect();
    return {
      x: Math.min(100, Math.max(0, ((cx - r.left) / r.width) * 100)),
      y: Math.min(100, Math.max(0, ((cy - r.top)  / r.height) * 100)),
    };
  }, []);

  const down = (id: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    // في وضع الدمج: النقر يحدّد العنصر للدمج (لا يحرّكه)
    if (mergeMode) {
      const lyr = layers.find(l => l.id === id);
      if (lyr && (lyr.kind === "svg" || lyr.kind === "logo" || lyr.kind === "text")) { onToggleMerge(id); return; }
    }
    dragId.current = id;
    dragLive.current = false;
    const pt = "touches" in e ? e.touches[0] : e;
    dragStart.current = { x: pt.clientX, y: pt.clientY };
    onSelect(id);
  };

  // ── أداة قياس التفاصيل: نقرتان على الكانفاس → المسافة بالسنتيمتر ──
  const [measure, setMeasure] = useState<{ on: boolean; pts: { x: number; y: number }[] }>({ on: false, pts: [] });

  const startResize = (id: string, origSize: number, e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    if (!panelRef.current) return;
    const r = panelRef.current.getBoundingClientRect();
    const layer = layers.find(l => l.id === id);
    if (!layer) return;
    const cx = r.left + (layer.x / 100) * r.width;
    const cy = r.top  + (layer.y / 100) * r.height;
    const startDist = Math.hypot(e.clientX - cx, e.clientY - cy);
    resizeRef.current = { id, startX: e.clientX, startY: e.clientY, origSize, cx, cy };
    resizeRef.current = { ...resizeRef.current, origSize: startDist > 5 ? origSize : origSize };
    (resizeRef.current as any).startDist = startDist;
  };

  // ── مقابض المط: سحب منتصف الحافة يغيّر stretchX أو stretchY ──
  const stretchRef = useRef<{ id: string; axis: "x" | "y"; start: number; orig: number; center: number } | null>(null);
  const startStretch = (id: string, axis: "x" | "y", orig: number, e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    if (!panelRef.current) return;
    const layer = layers.find(l => l.id === id);
    if (!layer) return;
    const r = panelRef.current.getBoundingClientRect();
    const center = axis === "x" ? r.left + (layer.x / 100) * r.width : r.top + (layer.y / 100) * r.height;
    const start = Math.max(8, Math.abs((axis === "x" ? e.clientX : e.clientY) - center));
    stretchRef.current = { id, axis, start, orig, center };
  };

  const move = useCallback((e: React.MouseEvent) => {
    if (stretchRef.current) {
      const st = stretchRef.current;
      const cur = Math.max(8, Math.abs((st.axis === "x" ? e.clientX : e.clientY) - st.center));
      const v = Math.min(2, Math.max(0.5, st.orig * (cur / st.start)));
      onUpdate(st.id, st.axis === "x" ? { stretchX: v } : { stretchY: v });
      return;
    }
    if (resizeRef.current) {
      const r = resizeRef.current as any;
      const dist = Math.hypot(e.clientX - r.cx, e.clientY - r.cy);
      if (r.startDist > 2) {
        const newSize = Math.max(5, r.origSize * (dist / r.startDist));
        onResize(r.id, newSize);
      }
      return;
    }
    if (!dragId.current) return;
    // عتبة السحب: لا تبدأ الحركة حتى يتجاوز المؤشر 5px من نقطة الضغط
    if (!dragLive.current) {
      if (!dragStart.current) return;
      const dist = Math.hypot(e.clientX - dragStart.current.x, e.clientY - dragStart.current.y);
      if (dist < 5) return;
      dragLive.current = true;
    }
    const { x, y } = getPct(e.clientX, e.clientY);
    onMove(dragId.current, x, y);
  }, [getPct, onMove, onResize, onUpdate]);

  const touchMove = useCallback((e: React.TouchEvent) => {
    if (!dragId.current) return;
    e.preventDefault();
    const t = e.touches[0];
    if (!dragLive.current) {
      if (!dragStart.current) return;
      const dist = Math.hypot(t.clientX - dragStart.current.x, t.clientY - dragStart.current.y);
      if (dist < 5) return;
      dragLive.current = true;
    }
    const { x, y } = getPct(t.clientX, t.clientY);
    onMove(dragId.current, x, y);
  }, [getPct, onMove]);
  const up = () => { dragId.current = null; dragStart.current = null; dragLive.current = false; resizeRef.current = null; stretchRef.current = null; };

  const HANDLE = 10;
  const handles = (wPx: number, hPx: number, id: string, origSize: number) => [
    { pos: { top: -HANDLE/2, left: -HANDLE/2 } },
    { pos: { top: -HANDLE/2, right: -HANDLE/2 } },
    { pos: { bottom: -HANDLE/2, left: -HANDLE/2 } },
    { pos: { bottom: -HANDLE/2, right: -HANDLE/2 } },
  ].map((h, i) => (
    <div key={i} onMouseDown={e => startResize(id, origSize, e)}
      style={{ position: "absolute", width: HANDLE, height: HANDLE, borderRadius: 2,
        background: GOLD, border: "1.5px solid #F4EFE6", cursor: "nwse-resize",
        zIndex: 50, ...h.pos }} />
  ));

  const isLightbox = bg.add && bg.illuminated;
  // نرسم لون الخلفية المختار سواء كانت مُضافة للطلب أو موجودة لدى العميل (الموجودة لا تُحتسب بالسعر لكن لونها ينعكس)
  const bgPaint = bg.add || (!!bg.showColor && !!bg.colorHex);
  const matBase = bg.colorHex || (bg.material === "cementBoard" ? "#9b9890" : isLightbox ? "#e8f4ff" : "#c4c8cc");
  // وضع الجدار (بلا خلفية): خلفية محايدة فاتحة كجدار حقيقي لتظهر ألوان التصميم — بلا مربعات
  const WALL_BG = "#ECEAE4";
  const boardBg = bgPaint
    ? isLightbox
      ? `linear-gradient(160deg,${shade(matBase, 10)},${matBase},${shade(matBase, -15)})`
      : `linear-gradient(160deg,${matBase},${shade(matBase, -22)})`
    : WALL_BG;

  // لون هامش الأمان: أبيض على الخلفيات الداكنة (أزرق، أسود…)، أزرق غامق على الفاتحة
  const effBoardHex = bgPaint ? matBase : WALL_BG;
  const boardIsDark = night || (() => {
    try {
      const n = parseInt(effBoardHex.slice(1), 16);
      const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
      return 0.299 * r + 0.587 * g + 0.114 * b < 140; // luminance
    } catch { return false; }
  })();
  const safeColor   = boardIsDark ? "#FFFFFF" : "#0D47A1";
  const safeLabelBg = boardIsDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.65)";

  // لون المحاور: أحمر، ويتحول للأبيض إذا كانت الخلفية حمراء
  const boardIsRed = (() => {
    try {
      const n = parseInt(effBoardHex.slice(1), 16);
      const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
      return r > 110 && r > g * 1.6 && r > b * 1.6;
    } catch { return false; }
  })();
  const axisColor = boardIsRed ? "rgba(255,255,255,0.75)" : "rgba(229,28,28,0.75)";

  // نمط شارات الأبعاد (المسافات من حواف اللوحة)
  const dimStyle: React.CSSProperties = {
    position: "absolute", display: "flex", alignItems: "center", justifyContent: "center",
    gap: 4, background: "#2C1E15", border: `1.5px solid ${GOLD}`,
    borderRadius: 8, fontFamily: "Cairo,sans-serif", direction: "rtl",
    boxShadow: "0 3px 12px rgba(0,0,0,0.8)", zIndex: 60, padding: "4px 10px",
    fontSize: "0.75rem", whiteSpace: "nowrap",
  };
  const MIN_D = 5; // أقل مسافة من حواف اللوحة بالسنتيمتر
  const clampPct = (v: number) => Math.min(100, Math.max(0, v));

  const selLayer = layers.find(l => l.id === selectedId);

  return (
    <div style={{ position: "relative", paddingTop: 30, paddingInlineStart: 38 }}>
      <Ruler horizontal length={boardW} cm={area.w} offset={38} />
      <Ruler horizontal={false} length={boardH} cm={area.h} />
      <div ref={panelRef} onMouseMove={move} onMouseUp={up} onMouseLeave={up} onTouchMove={touchMove} onTouchEnd={up} onClick={() => onSelect("")}
        style={{ width: boardW, height: boardH, borderRadius: 0, position: "relative", overflow: "visible", userSelect: "none",
          background: night
            ? isLightbox
              ? `linear-gradient(160deg,${shade(matBase, -25)},${shade(matBase, -35)})`
              : bgPaint
                ? `linear-gradient(160deg,${shade(matBase, -50)},${shade(matBase, -64)})` // الخلفية المختارة ليلاً: تبقى بلونها معتمةً لتظهر عليها الإنارة بدل السواد
                : "#070707"
            : boardBg,
          border: bgPaint ? `1px solid ${shade(matBase, -30)}` : "2px solid rgba(201,162,75,0.2)",
          boxShadow: night
            ? isLightbox
              ? `0 0 60px ${bgGlow}88, 0 0 120px ${bgGlow}33, 0 14px 50px rgba(0,0,0,0.8)`
              : lit ? `0 0 90px ${glow}55, 0 14px 50px rgba(0,0,0,0.8)` : "0 14px 50px rgba(0,0,0,0.8)"
            : "0 14px 50px rgba(0,0,0,0.7)",
          transition: "box-shadow 0.4s, background 0.4s", cursor: dragId.current ? "grabbing" : "default" }}>

        {/* شبكة خفيفة في وضع الخلفية فقط؛ وضع الجدار يبقى نظيفاً لتظهر ألوان التصميم */}
        {!night && bg.add && <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.25, backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)", backgroundSize: "24px 24px" }} />}
        {/* الكنتور (الإطار حول الأحرف نفسها) يُرسم على كل عنصر مباشرةً — لا مستطيل حول اللوحة */}
        {night && isLightbox && <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse 90% 80% at 50% 50%, ${bgGlow}55 0%, ${bgGlow}22 50%, transparent 80%)` }} />}
        {night && isLightbox && <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `linear-gradient(180deg, ${bgGlow}08 0%, transparent 40%, ${bgGlow}08 100%)` }} />}
        {night && lit && !isLightbox && <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse 80% 70% at 50% 45%, ${glow}3a 0%, ${glow}14 45%, transparent 72%)` }} />}
        {/* ── شريط التموينات السفلي (بيانات الاتصال) ── */}
        {!!supStrip && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${supStrip}%`, background: SUPERMARKET_STRIP_COLOR, pointerEvents: "none", zIndex: 3 }} />}
        {/* ── إطار هامش الأمان 5 سم ── */}
        <div style={{
          position: "absolute",
          top: `${safeYPct}%`, bottom: supStrip ? `${supStrip}%` : `${safeYPct}%`,
          left: `${safeXPct}%`, right: `${safeXPct}%`,
          border: `2px dashed ${safeColor}`,
          borderRadius: 2,
          pointerEvents: "none",
          zIndex: 4,
        }}>
          <span style={{
            position: "absolute", top: -15, right: 0,
            fontSize: "0.5rem", color: safeColor, fontWeight: 700,
            fontFamily: "Cairo,sans-serif", whiteSpace: "nowrap",
            background: safeLabelBg, padding: "1px 5px", borderRadius: 3,
          }}>هامش أمان · 5 سم</span>
        </div>

        {guides && <>
          {/* تظهر المحاور فقط عند تحديد عنصر داخل الكانفاس */}
          {selLayer && <>
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, borderInlineStart: `1px dashed ${axisColor}`, pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, borderTop: `1px dashed ${axisColor}`, pointerEvents: "none" }} />
          </>}
        </>}

        {layers.map((l, li) => {
          const sel = l.id === selectedId;
          const picked = mergeSel.includes(l.id); // محدّد للدمج
          const outline = picked ? `3px solid #34c759` : sel ? `2px dashed ${GOLD}cc` : "2px dashed transparent";
          // شارة ترقيم موحدة لكل المحتويات — رقمها يطابق قائمة «العناصر الحالية»
          const numBadge = (
            <span style={{ position: "absolute", insetInlineEnd: "-0.5rem", top: "-0.6rem", width: 18, height: 18, borderRadius: "50%", background: G, color: "#2C1E15", fontSize: "0.62rem", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Cairo,sans-serif", pointerEvents: "none", zIndex: 5 }}>{li + 1}</span>
          );
          if (l.kind === "text") {
            const f = FONT_BY_ID[l.fontId] || FONT_BY_ID["cairo"];
            const fontPx = l.heightCm * scale;
            const sx = l.stretchX ?? 1;
            const sy = l.stretchY ?? 1;
            // لون النص يتبع لون خامة النصوص دائماً — الإضاءة لا تستبدل اللون بل تجعله يتوهّج بلونه
            const baseCol = faceCustomColor || (COL[faceColorId] || COL["silver"]).hex;
            const col = baseCol;
            // fontTick يُعيد الحساب بعد اكتمال تحميل الخطوط
            void fontTick;
            const tb = mounted ? measureTightBounds(l.text, f.family, fontPx) : { topOffset: 0, height: fontPx, widthPx: fontPx };
            // عرض التقدم (advance) بالبكسل — لحساب مركز الصندوق أفقياً
            const advPx = mounted ? measureTextCm(l.text || "أ", f.family, fontPx) : fontPx;
            // صندوق الحبر بعد المط (المط حول مركز الـ span)
            const fTop  = fontPx / 2 + (tb.topOffset - fontPx / 2) * sy;
            const fH    = tb.height * sy;
            const fW    = tb.widthPx * sx;
            const fLeft = advPx / 2 - fW / 2;
            const widthCm = fW / scale;
            const H = 10;
            return (
              <div key={l.id}
                onMouseDown={e => down(l.id, e)}
                onTouchStart={e => down(l.id, e)}
                onClick={e => e.stopPropagation()}
                style={{ position: "absolute", left: `${l.x}%`, top: `${l.y}%`,
                  transform: "translate(-50%,-50%)",
                  display: "inline-block",
                  outline: "none",
                  lineHeight: 1,
                  zIndex: sel ? 30 : 12 }}>
                {/* حدّ أسود خارجي رفيع خلف النص ليظهر الكنتور حتى لو طابق لونه الخلفية */}
                {contourOn && (
                  <span aria-hidden style={{
                    position: "absolute", top: 0, left: 0, display: "block",
                    fontFamily: `${f.family}, Tajawal, Cairo, sans-serif`, fontWeight: 900, fontSize: fontPx, lineHeight: 1, color: "transparent", whiteSpace: "nowrap",
                    direction: l.lang === "ar" ? "rtl" : "ltr",
                    transform: (sx !== 1 || sy !== 1) ? `scale(${sx}, ${sy})` : undefined,
                    transformOrigin: "center center",
                    WebkitTextStroke: `${2 * (fontPx * CONTOUR_RATIO + Math.max(1, fontPx * CONTOUR_RATIO * 0.3))}px #F4EFE6`,
                    paintOrder: "stroke", pointerEvents: "none", zIndex: -1,
                  }}>{/[؀-ۿ]/.test(l.text || "") ? (l.text || "النص").replace(/[0-9]/g, d => String.fromCharCode(d.charCodeAt(0) + 0x0630)) : (l.text || "النص")}</span>
                )}
                <span style={{
                  display: "block",
                  fontFamily: `${f.family}, Tajawal, Cairo, sans-serif`, fontWeight: 900, fontSize: fontPx, lineHeight: 1, color: col, whiteSpace: "nowrap",
                  direction: l.lang === "ar" ? "rtl" : "ltr",
                  transform: (sx !== 1 || sy !== 1) ? `scale(${sx}, ${sy})` : undefined,
                  transformOrigin: "center center",
                  // كنتور حول كل حرف بلون خامة الجوانب — سُمكه نسبة من حجم الخط (يظهر نصفه خارج الحرف)
                  WebkitTextStroke: contourOn ? `${2 * fontPx * CONTOUR_RATIO}px ${contourCol}` : undefined,
                  paintOrder: "stroke fill",
                  // التوهّج بلون الخامة نفسها (الأكريلك يضيء بلونه) مع لمسة من حرارة الإضاءة
                  textShadow: night && lit ? `0 0 ${fontPx * 0.5}px ${baseCol}, 0 0 ${fontPx * 0.22}px ${baseCol}, 0 0 ${fontPx * 0.12}px ${glow}` : (night ? "none" : "0 2px 8px rgba(0,0,0,0.6)"),
                  pointerEvents: "none" }}>
                  {/[؀-ۿ]/.test(l.text || "") ? (l.text || "النص").replace(/[0-9]/g, d => String.fromCharCode(d.charCodeAt(0) + 0x0630)) : (l.text || "النص")}
                </span>
                {sel && mounted && (() => {
                  // ── أبعاد المحتوى نفسه (عرض × ارتفاع صندوق الحبر بعد المط) ──
                  const natWcm  = tb.widthPx / scale;   // العرض الطبيعي قبل المط
                  const visWcm  = widthCm;              // العرض المرئي
                  const visHcm  = fH / scale;           // الارتفاع المرئي
                  // تعديل العرض = ضبط المط الأفقي فقط (الارتفاع لا يتأثر)
                  const setW = (w: number) => onUpdate(l.id, { stretchX: Math.min(2, Math.max(0.5, w / Math.max(1, natWcm))) });
                  // تعديل الارتفاع = ضبط ارتفاع الحرف مع تعويض المط الأفقي حتى يبقى العرض ثابتاً
                  const setH = (h: number) => {
                    const newHeightCm = Math.max(8, Math.min(150, Math.round(l.heightCm * h / Math.max(1, visHcm))));
                    const k = newHeightCm / l.heightCm; // معامل تغيّر الحجم الطبيعي
                    const newSx = Math.min(2, Math.max(0.5, sx / k));
                    onUpdate(l.id, { heightCm: newHeightCm, stretchX: newSx });
                  };

                  return <>
                    {/* ── إطار صندوق الحبر ── */}
                    <div style={{ position: "absolute", top: fTop, left: fLeft, width: fW, height: fH,
                      outline: `2px dashed ${GOLD}cc`, outlineOffset: 2, pointerEvents: "none", zIndex: 40 }} />

                    {/* ── شارة أبعاد المحتوى ── */}
                    <div style={{ ...dimStyle, top: fTop + fH + H + 8, left: "50%", transform: "translateX(-50%)", gap: 6 }}>
                      <DimInput label="عرض" value={Math.round(visWcm)} unit="سم" onChange={setW}
                        style={{ display: "flex", alignItems: "center" }} />
                      <span style={{ color: GOLD, fontWeight: 700, fontSize: "0.8rem" }}>×</span>
                      <DimInput label="ارتفاع" value={Math.round(visHcm)} unit="سم" onChange={setH}
                        style={{ display: "flex", alignItems: "center" }} />
                    </div>

                    {/* ── handles زوايا (تكبير/تصغير) ── */}
                    {[
                      { top: fTop - H/2,       left: fLeft - H/2 },
                      { top: fTop - H/2,       left: fLeft + fW - H/2 },
                      { top: fTop + fH - H/2,  left: fLeft - H/2 },
                      { top: fTop + fH - H/2,  left: fLeft + fW - H/2 },
                    ].map((pos, i) => (
                      <div key={i} onMouseDown={e => startResize(l.id, l.heightCm, e)}
                        style={{ position: "absolute", width: H, height: H, borderRadius: "50%", background: GOLD, border: "1.5px solid #F4EFE6", cursor: "nwse-resize", zIndex: 50, ...pos as React.CSSProperties }} />
                    ))}

                    {/* ── handles منتصف الحواف (مط أفقي/رأسي) — أشرطة ذهبية واضحة ── */}
                    {([
                      { axis: "x" as const, cursor: "ew-resize", pos: { top: fTop + fH/2 - H/2, left: fLeft + fW + 2 } },
                      { axis: "x" as const, cursor: "ew-resize", pos: { top: fTop + fH/2 - H/2, left: fLeft - H - 2 } },
                      { axis: "y" as const, cursor: "ns-resize", pos: { top: fTop - H - 2,      left: fLeft + fW/2 - H/2 } },
                      { axis: "y" as const, cursor: "ns-resize", pos: { top: fTop + fH + 2,     left: fLeft + fW/2 - H/2 } },
                    ]).map((h, i) => {
                      const isX = h.axis === "x";
                      return (
                      <div key={`st${i}`} onMouseDown={e => startStretch(l.id, h.axis, (h.axis === "x" ? sx : sy), e)}
                        title={isX ? "مط أفقي ↔" : "مط رأسي ↕"}
                        style={{ position: "absolute", display: "flex", alignItems: "center", justifyContent: "center",
                          width: isX ? Math.round(H*0.62) : Math.round(H*1.25), height: isX ? Math.round(H*1.25) : Math.round(H*0.62),
                          borderRadius: 4, background: GOLD, border: "2px solid #2C1E15", boxShadow: "0 1px 5px rgba(0,0,0,0.45)",
                          color: "#2C1E15", fontSize: "0.6rem", fontWeight: 900, lineHeight: 1, cursor: h.cursor, zIndex: 51, ...h.pos as React.CSSProperties }}>
                        {isX ? "↔" : "↕"}
                      </div>
                      );
                    })}
                  </>;
                })()}
                {/* شارة الترقيم للنص: مثبّتة على صندوق الحبر الفعلي (لا حافة الحاوية) حتى تبقى قرب الأحرف */}
                <span style={{ position: "absolute", top: fTop - 9, left: fLeft + fW - 9, width: 18, height: 18, borderRadius: "50%", background: G, color: "#2C1E15", fontSize: "0.62rem", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Cairo,sans-serif", pointerEvents: "none", zIndex: 45 }}>{li + 1}</span>
              </div>
            );
          }
          // ── شارة أبعاد المحتوى (عرض × ارتفاع) لصندوق متمركز (شعار / QR) ──
          const sizeBadge = (wCm: number, hCm: number, setW: (v: number) => void, setH: (v: number) => void) => (
            <div style={{ ...dimStyle, top: "100%", marginTop: 8, left: "50%", transform: "translateX(-50%)", gap: 6 }}>
              <DimInput label="عرض" value={Math.round(wCm)} unit="سم" onChange={setW} style={{ display: "flex", alignItems: "center" }} />
              <span style={{ color: GOLD, fontWeight: 700, fontSize: "0.8rem" }}>×</span>
              <DimInput label="ارتفاع" value={Math.round(hCm)} unit="سم" onChange={setH} style={{ display: "flex", alignItems: "center" }} />
            </div>
          );
          if (l.kind === "logo") {
            const sx = l.stretchX ?? 1, sy = l.stretchY ?? 1;
            const wPx = l.widthCm * scale;
            return (
              <div key={l.id}
                onMouseDown={e => down(l.id, e)}
                onTouchStart={e => down(l.id, e)}
                onClick={e => e.stopPropagation()}
                style={{ position: "absolute", left: `${l.x}%`, top: `${l.y}%`, transform: "translate(-50%,-50%)", width: wPx, cursor: "grab", outline, outlineOffset: 5, borderRadius: 4, zIndex: sel ? 30 : 12, filter: night && lit ? `drop-shadow(0 0 ${wPx * 0.08}px ${glow})` : "none" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.src} alt="logo" style={{ width: "100%", height: "auto", display: "block", objectFit: "contain", pointerEvents: "none", transform: (sx !== 1 || sy !== 1) ? `scale(${sx},${sy})` : undefined, transformOrigin: "center" }} />
                {sel && mounted && sizeBadge(l.widthCm, l.widthCm * 0.7,
                  w => onUpdate(l.id, { widthCm: Math.max(10, Math.min(150, w)) }),
                  h => onUpdate(l.id, { widthCm: Math.max(10, Math.min(150, Math.round(h / 0.7))) }))}
                {sel && handles(wPx, wPx * 0.7, l.id, l.widthCm)}
                {numBadge}
              </div>
            );
          }
          if (l.kind === "svg") {
            const sx = l.stretchX ?? 1, sy = l.stretchY ?? 1;
            const wPx = l.widthCm * scale * sx;
            const hPx = l.widthCm * scale * l.aspect * sy;
            // افتراضياً يتبع التصميم لون/خامة التشطيب (كالحروف)؛ أو يبقى بألوانه الأصلية
            // مجموعة الخامة: النص (aspect<=0.5) يتبع لون النصوص، اللوجو يتبع لون المحتويات
            const isTxt = l.aspect <= 0.5;
            const grpColorId = isTxt ? faceColorId : (contentColorId || faceColorId);
            const grpCustom = isTxt ? faceCustomColor : contentCustomColor;
            // اللون يبقى لون الخامة دائماً؛ الإضاءة تضيف توهّجاً بلون الخامة لا تستبدله
            const baseFinish = l.colorId ? (COL[l.colorId] || COL["silver"]).hex : (grpCustom || (COL[grpColorId] || COL["silver"]).hex);
            const svgFinish = baseFinish;
            const litGlowCol = l.originalColors ? glow : baseFinish; // تصميم بألوانه الأصلية → هالة دافئة؛ بلون الخامة → يتوهّج بلونه
            return (
              <div key={l.id}
                onMouseDown={e => down(l.id, e)}
                onTouchStart={e => down(l.id, e)}
                onClick={e => e.stopPropagation()}
                style={{ position: "absolute", left: `${l.x}%`, top: `${l.y}%`, transform: "translate(-50%,-50%)", width: wPx, cursor: "grab", outline, outlineOffset: 5, borderRadius: 4, zIndex: sel ? 30 : 12, filter: night && lit ? `drop-shadow(0 0 ${wPx * 0.06}px ${litGlowCol})` : "none" }}>
                {/* كنتور النص المحوّل لمسارات: سُمكه محصور بنصف أصغر فجوة بين الحروف (لا تداخل) — حدّ أسود خارجي + كنتور بلون الجوانب */}
                {contourOn && isTxt && (() => {
                  const gapRatio = getGapRatio(l.src);
                  // أقصى امتداد للكنتور = أصغر من (النسبة المطلوبة) و(٤٢٪ من الفجوة) حتى لا تتلامس كنتورات الحروف
                  const maxExtent = Math.min(hPx * CONTOUR_RATIO, hPx * gapRatio * 0.42);
                  if (maxExtent < 0.5) return null;
                  const edge = Math.max(0.6, maxExtent * 0.3); // الحدّ الأسود الخارجي
                  const oCol = Math.max(0, maxExtent - edge);   // إزاحة الكنتور الملوّن (أصغر فيظهر الأسود حوله)
                  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]] as const;
                  const maskStyle: React.CSSProperties = { position: "absolute", top: 0, left: 0, width: "100%", height: hPx, pointerEvents: "none",
                    WebkitMaskImage: `url("${l.src}")`, maskImage: `url("${l.src}")`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center" };
                  return <>
                    {dirs.map(([dx, dy], i) => <div key={`ce${i}`} style={{ ...maskStyle, background: "#F4EFE6", transform: `translate(${(dx * maxExtent).toFixed(1)}px, ${(dy * maxExtent).toFixed(1)}px)`, zIndex: -2 }} />)}
                    {dirs.map(([dx, dy], i) => <div key={`cc${i}`} style={{ ...maskStyle, background: contourCol, transform: `translate(${(dx * oCol).toFixed(1)}px, ${(dy * oCol).toFixed(1)}px)`, zIndex: -1 }} />)}
                  </>;
                })()}
                {l.originalColors ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.src} alt={l.name} style={{ width: "100%", height: hPx, display: "block", objectFit: "fill", pointerEvents: "none" }} />
                ) : (
                  // التصميم بلون التشطيب: قناع (mask) يملأ شكل المسارات بلون الخامة
                  <div style={{ width: "100%", height: hPx, background: svgFinish, pointerEvents: "none",
                    WebkitMaskImage: `url("${l.src}")`, maskImage: `url("${l.src}")`,
                    WebkitMaskSize: "100% 100%", maskSize: "100% 100%",
                    WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center", maskPosition: "center" }} />
                )}
                {sel && mounted && sizeBadge(l.widthCm, l.widthCm * l.aspect,
                  w => onUpdate(l.id, { widthCm: Math.max(10, Math.min(300, w)) }),
                  h => onUpdate(l.id, { widthCm: Math.max(10, Math.min(300, Math.round(h / Math.max(0.05, l.aspect)))) }))}
                {sel && handles(wPx, hPx, l.id, l.widthCm)}
                {numBadge}
              </div>
            );
          }
          if (l.kind === "qr") {
            const sPx = l.sizeCm * scale;
            return (
              <div key={l.id}
                onMouseDown={e => down(l.id, e)}
                onTouchStart={e => down(l.id, e)}
                onClick={e => e.stopPropagation()}
                style={{ position: "absolute", left: `${l.x}%`, top: `${l.y}%`, transform: "translate(-50%,-50%)", width: sPx, height: sPx, cursor: "grab", outline, outlineOffset: 5, borderRadius: 4, background: "#fff", padding: sPx * 0.08, boxSizing: "border-box", zIndex: sel ? 30 : 12 }}>
                <RealQR value={l.value} />
                {sel && mounted && sizeBadge(l.sizeCm, l.sizeCm,
                  w => onUpdate(l.id, { sizeCm: Math.max(8, Math.min(60, w)) }),
                  h => onUpdate(l.id, { sizeCm: Math.max(8, Math.min(60, h)) }))}
                {sel && handles(sPx, sPx, l.id, l.sizeCm)}
                {numBadge}
              </div>
            );
          }
          if (l.kind === "shape") {
            const sx  = l.stretchX ?? 1;
            const sy  = l.stretchY ?? 1;
            const wPx = l.widthCm  * scale * sx;
            const hPx = l.heightCm * scale * sy;
            const rot = l.rotation ?? 0;
            const shapeStyle: React.CSSProperties = {
              width: wPx, height: hPx, background: l.colorHex, pointerEvents: "none",
              ...(l.shapeType === "circle"   ? { borderRadius: "50%" } : {}),
              ...(l.shapeType === "line"     ? { borderRadius: 4, height: Math.max(hPx, 3) } : {}),
              ...(l.shapeType === "triangle" ? {
                width: 0, height: 0, background: "transparent",
                borderLeft:   `${wPx / 2}px solid transparent`,
                borderRight:  `${wPx / 2}px solid transparent`,
                borderBottom: `${hPx}px solid ${l.colorHex}`,
              } : {}),
            };
            return (
              <div key={l.id}
                onMouseDown={e => down(l.id, e)}
                onTouchStart={e => down(l.id, e)}
                onClick={e => e.stopPropagation()}
                style={{
                  position: "absolute", left: `${l.x}%`, top: `${l.y}%`,
                  transform: `translate(-50%,-50%)${rot ? ` rotate(${rot}deg)` : ""}`,
                  cursor: "grab", outline, outlineOffset: 4,
                  zIndex: sel ? 30 : 5,
                  width: wPx, height: l.shapeType === "triangle" ? 0 : hPx,
                }}>
                <div style={shapeStyle} />
                {sel && mounted && sizeBadge(l.widthCm * sx, l.heightCm * sy,
                  w => onUpdate(l.id, { widthCm: Math.max(2, Math.min(300, Math.round(w / sx))) }),
                  h => onUpdate(l.id, { heightCm: Math.max(0.5, Math.min(200, Math.round(h / sy))) }))}
                {sel && handles(wPx, hPx, l.id, l.widthCm)}
                {numBadge}
              </div>
            );
          }
          return null;
        })}

        {dragId.current && selLayer && <>
          <div style={{ position: "absolute", top: `${selLayer.y}%`, left: 0, right: 0, height: 1, background: axisColor, opacity: 0.45, pointerEvents: "none" }} />
          <div style={{ position: "absolute", left: `${selLayer.x}%`, top: 0, bottom: 0, width: 1, background: axisColor, opacity: 0.45, pointerEvents: "none" }} />
        </>}

        {/* ── شريط الموضع تحت العنصر المحدد ── */}
        {layers.length === 0 && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: night ? "#333" : "#888", fontSize: "0.8rem", pointerEvents: "none" }}>أضف نصاً أو شعاراً أو QR من خطوة المحتوى</div>}


        {/* أداة قياس التفاصيل — زرّها انتقل إلى شريط الأدوات أسفل الموضع */}
        {measure.on && (
          <div onClick={e => {
              e.stopPropagation();
              const { x, y } = getPct(e.clientX, e.clientY);
              setMeasure(m => ({ on: true, pts: m.pts.length >= 2 ? [{ x, y }] : [...m.pts, { x, y }] }));
            }}
            style={{ position: "absolute", inset: 0, zIndex: 90, cursor: "crosshair" }}>
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              {measure.pts.length === 2 && (
                <line x1={`${measure.pts[0].x}%`} y1={`${measure.pts[0].y}%`} x2={`${measure.pts[1].x}%`} y2={`${measure.pts[1].y}%`}
                  stroke="#E51C1C" strokeWidth="2" strokeDasharray="6 3" />
              )}
              {measure.pts.map((p, i) => (
                <circle key={i} cx={`${p.x}%`} cy={`${p.y}%`} r="4" fill="#E51C1C" stroke="#fff" strokeWidth="1.5" />
              ))}
            </svg>
            {measure.pts.length === 0 && (
              <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.7)", color: "#eee", borderRadius: 6, padding: "2px 10px", fontSize: "0.62rem", fontFamily: "Cairo,sans-serif", whiteSpace: "nowrap", pointerEvents: "none" }}>
                انقر على نقطتين لقياس المسافة بينهما
              </div>
            )}
            {measure.pts.length === 2 && (() => {
              const dxCm = (measure.pts[1].x - measure.pts[0].x) / 100 * area.w;
              const dyCm = (measure.pts[1].y - measure.pts[0].y) / 100 * area.h;
              const d = Math.hypot(dxCm, dyCm);
              const mx = (measure.pts[0].x + measure.pts[1].x) / 2;
              const my = (measure.pts[0].y + measure.pts[1].y) / 2;
              return (
                <div style={{ position: "absolute", left: `${mx}%`, top: `${my}%`, transform: "translate(-50%,-140%)", background: "#C0001A", border: "2px solid #FF6B6B", color: "#FFFFFF", borderRadius: 8, padding: "4px 12px", fontSize: "0.82rem", fontWeight: 900, fontFamily: "Cairo,sans-serif", whiteSpace: "nowrap", pointerEvents: "none", zIndex: 96, boxShadow: "0 2px 10px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.15)", letterSpacing: "0.03em" }}>
                  {d.toFixed(1)} سم
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Lightbox inner glow ── */}
        {isLightbox && !night && (
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(200,240,255,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
        )}
      </div>

      {/* ── شريط الموضع تحت الكانفاس — ثابت دائماً، يُعطَّل عند عدم تحديد عنصر ── */}
      <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", flexWrap: "wrap", opacity: selLayer ? 1 : 0.45 }}>
        <span style={{ fontSize: "0.62rem", color: "#ccc", fontFamily: "Cairo,sans-serif", marginInlineEnd: "0.2rem" }}>موضع:</span>
        {/* null = الإبقاء على الإحداثية الحالية (كل زر يغيّر محوره فقط) */}
        {([["توسيط أفقي",50,null],["توسيط رأسي",null,50],["يمين",82,null],["يسار",18,null],["أعلى",null,20],["أسفل",null,80]] as [string,number|null,number|null][]).map(([label,x,y]) => (
          <button key={label} disabled={!selLayer} title={selLayer ? label : "حدّد عنصراً أولاً"}
            onClick={() => { if (selLayer) onMove(selLayer.id, x ?? selLayer.x, y ?? selLayer.y); }}
            style={{ padding: "0.2rem 0.6rem", borderRadius: 999, fontSize: "0.62rem", fontWeight: 700, fontFamily: "Cairo,sans-serif", border: `1px solid rgba(201,162,75,0.3)`, background: "rgba(201,162,75,0.07)", color: GOLD, cursor: selLayer ? "pointer" : "not-allowed" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── شريط أدوات التصميم: قياس · فصل · دمج (واضح قرب التصميم) ── */}
      {(() => {
        const selIsImg = !!selLayer && (selLayer.kind === "svg" || selLayer.kind === "logo" || selLayer.kind === "text");
        const Tool = ({ icon, label, sub, active, disabled, color, onClick }: { icon: string; label: string; sub?: string; active?: boolean; disabled?: boolean; color: string; onClick: () => void }) => (
          <button onClick={onClick} disabled={disabled} title={sub || label}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, minWidth: 78, padding: "0.4rem 0.7rem", borderRadius: 12, cursor: disabled ? "not-allowed" : "pointer",
              fontFamily: "Cairo,sans-serif", transition: "all 0.2s", opacity: disabled ? 0.4 : 1,
              border: `1px solid ${active ? GOLD : "rgba(201,162,75,0.3)"}`,
              background: active ? "rgba(201,162,75,0.18)" : "rgba(201,162,75,0.07)", color: GOLD }}>
            <span style={{ fontSize: "1.05rem", lineHeight: 1 }}>{icon}</span>
            <span style={{ fontSize: "0.66rem", fontWeight: 800 }}>{label}</span>
            {sub && <span style={{ fontSize: "0.55rem", color: "rgba(201,162,75,0.7)" }}>{sub}</span>}
          </button>
        );
        return (
          <div style={{ marginTop: "0.6rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ display: "flex", alignItems: "stretch", justifyContent: "center", gap: "0.5rem", padding: "0.4rem 0.6rem", borderRadius: 14, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Tool icon="📏" label="قياس" sub="مسافة بالسم" active={measure.on} color={GOLD}
                onClick={() => { setMeasure(m => ({ on: !m.on, pts: [] })); if (mergeMode) onSetMergeMode(false); }} />
              <Tool icon="✂" label="فصل" sub="عنصر → أجزاء" disabled={!selIsImg} color={GOLD}
                onClick={() => { if (selLayer) onSplit(selLayer.id); }} />
              <Tool icon="⛓" label="دمج" sub={mergeMode ? `محدد: ${mergeSel.length}` : "عنصرين فأكثر"} active={mergeMode} color={GOLD}
                onClick={() => { onSetMergeMode(!mergeMode); if (!mergeMode && measure.on) setMeasure({ on: false, pts: [] }); }} />
            </div>
            {mergeMode && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.66rem", color: GOLD, fontFamily: "Cairo,sans-serif", fontWeight: 700 }}>
                  انقر العناصر لتحديدها للدمج {mergeSel.length > 0 ? `(${mergeSel.length})` : ""}
                </span>
                <button onClick={onMerge} disabled={mergeSel.length < 2}
                  style={{ padding: "0.3rem 0.9rem", borderRadius: 999, cursor: mergeSel.length < 2 ? "not-allowed" : "pointer", opacity: mergeSel.length < 2 ? 0.4 : 1,
                    background: GOLD, color: "#2C1E15", border: "none", fontWeight: 800, fontSize: "0.7rem", fontFamily: "Cairo,sans-serif" }}>
                  ⛓ تنفيذ الدمج
                </button>
                <button onClick={() => onSetMergeMode(false)}
                  style={{ padding: "0.3rem 0.7rem", borderRadius: 999, cursor: "pointer", background: "transparent", color: "#aaa", border: "1px solid rgba(255,255,255,0.15)", fontWeight: 700, fontSize: "0.66rem", fontFamily: "Cairo,sans-serif" }}>
                  إلغاء
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {bg.add && (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.68rem", color: "#2C1E15" }}>
            خلفية {RATES.background[bg.material]?.label}
            {isLightbox ? "" : ""} · <span style={{ color: GOLD }}>{bg.widthCm}×{bg.heightCm} سم</span> · عمق {bg.depthCm} سم
          </span>
          {isLightbox && <span style={{ padding: "0.12rem 0.5rem", borderRadius: 999, background: "rgba(0,120,200,0.15)", border: "1px solid rgba(120,200,255,0.25)", fontSize: "0.6rem", color: "#90d4ff" }}>💡 مضيئة</span>}
        </div>
      )}
    </div>
  );
}

// ─── Position buttons ─────────────────────────────────────────────────────────
function PosBtns({ onSet }: { onSet: (x: number, y: number) => void }) {
  const tag: React.CSSProperties = { padding: "0.2rem 0.55rem", borderRadius: 999, fontSize: "0.62rem", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#ccc", cursor: "pointer", fontFamily: "Cairo,sans-serif" };
  return (
    <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "0.5rem", alignItems: "center" }}>
      <span style={{ fontSize: "0.62rem", color: "#bbb" }}>موضع:</span>
      {[["وسط",50,50],["يمين",80,50],["يسار",20,50],["أعلى",50,22],["أسفل",50,78]].map(([l,x,y]) =>
        <button key={l as string} style={tag} onClick={() => onSet(x as number, y as number)}>{l}</button>
      )}
    </div>
  );
}

// ─── Font Picker ──────────────────────────────────────────────────────────────
function FontPicker({ lang, value, onChange, enabledIds }: { lang: string; value: string; onChange: (v: string) => void; enabledIds?: string[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const all = lang === "ar" ? FONTS_AR : FONTS_EN;
  const filtered = enabledIds ? all.filter(f => enabledIds.includes(f.id)) : all;
  const list = filtered.length ? filtered : all;
  const cur = FONT_BY_ID[value] || list[0];
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", borderRadius: 9, background: "#FDFBF7", border: `1.5px solid ${open ? GOLD : "rgba(255,255,255,0.1)"}`, color: "#eee", cursor: "pointer" }}>
        <span style={{ fontFamily: `${cur.family}, Tajawal, Cairo, sans-serif`, fontWeight: 800, fontSize: "1rem" }}>{cur.label}</span>
        <span style={{ color: "#ccc", fontSize: "0.8rem" }}>▾</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, right: 0, maxHeight: 220, overflowY: "auto", background: "rgba(15,15,15,0.99)", border: `1px solid ${GOLD}33`, borderRadius: 10, boxShadow: "0 20px 40px rgba(0,0,0,0.6)", zIndex: 200, padding: 4 }}>
          {list.map(f => {
            const on = f.id === value;
            return <button key={f.id} onClick={() => { onChange(f.id); setOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.7rem", borderRadius: 7, background: on ? "rgba(201,162,75,0.1)" : "transparent", border: "none", cursor: "pointer", color: on ? GOLD : "#ccc" }}>
              <span style={{ fontFamily: `${f.family}, Tajawal, Cairo, sans-serif`, fontWeight: 800, fontSize: "1.15rem" }}>{lang === "ar" ? "أبجد هوز" : "Abcde"}</span>
              <span style={{ fontSize: "0.62rem", color: "#ccc" }}>{f.label}</span>
            </button>;
          })}
        </div>
      )}
    </div>
  );
}

// ─── Stretch Controls (مط أفقي/رأسي) — مشترك للنص والشعار والتصميم المرفوع ──────
function StretchControls({ l, onUpdate }: { l: Layer; onUpdate: (id: string, p: Partial<Layer>) => void }) {
  const sx = Math.round(((l as { stretchX?: number }).stretchX ?? 1) * 100);
  const sy = Math.round(((l as { stretchY?: number }).stretchY ?? 1) * 100);
  return (
    <>
      <div style={{ marginTop: "0.6rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", color: "#ccc", marginBottom: "0.25rem" }}>
          <span>مط أفقي ↔</span><span style={{ color: GOLD, fontWeight: 700 }}>{sx}%</span>
        </div>
        <input type="range" min={50} max={200} step={5} value={sx}
          onChange={e => onUpdate(l.id, { stretchX: Number(e.target.value) / 100 })} style={{ width: "100%", accentColor: GOLD }} />
      </div>
      <div style={{ marginTop: "0.45rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", color: "#ccc", marginBottom: "0.25rem" }}>
          <span>مط رأسي ↕</span><span style={{ color: GOLD, fontWeight: 700 }}>{sy}%</span>
        </div>
        <input type="range" min={50} max={200} step={5} value={sy}
          onChange={e => onUpdate(l.id, { stretchY: Number(e.target.value) / 100 })} style={{ width: "100%", accentColor: GOLD }} />
      </div>
      {(sx !== 100 || sy !== 100) && (
        <button onClick={() => onUpdate(l.id, { stretchX: 1, stretchY: 1 })}
          style={{ marginTop: "0.4rem", padding: "0.25rem 0.6rem", borderRadius: 8, fontSize: "0.62rem", fontWeight: 700, fontFamily: "Cairo,sans-serif", border: `1px solid ${GOLD}55`, background: "rgba(201,162,75,0.08)", color: GOLD, cursor: "pointer" }}>
          إعادة المط للوضع الطبيعي
        </button>
      )}
    </>
  );
}

// ─── Layer Row ────────────────────────────────────────────────────────────────
function LayerRow({ l, num, textNum, sel, faceColors, faceColorHex, enabledFontIds, onSelect, onUpdate, onDelete, inMerge, mergeMode, onToggleMerge }: { l: Layer; num: number; textNum: number; sel: boolean; faceColors: string[]; faceColorHex: string; enabledFontIds?: string[]; onSelect: (id: string) => void; onUpdate: (id: string, p: Partial<Layer>) => void; onDelete: (id: string) => void; inMerge: boolean; mergeMode: boolean; onToggleMerge: (id: string) => void }) {
  const shapeIcons: Record<string, string> = { rect: "■", circle: "●", line: "━", triangle: "▲" };
  const icon = l.kind === "text" ? "T" : l.kind === "logo" ? "🖼" : l.kind === "svg" ? "📐" : l.kind === "shape" ? (shapeIcons[l.shapeType] ?? "◆") : "QR";
  // تمييز النص عن الشعار بالنسبة: الأسطر النصية عريضة وقصيرة (aspect ≤ 0.5)، الشعار أطول
  const svgIsLogo = l.kind === "svg" && l.aspect > 0.5;
  const shapeNames: Record<string, string> = { rect: "مستطيل", circle: "دائرة", line: "خط", triangle: "مثلث" };
  const title = l.kind === "text" ? (l.text || "نص فارغ")
    : l.kind === "logo" ? "شعار"
    : l.kind === "svg" ? (svgIsLogo ? "شعار" : (l.text?.trim() || `نص ${textNum}`))
    : l.kind === "shape" ? (shapeNames[l.shapeType] ?? "شكل")
    : "QR Code";
  const isImg = l.kind === "svg" || l.kind === "logo" || l.kind === "text"; // النص والصور تقبل الدمج
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: `1.5px solid ${inMerge ? GOLD : sel ? GOLD + "55" : "rgba(255,255,255,0.06)"}`, background: sel ? "rgba(201,162,75,0.05)" : "#FDFBF7" }}>
      {/* Always select — never toggle close when clicking already-selected layer */}
      <div onClick={() => mergeMode && isImg ? onToggleMerge(l.id) : onSelect(l.id)} style={{ display: "flex", alignItems: "center", gap: "0.45rem", padding: "0.6rem 0.7rem", cursor: sel ? "default" : "pointer" }}>
        {/* مربع تحديد للدمج يظهر فقط في وضع الدمج */}
        {mergeMode && isImg && <input type="checkbox" checked={inMerge} onClick={e => e.stopPropagation()} onChange={() => onToggleMerge(l.id)} title="حدّد للدمج" style={{ accentColor: GOLD, width: 14, height: 14, cursor: "pointer", flexShrink: 0 }} />}
        <span style={{ width: 18, height: 18, borderRadius: "50%", background: GOLD, color: "#2C1E15", fontSize: "0.62rem", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{num}</span>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: sel ? "rgba(201,162,75,0.18)" : "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", color: sel ? GOLD : "#888", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0 }}>{icon}</div>
        <span style={{ flex: 1, fontSize: "0.78rem", color: sel ? "#eee" : "#999", fontWeight: sel ? 700 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
        {l.kind === "text" && <span style={{ fontSize: "0.62rem", color: "#ccc" }}>{l.heightCm}سم</span>}
        <button onClick={e => { e.stopPropagation(); onDelete(l.id); }} style={{ width: 22, height: 22, border: "none", background: "transparent", color: "#f87171", cursor: "pointer" }}>✕</button>
      </div>
      {sel && (
        <div style={{ padding: "0 0.8rem 0.85rem", borderTop: "1px solid rgba(255,255,255,0.04)" }} onClick={e => e.stopPropagation()}>
          {l.kind === "text" && <>
            <textarea value={l.text} onChange={e => onUpdate(l.id, { text: e.target.value })} rows={2} placeholder="أدخل النص" dir="auto"
              style={{ width: "100%", padding: "0.55rem 0.7rem", marginTop: "0.6rem", borderRadius: 8, resize: "none", background: "#F4EFE6", border: "1.5px solid rgba(255,255,255,0.09)", color: "#2C1E15", fontSize: "0.9rem", fontFamily: "Cairo,sans-serif", outline: "none", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: "0.4rem", margin: "0.55rem 0" }}>
              {([["ar","عربي"],["en","English"]] as [string,string][]).map(([lv, ll]) => { const on = l.lang === lv; return <button key={lv} onClick={() => onUpdate(l.id, { lang: lv, fontId: (lv === "ar" ? FONTS_AR : FONTS_EN)[0].id })} style={{ flex: 1, padding: "0.35rem", borderRadius: 8, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", fontFamily: "Cairo,sans-serif", border: `1.5px solid ${on ? GOLD : "rgba(255,255,255,0.08)"}`, background: on ? "rgba(201,162,75,0.1)" : "#2C1E15", color: on ? GOLD : "#999" }}>{ll}</button>; })}
            </div>
            <div style={{ fontSize: "0.66rem", color: "#ccc", marginBottom: "0.3rem" }}>الخط</div>
            <FontPicker lang={l.lang} value={l.fontId} onChange={v => onUpdate(l.id, { fontId: v })} enabledIds={enabledFontIds} />
            <div style={{ marginTop: "0.6rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", color: "#ccc", marginBottom: "0.25rem" }}><span>ارتفاع الحرف</span><span style={{ color: GOLD, fontWeight: 700 }}>{l.heightCm} سم</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <button onClick={() => onUpdate(l.id, { heightCm: Math.max(8, l.heightCm - 2) })} style={stepBtn}>−</button>
                <input type="range" min={8} max={150} value={l.heightCm} onChange={e => onUpdate(l.id, { heightCm: Number(e.target.value) })} style={{ flex: 1, accentColor: GOLD }} />
                <button onClick={() => onUpdate(l.id, { heightCm: Math.min(150, l.heightCm + 2) })} style={stepBtn}>+</button>
              </div>
            </div>
            <div style={{ marginTop: "0.6rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", color: "#ccc", marginBottom: "0.25rem" }}>
                <span>مط أفقي</span>
                <span style={{ color: GOLD, fontWeight: 700 }}>{Math.round((l.stretchX ?? 1) * 100)}%</span>
              </div>
              <input type="range" min={50} max={200} step={5} value={Math.round((l.stretchX ?? 1) * 100)}
                onChange={e => onUpdate(l.id, { stretchX: Number(e.target.value) / 100 })} style={{ width: "100%", accentColor: GOLD }} />
            </div>
            <div style={{ marginTop: "0.45rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", color: "#ccc", marginBottom: "0.25rem" }}>
                <span>مط رأسي</span>
                <span style={{ color: GOLD, fontWeight: 700 }}>{Math.round((l.stretchY ?? 1) * 100)}%</span>
              </div>
              <input type="range" min={50} max={200} step={5} value={Math.round((l.stretchY ?? 1) * 100)}
                onChange={e => onUpdate(l.id, { stretchY: Number(e.target.value) / 100 })} style={{ width: "100%", accentColor: GOLD }} />
            </div>
            {((l.stretchX ?? 1) !== 1 || (l.stretchY ?? 1) !== 1) && (
              <button onClick={() => onUpdate(l.id, { stretchX: 1, stretchY: 1 })}
                style={{ marginTop: "0.4rem", padding: "0.25rem 0.6rem", borderRadius: 8, fontSize: "0.62rem", fontWeight: 700, fontFamily: "Cairo,sans-serif", border: "1px solid rgba(255,255,255,0.12)", background: "#F4EFE6", color: "#bbb", cursor: "pointer" }}>
                إعادة المط للوضع الطبيعي
              </button>
            )}
            <div style={{ marginTop: "0.6rem", fontSize: "0.6rem", color: "#888", display: "flex", alignItems: "center", gap: 6 }}>
              لون النص يتبع لون الخامة المختارة
              <span title="لون الخامة الحالي" style={{ width: 13, height: 13, borderRadius: 4, background: faceColorHex, border: "1px solid rgba(255,255,255,0.3)", display: "inline-block", flexShrink: 0 }} />
            </div>
          </>}
          {l.kind === "logo" && <>
            <div style={{ display: "flex", gap: "0.7rem", alignItems: "center", marginTop: "0.6rem" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.src} alt="logo" style={{ width: 54, height: 54, objectFit: "contain", borderRadius: 6, background: "#F4EFE6", border: "1px solid rgba(255,255,255,0.08)" }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", color: "#ccc", marginBottom: "0.25rem" }}><span>العرض</span><span style={{ color: GOLD, fontWeight: 700 }}>{l.widthCm} سم</span></div>
                <input type="range" min={10} max={150} value={l.widthCm} onChange={e => onUpdate(l.id, { widthCm: Number(e.target.value) })} style={{ width: "100%", accentColor: GOLD }} />
              </div>
            </div>
            <StretchControls l={l} onUpdate={onUpdate} />
          </>}
          {l.kind === "svg" && <>
            {/* النص المكتوب في هذا العنصر — يساعد العميل على طلب تعديل النص ويعرفه الفريق */}
            {!svgIsLogo && (
              <div style={{ marginTop: "0.6rem" }}>
                <div style={{ fontSize: "0.66rem", color: "#ccc", marginBottom: "0.25rem" }}>النص المكتوب (للتوصيف — لا يغيّر التصميم)</div>
                <input value={l.text ?? `نص ${textNum}`} onChange={e => onUpdate(l.id, { text: e.target.value })} dir="auto"
                  style={{ width: "100%", padding: "0.5rem 0.7rem", borderRadius: 8, background: "#F4EFE6", border: "1.5px solid rgba(201,162,75,0.3)", color: "#2C1E15", fontSize: "0.85rem", fontFamily: "Cairo,sans-serif", outline: "none", boxSizing: "border-box" }} />
                <div style={{ fontSize: "0.58rem", color: "#888", marginTop: "0.2rem" }}>التصميم يُنفَّذ كما رُفع تماماً؛ اكتب أي ملاحظة أو تعديل للفريق</div>
              </div>
            )}
            <div style={{ display: "flex", gap: "0.7rem", alignItems: "center", marginTop: "0.6rem" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.src} alt={l.name} style={{ width: 54, height: 54, objectFit: "contain", borderRadius: 6, background: "#F4EFE6", border: "1px solid rgba(255,255,255,0.08)" }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", color: "#ccc", marginBottom: "0.25rem" }}><span>العرض</span><span style={{ color: GOLD, fontWeight: 700 }}>{Math.round(l.widthCm)} سم</span></div>
                <input type="range" min={10} max={300} value={Math.round(l.widthCm)} onChange={e => onUpdate(l.id, { widthCm: Number(e.target.value) })} style={{ width: "100%", accentColor: GOLD }} />
                <div style={{ fontSize: "0.6rem", color: "#888", marginTop: "0.2rem" }}>الارتفاع: {Math.round(l.widthCm * l.aspect)} سم · يُسعَّر من مسارات القص تلقائياً</div>
              </div>
            </div>
            <StretchControls l={l} onUpdate={onUpdate} />
            {/* اللون/الخامة: يتبع التشطيب (كالحروف) أو يبقى بألوانه الأصلية */}
            <div style={{ marginTop: "0.6rem" }}>
              <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.45rem" }}>
                <button onClick={() => onUpdate(l.id, { originalColors: false })}
                  style={{ flex: 1, padding: "0.4rem", borderRadius: 8, fontSize: "0.68rem", fontWeight: 700, cursor: "pointer", fontFamily: "Cairo,sans-serif",
                    border: `1.5px solid ${!l.originalColors ? GOLD : "rgba(255,255,255,0.1)"}`, background: !l.originalColors ? "rgba(201,162,75,0.12)" : "#2C1E15", color: !l.originalColors ? GOLD : "#999" }}>لون الخامة</button>
                <button onClick={() => onUpdate(l.id, { originalColors: true })}
                  style={{ flex: 1, padding: "0.4rem", borderRadius: 8, fontSize: "0.68rem", fontWeight: 700, cursor: "pointer", fontFamily: "Cairo,sans-serif",
                    border: `1.5px solid ${l.originalColors ? GOLD : "rgba(255,255,255,0.1)"}`, background: l.originalColors ? "rgba(201,162,75,0.12)" : "#2C1E15", color: l.originalColors ? GOLD : "#999" }}>الألوان الأصلية</button>
              </div>
              {!l.originalColors && <>
                <div style={{ fontSize: "0.62rem", color: "#888", marginBottom: "0.3rem" }}>
                  {l.colorId ? "لون مخصص لهذا العنصر:" : "يتبع لون التشطيب المختار — أو اختر لوناً خاصاً:"}
                </div>
                <Swatches ids={faceColors} value={l.colorId ?? ""} onChange={v => onUpdate(l.id, { colorId: v })} />
                {l.colorId && <button onClick={() => onUpdate(l.id, { colorId: undefined })}
                  style={{ marginTop: "0.35rem", padding: "0.25rem 0.6rem", borderRadius: 8, fontSize: "0.62rem", fontWeight: 700, fontFamily: "Cairo,sans-serif", border: "1px solid rgba(255,255,255,0.12)", background: "#F4EFE6", color: "#bbb", cursor: "pointer" }}>
                  العودة لاتباع التشطيب
                </button>}
              </>}
            </div>
          </>}
          {l.kind === "qr" && <>
            <input value={l.value} onChange={e => onUpdate(l.id, { value: e.target.value })} placeholder="رابط أو نص الـ QR" dir="ltr"
              style={{ width: "100%", padding: "0.5rem 0.7rem", marginTop: "0.6rem", borderRadius: 8, background: "#F4EFE6", border: "1.5px solid rgba(255,255,255,0.09)", color: "#eee", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }} />
            <div style={{ marginTop: "0.55rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", color: "#ccc", marginBottom: "0.25rem" }}><span>المقاس</span><span style={{ color: GOLD, fontWeight: 700 }}>{l.sizeCm} سم</span></div>
              <input type="range" min={8} max={60} value={l.sizeCm} onChange={e => onUpdate(l.id, { sizeCm: Number(e.target.value) })} style={{ width: "100%", accentColor: GOLD }} />
            </div>
          </>}
          {l.kind === "shape" && <>
            {/* اللون */}
            <div style={{ marginTop: "0.6rem" }}>
              <div style={{ fontSize: "0.66rem", color: "#ccc", marginBottom: "0.35rem" }}>اللون</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
                {[...BG_COLORS, { id: "custom_white", hex: "#FFFFFF", label: "أبيض" }, { id: "custom_black", hex: "#111111", label: "أسود" }].map(c => (
                  <button key={c.id} onClick={() => onUpdate(l.id, { colorHex: c.hex })}
                    title={c.label}
                    style={{ width: 24, height: 24, borderRadius: "50%", background: c.hex, border: l.colorHex === c.hex ? `2.5px solid ${GOLD}` : "2px solid rgba(255,255,255,0.15)", cursor: "pointer", flexShrink: 0 }} />
                ))}
                <label title="لون مخصص" style={{ width: 24, height: 24, borderRadius: "50%", border: "2px dashed rgba(255,255,255,0.3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", color: "#aaa", overflow: "hidden" }}>
                  +
                  <input type="color" value={l.colorHex} onChange={e => onUpdate(l.id, { colorHex: e.target.value })} style={{ opacity: 0, position: "absolute", width: 1, height: 1 }} />
                </label>
              </div>
            </div>
            {/* العرض */}
            <div style={{ marginTop: "0.55rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", color: "#ccc", marginBottom: "0.25rem" }}><span>العرض</span><span style={{ color: GOLD, fontWeight: 700 }}>{Math.round(l.widthCm)} سم</span></div>
              <input type="range" min={2} max={300} value={Math.round(l.widthCm)} onChange={e => onUpdate(l.id, { widthCm: Number(e.target.value) })} style={{ width: "100%", accentColor: GOLD }} />
            </div>
            {/* الارتفاع (لا ينطبق على الخط) */}
            {l.shapeType !== "line" && (
              <div style={{ marginTop: "0.4rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", color: "#ccc", marginBottom: "0.25rem" }}><span>الارتفاع</span><span style={{ color: GOLD, fontWeight: 700 }}>{Math.round(l.heightCm)} سم</span></div>
                <input type="range" min={1} max={200} value={Math.round(l.heightCm)} onChange={e => onUpdate(l.id, { heightCm: Number(e.target.value) })} style={{ width: "100%", accentColor: GOLD }} />
              </div>
            )}
            {/* المط الأفقي */}
            <div style={{ marginTop: "0.4rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", color: "#ccc", marginBottom: "0.25rem" }}>
                <span>مط أفقي</span>
                <span style={{ color: GOLD, fontWeight: 700 }}>{Math.round((l.stretchX ?? 1) * 100)}%</span>
              </div>
              <input type="range" min={10} max={400} step={5} value={Math.round((l.stretchX ?? 1) * 100)}
                onChange={e => onUpdate(l.id, { stretchX: Number(e.target.value) / 100 })} style={{ width: "100%", accentColor: GOLD }} />
            </div>
            {/* المط الرأسي (لا ينطبق على الخط) */}
            {l.shapeType !== "line" && (
              <div style={{ marginTop: "0.4rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", color: "#ccc", marginBottom: "0.25rem" }}>
                  <span>مط رأسي</span>
                  <span style={{ color: GOLD, fontWeight: 700 }}>{Math.round((l.stretchY ?? 1) * 100)}%</span>
                </div>
                <input type="range" min={10} max={400} step={5} value={Math.round((l.stretchY ?? 1) * 100)}
                  onChange={e => onUpdate(l.id, { stretchY: Number(e.target.value) / 100 })} style={{ width: "100%", accentColor: GOLD }} />
              </div>
            )}
            {((l.stretchX ?? 1) !== 1 || (l.stretchY ?? 1) !== 1) && (
              <button onClick={() => onUpdate(l.id, { stretchX: 1, stretchY: 1 })}
                style={{ marginTop: "0.3rem", padding: "0.22rem 0.6rem", borderRadius: 7, fontSize: "0.6rem", fontWeight: 700, fontFamily: "Cairo,sans-serif", border: "1px solid rgba(255,255,255,0.12)", background: "#F4EFE6", color: "#bbb", cursor: "pointer" }}>
                إعادة المط للوضع الطبيعي
              </button>
            )}
            {/* الزاوية — لكل الأشكال، ومُبرَزة للخط */}
            <div style={{ marginTop: "0.5rem", ...(l.shapeType === "line" ? { background: "rgba(201,162,75,0.06)", borderRadius: 8, padding: "0.45rem 0.5rem", border: "1px solid rgba(201,162,75,0.2)" } : {}) }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", color: l.shapeType === "line" ? GOLD : "#ccc", marginBottom: "0.25rem", fontWeight: l.shapeType === "line" ? 800 : 400 }}>
                <span>{l.shapeType === "line" ? "زاوية الخط" : "الدوران"}</span>
                <span style={{ color: GOLD, fontWeight: 700 }}>{l.rotation ?? 0}°</span>
              </div>
              <input type="range" min={-180} max={180} step={1} value={l.rotation ?? 0}
                onChange={e => onUpdate(l.id, { rotation: Number(e.target.value) })} style={{ width: "100%", accentColor: GOLD }} />
              {/* اختصارات سريعة للخط */}
              {l.shapeType === "line" && (
                <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.35rem", flexWrap: "wrap" }}>
                  {([["أفقي", 0], ["٤٥°", 45], ["عمودي", 90], ["-٤٥°", -45]] as [string, number][]).map(([lbl, deg]) => (
                    <button key={deg} onClick={() => onUpdate(l.id, { rotation: deg })}
                      style={{ flex: 1, minWidth: 40, padding: "0.22rem 0.3rem", borderRadius: 6, fontSize: "0.6rem", fontWeight: 700, fontFamily: "Cairo,sans-serif", cursor: "pointer",
                        border: `1px solid ${(l.rotation ?? 0) === deg ? GOLD : "rgba(201,162,75,0.25)"}`,
                        background: (l.rotation ?? 0) === deg ? "rgba(201,162,75,0.15)" : "transparent",
                        color: (l.rotation ?? 0) === deg ? GOLD : "#888" }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>}
        </div>
      )}
    </div>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function computePricing(s: AppState, layers: Layer[], area: { w: number; h: number }, sideStylePriceAdd = 0) {
  const lines: { key: string; label: string; sub: string; num?: number; total: number }[] = [];
  // معدّل الخامة حسب المجموعة: النصوص (typeId) أو اللوجوهات/المحتويات (cTypeId)
  const rateText = MAT_RATE(s.typeId), rateContent = MAT_RATE(s.cTypeId);
  const elRate = (l: Layer) => (l.kind === "text" || (l.kind === "svg" && l.aspect <= 0.5)) ? rateText : rateContent;
  const depth = s.letterDepthCm;
  let textNo = 0, totalMeters = 0;
  layers.forEach(l => {
    const rate = elRate(l);
    if (l.kind === "text") {
      textNo++;
      const f = FONT_BY_ID[l.fontId] || FONT_BY_ID["cairo"];
      const sx = l.stretchX ?? 1, sy = l.stretchY ?? 1;
      const wCm = measureTextCm(l.text, f.family, l.heightCm) * sx;
      // المط يكبّر المحيط الفعلي للحروف تقريبياً بمتوسط معاملي المط
      const p = priceRun(estPerimeterCm(l.text, l.heightCm) * (sx + sy) / 2, depth, rate);
      totalMeters += wCm / 100;
      const effH = Math.round(l.heightCm * sy);
      lines.push({ key: l.id, label: `الجملة ${textNo}`, sub: `ارتفاع ${effH} سم · عمق ${depth} سم`, num: textNo, total: p.total });
    } else if (l.kind === "logo") {
      const perim = 2 * (l.widthCm + l.widthCm * 0.7);
      const p = priceRun(perim, depth, rate);
      totalMeters += l.widthCm / 100;
      lines.push({ key: l.id, label: "الشعار", sub: `صعوبة ×${RATES.logoDifficulty}`, total: p.total * RATES.logoDifficulty });
    } else if (l.kind === "qr") {
      const perim = 4 * l.sizeCm;
      const p = priceRun(perim, depth, rate);
      totalMeters += l.sizeCm / 100;
      lines.push({ key: l.id, label: "QR Code", sub: `صعوبة ×${RATES.qrDifficulty}`, total: p.total * RATES.qrDifficulty });
    } else if (l.kind === "svg") {
      // محيط القص الفعلي من مسارات الملف، وبحد أدنى ضعف العرض
      const perimCm = Math.max(l.perimScale * l.widthCm, l.widthCm * 2);
      const p = priceRun(perimCm, depth, rate);
      totalMeters += l.widthCm / 100;
      lines.push({ key: l.id, label: "تصميم مرفوع", sub: `${l.name} · عرض ${Math.round(l.widthCm)} سم`, total: p.total });
    }
  });
  const lt = LIGHT_TYPES.find(x => x.id === s.lightTypeId) || LIGHT_TYPES[0];
  // عند المقاس المفترض (لا إطار) يُسعَّر الإضاءة على مساحة المحتوى الفعلية لا اللوحة المفترضة
  const litArea = s.bgAssumed && s.signW > 0 ? s.signW * s.signH : area.w * area.h;
  const lighting = priceLighting(litArea, lt.ledFactor);
  // إطار حول التصميم: متاح فقط لوجه أكريلك وجوانب ستانلس أو زنكور (لا الألمنيوم)
  const frameEligible = s.typeId === "acrylic" && (s.sideMat === "stainless" || s.sideMat === "zincor");
  const borderActive = s.faceBorder && !s.uniMatText && frameEligible && lines.length > 0;
  const FRAME_W = Math.min(10, Math.max(1.5, Math.min(area.w, area.h) * 0.035)); // سمك الإطار متناسب مع حجم اللوحة
  const borderCost = borderActive ? 2 * (area.w + area.h) * FRAME_W * MAT_RATE(s.sideMat) * 0.02 : 0;
  const lettersBase = lines.reduce((a, b) => a + b.total, 0) + lighting + borderCost;
  // نمط التخريم: زيادة % على تكلفة الحروف (لا تُطبَّق على الإضاءة أو الخلفية)
  const sideStyleAdd = (sideStylePriceAdd > 0 && s.sideMat !== "acrylic") ? lettersBase * (sideStylePriceAdd / 100) : 0;
  const lettersRaw = lettersBase + sideStyleAdd;
  const lettersTotal = lines.length > 0 ? Math.max(lettersRaw, MIN_ORDER) : 0;
  const bgAdd = s.mount === "background" && s.bgMode === "add";
  const bgCost = priceBackground({ add: bgAdd, material: s.bgMaterial, lightboxFace: s.lightboxFace, widthCm: s.bgW, heightCm: s.bgH, depthCm: s.bgD });
  const subtotal = lettersTotal + bgCost;
  const offer = RATES.offer.active ? subtotal * (RATES.offer.percent / 100) : 0;
  const bgAreaM2 = s.mount === "background" ? (s.bgW * s.bgH) / 10000 : 0;
  const crane = s.installHeightM >= RATES.install.craneHeightM || s.craneNeeded;
  const install = s.wantInstall ? priceInstall({ totalMeters, bgAreaM2, wallDirect: s.mount === "wall", craneNeeded: crane, outsideJeddah: s.installRegion === "outside" }) : 0;
  const preVat = subtotal - offer + install;
  const vat = preVat * RATES.vat;
  const total = preVat + vat;
  const hasContent = lines.length > 0 || !!s.uploadName;
  // ⚠️ مؤقت: معامل خفض السعر التقديري الظاهر لحين ضبط التسعير النهائي (يُطبَّق على كل البنود بالتساوي فتبقى التفاصيل متّسقة)
  const PRICE_SCALE = 0.45;
  const k = PRICE_SCALE;
  return {
    lines: lines.map(l => ({ ...l, total: l.total * k })),
    lighting: lighting * k, lightLabel: lt.label,
    bgCost: bgCost * k, bgAdd,
    subtotal: subtotal * k, offer: offer * k, install: install * k,
    totalMeters, vat: vat * k, total: total * k, hasContent,
  };
}

function PriceRow({ label, sub, num, value, strong, neg }: { label: string; sub?: string; num?: number; value: number; strong?: boolean; neg?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", padding: "0.4rem 0", borderBottom: "1px solid rgba(154,106,42,0.18)" }}>
      <div style={{ display: "flex", gap: "0.45rem", alignItems: "flex-start" }}>
        {num && <span style={{ width: 16, height: 16, borderRadius: "50%", background: G, color: "#2C1E15", fontSize: "0.58rem", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>{num}</span>}
        <div>
          <div style={{ fontSize: strong ? "0.86rem" : "0.78rem", fontWeight: strong ? 800 : 600, color: strong ? "#2C1E15" : "#5A4A3A" }}>{label}</div>
          {sub && <div style={{ fontSize: "0.62rem", color: "#5A4A3A", marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
      <div style={{ fontSize: strong ? "0.95rem" : "0.78rem", fontWeight: strong ? 900 : 700, color: neg ? "#16a34a" : strong ? "#2C1E15" : "#2C1E15", whiteSpace: "nowrap" }}>
        {neg ? "−" : ""}{rr(Math.abs(value))} <span style={{ fontSize: "0.6rem", color: "#5A4A3A" }}>ر.س</span>
      </div>
    </div>
  );
}

// ─── Saved projects ───────────────────────────────────────────────────────────
const SAVED_PROJECTS = [
  { id: "p1", name: "مطعم الذوّاقة",  grad: "linear-gradient(135deg,#F4EFE6,#FDFBF7)", layers: [{ kind: "text" as const, text: "الذوّاقة", lang: "ar", fontId: "tajawal", heightCm: 55, colorId: "gold", x: 50, y: 45 }] },
  { id: "p2", name: "صيدلية النور",    grad: "linear-gradient(135deg,#0a1a24,#0a1218)", layers: [{ kind: "text" as const, text: "صيدلية النور", lang: "ar", fontId: "cairo", heightCm: 48, colorId: "white", x: 50, y: 50 }] },
  { id: "p3", name: "Cloud Cafe",     grad: "linear-gradient(135deg,#1e0f1a,#120810)", layers: [{ kind: "text" as const, text: "Cloud Cafe", lang: "en", fontId: "montserrat", heightCm: 50, colorId: "gold", x: 50, y: 48 }] },
];

function ImportModal({ onClose, onPick }: { onClose: () => void; onPick: (pr: typeof SAVED_PROJECTS[0]) => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 5000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div onClick={e => e.stopPropagation()} dir="rtl" style={{ width: "100%", maxWidth: 440, background: "#141414", borderRadius: 18, border: "1px solid rgba(201,162,75,0.2)", overflow: "hidden", fontFamily: "Cairo,sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.1rem 1.3rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontWeight: 800, color: "#2C1E15" }}>استيراد من مشاريعي</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
        </div>
        <div style={{ padding: "1rem 1.3rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {SAVED_PROJECTS.map(pr => (
            <button key={pr.id} onClick={() => onPick(pr)} style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.7rem", borderRadius: 12, cursor: "pointer", border: "1px solid rgba(255,255,255,0.07)", background: "#FDFBF7", textAlign: "start" }}>
              <div style={{ width: 56, height: 40, borderRadius: 8, background: pr.grad, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "rgba(255,255,255,0.85)", fontWeight: 900, fontSize: "0.9rem" }}>أ</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#eee" }}>{pr.name}</div><div style={{ fontSize: "0.66rem", color: "#ccc" }}>{pr.layers.length} عناصر</div></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FacadeHelpModal: يشرح «عرض واجهة المحل» على نموذجين (نافذة واحدة / أكثر) ───
function FacadeHelpModal({ value, onClose }: { value: number; onClose: () => void }) {
  // رسم واجهة محل توضيحية بعدد نوافذ عرض معيّن — سهم القياس يمتد على كامل العرض دائماً
  const Store = ({ windows, caption }: { windows: number; caption: string }) => {
    const X0 = 24, X1 = 296, top = 20;          // حافتا الواجهة + ارتفاع خط القياس
    const W = X1 - X0;
    const bandY = 32, bandH = 22;               // شريط اللافتة
    const winTop = bandY + bandH + 10, winBot = 130, winH = winBot - winTop;
    const pad = 14, doorW = 42, gap = 10;
    const winArea = W - doorW - gap - pad * 2;
    const winW = winArea / windows;
    return (
      <div style={{ width: "100%" }}>
        <svg viewBox="0 0 320 144" style={{ width: "100%", display: "block" }}>
          {/* سهم القياس — عرض الواجهة الكامل */}
          <text x="160" y={top - 7} textAnchor="middle" fontFamily="Cairo,sans-serif" fontSize="13" fontWeight="800" fill={GOLD}>عرض الواجهة = {value} سم</text>
          <line x1={X0} y1={top} x2={X1} y2={top} stroke={GOLD} strokeWidth="1.5" />
          <line x1={X0} y1={top - 5} x2={X0} y2={top + 5} stroke={GOLD} strokeWidth="1.5" />
          <line x1={X1} y1={top - 5} x2={X1} y2={top + 5} stroke={GOLD} strokeWidth="1.5" />
          <polygon points={`${X0},${top} ${X0 + 8},${top - 4} ${X0 + 8},${top + 4}`} fill={GOLD} />
          <polygon points={`${X1},${top} ${X1 - 8},${top - 4} ${X1 - 8},${top + 4}`} fill={GOLD} />
          {/* هيكل الواجهة */}
          <rect x={X0} y={bandY - 4} width={W} height={winBot - (bandY - 4)} fill="#FBF6EC" stroke="#9A6A2A" strokeWidth="1.5" />
          {/* شريط اللافتة */}
          <rect x={X0 + 6} y={bandY} width={W - 12} height={bandH} rx="3" fill="rgba(201,162,75,0.2)" stroke={GOLD} strokeWidth="1" />
          <text x="160" y={bandY + bandH / 2 + 4} textAnchor="middle" fontFamily="Cairo,sans-serif" fontSize="12" fontWeight="700" fill="#9A6A2A">لافتة المحل</text>
          {/* نوافذ العرض */}
          {Array.from({ length: windows }).map((_, i) => (
            <rect key={i} x={X0 + pad + i * winW + (windows > 1 ? 3 : 0)} y={winTop} width={winW - (windows > 1 ? 6 : 0)} height={winH} rx="2" fill="#CFE7F2" stroke="#7FA8BC" strokeWidth="1" />
          ))}
          {/* الباب */}
          <rect x={X1 - pad - doorW} y={winTop + 6} width={doorW} height={winH - 6} rx="2" fill="#E2D2B4" stroke="#9A6A2A" strokeWidth="1" />
          <circle cx={X1 - pad - 8} cy={winTop + 6 + (winH - 6) / 2} r="2" fill="#9A6A2A" />
          {/* الأرضية */}
          <line x1={X0 - 6} y1={winBot} x2={X1 + 6} y2={winBot} stroke="#9A6A2A" strokeWidth="2.5" />
        </svg>
        <div style={{ textAlign: "center", marginTop: 3, fontSize: "0.8rem", fontWeight: 800, color: "#2C1E15" }}>{caption}</div>
      </div>
    );
  };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 5200, background: "rgba(44,30,21,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div onClick={e => e.stopPropagation()} dir="rtl" style={{ width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", background: "#FDFBF7", borderRadius: 18, border: "1px solid rgba(201,162,75,0.35)", fontFamily: "Cairo,sans-serif", boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.3rem", borderBottom: "1px solid rgba(154,106,42,0.2)", position: "sticky", top: 0, background: "#FDFBF7", zIndex: 1 }}>
          <div style={{ fontWeight: 900, color: "#2C1E15", fontSize: "0.95rem" }}>ما المقصود بعرض واجهة المحل؟</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8A7A66", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
        </div>
        <div style={{ padding: "0.8rem 1.3rem 1rem" }}>
          <p style={{ margin: "0 0 0.7rem", fontSize: "0.76rem", color: "#5A4A3A", lineHeight: 1.7 }}>
            عرض الواجهة هو <b style={{ color: "#2C1E15" }}>العرض الكلي للمحل من الحافة إلى الحافة</b> — بغضّ النظر عن عدد نوافذ العرض. يجب ألا يتجاوز عرض اللوحة هذا العرض وفق الاشتراطات البلدية.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <Store windows={1} caption="محل بنافذة عرض واحدة" />
            <Store windows={3} caption="محل بأكثر من نافذة عرض" />
          </div>
          <div style={{ marginTop: "0.7rem", textAlign: "center", padding: "0.5rem", borderRadius: 10, background: "rgba(201,162,75,0.1)", border: "1px solid rgba(201,162,75,0.3)", fontSize: "0.78rem", color: "#2C1E15", fontWeight: 700 }}>
            القياس الحالي: عرض الواجهة = {value} سم
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── HeightHelpModal: يشرح «ارتفاع نافذة العرض» و«ارتفاع الحد السفلي» على مخطّط واجهة ───
function HeightHelpModal({ windowHeightCm, signBottomM, onClose }: { windowHeightCm: number; signBottomM: number; onClose: () => void }) {
  const FX0 = 74, FX1 = 274, FY = 22, groundY = 214;          // حدود الواجهة + الأرض
  const bandY = 28, bandH = 40, signBot = bandY + bandH;       // شريط اللافتة وأسفله = 68
  const winY1 = 84, winY2 = 200;                               // أعلى/أسفل نافذة العرض
  const doorW = 42, doorX = FX1 - 12 - doorW, doorY = winY1 + 38, winRightX = doorX - 8;
  const BLUE = "#3B82C8", GREEN = "#2E7A3E", LX = 52, RX = 298;
  const caps = (x: number, y: number, c: string) => <line x1={x - 5} y1={y} x2={x + 5} y2={y} stroke={c} strokeWidth="1.5" />;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 5200, background: "rgba(44,30,21,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div onClick={e => e.stopPropagation()} dir="rtl" style={{ width: "100%", maxWidth: 440, maxHeight: "92vh", overflowY: "auto", background: "#FDFBF7", borderRadius: 18, border: "1px solid rgba(201,162,75,0.35)", fontFamily: "Cairo,sans-serif", boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.3rem", borderBottom: "1px solid rgba(154,106,42,0.2)", position: "sticky", top: 0, background: "#FDFBF7", zIndex: 1 }}>
          <div style={{ fontWeight: 900, color: "#2C1E15", fontSize: "0.95rem" }}>ارتفاع نافذة العرض والحد السفلي</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8A7A66", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
        </div>
        <div style={{ padding: "1.1rem 1.3rem" }}>
          <p style={{ margin: "0 0 1rem", fontSize: "0.78rem", color: "#5A4A3A", lineHeight: 1.85 }}>
            <b style={{ color: "#2C1E15" }}>ارتفاع نافذة العرض</b> هو ارتفاع زجاج الواجهة، و<b style={{ color: "#2C1E15" }}>ارتفاع الحد السفلي</b> هو المسافة من الأرض حتى أسفل اللوحة.
          </p>
          <svg viewBox="0 0 340 252" style={{ width: "100%", display: "block" }}>
            {/* الأرض */}
            <line x1="18" y1={groundY} x2="322" y2={groundY} stroke="#9A6A2A" strokeWidth="3" />
            {/* هيكل الواجهة */}
            <rect x={FX0} y={FY} width={FX1 - FX0} height={groundY - FY} fill="#FBF6EC" stroke="#9A6A2A" strokeWidth="1.5" />
            {/* نافذة العرض الكبيرة */}
            <rect x={FX0 + 12} y={winY1} width={winRightX - (FX0 + 12)} height={winY2 - winY1} rx="2" fill="#EAF4FA" stroke="#7FA8BC" strokeWidth="1.5" />
            {/* الباب */}
            <rect x={doorX} y={doorY} width={doorW} height={groundY - doorY} rx="2" fill="#E2D2B4" stroke="#9A6A2A" strokeWidth="1.5" />
            <line x1={doorX + doorW / 2} y1={doorY} x2={doorX + doorW / 2} y2={groundY} stroke="#9A6A2A" strokeWidth="0.8" />
            <circle cx={doorX + doorW - 7} cy={(doorY + groundY) / 2} r="2.4" fill="#9A6A2A" />
            <text x={doorX + doorW / 2} y={doorY - 4} textAnchor="middle" fontFamily="Cairo,sans-serif" fontSize="8" fontWeight="700" fill="#9A6A2A">باب</text>
            {/* شريط اللافتة (أحمر داكن كالمرجع) */}
            <rect x={FX0} y={bandY} width={FX1 - FX0} height={bandH} fill="#7A1518" stroke="#5A0F12" strokeWidth="1" />
            <text x={(FX0 + FX1) / 2} y={bandY + bandH / 2 + 5} textAnchor="middle" fontFamily="Cairo,sans-serif" fontSize="15" fontWeight="800" fill="#F4ECDD">لوحة المحل</text>
            {/* قياس ارتفاع اللوحة = ثلث النافذة (يسار · أخضر) */}
            <line x1={FX0} y1={bandY} x2={LX} y2={bandY} stroke={GREEN} strokeWidth="1" strokeDasharray="3 2" />
            <line x1={FX0} y1={signBot} x2={LX} y2={signBot} stroke={GREEN} strokeWidth="1" strokeDasharray="3 2" />
            <line x1={LX} y1={bandY} x2={LX} y2={signBot} stroke={GREEN} strokeWidth="1.5" />
            {caps(LX, bandY, GREEN)}{caps(LX, signBot, GREEN)}
            <text x={LX - 12} y={(bandY + signBot) / 2 + 4} textAnchor="middle" fontFamily="Cairo,sans-serif" fontSize="13" fontWeight="900" fill={GREEN}>⅓</text>
            {/* قياس ارتفاع نافذة العرض (يسار · أزرق) */}
            <line x1={FX0} y1={winY1} x2={LX} y2={winY1} stroke={BLUE} strokeWidth="1" strokeDasharray="3 2" />
            <line x1={FX0} y1={winY2} x2={LX} y2={winY2} stroke={BLUE} strokeWidth="1" strokeDasharray="3 2" />
            <line x1={LX} y1={winY1} x2={LX} y2={winY2} stroke={BLUE} strokeWidth="1.5" />
            {caps(LX, winY1, BLUE)}{caps(LX, winY2, BLUE)}
            <text x={LX - 14} y={(winY1 + winY2) / 2} textAnchor="middle" transform={`rotate(-90 ${LX - 14} ${(winY1 + winY2) / 2})`} fontFamily="Cairo,sans-serif" fontSize="11" fontWeight="800" fill={BLUE}>{windowHeightCm} سم</text>
            {/* قياس ارتفاع الحد السفلي (يمين · ذهبي) — من الأرض حتى أسفل اللوحة */}
            <line x1={FX1} y1={signBot} x2={RX} y2={signBot} stroke={GOLD} strokeWidth="1" strokeDasharray="3 2" />
            <line x1={FX1} y1={groundY} x2={RX} y2={groundY} stroke={GOLD} strokeWidth="1" strokeDasharray="3 2" />
            <line x1={RX} y1={signBot} x2={RX} y2={groundY} stroke={GOLD} strokeWidth="1.5" />
            {caps(RX, signBot, GOLD)}{caps(RX, groundY, GOLD)}
            <text x={RX + 13} y={(signBot + groundY) / 2} textAnchor="middle" transform={`rotate(-90 ${RX + 13} ${(signBot + groundY) / 2})`} fontFamily="Cairo,sans-serif" fontSize="11" fontWeight="800" fill={GOLD}>{signBottomM} م</text>
          </svg>
          {/* مفتاح القياسات */}
          <div style={{ marginTop: "0.9rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#2C1E15", fontWeight: 800 }}>
              <span style={{ width: 18, height: 4, borderRadius: 2, background: GREEN, flexShrink: 0 }} />
              ارتفاع اللوحة = ثلث ارتفاع نافذة العرض
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#2C1E15", fontWeight: 800 }}>
              <span style={{ width: 18, height: 4, borderRadius: 2, background: BLUE, flexShrink: 0 }} />
              ارتفاع نافذة العرض = {windowHeightCm} سم
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#2C1E15", fontWeight: 800 }}>
              <span style={{ width: 18, height: 4, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
              ارتفاع الحد السفلي للوحة = {signBottomM} م <span style={{ color: "#8A7A66", fontWeight: 600, fontSize: "0.7rem" }}>(من الأرض حتى أسفل اللوحة)</span>
            </div>
          </div>
          <div style={{ marginTop: "1rem", padding: "0.65rem 0.8rem", borderRadius: 10, background: "rgba(201,162,75,0.1)", border: "1px solid rgba(201,162,75,0.3)", fontSize: "0.74rem", color: "#2C1E15", fontWeight: 700, lineHeight: 1.7 }}>
            الاشتراط: ارتفاع اللوحة لا يتجاوز <b>ثلث</b> ارتفاع نافذة العرض، ولا يقل الحد السفلي للوحة عن <b>2.40 م</b> عن سطح الأرض.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Plan Gate ────────────────────────────────────────────────────────────────
const FREE_FEAT = [
  { text: "تصميم كامل (نص + شعار + QR)", pro: false },
  { text: "فحص اشتراطات الأمانة تلقائياً", pro: false },
  { text: "سعر تقديري فوري",               pro: false },
  { text: "معاينة ثلاثية الأبعاد",          pro: false },
  { text: "طلب عروض أسعار من الموردين",    pro: false },
  { text: "استيراد السجل التجاري (OCR)",   pro: true  },
  { text: "معاينة واجهة المحل الواقعية",   pro: true  },
  { text: "ملف امتثال PDF للتقديم",        pro: true  },
  { text: "ملفات قص جاهزة للإنتاج",       pro: true  },
  { text: "حفظ التصاميم واسترجاعها",      pro: true  },
];
const PRO_FEAT = [
  "كل مميزات المجانية",
  "٣ تعديلات مشمولة لكل تصميم",
  "استيراد السجل التجاري (OCR)",
  "معاينة واقعية بجودة عالية",
  "ملف امتثال PDF جاهز للتقديم",
  "ملفات قص جاهزة للإنتاج",
  "حفظ التصاميم واسترجاعها",
  "جميع الخطوط والألوان",
];

function PlanGate({ onFree, onPro }: { onFree: () => void; onPro: () => void }) {
  return (
    <div dir="rtl" style={{
      position: "fixed", inset: 0, zIndex: 9999, overflowY: "auto",
      background: "#FDFBF7",
      fontFamily: "Tajawal,Cairo,sans-serif",
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "100%", padding: "2.5rem 1.25rem" }}>
      {/* خط ذهبي علوي */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: "linear-gradient(90deg,transparent,#C9A24B,#EBCB7C,#C9A24B,transparent)" }} />

      {/* العنوان */}
      <div style={{ textAlign: "center", marginBottom: "2.25rem", maxWidth: 560 }}>
        <div style={{ fontSize: "0.7rem", letterSpacing: "0.15em", color: "#9A6A2A",
          textTransform: "uppercase", marginBottom: "0.6rem" }}>
          سوق الدعاية والإعلان — إعلاني
        </div>
        <h1 style={{ fontSize: "clamp(1.5rem,4vw,2.1rem)", fontWeight: 900, margin: "0 0 0.6rem", color: "#2C1E15" }}>
          أداة تصميم اللوحات الإعلانية
        </h1>
        <p style={{ fontSize: "0.84rem", color: "#634E40", margin: 0, lineHeight: 1.75 }}>
          صمّم لوحتك الإعلانية باحتراف — اختر خطتك للبدء
        </p>
      </div>

      {/* البطاقتان */}
      <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap",
        justifyContent: "center", maxWidth: 860, width: "100%" }}>

        {/* المجانية */}
        <div style={{ flex: "1 1 340px", maxWidth: 400, background: "#2A1F14",
          border: "1px solid rgba(154,106,42,0.35)", borderRadius: 20, padding: "1.75rem",
          display: "flex", flexDirection: "column",
          boxShadow: "0 4px 24px rgba(0,0,0,0.25)" }}>
          <div style={{ marginBottom: "1.3rem" }}>
            <div style={{ fontSize: "0.68rem", letterSpacing: "0.1em", color: "#9A6A2A",
              textTransform: "uppercase", marginBottom: "0.3rem" }}>الخطة</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#F4ECDD", lineHeight: 1 }}>المجانية</div>
            <div style={{ marginTop: "0.55rem", fontSize: "1.35rem", fontWeight: 900, color: "#C9A24B" }}>مجاناً</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", flex: 1 }}>
            {FREE_FEAT.map(f => (
              <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: f.pro ? "0.65rem" : "0.7rem", fontWeight: 900,
                  background: f.pro ? "rgba(154,106,42,0.1)" : "rgba(46,122,62,0.12)",
                  border: `1px solid ${f.pro ? "rgba(154,106,42,0.35)" : "rgba(46,122,62,0.35)"}`,
                  color: f.pro ? "#9A6A2A" : "#2E7A3E" }}>
                  {f.pro ? "🔒" : "✓"}
                </span>
                <span style={{ fontSize: "0.81rem", color: f.pro ? "#A39584" : "#F4ECDD", fontWeight: f.pro ? 400 : 600 }}>{f.text}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1.6rem" }}>
            <div style={{ marginBottom: "0.65rem", textAlign: "center", fontSize: "0.62rem", color: "#A39584", lineHeight: 1.6 }}>
              بدون تسجيل دخول · مجاناً تماماً
            </div>
            <button onClick={onFree}
              style={{ width: "100%", padding: "0.85rem", borderRadius: 12, cursor: "pointer",
                fontFamily: "Tajawal,Cairo,sans-serif", fontWeight: 900, fontSize: "0.88rem", border: "none",
                background: "linear-gradient(135deg,#9A7B36 0%,#E6CA83 50%,#F7E7C4 100%)",
                color: "#2C1E15", boxShadow: "0 4px 24px rgba(201,162,75,0.35)" }}>
              ابدأ مجاناً ←
            </button>
          </div>
        </div>

        {/* الاحترافية */}
        <div style={{ flex: "1 1 340px", maxWidth: 400, position: "relative",
          background: "#2A1F14",
          border: "1.5px solid rgba(201,162,75,0.55)", borderRadius: 20, padding: "1.75rem",
          boxShadow: "0 8px 40px rgba(201,162,75,0.18)", display: "flex", flexDirection: "column" }}>
          <div style={{ position: "absolute", top: -13, right: 22,
            background: "linear-gradient(135deg,#9A7B36,#E6CA83)", borderRadius: 999,
            padding: "0.22rem 0.9rem", fontSize: "0.63rem", fontWeight: 900, color: "#2C1E15" }}>
            ✦ موصى به
          </div>
          <div style={{ marginBottom: "1.3rem" }}>
            <div style={{ fontSize: "0.68rem", letterSpacing: "0.1em", color: "#9A6A2A",
              textTransform: "uppercase", marginBottom: "0.3rem" }}>الخطة</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#F4ECDD", lineHeight: 1 }}>الاحترافية</div>
            <div style={{ marginTop: "0.55rem", display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: "1.35rem", fontWeight: 900, color: "#C9A24B" }}>٢٩ ر.س</span>
              <span style={{ fontSize: "0.7rem", color: "#9A6A2A" }}>/ تصميم</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", flex: 1 }}>
            {PRO_FEAT.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 900,
                  background: "rgba(201,162,75,0.15)", border: "1px solid rgba(201,162,75,0.45)", color: "#9A6A2A" }}>✓</span>
                <span style={{ fontSize: "0.81rem", color: "#F4ECDD" }}>{f}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1.6rem" }}>
            <div style={{ marginBottom: "0.65rem", textAlign: "center", fontSize: "0.62rem", color: "#A39584", lineHeight: 1.6 }}>
              يتطلب تسجيل الدخول · الدفع ٢٩ ر.س عبر بوابة آمنة
            </div>
            <button onClick={onPro}
              style={{ width: "100%", padding: "0.85rem", borderRadius: 12, cursor: "pointer",
                fontFamily: "Tajawal,Cairo,sans-serif", fontWeight: 900, fontSize: "0.88rem", border: "none",
                background: "linear-gradient(135deg,#9A7B36 0%,#E6CA83 50%,#F7E7C4 100%)",
                color: "#2C1E15", boxShadow: "0 4px 24px rgba(201,162,75,0.35)" }}>
              سجّل الدخول وابدأ الاحترافية ←
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "1.75rem", fontSize: "0.7rem", color: "#9A8070", textAlign: "center" }}>
        يمكنك الترقية في أي وقت من داخل الأداة
      </div>
      </div>{/* end inner centering div */}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RaisedLettersPage() {
  const locale = useLocale();

  const [s, setS] = useState<AppState>({
    mount: "background", bgMode: "add", bgMaterial: "cladding", lightboxFace: "lexan", bgW: 220, bgH: 80, bgD: 8, bgColorId: "white", bgCustomColor: "",
    wallW: 220, wallH: 80,
    bgAssumed: false, signW: 0, signH: 0,
    typeId: "zincor", faceColorId: "silver", sideColorId: "silver",
    sideMat: "zincor", faceBorder: false, coloredDesign: false, faceCustomColor: "", sideCustomColor: "",
    cTypeId: "zincor", cSideMat: "zincor", cFaceColorId: "silver", cSideColorId: "silver", cFaceCustomColor: "", cSideCustomColor: "",
    uniMatText: true, uniMatContent: true,
    sideStyleId: "solid",
    lightTypeId: "none", lightTempId: "warm", bgLightTempId: "warm", night: false,
    contentMode: "design", uploadName: null, letterDepthCm: 5,
    wantInstall: true, installRegion: "jeddah", installHeightM: 3, craneNeeded: false,
    nationalAddress: "",
    city: "jeddah", streetType: "commercial",
    establishmentType: "store", signType: "parallel", facadeWidthCm: 250, windowHeightCm: 300, signBottomM: 2.4, hasTrademark: false,
    zoom: 1.4, guides: true,
  });
  const set = (patch: Partial<AppState>) => setS(p => ({ ...p, ...patch }));

  // التصميم الافتراضي فارغ — يبدأ المستخدم بالاستيراد من السجل أو بإضافة المحتوى يدوياً
  const [layers, setLayers]     = useState<Layer[]>([]);
  const [selectedId, setSelId]  = useState<string | null>(null);
  const [showFacadeHelp, setShowFacadeHelp] = useState(false);
  const [showHeightHelp, setShowHeightHelp] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [signKindPreview, setSignKindPreview] = useState<string | null>(null);
  // الخطوط المفعّلة للعميل (يضبطها المسؤول من لوحة التحكم → site_config مفتاح design_fonts)
  const [enabledFontIds, setEnabledFontIds] = useState<string[]>(DEFAULT_ENABLED_FONT_IDS);
  useEffect(() => {
    fetch("/api/site-config?key=design_fonts")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d?.value) && d.value.length) setEnabledFontIds(d.value as string[]); })
      .catch(() => {});
  }, []);

  // ── أنماط الجوانب (ديناميكية من DB، fallback ثابتة) ──
  const [sideStyles, setSideStyles] = useState<SideStyleDef[]>(FALLBACK_SIDE_STYLES);
  useEffect(() => {
    fetch("/api/side-styles")
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d?.sideStyles) && d.sideStyles.length) {
          setSideStyles(d.sideStyles.map((ss: Record<string, unknown>) => ({
            slug: String(ss.slug ?? ""), nameAr: String(ss.nameAr ?? ""), descriptionAr: String(ss.descriptionAr ?? ""),
            priceAddPercent: Number(ss.priceAddPercent ?? 0), metalOnly: Boolean(ss.metalOnly ?? true),
            icon: (FALLBACK_SIDE_STYLES.find(f => f.slug === ss.slug)?.icon ?? "▬"),
          })));
        }
      })
      .catch(() => {});
  }, []);

  // ── أنواع الحروف (تركيبات وجه+جوانب ديناميكية من DB) ──
  type LetterTypeDef = { slug: string; nameAr: string; nameEn: string; tagAr: string; faceMaterial: string; sideMaterial: string; lighting: string; rateMultiplier: number; gradientCss: string; availableColors: string[]; colorful: boolean };
  const FALLBACK_LETTER_TYPES: LetterTypeDef[] = [
    { slug: "acrylic-alum",   nameAr: "أكريليك + ألومنيوم", nameEn: "Acrylic + Aluminum", tagAr: "⭐ الأكثر مبيعاً", faceMaterial: "acrylic", sideMaterial: "aluminum", lighting: "front", rateMultiplier: 0.75, gradientCss: "linear-gradient(135deg,#dff0ff,#f0f8ff,#cce4f8)", availableColors: ["white","black","red","blue","green","gold","copper","silver"], colorful: true },
    { slug: "stainless",      nameAr: "إستانلس ستيل",       nameEn: "Stainless Steel",   tagAr: "فاخر · عاكس",       faceMaterial: "stainless", sideMaterial: "stainless", lighting: "none", rateMultiplier: 2.80, gradientCss: "linear-gradient(135deg,#3a3a3a,#9aa0a6 45%,#e9edf0 60%,#7c7f84)", availableColors: ["gold","silver"], colorful: false },
    { slug: "acrylic-zincor", nameAr: "أكريليك + زنكور",    nameEn: "Acrylic + Zincor",  tagAr: "جوانب مخصصة",        faceMaterial: "acrylic", sideMaterial: "zincor", lighting: "front", rateMultiplier: 1.10, gradientCss: "linear-gradient(135deg,#ffdada,#fff0f0,#f8cccc)", availableColors: ["white","black","red","blue","green","gold","silver"], colorful: true },
    { slug: "zincor-full",    nameAr: "زنكور شامل",          nameEn: "Full Zincor",       tagAr: "هالة خلفية",          faceMaterial: "zincor", sideMaterial: "zincor", lighting: "back", rateMultiplier: 1.50, gradientCss: "linear-gradient(135deg,#2a3540,#1c252e)", availableColors: ["white","black","red","blue","green","gold","copper","silver"], colorful: true },
    { slug: "acrylic-full",   nameAr: "أكريليك شامل",       nameEn: "Full Acrylic",      tagAr: "✨ توهج كامل",        faceMaterial: "acrylic", sideMaterial: "acrylic", lighting: "both", rateMultiplier: 0.75, gradientCss: "linear-gradient(135deg,#ffe0a0,#fff4d0,#ffd060)", availableColors: ["white","black","red","blue","green","gold","copper","silver"], colorful: true },
  ];
  const [letterTypes, setLetterTypes] = useState<LetterTypeDef[]>(FALLBACK_LETTER_TYPES);
  useEffect(() => {
    fetch("/api/letter-types")
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d?.letterTypes) && d.letterTypes.length) {
          setLetterTypes(d.letterTypes.map((lt: Record<string, unknown>) => ({
            slug: String(lt.slug ?? ""), nameAr: String(lt.nameAr ?? ""), nameEn: String(lt.nameEn ?? ""),
            tagAr: String(lt.tagAr ?? ""), faceMaterial: String(lt.faceMaterial ?? "acrylic"),
            sideMaterial: String(lt.sideMaterial ?? "aluminum"), lighting: String(lt.lighting ?? "front"),
            rateMultiplier: Number(lt.rateMultiplier ?? 1), gradientCss: String(lt.gradientCss ?? ""),
            availableColors: Array.isArray(lt.availableColors) ? lt.availableColors as string[] : [],
            colorful: Boolean(lt.colorful ?? true),
          })));
        }
      })
      .catch(() => {});
  }, []);

  // إعادة نمط الجوانب لـ"صماء" عند التحويل لأكريليك أو إيقاف الإضاءة
  useEffect(() => {
    if (s.sideMat === "acrylic" || s.lightTypeId === "none") {
      if (s.sideStyleId !== "solid") set({ sideStyleId: "solid" });
    }
  }, [s.sideMat, s.lightTypeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── المعاينة ثلاثية الأبعاد ──
  const [showMatModal, setShowMatModal] = useState(false);
  const [show3D, setShow3D] = useState(false);
  const [c3d, setC3d] = useState<{ face: HTMLCanvasElement; sil: HTMLCanvasElement } | null>(null);
  const [showMockup, setShowMockup] = useState(false);
  const [mockupCanvas, setMockupCanvas] = useState<HTMLCanvasElement | null>(null);
  const open3D = async () => {
    setC3d(null); setShow3D(true);
    try { setC3d(await composeDesignCanvases()); } catch { setC3d(null); }
  };
  const openMockup = async () => {
    setMockupCanvas(null); setShowMockup(true);
    try {
      const { face } = await composeDesignCanvases();
      // لوحة بخلفية: نضيف لون اللوحة خلف المحتويات؛ تركيب جداري: المحتويات فقط (شفافة)
      if (s.mount === "background" && s.bgMode === "add") {
        const c = document.createElement("canvas"); c.width = face.width; c.height = face.height;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = s.bgCustomColor || (BG_COLORS.find(b => b.id === s.bgColorId)?.hex || "#cccccc");
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(face, 0, 0);
        setMockupCanvas(c);
      } else setMockupCanvas(face);
    } catch { setMockupCanvas(null); }
  };
  // يركّب التصميم الحالي على لوحتين: الوجه بالألوان (شفاف) + صورة ظلية بيضاء على أسود
  const composeDesignCanvases = async (): Promise<{ face: HTMLCanvasElement; sil: HTMLCanvasElement }> => {
    {
      const S = 5; // px لكل سم
      const aw = s.mount === "background" ? s.bgW : s.wallW;
      const ah = s.mount === "background" ? s.bgH : s.wallH;
      const W = Math.max(1, Math.round(aw * S)), H = Math.max(1, Math.round(ah * S));
      const face = document.createElement("canvas"); face.width = W; face.height = H;
      const fc = face.getContext("2d")!;
      const sil = document.createElement("canvas"); sil.width = W; sil.height = H;
      const sc = sil.getContext("2d")!;
      sc.fillStyle = "#000"; sc.fillRect(0, 0, W, H); // أسود = فراغ، أبيض = محتوى
      const tint = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, color: string) => {
        const t = document.createElement("canvas"); t.width = Math.max(1, Math.round(w)); t.height = Math.max(1, Math.round(h));
        const tc = t.getContext("2d")!; tc.drawImage(img, 0, 0, t.width, t.height);
        tc.globalCompositeOperation = "source-in"; tc.fillStyle = color; tc.fillRect(0, 0, t.width, t.height);
        ctx.drawImage(t, x, y, w, h);
      };
      for (const l of layers) {
        const cx = (l.x / 100) * W, cy = (l.y / 100) * H;
        if (l.kind === "text") {
          const f = FONT_BY_ID[l.fontId] || FONT_BY_ID["cairo"];
          const fontPx = Math.max(6, l.heightCm * S);
          const color = s.faceCustomColor || (COL[s.faceColorId]?.hex || "#cccccc");
          const sx = l.stretchX ?? 1, sy = l.stretchY ?? 1;
          ([[fc, color], [sc, "#ffffff"]] as [CanvasRenderingContext2D, string][]).forEach(([ctx, col]) => {
            ctx.save(); ctx.translate(cx, cy); ctx.scale(sx, sy);
            ctx.font = `900 ${fontPx}px ${f.family}, Tajawal, Cairo, sans-serif`;
            ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = col;
            ctx.fillText(l.text || "النص", 0, 0); ctx.restore();
          });
        } else if (l.kind === "svg" || l.kind === "logo") {
          const img = await loadImg(l.src).catch(() => null); if (!img) continue;
          const wCm = l.widthCm, hCm = l.kind === "svg" ? l.widthCm * l.aspect : l.widthCm * 0.7;
          const wPx = wCm * S, hPx = hCm * S, x = cx - wPx / 2, y = cy - hPx / 2;
          const isTxt = l.kind === "svg" && l.aspect <= 0.5;
          const finish = isTxt ? (s.faceCustomColor || COL[s.faceColorId]?.hex) : (s.cFaceCustomColor || COL[s.cFaceColorId]?.hex);
          const useFinish = l.kind === "svg" && !(l as SvgLayer).originalColors && !!finish;
          if (useFinish) tint(fc, img, x, y, wPx, hPx, finish!);
          else fc.drawImage(img, x, y, wPx, hPx);
          tint(sc, img, x, y, wPx, hPx, "#ffffff");
        } else if (l.kind === "qr") {
          const sPx = l.sizeCm * S;
          const ox = cx - sPx / 2, oy = cy - sPx / 2;
          fc.fillStyle = "#fff"; fc.fillRect(ox, oy, sPx, sPx);
          sc.fillStyle = "#fff"; sc.fillRect(ox, oy, sPx, sPx);
          try {
            const qr = QRCode.create(l.value || "https://e3lani.com", { errorCorrectionLevel: "M" });
            const n = qr.modules.size, md = qr.modules.data, cell = sPx / (n + 2), pad = cell;
            fc.fillStyle = "#000";
            for (let yy = 0; yy < n; yy++) for (let xx = 0; xx < n; xx++) if (md[yy * n + xx]) fc.fillRect(ox + pad + xx * cell, oy + pad + yy * cell, cell + 0.6, cell + 0.6);
          } catch { /* تجاهل */ }
        }
      }
      return { face, sil };
    }
  };

  const [toast, setToast]       = useState<string | null>(null);
  const [importOpen, setImport] = useState(false);
  // نتيجة تحليل آخر ملف مرفوع — تُحسب في الخلفية ولا تظهر للعميل (مراجعة فنية للفريق)
  const analysisRef = useRef<SvgAnalysis | null>(null);
  // مجموعة آخر تصميم مستورد — لتعديل العرض الكلي (يتمدد كل العناصر متناسباً)
  const [importGroup, setImportGroup] = useState<{ ids: string[]; centerXcm: number; centerYcm: number; widthCm: number; heightCm: number } | null>(null);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [visitedSections, setVisitedSections] = useState<string[]>([]);
  const [ignoredRules, setIgnoredRules] = useState<string[]>([]);
  const [supTemplate, setSupTemplate] = useState<1 | 2>(1); // 1=نص فوق نص | 2=نصان جانبيان
  const [supContactType, setSupContactType] = useState<"هاتف" | "جوال">("جوال");
  const [confirmedSections, setConfirmedSections] = useState<string[]>([]);

  // ── خطة الاستخدام (مجانية / احترافية) ───────────────────────────────────
  const [plan, setPlan] = useState<"free" | "pro" | null>(null);
  const [planMounted, setPlanMounted] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("e3lani_plan") as "free" | "pro" | null;
    setPlan(stored ?? null);
    setPlanMounted(true);
  }, []);
  const choosePlan = (p: "free" | "pro") => {
    localStorage.setItem("e3lani_plan", p);
    if (p === "pro") localStorage.setItem("e3lani_revisions", "3");
    setPlan(p);
    if (p === "pro") setRevisions(3);
  };
  const isPro = () => plan === "pro";

  // ── حفظ المشاريع (للخطة المدفوعة فقط) ───────────────────────────────────
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveProjectName, setSaveProjectName] = useState("");

  // تحميل مشروع من URL عند الفتح
  useEffect(() => {
    const pid = new URLSearchParams(window.location.search).get("project");
    if (!pid) return;
    try {
      const all = JSON.parse(localStorage.getItem("e3lani_projects") || "[]") as SavedProject[];
      const found = all.find(p => p.id === pid);
      if (!found) return;
      setS(found.state);
      setLayers(found.layers);
      setCurrentProjectId(found.id);
      setSaveProjectName(found.name);
      setLastSaved(found.savedAt);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function doSaveProject(name: string) {
    const id = currentProjectId || ("proj_" + Date.now().toString(36));
    const now = Date.now();
    const project: SavedProject = { id, name, type: "raised-letters", state: s, layers, savedAt: now };
    try {
      const all: SavedProject[] = JSON.parse(localStorage.getItem("e3lani_projects") || "[]");
      const idx = all.findIndex(p => p.id === id);
      if (idx >= 0) all[idx] = project; else all.unshift(project);
      localStorage.setItem("e3lani_projects", JSON.stringify(all));
      setCurrentProjectId(id);
      setSaveProjectName(name);
      setLastSaved(now);
      // تحديث URL بمعرّف المشروع بدون إعادة تحميل الصفحة
      const url = new URL(window.location.href);
      url.searchParams.set("project", id);
      window.history.replaceState({}, "", url.toString());
    } catch { flash("تعذّر حفظ المشروع — تحقق من مساحة المتصفح."); }
    setSaveModalOpen(false);
  }

  // عداد التعديلات (٣ لكل تصميم مدفوع)
  const [revisions, setRevisions] = useState<number>(3);
  useEffect(() => {
    if (plan === "pro") {
      const stored = parseInt(localStorage.getItem("e3lani_revisions") ?? "3", 10);
      setRevisions(isNaN(stored) ? 3 : stored);
    }
  }, [plan]);
  const SECTION_ORDER = ["location", "dims", "material", "text", "light", "install"];
  const toggleSection = (id: string) => {
    setVisitedSections(p => p.includes(id) ? p : [...p, id]);
    setOpenSections(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };
  const visited = (id: string) => visitedSections.includes(id);
  const confirmed = (id: string) => confirmedSections.includes(id);
  // اعتماد المرحلة: تخزينها، إظهار علامة الصح، وفتح المرحلة التالية تلقائياً
  const confirmSection = (id: string) => {
    setVisitedSections(p => p.includes(id) ? p : [...p, id]);
    setConfirmedSections(p => p.includes(id) ? p : [...p, id]);
    const next = SECTION_ORDER[SECTION_ORDER.indexOf(id) + 1];
    setOpenSections(p => {
      const np = p.filter(x => x !== id);                       // إغلاق الحالية
      return next && !np.includes(next) ? [...np, next] : np;   // فتح التالية
    });
    flash(next ? "تم اعتماد المرحلة ✓ — انتقلنا للتالية" : "تم اعتماد المرحلة الأخيرة ✓");
  };

  const selLayer = layers.find(l => l.id === selectedId) ?? null;

  const fileRef  = useRef<HTMLInputElement>(null);
  const logoRef  = useRef<HTMLInputElement>(null);
  const logoRef2 = useRef<HTMLInputElement>(null);

  const area = s.mount === "background" ? { w: s.bgW, h: s.bgH } : { w: s.wallW, h: s.wallH };
  const faceType = TYPE_BY_ID[s.typeId] || SIGN_TYPES[0];   // خامة وجه النصوص
  const sideType = TYPE_BY_ID[s.sideMat] || SIGN_TYPES[0];  // خامة جوانب النصوص
  const cFaceType = TYPE_BY_ID[s.cTypeId] || SIGN_TYPES[0]; // خامة وجه اللوجوهات/المحتويات
  const cSideType = TYPE_BY_ID[s.cSideMat] || SIGN_TYPES[0];
  const type = faceType; // توافق مع الاستخدامات القائمة
  const faceColors = faceType.colors;                       // ألوان الوجه (لكل عنصر)
  // تصنيف: نص (نص حيّ أو جزء نصّي svg عريض قصير) أو لوجو/محتوى آخر
  const isTextLayer = (l: Layer) => l.kind === "text" || (l.kind === "svg" && l.aspect <= 0.5);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const addText  = () => { const id = uid(); setLayers(p => [...p, { kind: "text", id, text: "نص جديد", lang: "ar", fontId: "cairo", heightCm: 35, colorId: s.faceColorId, x: 50, y: 70, stretchX: 1, stretchY: 1 }]); setSelId(id); };
  const addLogo  = (src: string) => { const id = uid(); setLayers(p => [...p, { kind: "logo", id, src, widthCm: 40, x: 50, y: 30 }]); setSelId(id); };
  const addQR    = () => { const id = uid(); setLayers(p => [...p, { kind: "qr", id, value: "https://e3lani.com", sizeCm: 20, x: 78, y: 72 }]); setSelId(id); };
  const addShape = (shapeType: ShapeLayer["shapeType"]) => {
    const id = uid();
    const defaults: Record<ShapeLayer["shapeType"], { widthCm: number; heightCm: number }> = {
      rect:     { widthCm: 60, heightCm: 15 },
      circle:   { widthCm: 25, heightCm: 25 },
      line:     { widthCm: 80, heightCm: 1  },
      triangle: { widthCm: 30, heightCm: 20 },
    };
    setLayers(p => [...p, { kind: "shape", id, shapeType, colorHex: "#C9A24B", x: 50, y: 50, ...defaults[shapeType] }]);
    setSelId(id);
  };
  // إضافة محتوى من قائمة المحتويات المطلوبة (إجباري/اختياري)
  const addContentItem = (key: ContentReq["key"]) => {
    if (key === "qr")   return addQR();
    if (key === "logo") return logoRef2.current?.click();
    const id = uid();
    const presets: Record<string, { text: string; lang: string; fontId: string }> = {
      arname: { text: "اسم المنشأة", lang: "ar", fontId: s.establishmentType === "supermarket" ? "sukar" : "cairo" },
      enname: { text: "Brand Name", lang: "en", fontId: s.establishmentType === "supermarket" ? "sukar" : "montserrat" },
      phone:  { text: "0500000000", lang: "ar", fontId: "cairo" },
    };
    const pr = presets[key] || presets.arname;
    setLayers(p => [...p, { kind: "text", id, text: pr.text, lang: pr.lang, fontId: pr.fontId, heightCm: 30, colorId: s.faceColorId, x: 50, y: 50, stretchX: 1, stretchY: 1 }]);
    setSelId(id);
  };

  // ── استيراد من صورة السجل التجاري: قراءة QR (BarcodeDetector) + اسم المنشأة (OCR) ──
  const crRef = useRef<HTMLInputElement>(null);
  const [crBusy, setCrBusy] = useState(false);
  // استخراج الاسم التجاري من نص السجل (OCR أو طبقة PDF)
  const pickTradeName = (text: string): string | null => {
    const ENTITY = "مؤسسة|شركة|مصنع|متجر|محل|مجموعة|مكتب|مركز|مستشفى|صيدلية|مطعم|كافيه|مقهى|بقالة|تموينات|أسواق|سوبر ماركت";
    // عبارات معيارية في السجل تُستبعد
    const STOP = /(شهادة|البيانات الأساسية|وزارة التجارة|الرقم الوطني|رقم السجل|تاريخ|حالة السجل|نوع المكان|العنوان|النشاط|رأس المال|نشط|^السجل التجاري$)/;
    const isAr = (l: string) => /[؀-ۿ]/.test(l);
    const clean = (l: string) => l.replace(/[^؀-ۿ\s]/g, " ").replace(/\s+/g, " ").trim();
    const lines = text.split(/\n+/).map(l => clean(l)).filter(l => isAr(l) && l.length >= 4);
    // 1) بعد وسم «الاسم التجاري / اسم المنشأة»
    const labelIdx = lines.findIndex(l => /الاسم\s*التجار[يى]|اسم\s*المنشأة/.test(l));
    if (labelIdx >= 0) {
      const after = lines[labelIdx].replace(/.*?(الاسم\s*التجار[يى]|اسم\s*المنشأة)\s*[:：]?\s*/, "").trim();
      if (after.length >= 3 && !STOP.test(after)) return after;
      for (let i = labelIdx + 1; i < lines.length; i++) if (!STOP.test(lines[i])) return lines[i];
    }
    // 2) سطر يبدأ باسم كيان تجاري (مؤسسة/شركة/…)
    const ent = lines.find(l => new RegExp(`^(${ENTITY})\\s+\\S`).test(l) && !STOP.test(l));
    if (ent) return ent;
    // 3) أطول سطر عربي ليس عبارة معيارية
    const cand = lines.filter(l => !STOP.test(l)).sort((a, b) => b.length - a.length);
    return cand[0] || null;
  };
  // رفض النتائج المشوّهة (OCR رديء) حتى لا يُكتب نص غير مفهوم
  const isPlausibleName = (n: string | null): boolean => {
    if (!n) return false;
    const toks = n.split(/\s+/).filter(Boolean);
    const longToks = toks.filter(t => t.length >= 3);
    const diac = (n.match(/[ً-ْ]/g) || []).length;       // تشكيل زائد = إشارة تشويه
    const oneChar = toks.filter(t => t.length === 1).length;
    return toks.length >= 2 && longToks.length >= 1 && diac <= Math.ceil(n.length * 0.12) && oneChar <= toks.length * 0.4;
  };
  const handleCR = async (file: File) => {
    setCrBusy(true);
    flash("جارٍ قراءة السجل التجاري…");
    let qrVal: string | null = null, name: string | null = null;
    try {
      // المصدر: السجل غالباً PDF → نرسم الصفحة الأولى ونستخرج نصها؛ وإلا صورة
      const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      let src: CanvasImageSource | null = null, srcW = 0, srcH = 0, pdfText = "", revoke: string | null = null;
      if (isPdf) {
        const r = await pdfFileToCanvas(file, 2800);
        if (r) { src = r.canvas; srcW = r.canvas.width; srcH = r.canvas.height; pdfText = r.texts.map(t => t.str).join("\n"); }
      } else {
        const url = URL.createObjectURL(file); revoke = url;
        const img = await loadImg(url); src = img; srcW = img.naturalWidth; srcH = img.naturalHeight;
      }
      if (src) {
        // 1) قراءة QR — BarcodeDetector الأصلي، ثم jsQR كبديل (كلاهما يقبل canvas/img)
        try {
          const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
          if (BD) { const codes = await new BD({ formats: ["qr_code"] }).detect(src); if (codes.length) qrVal = codes[0].rawValue; }
        } catch { /* تجاهل */ }
        if (!qrVal) {
          try {
            await loadScript("https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js");
            const jsQR = (window as unknown as { jsQR?: (d: Uint8ClampedArray, w: number, h: number) => { data: string } | null }).jsQR;
            if (jsQR) {
              const cv = document.createElement("canvas");
              const sc = Math.min(1600, srcW) / Math.max(1, srcW);
              cv.width = Math.round(srcW * sc); cv.height = Math.round(srcH * sc);
              const cx = cv.getContext("2d"); if (cx) { cx.drawImage(src, 0, 0, cv.width, cv.height); const d = cx.getImageData(0, 0, cv.width, cv.height); const r = jsQR(d.data, cv.width, cv.height); if (r?.data) qrVal = r.data; }
            }
          } catch { /* تجاهل */ }
        }
        // 2) الاسم — Google Vision أولاً (الأدق للمستندات)، ثم نص الـ PDF، ثم Tesseract
        try {
          const cv = document.createElement("canvas");
          const sc = Math.min(1, 2000 / Math.max(1, srcW));
          cv.width = Math.round(srcW * sc); cv.height = Math.round(srcH * sc);
          const cx = cv.getContext("2d");
          if (cx) {
            cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(src, 0, 0, cv.width, cv.height);
            const dataUrl = cv.toDataURL("image/jpeg", 0.92);
            const res = await fetch("/api/ocr/cr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: dataUrl }) });
            if (res.ok) { const j = await res.json(); const c = pickTradeName(j.text || ""); if (isPlausibleName(c)) name = c; }
          }
        } catch { /* Vision غير متاح */ }
        if (!name && pdfText) { const c0 = pickTradeName(pdfText); if (isPlausibleName(c0)) name = c0; }
        if (!name) {
          try {
            await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js");
            const T = (window as unknown as { Tesseract?: { createWorker: (lang: string, oem?: number, opts?: Record<string, string>) => Promise<{ recognize: (i: CanvasImageSource) => Promise<{ data: { text: string } }>; terminate: () => Promise<void> }> } }).Tesseract;
            if (T) {
              const worker = await T.createWorker("ara", 1, {
                workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js",
                corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core-simd.wasm.js",
                langPath: "https://cdn.jsdelivr.net/npm/@tesseract.js-data/ara@1.0.0/4.0.0_best_int",
              });
              // معالجة مسبقة للصورة: تدرّج رمادي + عتبة (binarize) — يرفع دقة OCR العربي على المستندات الملوّنة
              const oc = document.createElement("canvas"); oc.width = srcW; oc.height = srcH;
              const octx = oc.getContext("2d");
              let ocrSrc: CanvasImageSource = src;
              if (octx) {
                octx.drawImage(src, 0, 0, srcW, srcH);
                const im = octx.getImageData(0, 0, srcW, srcH);
                const d = im.data;
                for (let i = 0; i < d.length; i += 4) { const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; const v = g < 155 ? 0 : 255; d[i] = d[i + 1] = d[i + 2] = v; }
                octx.putImageData(im, 0, 0); ocrSrc = oc;
              }
              const { data } = await worker.recognize(ocrSrc);
              await worker.terminate();
              const cand = pickTradeName(data.text || "");
              name = isPlausibleName(cand) ? cand : null;
            }
          } catch { /* OCR غير متاح */ }
        }
      }
      if (revoke) URL.revokeObjectURL(revoke);
    } catch { /* تعذّر فتح الملف */ }

    // تطبيق النتائج على التصميم — مع ضبط ارتفاع الاسم ليتّسع داخل عرض الخلفية
    if (name) {
      const fontId = s.establishmentType === "supermarket" ? "sukar" : "cairo";
      const boardW = s.mount === "background" ? s.bgW : s.wallW;
      const boardH = s.mount === "background" ? s.bgH : s.wallH;
      // تقدير الارتفاع من عدد الأحرف (موثوق دون اعتماد على تحميل الخط):
      // عرض النص ≈ 0.58 × عدد الأحرف × الارتفاع → نحلّ للارتفاع ليتّسع ضمن العرض المتاح
      const L = Math.max(4, name.trim().replace(/\s+/g, " ").length);
      const maxW = boardW * 0.86;   // هوامش جانبية
      const maxH = boardH * 0.62;   // ارتفاع أكبر بعد إزالة النص الافتراضي
      const fitH = Math.max(10, Math.min(Math.round(maxW / (0.58 * L)), Math.round(maxH), 150));
      setLayers(prev => {
        // إزالة النصوص الافتراضية (العنوان «إعلاني» والسطر الفرعي «tag») — يبقى اسم المنشأة فقط
        const cleaned = prev.filter(l => l.id !== "tag" && l.id !== "main");
        return [...cleaned, { kind: "text", id: "main", text: name!, lang: "ar", fontId, heightCm: fitH, colorId: "white", x: 50, y: 50, stretchX: 1, stretchY: 1 }];
      });
    }
    if (qrVal) setLayers(prev => prev.some(l => l.kind === "qr") ? prev.map(l => l.kind === "qr" ? { ...l, value: qrVal! } : l) : [...prev, { kind: "qr", id: uid(), value: qrVal!, sizeCm: 18, x: 80, y: 72 }]);
    setCrBusy(false);
    if (name) flash(`تم الاستخراج — الاسم: ${name}${qrVal ? " + رمز QR" : ""}`);
    else if (qrVal) flash("أُضيف رمز QR من السجل — تعذّرت قراءة الاسم بوضوح، اكتبه يدوياً في خطوة «النص والشعار».");
    else flash("تعذّر استخراج البيانات — تأكد من وضوح الملف أو أدخل البيانات يدوياً.");
  };
  // إنشاء طبقة تصميم من نتيجة تحليل SVG
  const addParsedLayer = (parsed: { src: string; aspect: number; perimScale: number }, name: string, msg: string) => {
    const id = uid();
    const widthCm = Math.round(Math.min(120, area.w * 0.6));
    // استبدل المحتوى (أزل النص الافتراضي) بالتصميم المرفوع
    setLayers([{ kind: "svg", id, src: parsed.src, name, widthCm, aspect: parsed.aspect, perimScale: parsed.perimScale, x: 50, y: 50 }]);
    setSelId(id);
    set({ uploadName: name });
    flash(msg);
  };
  // تحويل canvas إلى طبقات منفصلة: كل شعار/رسم متصل → عنصر مستقل في موضعه الصحيح
  // place اختياري: لتوحيد المقياس والموضع مع باقي عناصر التصميم (استيراد PDF بأبعاد حقيقية)
  const canvasToLayers = async (canvas: HTMLCanvasElement, fileName: string,
      place?: { cmPerPx: number; leftCm: number; topCm: number; areaW: number; areaH: number }): Promise<Layer[]> => {
    const cmPerPx = place ? place.cmPerPx : Math.min(120, area.w * 0.6) / canvas.width;
    const Hcm = canvas.height * cmPerPx;
    const leftCm = place ? place.leftCm : area.w / 2 - (canvas.width * cmPerPx) / 2;
    const topCm  = place ? place.topCm  : area.h / 2 - Hcm / 2;
    // أبعاد اللوحة الفعلية (قد تكون موسّعة عند استيراد تصميم أكبر) — لحساب النِسَب
    const aW = place ? place.areaW : area.w, aH = place ? place.areaH : area.h;
    // 1) احذف الإطار وخطوط التقسيم — لا تدخل في القص وتفصل الشعارات عن بعضها
    try { eraseFrameLines(canvas); } catch (e) { console.warn("frame erase failed:", e); }
    // 2) اعزل كل شعار/رمز ككتلة مستقلة
    // تقسيم منطقي (XY-cut) يفصل اللوجو والأسطر؛ تراجع لمكونات BFS إن لم ينتج شيئاً
    let clusters = xyCutSegments(canvas, cmPerPx);
    if (clusters.length < 1) clusters = segmentCanvas(canvas);
    // حماية من التقسيم المرضي: إن تجاوز 24 كتلة فالتصميم معقّد → عنصر واحد
    if (clusters.length > 24) clusters = [{ x: 0, y: 0, w: canvas.width, h: canvas.height }];
    const out: Layer[] = [];
    let n = 0;
    for (const cl of clusters) {
      try {
        // تجاهل بقايا الإطار: كتلة ضخمة حبرها على المحيط فقط (مجوّفة)
        if (cl.w > canvas.width * 0.7 && cl.h > canvas.height * 0.7 && clusters.length > 1) continue;
        const sub = document.createElement("canvas");
        sub.width = cl.w; sub.height = cl.h;
        const sctx = sub.getContext("2d")!;
        sctx.fillStyle = "#fff"; sctx.fillRect(0, 0, cl.w, cl.h);
        sctx.drawImage(canvas, cl.x, cl.y, cl.w, cl.h, 0, 0, cl.w, cl.h);
        const parsed = await parseSvgText(stripLightBg(await rasterToSvgText(sub)));
        if (!parsed) continue;
        const b = parsed.bbox ?? { x: 0, y: 0, w: cl.w, h: cl.h };
        if (b.w * cmPerPx < 1.5 || b.h * cmPerPx < 1.5) continue;
        n++;
        out.push({ kind: "svg", id: uid(), src: parsed.src,
          name: clusters.length === 1 ? fileName : `شعار ${n}`, originalColors: true,
          widthCm: Math.max(2, Math.round(b.w * cmPerPx)), aspect: b.h / b.w, perimScale: parsed.perimScale,
          x: (leftCm + (cl.x + b.x + b.w / 2) * cmPerPx) / aW * 100,
          y: (topCm + (cl.y + b.y + b.h / 2) * cmPerPx) / aH * 100 });
      } catch (e) { console.warn("cluster trace failed:", e); }
    }
    return out;
  };
  // المسار اليدوي: ملف غير قابل للقراءة آلياً
  const manualReview = (name: string) => {
    set({ uploadName: name });
    flash("سيراجع فريقنا الملف ويتواصل معك بالسعر النهائي");
  };
  // تحليل خلفي صامت لأي ملف مرفوع — لا يظهر للعميل، مراجعة فنية للفريق فقط
  // (يكشف: نقطي لا متجه، DPI منخفض، أحجام غير منطقية…)
  const runBackgroundAnalysis = async (svg: string, name: string) => {
    try {
      const res = await analyzeSvgString(svg);
      analysisRef.current = res;
      if (res.ok && (res.summary.errors > 0 || res.summary.warnings > 0)) {
        const flat = [...res.issues, ...res.elements.flatMap(e => e.issues)];
        console.info(`[تحليل التصميم «${name}»] أخطاء: ${res.summary.errors} · تحذيرات: ${res.summary.warnings} —`,
          flat.map(i => i.message).join(" | "));
      }
    } catch { /* تحليل خلفي — لا يؤثر على تجربة العميل */ }
  };
  // يلفّ canvasاً مرسوماً في غلاف SVG نقطي بأبعاده المادية — لقياس DPI/الحجم خلفياً
  const canvasToProbeSvg = (canvas: HTMLCanvasElement, widthCm: number): string => {
    const hCm = (canvas.height / canvas.width) * widthCm;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${widthCm}cm" height="${hCm}cm" viewBox="0 0 ${canvas.width} ${canvas.height}">` +
      `<image href="${canvas.toDataURL("image/png")}" x="0" y="0" width="${canvas.width}" height="${canvas.height}"/></svg>`;
  };

  // معالجة أي ملف مرفوع (مثل cadout: فحص → تحويل → قص → تسعير)
  const handleUploadFile = async (f: File) => {
    // التحقق من حجم الملف قبل أي معالجة
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
      flash(`حجم الملف ${(f.size / 1024 / 1024).toFixed(1)} ميجابايت يتجاوز الحد الأقصى (${MAX_UPLOAD_MB} ميجابايت)`);
      return;
    }
    try {
      if (/\.svg$/i.test(f.name)) {
        const svgText = await f.text().catch(() => "");
        if (svgText) runBackgroundAnalysis(svgText, f.name); // تحليل خلفي صامت
        const parsed = await parseSvgFile(f);
        if (parsed) { addParsedLayer(parsed, f.name, `تمت قراءة «${f.name}» — اسحبه وغيّر مقاسه والسعر يتحدث تلقائياً`); return; }
      } else if (/\.(png|jpe?g|webp)$/i.test(f.name)) {
        flash("جارٍ تحويل الصورة إلى مسارات قص…");
        const canvas = await fileToCanvas(f);
        runBackgroundAnalysis(canvasToProbeSvg(canvas, Math.min(120, area.w * 0.6)), f.name); // فحص DPI/نقطي خلفياً
        const gLayers = await canvasToLayers(canvas, f.name);
        if (gLayers.length) {
          setLayers(gLayers); // استبدل المحتوى (أزل النص الافتراضي)
          setSelId(gLayers[0].id);
          set({ uploadName: f.name });
          flash(gLayers.length > 1
            ? `تم فصل ${gLayers.length} عناصر من «${f.name}» — كل عنصر مستقل بالتحريك والتسعير`
            : `تم تحويل «${f.name}» إلى مسارات قص — السعر يتحدث تلقائياً`);
          return;
        }
      } else if (/\.(pdf|ai)$/i.test(f.name)) {
        flash("جارٍ قراءة الملف واستخراج النصوص…");
        const ext = await pdfFileToCanvas(f);
        if (ext) {
          const { canvas, texts } = ext;
          const lines = groupPdfTexts(texts);
          runBackgroundAnalysis(canvasToProbeSvg(canvas, ext.widthCm), f.name); // فحص DPI/الحجم خلفياً
          // المقياس الحقيقي من نقاط الـ PDF (سم لكل بكسل)
          const cmPerPx = ext.widthCm / canvas.width;
          // كشف الإطار المرسوم على الصورة الأصلية (قبل مسح الخطوط)
          const frame = detectFrameBox(canvas);
          // أزل حدّ الصفحة/الإطار حتى لا يدخل في قياس المحتوى ولا في التقسيم
          try { eraseFrameLines(canvas); } catch (e) { console.warn("frame erase failed:", e); }
          const cb = contentBBox(canvas);
          const contentWcm = (cb.w || canvas.width) * cmPerPx;
          const contentHcm = (cb.h || canvas.height) * cmPerPx;
          const designColor = dominantColor(canvas); // لون التصميم الأصلي السائد
          // هل صفحة الـ PDF ملتصقة بالمحتوى (مقصوصة بإحكام، بلا هوامش)؟
          const fillW = contentWcm / Math.max(1, ext.widthCm), fillH = contentHcm / Math.max(1, ext.heightCm);
          const tightCrop = fillW > 0.9 && fillH > 0.9;
          // صندوق اللوحة (بكسل):
          //  1) إطار مرسوم → حدوده · 2) صفحة لها هوامش → الصفحة كاملة (أبعادها الحقيقية)
          //  3) مقصوصة بإحكام → المحتوى + هامش 10% (مقاس مفترض لا يُسعّر)
          const boardPx = frame
            ? frame
            : !tightCrop
              ? { x: 0, y: 0, w: canvas.width, h: canvas.height }
              : { x: cb.x - cb.w * 0.1, y: cb.y - cb.h * 0.1, w: cb.w * 1.2, h: cb.h * 1.2 };
          const eff = { w: Math.max(20, Math.round(boardPx.w * cmPerPx)), h: Math.max(20, Math.round(boardPx.h * cmPerPx)) };
          // أصل الإحداثيات = زاوية صندوق اللوحة
          const leftCm = -boardPx.x * cmPerPx, topCm = -boardPx.y * cmPerPx;
          // العمق الافتراضي يتناسب مع مقاس اللوحة (كلما كبرت زاد العمق)
          const { bgD: autoBgD, letterDepthCm: autoLetterD } = suitableDepths(Math.max(eff.w, eff.h));
          const assumed = !frame && tightCrop; // مقاس مفترض (لا يُسعّر) فقط عند القص المُحكم
          if (assumed) {
            // مقاس مفترض لمنطقة الرسم فقط · تركيب جداري بلا خلفية · التسعير على مساحة المحتوى
            set({ mount: "wall", bgW: eff.w, bgH: eff.h, wallW: eff.w, wallH: eff.h,
              bgAssumed: true, signW: Math.round(contentWcm), signH: Math.round(contentHcm),
              bgD: autoBgD, letterDepthCm: autoLetterD });
          } else {
            // إطار أو صفحة حقيقية = حدود اللوحة → خلفية تُسعّر، ويتطابق المقاس في الوضعين
            set({ mount: "background", bgMode: "add", bgW: eff.w, bgH: eff.h, wallW: eff.w, wallH: eff.h,
              bgAssumed: false, signW: eff.w, signH: eff.h,
              bgD: autoBgD, letterDepthCm: autoLetterD });
          }
          const newLayers: Layer[] = [];

          // تحقق بصري: جرّب ترتيبات النص العربية واعتمد الأقرب لشكله في التصميم؛
          // ما لا يطابق يبقى في الصورة ويُقتطع كرسومات بمساراته الأصلية
          const vctx = canvas.getContext("2d")!;
          const verified: (PdfText & { colorId?: string })[] = [];
          for (const t of lines) {
            const rx = Math.max(0, Math.floor(t.xPx - 3));
            const ry = Math.max(0, Math.floor(t.basePx - t.hPx * 1.15));
            const rw = Math.min(canvas.width - rx, Math.ceil(t.wPx + 6));
            const rh = Math.min(canvas.height - ry, Math.ceil(t.hPx * 1.5));
            if (rw < 2 || rh < 2) continue;
            const region = vctx.getImageData(rx, ry, rw, rh);
            const best = pickBestTextCandidate(region, t);
            if (best.score >= 0.3) {
              // لون النص كما في التصميم: أقرب لون من اللوحة للون الحبر الفعلي
              verified.push({ ...t, str: best.str, colorId: regionColorId(region) });
              vctx.fillStyle = "#fff";
              vctx.fillRect(rx, ry, rw, rh); // يُمسح من الرسومات ويصبح نصاً حياً
            } else {
              // نص تالف الترميز في الملف (يتعذر التحقق): يُقتطع سطره كقطعة واحدة
              // بمساراته الأصلية — حتى لا يفككه مقسّم الرسومات إلى أجزاء
              try {
                const sub = document.createElement("canvas");
                sub.width = rw; sub.height = rh;
                sub.getContext("2d")!.putImageData(region, 0, 0);
                const parsed = await parseSvgText(stripLightBg(await rasterToSvgText(sub)));
                if (parsed) {
                  const b = parsed.bbox ?? { x: 0, y: 0, w: rw, h: rh };
                  if (b.w * cmPerPx >= 1.5 && b.h * cmPerPx >= 1.5) {
                    newLayers.push({ kind: "svg", id: uid(), src: parsed.src,
                      name: "نص (كما بالتصميم)", originalColors: true,
                      widthCm: Math.max(2, Math.round(b.w * cmPerPx)), aspect: b.h / b.w, perimScale: parsed.perimScale,
                      x: (leftCm + (rx + b.x + b.w / 2) * cmPerPx) / eff.w * 100,
                      y: (topCm + (ry + b.y + b.h / 2) * cmPerPx) / eff.h * 100 });
                    vctx.fillStyle = "#fff";
                    vctx.fillRect(rx, ry, rw, rh); // أُخذ كقطعة واحدة — لا يدخل التقسيم العام
                  }
                }
              } catch (e) { console.warn("text-as-graphic failed:", e); }
            }
          }

          // الرسومات (+ النصوص غير المطابقة ضمنها) → عناصر منفصلة بنفس المقياس الحقيقي
          newLayers.push(...await canvasToLayers(canvas, f.name, { cmPerPx, leftCm, topCm, areaW: eff.w, areaH: eff.h }));

          // النصوص المتحقق منها → كل سطر/جملة عنصر نص واحد قابل للتعديل
          verified.forEach(t => {
            const hCm = Math.max(4, Math.round(t.hPx * cmPerPx));
            const isAr = /[؀-ۿ]/.test(t.str);
            newLayers.push({ kind: "text", id: uid(), text: t.str,
              lang: isAr ? "ar" : "en",
              fontId: isAr ? "cairo" : (FONTS_EN[0]?.id ?? "cairo"),
              heightCm: hCm, colorId: t.colorId ?? s.faceColorId,
              x: (leftCm + (t.xPx + t.wPx / 2) * cmPerPx) / eff.w * 100,
              y: (topCm + (t.basePx - t.hPx * 0.4) * cmPerPx) / eff.h * 100,
              stretchX: 1, stretchY: 1 });
          });

          if (newLayers.length) {
            // تحديد الخامة الافتراضية حسب لون التصميم:
            //  ذهبي/فضي → ستانلس ستيل بلونه المعدني · ملوّن → زنكور بلون التصميم الأصلي
            const metal = metallicMatch(designColor);
            if (metal) {
              setLayers(newLayers.map(l => l.kind === "svg" ? { ...l, originalColors: false } : l));
              // المجموعتان (نصوص + لوجوهات/محتويات) تبدآن بنفس الخامة المعدنية
              set({ uploadName: f.name,
                typeId: "stainless", sideMat: "stainless", faceColorId: metal, sideColorId: metal, faceCustomColor: "", sideCustomColor: "",
                cTypeId: "stainless", cSideMat: "stainless", cFaceColorId: metal, cSideColorId: metal, cFaceCustomColor: "", cSideCustomColor: "",
                uniMatText: true, uniMatContent: true, faceBorder: false, coloredDesign: false });
            } else {
              setLayers(newLayers); // originalColors: true — يحتفظ بألوانه
              // لون الجوانب الافتراضي = لون الوجه (لون التصميم) — لكلتا المجموعتين
              set({ uploadName: f.name,
                typeId: "zincor", sideMat: "zincor", faceCustomColor: designColor || "", sideCustomColor: designColor || "",
                cTypeId: "zincor", cSideMat: "zincor", cFaceCustomColor: designColor || "", cSideCustomColor: designColor || "",
                uniMatText: true, uniMatContent: true, faceBorder: false, coloredDesign: true });
            }
            setSelId(newLayers[0].id);
            // سجّل مجموعة الاستيراد لتمكين تعديل العرض الكلي لاحقاً (مركزها = مركز المحتوى على اللوحة)
            const cCenterX = leftCm + (cb.x + cb.w / 2) * cmPerPx, cCenterY = topCm + (cb.y + cb.h / 2) * cmPerPx;
            setImportGroup({ ids: newLayers.map(l => l.id), centerXcm: cCenterX, centerYcm: cCenterY, widthCm: contentWcm, heightCm: contentHcm });
            const cnt = newLayers.length;
            const sizeNote = frame
              ? `اللوحة = الإطار المرسوم ${eff.w}×${eff.h} سم`
              : assumed
                ? `مقاس منطقة الرسم ${eff.w}×${eff.h} سم (مفترض — لا يدخل التسعير)`
                : `أبعاد اللوحة الحقيقية ${eff.w}×${eff.h} سم`;
            flash(`تم فصل ${cnt} ${cnt <= 2 ? "عنصرين" : "عناصر"} من «${f.name}» · ${sizeNote}`);
            return;
          }
        }
      }
    } catch (e) { console.warn("upload processing failed:", e); }
    manualReview(f.name);
  };
  const updateLayer = (id: string, patch: Partial<Layer>) => setLayers(p => p.map(l => l.id === id ? { ...l, ...patch } as Layer : l));
  const deleteLayer = (id: string) => { setLayers(p => p.filter(l => l.id !== id)); setSelId(cur => cur === id ? null : cur); setMergeSel(p => p.filter(x => x !== id)); };
  // عند تغيير العميل لخامة/لون الوجه: تتبع كل التصاميم لون التشطيب (بدل ألوانها الأصلية)
  // تطبيق التشطيب على تصاميم المجموعة فقط: "text" = أجزاء النص (aspect<=0.5)، "content" = اللوجوهات (aspect>0.5)
  const applyFinishToDesigns = (grp: "text" | "content" = "text") => {
    setLayers(p => p.map(l => {
      if (l.kind !== "svg") return l;
      const isTxt = l.aspect <= 0.5;
      if ((grp === "text") === isTxt) return { ...l, originalColors: false, colorId: undefined };
      return l;
    }));
  };

  // ─── تراجع (Undo): سجلّ لقطات الطبقات، يجمع تغييرات السحب المتتابعة في خطوة واحدة ──
  const undoStack = useRef<Layer[][]>([]);
  const prevLayers = useRef<Layer[]>(layers);
  const lastSnap = useRef(0);
  const undoing = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  useEffect(() => {
    if (undoing.current) { undoing.current = false; prevLayers.current = layers; return; }
    if (prevLayers.current === layers) return;
    const now = Date.now();
    if (now - lastSnap.current > 500) { // تجميع التغييرات السريعة (السحب) في خطوة واحدة
      undoStack.current.push(prevLayers.current);
      if (undoStack.current.length > 60) undoStack.current.shift();
      setCanUndo(true);
    }
    lastSnap.current = now;
    prevLayers.current = layers;
  }, [layers]);
  const undo = () => {
    if (!undoStack.current.length) return;
    const prev = undoStack.current.pop()!;
    undoing.current = true;
    setLayers(prev);
    setSelId(null); setMergeSel([]);
    setCanUndo(undoStack.current.length > 0);
    flash("تم التراجع");
  };

  // ─── أداة الدمج والفصل اليدوية (تحسم ما يتعذّر فصله/دمجه آلياً) ───────────────
  const [mergeSel, setMergeSel] = useState<string[]>([]);
  const [mergeMode, setMergeMode] = useState(false);
  // مجموعة الخامة النشطة في الواجهة: النصوص أو اللوجوهات/المحتويات
  const [matGroup, setMatGroup] = useState<"text" | "content">("text");
  // محوّلات قراءة/كتابة حقول المجموعة النشطة (text → الحقول العادية، content → الحقول بادئة c)
  const isText = matGroup === "text";
  const MG = isText
    ? { typeId: s.typeId, sideMat: s.sideMat, faceColorId: s.faceColorId, sideColorId: s.sideColorId, faceCustomColor: s.faceCustomColor, sideCustomColor: s.sideCustomColor, faceType, sideType }
    : { typeId: s.cTypeId, sideMat: s.cSideMat, faceColorId: s.cFaceColorId, sideColorId: s.cSideColorId, faceCustomColor: s.cFaceCustomColor, sideCustomColor: s.cSideCustomColor, faceType: cFaceType, sideType: cSideType };
  // كتابة قيمة لحقل مجرّد على المجموعة النشطة
  const MGKEY: Record<string, [string, string]> = {
    typeId: ["typeId", "cTypeId"], sideMat: ["sideMat", "cSideMat"],
    faceColorId: ["faceColorId", "cFaceColorId"], sideColorId: ["sideColorId", "cSideColorId"],
    faceCustomColor: ["faceCustomColor", "cFaceCustomColor"], sideCustomColor: ["sideCustomColor", "cSideCustomColor"],
  };
  const setMG = (patch: Record<string, unknown>) => {
    const out: Record<string, unknown> = {};
    for (const k in patch) { const m = MGKEY[k]; out[m ? m[isText ? 0 : 1] : k] = patch[k]; }
    set(out as Partial<AppState>);
  };
  const toggleMerge = (id: string) => setMergeSel(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const setMergeModeWrap = (v: boolean) => { setMergeMode(v); if (!v) setMergeSel([]); };
  // هل خامة الوجه = الجوانب للمجموعة النشطة؟
  const uni = isText ? s.uniMatText : s.uniMatContent;
  // الكنتور (الإطار حول الأحرف) متاح فقط لوجه أكريلك وجوانب ستانلس أو زنكور (لا الألمنيوم)
  const frameEligible = s.typeId === "acrylic" && (s.sideMat === "stainless" || s.sideMat === "zincor");
  // تبديل التوحيد: عند التفعيل نُساوي الجوانب بالوجه؛ نوقف الإطار عند التوحيد
  const setUni = (v: boolean) => {
    if (v) setMG({ sideMat: MG.typeId, sideColorId: MG.faceColorId, sideCustomColor: MG.faceCustomColor });
    set({ [isText ? "uniMatText" : "uniMatContent"]: v, ...(v && isText ? { faceBorder: false } : {}) } as Partial<AppState>);
  };
  // أبعاد طبقة صورية بالسنتيمتر (عرض×ارتفاع) ومركزها
  const imgBox = (l: SvgLayer | LogoLayer) => {
    const w = l.widthCm, h = l.kind === "svg" ? l.widthCm * l.aspect : l.widthCm * 0.7;
    const cx = (l.x / 100) * area.w, cy = (l.y / 100) * area.h;
    return { left: cx - w / 2, top: cy - h / 2, w, h };
  };
  // دمج عناصر صورية محددة في عنصر واحد (يحافظ على مواضعها النسبية)
  const mergeLayers = async () => {
    const sel = layers.filter(l => mergeSel.includes(l.id) && (l.kind === "svg" || l.kind === "logo" || l.kind === "text"));
    if (sel.length < 2) { flash("اختر عنصرين أو أكثر للدمج"); return; }
    flash("جارٍ دمج العناصر…");
    const PXCM = 6;
    // صندوق كل عنصر + مصدر رسمه (نص يُرستر، صورة/لوجو تُحمَّل)
    const drawn = await Promise.all(sel.map(async l => {
      if (l.kind === "text") {
        const tr = textRaster(l as TextLayer);
        const cx = (l.x / 100) * area.w, cy = (l.y / 100) * area.h;
        return { left: cx - tr.wCm / 2, top: cy - tr.hCm / 2, w: tr.wCm, h: tr.hCm, img: tr.canvas as CanvasImageSource };
      }
      const b = imgBox(l as SvgLayer | LogoLayer);
      const img = await loadImg((l as SvgLayer | LogoLayer).src).catch(() => null);
      return img ? { left: b.left, top: b.top, w: b.w, h: b.h, img: img as CanvasImageSource } : null;
    }));
    const boxes = drawn.filter(Boolean) as { left: number; top: number; w: number; h: number; img: CanvasImageSource }[];
    if (boxes.length < 2) { flash("تعذّر دمج العناصر"); return; }
    const minX = Math.min(...boxes.map(b => b.left)), minY = Math.min(...boxes.map(b => b.top));
    const maxX = Math.max(...boxes.map(b => b.left + b.w)), maxY = Math.max(...boxes.map(b => b.top + b.h));
    const Wcm = Math.max(1, maxX - minX), Hcm = Math.max(1, maxY - minY);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(Wcm * PXCM)); canvas.height = Math.max(1, Math.round(Hcm * PXCM));
    const ctx = canvas.getContext("2d")!; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const b of boxes) {
      ctx.drawImage(b.img, (b.left - minX) * PXCM, (b.top - minY) * PXCM, b.w * PXCM, b.h * PXCM);
    }
    try {
      const parsed = await parseSvgText(stripLightBg(await rasterToSvgText(canvas)));
      if (!parsed) { flash("تعذّر دمج العناصر"); return; }
      const bb = parsed.bbox ?? { x: 0, y: 0, w: canvas.width, h: canvas.height };
      const newW = bb.w / PXCM, newH = bb.h / PXCM;
      const cx = minX + (bb.x + bb.w / 2) / PXCM, cy = minY + (bb.y + bb.h / 2) / PXCM;
      const id = uid();
      setLayers(p => [...p.filter(l => !mergeSel.includes(l.id)),
        { kind: "svg", id, src: parsed.src, name: "عنصر مدموج", widthCm: Math.max(2, Math.round(newW)), aspect: newH / Math.max(1, newW), perimScale: parsed.perimScale, x: (cx / area.w) * 100, y: (cy / area.h) * 100 }]);
      setSelId(id); setMergeSel([]);
      flash(`تم دمج ${sel.length} عناصر في عنصر واحد`);
    } catch { flash("تعذّر دمج العناصر"); }
  };
  // فصل عنصر صوري عند أكبر فجوة (عمودية أو أفقية) إلى جزأين أو أكثر
  const splitLayer = async (id: string) => {
    const l = layers.find(x => x.id === id);
    if (!l || (l.kind !== "svg" && l.kind !== "logo" && l.kind !== "text")) { flash("اختر عنصراً (نص أو صورة) لفصله"); return; }
    flash("جارٍ فصل العنصر…");
    const PXCM = 8;
    let canvas: HTMLCanvasElement, left: number, top: number;
    if (l.kind === "text") {
      const tr = textRaster(l);
      canvas = tr.canvas; // أسود على أبيض بمقياس PXCM=8
      const cx = (l.x / 100) * area.w, cy = (l.y / 100) * area.h;
      left = cx - tr.wCm / 2; top = cy - tr.hCm / 2;
    } else {
      const b = imgBox(l); left = b.left; top = b.top;
      const img = await loadImg(l.src).catch(() => null);
      if (!img) { flash("تعذّر فصل العنصر"); return; }
      canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(b.w * PXCM)); canvas.height = Math.max(1, Math.round(b.h * PXCM));
      const ctx = canvas.getContext("2d")!; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    // فصل عند أكبر فجوة بيضاء (عمودية أو أفقية) — للفصل اليدوي نتجاوز العتبات
    const boxes = splitAtLargestGap(canvas);
    if (boxes.length < 2) { flash("لا توجد فجوة واضحة لفصل هذا العنصر"); return; }
    const subs: Layer[] = [];
    for (const s of boxes) {
      try {
        const sub = document.createElement("canvas"); sub.width = s.w; sub.height = s.h;
        const sctx = sub.getContext("2d")!; sctx.fillStyle = "#fff"; sctx.fillRect(0, 0, s.w, s.h);
        sctx.drawImage(canvas, s.x, s.y, s.w, s.h, 0, 0, s.w, s.h);
        const parsed = await parseSvgText(stripLightBg(await rasterToSvgText(sub)));
        if (!parsed) continue;
        const bb = parsed.bbox ?? { x: 0, y: 0, w: s.w, h: s.h };
        const ccx = left + (s.x + bb.x + bb.w / 2) / PXCM, ccy = top + (s.y + bb.y + bb.h / 2) / PXCM;
        subs.push({ kind: "svg", id: uid(), src: parsed.src, name: "جزء", widthCm: Math.max(2, Math.round(bb.w / PXCM)), aspect: bb.h / Math.max(1, bb.w), perimScale: parsed.perimScale, x: (ccx / area.w) * 100, y: (ccy / area.h) * 100 });
      } catch { /* تجاهل الجزء الفاشل */ }
    }
    if (subs.length < 2) { flash("تعذّر فصل العنصر"); return; }
    setLayers(p => [...p.filter(x => x.id !== id), ...subs]);
    setSelId(subs[0].id);
    flash(`تم فصل العنصر إلى ${subs.length} أجزاء`);
  };

  // تعديل العرض الكلي للتصميم المستورد: يتمدد كل العناصر متناسباً حول مركز المجموعة
  const scaleImportGroup = (newWidthCm: number) => {
    const g = importGroup;
    if (!g || g.widthCm <= 0) return;
    const factor = Math.max(0.05, Math.min(20, newWidthCm / g.widthCm));
    if (!isFinite(factor) || Math.abs(factor - 1) < 1e-3) return;
    const idset = new Set(g.ids);
    setLayers(p => p.map(l => {
      if (!idset.has(l.id)) return l;
      // الموضع: قياس حول مركز المجموعة (سم → نسبة)
      const posCmX = (l.x / 100) * area.w, posCmY = (l.y / 100) * area.h;
      const nx = (g.centerXcm + (posCmX - g.centerXcm) * factor) / area.w * 100;
      const ny = (g.centerYcm + (posCmY - g.centerYcm) * factor) / area.h * 100;
      const base = { ...l, x: nx, y: ny } as Layer;
      // الحجم: حسب نوع العنصر
      if (base.kind === "text") return { ...base, heightCm: Math.max(2, Math.round(base.heightCm * factor)) };
      if (base.kind === "svg")  return { ...base, widthCm: Math.max(1, base.widthCm * factor) };
      if (base.kind === "logo") return { ...base, widthCm: Math.max(1, base.widthCm * factor) };
      if (base.kind === "qr")   return { ...base, sizeCm: Math.max(2, base.sizeCm * factor) };
      return base;
    }));
    setImportGroup({ ...g, widthCm: newWidthCm, heightCm: g.heightCm * factor });
  };

  // حذف العنصر المحدد بمفتاح Delete (أو Backspace) — ما لم يكن المستخدم يكتب في حقل
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      setSelId(cur => {
        if (cur) {
          setLayers(p => p.filter(l => l.id !== cur));
          return null;
        }
        return cur;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  // دالة التقييد: تمنع العناصر من تجاوز هامش الأمان (5 سم) من كل اتجاه
  const safeMoveLayer = useCallback((id: string, rawX: number, rawY: number) => {
    setLayers(prev => {
      const layer = prev.find(l => l.id === id);
      if (!layer) return prev;

      const S = 5; // هامش الأمان بالسنتيمتر
      // upExtCm/downExtCm: امتداد العنصر فوق/تحت نقطة المركز (y) بالسنتيمتر.
      // للنص العربي الامتداد غير متماثل: حروف الهبوط (ج، ح، ع، ي…) تنزل تحت
      // line box، لذا نقيس حدود الحبر الفعلية بدل افتراض aH = heightCm متماثلاً.
      let aW: number, upExtCm: number, downExtCm: number;
      if (layer.kind === "text") {
        const f  = FONT_BY_ID[(layer as any).fontId] || FONT_BY_ID["cairo"];
        const hCm = (layer as any).heightCm ?? 30;
        const text = (layer as any).text || "أ";
        // قياس بحجم مرجعي ثابت (يقلّل إدخالات الكاش) ثم تحويل النسب إلى سم
        const REF = 100;
        const tb = measureTightBounds(text, f.family, REF);
        const topOffCm = (tb.topOffset / REF) * hCm; // من أعلى line box إلى أعلى الحبر
        const tightHCm = (tb.height    / REF) * hCm; // ارتفاع الحبر الفعلي
        const tightWCm = (tb.widthPx   / REF) * hCm;
        // المط حول مركز العنصر يكبّر الامتدادات خطياً
        const sx = (layer as any).stretchX ?? 1;
        const sy = (layer as any).stretchY ?? 1;
        aW = Math.max(hCm * 0.6, tightWCm) * sx;
        // مركز العنصر = منتصف line box (translate(-50%,-50%) مع lineHeight:1)
        upExtCm   = Math.max(0, (hCm / 2 - topOffCm) * sy);            // قد يكون أقل من hCm/2
        downExtCm = Math.max(0, (topOffCm + tightHCm - hCm / 2) * sy); // قد يتجاوز hCm/2 (descenders)
      } else if (layer.kind === "logo") {
        aW = (layer as any).widthCm ?? 40;
        const aH = ((layer as any).widthCm ?? 40) * 0.7;
        upExtCm = downExtCm = aH / 2;
      } else if (layer.kind === "svg") {
        aW = (layer as any).widthCm ?? 60;
        const aH = aW * ((layer as any).aspect ?? 1);
        upExtCm = downExtCm = aH / 2;
      } else {
        aW = (layer as any).sizeCm ?? 20;
        const aH = (layer as any).sizeCm ?? 20;
        upExtCm = downExtCm = aH / 2;
      }

      const halfWPct = (aW / area.w) * 50;

      const xMargin  = (S / area.w) * 100 + halfWPct;
      const yMinPct  = ((S + upExtCm)   / area.h) * 100;
      const yMaxPct  = 100 - ((S + downExtCm) / area.h) * 100;

      const x = Math.min(100 - xMargin, Math.max(xMargin, rawX));
      const y = Math.min(yMaxPct, Math.max(yMinPct, rawY));

      return prev.map(l => l.id === id ? { ...l, x, y } : l);
    });
  }, [area.w, area.h]);

  const moveLayer = useCallback((id: string, x: number, y: number) => setLayers(p => p.map(l => l.id === id ? { ...l, x, y } : l)), []);

  // ── تطبيق نموذج لوحة التموينات (1=نص فوق نص | 2=نصان جانبيان) ──
  // cairo بدلاً من sukar: خط Cairo يدعم الأرقام العربية الهندية (U+0660-U+0669) بشكل صحيح
  const stripLayer = () => ({ kind: "text" as const, id: uid(), text: "هاتف ٠٠٠٠٠٠٠٠٠٠  |  سجل تجاري ٠٠٠٠٠٠٠", lang: "ar", fontId: "cairo", heightCm: 7, colorId: "white", x: 82, y: 92.5, stretchX: 1, stretchY: 1 });
  // bgW/bgH اختياريان — يُمرَّران صراحةً من onChange لتجاوز مشكلة stale closure
  const applySupTemplate = (t: 1 | 2, bgW = s.bgW, bgH = s.bgH) => {
    setSupTemplate(t);
    // موضع الشعار: يبدأ 12 سم من الحافة اليسرى، متوسط رأسياً في المنطقة الخضراء الداكنة
    // نسبة العرض/الارتفاع للشعار ≈ 1.43 (مستخرجة من SVG) → widthCm = 30/0.7 ≈ 43 لارتفاع 30 سم
    const logoW = 43; // عرض الشعار بالسم (يعطي ارتفاعاً ≈ 30 سم)
    const logoX = Math.round(((12 + logoW / 2) / bgW) * 1000) / 10;
    const greenH = bgH - SUPERMARKET_STRIP_CM;
    const logoY = Math.round((greenH / 2 / bgH) * 1000) / 10;
    if (t === 1) {
      // نموذج 1: اسم عربي 18 سم فوق + اسم إنجليزي 16 سم تحته — بجانب الشعار
      const greenH1   = bgH - SUPERMARKET_STRIP_CM;
      const blockH1   = 18 + 3 + 16; // 37 سم
      const blockStart1 = (greenH1 - blockH1) / 2;
      const arY1  = Math.round(((blockStart1 + 9)           / bgH) * 1000) / 10;
      const enY1  = Math.round(((blockStart1 + 18 + 3 + 8)  / bgH) * 1000) / 10;
      // مركز المساحة النصية أفقياً: من حافة الشعار اليمنى (12+logoW) حتى حافة اللوحة
      const logoRightEdge1 = 12 + logoW;
      const textX1 = Math.round(((logoRightEdge1 + bgW) / 2 / bgW) * 1000) / 10;
      setLayers([
        { kind: "logo" as const, id: uid(), src: SUPERMARKET_CART_SRC, widthCm: logoW, x: logoX, y: logoY, stretchX: 1, stretchY: 1 },
        { kind: "text" as const, id: uid(), text: "اسم المنشأة", lang: "ar", fontId: "sukar", heightCm: 18, colorId: "white", x: textX1, y: arY1, stretchX: 1, stretchY: 1 },
        { kind: "text" as const, id: uid(), text: "Brand Name", lang: "en", fontId: "sukar", heightCm: 16, colorId: "white", x: textX1, y: enY1, stretchX: 1, stretchY: 1 },
        stripLayer(),
      ]);
    } else {
      // نموذج 2: الاسم العربي على اليمين والإنجليزي على اليسار
      setLayers([
        { kind: "logo" as const, id: uid(), src: SUPERMARKET_CART_SRC, widthCm: logoW, x: logoX, y: logoY, stretchX: 1, stretchY: 1 },
        { kind: "text" as const, id: uid(), text: "اسم المنشأة", lang: "ar", fontId: "sukar", heightCm: 30, colorId: "white", x: 73, y: logoY, stretchX: 1, stretchY: 1 },
        { kind: "text" as const, id: uid(), text: "Brand Name", lang: "en", fontId: "sukar", heightCm: 16, colorId: "white", x: 45, y: logoY, stretchX: 1, stretchY: 1 },
        stripLayer(),
      ]);
    }
    setSelId(null);
  };

  const readFile = (e: React.ChangeEvent<HTMLInputElement>, cb: (src: string, name: string) => void) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = ev => { if (ev.target?.result) cb(ev.target.result as string, f.name); }; r.readAsDataURL(f); e.target.value = "";
  };

  const [mounted2, setMounted2] = useState(false);
  useEffect(() => setMounted2(true), []);
  useEffect(() => { document.title = "لوحات المتاجر — سوق الدعاية والإعلان"; }, []);

  // ── إرساء نص شريط التموينات على بُعد 12 سم من الحافة اليمنى عند تغيير عرض اللوحة ──
  useEffect(() => {
    if (s.establishmentType !== "supermarket") return;
    const stripTopPct = ((s.bgH - SUPERMARKET_STRIP_CM) / s.bgH) * 100;
    setLayers(prev => {
      let changed = false;
      const next = prev.map(l => {
        if (l.kind !== "text" || l.y < stripTopPct) return l;
        const f = FONT_BY_ID[l.fontId] || FONT_BY_ID["cairo"];
        const textWidthCm = measureTextCm(l.text || "أ", f.family, l.heightCm) * (l.stretchX ?? 1);
        // يمين اللوحة - 12 سم = الحافة اليمنى للنص؛ المركز = حافة يمنى - نصف العرض
        const centerCm = s.bgW - 12 - textWidthCm / 2;
        const newX = Math.max(0, Math.min(100, (centerCm / s.bgW) * 100));
        if (Math.abs(newX - l.x) < 0.5) return l;
        changed = true;
        return { ...l, x: newX };
      });
      return changed ? next : prev;
    });
  }, [s.bgW, s.bgH, s.establishmentType]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── توسيط المحتوى الرئيسي رأسياً في المنطقة الخضراء عند تغيير ارتفاع اللوحة ──
  useEffect(() => {
    if (s.establishmentType !== "supermarket") return;
    const greenH = s.bgH - SUPERMARKET_STRIP_CM;         // ارتفاع المنطقة الخضراء الداكنة
    const greenCenterY = (greenH / 2 / s.bgH) * 100;    // % مركز المنطقة الخضراء
    const stripTopPct  = (greenH / s.bgH) * 100;         // % بداية الشريط

    setLayers(prev => {
      let changed = false;
      // اجمع أبعاد النصوص غير الشريط لمعرفة حجم الكتلة النصية (نموذج 1)
      const mainTexts = prev.filter(l => l.kind === "text" && l.y < stripTopPct) as (typeof prev[0] & { kind: "text" })[];
      const arLayer   = mainTexts.find(l => l.lang === "ar");
      const enLayer   = mainTexts.find(l => l.lang === "en");
      const arH = arLayer?.heightCm ?? 18;
      const enH = enLayer?.heightCm ?? 16;
      const GAP = 3; // فراغ بين النصين (سم)

      // حساب مركز المساحة النصية أفقياً (من حافة الشعار حتى حافة اللوحة)
      const logoLayer     = prev.find(l => l.kind === "logo");
      const logoW_        = logoLayer?.kind === "logo" ? logoLayer.widthCm : 43;
      const logoRightEdge = 12 + logoW_;
      const textCenterX   = Math.round(((logoRightEdge + s.bgW) / 2 / s.bgW) * 1000) / 10;

      const next = prev.map(l => {
        // تجاهل طبقات الشريط
        if (l.y >= stripTopPct) return l;

        let newY: number;
        let newX: number | undefined;

        if (l.kind === "logo") {
          // الشعار: توسيط رأسي فقط (x يُدار بـ useEffect الشريط)
          newY = greenCenterY;
        } else if (supTemplate === 2 && l.kind === "text") {
          // نموذج 2: كل النصوص تتوسط رأسياً وأفقياً في مناطقها (المستخدم يضبطها يدوياً)
          newY = greenCenterY;
        } else if (l.kind === "text" && l.lang === "ar") {
          // نموذج 1 — العربي: أعلى الكتلة + توسيط أفقي
          const blockH     = arH + GAP + enH;
          const blockStart = (greenH - blockH) / 2;
          newY = ((blockStart + arH / 2) / s.bgH) * 100;
          newX = textCenterX;
        } else if (l.kind === "text" && l.lang === "en") {
          // نموذج 1 — الإنجليزي: أسفل الكتلة + توسيط أفقي
          const blockH     = arH + GAP + enH;
          const blockStart = (greenH - blockH) / 2;
          newY = ((blockStart + arH + GAP + enH / 2) / s.bgH) * 100;
          newX = textCenterX;
        } else {
          return l;
        }

        newY = Math.round(newY * 10) / 10;
        const yChanged = Math.abs(newY - l.y) >= 0.3;
        const xChanged = newX !== undefined && Math.abs(newX - l.x) >= 0.3;
        if (!yChanged && !xChanged) return l;
        changed = true;
        return { ...l, y: newY, ...(newX !== undefined ? { x: newX } : {}) };
      });
      return changed ? next : prev;
    });
  }, [s.bgH, s.bgW, s.establishmentType, supTemplate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── إصلاح شريط التموينات المحمّل من localStorage القديم ──
  // يحوّل الأرقام الغربية → عربية-هندية ويغيّر الخط إلى Cairo (يدعم U+0660-U+0669)
  useEffect(() => {
    if (s.establishmentType !== "supermarket") return;
    const supStripTopPct = ((s.bgH - SUPERMARKET_STRIP_CM) / s.bgH) * 100;
    const stripL = layers.find(l => l.kind === "text" && l.y >= supStripTopPct);
    if (!stripL || stripL.kind !== "text") return;
    const needsDigitFix = /\d/.test(stripL.text);
    const needsFontFix  = stripL.fontId === "sukar";
    if (!needsDigitFix && !needsFontFix) return;
    const arabicText = needsDigitFix ? stripL.text.replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]) : stripL.text;
    setLayers(prev => prev.map(l => l.id === stripL.id ? { ...l, text: arabicText, fontId: "cairo" } : l));
  }, [layers, s.establishmentType, s.bgH]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeSideStyle = sideStyles.find(ss => ss.slug === s.sideStyleId);
  const p = computePricing(s, layers, area, activeSideStyle?.priceAddPercent ?? 0);
  // فحص الامتثال لاشتراطات الأمانة
  const allWarns = complianceWarnings(s, layers);
  const activeWarns = allWarns.filter(w => !ignoredRules.includes(w.id));
  const ignoredWarns = allWarns.filter(w => ignoredRules.includes(w.id));
  const rulesLabel = s.establishmentType === "supermarket" ? "لوحات التموينات (وزارة البلديات والإسكان)" : cityById(s.city).amana;

  const waMsg = () => encodeURIComponent([
    "🔡 طلب حروف بارزة — سوق الدعاية والإعلان", "━━━━━━━━━━",
    `النوع: ${type?.label}`,
    s.mount === "background" ? `الخلفية: ${s.bgMode === "add" ? RATES.background[s.bgMaterial]?.label + " " + s.bgW + "×" + s.bgH + " سم" : "موجودة"}` : "تركيب جداري مباشر",
    // الترقيم يطابق شارات الكانفاس وقائمة العناصر
    ...layers.map((l, i) =>
      l.kind === "text" ? `عنصر ${i + 1} (نص): ${(l as TextLayer).text}`
      : l.kind === "svg" ? `عنصر ${i + 1} (تصميم${(l as SvgLayer).text?.trim() ? ` · نص: ${(l as SvgLayer).text!.trim()}` : ""}): عرض ${Math.round((l as SvgLayer).widthCm)} سم`
      : l.kind === "logo" ? `عنصر ${i + 1}: شعار`
      : `عنصر ${i + 1}: QR`),
    `الإجمالي التقديري: ${rr(p.total)} ر.س`,
  ].filter(Boolean).join("\n"));

  // helper JSX blocks used in both sections
  const isLightboxBg = s.bgMaterial === "lightbox";
  const lightboxFaceLabel = LIGHTBOX_FACES.find(f => f.id === s.lightboxFace)?.label ?? "";
  const matLabel = s.mount === "background" && s.bgMode === "add"
    ? isLightboxBg
      ? `خلفية مضيئة · ${lightboxFaceLabel}`
      : RATES.background[s.bgMaterial]?.label ?? ""
    : "";
  const canvasBg = {
    add: s.mount === "background" && s.bgMode === "add",
    // الخلفية الموجودة لدى العميل: لونها ينعكس في المعاينة لكنها لا تُحتسب في التسعير
    showColor: s.mount === "background",
    material: s.bgMaterial,
    widthCm: s.bgW, heightCm: s.bgH, depthCm: s.bgD,
    colorHex: s.bgCustomColor || BG_COLORS.find(c => c.id === s.bgColorId)?.hex,
    illuminated: isLightboxBg,
  };
  const waLink   = `https://wa.me/966500000000?text=${waMsg()}`;

  return (
    <div dir="rtl" className={FONT_VARIABLE_CLASSES} style={{ minHeight: "100vh", background: "#F4EFE6", fontFamily: "Tajawal, Cairo, sans-serif", color: "#2C1E15" }}>

      {/* ── شاشة اختيار الخطة — تظهر عند أول دخول ── */}
      {planMounted && !plan && (
        <PlanGate
          onFree={() => choosePlan("free")}
          onPro={() => {
            const back = encodeURIComponent(`/${locale}/configure/signs/raised-letters`);
            window.location.href = `/${locale}/pay/designer-pro?back=${back}`;
          }}
        />
      )}

      {/* ── Header ── */}
      <div style={{ padding: "0.85rem 0", borderBottom: "1px solid rgba(154,106,42,0.2)", background: "#F2E8D0" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <div style={{ display: "flex", gap: "0.4rem", fontSize: "0.7rem", color: "#5A4A3A", marginBottom: "0.3rem" }}>
              <Link href={`/${locale}`} style={{ color: GOLD, textDecoration: "none" }}>الرئيسية</Link>
              <span>›</span><span>المنتجات</span><span>›</span>
              <span style={{ color: "#2C1E15" }}>لوحات المتاجر</span>
            </div>
            <h1 style={{ fontSize: "clamp(1.1rem,2vw,1.5rem)", fontWeight: 900, margin: "0 0 0.6rem 0", color: "#2C1E15" }}>
              لوحات المتاجر <span style={GT}>— صمّم لافتتك</span>
            </h1>
            {/* زر تغيير الخطة — تحت العنوان مباشرة */}
            {planMounted && plan && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => { localStorage.removeItem("e3lani_plan"); localStorage.removeItem("e3lani_revisions"); setPlan(null); }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "0.55rem 1.2rem", borderRadius: 999, cursor: "pointer",
                    fontFamily: "Tajawal,Cairo,sans-serif", fontSize: "0.82rem", fontWeight: 800,
                    border: `1.5px solid ${isPro() ? "rgba(154,106,42,0.6)" : "rgba(154,106,42,0.35)"}`,
                    background: isPro() ? "linear-gradient(135deg,#9A7B36,#E6CA83)" : "#FFF8EC",
                    color: isPro() ? "#2C1E15" : "#7A5520",
                    boxShadow: isPro() ? "0 3px 12px rgba(154,106,42,0.3)" : "0 2px 8px rgba(154,106,42,0.15)",
                    transition: "all 0.2s",
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>{isPro() ? "✦" : "🔓"}</span>
                  <span>الخطة الحالية: <strong>{isPro() ? "احترافية" : "مجانية"}</strong></span>
                  <span style={{ opacity: 0.55, fontSize: "0.72rem", borderRight: "1px solid currentColor", paddingRight: 8, marginRight: 2 }}>|</span>
                  <span style={{ fontSize: "0.76rem", textDecoration: "underline", textUnderlineOffset: 3 }}>تغيير الخطة</span>
                </button>
                {isPro() && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "0.5rem 0.9rem",
                    borderRadius: 999, background: "rgba(154,106,42,0.1)", border: "1px solid rgba(154,106,42,0.25)" }}>
                    <span style={{ fontSize: "0.72rem", color: "#7A5520", fontWeight: 600 }}>التعديلات المتبقية:</span>
                    <span style={{ fontSize: "0.9rem", fontWeight: 900,
                      color: revisions > 0 ? "#C9A24B" : "#E51C1C" }}>{revisions}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* ── شريط الأوضاع — بالمنتصف ── */}
          <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: "0.4rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: 5, borderRadius: 999, background: "#F2E8D0", border: "1px solid rgba(154,106,42,0.3)", boxShadow: "0 8px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
              {(() => {
                const onDesign = s.contentMode === "design";
                const onUpload = s.contentMode === "upload";
                return <>
                  <button onClick={() => set({ contentMode: "design" })}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.5rem 1.6rem", borderRadius: 999, border: "none", cursor: "pointer",
                      fontFamily: "Cairo,sans-serif", fontSize: "0.84rem", fontWeight: 800, transition: "all 0.25s",
                      background: onDesign ? `linear-gradient(135deg,${GOLD},#EBCB7C)` : "transparent",
                      color: onDesign ? "#2C1E15" : "#5A4A3A",
                      boxShadow: onDesign ? "0 4px 18px rgba(201,162,75,0.35)" : "none" }}>
                    <span>✏️</span>صمّم بنفسك
                  </button>
                  {isPro() && <>
                  <span style={{ width: 1, height: 22, background: "rgba(154,106,42,0.25)", margin: "0 4px" }} />
                  <button title={`الصيغ المدعومة: AI · PDF · EPS · SVG · PSD · PNG · JPG — حتى ${MAX_UPLOAD_MB} ميجابايت`}
                    onClick={() => {
                      set({ contentMode: "upload" });
                      // افتح قسم النص والشعار حيث يوجد صندوق الرفع، ثم افتح نافذة اختيار الملف مباشرة
                      setOpenSections(p => p.includes("text") ? p : [...p, "text"]);
                      setVisitedSections(p => p.includes("text") ? p : [...p, "text"]);
                      setTimeout(() => fileRef.current?.click(), 350);
                    }}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.5rem 1.4rem", borderRadius: 999, cursor: "pointer",
                      fontFamily: "Cairo,sans-serif", fontSize: "0.8rem", fontWeight: 700, transition: "all 0.25s",
                      border: "1px dashed rgba(201,162,75,0.45)",
                      background: onUpload ? `linear-gradient(135deg,${GOLD},#EBCB7C)` : "rgba(201,162,75,0.06)",
                      color: onUpload ? "#2C1E15" : GOLD,
                      boxShadow: onUpload ? "0 4px 18px rgba(201,162,75,0.35)" : "none", whiteSpace: "nowrap" }}>
                    📤 ارفع تصميمك
                  </button>
                  </>}
                </>;
              })()}
            </div>
          </div>

        </div>
      </div>

      {/* ── 3-column layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 300px", gridTemplateAreas: '"r c l" "r s l"', gap: "1rem", maxWidth: 1920, margin: "0 auto", padding: "1rem 1.5rem", alignItems: "start" }}>

        {/* ─── ملخص الطلب — أسفل منطقة التصميم (area s) ─── */}
        <div style={{ gridArea: "s", marginTop: "1rem" }}>
          <div style={{ background: "#F2E8D0", borderRadius: 16, border: "1px solid rgba(154,106,42,0.25)", overflow: "hidden" }}>
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(154,106,42,0.18)" }}>
              <div style={{ fontSize: "0.88rem", fontWeight: 900, color: "#2C1E15" }}>ملخص الطلب</div>
            </div>
            <div style={{ padding: "0.5rem 1rem" }}>
              {!confirmed("location") ? (
                <div style={{ padding: "1.2rem 0.5rem", textAlign: "center", color: "#A39584", fontSize: "0.75rem", lineHeight: 1.7 }}>
                  <div style={{ fontSize: "1.4rem", marginBottom: "0.4rem" }}>📋</div>
                  أكمل الخطوات من القائمة الجانبية<br />لتظهر هنا تفاصيل طلبك
                </div>
              ) : (() => {
                const faceHex = s.faceCustomColor || (COL[s.faceColorId]?.hex || "#999");
                const sideHex = s.sideCustomColor || (COL[s.sideColorId]?.hex || "#999");
                const cFaceHex = s.cFaceCustomColor || (COL[s.cFaceColorId]?.hex || "#999");
                const cSideHex = s.cSideCustomColor || (COL[s.cSideColorId]?.hex || "#999");
                // هل توجد لوجوهات/محتويات؟ (svg عريض غير نصّي)
                const hasContentParts = layers.some(l => l.kind === "logo" || (l.kind === "svg" && l.aspect > 0.5));
                return ([
                  ["الأبعاد", `${s.bgW} × ${s.bgH} سم`],
                  ["الخلفية", s.mount === "wall" ? "جداري مباشر" : s.bgMode === "exists" ? "موجودة" : (RATES.background[s.bgMaterial]?.label || "—")],
                  ...(s.uniMatText
                    ? [[hasContentParts ? "خامة النصوص" : "الخامة", faceType.label, faceHex]] as [string, string, string][]
                    : [
                        [hasContentParts ? "خامة وجه النصوص" : "خامة الوجه", faceType.label, faceHex],
                        [hasContentParts ? "خامة جوانب النصوص" : "خامة الجوانب", sideType.label, sideHex],
                      ] as [string, string, string][]),
                  ...((s.faceBorder && !s.uniMatText && s.typeId === "acrylic" && (s.sideMat === "stainless" || s.sideMat === "zincor")) ? [["كنتور حول الأحرف", sideType.label, sideHex]] as [string, string, string][] : []),
                  ...(hasContentParts ? (s.uniMatContent
                    ? [["خامة اللوجوهات", cFaceType.label, cFaceHex]] as [string, string, string][]
                    : [
                        ["خامة وجه اللوجوهات", cFaceType.label, cFaceHex],
                        ["خامة جوانب اللوجوهات", cSideType.label, cSideHex],
                      ] as [string, string, string][]) : []),
                  ...(activeSideStyle && activeSideStyle.slug !== "solid" && s.sideMat !== "acrylic" && s.lightTypeId !== "none" ? [["نمط الجوانب", activeSideStyle.nameAr]] as [string, string][] : []),
                  ["الإضاءة",  LIGHT_TYPES.find(l => l.id === s.lightTypeId)?.label || "بدون"],
                  ["التركيب",  s.wantInstall ? "نعم" : "لا"],
                ] as [string, string, string?][]).map(([label, value, color], i) => (
                  <div key={label + i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.38rem 0", borderBottom: "1px solid rgba(154,106,42,0.18)", fontSize: "0.76rem" }}>
                    <span style={{ color: "#5A4A3A" }}>{label}:</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#2C1E15", fontWeight: 600 }}>
                      {color && <span title="اللون" style={{ width: 15, height: 15, borderRadius: 4, background: color, border: "1px solid rgba(154,106,42,0.4)", flexShrink: 0 }} />}
                      <span>{value}</span>
                    </span>
                  </div>
                ));
              })()}
            </div>
            {/* السعر */}
            {mounted2 && (
              <>
                <div style={{ padding: "1rem", textAlign: "center", background: "linear-gradient(160deg,#2A2118,#161407)", borderTop: "1px solid rgba(201,162,75,0.18)" }}>
                  <div style={{ fontSize: "0.58rem", color: "#C7B79A", marginBottom: "0.2rem", letterSpacing: "0.1em" }}>السعر التقديري</div>
                  <div style={{ ...GT, fontSize: "2.1rem", fontWeight: 900, lineHeight: 1 }}>{p.hasContent ? rr(p.total) : "—"}</div>
                  <div style={{ fontSize: "0.6rem", color: "#C7B79A", marginTop: "0.2rem" }}>ر.س شامل الضريبة</div>
                  {RATES.offer.active && p.hasContent && (
                    <div style={{ marginTop: "0.5rem", display: "inline-block", padding: "0.2rem 0.65rem", borderRadius: 999, background: "rgba(201,162,75,0.12)", border: `1px solid ${GOLD}40`, fontSize: "0.66rem", color: GOLD, fontWeight: 700 }}>
                      🎉 خصم {RATES.offer.percent}٪ — عرض الافتتاح
                    </div>
                  )}
                </div>
                {/* تفاصيل السعر */}
                {p.hasContent && (
                  <div style={{ padding: "0.5rem 0.85rem", borderTop: "1px solid rgba(154,106,42,0.18)" }}>
                    {p.lines.map(l => <PriceRow key={l.key} label={l.label} sub={l.sub} num={l.num} value={l.total} />)}
                    {p.lighting > 0 && <PriceRow label="الإضاءة" sub={p.lightLabel} value={p.lighting} />}
                    {p.bgAdd && <PriceRow label={`خلفية ${RATES.background[s.bgMaterial]?.label}`} sub={`${s.bgW}×${s.bgH} سم`} value={p.bgCost} />}
                    {p.offer > 0 && <PriceRow label={`خصم ${RATES.offer.label}`} value={p.offer} neg />}
                    {s.wantInstall && <PriceRow label="التركيب" value={p.install} />}
                    <PriceRow label="ضريبة 15%" value={p.vat} />
                    <div style={{ marginTop: "0.35rem", paddingTop: "0.35rem", borderTop: `1.5px solid ${GOLD}30` }}>
                      <PriceRow label="الإجمالي" value={p.total} strong />
                    </div>
                  </div>
                )}
                {/* أزرار الطلب */}
                <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", borderTop: "1px solid rgba(154,106,42,0.18)" }}>
                  <a href={waLink} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.75rem", borderRadius: 12, background: G, color: "#2C1E15", fontWeight: 900, fontSize: "0.82rem", textDecoration: "none", fontFamily: "Cairo,sans-serif" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                    تأكيد الطلب عبر واتساب
                  </a>
                  {isPro() ? (
                    <button onClick={() => flash("جاري تجهيز PDF…")}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem", padding: "0.65rem", borderRadius: 12, cursor: "pointer", fontFamily: "Cairo,sans-serif", fontWeight: 700, fontSize: "0.78rem", border: `1px solid ${GOLD}35`, background: "rgba(201,162,75,0.06)", color: GOLD }}>
                      ⬇ تحميل مواصفات التصميم PDF
                    </button>
                  ) : (
                    <button onClick={() => choosePlan("pro")}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem", padding: "0.65rem", borderRadius: 12, cursor: "pointer", fontFamily: "Cairo,sans-serif", fontWeight: 700, fontSize: "0.78rem", border: "1px solid rgba(154,106,42,0.25)", background: "rgba(154,106,42,0.06)", color: "#9A6A2A" }}>
                      🔒 ملف PDF — الخطة الاحترافية
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ─── CENTER (area c): الكانفاس ─── */}
        <div style={{ gridArea: "c" }}>
          {/* ── شريط مراجعة الامتثال لاشتراطات الأمانة — يظهر فقط بعد اعتماد المرحلة الأولى ── */}
          {confirmed("location") && activeWarns.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.6rem", padding: "0.6rem 0.9rem", borderRadius: 12, background: "rgba(61,139,78,0.1)", border: "1px solid rgba(61,139,78,0.35)" }}>
              <span style={{ fontSize: "1rem" }}>✅</span>
              <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#2E7A3E" }}>متوافق مع اشتراطات {rulesLabel}</span>
              {ignoredWarns.length > 0 && <span style={{ marginInlineStart: "auto", fontSize: "0.66rem", color: "#9A6A2A" }}>تجاهلت {ignoredWarns.length} اشتراطاً</span>}
            </div>
          ) : confirmed("location") ? (
            <div style={{ marginBottom: "0.6rem", borderRadius: 12, background: "rgba(201,140,40,0.1)", border: "1px solid rgba(201,140,40,0.45)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.55rem 0.9rem", background: "rgba(201,140,40,0.12)" }}>
                <span style={{ fontSize: "1rem" }}>⚠️</span>
                <span style={{ fontSize: "0.78rem", fontWeight: 900, color: "#9A6A2A" }}>{activeWarns.length} تنبيه على مطابقة اشتراطات {rulesLabel}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {activeWarns.map(w => (
                  <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.55rem 0.9rem", borderTop: "1px solid rgba(201,140,40,0.18)" }}>
                    <span style={{ flex: 1, fontSize: "0.72rem", color: "#2C1E15", lineHeight: 1.5 }}>{w.msg}</span>
                    {(w.fix || w.id === "sup-font") && (
                      <button onClick={() => {
                        if (w.fix) set(w.fix);
                        if (w.id === "sup-font") setLayers(prev => prev.map(l => l.kind === "text" ? { ...l, fontId: "sukar", colorId: "white", colorHex: undefined } : l));
                      }}
                        style={{ flexShrink: 0, padding: "0.3rem 0.8rem", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: "Cairo,sans-serif", fontWeight: 800, fontSize: "0.66rem", background: G, color: "#2C1E15" }}>
                        تطبيق الاشتراط
                      </button>
                    )}
                    <button onClick={() => setIgnoredRules(p => p.includes(w.id) ? p : [...p, w.id])}
                      style={{ flexShrink: 0, padding: "0.3rem 0.7rem", borderRadius: 999, cursor: "pointer", fontFamily: "Cairo,sans-serif", fontWeight: 700, fontSize: "0.64rem", background: "transparent", color: "#8A7A66", border: "1px solid rgba(154,106,42,0.3)" }}>
                      تجاهل
                    </button>
                  </div>
                ))}
              </div>
              {ignoredWarns.length > 0 && (
                <div style={{ padding: "0.4rem 0.9rem", borderTop: "1px solid rgba(201,140,40,0.18)", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "0.62rem", color: "#8A7A66" }}>تجاوزات مُتجاهَلة: {ignoredWarns.length}</span>
                  <button onClick={() => setIgnoredRules([])} style={{ fontSize: "0.62rem", color: "#9A6A2A", background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontFamily: "Cairo,sans-serif" }}>إعادة إظهارها</button>
                </div>
              )}
            </div>
          ) : null}
          <div style={{ background: "#201B16", borderRadius: 14, border: "1px solid rgba(201,162,75,0.18)", padding: "0.85rem 1rem 1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.7rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.68rem", color: "#aaa" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                اسحب العناصر · المسطرة بالسنتيمتر
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                {/* تراجع */}
                <button onClick={undo} disabled={!canUndo} title="تراجع عن آخر تغيير"
                  style={{ ...stepBtn, width: "auto", padding: "0 0.8rem", gap: 6, display: "flex", alignItems: "center", fontWeight: 700,
                    cursor: canUndo ? "pointer" : "not-allowed", opacity: canUndo ? 1 : 0.4,
                    color: canUndo ? GOLD : "#777", border: `1px solid ${canUndo ? GOLD + "66" : "rgba(255,255,255,0.1)"}` }}>
                  <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>↶</span>
                  <span style={{ fontSize: "0.72rem" }}>تراجع</span>
                </button>
                <span style={{ width: 1, height: 18, background: "rgba(255,255,255,0.12)" }} />
                <button onClick={() => set({ zoom: Math.max(0.5, +(s.zoom - 0.1).toFixed(2)) })} style={stepBtn}>−</button>
                <span style={{ fontSize: "0.68rem", color: "#eee", minWidth: 34, textAlign: "center" }}>{Math.round(s.zoom * 100)}%</span>
                <button onClick={() => set({ zoom: Math.min(2, +(s.zoom + 0.1).toFixed(2)) })} style={stepBtn}>+</button>
                <button onClick={() => set({ guides: !s.guides })} style={{ ...stepBtn, border: `1px solid ${s.guides ? GOLD : "rgba(255,255,255,0.1)"}`, color: s.guides ? GOLD : "#777", fontSize: "0.7rem" }}>⊹</button>
                <button onClick={() => set({ night: !s.night })} style={{ ...stepBtn, width: "auto", padding: "0 0.7rem", fontSize: "0.7rem", fontWeight: 700, color: s.night ? GOLD : "#888", border: `1px solid ${s.night ? GOLD : "rgba(255,255,255,0.1)"}` }}>
                  {s.night ? "☀" : "🌙"}
                </button>
                <button onClick={open3D} title="معاينة ثلاثية الأبعاد" style={{ ...stepBtn, width: "auto", padding: "0 0.7rem", fontSize: "0.7rem", fontWeight: 800, color: GOLD, border: `1px solid ${GOLD}66`, display: "flex", alignItems: "center", gap: 4 }}>
                  🧊 3D
                </button>
                <button onClick={openMockup} title="معاينة على واجهة مبنى" style={{ ...stepBtn, width: "auto", padding: "0 0.7rem", fontSize: "0.7rem", fontWeight: 800, color: GOLD, border: `1px solid ${GOLD}66`, display: "flex", alignItems: "center", gap: 4 }}>
                  🏬 الواجهة
                </button>
                <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => readFile(e, src => addLogo(src))} />
              </div>
            </div>
            <div style={{ overflow: "auto", display: "flex", justifyContent: "center" }}>
              <DesignCanvas area={area} bg={canvasBg}
                faceColorId={s.faceColorId} faceCustomColor={s.faceCustomColor}
                contentColorId={s.cFaceColorId} contentCustomColor={s.cFaceCustomColor}
                light={{ typeId: s.lightTypeId, tempId: s.lightTempId }} bgLightTempId={s.bgLightTempId}
                layers={layers} selectedId={selectedId}
                onSelect={id => setSelId(id || null)} onMove={safeMoveLayer} onMoveRaw={moveLayer} onUpdate={updateLayer}
                onResize={(id, newSizeCm) => {
                  const l = layers.find(x => x.id === id);
                  if (!l) return;
                  const v = Math.round(newSizeCm);
                  if (l.kind === "text") updateLayer(id, { heightCm: Math.max(8, Math.min(150, v)) });
                  else if (l.kind === "logo") updateLayer(id, { widthCm: Math.max(10, Math.min(150, v)) });
                  else if (l.kind === "qr") updateLayer(id, { sizeCm: Math.max(8, Math.min(60, v)) });
                  else if (l.kind === "svg") updateLayer(id, { widthCm: Math.max(10, Math.min(300, v)) });
                }}
                night={s.night} guides={s.guides} zoom={s.zoom}
                materialLabel={matLabel}
                faceBorder={s.faceBorder && !s.uniMatText && frameEligible} frameColor={s.sideCustomColor || (COL[s.sideColorId] || COL["silver"]).hex}
                mergeSel={mergeSel} mergeMode={mergeMode} onSetMergeMode={setMergeModeWrap}
                onToggleMerge={toggleMerge} onMerge={mergeLayers} onSplit={splitLayer}
                supStrip={s.establishmentType === "supermarket" ? (SUPERMARKET_STRIP_CM / s.bgH) * 100 : undefined} />
            </div>
          </div>

          {/* ── حفظ المشروع ومشاريعي — أسفل منطقة الرسم (للخطة المدفوعة) ── */}
          {planMounted && isPro() && (
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: "0.5rem" }}>
              <button
                onClick={() => { setSaveProjectName(n => n || "مشروعي الجديد"); setSaveModalOpen(true); }}
                style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "0.5rem 1.2rem",
                  borderRadius: 999, cursor: "pointer", fontFamily: "Tajawal,Cairo,sans-serif",
                  fontSize: "0.82rem", fontWeight: 800,
                  border: "1.5px solid rgba(154,106,42,0.5)",
                  background: "linear-gradient(135deg,#9A7B36,#E6CA83)",
                  color: "#2C1E15", boxShadow: "0 3px 12px rgba(154,106,42,0.25)" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
                {lastSaved ? "حفظ التحديثات" : "حفظ المشروع"}
                {lastSaved && <span style={{ fontSize: "0.62rem", opacity: 0.7 }}>· {new Date(lastSaved).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</span>}
              </button>
              <Link href={`/${locale}/projects`}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.5rem 1rem",
                  borderRadius: 999, textDecoration: "none", fontSize: "0.8rem", fontWeight: 700,
                  color: "#7A5520", border: "1px solid rgba(154,106,42,0.3)", background: "rgba(154,106,42,0.07)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                مشاريعي
              </Link>
            </div>
          )}
        </div>

        {/* ─── RIGHT (area r): تخصيص اللوحة — خطوات 1·2·3 ─── */}
        <div style={{ gridArea: "r", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <div style={{ fontSize: "0.9rem", fontWeight: 900, color: "#2C1E15", padding: "0.1rem 0.2rem 0.2rem" }}>تخصيص اللوحة</div>

          {/* 1 — المدينة وموقع التركيب (يحدّد الأمانة المطبَّقة) */}
          <AccordionSection title="المدينة وموقع التركيب" icon="📍" num={1} done={confirmed("location")} open={openSections.includes("location")} onToggle={() => toggleSection("location")} onConfirm={() => confirmSection("location")}>
            {(() => {
              const c = cityById(s.city);
              return (
                <div style={{ marginTop: "0.5rem" }}>
                  <div style={{ fontSize: "0.68rem", color: "#5A4A3A", fontWeight: 700, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>المدينة</div>
                  <CitySelect value={s.city} onChange={v => { set({ city: v }); setVisitedSections(p => p.includes("location") ? p : [...p, "location"]); }} />

                  <div style={{ marginTop: "0.7rem", padding: "0.7rem 0.85rem", borderRadius: 10, background: "rgba(61,139,78,0.1)", border: "1px solid rgba(61,139,78,0.3)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "1.1rem" }}>🏛</span>
                      <div>
                        <div style={{ fontSize: "0.78rem", fontWeight: 900, color: "#2E7A3E" }}>{c.amana}</div>
                        <div style={{ fontSize: "0.64rem", color: "#5A4A3A", lineHeight: 1.5 }}>تُطبَّق اشتراطات هذه الأمانة تلقائياً على تصميمك — أبعاد ومواد وإضاءة متوافقة.</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: "0.5rem", fontSize: "0.6rem", color: "#8A7A66", lineHeight: 1.5 }}>
                    المرحلة الأولى تغطي كامل نطاق أمانة محافظة جدة. مدن وأمانات أخرى تُضاف تباعاً.
                  </div>

                  <div style={{ fontSize: "0.68rem", color: "#5A4A3A", fontWeight: 700, margin: "0.95rem 0 0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>نوع المنشأة</div>
                  <Choice value={s.establishmentType} cols={2}
                    onChange={v => {
                      const allowed = estById(v).kinds;
                      set({ establishmentType: v, signType: allowed.includes(s.signType) ? s.signType : allowed[0] });
                      if (v === "supermarket") {
                        // الهوية القياسية للتموينات: خلفية خضراء + مقاس أدنى قياسي (300×80 سم) + نصوص بيضاء + قالب افتراضي
                        set({ mount: "background", bgMode: "add", bgMaterial: "cladding", bgColorId: "", bgCustomColor: SUPERMARKET_GREEN, bgW: 300, bgH: 80, faceCustomColor: "#FFFFFF", faceColorId: "" });
                        applySupTemplate(1, 300, 80); // أبعاد التموينات القياسية — تجاوز stale closure
                      } else if (s.establishmentType === "supermarket") {
                        // العودة من التموينات: مسح الضبط الإجباري (الخلفية الخضراء والخط الموحّد ولون النصوص)
                        set({ bgCustomColor: "", bgColorId: "white", bgMode: "none", faceCustomColor: "", faceColorId: "silver" });
                        setLayers(prev => prev.map(l => l.kind === "text" ? { ...l, colorId: "gold", fontId: "cairo" } : l));
                      }
                    }}
                    options={ESTABLISHMENTS.map(e => ({ v: e.id, label: e.label }))} />
                  {estById(s.establishmentType).special && (
                    <>
                      <div style={{ marginTop: "0.4rem", padding: "0.55rem 0.75rem", borderRadius: 9, background: "rgba(91,130,200,0.08)", border: "1px solid rgba(91,130,200,0.3)", fontSize: "0.62rem", color: "#3A4A6A", lineHeight: 1.6 }}>
                        ℹ️ التموينات تخضع لاشتراطات لوحات موحّدة من وزارة البلديات والإسكان.
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "#5A4A3A", fontWeight: 700, margin: "0.6rem 0 0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>هل للمحل علامة تجارية مسجلة؟</div>
                      <Choice value={s.hasTrademark ? "yes" : "no"} cols={2}
                        onChange={v => {
                          const has = v === "yes";
                          set({ hasTrademark: has });
                          if (!has) { // بدون علامة → فرض التصميم الموحّد
                            set({ mount: "background", bgMode: "add", bgMaterial: "cladding", bgColorId: "", bgCustomColor: SUPERMARKET_GREEN });
                            setLayers(prev => prev.map(l => l.kind === "text" ? { ...l, colorId: "white", colorHex: undefined, fontId: "sukar" } : l));
                          }
                        }}
                        options={[{ v: "no", label: "لا — تصميم موحّد" }, { v: "yes", label: "نعم — علامة مسجلة" }]} />
                      <div style={{ marginTop: "0.4rem", fontSize: "0.6rem", color: "#8A7A66", lineHeight: 1.5 }}>
                        {s.hasTrademark
                          ? "يمكن استخدام تصميم العلامة المسجلة (ألوان وخط حر) ضمن الأبعاد المسموحة."
                          : "بدون علامة مسجلة: يلزم اللون الأخضر الموحّد + خط سُكَّر + الشعار الموحّد."}
                      </div>

                      {/* ── اختيار نموذج اللوحة (التصميم الموحّد فقط) ── */}
                      {!s.hasTrademark && (
                        <div style={{ marginTop: "0.7rem" }}>
                          <div style={{ fontSize: "0.68rem", color: "#5A4A3A", fontWeight: 700, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>نموذج اللوحة</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                            {([
                              {
                                t: 1 as const,
                                label: "نص فوق نص",
                                desc: "اسم عربي كبير + اسم إنجليزي أسفله",
                                thumb: (
                                  <svg viewBox="0 0 80 30" width="100%" style={{ display: "block" }}>
                                    <rect width="80" height="30" fill="#006B54" rx="2"/>
                                    {/* logo */}
                                    <circle cx="10" cy="13" r="6" fill="#F5CE22" opacity="0.9"/>
                                    {/* Arabic text bar */}
                                    <rect x="20" y="5" width="55" height="9" fill="white" opacity="0.9" rx="1.5"/>
                                    {/* English text bar */}
                                    <rect x="20" y="17" width="40" height="5" fill="white" opacity="0.7" rx="1"/>
                                    {/* strip */}
                                    <rect x="0" y="25.5" width="80" height="4.5" fill="#3DB16B" rx="0 0 2 2"/>
                                  </svg>
                                ),
                              },
                              {
                                t: 2 as const,
                                label: "نصان جانبيان",
                                desc: "عربي على اليمين / إنجليزي على اليسار",
                                thumb: (
                                  <svg viewBox="0 0 80 30" width="100%" style={{ display: "block" }}>
                                    <rect width="80" height="30" fill="#006B54" rx="2"/>
                                    {/* small logo */}
                                    <circle cx="7" cy="13" r="4" fill="#F5CE22" opacity="0.9"/>
                                    {/* Arabic — right half */}
                                    <rect x="45" y="6" width="31" height="15" fill="white" opacity="0.9" rx="1.5"/>
                                    {/* English — left-center */}
                                    <rect x="14" y="8" width="28" height="10" fill="white" opacity="0.7" rx="1"/>
                                    {/* strip */}
                                    <rect x="0" y="25.5" width="80" height="4.5" fill="#3DB16B" rx="0 0 2 2"/>
                                  </svg>
                                ),
                              },
                            ] as const).map(({ t, label, desc, thumb }) => {
                              const on = supTemplate === t;
                              return (
                                <button key={t} onClick={() => applySupTemplate(t)}
                                  style={{ padding: "0.4rem", borderRadius: 10, cursor: "pointer", fontFamily: "Cairo,sans-serif", textAlign: "center",
                                    border: `2px solid ${on ? "#006B54" : "rgba(0,107,84,0.2)"}`,
                                    background: on ? "rgba(0,107,84,0.08)" : "rgba(0,0,0,0.02)",
                                    transition: "all 0.15s" }}>
                                  <div style={{ borderRadius: 6, overflow: "hidden", marginBottom: "0.3rem" }}>{thumb}</div>
                                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: on ? "#006B54" : "#5A4A3A" }}>{label}</div>
                                  <div style={{ fontSize: "0.55rem", color: "#8A7A66", lineHeight: 1.4 }}>{desc}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div style={{ fontSize: "0.68rem", color: "#5A4A3A", fontWeight: 700, margin: "0.95rem 0 0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>نوع اللوحة <span style={{ color: "#8A7A66", fontWeight: 600 }}>· المتاح لـ{estById(s.establishmentType).label}</span></div>
                  {(() => {
                    const THUMBS: Record<string, React.ReactNode> = {
                      parallel: (
                        <svg viewBox="0 0 78 52" width="78" height="52"><rect width="78" height="52" fill="#EDE6DC"/><rect x="4" y="4" width="58" height="44" fill="#C8BAA8" stroke="#A09078" strokeWidth="0.6"/>{[0,1,2].map(c=><rect key={c} x={7+c*18} y={9} width={14} height={9} fill="#9ABCCC" opacity="0.65" rx="1"/>)}{[0,1].map(c=><rect key={c} x={7+c*18} y={21} width={14} height={9} fill="#9ABCCC" opacity="0.65" rx="1"/>)}<rect x="4" y="15" width="58" height="11" fill="#2C1E15"/><text x="33" y="23" textAnchor="middle" fill="#C9A24B" fontSize="4.5" fontFamily="Cairo,sans-serif" fontWeight="bold">اسم المنشأة</text><rect x="4" y="46" width="58" height="2.5" fill="#A09078"/></svg>
                      ),
                      projecting: (
                        <svg viewBox="0 0 78 52" width="78" height="52"><rect width="78" height="52" fill="#EDE6DC"/><rect x="4" y="4" width="28" height="44" fill="#C8BAA8" stroke="#A09078" strokeWidth="0.6"/>{[0,1].map(r=>[0].map(c=><rect key={`${r}${c}`} x={7} y={8+r*16} width={20} height={12} fill="#9ABCCC" opacity="0.65" rx="1"/>))}<rect x="32" y="17" width="40" height="18" fill="#2C1E15" stroke="#C9A24B" strokeWidth="0.8" rx="2"/><text x="52" y="27.5" textAnchor="middle" fill="#C9A24B" fontSize="5.5" fontFamily="Cairo,sans-serif" fontWeight="bold">اسم المنشأة</text><rect x="29" y="21" width="4" height="4" fill="#6A5A4A"/><rect x="29" y="28" width="4" height="4" fill="#6A5A4A"/></svg>
                      ),
                      entrance: (
                        <svg viewBox="0 0 78 52" width="78" height="52"><rect width="78" height="52" fill="#EDE6DC"/><rect x="8" y="8" width="62" height="40" fill="#C8BAA8" stroke="#A09078" strokeWidth="0.6"/><rect x="26" y="22" width="26" height="26" fill="#9ABCCC" opacity="0.75"/><rect x="6" y="12" width="66" height="14" fill="#2C1E15" stroke="#C9A24B" strokeWidth="0.7" rx="2"/><text x="39" y="21.5" textAnchor="middle" fill="#C9A24B" fontSize="5" fontFamily="Cairo,sans-serif" fontWeight="bold">المدخل الرئيسي</text></svg>
                      ),
                      brand: (
                        <svg viewBox="0 0 78 52" width="78" height="52"><rect width="78" height="52" fill="#EDE6DC"/><rect x="16" y="14" width="46" height="34" fill="#C8BAA8" stroke="#A09078" strokeWidth="0.6"/>{[0,1,2].map(r=>[0,1,2].map(c=><rect key={`${r}${c}`} x={18+c*14} y={19+r*8} width={12} height={6} fill="#9ABCCC" opacity="0.65" rx="0.5"/>))}<rect x="16" y="5" width="46" height="11" fill="#C9A24B" rx="1.5"/><text x="39" y="12.5" textAnchor="middle" fill="#2C1E15" fontSize="5" fontFamily="sans-serif" fontWeight="bold">HOTEL / HOSPITAL</text></svg>
                      ),
                      directory: (
                        <svg viewBox="0 0 78 52" width="78" height="52"><rect width="78" height="52" fill="#EDE6DC"/><rect x="6" y="4" width="48" height="44" fill="#D8EAF0" stroke="#A0C0D0" strokeWidth="0.6"/><rect x="20" y="8" width="20" height="30" fill="#8A5E38" rx="2"/><rect x="18" y="47" width="24" height="3.5" fill="#5A3A1A" rx="1"/><rect x="21" y="10" width="18" height="8" fill="#C9A24B" rx="1"/><text x="30" y="16.5" textAnchor="middle" fill="#2C1E15" fontSize="3.8" fontFamily="Cairo,sans-serif" fontWeight="bold">الاسم / الشعار</text>{[0,1,2].map(i=><rect key={i} x={21} y={21+i*6} width={18} height={4.5} fill={i%2===0?"#2C1E15":"#3A2820"} rx="0.8"/>)}</svg>
                      ),
                      flags: (
                        <svg viewBox="0 0 78 52" width="78" height="52"><rect width="78" height="52" fill="#EDE6DC"/>{[14,39,64].map((x,i)=><g key={i}><line x1={x} y1="6" x2={x} y2="47" stroke="#8A7A66" strokeWidth="1.5"/><polygon points={`${x},6 ${x+16},12 ${x},18`} fill={i===1?"#33261A":"#C9A24B"} opacity="0.9"/></g>)}</svg>
                      ),
                      "acrylic-indoor": (
                        <svg viewBox="0 0 78 52" width="78" height="52"><rect width="78" height="52" fill="#EDE6DC"/><rect x="4" y="4" width="70" height="44" fill="#EEF4F8" stroke="#B0C8D8" strokeWidth="0.7"/><rect x="14" y="14" width="50" height="24" fill="#2C1E15" stroke="#C9A24B" strokeWidth="1" rx="2"/><text x="39" y="27" textAnchor="middle" fill="#C9A24B" fontSize="5.5" fontFamily="Cairo,sans-serif" fontWeight="bold">اسم المنشأة</text><text x="39" y="34.5" textAnchor="middle" fill="#A39584" fontSize="3.8" fontFamily="sans-serif">COMPANY NAME</text></svg>
                      ),
                      "upper-facade": (
                        <svg viewBox="0 0 78 52" width="78" height="52"><rect width="78" height="52" fill="#EDE6DC"/><rect x="12" y="4" width="54" height="44" fill="#C8BAA8" stroke="#A09078" strokeWidth="0.6"/>{[0,1].map(r=>[0,1,2].map(c=><rect key={`${r}${c}`} x={14+c*17} y={7+r*10} width={14} height={7} fill="#9ABCCC" opacity="0.65" rx="0.5"/>))}<rect x="12" y="30" width="54" height="11" fill="#2C1E15" stroke="#C9A24B" strokeWidth="0.7"/><text x="39" y="37.5" textAnchor="middle" fill="#C9A24B" fontSize="4.5" fontFamily="Cairo,sans-serif" fontWeight="bold">اسم المنشأة</text></svg>
                      ),
                      tenant: (
                        <svg viewBox="0 0 78 52" width="78" height="52"><rect width="78" height="52" fill="#EDE6DC"/><rect x="4" y="4" width="50" height="44" fill="#D8EAF0" stroke="#A0C0D0" strokeWidth="0.6"/><rect x="59" y="4" width="14" height="44" fill="#8A5E38" rx="2"/><rect x="57" y="47" width="18" height="3.5" fill="#5A3A1A" rx="1"/><rect x="60" y="6" width="12" height="8" fill="#C9A24B" rx="1"/>{[0,1,2].map(i=><rect key={i} x={60} y={17+i*9} width={12} height={7} fill={i%2===0?"#2C1E15":"#3A2820"} rx="1"/>)}</svg>
                      ),
                    };
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        {SIGN_KINDS.filter(k => estById(s.establishmentType).kinds.includes(k.id)).map(k => {
                          const on = s.signType === k.id;
                          return (
                            <div key={k.id}
                              onClick={() => set({ signType: k.id })}
                              style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "0.55rem 0.7rem", borderRadius: 10, cursor: "pointer",
                                fontFamily: "Cairo,sans-serif", textAlign: "right",
                                border: `1.5px solid ${on ? GOLD : "rgba(154,106,42,0.25)"}`,
                                background: on ? "#2C1E15" : "#E8DAC0",
                                color: on ? GOLD : "#5A4A3A",
                                transition: "all 0.15s", userSelect: "none" }}>
                              <div style={{ fontSize: "0.82rem", fontWeight: 700, lineHeight: 1.4 }}>
                                {k.label}
                              </div>
                              <div
                                onClick={e => { e.stopPropagation(); setSignKindPreview(k.id); }}
                                title="عرض النموذج التوضيحي"
                                style={{ flexShrink: 0, fontSize: "0.6rem", fontWeight: 700,
                                  color: on ? "rgba(201,162,75,0.7)" : "rgba(90,74,58,0.6)",
                                  padding: "0.15rem 0.4rem", borderRadius: 6,
                                  border: `1px solid ${on ? "rgba(201,162,75,0.3)" : "rgba(154,106,42,0.2)"}`,
                                  marginInlineStart: "0.5rem", whiteSpace: "nowrap" }}>
                                معاينة ↗
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  <div style={{ fontSize: "0.68rem", color: "#5A4A3A", fontWeight: 700, margin: "0.95rem 0 0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>سياق الواجهة (لفحص الاشتراطات)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    <Stepper label="عرض واجهة المحل" value={s.facadeWidthCm} onChange={v => {
                      // الاشتراط ينعكس مباشرة: عرض اللوحة = عرض الواجهة (وللتموينات إلزامي)
                      const w = Math.min(v, 1200);
                      set(s.mount === "wall" ? { facadeWidthCm: v, wallW: w } : { facadeWidthCm: v, bgW: w });
                    }} min={50} max={2000} step={10} presets={[200,300,400,600]} onHelp={() => setShowFacadeHelp(true)} />
                    {s.establishmentType !== "supermarket" && <>
                      <Stepper label="ارتفاع نافذة العرض" value={s.windowHeightCm} onChange={v => {
                        // الاشتراط ينعكس مباشرة: ارتفاع اللوحة = ثلث ارتفاع نافذة العرض
                        const h = Math.min(Math.floor(v / 3), 400);
                        set(s.mount === "wall" ? { windowHeightCm: v, wallH: h } : { windowHeightCm: v, bgH: h });
                      }} min={100} max={1000} step={10} presets={[250,300,350,400]} onHelp={() => setShowHeightHelp(true)} />
                      <Stepper label="ارتفاع تركيب الحد السفلي" value={s.signBottomM} onChange={v => set({ signBottomM: v })} min={2} max={8} step={0.1} presets={[2.4,3,3.5,4]} suffix="م" onHelp={() => setShowHeightHelp(true)} />
                    </>}
                  </div>
                  <div style={{ marginTop: "0.5rem", fontSize: "0.6rem", color: "#8A7A66", lineHeight: 1.5 }}>
                    {s.establishmentType === "supermarket"
                      ? "لافتة التموينات: العرض = عرض واجهة المتجر (لا يقل عن 300 سم)، والارتفاع لا يقل عن 80 سم — وفق دليل وزارة البلديات والإسكان."
                      : "ينعكس مباشرةً على مقاس اللوحة: العرض = عرض الواجهة، والارتفاع = ثلث ارتفاع نافذة العرض. يمكنك تعديل المقاس لاحقاً في خطوة «المقاس والخلفية» ضمن الحدود المسموحة."}
                  </div>
                </div>
              );
            })()}
          </AccordionSection>

          {/* 1 — المقاس والخلفية */}
          <AccordionSection title="المقاس والخلفية" icon="📐" num={2} done={confirmed("dims")} open={openSections.includes("dims")} onToggle={() => toggleSection("dims")} onConfirm={() => confirmSection("dims")}>
            <div style={{ marginTop: "0.5rem" }}>
              <div style={{ fontSize: "0.68rem", color: "#5A4A3A", fontWeight: 700, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>موضع التثبيت</div>
              <Choice value={s.mount} onChange={v => {
                // الحفاظ على نفس مقاس اللوحة (المرتبط بالاشتراطات) عند تبديل موضع التثبيت
                if (v === s.mount) return;
                if (v === "wall") set({ mount: v, wallW: s.bgW, wallH: s.bgH });
                else set({ mount: v, bgW: s.wallW, bgH: s.wallH });
              }}
                options={[{ v: "background", label: "على خلفية" }, { v: "wall", label: "على الجدار" }]} />
              {s.mount === "wall" ? (
                <div style={{ marginTop: "0.75rem" }}>
                  <div style={{ fontSize: "0.68rem", color: "#5A4A3A", fontWeight: 700, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>أبعاد منطقة الجدار</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    <Stepper label="العرض" value={s.wallW} onChange={v => set({ wallW: v })} min={30} max={1200} step={10} presets={[150,200,300,400]} />
                    <Stepper label="الارتفاع" value={s.wallH} onChange={v => set({ wallH: v })} min={20} max={400} step={5} presets={[60,80,100,120]} />
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: "0.75rem" }}>
                  <div style={{ fontSize: "0.68rem", color: "#5A4A3A", fontWeight: 700, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>هل تمتلك خلفية؟</div>
                  <Choice value={s.bgMode} onChange={v => set({ bgMode: v })}
                    options={[{ v: "add", label: "أضِفها للطلب" }, { v: "exists", label: "موجودة لديّ" }]} />
                  {/* نوع الخلفية أولاً ثم اللون */}
                  {s.bgMode === "add" && (
                    <div style={{ marginTop: "0.75rem" }}>
                      <div style={{ fontSize: "0.7rem", color: "#5A4A3A", fontWeight: 700, marginBottom: "0.4rem" }}>نوع الخلفية</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.45rem" }}>
                        {Object.entries(RATES.background).map(([k, m]) => { const on = s.bgMaterial === k; return (
                          <button key={k} onClick={() => set({ bgMaterial: k })} style={{ padding: "0.6rem 0.4rem", borderRadius: 10, cursor: "pointer", textAlign: "center", border: `1.5px solid ${on ? GOLD : "rgba(154,106,42,0.2)"}`, background: on ? `${GOLD}10` : "#E8DAC0", fontFamily: "Cairo,sans-serif" }}>
                            <div style={{ fontSize: "1rem", marginBottom: "0.2rem" }}>{m.illuminated ? "💡" : "🧱"}</div>
                            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: on ? GOLD : "#2C1E15" }}>{m.label}</div>
                            <div style={{ fontSize: "0.6rem", color: on ? `${GOLD}99` : "#7A6A5A", marginTop: 2 }}>{m.rate} ر.س/م²</div>
                          </button>
                        ); })}
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: "0.75rem" }}>
                    <div style={{ fontSize: "0.7rem", color: "#5A4A3A", fontWeight: 700, marginBottom: "0.45rem" }}>لون الخلفية</div>
                    {s.establishmentType === "supermarket" ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.45rem 0.6rem", borderRadius: 8, background: "rgba(0,107,84,0.08)", border: "1px solid rgba(0,107,84,0.3)" }}>
                        <div style={{ width: 24, height: 24, borderRadius: 5, background: SUPERMARKET_GREEN, flexShrink: 0, border: "1.5px solid rgba(0,107,84,0.5)" }} />
                        <div style={{ fontSize: "0.62rem", color: "#2E7A3E", lineHeight: 1.4 }}>
                          <b>Pantone 328</b> — اللون الموحّد للتموينات (مثبّت بدليل الوزارة)
                          <br /><span style={{ opacity: 0.7 }}>🔒 لا يمكن تغييره</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
                          {BG_COLORS.filter(c => c.id !== "custom").map(c => { const active = s.bgColorId === c.id && !s.bgCustomColor; return (
                            <button key={c.id} onClick={() => set({ bgColorId: c.id, bgCustomColor: "" })} title={c.label}
                              style={{ width: 28, height: 28, borderRadius: 7, background: c.hex, border: `2px solid ${active ? SEL_RED : "rgba(154,106,42,0.25)"}`, boxShadow: active ? `0 0 0 1px ${SEL_RED}` : "none", cursor: "pointer", outline: "none", flexShrink: 0 }}>
                              {active && <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", fontSize: "0.7rem", fontWeight: 900, color: tickColor(c.hex) }}>✓</span>}
                            </button>
                          ); })}
                          {/* لون مخصص — مظهر قوس قزح يُفهم بالنظر أنه «اختر أي لون» */}
                          <label title="لون مخصص — اختر أي لون"
                            style={{ position: "relative", width: 28, height: 28, borderRadius: 7, flexShrink: 0, cursor: "pointer", overflow: "hidden",
                              border: `2px solid ${s.bgCustomColor ? SEL_RED : "rgba(154,106,42,0.25)"}`,
                              boxShadow: s.bgCustomColor ? `0 0 0 1px ${SEL_RED}` : "none",
                              background: s.bgCustomColor || "conic-gradient(from 0deg, #ff3b30, #ffcc00, #34c759, #00c7be, #007aff, #af52de, #ff2d55, #ff3b30)" }}>
                            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 900, lineHeight: 1,
                              color: s.bgCustomColor ? tickColor(s.bgCustomColor) : "#fff", textShadow: s.bgCustomColor ? "none" : "0 1px 2px rgba(0,0,0,0.6)", pointerEvents: "none" }}>
                              {s.bgCustomColor ? "✓" : "+"}
                            </span>
                            <input type="color" value={s.bgCustomColor || "#aaaaaa"} onChange={e => set({ bgColorId: "custom", bgCustomColor: e.target.value })}
                              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", border: "none", padding: 0 }} />
                          </label>
                        </div>
                        {s.bgMode === "exists" && (
                          <div style={{ marginTop: "0.4rem", fontSize: "0.6rem", color: "#8A7A66", lineHeight: 1.5 }}>
                            اللون يظهر في المعاينة فقط لمطابقة خلفيتك الحالية — <b>لا يُحتسب في التسعير</b> لأن الخلفية موجودة لديك.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div style={{ marginTop: "0.75rem" }}>
                    <div style={{ fontSize: "0.68rem", color: "#5A4A3A", fontWeight: 700, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>أبعاد الخلفية</div>
                    <div style={{ marginBottom: "0.6rem", padding: "0.6rem 0.75rem", borderRadius: 10, background: "rgba(201,162,75,0.06)", border: "1px solid rgba(201,162,75,0.25)", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "0.85rem", lineHeight: 1 }}>⚠️</span>
                      <span style={{ fontSize: "0.66rem", color: "#6B5320", lineHeight: 1.7 }}>
                        تنبيه: تنص الاشتراطات البلدية على ألا يتجاوز <b>عرض اللوحة</b> عرض واجهة المتجر، وألا يتجاوز <b>ارتفاعها</b> ثلث ارتفاع الواجهة.
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      <Stepper label="العرض" value={s.bgW} onChange={v => set({ bgW: v })} min={30} max={1200} step={10} presets={[150,200,300,400,500]} />
                      <Stepper label="الارتفاع" value={s.bgH} onChange={v => set({ bgH: v })} min={20} max={400} step={5} presets={[60,80,100,120,150]} />
                    </div>
                  </div>
                  {s.bgMode === "add" && <>
                    {s.bgMaterial === "lightbox" && (
                      <div style={{ marginTop: "0.75rem", padding: "0.75rem", borderRadius: 12, background: "rgba(0,120,200,0.06)", border: "1px solid rgba(120,200,255,0.2)" }}>
                        <div style={{ fontSize: "0.7rem", color: "#90d4ff", fontWeight: 700, marginBottom: "0.5rem" }}>💡 مادة وجه الخلفية المضيئة</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          {LIGHTBOX_FACES.map(f => { const on = s.lightboxFace === f.id; return (
                            <button key={f.id} onClick={() => set({ lightboxFace: f.id })} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.55rem 0.75rem", borderRadius: 9, cursor: "pointer", border: `1.5px solid ${on ? "#90d4ff" : "rgba(120,200,255,0.15)"}`, background: on ? "rgba(0,120,200,0.15)" : "rgba(0,80,160,0.06)", fontFamily: "Cairo,sans-serif" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                {on && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#90d4ff", display: "inline-block" }} />}
                                <div>
                                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: on ? "#90d4ff" : "#ccc" }}>{f.label}</div>
                                  <div style={{ fontSize: "0.62rem", color: on ? "rgba(144,212,255,0.7)" : "#555" }}>{f.desc}</div>
                                </div>
                              </div>
                              <span style={{ fontSize: "0.68rem", color: on ? "#90d4ff" : "#555", fontWeight: 600 }}>{f.rateM2} ر.س/م²</span>
                            </button>
                          ); })}
                        </div>
                        <div style={{ marginTop: "0.65rem" }}>
                          <div style={{ fontSize: "0.68rem", color: "#90d4ff", fontWeight: 700, marginBottom: "0.45rem" }}>🌡 درجة حرارة الإضاءة</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.4rem" }}>
                            {LIGHT_TEMPS.map(t => { const on = s.bgLightTempId === t.id; return (
                              <button key={t.id} onClick={() => set({ bgLightTempId: t.id })} style={{ padding: "0.5rem 0.3rem", borderRadius: 9, cursor: "pointer", textAlign: "center", border: `1.5px solid ${on ? "#90d4ff" : "rgba(120,200,255,0.12)"}`, background: on ? "rgba(0,120,200,0.2)" : "rgba(0,80,160,0.04)", fontFamily: "Cairo,sans-serif" }}>
                                <span style={{ display: "block", width: 18, height: 18, borderRadius: "50%", margin: "0 auto 3px", background: t.glow, boxShadow: `0 0 8px ${t.glow}` }} />
                                <div style={{ fontSize: "0.63rem", fontWeight: 700, color: on ? "#90d4ff" : "#ccc" }}>{t.label}</div>
                                <div style={{ fontSize: "0.52rem", color: "#ccc" }}>{t.k}</div>
                              </button>
                            ); })}
                          </div>
                        </div>
                        <button onClick={() => set({ night: !s.night })} style={{ marginTop: "0.6rem", width: "100%", padding: "0.5rem", borderRadius: 9, cursor: "pointer", fontFamily: "Cairo,sans-serif", fontWeight: 800, fontSize: "0.74rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", border: `1.5px solid ${s.night ? "#90d4ff" : "rgba(120,200,255,0.25)"}`, background: s.night ? "rgba(0,120,200,0.25)" : "rgba(0,80,160,0.06)", color: s.night ? "#90d4ff" : "#ccc" }}>
                          {s.night ? "☀ وضع النهار" : "🌙 معاينة ليلية للخلفية"}
                        </button>
                      </div>
                    )}
                    <div style={{ marginTop: "0.65rem" }}><Stepper label="عمق الخلفية" value={s.bgD} onChange={v => set({ bgD: v })} min={2} max={30} step={1} presets={[5,8,12,15,20]} /></div>
                  </>}
                </div>
              )}
              <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(154,106,42,0.18)" }}>
                <div style={{ fontSize: "0.68rem", color: "#5A4A3A", fontWeight: 700, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>عمق الحرف البارز</div>
                <Stepper label="" value={s.letterDepthCm} onChange={v => set({ letterDepthCm: v })} min={2} max={25} step={1} presets={[3,5,8,12]} />
              </div>
            </div>

            {/* ── أشكال الخلفية ── */}
            <div style={{ marginTop: "0.85rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(154,106,42,0.18)" }}>
              <div style={{ fontSize: "0.68rem", color: "#5A4A3A", fontWeight: 700, marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>أشكال خلفية ملونة</div>
              <div style={{ fontSize: "0.6rem", color: "#8A7A66", marginBottom: "0.45rem" }}>أشرطة وأقسام لونية تُضاف خلف المحتوى</div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                {([["rect","■","شريط/مستطيل"],["circle","●","دائرة"],["line","━","فاصل"],["triangle","▲","مثلث"]] as const).map(([type,icon,label]) => (
                  <button key={type} onClick={() => addShape(type)}
                    style={{ flex:1, padding:"0.4rem 0.2rem", borderRadius:8, cursor:"pointer", fontFamily:"Cairo,sans-serif", fontSize:"0.65rem", fontWeight:700, border:"1px solid rgba(154,106,42,0.2)", background:"rgba(154,106,42,0.06)", color:"#5A4A3A", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                    <span style={{ fontSize:"0.82rem", color:GOLD }}>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </AccordionSection>

          {/* 3 — خامة الحروف والتشطيب */}
          <AccordionSection title="خامة الحروف والتشطيب" icon="🔩" num={3} done={confirmed("material")} open={openSections.includes("material")} onToggle={() => toggleSection("material")} onConfirm={() => confirmSection("material")}>
            <div style={{ marginTop: "0.5rem" }}>
              {/* tabs: نصوص / محتويات */}
              <div style={{ display: "flex", gap: 6, marginBottom: "0.6rem" }}>
                {(["text","content"] as const).map(g => (
                  <button key={g} onClick={() => setMatGroup(g)}
                    style={{ flex: 1, padding: "0.35rem 0", borderRadius: 8, border: matGroup === g ? "1.5px solid #C9A24B" : "1px solid rgba(154,106,42,0.25)", background: matGroup === g ? "rgba(201,162,75,0.12)" : "transparent", fontFamily: "Cairo,sans-serif", fontWeight: matGroup===g?800:600, fontSize: "0.75rem", color: matGroup===g?"#2C1E15":"#634E40", cursor: "pointer" }}>
                    {g === "text" ? "🔤 النصوص" : "🖼 المحتويات"}
                  </button>
                ))}
              </div>
              {/* بطاقة الخامة الحالية + زر الفتح */}
              <button onClick={() => setShowMatModal(true)}
                style={{ width: "100%", textAlign: "right", padding: "0.6rem 0.75rem", borderRadius: 10, border: "1px solid rgba(201,162,75,0.35)", background: "rgba(201,162,75,0.06)", fontFamily: "Cairo,sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.7rem", color: "#9A7A46" }}>اضغط للتعديل ▸</span>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "#2C1E15" }}>
                    {letterTypes.find(lt => lt.slug === (isText ? s.typeId+"-"+(s.sideMat==="aluminum"?"alum":s.sideMat) : s.cTypeId+"-"+(s.cSideMat==="aluminum"?"alum":s.cSideMat)))?.nameAr
                      ?? letterTypes.find(lt => lt.faceMaterial === (isText?s.typeId:s.cTypeId))?.nameAr
                      ?? "🔩 اختر خامة الحرف"}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#9A7A46", marginTop: 2 }}>
                    {MG.faceType.label} · {MG.sideType.label} · {isText ? (s.lightTypeId==="none"?"بدون إضاءة":s.lightTypeId==="front"?"أمامية":s.lightTypeId==="back"?"خلفية":"مزدوجة") : "—"}
                  </div>
                </div>
              </button>
            </div>
          </AccordionSection>
        </div>

        {/* ─── LEFT (area l): تخصيص اللوحة — خطوات 4·5·6 (مكان الملخص سابقاً) ─── */}
        <div style={{ gridArea: "l", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {/* فراغ مكافئ لعنوان «تخصيص اللوحة» في العمود الأيمن — ليتساوى مستوى بداية القائمتين */}
          <div aria-hidden style={{ fontSize: "0.9rem", fontWeight: 900, padding: "0.1rem 0.2rem 0.2rem", visibility: "hidden" }}>تخصيص اللوحة</div>
          {/* 4 — المحتويات (نص · شعار · QR · استيراد من السجل) */}
          <AccordionSection title="المحتويات" icon="✏️" num={4} done={confirmed("text")} open={openSections.includes("text")} onToggle={() => toggleSection("text")} onConfirm={() => confirmSection("text")}>
            <div style={{ marginTop: "0.5rem" }}>
              {/* استيراد سريع من السجل التجاري — يضيف اسم المنشأة و QR للتصميم */}
              <div style={{ marginBottom: "0.85rem", padding: "0.7rem 0.8rem", borderRadius: 11, background: "rgba(201,162,75,0.08)", border: "1px dashed rgba(154,106,42,0.4)" }}>
                <input ref={crRef} type="file" accept="application/pdf,image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleCR(f); e.currentTarget.value = ""; }} />
                {isPro() ? (
                  <button onClick={() => crRef.current?.click()} disabled={crBusy}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0.6rem", borderRadius: 9, border: "none", cursor: crBusy ? "wait" : "pointer", fontFamily: "Cairo,sans-serif", fontWeight: 800, fontSize: "0.78rem", background: G, color: "#2C1E15", opacity: crBusy ? 0.7 : 1 }}>
                    {crBusy ? "⏳ جارٍ القراءة…" : "📄 استيراد من السجل التجاري"}
                  </button>
                ) : (
                  <button onClick={() => choosePlan("pro")}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0.6rem", borderRadius: 9, border: "1px solid rgba(154,106,42,0.3)", cursor: "pointer", fontFamily: "Cairo,sans-serif", fontWeight: 800, fontSize: "0.78rem", background: "rgba(154,106,42,0.08)", color: "#9A6A2A" }}>
                    🔒 استيراد السجل التجاري — الخطة الاحترافية
                  </button>
                )}
                <div style={{ marginTop: "0.45rem", fontSize: "0.6rem", color: "#8A7A66", lineHeight: 1.55, textAlign: "center" }}>
                  ارفع ملف السجل (PDF أو صورة) — نقرأ منه <strong>اسم المنشأة</strong> و<strong>رمز QR</strong> ونضيفهما للتصميم تلقائياً (يمكنك تعديل الاسم بعدها).
                </div>
              </div>

              {/* محتويات اللوحة المطلوبة حسب نوع المنشأة ونوع اللوحة (إجباري/اختياري) */}
              {(() => {
                const spec = contentSpec(s.establishmentType);
                // للتموينات: استثناء طبقة الشريط السفلي من كشف العناصر الرئيسية
                const supStripTop = s.establishmentType === "supermarket"
                  ? ((s.bgH - SUPERMARKET_STRIP_CM) / s.bgH) * 100 : 101;
                const has: Record<string, boolean> = {
                  arname: layers.some(l => l.kind === "text" && l.lang === "ar" && l.y < supStripTop && (l.text || "").trim() !== ""),
                  enname: layers.some(l => l.kind === "text" && l.lang === "en" && l.y < supStripTop && (l.text || "").trim() !== ""),
                  qr:     layers.some(l => l.kind === "qr"),
                  logo:   layers.some(l => l.kind === "logo" || (l.kind === "svg" && l.aspect > 0.5)),
                  phone:  layers.some(l => l.kind === "text" && /[0-9]{7,}/.test((l.text || "").replace(/\s/g, ""))),
                };
                // طبقات مرتبطة بالمفاتيح (للتموينات)
                const arLayer = layers.find(l => l.kind === "text" && l.lang === "ar" && l.y < supStripTop);
                const enLayer = layers.find(l => l.kind === "text" && l.lang === "en" && l.y < supStripTop);
                const stripL  = layers.find(l => l.kind === "text" && l.y >= supStripTop);
                // استخراج أرقام الشريط
                const stripText  = (stripL?.kind === "text" ? stripL.text : "") || "";
                const toAr = (s: string) => s.replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]);
                const toEn = (s: string) => s.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
                // الأرقام مخزّنة عربية في الطبقة — نحوّل النص لغربي للمطابقة فقط
                const stripTextN = toEn(stripText);
                const phoneMatch = stripTextN.match(/(جوال|هاتف)\s*(\d*)/);
                const stripPhone = phoneMatch ? phoneMatch[2] : "";
                const stripCTp   = (phoneMatch ? phoneMatch[1] : supContactType) as "جوال" | "هاتف";
                const crMatch    = stripTextN.match(/سجل تجاري\s*([\d\-]*)/);
                const stripCR    = crMatch ? crMatch[1] : "";
                // تحديث نص الشريط — يخزّن الأرقام عربية ويحافظ على الجزء الآخر
                const updateStrip = (type: string, num: string) => {
                  if (!stripL) return;
                  const cr = toEn(stripText).match(/سجل تجاري\s*([\d\-]*)/)?.[1] ?? "٠٠٠٠٠٠٠";
                  updateLayer(stripL.id, { text: `${type} ${toAr(num)}  |  سجل تجاري ${toAr(cr)}` });
                };
                const updateStripCR = (cr: string) => {
                  if (!stripL) return;
                  const type = stripText.match(/(جوال|هاتف)/)?.[1] ?? supContactType;
                  const num  = toEn(stripText).match(/(جوال|هاتف)\s*(\d*)/)?.[2] ?? "";
                  updateLayer(stripL.id, { text: `${type} ${toAr(num)}  |  سجل تجاري ${toAr(cr)}` });
                };
                const inputStyle: React.CSSProperties = {
                  flex: 1, padding: "0.22rem 0.5rem", borderRadius: 7, border: "1.5px solid rgba(154,106,42,0.35)",
                  fontFamily: "Cairo,sans-serif", fontSize: "0.7rem", background: "#FBF6EC",
                  color: "#2C1E15", outline: "none", direction: "rtl", minWidth: 0,
                };
                const Row = (it: ContentReq, required: boolean) => {
                  const present = has[it.key];
                  const isSup = s.establishmentType === "supermarket";
                  // صفوف arname/enname للتموينات: حقل إدخال مرتبط بالطبقة
                  if (isSup && (it.key === "arname" || it.key === "enname")) {
                    const layer = it.key === "arname" ? arLayer : enLayer;
                    const layerText = layer?.kind === "text" ? layer.text : "";
                    return (
                      <div key={it.key} style={{ borderRadius: 9, background: present ? "rgba(46,122,62,0.06)" : "#F2E8D0", border: `1px solid ${present ? "rgba(46,122,62,0.3)" : "rgba(154,106,42,0.18)"}`, overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.38rem 0.55rem" }}>
                          <span style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(154,106,42,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800, color: "#9A6A2A", flexShrink: 0 }}>{it.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "0.73rem", fontWeight: 700, color: "#2C1E15" }}>{it.label}</div>
                            {it.hint && !present && <div style={{ fontSize: "0.59rem", color: "#8A7A66" }}>{it.hint}</div>}
                          </div>
                          {present && <span style={{ flexShrink: 0, fontSize: "0.62rem", fontWeight: 800, color: "#2E7A3E" }}>✓</span>}
                        </div>
                        <div style={{ padding: "0 0.55rem 0.45rem", display: "flex", gap: 6 }}>
                          <input
                            style={{ ...inputStyle, textAlign: it.key === "enname" ? "left" : "right", direction: it.key === "enname" ? "ltr" : "rtl" }}
                            placeholder={it.key === "arname" ? "اسم المنشأة بالعربية" : "Brand Name"}
                            value={layerText}
                            onChange={e => layer ? updateLayer(layer.id, { text: e.target.value }) : undefined}
                          />
                          {!present && (
                            <button onClick={() => addContentItem(it.key)}
                              style={{ flexShrink: 0, padding: "0.22rem 0.7rem", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: "Cairo,sans-serif", fontWeight: 800, fontSize: "0.63rem", background: required ? G : "rgba(154,106,42,0.14)", color: required ? "#2C1E15" : "#9A6A2A", whiteSpace: "nowrap" }}>
                              + إضافة
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }
                  // صف رقم السجل التجاري (QR) للتموينات: رقم السجل + إضافة QR
                  if (isSup && it.key === "qr") {
                    return (
                      <div key={it.key} style={{ borderRadius: 9, background: present ? "rgba(46,122,62,0.06)" : "#F2E8D0", border: `1px solid ${present ? "rgba(46,122,62,0.3)" : "rgba(154,106,42,0.18)"}`, overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.38rem 0.55rem" }}>
                          <span style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(154,106,42,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800, color: "#9A6A2A", flexShrink: 0 }}>{it.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "0.73rem", fontWeight: 700, color: "#2C1E15" }}>{it.label}</div>
                            {it.hint && <div style={{ fontSize: "0.59rem", color: "#8A7A66" }}>{it.hint}</div>}
                          </div>
                          {present && <span style={{ flexShrink: 0, fontSize: "0.62rem", fontWeight: 800, color: "#2E7A3E" }}>✓</span>}
                        </div>
                        <div style={{ padding: "0 0.55rem 0.45rem" }}>
                          <input
                            style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                            placeholder="رقم السجل التجاري"
                            inputMode="numeric"
                            lang="ar"
                            value={toAr(stripCR)}
                            onChange={e => updateStripCR(toEn(e.target.value))}
                          />
                        </div>
                      </div>
                    );
                  }
                  // صف رقم التواصل للتموينات: خيار هاتف/جوال + رقم
                  if (isSup && it.key === "phone") {
                    return (
                      <div key={it.key} style={{ borderRadius: 9, background: present ? "rgba(46,122,62,0.06)" : "#F2E8D0", border: `1px solid ${present ? "rgba(46,122,62,0.3)" : "rgba(154,106,42,0.18)"}`, overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.38rem 0.55rem" }}>
                          <span style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(154,106,42,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800, color: "#9A6A2A", flexShrink: 0 }}>{it.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "0.73rem", fontWeight: 700, color: "#2C1E15" }}>{it.label}</div>
                          </div>
                          {present && <span style={{ flexShrink: 0, fontSize: "0.62rem", fontWeight: 800, color: "#2E7A3E" }}>✓</span>}
                        </div>
                        {/* اختيار نوع التواصل */}
                        <div style={{ padding: "0 0.55rem", display: "flex", gap: 6, marginBottom: "0.3rem" }}>
                          {(["جوال", "هاتف"] as const).map(t => (
                            <button key={t} onClick={() => { setSupContactType(t); if (stripL) updateStrip(t, stripPhone || "000-0000000"); }}
                              style={{ flex: 1, padding: "0.22rem", borderRadius: 7, border: `1.5px solid ${stripCTp === t ? "#006B54" : "rgba(154,106,42,0.25)"}`, background: stripCTp === t ? "rgba(0,107,84,0.1)" : "transparent", fontFamily: "Cairo,sans-serif", fontSize: "0.7rem", fontWeight: 700, color: stripCTp === t ? "#006B54" : "#5A4A3A", cursor: "pointer" }}>
                              {t}
                            </button>
                          ))}
                        </div>
                        {/* حقل الرقم */}
                        <div style={{ padding: "0 0.55rem 0.45rem", display: "flex", gap: 6 }}>
                          <input
                            style={{ ...inputStyle }}
                            placeholder="05XXXXXXXXX"
                            inputMode="numeric"
                            lang="ar"
                            value={toAr(stripPhone)}
                            onChange={e => { if (stripL) updateStrip(stripCTp, toEn(e.target.value)); }}
                          />
                          {!present && (
                            <button onClick={() => { if (!stripL) addContentItem(it.key); }}
                              style={{ flexShrink: 0, padding: "0.22rem 0.7rem", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: "Cairo,sans-serif", fontWeight: 800, fontSize: "0.63rem", background: "rgba(154,106,42,0.14)", color: "#9A6A2A", whiteSpace: "nowrap" }}>
                              + إضافة
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }
                  // الصف العادي لبقية العناصر
                  return (
                    <div key={it.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.42rem 0.55rem", borderRadius: 9, background: present ? "rgba(46,122,62,0.08)" : "#F2E8D0", border: `1px solid ${present ? "rgba(46,122,62,0.3)" : "rgba(154,106,42,0.18)"}` }}>
                      <span style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(154,106,42,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800, color: "#9A6A2A", flexShrink: 0 }}>{it.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.73rem", fontWeight: 700, color: "#2C1E15" }}>{it.label}</div>
                        {it.hint && <div style={{ fontSize: "0.59rem", color: "#8A7A66", lineHeight: 1.4 }}>{it.hint}</div>}
                      </div>
                      {present
                        ? <span style={{ flexShrink: 0, fontSize: "0.65rem", fontWeight: 800, color: "#2E7A3E" }}>✓ مُضاف</span>
                        : <button onClick={() => addContentItem(it.key)} style={{ flexShrink: 0, padding: "0.26rem 0.7rem", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: "Cairo,sans-serif", fontWeight: 800, fontSize: "0.63rem", background: required ? G : "rgba(154,106,42,0.14)", color: required ? "#2C1E15" : "#9A6A2A" }}>+ إضافة</button>}
                    </div>
                  );
                };
                return (
                  <div style={{ marginBottom: "0.85rem", borderRadius: 12, border: "1px solid rgba(154,106,42,0.25)", overflow: "hidden", background: "#FBF6EC" }}>
                    <div style={{ padding: "0.55rem 0.8rem", background: "rgba(201,162,75,0.12)", borderBottom: "1px solid rgba(154,106,42,0.18)" }}>
                      <div style={{ fontSize: "0.76rem", fontWeight: 900, color: "#2C1E15" }}>محتويات اللوحة المطلوبة</div>
                      <div style={{ fontSize: "0.62rem", color: "#8A7A66", marginTop: 2 }}>حسب: {estById(s.establishmentType).label} · لوحة {SIGN_KINDS.find(k => k.id === s.signType)?.label || "—"}</div>
                    </div>
                    <div style={{ padding: "0.6rem 0.7rem", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                          <span style={{ fontSize: "0.6rem", fontWeight: 900, color: "#fff", background: SEL_RED, borderRadius: 5, padding: "1px 7px" }}>إجباري</span>
                          <span style={{ fontSize: "0.61rem", color: "#8A7A66" }}>لا يُعتمد التصميم بدونها</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>{spec.mandatory.map(it => Row(it, true))}</div>
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                          <span style={{ fontSize: "0.6rem", fontWeight: 900, color: "#9A6A2A", background: "rgba(154,106,42,0.15)", borderRadius: 5, padding: "1px 7px" }}>اختياري</span>
                          <span style={{ fontSize: "0.61rem", color: "#8A7A66" }}>تُحسّن اللوحة وتُضاف حسب الحاجة</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>{spec.optional.map(it => Row(it, false))}</div>
                      </div>
                    </div>
                    {/* تنبيه: العلامة التجارية يجب أن تكون مسجّلة */}
                    <div style={{ padding: "0.55rem 0.8rem", borderTop: "1px solid rgba(154,106,42,0.18)", background: "rgba(201,140,40,0.08)", display: "flex", gap: 7, alignItems: "flex-start" }}>
                      <span style={{ fontSize: "0.85rem", lineHeight: 1, flexShrink: 0 }}>®️</span>
                      <span style={{ fontSize: "0.62rem", color: "#6B5320", lineHeight: 1.65 }}>
                        تنصّ الاشتراطات على أنّ إظهار <b>الشعار أو الاسم الأجنبي</b> يتطلّب <b>علامة تجارية مسجّلة</b> لدى الهيئة السعودية للملكية الفكرية (SAIP). بدون تسجيل تُصمَّم اللوحة بالاسم العربي والرمز فقط{estById(s.establishmentType).special ? "، وللتموينات يُعتمد التصميم الأخضر الموحّد." : "."}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {s.contentMode === "upload" && (
                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ fontSize: "0.68rem", color: "#5A4A3A", fontWeight: 700, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>رفع ملف التصميم</div>
                  <div onClick={() => fileRef.current?.click()} style={{ border: `2px dashed rgba(201,162,75,${s.uploadName ? 0.5 : 0.22})`, borderRadius: 12, padding: "1rem", textAlign: "center", cursor: "pointer", background: s.uploadName ? "rgba(74,222,128,0.05)" : "#E8DAC0" }}>
                    {s.uploadName ? <div style={{ color: "#16a34a", fontWeight: 800, fontSize: "0.82rem" }}>✓ {s.uploadName}</div>
                      : <div style={{ color: "#2C1E15", fontSize: "0.78rem", fontWeight: 700 }}>📤 اسحب ملف التصميم هنا أو انقر للاختيار</div>}
                    {/* ملاحظة الصيغ المدعومة للعميل */}
                    <div style={{ marginTop: "0.45rem", display: "flex", flexWrap: "wrap", gap: "0.3rem", justifyContent: "center" }}>
                      {["AI", "PDF", "EPS", "SVG", "PSD", "PNG", "JPG"].map(fmt => (
                        <span key={fmt} style={{ fontSize: "0.6rem", fontWeight: 800, color: GOLD, background: "rgba(201,162,75,0.1)", border: "1px solid rgba(201,162,75,0.3)", borderRadius: 6, padding: "1px 7px" }}>{fmt}</span>
                      ))}
                    </div>
                    <div style={{ marginTop: "0.4rem", fontSize: "0.62rem", color: "#5A4A3A" }}>الصيغ المدعومة أعلاه · الحد الأقصى {MAX_UPLOAD_MB} ميجابايت</div>
                    <input ref={fileRef} type="file" accept=".pdf,.ai,.eps,.svg,.psd,.cdr,.png,.jpg,.jpeg,.webp" style={{ display: "none" }} onChange={e => {
                      const f = e.target.files?.[0]; if (!f) return;
                      handleUploadFile(f);
                      e.target.value = "";
                    }} />
                  </div>
                </div>
              )}
              <div style={{ fontSize: "0.68rem", color: "#5A4A3A", fontWeight: 700, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>إضافة عنصر للتصميم</div>
              <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.4rem" }}>
                <button onClick={addText} style={{ flex: 1, padding: "0.45rem", borderRadius: 8, cursor: "pointer", fontFamily: "Cairo,sans-serif", fontSize: "0.74rem", fontWeight: 700, border: "1px solid rgba(201,162,75,0.4)", background: "rgba(201,162,75,0.1)", color: GOLD }}>T نص</button>
                <button onClick={() => logoRef2.current?.click()} style={{ flex: 1, padding: "0.45rem", borderRadius: 8, cursor: "pointer", fontFamily: "Cairo,sans-serif", fontSize: "0.74rem", fontWeight: 700, border: "1px solid rgba(154,106,42,0.2)", background: "rgba(154,106,42,0.08)", color: "#2C1E15" }}>🖼 شعار</button>
                <button onClick={addQR} style={{ flex: 1, padding: "0.45rem", borderRadius: 8, cursor: "pointer", fontFamily: "Cairo,sans-serif", fontSize: "0.74rem", fontWeight: 700, border: "1px solid rgba(154,106,42,0.2)", background: "rgba(154,106,42,0.08)", color: "#2C1E15" }}>▦ QR</button>
                <input ref={logoRef2} type="file" accept="image/*" style={{ display: "none" }} onChange={e => readFile(e, src => addLogo(src))} />
              </div>
              {/* أشكال هندسية */}
              <div style={{ fontSize: "0.63rem", color: "#8A7A66", fontWeight: 700, marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>أشكال هندسية</div>
              <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.6rem" }}>
                {([
                  ["rect",     "■", "مستطيل"],
                  ["circle",   "●", "دائرة"],
                  ["line",     "━", "خط"],
                  ["triangle", "▲", "مثلث"],
                ] as const).map(([type, icon, label]) => (
                  <button key={type} onClick={() => addShape(type)}
                    style={{ flex: 1, padding: "0.4rem 0.2rem", borderRadius: 8, cursor: "pointer", fontFamily: "Cairo,sans-serif", fontSize: "0.68rem", fontWeight: 700, border: "1px solid rgba(154,106,42,0.2)", background: "rgba(154,106,42,0.06)", color: "#5A4A3A", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <span style={{ fontSize: "0.85rem", color: GOLD }}>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              <div style={{ fontSize: "0.68rem", color: "#5A4A3A", fontWeight: 700, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>العناصر الحالية</div>
              <div style={{ fontSize: "0.6rem", color: "#5A4A3A", marginBottom: "0.45rem" }}>أدوات القياس والفصل والدمج أسفل التصميم</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                {layers.length === 0 && <div style={{ padding: "1rem", textAlign: "center", color: "#5A4A3A", fontSize: "0.74rem", border: "1px dashed rgba(154,106,42,0.25)", borderRadius: 10 }}>أضف نصاً أو شعاراً أو QR</div>}
                {(() => { let tn = 0; return layers.map((l, i) => {
                  const isTextPart = l.kind === "svg" && l.aspect <= 0.5; // نص (عريض قصير) لا شعار
                  const textNum = isTextPart ? ++tn : 0;
                  return <LayerRow key={l.id} l={l} num={i + 1} textNum={textNum} sel={l.id === selectedId} faceColors={faceColors} faceColorHex={s.faceCustomColor || (COL[s.faceColorId]?.hex || "#999")} enabledFontIds={enabledFontIds} onSelect={setSelId} onUpdate={updateLayer} onDelete={deleteLayer} inMerge={mergeSel.includes(l.id)} mergeMode={mergeMode} onToggleMerge={toggleMerge} />;
                }); })()}
              </div>
            </div>
          </AccordionSection>

          {/* 4 — نوع الإضاءة */}
          <AccordionSection title="نوع الإضاءة" icon="💡" num={5} done={confirmed("light")} open={openSections.includes("light")} onToggle={() => toggleSection("light")} onConfirm={() => confirmSection("light")}>
            <div style={{ marginTop: "0.5rem" }}>
              <div style={{ fontSize: "0.68rem", color: "#5A4A3A", fontWeight: 700, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>اتجاه الإضاءة</div>
              <Choice cols={2} value={s.lightTypeId} onChange={v => set({ lightTypeId: v })} options={LIGHT_TYPES.map(l => ({ v: l.id, label: l.label, sub: l.hint }))} />
              {/* تحذير الإضاءة الخلفية مع الخلفيات الغامقة */}
              {(s.lightTypeId === "back" || s.lightTypeId === "double") && (() => {
                const bgHex = s.mount === "wall" ? "" : (s.bgCustomColor || BG_COLORS.find(c => c.id === s.bgColorId)?.hex || "");
                const dark = bgHex ? (() => { try { const n = parseInt(bgHex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) < 120; } catch { return false; } })() : false;
                return (
                  <div style={{ marginTop: "0.5rem", padding: "0.55rem 0.7rem", borderRadius: 9, lineHeight: 1.6, fontSize: "0.66rem", fontFamily: "Cairo,sans-serif",
                    background: dark ? "rgba(229,28,28,0.1)" : "rgba(201,162,75,0.12)", border: `1px solid ${dark ? "rgba(229,28,28,0.45)" : "rgba(201,162,75,0.35)"}`, color: dark ? "#b91c1c" : "#6B5320" }}>
                    ⚠ الإضاءة الخلفية (الهالة) لا تتناسب مع الخلفيات الغامقة بسبب سوء انتشار الضوء — يُنصح باختيار خلفية بلون فاتح لإبراز الهالة.
                    {dark ? " خلفيتك الحالية غامقة، يُفضّل تفتيحها." : ""}
                  </div>
                );
              })()}
              <div style={{ fontSize: "0.68rem", color: "#5A4A3A", fontWeight: 700, margin: "0.65rem 0 0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>درجة حرارة اللون</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.45rem", opacity: s.lightTypeId === "none" ? 0.4 : 1, pointerEvents: s.lightTypeId === "none" ? "none" : "auto" }}>
                {LIGHT_TEMPS.map(t => { const on = s.lightTempId === t.id; return (
                  <button key={t.id} onClick={() => set({ lightTempId: t.id })} style={{ padding: "0.5rem 0.3rem", borderRadius: 10, cursor: "pointer", textAlign: "center", border: `1.5px solid ${on ? GOLD : "rgba(154,106,42,0.2)"}`, background: on ? "rgba(201,162,75,0.08)" : "#E8DAC0", fontFamily: "Cairo,sans-serif" }}>
                    <span style={{ display: "block", width: 20, height: 20, borderRadius: "50%", margin: "0 auto 3px", background: t.glow, boxShadow: `0 0 10px ${t.glow}` }} />
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: on ? GOLD : "#2C1E15" }}>{t.label}</div>
                    <div style={{ fontSize: "0.55rem", color: "#5A4A3A" }}>{t.k}</div>
                  </button>
                ); })}
              </div>
              <button onClick={() => set({ night: !s.night })} style={{ marginTop: "0.65rem", width: "100%", padding: "0.55rem", borderRadius: 10, cursor: "pointer", fontFamily: "Cairo,sans-serif", fontWeight: 800, fontSize: "0.76rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", border: `1.5px solid ${s.night ? GOLD : "rgba(201,162,75,0.35)"}`, background: s.night ? G : "rgba(201,162,75,0.05)", color: s.night ? "#2C1E15" : GOLD }}>
                {s.night ? "☀ وضع النهار" : "🌙 الرؤية الليلية"}
              </button>
            </div>
          </AccordionSection>

          {/* 5 — التركيب والموقع */}
          <AccordionSection title="التركيب والموقع" icon="🏗" num={6} done={confirmed("install")} open={openSections.includes("install")} onToggle={() => toggleSection("install")} onConfirm={() => confirmSection("install")}>
            <div style={{ marginTop: "0.5rem" }}>
              <div style={{ fontSize: "0.68rem", color: "#5A4A3A", fontWeight: 700, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>خدمة التركيب</div>
              <Choice value={s.wantInstall ? "yes" : "no"} onChange={v => set({ wantInstall: v === "yes" })}
                options={[{ v: "yes", label: "أرغب بالتركيب" }, { v: "no", label: "سأتولّى التركيب" }]} />
              {s.wantInstall && (
                <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                  <div style={{ fontSize: "0.68rem", color: "#5A4A3A", fontWeight: 700, marginBottom: "-0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>منطقة التركيب</div>
                  <Choice value={s.installRegion} onChange={v => set({ installRegion: v })}
                    options={[{ v: "jeddah", label: "داخل جدة" }, { v: "outside", label: "خارج جدة", sub: `+${rr(RATES.install.outsideJeddahFee)} ر.س` }]} />
                  <div style={{ fontSize: "0.68rem", color: "#5A4A3A", fontWeight: 700, marginBottom: "-0.35rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>ارتفاع موضع التركيب</div>
                  <Stepper label="" value={s.installHeightM} onChange={v => set({ installHeightM: v })} min={1} max={40} step={1} presets={[3,6,10,15]} suffix="م" />
                  <label style={{ display: "flex", alignItems: "center", gap: "0.55rem", cursor: "pointer", padding: "0.55rem 0.7rem", borderRadius: 9, background: "#E8DAC0", border: "1px solid rgba(154,106,42,0.2)" }}>
                    <input type="checkbox" checked={s.craneNeeded || s.installHeightM >= RATES.install.craneHeightM} onChange={e => set({ craneNeeded: e.target.checked })} style={{ accentColor: GOLD, width: 15, height: 15 }} />
                    <div>
                      <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#2C1E15" }}>رافعة (كرين)</div>
                      <div style={{ fontSize: "0.62rem", color: "#5A4A3A" }}>+{rr(RATES.install.craneFee)} ر.س</div>
                    </div>
                  </label>
                </div>
              )}

              {/* ── موقع التركيب ── */}
              <div style={{ marginTop: "0.85rem" }}>
                <div style={{ fontSize: "0.68rem", color: "#5A4A3A", fontWeight: 700, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>موقع التركيب</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <button onClick={() => setShowMapModal(true)} style={{ padding: "0.7rem 0.5rem", borderRadius: 10, cursor: "pointer", border: `1.5px solid ${GOLD}`, background: "rgba(201,162,75,0.06)", fontFamily: "Cairo,sans-serif", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
                    <span style={{ fontSize: "1.3rem" }}>🗺</span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#2C1E15" }}>تحديد من الخريطة</span>
                    <span style={{ fontSize: "0.58rem", color: "#634E40" }}>فتح الخريطة التفاعلية</span>
                  </button>
                  <div style={{ padding: "0.7rem 0.5rem", borderRadius: 10, border: "1.5px solid rgba(154,106,42,0.3)", background: "#E8DAC0", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span style={{ fontSize: "1.1rem" }}>🏠</span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#2C1E15" }}>العنوان الوطني</span>
                    </div>
                    <input
                      type="text"
                      value={s.nationalAddress}
                      onChange={e => set({ nationalAddress: e.target.value })}
                      placeholder="مثال: RJAB1234"
                      style={{ width: "100%", padding: "0.4rem 0.5rem", borderRadius: 7, border: "1px solid rgba(154,106,42,0.35)", background: "#F4EFE6", fontFamily: "Cairo,sans-serif", fontSize: "0.72rem", color: "#2C1E15", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
                {s.nationalAddress && (
                  <div style={{ marginTop: "0.4rem", padding: "0.4rem 0.65rem", borderRadius: 8, background: "rgba(61,139,78,0.08)", border: "1px solid rgba(61,139,78,0.2)", fontSize: "0.62rem", color: "#2E7A3E", display: "flex", alignItems: "center", gap: 6 }}>
                    <span>✓</span> تم إدخال العنوان: <strong>{s.nationalAddress}</strong>
                  </div>
                )}
              </div>
            </div>
          </AccordionSection>
        </div>
      </div>

      {/* ── Map Modal ── */}
      {showMapModal && (() => {
        const c = cityById(s.city);
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 8000, display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.75)" }} onClick={() => setShowMapModal(false)}>
            <div style={{ margin: "auto", width: "min(96vw,860px)", height: "min(90vh,620px)", borderRadius: 16, overflow: "hidden", background: "#1E1610", border: "1.5px solid rgba(201,162,75,0.35)", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.7rem 1rem", borderBottom: "1px solid rgba(201,162,75,0.2)", background: "#241A11" }}>
                <div>
                  <div style={{ fontFamily: "Cairo,sans-serif", fontWeight: 900, fontSize: "0.9rem", color: "#F4ECDD" }}>📍 موقع التركيب</div>
                  <div style={{ fontFamily: "Cairo,sans-serif", fontSize: "0.62rem", color: "#A39584", marginTop: 2 }}>اختر الموقع الدقيق لتركيب اللوحة — {c.name}</div>
                </div>
                <button onClick={() => setShowMapModal(false)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(201,162,75,0.3)", background: "rgba(201,162,75,0.08)", color: "#C9A24B", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Cairo,sans-serif" }}>✕</button>
              </div>
              <iframe
                title="خريطة موقع التركيب"
                src={osmEmbed(c.lat, c.lng)}
                style={{ flex: 1, border: "none", display: "block", width: "100%" }}
                loading="lazy"
              />
              <div style={{ padding: "0.6rem 1rem", background: "#241A11", borderTop: "1px solid rgba(201,162,75,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                <div style={{ fontFamily: "Cairo,sans-serif", fontSize: "0.62rem", color: "#A39584", lineHeight: 1.5 }}>
                  يمكنك تكبير الخريطة وتحديد الموقع الدقيق للوحة. أو أدخل العنوان الوطني مباشرةً في الحقل المجاور.
                </div>
                <button onClick={() => setShowMapModal(false)} style={{ padding: "0.5rem 1.2rem", borderRadius: 999, border: "none", background: G, color: "#2C1E15", fontFamily: "Cairo,sans-serif", fontWeight: 800, fontSize: "0.78rem", cursor: "pointer", whiteSpace: "nowrap" }}>تأكيد الموقع</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Modals & Toast ── */}
      {importOpen && (
        <ImportModal onClose={() => setImport(false)} onPick={pr => {
          setLayers(pr.layers.map(l => ({ ...l, id: uid() } as Layer)));
          setSelId(null); setImport(false); set({ contentMode: "design" });
          flash(`تم استيراد «${pr.name}»`);
        }} />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 6000, background: "#141414", border: "1px solid rgba(201,162,75,0.35)", color: "#2C1E15", padding: "0.8rem 1.4rem", borderRadius: 999, fontFamily: "Cairo,sans-serif", fontSize: "0.85rem", fontWeight: 700, boxShadow: "0 16px 40px rgba(0,0,0,0.6)" }}>
          {toast}
        </div>
      )}

      <Sign3DPreview
        open={show3D}
        onClose={() => setShow3D(false)}
        faceCanvas={c3d?.face ?? null}
        silCanvas={c3d?.sil ?? null}
        areaWcm={s.mount === "background" ? s.bgW : s.wallW}
        areaHcm={s.mount === "background" ? s.bgH : s.wallH}
        hasBg={s.mount === "background" && s.bgMode === "add"}
        bgColor={s.bgCustomColor || (BG_COLORS.find(c => c.id === s.bgColorId)?.hex || "#cccccc")}
        bgDepthCm={s.bgD}
        sideColor={s.sideCustomColor || (COL[s.sideColorId]?.hex || "#9aa0a6")}
        letterDepthCm={s.letterDepthCm}
      />
      <SignMockupPreview open={showMockup} onClose={() => setShowMockup(false)} signCanvas={mockupCanvas} />
      {showFacadeHelp && <FacadeHelpModal value={s.facadeWidthCm} onClose={() => setShowFacadeHelp(false)} />}
      {showHeightHelp && <HeightHelpModal windowHeightCm={s.windowHeightCm} signBottomM={s.signBottomM} onClose={() => setShowHeightHelp(false)} />}

      {/* ── مودال حفظ المشروع ── */}
      {saveModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setSaveModalOpen(false)}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#FDFBF7", borderRadius: 16, padding: "2rem", width: "min(94vw,420px)",
              border: "1px solid rgba(201,162,75,0.25)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              fontFamily: "Tajawal,Cairo,sans-serif" }} dir="rtl">
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 800, color: "#2C1E15" }}>
              {currentProjectId ? "تحديث المشروع المحفوظ" : "حفظ المشروع"}
            </h3>
            <p style={{ margin: "0 0 1.2rem", fontSize: "0.82rem", color: "#7A5520" }}>
              سيُحفظ المشروع في متصفحك ويمكنك العودة إليه من صفحة «مشاريعي» في أي وقت.
            </p>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#2C1E15", display: "block", marginBottom: 6 }}>اسم المشروع</label>
            <input
              value={saveProjectName}
              onChange={e => setSaveProjectName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && saveProjectName.trim()) doSaveProject(saveProjectName.trim()); }}
              placeholder="مثال: لوحة مطعم النخبة"
              style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: 10, border: "1.5px solid rgba(201,162,75,0.35)",
                background: "#FFF8EC", fontSize: "0.9rem", fontFamily: "inherit", color: "#2C1E15", boxSizing: "border-box",
                outline: "none", marginBottom: "1.25rem" }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { if (saveProjectName.trim()) doSaveProject(saveProjectName.trim()); }}
                disabled={!saveProjectName.trim()}
                style={{ flex: 1, padding: "0.7rem", borderRadius: 999, border: "none", cursor: saveProjectName.trim() ? "pointer" : "not-allowed",
                  background: saveProjectName.trim() ? "linear-gradient(135deg,#9A7B36,#E6CA83)" : "rgba(154,106,42,0.2)",
                  color: "#2C1E15", fontWeight: 800, fontSize: "0.9rem", fontFamily: "inherit" }}>
                حفظ
              </button>
              <button onClick={() => setSaveModalOpen(false)}
                style={{ padding: "0.7rem 1.2rem", borderRadius: 999, border: "1px solid rgba(154,106,42,0.3)",
                  background: "transparent", color: "#7A5520", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem" }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {signKindPreview && (() => {
        const kindInfo: Record<string, { title: string; desc: string; svg: React.ReactNode }> = {
          parallel: {
            title: "موازية لسطح الواجهة",
            desc: "اللوحة الأكثر شيوعاً — حروف أو لوحة مثبَّتة مسطَّحةً على واجهة المبنى أو المحل مباشرةً، لا تبرز أكثر من 25 سم.",
            svg: (
              <svg viewBox="0 0 380 260" style={{ width: "100%", maxWidth: 380, display: "block" }} dir="ltr">
                {/* ── خلفية ورق رسم ── */}
                <rect x="0" y="0" width="380" height="260" fill="#F5F0E8"/>
                {/* إطار أحمر منقط مثل لوحات الأمانة */}
                <rect x="6" y="6" width="368" height="248" fill="none" stroke="#C0392B" strokeWidth="1" strokeDasharray="4 3"/>
                {/* عنوان أعلى اليمين */}
                <text x="370" y="20" textAnchor="end" fill="#C0392B" fontSize="9" fontFamily="Cairo,sans-serif" fontWeight="bold">١:٣:٤  اللوحة الموازية لسطح الواجهة</text>
                {/* ── سماء فوق المبنى ── */}
                <rect x="18" y="26" width="344" height="22" fill="#D6E8F0"/>
                {/* ── سقف المبنى ── */}
                <rect x="18" y="48" width="344" height="10" fill="#B0A090" stroke="#555" strokeWidth="0.6"/>
                {/* ── الدور العلوي — جدار ── */}
                <rect x="18" y="58" width="344" height="80" fill="#E2D6C0" stroke="#555" strokeWidth="0.7"/>
                {/* نوافذ الدور العلوي — 6 نوافذ */}
                {[0,1,2,3,4,5].map(i => (
                  <g key={i}>
                    <rect x={26+i*56} y="68" width="44" height="58" fill="#B8D4E8" stroke="#555" strokeWidth="0.6"/>
                    {/* تقسيم النافذة */}
                    <line x1={26+i*56+22} y1="68" x2={26+i*56+22} y2="126" stroke="#555" strokeWidth="0.4"/>
                    <line x1={26+i*56} y1="97" x2={26+i*56+44} y2="97" stroke="#555" strokeWidth="0.4"/>
                  </g>
                ))}
                {/* ── شريط فاصل ── */}
                <rect x="18" y="138" width="344" height="6" fill="#9A8A78" stroke="#555" strokeWidth="0.5"/>
                {/* ── الدور الأرضي — جدار ── */}
                <rect x="18" y="144" width="344" height="82" fill="#D8CCBA" stroke="#555" strokeWidth="0.7"/>
                {/* فواصل عمودية — 3 محلات */}
                <line x1="133" y1="144" x2="133" y2="226" stroke="#555" strokeWidth="0.8"/>
                <line x1="248" y1="144" x2="248" y2="226" stroke="#555" strokeWidth="0.8"/>
                {/* ── لوحات موازية (شريط اللافتة) — المحل 1 ── */}
                <rect x="19" y="144" width="113" height="24" fill="#1A1208" stroke="#C9A24B" strokeWidth="1"/>
                <text x="75" y="160" textAnchor="middle" fill="#C9A24B" fontSize="8.5" fontFamily="Cairo,sans-serif" fontWeight="bold">متجر البلدية</text>
                {/* ── لوحة المحل 2 ── */}
                <rect x="134" y="144" width="113" height="24" fill="#1A1208" stroke="#C9A24B" strokeWidth="1"/>
                <text x="190" y="156" textAnchor="middle" fill="#E8E0D0" fontSize="6" fontFamily="Arial,sans-serif">JEDDAH MUNICIPALITY STORE</text>
                <text x="190" y="165" textAnchor="middle" fill="#C9A24B" fontSize="7.5" fontFamily="Cairo,sans-serif" fontWeight="bold">متجر جدة</text>
                {/* ── لوحة المحل 3 ── */}
                <rect x="249" y="144" width="112" height="24" fill="#1A1208" stroke="#C9A24B" strokeWidth="1"/>
                <text x="305" y="160" textAnchor="middle" fill="#C9A24B" fontSize="8.5" fontFamily="Cairo,sans-serif" fontWeight="bold">أسماك بريم</text>
                {/* أبواب وواجهات زجاجية المحل 1 */}
                <rect x="25" y="170" width="38" height="55" fill="#B8D4E8" stroke="#555" strokeWidth="0.5"/>
                <rect x="69" y="170" width="55" height="55" fill="#C8DDE8" stroke="#555" strokeWidth="0.5"/>
                {/* أبواب المحل 2 */}
                <rect x="140" y="170" width="50" height="55" fill="#B8D4E8" stroke="#555" strokeWidth="0.5"/>
                <rect x="196" y="170" width="42" height="55" fill="#C8DDE8" stroke="#555" strokeWidth="0.5"/>
                {/* أبواب المحل 3 */}
                <rect x="255" y="170" width="45" height="55" fill="#B8D4E8" stroke="#555" strokeWidth="0.5"/>
                <rect x="306" y="170" width="48" height="55" fill="#C8DDE8" stroke="#555" strokeWidth="0.5"/>
                {/* ── رصيف ── */}
                <rect x="0" y="226" width="380" height="12" fill="#A09080" stroke="#666" strokeWidth="0.5"/>
                {/* ── خط أرضي ── */}
                <rect x="0" y="238" width="380" height="6" fill="#7A6A5A"/>
                {/* ── خط إرشادي أحمر يُشير للشريط ── */}
                <line x1="8" y1="144" x2="8" y2="168" stroke="#C0392B" strokeWidth="1" strokeDasharray="2 2"/>
                <line x1="8" y1="144" x2="18" y2="144" stroke="#C0392B" strokeWidth="1"/>
                <line x1="8" y1="168" x2="18" y2="168" stroke="#C0392B" strokeWidth="1"/>
                <text x="7" y="159" textAnchor="middle" fill="#C0392B" fontSize="7" fontFamily="Cairo,sans-serif" transform="rotate(-90,7,159)">اللافتة</text>
                {/* ── تسمية سفلية ── */}
                <text x="190" y="252" textAnchor="middle" fill="#555" fontSize="8.5" fontFamily="Cairo,sans-serif" fontWeight="bold">اللوحات الموازية لسطح الواجهة</text>
              </svg>
            ),
          },
          acrylic: {
            title: "لوحة أكريليك",
            desc: "لوحة شفافة أو ملونة مطبوعة أو مضاءة من الخلف، تُستخدم داخل المكاتب والمباني الإدارية.",
            svg: (
              <svg viewBox="0 0 320 200" style={{ width: "100%", maxWidth: 320 }}>
                <rect x="40" y="50" width="240" height="100" fill="rgba(180,220,255,0.25)" stroke="#88BBDD" strokeWidth="2" rx="8"/>
                <rect x="44" y="54" width="232" height="92" fill="rgba(200,230,255,0.15)" rx="6"/>
                <text x="160" y="95" textAnchor="middle" fill="#2C1E15" fontSize="15" fontFamily="Cairo,sans-serif" fontWeight="bold">اسم الشركة</text>
                <text x="160" y="115" textAnchor="middle" fill="#5A6A7A" fontSize="10" fontFamily="Cairo,sans-serif">COMPANY NAME</text>
                <line x1="110" y1="150" x2="110" y2="165" stroke="#88BBDD" strokeWidth="2"/>
                <line x1="210" y1="150" x2="210" y2="165" stroke="#88BBDD" strokeWidth="2"/>
                <rect x="100" y="163" width="20" height="6" fill="#AAA" rx="2"/>
                <rect x="200" y="163" width="20" height="6" fill="#AAA" rx="2"/>
                <text x="160" y="185" textAnchor="middle" fill="#8A7A66" fontSize="10" fontFamily="Cairo,sans-serif">مثبَّتة بأقواس معدنية</text>
              </svg>
            ),
          },
          "acrylic-indoor": {
            title: "لوحة أكريليك داخلية",
            desc: "لوحة أكريليك شفافة أو ملونة تُثبَّت داخل المكتب أو الممر الداخلي — مضاءة من الخلف أو أمامياً، لا تظهر على الواجهة الخارجية.",
            svg: (
              <svg viewBox="0 0 320 200" style={{ width: "100%", maxWidth: 320 }}>
                {/* غرفة داخلية */}
                <rect x="20" y="20" width="280" height="165" fill="#F0EAE0" rx="6" stroke="#C8A87A" strokeWidth="1"/>
                {/* جدار خلفي */}
                <rect x="30" y="30" width="260" height="130" fill="#E8E0D4" rx="4"/>
                {/* لوحة أكريليك */}
                <rect x="70" y="55" width="180" height="75" fill="rgba(200,235,255,0.45)" stroke="#6AAAD0" strokeWidth="2" rx="6"/>
                {/* خلفية مضيئة (backlit glow) */}
                <rect x="74" y="59" width="172" height="67" fill="rgba(180,220,255,0.2)" rx="4"/>
                {/* توهج خلفي */}
                <rect x="68" y="53" width="184" height="79" fill="none" stroke="rgba(100,180,255,0.25)" strokeWidth="6" rx="8"/>
                {/* نص اللوحة */}
                <text x="160" y="91" textAnchor="middle" fill="#1A1208" fontSize="14" fontFamily="Cairo,sans-serif" fontWeight="bold">اسم المكتب</text>
                <text x="160" y="110" textAnchor="middle" fill="#5A7A9A" fontSize="9" fontFamily="Cairo,sans-serif">OFFICE NAME</text>
                {/* مسامير التثبيت */}
                <circle cx="80" cy="65" r="3" fill="#C0C0C0" stroke="#999" strokeWidth="0.5"/>
                <circle cx="240" cy="65" r="3" fill="#C0C0C0" stroke="#999" strokeWidth="0.5"/>
                <circle cx="80" cy="123" r="3" fill="#C0C0C0" stroke="#999" strokeWidth="0.5"/>
                <circle cx="240" cy="123" r="3" fill="#C0C0C0" stroke="#999" strokeWidth="0.5"/>
                {/* الأرضية */}
                <rect x="20" y="155" width="280" height="10" fill="#C8A87A" rx="2"/>
                <text x="160" y="185" textAnchor="middle" fill="#8A7A66" fontSize="9" fontFamily="Cairo,sans-serif">لوحة داخلية · مثبَّتة على الجدار بمسامير معدنية</text>
              </svg>
            ),
          },
          "upper-facade": {
            title: "لوحة على واجهة المبنى بالأدوار العليا",
            desc: "لوحة خارجية تُثبَّت على واجهة المبنى في الدور الذي تشغله المنشأة — مشروطة باستئجار الدور بالكامل.",
            svg: (
              <svg viewBox="0 0 380 285" style={{ width: "100%", display: "block" }} dir="ltr">
                {/* خلفية */}
                <rect x="0" y="0" width="380" height="285" fill="#F5F0E8"/>
                <rect x="5" y="5" width="370" height="275" fill="none" stroke="#C0392B" strokeWidth="1" strokeDasharray="4 3"/>
                <text x="373" y="18" textAnchor="end" fill="#C0392B" fontSize="8.5" fontFamily="Cairo,sans-serif" fontWeight="bold">لوحة واجهة الأدوار العليا</text>

                {/* ── تحذير الشرط أعلى الصورة ── */}
                <rect x="82" y="22" width="216" height="16" fill="rgba(192,57,43,0.10)" stroke="#C0392B" strokeWidth="0.8" rx="3"/>
                <text x="190" y="33" textAnchor="middle" fill="#C0392B" fontSize="8" fontFamily="Cairo,sans-serif" fontWeight="bold">⚠ يُشترط استئجار الدور بالكامل</text>

                <defs>
                  <marker id="ufar" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><polygon points="0,0 5,2.5 0,5" fill="#C0392B"/></marker>
                  <marker id="ufal" markerWidth="5" markerHeight="5" refX="1" refY="2.5" orient="auto"><polygon points="5,0 0,2.5 5,5" fill="#C0392B"/></marker>
                </defs>

                {/* ── المبنى — 5 طوابق (كل طابق 36px) تبدأ من y=48 ── */}
                {Array.from({length: 5}, (_, i) => {
                  const isSign = i === 2;
                  const by = 48 + i * 36;
                  return (
                    <g key={`uf${i}`}>
                      {isSign ? (
                        /* لوحة الدور المستأجر */
                        <rect x="80" y={by} width="220" height="9" fill="#1A1208" stroke="#C9A24B" strokeWidth="1.2"/>
                      ) : (
                        <rect x="80" y={by} width="220" height="5" fill="#C8A87A" stroke="#A08060" strokeWidth="0.3"/>
                      )}
                      {[0,1,2,3].map(w => (
                        <rect key={w} x={85 + w * 54} y={isSign ? by + 10 : by + 6} width="46" height={isSign ? 21 : 25}
                              fill={isSign ? "#D0E8F8" : "#9DC4D8"} stroke="#5A9AB8" strokeWidth="0.5"/>
                      ))}
                    </g>
                  );
                })}

                {/* نص اللوحة (صغير) */}
                <text x="190" y={48 + 2*36 + 6} textAnchor="middle" fill="#C9A24B" fontSize="6" fontFamily="Cairo,sans-serif" fontWeight="bold">اسم المكتب</text>

                {/* قاعدة المبنى */}
                <rect x="80" y="228" width="220" height="7" fill="#A09080" stroke="#777" strokeWidth="0.5"/>

                {/* إطار الدور المستأجر */}
                <rect x="80" y="120" width="220" height="36" fill="none" stroke="rgba(201,162,75,0.5)" strokeWidth="1" strokeDasharray="3 2"/>
                <text x="190" y="143" textAnchor="middle" fill="#8A6A30" fontSize="7.5" fontFamily="Cairo,sans-serif">الدور المستأجر بالكامل</text>

                {/* ── سهم عرض الواجهة ── */}
                <line x1="80" y1="248" x2="300" y2="248" stroke="#C0392B" strokeWidth="0.9" markerEnd="url(#ufar)" markerStart="url(#ufal)"/>
                <line x1="80" y1="243" x2="80" y2="253" stroke="#C0392B" strokeWidth="0.7"/>
                <line x1="300" y1="243" x2="300" y2="253" stroke="#C0392B" strokeWidth="0.7"/>
                <text x="190" y="262" textAnchor="middle" fill="#C0392B" fontSize="7.5" fontFamily="Cairo,sans-serif">عرض واجهة الدور المستأجر</text>

                {/* ── سهم ارتفاع اللوحة ── */}
                <line x1="65" y1="120" x2="65" y2="129" stroke="#C0392B" strokeWidth="0.9" markerEnd="url(#ufar)" markerStart="url(#ufal)"/>
                <line x1="61" y1="120" x2="69" y2="120" stroke="#C0392B" strokeWidth="0.7"/>
                <line x1="61" y1="129" x2="69" y2="129" stroke="#C0392B" strokeWidth="0.7"/>
                <text x="57" y="127" textAnchor="middle" fill="#C0392B" fontSize="6.5" fontFamily="Cairo,sans-serif" transform="rotate(-90,57,127)">ارتفاع اللوحة</text>

                {/* تسمية سفلية */}
                <text x="190" y="278" textAnchor="middle" fill="#5A4A3A" fontSize="8.5" fontFamily="Cairo,sans-serif" fontWeight="bold">لوحة واجهة المبنى بالأدوار العليا</text>
              </svg>
            ),
          },
          tenant: {
            title: "لوحة قائمة بذاتها",
            desc: "لوحة قائمة بذاتها تُثبَّت بجانب مدخل المبنى وتعرض أسماء المنشآت المستأجرة في الأدوار العلوية التي ليس لها واجهة أو نافذة عرض مباشرة على الشارع.",
            svg: (
              <svg viewBox="0 0 420 270" style={{ width: "100%", display: "block" }} dir="ltr">
                {/* خلفية */}
                <rect x="0" y="0" width="420" height="270" fill="#F5F0E8"/>
                <rect x="5" y="5" width="410" height="260" fill="none" stroke="#C0392B" strokeWidth="1" strokeDasharray="4 3"/>
                <text x="413" y="19" textAnchor="end" fill="#C0392B" fontSize="8.5" fontFamily="Cairo,sans-serif" fontWeight="bold">اللوحة القائمة بذاتها</text>

                {/* ── أرضية الرصيف ── */}
                <rect x="10" y="228" width="400" height="10" fill="#C8B89A"/>
                <rect x="10" y="238" width="400" height="8" fill="#A89878"/>
                {/* خطوط الرصيف */}
                {[0,1,2,3,4,5,6,7,8,9].map(i => (
                  <line key={i} x1={10+i*40} y1="228" x2={10+i*40} y2="246" stroke="#B8A888" strokeWidth="0.5"/>
                ))}

                {/* ── واجهة المبنى (زجاج) ── */}
                <rect x="10" y="30" width="300" height="198" fill="#D8EAF0" stroke="#A0C0D0" strokeWidth="1"/>
                {/* أعمدة الواجهة */}
                <rect x="10" y="30" width="8" fill="#C0B090" height="198"/>
                <rect x="302" y="30" width="8" fill="#C0B090" height="198"/>
                {/* خطوط زجاج أفقية */}
                {[0,1,2,3,4].map(i => (
                  <line key={i} x1="18" y1={70+i*32} x2="302" y2={70+i*32} stroke="#B0CDD8" strokeWidth="0.5"/>
                ))}
                {/* خطوط زجاج رأسية */}
                {[0,1,2,3,4,5].map(i => (
                  <line key={i} x1={18+i*48} y1="30" x2={18+i*48} y2="228" stroke="#B0CDD8" strokeWidth="0.5"/>
                ))}

                {/* باب المدخل */}
                <rect x="110" y="128" width="90" height="100" fill="#C8E0EC" stroke="#7AAABB" strokeWidth="1.2"/>
                <line x1="155" y1="128" x2="155" y2="228" stroke="#7AAABB" strokeWidth="1"/>
                <circle cx="148" cy="183" r="3" fill="#9A8A7A"/>
                <circle cx="162" cy="183" r="3" fill="#9A8A7A"/>
                <text x="155" y="118" textAnchor="middle" fill="#4A7A8A" fontSize="11" fontFamily="Cairo,sans-serif" fontWeight="bold">المـدخل</text>

                {/* رقم دائرة ② */}
                <circle cx="28" cy="42" r="9" fill="#7A5A3A"/>
                <text x="28" y="46" textAnchor="middle" fill="#FFF" fontSize="9" fontFamily="sans-serif" fontWeight="bold">②</text>

                {/* ── اللوحة القائمة بذاتها (④) ── */}
                {/* قاعدة */}
                <rect x="334" y="220" width="40" height="8" fill="#5A3A1A" rx="2"/>
                <rect x="348" y="210" width="12" height="14" fill="#6A4A2A"/>
                {/* عمود اللوحة */}
                <rect x="340" y="50" width="28" height="165" fill="#7A4E28" rx="3"/>
                <rect x="343" y="53" width="22" height="159" fill="#8A5E38" rx="2"/>
                {/* خطوط عمودية للعمق */}
                <line x1="347" y1="55" x2="347" y2="210" stroke="#6A4020" strokeWidth="0.5"/>
                <line x1="362" y1="55" x2="362" y2="210" stroke="#9A6848" strokeWidth="0.5"/>
                {/* لوحة المنشأة على العمود */}
                <rect x="336" y="70" width="36" height="80" fill="#2C1E15" rx="3" stroke="#C9A24B" strokeWidth="1"/>
                <rect x="339" y="73" width="30" height="12" fill="#C9A24B" rx="1"/>
                <text x="354" y="82" textAnchor="middle" fill="#2C1E15" fontSize="5.5" fontFamily="Cairo,sans-serif" fontWeight="bold">الشعار</text>
                {[0,1,2,3].map(i => (
                  <g key={i}>
                    <rect x="339" y={88+i*13} width="30" height="10" fill={i%2===0?"rgba(201,162,75,0.1)":"transparent"} rx="1"/>
                    <rect x="341" y={90+i*13} width="7" height="6" fill="rgba(201,162,75,0.4)" rx="1"/>
                    <line x1="351" y1={93+i*13} x2="367" y2={93+i*13} stroke="#C9A24B" strokeWidth="0.8"/>
                    <line x1="351" y1={96+i*13} x2="363" y2={96+i*13} stroke="rgba(244,236,221,0.4)" strokeWidth="0.6"/>
                  </g>
                ))}

                {/* رقم دائرة ④ */}
                <circle cx="390" cy="42" r="9" fill="#7A5A3A"/>
                <text x="390" y="46" textAnchor="middle" fill="#FFF" fontSize="9" fontFamily="sans-serif" fontWeight="bold">④</text>

                {/* سهم يشير للعمود */}
                <line x1="383" y1="50" x2="372" y2="62" stroke="#C0392B" strokeWidth="0.8"/>
                <polygon points="372,62 376,55 379,63" fill="#C0392B"/>

                {/* التسمية السفلية */}
                <text x="210" y="260" textAnchor="middle" fill="#5A4A3A" fontSize="8.5" fontFamily="Cairo,sans-serif" fontWeight="bold">لوحة قائمة بذاتها بجانب المدخل</text>
              </svg>
            ),
          },
          projecting: {
            title: "متعامدة على الواجهة",
            desc: "لوحة تبرز عمودياً من جدار الواجهة بزاوية 90°، تُقرأ من اتجاهين على طول الشارع — مثالية للمحلات في الأزقة الضيقة.",
            svg: (
              <svg viewBox="0 0 480 300" style={{ width: "100%", display: "block" }} dir="ltr">
                {/* ── خلفية ورق رسم ── */}
                <rect x="0" y="0" width="480" height="300" fill="#F5F0E8"/>
                <rect x="6" y="6" width="468" height="288" fill="none" stroke="#C0392B" strokeWidth="1" strokeDasharray="4 3"/>
                <text x="472" y="20" textAnchor="end" fill="#C0392B" fontSize="9" fontFamily="Cairo,sans-serif" fontWeight="bold">١:٣:٢  اللوحة المتعامدة على الواجهة</text>

                {/* ── جدار الطوب ── */}
                <rect x="15" y="28" width="160" height="230" fill="#B5856A"/>
                {Array.from({length: 16}, (_, row) => Array.from({length: 6}, (_, col) => {
                  const y = 30 + row * 14;
                  const x = 16 + col * 38 - (row % 2 === 0 ? 0 : 19);
                  if (x < 14 || x + 34 > 176) return null;
                  return <rect key={`br${row}c${col}`} x={x} y={y} width="34" height="11" fill="#C4906A" stroke="#9A6040" strokeWidth="0.5" rx="0.3"/>;
                }))}

                {/* نوافذ علوية */}
                <rect x="22" y="48" width="52" height="60" fill="#BDD4E8" stroke="#444" strokeWidth="0.7"/>
                <line x1="48" y1="48" x2="48" y2="108" stroke="#444" strokeWidth="0.4"/>
                <line x1="22" y1="78" x2="74" y2="78" stroke="#444" strokeWidth="0.4"/>
                <rect x="88" y="48" width="52" height="60" fill="#BDD4E8" stroke="#444" strokeWidth="0.7"/>
                <line x1="114" y1="48" x2="114" y2="108" stroke="#444" strokeWidth="0.4"/>
                <line x1="88" y1="78" x2="140" y2="78" stroke="#444" strokeWidth="0.4"/>

                {/* باب الدور الأرضي */}
                <rect x="52" y="175" width="58" height="83" fill="#7A5A40" stroke="#444" strokeWidth="0.5"/>
                <rect x="57" y="180" width="22" height="42" fill="#BDD4E8" stroke="#444" strokeWidth="0.4"/>
                <rect x="85" y="180" width="22" height="42" fill="#BDD4E8" stroke="#444" strokeWidth="0.4"/>
                <circle cx="82" cy="204" r="2.5" fill="#C9A24B"/>
                <circle cx="89" cy="204" r="2.5" fill="#C9A24B"/>

                {/* رصيف وأرضية */}
                <rect x="0" y="258" width="480" height="12" fill="#A09080"/>
                <rect x="0" y="270" width="480" height="8" fill="#7A6A5A"/>

                {/* ══════ BRACKET & BLADE SIGN ══════ */}

                {/* ══ ذراع واحدة مركزية تحمل اللوحة ══ */}

                {/* الجزء الجداري (عمودي) — مثبت بالجدار */}
                <rect x="173" y="167" width="7" height="17" fill="#686868" rx="1.5" stroke="#3A3A3A" strokeWidth="0.6"/>
                <circle cx="176.5" cy="171" r="1.7" fill="#2A2A2A"/>
                <circle cx="176.5" cy="180" r="1.7" fill="#2A2A2A"/>

                {/* الجزء الأفقي — يمتد للخارج */}
                <rect x="179" y="172" width="24" height="5.5" fill="#686868" rx="1.5" stroke="#3A3A3A" strokeWidth="0.6"/>

                {/* رأس الذراع — نقطة ربط اللوحة */}
                <circle cx="203" cy="174.5" r="3.5" fill="#505050" stroke="#333" strokeWidth="0.6"/>
                <circle cx="203" cy="174.5" r="1.5" fill="#999"/>

                {/* لوحة اللافتة — متناسبة مع حجم المبنى */}
                <rect x="203" y="152" width="88" height="46" fill="#1A1208" rx="4" stroke="#3A3030" strokeWidth="1"/>
                <rect x="207" y="156" width="80" height="38" fill="#1E1510" rx="3"/>
                <rect x="210" y="159" width="74" height="1.8" fill="#C9A24B" opacity="0.55"/>
                <rect x="210" y="191" width="74" height="1.8" fill="#C9A24B" opacity="0.55"/>
                <text x="247" y="177" textAnchor="middle" fill="#C9A24B" fontSize="11" fontFamily="Cairo,sans-serif" fontWeight="bold">اسم المنشأة</text>
                <text x="247" y="189" textAnchor="middle" fill="#C8C0B0" fontSize="7" fontFamily="Arial,sans-serif">ESTABLISHMENT NAME</text>

                {/* ══════ INSET — مسقط أفقي ══════ */}
                <rect x="320" y="26" width="148" height="95" fill="rgba(255,255,255,0.75)" stroke="#AAA" strokeWidth="0.6" rx="5"/>
                <text x="394" y="40" textAnchor="middle" fill="#555" fontSize="8" fontFamily="Cairo,sans-serif" fontWeight="bold">مسقط أفقي (من الأعلى)</text>
                {/* خط الجدار */}
                <line x1="328" y1="75" x2="464" y2="75" stroke="#5A4A3A" strokeWidth="3"/>
                <text x="450" y="70" textAnchor="end" fill="#5A4A3A" fontSize="7" fontFamily="Cairo,sans-serif">الجدار</text>
                {/* ذراع الحامل */}
                <line x1="390" y1="75" x2="390" y2="60" stroke="#686868" strokeWidth="2"/>
                {/* اللافتة — شريط رفيع عمودي على الجدار */}
                <rect x="387" y="54" width="5" height="21" fill="#1A1208" stroke="#C9A24B" strokeWidth="0.7"/>
                {/* سهم البروز — يسار اللافتة */}
                <line x1="382" y1="75" x2="382" y2="54" stroke="#C0392B" strokeWidth="0.7" markerEnd="url(#ar5b)" markerStart="url(#ar5)"/>
                {/* ⊥ 90° — يسار اللافتة */}
                <text x="378" y="66" textAnchor="end" fill="#C0392B" fontSize="7" fontFamily="sans-serif">⊥ 90°</text>
                {/* سهما الاتجاهين — أسفل الجدار */}
                <line x1="389" y1="91" x2="420" y2="91" stroke="#C0392B" strokeWidth="1" markerEnd="url(#ar6)"/>
                <line x1="389" y1="91" x2="358" y2="91" stroke="#C0392B" strokeWidth="1" markerEnd="url(#ar6)"/>
                <text x="389" y="110" textAnchor="middle" fill="#C0392B" fontSize="6.5" fontFamily="Cairo,sans-serif">تُقرأ من الاتجاهين</text>

                {/* تعريف الأسهم */}
                <defs>
                  <marker id="ar3" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><polygon points="0,0 5,2.5 0,5" fill="#C0392B"/></marker>
                  <marker id="ar4" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><polygon points="0,0 5,2.5 0,5" fill="#C0392B"/></marker>
                  <marker id="ar5" markerWidth="5" markerHeight="5" refX="1" refY="2.5" orient="auto"><polygon points="5,0 0,2.5 5,5" fill="#C0392B"/></marker>
                  <marker id="ar5b" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><polygon points="0,0 5,2.5 0,5" fill="#C0392B"/></marker>
                  <marker id="ar6" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><polygon points="0,0 5,2.5 0,5" fill="#C0392B"/></marker>
                </defs>

                {/* سهم البروز الرئيسي — من وجه الجدار لحافة اللوحة */}
                <line x1="176" y1="242" x2="291" y2="242" stroke="#C0392B" strokeWidth="0.9" markerEnd="url(#ar6)" markerStart="url(#ar5)"/>
                <text x="233" y="253" textAnchor="middle" fill="#C0392B" fontSize="7.5" fontFamily="Cairo,sans-serif">بروز اللافتة عن سطح الواجهة</text>

                {/* التسمية السفلية */}
                <text x="240" y="283" textAnchor="middle" fill="#333" fontSize="9" fontFamily="Cairo,sans-serif" fontWeight="bold">اللوحات المتعامدة على الواجهة</text>
              </svg>
            ),
          },
          brand: {
            title: "علامة تجارية (أعلى المبنى)",
            desc: "عنصر بصري يُوضع أعلى الواجهات الرئيسية للمباني متعددة الاستخدامات كالفنادق والأبراج التجارية، يعرض اسم وشعار الجهة المالكة أو المشغّلة. تُعدّ جزءًا من الهوية البصرية للمبنى وتُستخدم لتعزيز الحضور المؤسسي وتسهيل التعرف على المبنى من مسافات بعيدة.",
            svg: (
              <svg viewBox="0 0 480 300" style={{ width: "100%", display: "block" }} dir="ltr">
                {/* ── خلفية ── */}
                <rect x="0" y="0" width="480" height="300" fill="#F5F0E8"/>
                <rect x="6" y="6" width="468" height="288" fill="none" stroke="#C0392B" strokeWidth="1" strokeDasharray="4 3"/>
                <text x="472" y="20" textAnchor="end" fill="#C0392B" fontSize="9" fontFamily="Cairo,sans-serif" fontWeight="bold">١:٣:٥  العلامة التجارية أعلى المبنى</text>

                {/* ── تعريف الأسهم ── */}
                <defs>
                  <marker id="brar" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><polygon points="0,0 5,2.5 0,5" fill="#C0392B"/></marker>
                  <marker id="bral" markerWidth="5" markerHeight="5" refX="1" refY="2.5" orient="auto"><polygon points="5,0 0,2.5 5,5" fill="#C0392B"/></marker>
                </defs>

                {/* ══ المبنى الرئيسي ══ */}
                {/* قاعدة المبنى */}
                <rect x="140" y="248" width="200" height="8" fill="#A09080" stroke="#777" strokeWidth="0.5"/>
                {/* جسم المبنى — طوابق */}
                {Array.from({length: 11}, (_, i) => (
                  <g key={`fl${i}`}>
                    {/* شريط هيكلي (concrete band) */}
                    <rect x="140" y={58 + i * 17} width="200" height="4" fill="#C8A87A" stroke="#A08060" strokeWidth="0.3"/>
                    {/* نوافذ الطابق */}
                    {[0,1,2,3].map(w => (
                      <rect key={w} x={145 + w * 48} y={62 + i * 17} width="42" height="13" fill="#7BBCD4" stroke="#5A9AB8" strokeWidth="0.4"/>
                    ))}
                  </g>
                ))}
                {/* الحائط الجانبي للمبنى (اللون الأساسي) */}
                <rect x="140" y="58" width="200" height="190" fill="none" stroke="#8A7A6A" strokeWidth="1"/>

                {/* ══ لوحة العلامة التجارية أعلى المبنى ══ */}
                <rect x="140" y="40" width="200" height="20" fill="#1A1208"/>
                <rect x="143" y="43" width="194" height="14" fill="#1E1510"/>
                {/* ── مجموعة الشعار + اسم المنشأة (متجاورة في المنتصف) ── */}
                {/* مربع LOGO ذهبي */}
                <rect x="192" y="44" width="13" height="12" fill="#C9A24B" rx="1.5"/>
                <text x="198.5" y="52.5" textAnchor="middle" fill="#1A1208" fontSize="4" fontFamily="sans-serif" fontWeight="bold">LOGO</text>
                {/* اسم المنشأة */}
                <text x="208" y="53" textAnchor="start" fill="#F4ECDD" fontSize="8.5" fontFamily="Cairo,sans-serif" fontWeight="bold">برج الأعمال — جدة</text>

                {/* ── الأشجار ── */}
                {/* شجرة يسار */}
                <ellipse cx="108" cy="244" rx="20" ry="16" fill="#5A8A50"/>
                <ellipse cx="108" cy="238" rx="15" ry="12" fill="#6AAA60"/>
                <rect x="105" y="254" width="5" height="12" fill="#7A5A3A"/>
                {/* شجرة يمين */}
                <ellipse cx="372" cy="244" rx="20" ry="16" fill="#5A8A50"/>
                <ellipse cx="372" cy="238" rx="15" ry="12" fill="#6AAA60"/>
                <rect x="369" y="254" width="5" height="12" fill="#7A5A3A"/>

                {/* ── الأرض ── */}
                <rect x="60" y="262" width="360" height="6" fill="#A09080"/>
                <rect x="60" y="268" width="360" height="4" fill="#8A7A6A"/>

                {/* ══ خطوط قياس وتعليقات ══ */}

                {/* عرض المبنى — سهم أفقي أعلى */}
                <line x1="140" y1="28" x2="340" y2="28" stroke="#C0392B" strokeWidth="0.9" markerEnd="url(#brar)" markerStart="url(#bral)"/>
                <line x1="140" y1="24" x2="140" y2="32" stroke="#C0392B" strokeWidth="0.7"/>
                <line x1="340" y1="24" x2="340" y2="32" stroke="#C0392B" strokeWidth="0.7"/>
                <text x="240" y="23" textAnchor="middle" fill="#C0392B" fontSize="7.5" fontFamily="Cairo,sans-serif">عرض المبنى</text>

                {/* ارتفاع اللوحة — سهم رأسي يسار */}
                <line x1="128" y1="40" x2="128" y2="60" stroke="#C0392B" strokeWidth="0.9" markerEnd="url(#brar)" markerStart="url(#bral)"/>
                <line x1="124" y1="40" x2="132" y2="40" stroke="#C0392B" strokeWidth="0.7"/>
                <line x1="124" y1="60" x2="132" y2="60" stroke="#C0392B" strokeWidth="0.7"/>
                <text x="90" y="52" textAnchor="middle" fill="#C0392B" fontSize="7" fontFamily="Cairo,sans-serif" transform="rotate(-90,90,52)">ارتفاع اللوحة</text>

                {/* ارتفاع المبنى — سهم رأسي يمين */}
                <line x1="352" y1="60" x2="352" y2="248" stroke="#C0392B" strokeWidth="0.9" markerEnd="url(#brar)" markerStart="url(#bral)"/>
                <line x1="348" y1="60" x2="356" y2="60" stroke="#C0392B" strokeWidth="0.7"/>
                <line x1="348" y1="248" x2="356" y2="248" stroke="#C0392B" strokeWidth="0.7"/>
                <text x="365" y="160" fill="#C0392B" fontSize="7" fontFamily="Cairo,sans-serif" transform="rotate(90,365,160)">ارتفاع المبنى</text>

                {/* خط منقط من اللوحة لليمين */}
                <line x1="340" y1="40" x2="346" y2="40" stroke="#C0392B" strokeWidth="0.6" strokeDasharray="2 1.5"/>
                <line x1="340" y1="60" x2="346" y2="60" stroke="#C0392B" strokeWidth="0.6" strokeDasharray="2 1.5"/>

                {/* التسمية السفلية */}
                <text x="240" y="285" textAnchor="middle" fill="#333" fontSize="9" fontFamily="Cairo,sans-serif" fontWeight="bold">العلامة التجارية أعلى الواجهة</text>
              </svg>
            ),
          },
          entrance: {
            title: "لوحة مدخل",
            desc: "لوحة تُثبَّت عند مدخل المبنى أو المحل، تحدد الهوية عند نقطة الدخول.",
            svg: (
              <svg viewBox="0 0 320 200" style={{ width: "100%", maxWidth: 320 }}>
                <rect x="80" y="50" width="160" height="150" fill="#BCA68A" rx="4"/>
                <rect x="120" y="90" width="80" height="110" fill="#8B6A50" rx="4"/>
                <circle cx="160" cy="148" r="5" fill="#C9A24B"/>
                <rect x="70" y="45" width="180" height="40" fill="#2C1E15" rx="6" stroke={GOLD} strokeWidth="1.5"/>
                <text x="160" y="70" textAnchor="middle" fill={GOLD} fontSize="13" fontFamily="Cairo,sans-serif" fontWeight="bold">اسم المنشأة</text>
                <text x="160" y="30" textAnchor="middle" fill="#8A7A66" fontSize="10" fontFamily="Cairo,sans-serif">← عند مدخل المبنى →</text>
              </svg>
            ),
          },
          directory: {
            title: "تعريفية جامعة",
            desc: "لوحة قائمة بذاتها تُثبَّت بجانب مدخل المبنى وتعرض أسماء ومعلومات المنشآت المستأجرة في الأدوار العلوية التي ليس لها واجهة مباشرة على الشارع — تجمع الشعار والاسم وطريقة التواصل لكل مستأجر.",
            svg: (
              <svg viewBox="0 0 420 270" style={{ width: "100%", display: "block" }} dir="ltr">
                {/* خلفية */}
                <rect x="0" y="0" width="420" height="270" fill="#F5F0E8"/>
                <rect x="5" y="5" width="410" height="260" fill="none" stroke="#C0392B" strokeWidth="1" strokeDasharray="4 3"/>
                <text x="413" y="19" textAnchor="end" fill="#C0392B" fontSize="8.5" fontFamily="Cairo,sans-serif" fontWeight="bold">اللوحة التعريفية الجامعة</text>

                {/* ── أرضية الرصيف ── */}
                <rect x="10" y="228" width="400" height="10" fill="#C8B89A"/>
                <rect x="10" y="238" width="400" height="8" fill="#A89878"/>
                {[0,1,2,3,4,5,6,7,8,9].map(i => (
                  <line key={i} x1={10+i*40} y1="228" x2={10+i*40} y2="246" stroke="#B8A888" strokeWidth="0.5"/>
                ))}

                {/* ── واجهة المبنى (زجاج) ── */}
                <rect x="10" y="30" width="300" height="198" fill="#D8EAF0" stroke="#A0C0D0" strokeWidth="1"/>
                <rect x="10" y="30" width="8" fill="#C0B090" height="198"/>
                <rect x="302" y="30" width="8" fill="#C0B090" height="198"/>
                {[0,1,2,3,4].map(i => (
                  <line key={i} x1="18" y1={70+i*32} x2="302" y2={70+i*32} stroke="#B0CDD8" strokeWidth="0.5"/>
                ))}
                {[0,1,2,3,4,5].map(i => (
                  <line key={i} x1={18+i*48} y1="30" x2={18+i*48} y2="228" stroke="#B0CDD8" strokeWidth="0.5"/>
                ))}

                {/* باب المدخل */}
                <rect x="110" y="128" width="90" height="100" fill="#C8E0EC" stroke="#7AAABB" strokeWidth="1.2"/>
                <line x1="155" y1="128" x2="155" y2="228" stroke="#7AAABB" strokeWidth="1"/>
                <circle cx="148" cy="183" r="3" fill="#9A8A7A"/>
                <circle cx="162" cy="183" r="3" fill="#9A8A7A"/>
                <text x="155" y="118" textAnchor="middle" fill="#4A7A8A" fontSize="11" fontFamily="Cairo,sans-serif" fontWeight="bold">المـدخل</text>

                {/* ── اللوحة التعريفية الجامعة (عمود قائم) ── */}
                <rect x="334" y="220" width="40" height="8" fill="#5A3A1A" rx="2"/>
                <rect x="348" y="210" width="12" height="14" fill="#6A4A2A"/>
                <rect x="340" y="50" width="28" height="165" fill="#7A4E28" rx="3"/>
                <rect x="343" y="53" width="22" height="159" fill="#8A5E38" rx="2"/>
                <line x1="347" y1="55" x2="347" y2="210" stroke="#6A4020" strokeWidth="0.5"/>
                <line x1="362" y1="55" x2="362" y2="210" stroke="#9A6848" strokeWidth="0.5"/>
                {/* لوحة الاسم الرئيسية */}
                <rect x="336" y="60" width="36" height="18" fill={GOLD} rx="2"/>
                <text x="354" y="72" textAnchor="middle" fill="#2C1E15" fontSize="6" fontFamily="Cairo,sans-serif" fontWeight="bold">الشعار / الاسم</text>
                {/* صفوف المستأجرين */}
                {["المستأجر الأول","الدور الثاني","المستأجر الثالث","المستأجر الرابع"].map((txt, i) => (
                  <g key={i}>
                    <rect x="336" y={82+i*22} width="36" height="18" fill={i%2===0?"#2C1E15":"#3A2820"} rx="1" stroke="rgba(201,162,75,0.3)" strokeWidth="0.7"/>
                    <rect x="338" y={84+i*22} width="7" height="6" fill="rgba(201,162,75,0.4)" rx="1"/>
                    <line x1="348" y1={87+i*22} x2="369" y2={87+i*22} stroke="#C9A24B" strokeWidth="0.8"/>
                    <line x1="348" y1={90+i*22} x2="366" y2={90+i*22} stroke="rgba(244,236,221,0.35)" strokeWidth="0.6"/>
                  </g>
                ))}

                {/* التسمية السفلية */}
                <text x="210" y="260" textAnchor="middle" fill="#5A4A3A" fontSize="8.5" fontFamily="Cairo,sans-serif" fontWeight="bold">لوحة تعريفية جامعة بجانب المدخل</text>
              </svg>
            ),
          },
          flags: {
            title: "أعلام",
            desc: "أعمدة أعلام تحمل شعار أو ألوان المنشأة أمام المبنى أو على واجهته.",
            svg: (
              <svg viewBox="0 0 320 200" style={{ width: "100%", maxWidth: 320 }}>
                {[80,160,240].map((x,i) => (
                  <g key={i}>
                    <rect x={x-3} y="30" width="6" height="150" fill="#8A7A66" rx="3"/>
                    <polygon points={`${x+3},30 ${x+3},70 ${x+50},50`} fill={i===1?GOLD:"#C9A24B"} opacity={i===1?1:0.7}/>
                    <circle cx={x} cy="185" r="8" fill="#5A4A3A" rx="4"/>
                  </g>
                ))}
                <text x="160" y="18" textAnchor="middle" fill="#8A7A66" fontSize="10" fontFamily="Cairo,sans-serif">أعمدة أعلام تحمل هوية المنشأة</text>
              </svg>
            ),
          },
          freestanding: {
            title: "قائمة بذاتها",
            desc: "لوحة مستقلة لا تعتمد على الجدار — تُثبَّت في الأرض أو على حامل أمام المنشأة.",
            svg: (
              <svg viewBox="0 0 320 200" style={{ width: "100%", maxWidth: 320 }}>
                <rect x="90" y="40" width="140" height="100" fill="#2C1E15" rx="8" stroke={GOLD} strokeWidth="2"/>
                <text x="160" y="85" textAnchor="middle" fill={GOLD} fontSize="14" fontFamily="Cairo,sans-serif" fontWeight="bold">اسم المنشأة</text>
                <text x="160" y="108" textAnchor="middle" fill="#A39584" fontSize="9" fontFamily="Cairo,sans-serif">COMPANY NAME</text>
                <rect x="148" y="140" width="24" height="40" fill="#5A4A3A" rx="3"/>
                <rect x="100" y="178" width="120" height="10" fill="#5A4A3A" rx="3"/>
                <text x="160" y="25" textAnchor="middle" fill="#8A7A66" fontSize="10" fontFamily="Cairo,sans-serif">لوحة مستقلة على حامل أرضي</text>
              </svg>
            ),
          },
          "hotel-overview": {
            title: "أنواع اللوحات المسموحة — فندق / مستشفى",
            desc: "نظرة شاملة على جميع أنواع اللوحات المسموح بها وفق اشتراطات أمانة جدة للمنشآت الفندقية والصحية.",
            svg: (
              <svg viewBox="0 0 560 390" style={{ width: "100%", maxWidth: 560 }} fontFamily="Cairo,sans-serif">
                {/* خلفية */}
                <rect width="560" height="390" fill="#FDFBF7"/>
                <rect width="560" height="58" fill="#DDD4C4" opacity="0.6"/>

                {/* ══ جسم المبنى الرئيسي x:145-385, y:14-295 ══ */}
                {/* ظل المبنى */}
                <rect x="150" y="20" width="240" height="278" fill="#BEB0A0" rx="3" opacity="0.4" transform="translate(4,4)"/>
                {/* جسم المبنى */}
                <rect x="145" y="14" width="240" height="281" fill="#C8BAA8" stroke="#A09078" strokeWidth="1.2" rx="2"/>

                {/* ④ علامة تجارية — تاج المبنى */}
                <rect x="145" y="5" width="240" height="24" fill={GOLD} rx="2"/>
                <text x="265" y="20" textAnchor="middle" fill="#2C1E15" fontSize="9.5" fontWeight="bold">مستشفى الخليج  ·  GULF HOSPITAL</text>
                {/* خط وصل */}
                <line x1="388" y1="17" x2="412" y2="17" stroke={GOLD} strokeWidth="1.5"/>
                <circle cx="420" cy="17" r="10" fill={GOLD}/>
                <text x="420" y="21" textAnchor="middle" fill="#2C1E15" fontSize="9" fontWeight="900">④</text>

                {/* ① لوحة موازية لسطح الواجهة — شريط في الأدوار العليا */}
                <rect x="145" y="44" width="240" height="22" fill="#2C1E15" rx="1"/>
                <text x="265" y="58" textAnchor="middle" fill={GOLD} fontSize="8.5" fontWeight="bold">مستشفى الخليج  |  GULF HOSPITAL</text>
                {/* خط وصل */}
                <line x1="122" y1="55" x2="144" y2="55" stroke={GOLD} strokeWidth="1.5"/>
                <circle cx="114" cy="55" r="10" fill={GOLD}/>
                <text x="114" y="59" textAnchor="middle" fill="#2C1E15" fontSize="9" fontWeight="900">①</text>

                {/* شبكة نوافذ — 11 دور × 5 عمود */}
                {Array.from({ length: 11 }, (_, row) =>
                  Array.from({ length: 5 }, (_, col) => (
                    <rect key={`w-${row}-${col}`}
                      x={153 + col * 46} y={72 + row * 19}
                      width={32} height={13}
                      fill="#9AB8CC" opacity="0.65" rx="1"/>
                  ))
                )}
                {/* خطوط الأدوار */}
                {Array.from({ length: 12 }, (_, i) => (
                  <line key={`fl-${i}`} x1="145" y1={67 + i * 19} x2="385" y2={67 + i * 19}
                    stroke="#A09078" strokeWidth="0.5" opacity="0.45"/>
                ))}

                {/* ③ لوحة متعامدة على الواجهة (بروز من الجانب) */}
                <rect x="385" y="108" width="52" height="22" fill="#2C1E15" stroke={GOLD} strokeWidth="1.5" rx="2"/>
                <text x="411" y="121" textAnchor="middle" fill={GOLD} fontSize="7" fontWeight="bold">مدخل ب</text>
                {/* ذراع التثبيت */}
                <rect x="382" y="113" width="5" height="3" fill="#7A6A5A"/>
                <rect x="382" y="126" width="5" height="3" fill="#7A6A5A"/>
                {/* خط وصل */}
                <line x1="437" y1="119" x2="456" y2="119" stroke={GOLD} strokeWidth="1.5"/>
                <circle cx="464" cy="119" r="10" fill={GOLD}/>
                <text x="464" y="123" textAnchor="middle" fill="#2C1E15" fontSize="9" fontWeight="900">③</text>

                {/* الدور الأرضي — مدخل */}
                <rect x="145" y="258" width="240" height="37" fill="#B0A090"/>
                {/* الباب الرئيسي */}
                <rect x="228" y="262" width="74" height="33" fill="#7A8BA0" rx="3 3 0 0"/>
                <rect x="231" y="265" width="32" height="30" fill="#9ABCCC" opacity="0.75" rx="1"/>
                <rect x="267" y="265" width="32" height="30" fill="#9ABCCC" opacity="0.75" rx="1"/>

                {/* ② لوحة مدخل فوق الباب */}
                <rect x="220" y="253" width="90" height="12" fill="#2C1E15" rx="1.5"/>
                <text x="265" y="261.5" textAnchor="middle" fill={GOLD} fontSize="6.5" fontWeight="bold">المدخل الرئيسي · MAIN ENTRANCE</text>
                {/* خط وصل */}
                <line x1="310" y1="259" x2="412" y2="259" stroke={GOLD} strokeWidth="1.2" strokeDasharray="4,3"/>
                <circle cx="420" cy="259" r="10" fill={GOLD}/>
                <text x="420" y="263" textAnchor="middle" fill="#2C1E15" fontSize="9" fontWeight="900">②</text>

                {/* ══ أرضية ══ */}
                <rect x="0" y="295" width="560" height="70" fill="#D0C0A8"/>
                <rect x="0" y="295" width="560" height="3" fill="#A89878"/>

                {/* ⑤ لوحة تعريفية جامعة (عمود الإرشاد) يسار المبنى */}
                {/* عمود */}
                <rect x="90" y="205" width="36" height="90" fill="#2C1E15" rx="4"/>
                {/* رأس العمود */}
                <rect x="88" y="202" width="40" height="16" fill={GOLD} rx="3"/>
                <text x="108" y="213" textAnchor="middle" fill="#2C1E15" fontSize="6.5" fontWeight="bold">المستشفى</text>
                {/* صفوف الإرشاد */}
                {["الطوارئ  ←", "الصيدلية ←", "الاستقبال←", "المصليات ←"].map((txt, i) => (
                  <g key={`dir-${i}`}>
                    <rect x="93" y={221 + i * 15} width="30" height="12" fill={i % 2 === 0 ? "#F4ECDD" : "#E8DAC0"} rx="1.5"/>
                    <text x="108" y={230 + i * 15} textAnchor="middle" fill="#2C1E15" fontSize="5.5">{txt}</text>
                  </g>
                ))}
                {/* قاعدة */}
                <rect x="84" y="293" width="48" height="5" fill="#5A4A3A" rx="2"/>
                {/* خط وصل */}
                <line x1="74" y1="240" x2="89" y2="240" stroke={GOLD} strokeWidth="1.5"/>
                <circle cx="66" cy="240" r="10" fill={GOLD}/>
                <text x="66" y="244" textAnchor="middle" fill="#2C1E15" fontSize="9" fontWeight="900">⑤</text>

                {/* ⑥ أعلام — يمين المبنى */}
                {[{ x: 414, h: 170, c: GOLD }, { x: 436, h: 180, c: "#33261A" }, { x: 458, h: 190, c: GOLD }].map(({ x, h, c }, i) => (
                  <g key={`flag-${i}`}>
                    <line x1={x} y1={h} x2={x} y2="295" stroke="#8A7A66" strokeWidth="2.5"/>
                    <polygon points={`${x},${h} ${x + 28},${h + 10} ${x},${h + 20}`} fill={c} opacity="0.9"/>
                  </g>
                ))}
                {/* خط وصل ⑥ */}
                <line x1="458" y1="172" x2="490" y2="162" stroke={GOLD} strokeWidth="1.5"/>
                <circle cx="498" cy="158" r="10" fill={GOLD}/>
                <text x="498" y="162" textAnchor="middle" fill="#2C1E15" fontSize="9" fontWeight="900">⑥</text>

                {/* ══ مفتاح الأنواع في أسفل الصورة ══ */}
                <rect x="6" y="312" width="548" height="72" fill="rgba(44,30,21,0.06)" rx="8"/>
                <text x="280" y="328" textAnchor="middle" fill="#5A4A3A" fontSize="8" fontWeight="700">أنواع اللوحات المسموح بها للفندق / المستشفى</text>
                {[
                  { n: "①", t: "موازية للواجهة" },
                  { n: "②", t: "لوحة مدخل" },
                  { n: "③", t: "متعامدة (بروز)" },
                  { n: "④", t: "علامة تجارية" },
                  { n: "⑤", t: "تعريفية جامعة" },
                  { n: "⑥", t: "أعلام" },
                ].map((item, i) => (
                  <g key={`leg-${i}`}>
                    <circle cx={46 + i * 90} cy="345" r="10" fill={GOLD}/>
                    <text x={46 + i * 90} y="349" textAnchor="middle" fill="#2C1E15" fontSize="9" fontWeight="900">{item.n}</text>
                    <text x={46 + i * 90} y="364" textAnchor="middle" fill="#4A3525" fontSize="8">{item.t}</text>
                  </g>
                ))}
              </svg>
            ),
          },
        };
        const info = kindInfo[signKindPreview] || { title: signKindPreview, desc: "", svg: null };
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.72)" }} onClick={() => setSignKindPreview(null)}>
            <div style={{ background: "#F4EFE6", borderRadius: 18, overflow: "hidden", width: "min(98vw,820px)", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 40px 100px rgba(0,0,0,0.6)", border: `1.5px solid rgba(201,162,75,0.4)`, margin: "auto" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.8rem 1.2rem", background: "#2C1E15", borderBottom: `1px solid rgba(201,162,75,0.2)`, flexShrink: 0 }}>
                <span style={{ fontFamily: "Cairo,sans-serif", fontWeight: 900, fontSize: "1rem", color: "#F4ECDD" }}>{info.title}</span>
                <button onClick={() => setSignKindPreview(null)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(201,162,75,0.3)", background: "rgba(201,162,75,0.08)", color: GOLD, cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Cairo,sans-serif" }}>✕</button>
              </div>
              <div style={{ padding: "1.5rem 1.5rem 0.8rem", overflow: "auto", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {info.svg}
              </div>
              <div style={{ padding: "0 1.5rem 1.2rem", fontFamily: "Cairo,sans-serif", fontSize: "0.85rem", color: "#4A3525", lineHeight: 1.8, textAlign: "right", flexShrink: 0 }}>
                {info.desc}
              </div>
            </div>
          </div>
        );
      })()}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}} input[type=range]::-webkit-slider-thumb{cursor:grab} input[type=number]::-webkit-inner-spin-button{opacity:0.4} textarea:focus,input:focus{outline:none}` }} />

      {/* ─── نافذة اختيار خامة الحروف ─── */}
      <MaterialModal
        open={showMatModal}
        onClose={() => setShowMatModal(false)}
        letterTypes={letterTypes}
        sideStyles={sideStyles}
        fonts={matGroup === "text" ? FONTS_AR : FONTS_AR}
        group={matGroup}
        initial={{
          typeId: isText ? s.typeId : s.cTypeId,
          sideMat: isText ? s.sideMat : s.cSideMat,
          faceColorId: isText ? s.faceColorId : s.cFaceColorId,
          sideColorId: isText ? s.sideColorId : s.cSideColorId,
          faceCustomColor: isText ? s.faceCustomColor : s.cFaceCustomColor,
          sideCustomColor: isText ? s.sideCustomColor : s.cSideCustomColor,
          faceBorder: s.faceBorder,
          sideStyleId: s.sideStyleId,
          uniMat: isText ? s.uniMatText : s.uniMatContent,
          lightTypeId: s.lightTypeId,
          lightTempId: s.lightTempId,
          letterDepthCm: s.letterDepthCm,
        }}
        onApply={(sel) => {
          if (isText) {
            set({ typeId: sel.typeId, sideMat: sel.sideMat, faceColorId: sel.faceColorId, sideColorId: sel.sideColorId, faceCustomColor: sel.faceCustomColor, sideCustomColor: sel.sideCustomColor, faceBorder: sel.faceBorder, sideStyleId: sel.sideStyleId, uniMatText: sel.uniMat, lightTypeId: sel.lightTypeId, lightTempId: sel.lightTempId, letterDepthCm: sel.letterDepthCm });
          } else {
            set({ cTypeId: sel.typeId, cSideMat: sel.sideMat, cFaceColorId: sel.faceColorId, cSideColorId: sel.sideColorId, cFaceCustomColor: sel.faceCustomColor, cSideCustomColor: sel.sideCustomColor, uniMatContent: sel.uniMat });
          }
          setShowMatModal(false);
        }}
      />
    </div>
  );
}