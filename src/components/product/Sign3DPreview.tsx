"use client";
import { useEffect, useRef, useState } from "react";

// تحميل Three.js + OrbitControls من jsdelivr (مسموح في الـ CSP) مرة واحدة
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global { interface Window { THREE?: any } }

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-src="${src}"]`);
    if (existing) { if ((existing as HTMLScriptElement).dataset.loaded) resolve(); else existing.addEventListener("load", () => resolve()); existing.addEventListener("error", () => reject(new Error("load"))); return; }
    const s = document.createElement("script");
    s.src = src; s.async = true; s.dataset.src = src;
    s.onload = () => { s.dataset.loaded = "1"; resolve(); };
    s.onerror = () => reject(new Error("تعذّر تحميل " + src));
    document.head.appendChild(s);
  });
}

let threeReady: Promise<void> | null = null;
function ensureThree(): Promise<void> {
  if (!threeReady) {
    threeReady = (async () => {
      await loadScript("https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js");
      await loadScript("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js");
    })().catch(e => { threeReady = null; throw e; });
  }
  return threeReady;
}

export type Sign3DProps = {
  open: boolean;
  onClose: () => void;
  faceCanvas: HTMLCanvasElement | null;   // التصميم بألوان الوجه (خلفية شفافة)
  silCanvas: HTMLCanvasElement | null;    // صورة ظلية بيضاء على أسود (للجوانب وقناع الشفافية)
  areaWcm: number; areaHcm: number;       // أبعاد اللوحة بالسنتيمتر
  hasBg: boolean;                         // هل توجد خلفية (لوحة) أم تركيب جداري؟
  bgColor: string; bgDepthCm: number;
  sideColor: string; letterDepthCm: number;
};

const GOLD = "#C9A24B";

export default function Sign3DPreview({ open, onClose, faceCanvas, silCanvas, areaWcm, areaHcm, hasBg, bgColor, bgDepthCm, sideColor, letterDepthCm }: Sign3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("جارٍ تجهيز العارض ثلاثي الأبعاد…");

  useEffect(() => {
    if (!open || !mountRef.current || !faceCanvas || !silCanvas) return;
    const mount = mountRef.current;
    let disposed = false;
    let animId = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let renderer: any, controls: any, ro: ResizeObserver | null = null;

    ensureThree().then(() => {
      if (disposed) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const THREE: any = window.THREE;
      if (!THREE || !THREE.OrbitControls) { setStatus("تعذّر تحميل مكتبة العرض"); return; }

      const w = mount.clientWidth || 800, h = mount.clientHeight || 500;
      const U = 0.1; // 1 وحدة = 10 سم
      const bw = Math.max(0.1, areaWcm * U), bh = Math.max(0.1, areaHcm * U);
      const depthU = Math.max(0.05, letterDepthCm * U);
      const bgD = Math.max(0.1, (bgDepthCm || 8) * U);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0e0e0e);

      const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 2000);
      const dist = Math.max(bw, bh) * 1.7 + depthU * 4;
      camera.position.set(bw * 0.35, bh * 0.25, dist);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setSize(w, h);
      mount.appendChild(renderer.domElement);

      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true; controls.dampingFactor = 0.08;
      controls.minDistance = Math.max(bw, bh) * 0.6; controls.maxDistance = dist * 2.2;
      controls.target.set(0, 0, 0);

      // إضاءة
      scene.add(new THREE.AmbientLight(0xffffff, 0.75));
      const key = new THREE.DirectionalLight(0xffffff, 0.95); key.position.set(2, 3, 4); scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.4); fill.position.set(-3, -1, 2); scene.add(fill);

      const group = new THREE.Group();
      scene.add(group);

      // لوحة الخلفية
      if (hasBg) {
        const board = new THREE.Mesh(
          new THREE.BoxGeometry(bw, bh, bgD),
          new THREE.MeshStandardMaterial({ color: new THREE.Color(bgColor || "#cccccc"), roughness: 0.85, metalness: 0.05 })
        );
        board.position.z = -bgD / 2;
        group.add(board);
      }

      // قوام التصميم
      const faceTex = new THREE.CanvasTexture(faceCanvas);
      faceTex.anisotropy = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 4;
      faceTex.needsUpdate = true;
      const silTex = new THREE.CanvasTexture(silCanvas);
      silTex.needsUpdate = true;

      // جوانب الحروف: تكديس طبقات ظلية بلون الجوانب من 0 حتى العمق (يُظهر العمق والجوانب عند الدوران)
      const sideColObj = new THREE.Color(sideColor || "#9aa0a6");
      const N = Math.max(8, Math.min(26, Math.round(depthU * 90)));
      for (let i = 0; i < N; i++) {
        const z = depthU * (i / N);
        const m = new THREE.Mesh(
          new THREE.PlaneGeometry(bw, bh),
          new THREE.MeshStandardMaterial({ color: sideColObj, alphaMap: silTex, transparent: true, alphaTest: 0.5, roughness: 0.6, metalness: 0.15, side: THREE.DoubleSide })
        );
        m.position.z = z;
        group.add(m);
      }
      // وجه الحروف (بالألوان) في المقدمة
      const front = new THREE.Mesh(
        new THREE.PlaneGeometry(bw, bh),
        new THREE.MeshStandardMaterial({ map: faceTex, transparent: true, alphaTest: 0.5, roughness: 0.45, metalness: 0.2 })
      );
      front.position.z = depthU + 0.001;
      group.add(front);

      setStatus("");

      const animate = () => {
        if (disposed) return;
        animId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      const resize = () => {
        if (!mount) return;
        const W = mount.clientWidth, H = mount.clientHeight;
        if (W < 2 || H < 2) return;
        camera.aspect = W / H; camera.updateProjectionMatrix();
        renderer.setSize(W, H);
      };
      ro = new ResizeObserver(resize); ro.observe(mount);
    }).catch(() => setStatus("تعذّر تحميل العارض ثلاثي الأبعاد — تحقّق من الاتصال بالإنترنت"));

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      ro?.disconnect();
      try { controls?.dispose?.(); } catch { /* */ }
      try { renderer?.dispose?.(); renderer?.domElement?.remove(); } catch { /* */ }
    };
  }, [open, faceCanvas, silCanvas, areaWcm, areaHcm, hasBg, bgColor, bgDepthCm, sideColor, letterDepthCm]);

  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", fontFamily: "Cairo,sans-serif" }}>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "min(1000px,95vw)", height: "min(640px,85vh)", background: "#F4EFE6", borderRadius: 16, border: `1px solid ${GOLD}33`, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.7)" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 3, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.7rem 1rem", background: "linear-gradient(180deg,rgba(0,0,0,0.55),transparent)" }}>
          <div style={{ color: "#2C1E15", fontWeight: 800, fontSize: "0.95rem" }}>🧊 معاينة ثلاثية الأبعاد — اسحب للدوران، عجلة الفأرة للتقريب</div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, cursor: "pointer", border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.4)", color: "#fff", fontSize: "1.1rem", lineHeight: 1 }}>✕</button>
        </div>
        <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
        {status && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: "0.85rem", pointerEvents: "none" }}>{status}</div>}
      </div>
    </div>
  );
}
