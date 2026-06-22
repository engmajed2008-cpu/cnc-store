"use client";
import { useEffect, useMemo, useRef, useState } from "react";

const GOLD = "#C9A24B";

type SceneId = "store" | "building" | "warehouse" | "upload";

// مشاهد توضيحية مرسومة بـ SVG (واجهات) — تملأ الإطار ومنطقة اللوحة الافتراضية محدّدة في defaultPos
function StoreScene() {
  return (
    <svg viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#cfe3f2" /><stop offset="1" stopColor="#eef4f8" /></linearGradient>
      </defs>
      <rect width="1000" height="620" fill="url(#sky)" />
      <rect y="470" width="1000" height="150" fill="#c9c4bb" />
      <rect x="120" y="150" width="760" height="360" fill="#efeae1" stroke="#cdc6b8" strokeWidth="3" />
      {/* فاصية اللافتة */}
      <rect x="120" y="150" width="760" height="78" fill="#3a4654" />
      {/* مظلة مخططة */}
      <g>
        {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={140 + i * 60} y="232" width="60" height="40" fill={i % 2 ? "#b23b3b" : "#f2efe9"} />)}
        <rect x="140" y="270" width="720" height="8" fill="#8f2f2f" />
      </g>
      {/* واجهة زجاجية وباب */}
      <rect x="160" y="300" width="300" height="170" fill="#bcd6e6" opacity="0.7" stroke="#9fb3c0" strokeWidth="3" />
      <rect x="540" y="300" width="300" height="170" fill="#bcd6e6" opacity="0.7" stroke="#9fb3c0" strokeWidth="3" />
      <rect x="470" y="300" width="60" height="170" fill="#8aa0ad" />
      <rect x="120" y="505" width="760" height="14" fill="#b8b2a6" />
    </svg>
  );
}
function BuildingScene() {
  return (
    <svg viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <rect width="1000" height="620" fill="#d7e2ea" />
      <rect y="500" width="1000" height="120" fill="#c2bdb3" />
      <rect x="180" y="60" width="640" height="450" fill="#9aa7b0" stroke="#7d8a93" strokeWidth="3" />
      {Array.from({ length: 4 }).map((_, r) => Array.from({ length: 5 }).map((__, c) => (
        <rect key={`${r}-${c}`} x={215 + c * 120} y={110 + r * 80} width="80" height="52" fill="#cfe0ec" stroke="#8497a3" strokeWidth="2" />
      )))}
      {/* شريط اللافتة فوق المدخل */}
      <rect x="180" y="430" width="640" height="80" fill="#2c3742" />
      <rect x="430" y="470" width="140" height="40" fill="#6b7780" />
    </svg>
  );
}
function WarehouseScene() {
  return (
    <svg viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <rect width="1000" height="620" fill="#dfe6ea" />
      <rect y="500" width="1000" height="120" fill="#bdb8ad" />
      <polygon points="120,170 880,170 840,110 160,110" fill="#9fa6ab" />
      <rect x="120" y="170" width="760" height="340" fill="#b7bdc1" stroke="#959ba0" strokeWidth="3" />
      {Array.from({ length: 16 }).map((_, i) => <line key={i} x1={120 + i * 48} y1="170" x2={120 + i * 48} y2="510" stroke="#a6acb0" strokeWidth="2" />)}
      {/* باب رول كبير */}
      <rect x="360" y="320" width="280" height="190" fill="#8b9298" stroke="#6f767b" strokeWidth="3" />
      {Array.from({ length: 9 }).map((_, i) => <line key={i} x1="360" y1={335 + i * 20} x2="640" y2={335 + i * 20} stroke="#737a7f" strokeWidth="2" />)}
      {/* شريط اللافتة العلوي */}
      <rect x="120" y="190" width="760" height="90" fill="#243038" opacity="0.15" />
    </svg>
  );
}

const SCENES: { id: SceneId; label: string; defaultPos: { x: number; y: number; w: number } }[] = [
  { id: "store", label: "متجر", defaultPos: { x: 50, y: 30.5, w: 56 } },
  { id: "building", label: "مبنى", defaultPos: { x: 50, y: 76, w: 46 } },
  { id: "warehouse", label: "مستودع", defaultPos: { x: 50, y: 38, w: 56 } },
  { id: "upload", label: "صورتي", defaultPos: { x: 50, y: 40, w: 45 } },
];

export type MockupProps = { open: boolean; onClose: () => void; signCanvas: HTMLCanvasElement | null };

export default function SignMockupPreview({ open, onClose, signCanvas }: MockupProps) {
  const [scene, setScene] = useState<SceneId>("store");
  const [uploadSrc, setUploadSrc] = useState<string>("");
  const [pos, setPos] = useState({ x: 50, y: 30.5 });
  const [widthPct, setWidthPct] = useState(56);
  const areaRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const signSrc = useMemo(() => (signCanvas ? signCanvas.toDataURL("image/png") : ""), [signCanvas]);
  const signAspect = signCanvas && signCanvas.width ? signCanvas.height / signCanvas.width : 0.25;

  // عند تغيير المشهد، ضع اللوحة في موضعها الافتراضي
  useEffect(() => {
    const sc = SCENES.find(x => x.id === scene)!;
    setPos({ x: sc.defaultPos.x, y: sc.defaultPos.y });
    setWidthPct(sc.defaultPos.w);
  }, [scene]);

  const onDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    dragRef.current = { dx: pos.x - px, dy: pos.y - py };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x: Math.max(5, Math.min(95, px + dragRef.current.dx)), y: Math.max(5, Math.min(95, py + dragRef.current.dy)) });
  };
  const onUp = (e: React.PointerEvent) => { dragRef.current = null; try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* */ } };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { setUploadSrc(String(r.result)); setScene("upload"); };
    r.readAsDataURL(f);
    e.target.value = "";
  };

  if (!open) return null;
  const chip = (id: SceneId, label: string) => (
    <button key={id} onClick={() => id === "upload" ? fileRef.current?.click() : setScene(id)}
      style={{ padding: "0.45rem 0.9rem", borderRadius: 999, cursor: "pointer", fontFamily: "Cairo,sans-serif", fontWeight: 800, fontSize: "0.74rem",
        border: `1.5px solid ${scene === id ? GOLD : "rgba(255,255,255,0.14)"}`, background: scene === id ? "rgba(201,162,75,0.14)" : "rgba(255,255,255,0.04)", color: scene === id ? GOLD : "#ccc" }}>
      {id === "upload" ? "⬆ " : ""}{label}
    </button>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", fontFamily: "Cairo,sans-serif" }}>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "min(1040px,96vw)", height: "min(700px,90vh)", background: "#F4EFE6", borderRadius: 16, border: `1px solid ${GOLD}33`, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 30px 80px rgba(0,0,0,0.7)" }}>
        {/* شريط التحكم */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.6rem", padding: "0.7rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ color: "#2C1E15", fontWeight: 800, fontSize: "0.9rem" }}>🏬 معاينة على الواجهة</span>
            <div style={{ display: "flex", gap: "0.4rem" }}>{SCENES.map(sc => chip(sc.id, sc.label))}</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, cursor: "pointer", border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.4)", color: "#fff", fontSize: "1.1rem", lineHeight: 1 }}>✕</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onUpload} />

        {/* منطقة المشهد */}
        <div ref={areaRef} onPointerMove={onMove} onPointerUp={onUp} style={{ position: "relative", flex: 1, overflow: "hidden", background: "#F4EFE6", touchAction: "none" }}>
          {scene === "upload"
            ? (uploadSrc
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={uploadSrc} alt="الواجهة" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#888", fontSize: "0.9rem" }}>ارفع صورة واجهة مبناك من زر «صورتي»</div>)
            : scene === "store" ? <StoreScene /> : scene === "building" ? <BuildingScene /> : <WarehouseScene />}

          {/* اللوحة */}
          {signSrc && (scene !== "upload" || uploadSrc) && (
            <div onPointerDown={onDown}
              style={{ position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%,-50%)", width: `${widthPct}%`, cursor: "grab", filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.45))" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={signSrc} alt="اللوحة" draggable={false} style={{ width: "100%", height: "auto", display: "block", pointerEvents: "none" }} />
            </div>
          )}
        </div>

        {/* شريط الحجم */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.7rem 1.1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <span style={{ color: "#bbb", fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap" }}>حجم اللوحة</span>
          <input type="range" min={12} max={92} value={widthPct} onChange={e => setWidthPct(Number(e.target.value))} style={{ flex: 1, accentColor: GOLD }} />
          <span style={{ color: GOLD, fontSize: "0.78rem", fontWeight: 800, width: 44, textAlign: "center" }}>{widthPct}%</span>
          <span style={{ color: "#777", fontSize: "0.68rem", whiteSpace: "nowrap" }}>اسحب اللوحة لتحريكها · النسبة {Math.round((1 / signAspect) * 100) / 100}:1</span>
        </div>
      </div>
    </div>
  );
}
