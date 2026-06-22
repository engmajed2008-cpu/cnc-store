# CLAUDE.md — إعلاني (e3lani) — سوق الدعاية والإعلان

## Project Overview
Next.js 14.2.5 advertising & signage marketplace in Saudi Arabia (formerly "Metal Art" CNC store).
- **Brand (current, 2026-06)**: AR «إعلاني», Latin "E3lani", domain e3lani.com (user verified available; ALSO register e3lani.sa + check SAIP trademark before launch). Descriptor line: «سوق الدعاية والإعلان». Owner: مؤسسة القوافل العربية للمقاولات.
- **BrandMark**: sign-frame with 6 sequential-twinkle bulbs (3 top / 3 bottom) around a «ع» monogram that also reads "3" (e3lani). Auto-simplifies below 48px (flat gold #C9A24B, thicker strokes). Brand palette: dark brown #241A11, brown #33261A, gold #C9A24B, light gold #EBCB7C, cream #F4ECDD (site still uses legacy #C9A84C gold — near identical).
- Previous name «سوق الدعاية والإعلان / ADSOUQ / adsouq.sa» superseded 2026-06-12 by user-approved merged mark (proposal ج+د).
- Do NOT rename localStorage keys (`metalart_*`), coupon codes, or the seed admin email — they are identifiers, not branding.
- **Stack**: Next.js App Router, next-intl 3.17.2, Tailwind CSS, TypeScript
- **Languages**: Arabic (default) + English, RTL/LTR support
- **Path**: `C:\Users\engma\OneDrive\Desktop\cnc-store`

## Key Architecture

### Routing
- `src/app/[locale]/` — all pages under locale dynamic segment
- Supported locales: `ar` (default), `en`
- `src/middleware.ts` handles locale detection/redirect

### i18n
- Config: `src/lib/i18n.ts` — exports `getRequestConfig` (server-only), `locales`, `defaultLocale`
- Messages: `messages/ar.json`, `messages/en.json`
- **IMPORTANT**: `timeZone: "Asia/Riyadh"` must be set in both `getRequestConfig` AND `NextIntlClientProvider` to prevent hydration mismatch
- `setRequestLocale(locale)` must be called in BOTH layout.tsx AND page.tsx

### Layout Structure
```
src/app/layout.tsx            ← root layout, returns children only (no html/body)
src/app/[locale]/layout.tsx   ← sets locale, renders html/body, uses Providers
src/app/[locale]/providers.tsx ← "use client" wrapper for NextIntlClientProvider + Navbar
```

### Critical Rules for Client Components
- Never import from `@/lib/i18n` in client components — it pulls in server-only `getRequestConfig`
- Use inline type: `type Locale = "ar" | "en"` instead of `import type { Locale } from "@/lib/i18n"`
- Use `dynamic(() => import(...), { ssr: false })` for heavy client-only sections like CategoryGrid

### Styling
- Global CSS: `src/styles/globals.css` (NOT `src/app/globals.css`)
- Tailwind with custom brand tokens: `brand-gold`, `brand-off-white`, `brand-silver`, `brand-steel`
- Font: Cairo (next/font/google) with arabic + latin subsets
- Custom classes: `btn-primary`, `btn-secondary`, `section-container`, `text-gold-gradient`

## الألوان (هوية «إعلاني» — مطبَّقة على الموقع كاملاً 2026-06-12)
- Gold: #C9A24B (brand-gold) | Gold light: #EBCB7C | Bronze: #9A6A2A
- BG levels: page #1E1610 | surface #241A11 | card/modal #2A1F14 | deepest (admin) #19120B | brown accent #33261A
- Text: #F4ECDD (cream) | secondary #A39584
- rgba gold borders: rgba(201,162,75,α)
- Legacy colors (#C9A84C, #111, #0d0d0d, #F5F3EE...) were bulk-migrated via scripts/rebrand-colors.js — do not reintroduce them.

## نظام الفخامة البصري الشامل (Premium & Luxury End-to-End) — مطلوب تطبيقه على كل الصفحات ولوحات التحكم
الهدف: إعادة تنسيق وتطوير الكود بالكامل ليصبح نظاماً فاخراً موحّداً (كريمي/بني/ذهبي) مع تأثيرات لامعة، يشمل **كل** الصفحات الخارجية + لوحات التحكم (الإدارة والعملاء).

### 1) توزيع الألوان الفاخر (قاعدة 60-30-10)
- **الخلفية العامة** لكل الصفحات ولوحات التحكم: كريمي فاتح ناعم `#FDFBF7` (راحة للعين والعمل الطويل). → CSS var `--bg-primary`.
- **خلفية القوائم الجانبية (Sidebar)، البطاقات (Cards)، البيانات، الجداول**: كريمي دافئ `#F4EFE6` مع حواف دائرية ناعمة وظل خفيف جداً (Soft Shadow). → `--bg-secondary` / `--bg-card`.
- **العناوين، أسماء المنتجات، عناوين الجداول**: بني داكن فاخر `#2C1E15` بوزن عريض. → `--text-primary`.
- **النصوص الفرعية، الإحصائيات الثانوية، التفاصيل**: بني متوسط ناعم `#634E40`. → `--text-secondary`.

### 2) التأثيرات الذهبية اللامعة (Metallic & Glow)
- **الأزرار الرئيسية (Primary CTAs)** (شراء/حفظ التعديلات/الأفعال الأساسية): تدرّج معدني ذهبي `linear-gradient(135deg, #9A7B36 0%, #E6CA83 50%, #F7E7C4 100%)` ونص الزر **بني داكن** `#2C1E15` لتباين ممتاز. → class `.btn-luxury`.
- **Shimmer**: ومضة ضوء بيضاء ناعمة مائلة تمرّ فوق الأزرار الذهبية دورياً (كل ~4s) وعند Hover. → class `.btn-shine` موجود (دورته 4s).
- **Glow Shadows**: ظل ذهبي ناعم عالي الشفافية `rgba(197,160,89,0.25)` يعطي إيحاء الإشعاع.
- **حواف البطاقات (Cards/Stats)**: حد رفيع جداً `1px` بتدرّج ذهبي ناعم يتفاعل عند Hover. → class `.card-luxury`.

### 3) الخطوط والمخططات (Typography & Dashboard UI)
- خط **"Tajawal"** من Google Fonts؛ العناوين Bold 700 بحجم بارز؛ الأسعار/الأرقام الإحصائية ضخمة وواضحة بالذهبي أو البني العريض.
- مساحات بيضاء كافية (Padding/Margins) داخل البطاقات والجداول وبين العناصر — تخطيط Minimalist يوحي بالفخامة.
- الرسوم البيانية/المخططات في لوحة التحكم: استخدم درجات **البني والذهبي** لتمثيل البيانات لتنسجم مع الهوية.

### قواعد التنفيذ
- الألوان تُدار مركزياً عبر CSS variables في `src/styles/globals.css` و tokens في `tailwind.config.js`. عدّل المركز أولاً، ثم رحّل الألوان المكتوبة يدوياً (hardcoded) عبر سكربت في `scripts/`.
- هذا النظام **يستبدل** الثيم الداكن القديم (#1E1610...) كثيم افتراضي. الثيم الافتراضي صار **فاتحاً فاخراً**.

## File Encoding — IMPORTANT
Some source files were saved with wrong encoding causing mojibake for Arabic strings.
If you see strings like `"ط§ط·ظ„ط¨"` — that is UTF-8 Arabic read as Latin-1.
Always save files as UTF-8. Fixed files: HeroSection.tsx, CategoryGrid.tsx.

## Components
- `src/components/layout/Navbar.tsx` — "use client", hardcoded ar/en nav labels
- `src/components/sections/HeroSection.tsx` — "use client", animated 4-slide hero with stats
- `src/components/sections/CategoryGrid.tsx` — "use client", 5-category bento grid
- `src/components/sections/ServicesSection.tsx` — exists, not yet added to home page
- `src/components/product/CNCConfigurator.tsx` — CNC order configurator with live price calculator

## Home Page (`src/app/[locale]/page.tsx`)
Currently renders: HeroSection + CategoryGrid (CategoryGrid loaded with `dynamic ssr:false`)

## Pending Work
- Add ServicesSection to home page
- Add Footer component to layout
- Fix SVG attribute warnings in HeroSection (minor, non-blocking)

## Common Issues & Fixes

### webpack `options.factory` error
Root cause: React hydration mismatch cascading to webpack failure.
Most common trigger: missing `timeZone` in NextIntlClientProvider.
Fix: ensure `timeZone="Asia/Riyadh"` in `providers.tsx`.

### Nested html/body
Root layout must return `children as React.ReactElement` — no html/body tags.

### تشغيل سيرفرين dev معاً يفسد `.next`
NEVER run two `npm run dev` at once — both write to the same `.next` and corrupt it
(`Cannot find module './vendor-chunks/...'`). Fix: kill all node listeners on 3000-3010,
`Remove-Item -Recurse -Force .next`, start ONE server.

### next.config.mjs
Do NOT use `optimizePackageImports` for lucide-react/clsx — causes webpack chunk issues.
Do NOT use `output: "standalone"` during development.

## Commands
```powershell
# Start dev server
npm run dev

# Clear Next.js cache
Remove-Item -Recurse -Force .next

# Read files with [locale] in path (PowerShell)
Get-Content -LiteralPath "src\app\[locale]\page.tsx"
```

## حل مشكلة `options.factory` — الدرس النهائي

### السبب الحقيقي
مشكلة **كاش المتصفح** وليست في الكود. عند تشغيل dev server جديد بعد `Remove-Item .next`، يحاول المتصفح تحميل ملفات hot-update من بناء قديم فيحصل على 404، مما يسبب `originalFactory.call()` undefined في webpack.

### الحل السريع
بعد كل `Remove-Item .next; npm run dev`، اضغط **Ctrl+Shift+R** في المتصفح (Hard Refresh).

### أو في DevTools
F12 → Network → ضع علامة "Disable cache" → Reload.

### ملفات كانت تالفة وتم إصلاحها
- `page.tsx` — كان مقطوعاً (truncated) عند السطر 13
- `HeroSection.tsx`, `HeroSlider.tsx`, `ServicesSection.tsx`, `LanguageSwitcher.tsx`, `useDirection.ts` — كانت مقطوعة أو تحتوي null bytes
- `CategoryGrid.tsx` — null bytes في النهاية
- `next.config.mjs`, `layout.tsx`, `providers.tsx`, `i18n.ts` — كانت تحتوي BOM (Byte Order Mark) يمنع التعرف على `"use client"`
