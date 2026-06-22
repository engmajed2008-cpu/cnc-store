/**
 * fontMetrics.ts
 * Real perimeter & area calculation from OpenType font paths.
 * Uses opentype.js to parse TTF fonts and compute exact path metrics
 * needed for accurate channel-letter pricing.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

type Pt = { x: number; y: number };

export interface PathMetrics {
  perimeter: number; // font units
  area: number;      // font units²
}

export interface TextMeasurement {
  perimeterCm: number;
  areaCm2: number;
  charCount: number;
  heightCm: number;
  /** Useful for debugging: shows per-character breakdown */
  perCharAvg: { perimeterCm: number; areaCm2: number };
}

// ─── Bezier helpers ───────────────────────────────────────────────────────────

/** Approximate length of a quadratic bezier by linear subdivision */
function qLen(p0: Pt, p1: Pt, p2: Pt, n = 18): number {
  let len = 0, px = p0.x, py = p0.y;
  for (let i = 1; i <= n; i++) {
    const t = i / n, mt = 1 - t;
    const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x;
    const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y;
    const dx = x - px, dy = y - py;
    len += Math.sqrt(dx * dx + dy * dy);
    px = x; py = y;
  }
  return len;
}

/** Approximate length of a cubic bezier by linear subdivision */
function cLen(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n = 18): number {
  let len = 0, px = p0.x, py = p0.y;
  for (let i = 1; i <= n; i++) {
    const t = i / n, mt = 1 - t;
    const x = mt*mt*mt*p0.x + 3*mt*mt*t*p1.x + 3*mt*t*t*p2.x + t*t*t*p3.x;
    const y = mt*mt*mt*p0.y + 3*mt*mt*t*p1.y + 3*mt*t*t*p2.y + t*t*t*p3.y;
    const dx = x - px, dy = y - py;
    len += Math.sqrt(dx * dx + dy * dy);
    px = x; py = y;
  }
  return len;
}

/** Shoelace formula — area of an arbitrary polygon from its vertices */
function shoelace(pts: Pt[]): number {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += pts[j].x * pts[i].y - pts[i].x * pts[j].y;
  }
  return Math.abs(a) / 2;
}

// ─── Core path metrics ────────────────────────────────────────────────────────

/**
 * Given an array of opentype.js path commands, compute:
 *  - total perimeter (outer + inner contours, in font units)
 *  - total filled area using the Shoelace formula (in font units²)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function calcPathMetrics(commands: any[]): PathMetrics {
  let perimeter = 0;
  let cx = 0, cy = 0, sx = 0, sy = 0;

  // We keep ONE flat list of contour polygons for area calculation.
  // Each contour (M…Z) becomes a polygon of approximated sample points.
  const contours: Pt[][] = [];
  let current: Pt[] = [];

  const push = (p: Pt) => { current.push(p); };

  for (const cmd of commands) {
    switch (cmd.type) {
      case 'M': {
        if (current.length > 1) contours.push(current);
        current = [];
        cx = cmd.x; cy = cmd.y;
        sx = cx;    sy = cy;
        push({ x: cx, y: cy });
        break;
      }
      case 'L': {
        const dx = cmd.x - cx, dy = cmd.y - cy;
        perimeter += Math.sqrt(dx * dx + dy * dy);
        cx = cmd.x; cy = cmd.y;
        push({ x: cx, y: cy });
        break;
      }
      case 'Q': {
        const p0 = { x: cx, y: cy };
        const p1 = { x: cmd.x1, y: cmd.y1 };
        const p2 = { x: cmd.x, y: cmd.y };
        perimeter += qLen(p0, p1, p2);
        // sample 10 interior points for the area polygon
        for (let i = 1; i <= 10; i++) {
          const t = i / 10, mt = 1 - t;
          push({
            x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
            y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
          });
        }
        cx = cmd.x; cy = cmd.y;
        break;
      }
      case 'C': {
        const p0 = { x: cx, y: cy };
        const p1 = { x: cmd.x1, y: cmd.y1 };
        const p2 = { x: cmd.x2, y: cmd.y2 };
        const p3 = { x: cmd.x, y: cmd.y };
        perimeter += cLen(p0, p1, p2, p3);
        for (let i = 1; i <= 10; i++) {
          const t = i / 10, mt = 1 - t;
          push({
            x: mt*mt*mt*p0.x + 3*mt*mt*t*p1.x + 3*mt*t*t*p2.x + t*t*t*p3.x,
            y: mt*mt*mt*p0.y + 3*mt*mt*t*p1.y + 3*mt*t*t*p2.y + t*t*t*p3.y,
          });
        }
        cx = cmd.x; cy = cmd.y;
        break;
      }
      case 'Z': {
        const dx = sx - cx, dy = sy - cy;
        perimeter += Math.sqrt(dx * dx + dy * dy);
        push({ x: sx, y: sy });
        contours.push(current);
        current = [];
        cx = sx; cy = sy;
        break;
      }
    }
  }
  if (current.length > 1) contours.push(current);

  // Sum area of all contours (outer contours add, holes subtract via winding,
  // but for pricing we want total material area so we sum absolute values)
  const area = contours.reduce((sum, c) => sum + shoelace(c), 0);

  return { perimeter, area };
}

// ─── Font loading (with cache) ────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fontCache = new Map<string, any>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadFont(url: string): Promise<any> {
  if (fontCache.has(url)) return fontCache.get(url)!;

  // Use fetch + parse — more reliable in Next.js than the callback-based load()
  const opentype = await import("opentype.js");
  const buffer   = await fetch(url).then(r => {
    if (!r.ok) throw new Error(`Font fetch failed (${r.status}): ${url}`);
    return r.arrayBuffer();
  });
  const font = opentype.parse(buffer);
  fontCache.set(url, font);
  return font;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Measure the real perimeter and face area of `text` rendered
 * at `heightCm` centimetres using the TTF font at `fontUrl`.
 *
 * opentype.js `stringToGlyphs()` applies GSUB shaping (Arabic contextual
 * forms, ligatures, etc.) so Arabic text is measured correctly.
 */
export async function measureText(
  text: string,
  fontUrl: string,
  heightCm: number,
): Promise<TextMeasurement> {
  if (!text.trim()) {
    return { perimeterCm: 0, areaCm2: 0, charCount: 0, heightCm, perCharAvg: { perimeterCm: 0, areaCm2: 0 } };
  }

  const font = await loadFont(fontUrl);
  const upm: number = font.unitsPerEm;

  // Determine scale: heightCm corresponds to the font's cap-height
  const capH: number =
    (font.tables?.os2?.sCapHeight as number | undefined) ??
    (font.ascender as number) * 0.9;

  // cm per font-unit
  const scale = heightCm / capH;

  // stringToGlyphs handles Arabic shaping (contextual forms + ligatures)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const glyphs: any[] = font.stringToGlyphs(text);

  let totalPerimeter = 0;
  let totalArea = 0;
  let charCount = 0;

  for (const glyph of glyphs) {
    // Skip spaces / zero-width glyphs
    if (!glyph || (glyph.advanceWidth ?? 0) === 0) continue;

    const path = glyph.getPath(0, 0, upm);
    const { perimeter, area } = calcPathMetrics(path.commands);

    totalPerimeter += perimeter;
    totalArea += area;
    charCount++;
  }

  const perimeterCm = totalPerimeter * scale;
  const areaCm2     = totalArea * scale * scale;

  return {
    perimeterCm,
    areaCm2,
    charCount,
    heightCm,
    perCharAvg: {
      perimeterCm: charCount ? perimeterCm / charCount : 0,
      areaCm2:     charCount ? areaCm2     / charCount : 0,
    },
  };
}
