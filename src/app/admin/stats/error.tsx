"use client";
import { useEffect } from "react";

export default function StatsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin/stats] runtime error:", error);
  }, [error]);

  return (
    <div style={{ padding: "3rem", fontFamily: "Tajawal, Cairo, sans-serif", direction: "rtl", minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem" }}>
      <div style={{ fontSize: "3rem" }}>⚠️</div>
      <h2 style={{ color: "#C9A24B", fontSize: "1.4rem", fontWeight: 900, margin: 0 }}>حدث خطأ في صفحة الإحصائيات</h2>
      <pre style={{ color: "#ef4444", fontSize: "0.75rem", background: "rgba(220,50,50,0.08)", padding: "1rem", borderRadius: 8, maxWidth: 600, overflowX: "auto", direction: "ltr", textAlign: "left" }}>
        {error.message}
      </pre>
      <button
        onClick={reset}
        style={{ padding: "0.75rem 2rem", borderRadius: 999, background: "linear-gradient(135deg,#C9A24B,#EBCB7C)", color: "#2C1E15", fontWeight: 800, border: "none", cursor: "pointer", fontSize: "0.9rem" }}
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
