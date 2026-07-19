"use client";
/**
 * OAuth callback page — handles Supabase implicit + PKCE flows.
 *
 * Supabase redirects to /auth/callback after Google OAuth.
 * Middleware adds locale → /ar/auth/callback.
 * The access_token arrives in the URL fragment (#access_token=...).
 * Supabase JS client detects it automatically; we just wait and redirect.
 */
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const locale = useLocale();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    const destination = next && next.startsWith("/") ? next : `/${locale}`;

    // Supabase client auto-detects #access_token in the fragment and creates a session.
    // Wait up to 5s for the session to be established.
    let attempts = 0;
    const maxAttempts = 20;

    const poll = setInterval(async () => {
      attempts++;
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        clearInterval(poll);
        setStatus("success");
        window.location.replace(destination);
        return;
      }

      // Also check if Supabase exchanged a PKCE code (server-side cookie flow)
      const code = params.get("code");
      if (code && attempts === 1) {
        // Try server-side exchange via /api/auth/callback
        const apiUrl = `/api/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(destination)}`;
        window.location.replace(apiUrl);
        clearInterval(poll);
        return;
      }

      if (attempts >= maxAttempts) {
        clearInterval(poll);
        // Session might still be set client-side — try redirecting anyway
        setStatus("success");
        window.location.replace(destination);
      }
    }, 250);

    return () => clearInterval(poll);
  }, [locale]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#FDFBF7", fontFamily: "Tajawal, Cairo, sans-serif", gap: 16,
    }}>
      {status === "error" ? (
        <>
          <div style={{ fontSize: "2rem" }}>⚠️</div>
          <p style={{ color: "#634E40", fontSize: "0.95rem" }}>
            حدث خطأ أثناء تسجيل الدخول. سيتم إعادة التوجيه…
          </p>
        </>
      ) : (
        <>
          <div style={{
            width: 44, height: 44,
            border: "3px solid rgba(201,162,75,0.25)",
            borderTopColor: "#C9A24B",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          <p style={{ color: "#634E40", fontSize: "0.95rem" }}>
            جارٍ إتمام تسجيل الدخول…
          </p>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
