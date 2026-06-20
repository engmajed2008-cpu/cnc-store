// كتالوج خطوط مصمّم اللوحات — تُحمَّل فعلياً عبر next/font (مستضافة ذاتياً، متوافقة مع CSP).
// نستخدم خيار variable لتحميل @font-face دون تغيير خط الموقع الأساسي،
// ونعرض اسم العائلة الحقيقي (font.style.fontFamily) ليُستخدم في DOM وفي قياس canvas معاً.
import {
  Cairo, Tajawal, Almarai, Amiri, Reem_Kufi, Changa, El_Messiri, Lalezar, Markazi_Text, Aref_Ruqaa,
  Montserrat, Oswald, Poppins, Bebas_Neue, Anton, Playfair_Display,
} from "next/font/google";
import localFont from "next/font/local";

// خط محلي مستضاف ذاتياً — سُكَّر بلاك (الخط القياسي للوحات التموينات)
const sukar = localFont({ src: "./local-fonts/Sukar-Black.ttf", display: "swap", variable: "--font-sukar", preload: false });

// لتخفيف التحميل: القاهرة (خط الموقع الأساسي) تُحمَّل preload؛ بقية خطوط المصمّم بوزن واحد وبلا preload (تُحمَّل عند الحاجة)
// — عربي —
const cairo       = Cairo({ subsets: ["arabic", "latin"], weight: ["400", "700", "900"], display: "swap", variable: "--font-cairo" });
const tajawal     = Tajawal({ subsets: ["arabic", "latin"], weight: ["700"], display: "swap", variable: "--font-tajawal", preload: false });
const almarai     = Almarai({ subsets: ["arabic"], weight: ["700"], display: "swap", variable: "--font-almarai", preload: false });
const amiri       = Amiri({ subsets: ["arabic"], weight: ["700"], display: "swap", variable: "--font-amiri", preload: false });
const reemKufi    = Reem_Kufi({ subsets: ["arabic"], weight: ["700"], display: "swap", variable: "--font-reemkufi", preload: false });
const changa      = Changa({ subsets: ["arabic"], weight: ["700"], display: "swap", variable: "--font-changa", preload: false });
const elMessiri   = El_Messiri({ subsets: ["arabic"], weight: ["700"], display: "swap", variable: "--font-elmessiri", preload: false });
const lalezar     = Lalezar({ subsets: ["arabic"], weight: ["400"], display: "swap", variable: "--font-lalezar", preload: false });
const markazi     = Markazi_Text({ subsets: ["arabic"], weight: ["700"], display: "swap", variable: "--font-markazi", preload: false });
const arefRuqaa   = Aref_Ruqaa({ subsets: ["arabic"], weight: ["700"], display: "swap", variable: "--font-arefruqaa", preload: false });

// — لاتيني —
const montserrat  = Montserrat({ subsets: ["latin"], weight: ["700"], display: "swap", variable: "--font-montserrat", preload: false });
const oswald      = Oswald({ subsets: ["latin"], weight: ["700"], display: "swap", variable: "--font-oswald", preload: false });
const poppins     = Poppins({ subsets: ["latin"], weight: ["700"], display: "swap", variable: "--font-poppins", preload: false });
const bebas       = Bebas_Neue({ subsets: ["latin"], weight: ["400"], display: "swap", variable: "--font-bebas", preload: false });
const anton       = Anton({ subsets: ["latin"], weight: ["400"], display: "swap", variable: "--font-anton", preload: false });
const playfair    = Playfair_Display({ subsets: ["latin"], weight: ["700"], display: "swap", variable: "--font-playfair", preload: false });

export type FontDef = { id: string; label: string; lang: "ar" | "en"; family: string };

// الكتالوج الكامل — يُفعَّل منه ما يختاره المسؤول من لوحة التحكم
export const FONT_CATALOG: FontDef[] = [
  // عربي
  { id: "sukar",     label: "سُكَّر بلاك", lang: "ar", family: sukar.style.fontFamily },
  { id: "cairo",     label: "القاهرة",   lang: "ar", family: cairo.style.fontFamily },
  { id: "tajawal",   label: "تجوال",     lang: "ar", family: tajawal.style.fontFamily },
  { id: "almarai",   label: "المرعى",    lang: "ar", family: almarai.style.fontFamily },
  { id: "amiri",     label: "أميري",     lang: "ar", family: amiri.style.fontFamily },
  { id: "reemkufi",  label: "ريم كوفي",  lang: "ar", family: reemKufi.style.fontFamily },
  { id: "changa",    label: "تشانجا",    lang: "ar", family: changa.style.fontFamily },
  { id: "elmessiri", label: "المسيري",   lang: "ar", family: elMessiri.style.fontFamily },
  { id: "lalezar",   label: "لاله زار",  lang: "ar", family: lalezar.style.fontFamily },
  { id: "markazi",   label: "مركزي",     lang: "ar", family: markazi.style.fontFamily },
  { id: "arefruqaa", label: "عارف رقعة", lang: "ar", family: arefRuqaa.style.fontFamily },
  // لاتيني
  { id: "montserrat", label: "Montserrat",       lang: "en", family: montserrat.style.fontFamily },
  { id: "oswald",     label: "Oswald",           lang: "en", family: oswald.style.fontFamily },
  { id: "poppins",    label: "Poppins",          lang: "en", family: poppins.style.fontFamily },
  { id: "bebas",      label: "Bebas Neue",       lang: "en", family: bebas.style.fontFamily },
  { id: "anton",      label: "Anton",            lang: "en", family: anton.style.fontFamily },
  { id: "playfair",   label: "Playfair Display", lang: "en", family: playfair.style.fontFamily },
];

// أصناف متغيّرات الخطوط لتطبيقها على body — تضمن تحميل كل @font-face عالمياً دون تغيير الخط الأساسي
export const FONT_VARIABLE_CLASSES = [
  sukar, cairo, tajawal, almarai, amiri, reemKufi, changa, elMessiri, lalezar, markazi, arefRuqaa,
  montserrat, oswald, poppins, bebas, anton, playfair,
].map(f => f.variable).join(" ");

// خط الموقع الأساسي (القاهرة)
export const BASE_FONT_CLASSNAME = cairo.className;

export const FONT_BY_ID: Record<string, FontDef> = {};
FONT_CATALOG.forEach(f => { FONT_BY_ID[f.id] = f; });

// المفعّلة افتراضياً إن لم يضبط المسؤول شيئاً
export const DEFAULT_ENABLED_FONT_IDS = FONT_CATALOG.map(f => f.id);
