"use client";

import { useCallback, useRef, useState } from "react";
import { analyzeSvgString, type SvgAnalysis, type SvgElementInfo, type SvgIssue } from "@/lib/design/analyzeSvg";

const GOLD = "#C9A24B";

const KIND_LABEL: Record<string, string> = {
  text: "نص", path: "لوجو (مسار)", rect: "مستطيل", circle: "دائرة", ellipse: "بيضاوي",
  polygon: "مضلّع", polyline: "خط متعدد", line: "خط", image: "صورة نقطية", use: "مرجع", group: "مجموعة", other: "آخر",
};

function IssueBadge({ issue }: { issue: SvgIssue }) {
  const err = issue.severity === "error";
  return (
    <span title={issue.message} style={{
      display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.6rem", fontWeight: 700,
      padding: "1px 7px", borderRadius: 999, whiteSpace: "nowrap",
      background: err ? "rgba(229,28,28,0.14)" : "rgba(201,162,75,0.14)",
      color: err ? "#ff8e8e" : GOLD, border: `1px solid ${err ? "rgba(229,28,28,0.4)" : "rgba(201,162,75,0.4)"}`,
    }}>{err ? "✕" : "!"} {issue.message}</span>
  );
}

function elementTitle(e: SvgElementInfo): string {
  if (e.kind === "text" && e.text) return `«${e.text.slice(0, 24)}»`;
  if (e.id) return `#${e.id}`;
  if (e.className) return `.${e.className.split(/\s+/)[0]}`;
  return KIND_LABEL[e.kind] || e.kind;
}

export default function SvgAnalysisPanel({ initialSvg }: { initialSvg?: string }) {
  const [analysis, setAnalysis] = useState<SvgAnalysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");
  const [showJson, setShowJson] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const run = useCallback(async (svg: string, name: string) => {
    setBusy(true); setErr(""); setFileName(name);
    try {
      const res = await analyzeSvgString(svg);
      setAnalysis(res);
      if (!res.ok) setErr(res.parseError || "تعذّر التحليل");
    } catch (e) { setErr((e as Error).message || "خطأ غير متوقع"); }
    finally { setBusy(false); }
  }, []);

  const onFile = useCallback(async (f: File) => {
    if (!/\.svg$/i.test(f.name)) { setErr("الرجاء اختيار ملف SVG (.svg)"); return; }
    const text = await f.text();
    run(text, f.name);
  }, [run]);

  const copyJson = () => { if (analysis) navigator.clipboard?.writeText(JSON.stringify(analysis, null, 2)).catch(() => {}); };
  const downloadJson = () => {
    if (!analysis) return;
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (fileName.replace(/\.svg$/i, "") || "svg") + "-analysis.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const card: React.CSSProperties = { background: "#FDFBF7", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "0.7rem 0.9rem" };

  return (
    <div dir="rtl" style={{ fontFamily: "Tajawal, Cairo, sans-serif", color: "#2C1E15" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.7rem" }}>
        <div>
          <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>🔬 تحليل ملف SVG</div>
          <div style={{ fontSize: "0.7rem", color: "#999" }}>استخراج النصوص واللوجوهات والأشكال + قياس الأبعاد والمساحة وكشف الأخطاء</div>
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button onClick={() => inputRef.current?.click()} style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "0.5rem 1rem", borderRadius: 10, cursor: "pointer",
            background: GOLD, color: "#2C1E15", border: "none", fontWeight: 800, fontSize: "0.8rem", fontFamily: "Cairo,sans-serif",
          }}>⬆ ارفع SVG</button>
          {initialSvg && (
            <button onClick={() => run(initialSvg, "التصميم الحالي.svg")} style={{
              padding: "0.5rem 1rem", borderRadius: 10, cursor: "pointer", background: "transparent",
              color: GOLD, border: `1px solid ${GOLD}55`, fontWeight: 700, fontSize: "0.8rem", fontFamily: "Cairo,sans-serif",
            }}>حلّل التصميم الحالي</button>
          )}
        </div>
      </div>

      <input ref={inputRef} type="file" accept=".svg,image/svg+xml" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />

      {/* منطقة الإفلات */}
      <div
        onDragOver={e => { e.preventDefault(); }}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
        onClick={() => inputRef.current?.click()}
        style={{ ...card, textAlign: "center", padding: "1.1rem", cursor: "pointer", borderStyle: "dashed", borderColor: "rgba(201,162,75,0.3)", marginBottom: "0.8rem" }}>
        <span style={{ fontSize: "0.78rem", color: "#bbb" }}>
          {busy ? "⏳ جارٍ التحليل…" : fileName ? `📄 ${fileName} — اسحب ملفاً آخر أو انقر للاستبدال` : "اسحب ملف SVG هنا أو انقر للاختيار"}
        </span>
      </div>

      {err && <div style={{ ...card, borderColor: "rgba(229,28,28,0.4)", color: "#ff8e8e", fontSize: "0.78rem", marginBottom: "0.8rem" }}>⚠ {err}</div>}

      {analysis?.ok && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          {/* ملخص */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(90px,1fr))", gap: "0.5rem" }}>
            {([
              ["نصوص", analysis.counts.texts], ["لوجوهات", analysis.counts.paths],
              ["أشكال", analysis.counts.shapes], ["صور نقطية", analysis.counts.images],
              ["أخطاء", analysis.summary.errors, true], ["تحذيرات", analysis.summary.warnings, false, true],
            ] as [string, number, boolean?, boolean?][]).map(([label, val, isErr, isWarn]) => (
              <div key={label} style={{ ...card, textAlign: "center", padding: "0.55rem" }}>
                <div style={{ fontSize: "1.25rem", fontWeight: 900, color: isErr && val ? "#ff8e8e" : isWarn && val ? GOLD : "#2C1E15" }}>{val}</div>
                <div style={{ fontSize: "0.64rem", color: "#999" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* أبعاد اللوحة */}
          <div style={{ ...card, fontSize: "0.74rem", color: "#ccc", display: "flex", gap: "1.2rem", flexWrap: "wrap" }}>
            <span>أبعاد اللوحة: <b style={{ color: "#fff" }}>{analysis.source.widthUnits} × {analysis.source.heightUnits}</b> وحدة</span>
            {analysis.source.widthCm !== undefined && <span>≈ <b style={{ color: GOLD }}>{analysis.source.widthCm} × {analysis.source.heightCm} سم</b></span>}
            <span>الوحدة: <b style={{ color: "#fff" }}>{analysis.source.unit}</b></span>
          </div>

          {/* أخطاء الملف */}
          {analysis.issues.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {analysis.issues.map((iss, i) => <IssueBadge key={i} issue={iss} />)}
            </div>
          )}

          {/* جدول العناصر */}
          <div style={{ ...card, padding: 0, overflow: "auto", maxHeight: 360 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
              <thead>
                <tr style={{ position: "sticky", top: 0, background: "#151515", color: "#999", textAlign: "right" }}>
                  {["#", "النوع", "المحتوى", "العرض×الارتفاع", "المساحة", "ملاحظات"].map(h => (
                    <th key={h} style={{ padding: "0.5rem 0.6rem", fontWeight: 700, whiteSpace: "nowrap", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analysis.elements.map(e => {
                  const dim = e.widthCm !== undefined ? `${e.widthCm}×${e.heightCm} سم` : `${e.width}×${e.height}`;
                  const area = e.areaCm2 !== undefined ? `${e.areaCm2} سم²` : `${e.areaUnits}`;
                  return (
                    <tr key={e.index} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: e.issues.some(i => i.severity === "error") ? "rgba(229,28,28,0.06)" : "transparent" }}>
                      <td style={{ padding: "0.45rem 0.6rem", color: "#777" }}>{e.index + 1}</td>
                      <td style={{ padding: "0.45rem 0.6rem", whiteSpace: "nowrap", color: e.kind === "image" ? "#ff8e8e" : "#ddd" }}>{KIND_LABEL[e.kind] || e.kind}</td>
                      <td style={{ padding: "0.45rem 0.6rem", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{elementTitle(e)}</td>
                      <td style={{ padding: "0.45rem 0.6rem", whiteSpace: "nowrap", color: "#bbb" }}>{dim}</td>
                      <td style={{ padding: "0.45rem 0.6rem", whiteSpace: "nowrap", color: "#bbb" }}>{area}</td>
                      <td style={{ padding: "0.45rem 0.6rem" }}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {e.dpi !== undefined && <span style={{ fontSize: "0.6rem", color: e.dpi < 150 ? "#ff8e8e" : "#7bd88f" }}>{e.dpi} DPI</span>}
                          {e.issues.map((iss, i) => <IssueBadge key={i} issue={iss} />)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* JSON */}
          <div>
            <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.4rem" }}>
              <button onClick={() => setShowJson(s => !s)} style={jsonBtn}>{showJson ? "إخفاء" : "عرض"} JSON</button>
              <button onClick={copyJson} style={jsonBtn}>نسخ</button>
              <button onClick={downloadJson} style={jsonBtn}>تنزيل JSON</button>
            </div>
            {showJson && (
              <pre dir="ltr" style={{ ...card, maxHeight: 280, overflow: "auto", fontSize: "0.66rem", color: "#cdd6c8", background: "#F4EFE6", lineHeight: 1.5, margin: 0 }}>
                {JSON.stringify(analysis, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const jsonBtn: React.CSSProperties = {
  padding: "0.35rem 0.8rem", borderRadius: 8, cursor: "pointer", background: "rgba(255,255,255,0.05)",
  color: "#ccc", border: "1px solid rgba(255,255,255,0.1)", fontWeight: 700, fontSize: "0.72rem", fontFamily: "Cairo,sans-serif",
};
