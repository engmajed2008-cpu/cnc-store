"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HeroRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/home-paths");
  }, [router]);
  return (
    <div style={{ padding: "3rem", fontFamily: "Tajawal, Cairo, sans-serif", color: "#C9A24B", fontSize: 14 }}>
      جارٍ التوجيه إلى إدارة المسارات الثلاث...
    </div>
  );
}
