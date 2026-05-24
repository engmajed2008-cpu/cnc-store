import Link from "next/link";

export default function CartPage({ params }: { params: { locale: string } }) {
  const ar = params.locale === "ar";
  return (
    <div style={{ fontFamily: "Cairo, sans-serif", minHeight: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🛒</div>
        <h1 style={{ color: "#F5F3EE", fontSize: "1.5rem", marginBottom: "0.5rem" }}>
          {ar ? "سلة التسوق فارغة" : "Your cart is empty"}
        </h1>
        <p style={{ color: "#8A8A8A", marginBottom: "2rem" }}>
          {ar ? "أضف منتجات لتبدأ التسوق" : "Add products to start shopping"}
        </p>
        <Link href={`/${params.locale}/products/cnc`} style={{
          padding: "0.9rem 2rem", borderRadius: 999, fontWeight: 700,
          background: "linear-gradient(135deg,#C9A84C,#E8C97A)", color: "#1a1a1a",
        }}>
          {ar ? "ابدأ التسوق" : "Start Shopping"}
        </Link>
      </div>
    </div>
  );
}