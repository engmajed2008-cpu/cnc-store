import Link from "next/link";

export default function CartPage({ params }: { params: { locale: string } }) {
  const ar = params.locale === "ar";
  return (
    <div style={{ fontFamily: "Tajawal, Cairo, sans-serif", minHeight: "100vh", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🛒</div>
        <h1 style={{ color: "#2C1E15", fontSize: "1.5rem", marginBottom: "0.5rem" }}>
          {ar ? "سلة التسوق فارغة" : "Your cart is empty"}
        </h1>
        <p style={{ color: "#8A8A8A", marginBottom: "2rem" }}>
          {ar ? "أضف منتجات لتبدأ التسوق" : "Add products to start shopping"}
        </p>
        <Link href={`/${params.locale}/products/cnc`} style={{
          padding: "0.9rem 2rem", borderRadius: 999, fontWeight: 700,
          background: "linear-gradient(135deg,#C9A24B,#EBCB7C)", color: "#2C1E15",
        }}>
          {ar ? "ابدأ التسوق" : "Start Shopping"}
        </Link>
      </div>
    </div>
  );
}