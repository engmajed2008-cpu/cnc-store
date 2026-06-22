"use client";
import { useState, useRef } from "react";

const G = "linear-gradient(135deg,#C9A24B,#EBCB7C)";

interface ImageUploaderProps {
  value: string | null;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  hint?: string;
}

export default function ImageUploader({
  value,
  onChange,
  folder = "cnc-store",
  label = "🖼️ صورة المنتج",
  hint,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("يرجى اختيار ملف صورة فقط");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("حجم الصورة يجب أن يكون أقل من 10MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "فشل الرفع");
      onChange(data.url);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الرفع");
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (file: File) => upload(file);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div style={{ marginBottom: "1.1rem" }}>
      <label style={{ display: "block", color: "#C9A24B", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.4rem" }}>
        {label}
      </label>

      {/* Preview */}
      {value && (
        <div style={{ position: "relative", marginBottom: "0.75rem", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(201,162,75,0.2)" }}>
          <img src={value} alt="preview" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
          <button
            onClick={() => onChange("")}
            style={{
              position: "absolute", top: 8, left: 8,
              width: 28, height: 28, borderRadius: "50%",
              background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff", cursor: "pointer", fontSize: "0.75rem",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>
      )}

      {/* Upload Area */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          padding: "1.5rem",
          borderRadius: 10,
          border: `2px dashed ${dragOver ? "#C9A24B" : "rgba(201,162,75,0.2)"}`,
          background: dragOver ? "rgba(201,162,75,0.06)" : "rgba(255,255,255,0.02)",
          textAlign: "center",
          cursor: uploading ? "wait" : "pointer",
          transition: "all 0.2s",
        }}
      >
        {uploading ? (
          <div>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⏳</div>
            <div style={{ color: "#C9A24B", fontSize: "0.85rem", fontWeight: 600 }}>جاري الرفع...</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>☁️</div>
            <div style={{ color: "#C9A24B", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
              {value ? "تغيير الصورة" : "رفع صورة"}
            </div>
            <div style={{ color: "#555", fontSize: "0.75rem" }}>
              اسحب وأفلت أو اضغط للاختيار • PNG, JPG, WEBP • حتى 10MB
            </div>
          </div>
        )}
      </div>

      {/* Hint */}
      {hint && (
        <div style={{ marginTop: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: 8, background: "rgba(201,162,75,0.06)", border: "1px solid rgba(201,162,75,0.12)", color: "#999", fontSize: "0.72rem", lineHeight: 1.7, direction: "rtl" }}>
          💡 {hint}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ marginTop: "0.5rem", color: "#e05555", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
          ⚠️ {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
