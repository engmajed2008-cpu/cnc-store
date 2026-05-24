import Link from "next/link";

export default function HomePage({ params }: { params: { locale: string } }) {
  const ar = params.locale === "ar";
  const other = ar ? "en" : "ar";

  const categories = [
  {
    key: "cnc",
    ar: "قص CNC", en: "CNC Cutting",
    bg: "#0d1208",
    svg: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="18" stroke="#C9A84C" strokeWidth="1.5" strokeDasharray="5 3"/>
        <circle cx="32" cy="32" r="10" stroke="#E8C97A" strokeWidth="1.5"/>
        <circle cx="32" cy="32" r="4" fill="#C9A84C"/>
        <line x1="14" y1="32" x2="22" y2="32" stroke="#C9A84C" strokeWidth="1.5"/>
        <line x1="42" y1="32" x2="50" y2="32" stroke="#C9A84C" strokeWidth="1.5"/>
        <line x1="32" y1="14" x2="32" y2="22" stroke="#C9A84C" strokeWidth="1.5"/>
        <line x1="32" y1="42" x2="32" y2="50" stroke="#C9A84C" strokeWidth="1.5"/>
        <line x1="14" y1="32" x2="10" y2="32" stroke="#C9A84C" strokeWidth="2"/>
        <line x1="50" y1="32" x2="54" y2="32" stroke="#C9A84C" strokeWidth="2"/>
        <line x1="32" y1="14" x2="32" y2="10" stroke="#C9A84C" strokeWidth="2"/>
        <line x1="32" y1="50" x2="32" y2="54" stroke="#C9A84C" strokeWidth="2"/>
        <rect x="4" y="29" width="6" height="6" rx="1" fill="#C9A84C" opacity="0.8"/>
        <rect x="54" y="29" width="6" height="6" rx="1" fill="#C9A84C" opacity="0.8"/>
        <rect x="29" y="4" width="6" height="6" rx="1" fill="#C9A84C" opacity="0.8"/>
        <rect x="29" y="54" width="6" height="6" rx="1" fill="#C9A84C" opacity="0.8"/>
      </svg>
    ),
  },
  {
    key: "decor",
    ar: "ديكور فني", en: "Artistic Decor",
    bg: "#080d12",
    svg: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="32,8 45,22 45,42 32,56 19,42 19,22" stroke="#C9A84C" strokeWidth="1.5" fill="none"/>
        <polygon points="32,16 40,26 40,38 32,48 24,38 24,26" stroke="#E8C97A" strokeWidth="1" fill="none" opacity="0.6"/>
        <circle cx="32" cy="32" r="6" fill="none" stroke="#C9A84C" strokeWidth="1.5"/>
        <circle cx="32" cy="32" r="2.5" fill="#C9A84C"/>
        <line x1="32" y1="8" x2="32" y2="16" stroke="#C9A84C" strokeWidth="1" opacity="0.5"/>
        <line x1="32" y1="48" x2="32" y2="56" stroke="#C9A84C" strokeWidth="1" opacity="0.5"/>
        <line x1="19" y1="22" x2="24" y2="26" stroke="#C9A84C" strokeWidth="1" opacity="0.5"/>
        <line x1="45" y1="22" x2="40" y2="26" stroke="#C9A84C" strokeWidth="1" opacity="0.5"/>
        <line x1="19" y1="42" x2="24" y2="38" stroke="#C9A84C" strokeWidth="1" opacity="0.5"/>
        <line x1="45" y1="42" x2="40" y2="38" stroke="#C9A84C" strokeWidth="1" opacity="0.5"/>
      </svg>
    ),
  },
  {
    key: "signs",
    ar: "اللوحات", en: "Signage",
    bg: "#12100a",
    svg: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="14" width="48" height="28" rx="4" stroke="#C9A84C" strokeWidth="1.5"/>
        <rect x="13" y="19" width="38" height="18" rx="2" stroke="#E8C97A" strokeWidth="1" opacity="0.6"/>
        <line x1="18" y1="26" x2="30" y2="26" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"/>
        <line x1="18" y1="31" x2="46" y2="31" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
        <circle cx="39" cy="26" r="3" fill="#C9A84C" opacity="0.8"/>
        <line x1="32" y1="42" x2="32" y2="52" stroke="#C9A84C" strokeWidth="1.5"/>
        <line x1="24" y1="52" x2="40" y2="52" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="32" cy="52" r="2" fill="#C9A84C" opacity="0.6"/>
      </svg>
    ),
  },
  {
    key: "ads",
    ar: "الدعاية", en: "Advertising",
    bg: "#120810",
    svg: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 38 L10 26 L38 18 L38 46 Z" stroke="#C9A84C" strokeWidth="1.5" fill="rgba(201,168,76,0.1)"/>
        <rect x="38" y="24" width="8" height="16" rx="2" stroke="#E8C97A" strokeWidth="1.5" fill="none"/>
        <line x1="10" y1="34" x2="6" y2="38" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="10" y1="38" x2="6" y2="42" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="6" y1="38" x2="6" y2="50" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"/>
        <path d="M46 28 Q52 32 46 36" stroke="#C9A84C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M48 24 Q58 32 48 40" stroke="#C9A84C" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
  },
  {
    key: "design",
    ar: "التصميم", en: "Design",
    bg: "#0d0d14",
    svg: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 48 L24 20 L32 36 L40 28 L52 48 Z" stroke="#C9A84C" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
        <circle cx="32" cy="16" r="5" stroke="#E8C97A" strokeWidth="1.5" fill="none"/>
        <circle cx="32" cy="16" r="2" fill="#C9A84C"/>
        <line x1="12" y1="48" x2="52" y2="48" stroke="#C9A84C" strokeWidth="1" opacity="0.4"/>
        <rect x="44" y="36" width="8" height="8" rx="2" fill="#C9A84C" opacity="0.7"/>
        <rect x="48" y="28" width="8" height="8" rx="2" fill="#E8C97A" opacity="0.5"/>
        <rect x="46" y="32" width="8" height="8" rx="2" fill="#9A7A30" opacity="0.5"/>
      </svg>
    ),
  },
];

  const stats = [
    { val: "+500", ar: "مشروع منجز", en: "Projects Done" },
    { val: "+200", ar: "عميل راضٍ", en: "Happy Clients" },
    { val: "8", ar: "سنوات خبرة", en: "Years Exp." },
    { val: "+15", ar: "نوع مادة", en: "Materials" },
  ];

  const G = "linear-gradient(135deg,#C9A84C,#E8C97A)";
  const GT = { background: G, WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent" };

  return (
    <div style={{ fontFamily: "Cairo, sans-serif" }}>

      {/* ══ NAVBAR ══ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(17,17,17,0.93)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(201,168,76,0.15)",
        padding: "0.85rem 2.5rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexDirection: ar ? "row-reverse" : "row",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexDirection: ar ? "row-reverse" : "row" }}>
          <div style={{ position: "relative", width: 36, height: 36, flexShrink: 0 }}>
            <div style={{ position: "absolute", inset: 0, background: G, borderRadius: 8, transform: "rotate(45deg)" }} />
            <div style={{ position: "absolute", inset: 5, background: "#111", borderRadius: 4, transform: "rotate(45deg)" }} />
            <div style={{ position: "absolute", inset: 10, background: G, borderRadius: 2, transform: "rotate(45deg)" }} />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: "1.05rem", ...GT }}>{ar ? "ميتال آرت" : "Metal Art"}</div>
            <div style={{ fontSize: "0.58rem", color: "#555", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>Pro CNC Cutting</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.25rem", flexDirection: ar ? "row-reverse" : "row" }}>
          {[
            { ar: "الرئيسية", en: "Home", href: `/${params.locale}` },
            { ar: "قص CNC", en: "CNC", href: `/${params.locale}/products/cnc` },
            { ar: "أعمالنا", en: "Portfolio", href: `/${params.locale}` },
            { ar: "تواصل", en: "Contact", href: `/${params.locale}` },
          ].map((l) => (
            <Link key={l.en} href={l.href} style={{ padding: "0.45rem 1rem", borderRadius: 8, fontSize: "0.875rem", color: "#8A8A8A" }}>
              {ar ? l.ar : l.en}
            </Link>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.65rem", alignItems: "center", flexDirection: ar ? "row-reverse" : "row" }}>
          <Link href={`/${other}`} style={{
            padding: "0.4rem 1rem", borderRadius: 999,
            border: "1.5px solid rgba(201,168,76,0.3)",
            background: "rgba(201,168,76,0.07)", color: "#E8C97A",
            fontSize: "0.8rem", fontWeight: 600,
          }}>{ar ? "🇬🇧 EN" : "🇸🇦 AR"}</Link>
          <Link href={`/${params.locale}/cart`} style={{
            width: 38, height: 38, borderRadius: "50%",
            border: "1.5px solid rgba(201,168,76,0.2)",
            background: "rgba(201,168,76,0.05)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
          }}>🛒</Link>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", textAlign: "center",
        padding: "2rem", paddingTop: "7rem",
        position: "relative", overflow: "hidden",
        background: "linear-gradient(160deg,#0a0a0a 0%,#1a1608 45%,#0d0d0d 100%)",
      }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(201,168,76,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.04) 1px,transparent 1px)",
          backgroundSize: "65px 65px",
        }} />
        <div style={{
          position: "absolute", top: -100, right: -100, width: 600, height: 600,
          borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(circle,rgba(201,168,76,0.1) 0%,transparent 70%)",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 720 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.4rem 1.2rem", borderRadius: 999, marginBottom: "2rem",
            border: "1px solid rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.08)",
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#C9A84C", display: "inline-block" }} />
            <span style={{ color: "#C9A84C", fontSize: "0.82rem" }}>{ar ? "تقنية CNC المتقدمة" : "Advanced CNC Technology"}</span>
          </div>

          <h1 style={{ fontSize: "clamp(2.4rem,6vw,4.6rem)", fontWeight: 900, lineHeight: 1.08, marginBottom: "1.25rem" }}>
            <span style={{ color: "#F5F3EE", display: "block" }}>{ar ? "نحوّل أفكارك إلى" : "We Transform Your Ideas Into"}</span>
            <span style={{ display: "block", marginTop: "0.15rem", background: "linear-gradient(120deg,#9A7A30,#E8C97A,#C9A84C,#E8C97A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {ar ? "تحف فنية معدنية" : "Metallic Masterpieces"}
            </span>
          </h1>

          <p style={{ color: "#8A8A8A", fontSize: "1.05rem", lineHeight: 1.85, maxWidth: 560, margin: "0 auto 2.5rem" }}>
            {ar ? "دعاية وإعلان احترافية، ديكورات مذهلة، وقص CNC بدقة استثنائية. نجمع الإبداع بالتكنولوجيا لنصنع ما لا يُنسى." : "Professional advertising, stunning decor, and exceptional CNC precision. Creativity meets technology."}
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "4rem" }}>
            <Link href={`/${params.locale}/products/cnc`} style={{
              padding: "0.95rem 2.5rem", borderRadius: 999, fontWeight: 700, fontSize: "0.95rem",
              background: G, color: "#1a1a1a",
              boxShadow: "0 8px 30px rgba(201,168,76,0.3)",
            }}>{ar ? "اطلب الآن ←" : "→ Order Now"}</Link>
            <a href="https://wa.me/966500000000" target="_blank" rel="noopener noreferrer" style={{
              padding: "0.95rem 2rem", borderRadius: 999, fontSize: "0.95rem", fontWeight: 600,
              border: "1.5px solid rgba(201,168,76,0.35)", color: "#E8C97A",
            }}>{ar ? "💬 واتساب" : "💬 WhatsApp"}</a>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.5rem", paddingTop: "2.5rem", borderTop: "1px solid rgba(201,168,76,0.12)" }}>
            {stats.map((s) => (
              <div key={s.val}>
                <div style={{ fontSize: "clamp(1.7rem,3vw,2.3rem)", fontWeight: 900, ...GT }}>{s.val}</div>
                <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.2rem" }}>{ar ? s.ar : s.en}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CATEGORIES ══ */}
      <section style={{ padding: "6rem 2.5rem", background: "rgba(25,25,25,0.5)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: ar ? "right" : "left", marginBottom: "3.5rem" }}>
            <div style={{ color: "#C9A84C", fontSize: "0.72rem", letterSpacing: "0.22em", textTransform: "uppercase" as const, marginBottom: "0.75rem" }}>
              {ar ? "أقسامنا" : "Our Categories"}
            </div>
            <h2 style={{ fontSize: "clamp(1.9rem,4vw,3rem)", fontWeight: 800, color: "#F5F3EE", lineHeight: 1.15 }}>
              {ar ? "كل ما تحتاجه " : "Everything You Need "}
              <span style={{ ...GT }}>{ar ? "تحت سقف واحد" : "Under One Roof"}</span>
            </h2>
            <div style={{ width: 56, height: 2, background: G, borderRadius: 2, marginTop: "1.5rem" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "1rem" }}>
            {categories.map((cat) => (
              <Link key={cat.key} href={`/${params.locale}/products/cnc`} style={{
                display: "block", padding: "2rem 1.5rem", borderRadius: 20,
                border: "1px solid rgba(201,168,76,0.12)",
                background: cat.bg, textAlign: "center",
              }}>
                <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>{cat.svg}</div>
                <div style={{ fontWeight: 700, color: "#F5F3EE", fontSize: "1rem" }}>{ar ? cat.ar : cat.en}</div>
                <div style={{ marginTop: "0.75rem", color: "#C9A84C", fontSize: "0.78rem" }}>{ar ? "اكتشف ←" : "→ Explore"}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section style={{
        padding: "6rem 2rem", textAlign: "center",
        background: "linear-gradient(135deg,rgba(201,168,76,0.06) 0%,transparent 50%,rgba(201,168,76,0.04) 100%)",
        borderTop: "1px solid rgba(201,168,76,0.1)",
      }}>
        <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, color: "#F5F3EE", marginBottom: "1rem" }}>
          {ar ? "جاهز لتحويل فكرتك إلى واقع؟" : "Ready to Transform Your Idea?"}
        </h2>
        <p style={{ color: "#8A8A8A", marginBottom: "2.5rem" }}>
          {ar ? "تواصل معنا واحصل على استشارة مجانية وعرض سعر فوري" : "Contact us for a free consultation and instant price quote"}
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href={`/${params.locale}/products/cnc`} style={{
            padding: "1rem 2.5rem", borderRadius: 999, fontWeight: 700,
            background: G, color: "#1a1a1a", fontSize: "1rem",
          }}>{ar ? "احصل على عرض سعر" : "Get a Quote"}</Link>
          <a href="https://wa.me/966500000000" style={{
            padding: "1rem 2rem", borderRadius: 999,
            border: "1.5px solid rgba(201,168,76,0.4)", color: "#E8C97A", fontSize: "1rem",
          }}>{ar ? "💬 واتساب" : "💬 WhatsApp"}</a>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ padding: "2rem", textAlign: "center", borderTop: "1px solid rgba(201,168,76,0.1)", color: "#555", fontSize: "0.85rem" }}>
        © 2025 {ar ? "ميتال آرت — جميع الحقوق محفوظة" : "Metal Art — All rights reserved"}
      </footer>

    </div>
  );
}