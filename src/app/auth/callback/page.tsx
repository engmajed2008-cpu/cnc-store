"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    // الوجهة: من الـ query، وإلا من localStorage (تُخزَّن قبل بدء OAuth)، وإلا الرئيسية
    let next = searchParams.get("next");
    if (!next || !next.startsWith("/")) {
      try { next = localStorage.getItem("post_login_redirect"); } catch {}
    }
    if (!next || !next.startsWith("/")) next = "/ar";
    try { localStorage.removeItem("post_login_redirect"); } catch {}
    const target = next;

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error || !data.session) {
          router.replace("/ar/login?error=oauth");
          return;
        }
        // Wait a tick so Supabase persists session to localStorage before redirect
        setTimeout(() => {
          router.replace(target);
        }, 300);
      });
    } else {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setTimeout(() => router.replace(target), 300);
        } else {
          router.replace("/ar/login?error=oauth");
        }
      });
    }
  }, [router, searchParams]);

  return (
    <div style={{
      minHeight: "100vh", background: "transparent",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: "1rem", fontFamily: "Tajawal, Cairo, sans-serif",
    }}>
      <div style={{
        width: 44, height: 44,
        border: "3px solid rgba(201,162,75,0.2)",
        borderTopColor: "#C9A24B",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ color: "#888", fontSize: "0.9rem" }}>جاري تسجيل الدخول...</p>
      <style dangerouslySetInnerHTML={{ __html: "@keyframes spin{to{transform:rotate(360deg)}}" }} />
    </div>
  );
}
