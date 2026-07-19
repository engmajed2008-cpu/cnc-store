// ─────────────────────────────────────────────────────────────────────────────
// وحدة تحليل SVG — تعمل في المتصفح (تعتمد getBBox/getCTM لقياس دقيق مع التحويلات)
//
// تستخرج: النصوص (text/tspan)، اللوجوهات (path)، الأشكال (rect/circle/ellipse/
// polygon/polyline/line)، وتحسب لكل عنصر العرض والارتفاع والمساحة، وتكتشف
// الأخطاء الشائعة (DPI منخفض، الملف Raster لا Vector، حجم غير منطقي).
// تُرجع النتيجة في JSON منظم عبر النوع SvgAnalysis.
// ─────────────────────────────────────────────────────────────────────────────

export type SvgUnit = "px" | "pt" | "mm" | "cm" | "in" | "unknown";

export type SvgElementKind =
  | "text" | "path"
  | "rect" | "circle" | "ellipse" | "polygon" | "polyline" | "line"
  | "image" | "use" | "group" | "other";

export type Severity = "error" | "warning";

export type SvgIssue = { code: string; severity: Severity; message: string };

export type SvgElementInfo = {
  index: number;
  kind: SvgElementKind;
  tag: string;
  id?: string;
  className?: string;
  text?: string;              // محتوى النص إن وجد
  isVector: boolean;          // false لعناصر <image> النقطية
  // الأبعاد بوحدات viewBox (user units) بعد تطبيق كل التحويلات
  x: number; y: number; width: number; height: number;
  areaUnits: number;          // المساحة الهندسية بوحدات² (مساحة الشكل لا الصندوق)
  bboxAreaUnits: number;      // مساحة الصندوق المحيط (للمقارنة)
  // الأبعاد المادية إن أمكن استنتاج الوحدة
  widthCm?: number; heightCm?: number; areaCm2?: number;
  // خاص بالصور النقطية المضمّنة
  naturalWidthPx?: number; naturalHeightPx?: number; dpi?: number;
  issues: SvgIssue[];
};

export type SvgAnalysis = {
  ok: boolean;                // false إذا فشل التحليل تماماً
  parseError?: string;
  source: {
    viewBox?: [number, number, number, number];
    widthUnits: number;       // عرض اللوحة بوحدات viewBox
    heightUnits: number;
    declaredWidth?: string;   // قيمة width الأصلية (مثل "30cm")
    declaredHeight?: string;
    unit: SvgUnit;            // الوحدة المادية المستنتجة
    widthCm?: number; heightCm?: number;
  };
  counts: { texts: number; paths: number; shapes: number; images: number; total: number };
  texts: SvgElementInfo[];
  logos: SvgElementInfo[];    // عناصر path
  shapes: SvgElementInfo[];   // rect/circle/ellipse/polygon/polyline/line
  images: SvgElementInfo[];
  elements: SvgElementInfo[]; // كل العناصر بالترتيب
  issues: SvgIssue[];         // أخطاء/تحذيرات على مستوى الملف
  summary: { errors: number; warnings: number };
};

// تحويل الوحدات إلى سنتيمترات (لكل وحدة واحدة)
const CM_PER_UNIT: Record<SvgUnit, number | undefined> = {
  cm: 1, mm: 0.1, in: 2.54, pt: 2.54 / 72, px: 2.54 / 96, unknown: undefined,
};

const VECTOR_KINDS: SvgElementKind[] = ["text", "path", "rect", "circle", "ellipse", "polygon", "polyline", "line"];

function unitFromLength(v: string | null): { num: number; unit: SvgUnit } | null {
  if (!v) return null;
  const m = v.trim().match(/^(-?[\d.]+)\s*(px|pt|mm|cm|in)?$/i);
  if (!m) return null;
  const u = (m[2] || "px").toLowerCase() as SvgUnit;
  return { num: parseFloat(m[1]), unit: u };
}

function kindOf(tag: string): SvgElementKind {
  switch (tag) {
    case "text": case "tspan": return "text";
    case "path": return "path";
    case "rect": return "rect";
    case "circle": return "circle";
    case "ellipse": return "ellipse";
    case "polygon": return "polygon";
    case "polyline": return "polyline";
    case "line": return "line";
    case "image": return "image";
    case "use": return "use";
    case "g": return "group";
    default: return "other";
  }
}

// مساحة مضلّع من نقاط (صيغة الحذاء/shoelace)
function polygonArea(pts: { x: number; y: number }[]): number {
  let a = 0;
  for (let i = 0, n = pts.length; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}

function parsePoints(attr: string | null): { x: number; y: number }[] {
  if (!attr) return [];
  const nums = attr.trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n));
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push({ x: nums[i], y: nums[i + 1] });
  return pts;
}

// مساحة مسار عبر أخذ عيّنات على طوله ثم shoelace (تقريبية للّوجوهات المملوءة)
function sampledPathArea(el: SVGGeometryElement): number {
  try {
    const len = el.getTotalLength();
    if (!len || !isFinite(len)) return 0;
    const n = Math.max(24, Math.min(400, Math.round(len / 4)));
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < n; i++) {
      const p = el.getPointAtLength((i / n) * len);
      pts.push({ x: p.x, y: p.y });
    }
    return polygonArea(pts);
  } catch { return 0; }
}

// صندوق محيط محوّل إلى وحدات اللوحة (يطبّق سلسلة التحويلات عبر getCTM)
// لأننا نضبط عرض/ارتفاع الـ SVG = أبعاد viewBox، يصبح getCTM بمقياس 1 فتبقى القيم بوحدات viewBox
function transformedBBox(el: SVGGraphicsElement): { x: number; y: number; w: number; h: number } | null {
  let bb: DOMRect;
  try { bb = el.getBBox(); } catch { return null; }
  const ctm = el.getCTM();
  if (!ctm) return { x: bb.x, y: bb.y, w: bb.width, h: bb.height };
  const corners = [
    { x: bb.x, y: bb.y },
    { x: bb.x + bb.width, y: bb.y },
    { x: bb.x, y: bb.y + bb.height },
    { x: bb.x + bb.width, y: bb.y + bb.height },
  ].map(p => ({ x: ctm.a * p.x + ctm.c * p.y + ctm.e, y: ctm.b * p.x + ctm.d * p.y + ctm.f }));
  const xs = corners.map(c => c.x), ys = corners.map(c => c.y);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

function loadImageSize(href: string): Promise<{ w: number; h: number } | null> {
  return new Promise(res => {
    if (typeof Image === "undefined") return res(null);
    const img = new Image();
    const done = (v: { w: number; h: number } | null) => res(v);
    img.onload = () => done({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => done(null);
    try { img.src = href; } catch { done(null); }
    setTimeout(() => done(null), 6000);
  });
}

/**
 * يحلّل نص SVG ويُعيد JSON منظماً.
 * يجب أن يعمل في بيئة المتصفح (يحتاج document وgetBBox).
 */
export async function analyzeSvgString(svgText: string): Promise<SvgAnalysis> {
  const baseIssues: SvgIssue[] = [];
  const empty = (msg: string): SvgAnalysis => ({
    ok: false, parseError: msg,
    source: { widthUnits: 0, heightUnits: 0, unit: "unknown" },
    counts: { texts: 0, paths: 0, shapes: 0, images: 0, total: 0 },
    texts: [], logos: [], shapes: [], images: [], elements: [],
    issues: [{ code: "PARSE_FAILED", severity: "error", message: msg }],
    summary: { errors: 1, warnings: 0 },
  });

  if (typeof document === "undefined") return empty("يتطلب التحليل بيئة المتصفح");
  if (!svgText || !svgText.trim()) return empty("ملف SVG فارغ");

  // 1) التحليل
  let svg: SVGSVGElement | null = null;
  try {
    const doc = new DOMParser().parseFromString(svgText.replace(/^﻿/, ""), "image/svg+xml");
    if (doc.querySelector("parsererror")) return empty("صيغة SVG غير صالحة (parser error)");
    svg = doc.querySelector("svg") as SVGSVGElement | null;
  } catch (e) {
    return empty("تعذّر تحليل الملف: " + (e as Error).message);
  }
  if (!svg) return empty("لا يحتوي الملف على عنصر <svg>");

  // 2) أبعاد اللوحة والوحدة
  let vb: [number, number, number, number] | undefined;
  const vbAttr = svg.getAttribute("viewBox");
  if (vbAttr) {
    const p = vbAttr.trim().split(/[\s,]+/).map(parseFloat);
    if (p.length === 4 && p.every(n => !isNaN(n))) vb = [p[0], p[1], p[2], p[3]];
  }
  const wLen = unitFromLength(svg.getAttribute("width"));
  const hLen = unitFromLength(svg.getAttribute("height"));
  const widthUnits = vb ? vb[2] : (wLen?.num || 0);
  const heightUnits = vb ? vb[3] : (hLen?.num || 0);
  // الوحدة المادية: من width/height إن كانت بوحدة مادية، وإلا غير معروفة
  let unit: SvgUnit = "unknown";
  if (wLen && wLen.unit !== "px") unit = wLen.unit;
  else if (hLen && hLen.unit !== "px") unit = hLen.unit;
  else if (wLen) unit = "px";
  // عامل التحويل من وحدة viewBox إلى سم: نربط طول اللوحة المادي بعدد وحدات viewBox
  let cmPerUnit: number | undefined;
  if (unit !== "unknown" && CM_PER_UNIT[unit] !== undefined) {
    if (vb && wLen) cmPerUnit = (wLen.num * (CM_PER_UNIT[wLen.unit] ?? 0)) / (vb[2] || 1);
    else cmPerUnit = CM_PER_UNIT[unit];
  }
  const toCm = (u: number) => (cmPerUnit !== undefined ? u * cmPerUnit : undefined);

  // 3) إلحاق نسخة خارج الشاشة بعرض/ارتفاع = أبعاد viewBox حتى يبقى getCTM بمقياس 1
  const holder = document.createElement("div");
  holder.setAttribute("style", "position:absolute;left:-99999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none");
  const clone = svg.cloneNode(true) as SVGSVGElement;
  if (vb) {
    clone.setAttribute("width", String(vb[2]));
    clone.setAttribute("height", String(vb[3]));
  } else if (widthUnits && heightUnits) {
    clone.setAttribute("viewBox", `0 0 ${widthUnits} ${heightUnits}`);
    clone.setAttribute("width", String(widthUnits));
    clone.setAttribute("height", String(heightUnits));
  }
  if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  holder.appendChild(clone);
  document.body.appendChild(holder);

  const elements: SvgElementInfo[] = [];
  const SEL = "text,path,rect,circle,ellipse,polygon,polyline,line,image";

  try {
    const nodes = Array.from(clone.querySelectorAll<SVGGraphicsElement>(SEL));
    let idx = 0;
    for (const el of nodes) {
      const tag = el.tagName.toLowerCase();
      // تجاهل tspan إن كان داخل text (نحسب text الأب فقط)
      if (tag === "tspan") continue;
      const kind = kindOf(tag);
      const isVector = kind !== "image";
      const tb = transformedBBox(el) || { x: 0, y: 0, w: 0, h: 0 };

      // المساحة الهندسية حسب النوع (بوحدات viewBox، قبل التحويلات غير المتجانسة فتقريبية)
      let areaUnits = 0;
      try {
        if (kind === "rect") {
          const w = parseFloat(el.getAttribute("width") || "0"), h = parseFloat(el.getAttribute("height") || "0");
          areaUnits = Math.max(0, w * h);
        } else if (kind === "circle") {
          const r = parseFloat(el.getAttribute("r") || "0");
          areaUnits = Math.PI * r * r;
        } else if (kind === "ellipse") {
          const rx = parseFloat(el.getAttribute("rx") || "0"), ry = parseFloat(el.getAttribute("ry") || "0");
          areaUnits = Math.PI * rx * ry;
        } else if (kind === "polygon") {
          areaUnits = polygonArea(parsePoints(el.getAttribute("points")));
        } else if (kind === "path") {
          areaUnits = sampledPathArea(el as SVGGeometryElement);
        } else {
          // text / image / polyline / line: نعتمد مساحة الصندوق
          areaUnits = tb.w * tb.h;
        }
      } catch { areaUnits = tb.w * tb.h; }
      // إن فشل الحساب الهندسي نعود لمساحة الصندوق
      if (!isFinite(areaUnits) || areaUnits <= 0) areaUnits = tb.w * tb.h;

      const info: SvgElementInfo = {
        index: idx++, kind, tag,
        id: el.getAttribute("id") || undefined,
        className: el.getAttribute("class") || undefined,
        isVector,
        x: round(tb.x), y: round(tb.y), width: round(tb.w), height: round(tb.h),
        areaUnits: round(areaUnits), bboxAreaUnits: round(tb.w * tb.h),
        issues: [],
      };
      if (kind === "text") info.text = (el.textContent || "").replace(/\s+/g, " ").trim();

      const wCm = toCm(tb.w), hCm = toCm(tb.h);
      if (wCm !== undefined) info.widthCm = round(wCm);
      if (hCm !== undefined) info.heightCm = round(hCm);
      if (cmPerUnit !== undefined) info.areaCm2 = round(areaUnits * cmPerUnit * cmPerUnit);

      // ── صورة نقطية مضمّنة: DPI ──
      if (kind === "image") {
        const href = el.getAttribute("href") || el.getAttributeNS("http://www.w3.org/1999/xlink", "href") || "";
        const sz = href ? await loadImageSize(href) : null;
        if (sz) {
          info.naturalWidthPx = sz.w; info.naturalHeightPx = sz.h;
          if (wCm !== undefined && wCm > 0) {
            const inches = wCm / 2.54;
            const dpi = Math.round(sz.w / inches);
            info.dpi = dpi;
            if (dpi < 150) info.issues.push({ code: "LOW_DPI", severity: dpi < 96 ? "error" : "warning", message: `دقة منخفضة (${dpi} DPI) — يُنصح ≥ 150 للقص/الطباعة` });
          }
        }
      }

      // ── حجم غير منطقي ──
      if (tb.w <= 0 || tb.h <= 0) {
        info.issues.push({ code: "ZERO_SIZE", severity: "warning", message: "أبعاد صفرية أو غير مرئية" });
      } else {
        const ar = Math.max(tb.w, tb.h) / Math.max(1e-6, Math.min(tb.w, tb.h));
        if (ar > 60) info.issues.push({ code: "EXTREME_ASPECT", severity: "warning", message: `نسبة أبعاد متطرفة (${ar.toFixed(0)}:1)` });
        if (widthUnits && heightUnits) {
          const overflow = tb.x < -widthUnits * 0.05 || tb.y < -heightUnits * 0.05 ||
                           tb.x + tb.w > widthUnits * 1.05 || tb.y + tb.h > heightUnits * 1.05;
          if (overflow) info.issues.push({ code: "OUT_OF_BOUNDS", severity: "warning", message: "العنصر يتجاوز حدود اللوحة" });
          if (tb.w > widthUnits * 50 || tb.h > heightUnits * 50)
            info.issues.push({ code: "ABSURD_SIZE", severity: "error", message: "حجم غير منطقي (أكبر بكثير من اللوحة)" });
        }
      }

      elements.push(info);
    }
  } finally {
    document.body.removeChild(holder);
  }

  // 4) تصنيف
  const texts = elements.filter(e => e.kind === "text" && (e.text?.length || 0) > 0);
  const logos = elements.filter(e => e.kind === "path");
  const shapes = elements.filter(e => ["rect", "circle", "ellipse", "polygon", "polyline", "line"].includes(e.kind));
  const images = elements.filter(e => e.kind === "image");
  const vectorCount = elements.filter(e => VECTOR_KINDS.includes(e.kind)).length;

  // 5) أخطاء على مستوى الملف
  const issues = baseIssues;
  if (!widthUnits || !heightUnits) issues.push({ code: "NO_DIMENSIONS", severity: "warning", message: "لا توجد أبعاد/viewBox واضحة للّوحة" });
  if (unit === "unknown") issues.push({ code: "NO_UNIT", severity: "warning", message: "وحدة القياس غير محددة — تعذّر حساب الأبعاد المادية وDPI" });
  // الملف Raster لا Vector: لا عناصر متجهة وصورة نقطية واحدة على الأقل (أو لا شيء)
  if (vectorCount === 0 && images.length > 0)
    issues.push({ code: "RASTER_NOT_VECTOR", severity: "error", message: "الملف نقطي (Raster) وليس متجهاً (Vector) — مجرد صورة داخل غلاف SVG" });
  if (vectorCount === 0 && images.length === 0)
    issues.push({ code: "EMPTY", severity: "error", message: "لا يحتوي الملف على عناصر قابلة للقص" });
  if (images.length > 0 && vectorCount > 0)
    issues.push({ code: "MIXED_RASTER", severity: "warning", message: `يحتوي على ${images.length} صورة نقطية مدمجة قد لا تُقص كمتجهات` });

  // جمع أخطاء العناصر إلى مستوى الملف
  const elementErrors = elements.reduce((n, e) => n + e.issues.filter(i => i.severity === "error").length, 0);
  const elementWarnings = elements.reduce((n, e) => n + e.issues.filter(i => i.severity === "warning").length, 0);
  const errors = issues.filter(i => i.severity === "error").length + elementErrors;
  const warnings = issues.filter(i => i.severity === "warning").length + elementWarnings;

  return {
    ok: true,
    source: {
      viewBox: vb, widthUnits: round(widthUnits), heightUnits: round(heightUnits),
      declaredWidth: svg.getAttribute("width") || undefined,
      declaredHeight: svg.getAttribute("height") || undefined,
      unit,
      widthCm: toCm(widthUnits) !== undefined ? round(toCm(widthUnits)!) : undefined,
      heightCm: toCm(heightUnits) !== undefined ? round(toCm(heightUnits)!) : undefined,
    },
    counts: { texts: texts.length, paths: logos.length, shapes: shapes.length, images: images.length, total: elements.length },
    texts, logos, shapes, images, elements,
    issues,
    summary: { errors, warnings },
  };
}

function round(n: number): number { return Math.round(n * 100) / 100; }
