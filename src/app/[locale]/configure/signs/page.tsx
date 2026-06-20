"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { clsx } from "clsx";
import { ArrowUpRight } from "lucide-react";
import { siteStore, DEFAULT_SIGN_IMAGES, DEFAULT_STORE_SUBCATEGORIES, type SignImages, type StoreSubcategory } from "@/store/siteStore";
type Locale = "ar" | "en";

// ─── Subcategory Data ──────────────────────────────────────────────────────────
const subcategories = [
  {
    id: "outdoor",
    order: 1,
    icon: "🏢",
    badge: "OUTDOOR",
    gridClass: "md:col-span-2 md:row-span-1",
    nameAr: "اللوحات الخارجية والواجهات",
    nameEn: "Outdoor & Facade Signs",
    descAr: "واجهتك هي انطباعك الأول. لوحات واجهات وحروف بارزة مخصصة بأحدث تقنيات الإضاءة لتجعل مشروعك بارزاً في السوق.",
    descEn: "Your facade is your first impression. Custom signs and raised letters with the latest lighting technologies to make your business stand out.",
    targetAr: "المحلات · المطاعم · المقاهي · المباني التجارية",
    targetEn: "Shops · Restaurants · Cafes · Commercial Buildings",
    productsAr: ["لوحات الكلادينج", "حروف بارزة LED", "حروف خلفية Backlit", "لوحات فليكس مضاءة"],
    productsEn: ["Cladding Signs", "LED Raised Letters", "Backlit Letters", "Illuminated Flex Signs"],
    bg: "linear-gradient(135deg,#0a1218 0%,#0d1a24 60%,#0a0d10 100%)",
    accentColor: "#4A9EE8",
    svg: `
      <defs>
        <pattern id="out-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M0 0h40v40H0z" fill="none" stroke="#4A9EE8" stroke-width=".25" opacity=".15"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#out-grid)"/>
      <rect x="5%" y="20%" width="90%" height="60%" rx="8" fill="none" stroke="#4A9EE8" stroke-width="1.2" stroke-dasharray="8 4" opacity=".35"/>
      <rect x="8%" y="23%" width="84%" height="54%" rx="6" fill="rgba(74,158,232,.04)" stroke="#4A9EE8" stroke-width=".6" opacity=".25"/>
      <line x1="50%" y1="20%" x2="50%" y2="15%" stroke="#4A9EE8" stroke-width="1.5" opacity=".4"/>
      <line x1="50%" y1="80%" x2="50%" y2="85%" stroke="#4A9EE8" stroke-width="1.5" opacity=".4"/>
      <circle cx="50%" cy="50%" r="3%" fill="#4A9EE8" opacity=".25"/>
      <circle cx="50%" cy="50%" r="1.5%" fill="#4A9EE8" opacity=".5"/>
      <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="8%" fill="#4A9EE8" opacity=".3">FACADE</text>
    `,
  },
  {
    id: "metal",
    order: 2,
    icon: "⚙️",
    badge: "METAL · CNC",
    nameAr: "اللوحات المعدنية والقص بالليزر",
    nameEn: "Metal & Laser-Cut Signs",
    descAr: "الفخامة والأصالة في قطعة واحدة. لوحات معدنية من الستانلس ستيل والحديد المقصوص بالليزر بدقة متناهية وجودة تدوم للأبد.",
    descEn: "Luxury and authenticity in one piece. Stainless steel and laser-cut iron signs with supreme precision and lasting quality.",
    targetAr: "الشركات الفاخرة · ديكورات المنازل الراقية · الهدايا الفاخرة",
    targetEn: "Luxury Brands · High-End Homes · Premium Gifts",
    productsAr: ["ستانلس ستيل ذهبي/فضي", "حديد مقصوص CNC", "لوحات تذكارية فاخرة", "لوحات عناوين معدنية"],
    productsEn: ["Gold/Silver Stainless Steel", "CNC-Cut Iron", "Luxury Memorial Plaques", "Metal Address Signs"],
    bg: "linear-gradient(135deg,#FDFBF7 0%,#F4EFE6 60%,#FDFBF7 100%)",
    gridClass: "md:col-span-1 md:row-span-2",
    accentColor: "#C9A24B",
    svg: `
      <defs>
        <pattern id="metal-dots" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="15" cy="15" r="1.2" fill="#C9A24B" opacity=".12"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#metal-dots)"/>
      <circle cx="50%" cy="45%" r="32%" fill="none" stroke="#C9A24B" stroke-width="1.2" stroke-dasharray="6 4" opacity=".4"/>
      <circle cx="50%" cy="45%" r="22%" fill="rgba(201,162,75,.05)" stroke="#EBCB7C" stroke-width=".8" opacity=".35"/>
      <circle cx="50%" cy="45%" r="10%" fill="rgba(201,162,75,.1)" stroke="#C9A24B" stroke-width="1.5" opacity=".6"/>
      <circle cx="50%" cy="45%" r="3%" fill="#C9A24B" opacity=".7"/>
      <line x1="18%" y1="45%" x2="40%" y2="45%" stroke="#C9A24B" stroke-width=".8" opacity=".35"/>
      <line x1="60%" y1="45%" x2="82%" y2="45%" stroke="#C9A24B" stroke-width=".8" opacity=".35"/>
      <line x1="50%" y1="13%" x2="50%" y2="35%" stroke="#C9A24B" stroke-width=".8" opacity=".35"/>
      <line x1="50%" y1="55%" x2="50%" y2="77%" stroke="#C9A24B" stroke-width=".8" opacity=".35"/>
      <text x="50%" y="82%" text-anchor="middle" font-family="monospace" font-size="7%" fill="#C9A24B" opacity=".35">CNC · METAL</text>
    `,
  },
  {
    id: "neon",
    order: 3,
    icon: "✨",
    badge: "NEON · LED",
    nameAr: "لوحات النيون المضيئة",
    nameEn: "Neon LED Signs",
    descAr: "أضف لمسة حيوية وعصرية لمساحتك. لوحات نيون مرنة (LED) بتصاميم وعبارات مخصصة تجذب الأنظار وتصنع أجواءً فريدة.",
    descEn: "Add vibrant modern flair to your space. Flexible LED neon signs with custom designs and phrases that create a unique atmosphere.",
    targetAr: "المقاهي · المطاعم الشبابية · الصالونات · غرف الجيمنج",
    targetEn: "Cafes · Trendy Restaurants · Salons · Gaming Rooms",
    productsAr: ["نيون LED مخصص", "لوحات نيون جاهزة", "عبارات نيون جدارية", "إطارات نيون ديكورية"],
    productsEn: ["Custom LED Neon", "Ready-made Neon Signs", "Wall Neon Phrases", "Decorative Neon Frames"],
    bg: "linear-gradient(135deg,#120820 0%,#1a0a2e 60%,#FDFBF7 100%)",
    gridClass: "md:col-span-1 md:row-span-1",
    accentColor: "#E040FB",
    svg: `
      <defs>
        <filter id="neon-glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="30%" cy="40%" r="18%" fill="none" stroke="#E040FB" stroke-width="1.5" opacity=".35" filter="url(#neon-glow)"/>
      <circle cx="70%" cy="60%" r="14%" fill="none" stroke="#FF4081" stroke-width="1.2" opacity=".3" filter="url(#neon-glow)"/>
      <path d="M20%,50% Q50%,20% 80%,50% Q50%,80% 20%,50%" fill="none" stroke="#E040FB" stroke-width="1.5" opacity=".4" filter="url(#neon-glow)"/>
      <circle cx="50%" cy="50%" r="4%" fill="#E040FB" opacity=".4" filter="url(#neon-glow)"/>
      <circle cx="50%" cy="50%" r="2%" fill="#ff80ff" opacity=".7"/>
      <text x="50%" y="78%" text-anchor="middle" font-family="monospace" font-size="8%" fill="#E040FB" opacity=".4">NEON</text>
    `,
  },
  {
    id: "indoor",
    order: 4,
    icon: "🏛️",
    badge: "INDOOR",
    nameAr: "اللوحات الداخلية والمكتبية",
    nameEn: "Indoor & Office Signs",
    descAr: "عزز الاحترافية داخل مقر عملك. لوحات استقبال، لوحات مكاتب، وأنظمة إرشادية أنيقة تعكس هوية شركتك بدقة.",
    descEn: "Elevate professionalism in your workplace. Reception signs, office plaques, and elegant wayfinding systems that reflect your brand identity.",
    targetAr: "الشركات · المكاتب · العيادات · المراكز التجارية",
    targetEn: "Companies · Offices · Clinics · Commercial Centers",
    productsAr: ["لوحات الاستقبال أكريليك", "لوحات مكاتب المدراء", "أنظمة إرشادية Wayfinding", "لوحات تعريفية"],
    productsEn: ["Acrylic Reception Signs", "Executive Office Plaques", "Wayfinding Systems", "Identification Signs"],
    bg: "linear-gradient(135deg,#0a1a12 0%,#0d2018 60%,#FDFBF7 100%)",
    gridClass: "md:col-span-1 md:row-span-1",
    accentColor: "#4CAF50",
    svg: `
      <defs>
        <pattern id="ind-grid" width="25" height="25" patternUnits="userSpaceOnUse">
          <circle cx="12.5" cy="12.5" r="1" fill="#4CAF50" opacity=".1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ind-grid)"/>
      <rect x="15%" y="25%" width="70%" height="50%" rx="6" fill="rgba(76,175,80,.06)" stroke="#4CAF50" stroke-width="1" stroke-dasharray="6 3" opacity=".4"/>
      <rect x="20%" y="30%" width="60%" height="40%" rx="4" fill="none" stroke="#4CAF50" stroke-width=".6" opacity=".25"/>
      <line x1="50%" y1="25%" x2="50%" y2="18%" stroke="#4CAF50" stroke-width="1.2" opacity=".4"/>
      <line x1="15%" y1="50%" x2="8%" y2="50%" stroke="#4CAF50" stroke-width="1.2" opacity=".4"/>
      <line x1="85%" y1="50%" x2="92%" y2="50%" stroke="#4CAF50" stroke-width="1.2" opacity=".4"/>
      <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="7%" fill="#4CAF50" opacity=".35">OFFICE</text>
    `,
  },
  {
    id: "decor",
    order: 5,
    icon: "🎨",
    badge: "DECOR · ART",
    nameAr: "لوحات الديكور والجداريات",
    nameEn: "Decorative & Wall Art",
    descAr: "اكتمل جمال جدرانك بلمسة فنية. لوحات جدارية وديكورية متنوعة تناسب ذوقك وتضفي الحيوية على مكاتبكم ومنازلكم.",
    descEn: "Complete your walls with an artistic touch. Diverse decorative wall art to match your taste and bring life to your offices and homes.",
    targetAr: "الأفراد · مصممو الديكور · الفنادق · المطاعم الراقية",
    targetEn: "Individuals · Interior Designers · Hotels · Fine Dining",
    productsAr: ["لوحات كانفاس مطبوعة", "لوحات أكريليك مطبوعة", "لوحات خشبية مودرن", "جداريات معدنية فنية"],
    productsEn: ["Printed Canvas Boards", "Printed Acrylic Boards", "Modern Wood Panels", "Artistic Metal Murals"],
    bg: "linear-gradient(135deg,#120a1a 0%,#1e0f2a 60%,#FDFBF7 100%)",
    gridClass: "md:col-span-3 md:row-span-1",
    accentColor: "#FF9800",
    svg: `
      <defs>
        <pattern id="dec-dots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="9" cy="9" r="1" fill="#FF9800" opacity=".1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dec-dots)"/>
      <rect x="5%" y="15%" width="28%" height="70%" rx="4" fill="rgba(255,152,0,.06)" stroke="#FF9800" stroke-width=".8" opacity=".4"/>
      <rect x="36%" y="15%" width="28%" height="70%" rx="4" fill="rgba(255,152,0,.04)" stroke="#FF9800" stroke-width=".8" opacity=".3"/>
      <rect x="67%" y="15%" width="28%" height="70%" rx="4" fill="rgba(255,152,0,.06)" stroke="#FF9800" stroke-width=".8" opacity=".4"/>
      <circle cx="19%" cy="50%" r="8%" fill="rgba(255,152,0,.08)" stroke="#FF9800" stroke-width=".8" opacity=".4"/>
      <circle cx="50%" cy="50%" r="6%" fill="rgba(255,152,0,.06)" stroke="#FF9800" stroke-width=".8" opacity=".3"/>
      <circle cx="81%" cy="50%" r="8%" fill="rgba(255,152,0,.08)" stroke="#FF9800" stroke-width=".8" opacity=".4"/>
      <text x="50%" y="90%" text-anchor="middle" font-family="monospace" font-size="6%" fill="#FF9800" opacity=".3">WALL · ART · DECOR</text>
    `,
  },
];

// ─── Sub-product card ─────────────────────────────────────────────────────────
function SubCatCard({ cat, ar, locale, index, image, overrideName, overrideDesc }: {
  cat: typeof subcategories[0]; ar: boolean; locale: string; index: number;
  image?: string | null; overrideName?: string; overrideDesc?: string;
}) {
  const name   = overrideName ?? (ar ? cat.nameAr : cat.nameEn);
  const desc   = overrideDesc ?? (ar ? cat.descAr : cat.descEn);
  const target = ar ? cat.targetAr : cat.targetEn;
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/${locale}/configure/signs/${cat.id}`)}
      className={clsx(
        "group relative rounded-2xl overflow-hidden",
        "border transition-all duration-500",
        "hover:-translate-y-1 hover:scale-[1.005]",
      )}
      style={{
        height: "300px",
        cursor: "pointer",
        borderColor: cat.accentColor + "55",
        boxShadow: `0 20px 50px ${cat.accentColor}22`,
      }}
    >
      {/* BG */}
      <div className="absolute inset-0" style={{ background: cat.bg }} />

      {/* Image (if available) or SVG pattern */}
      {image ? (
        <img src={image} alt={name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          style={{ opacity: 0.75 }}
        />
      ) : (
        <svg className="absolute inset-0 w-full h-full opacity-90 transition-transform duration-700 group-hover:scale-[1.03]"
          viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          dangerouslySetInnerHTML={{ __html: cat.svg }} />
      )}

      {/* Overlay — تدرّج داكن قوي يضمن وضوح العنوان على أي خلفية كرت (فاتحة أو داكنة) */}
      <div className="absolute inset-0 transition-all duration-500" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.80) 26%, rgba(0,0,0,0.40) 50%, rgba(0,0,0,0.08) 80%)" }} />

      {/* Shimmer */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${cat.accentColor}12, transparent)` }} />

      {/* Content */}
      <div className={clsx("absolute inset-0 p-5 flex flex-col justify-between z-10", ar ? "items-end text-right" : "items-start text-left")}>
        {/* Top — arrow only */}
        <div className={clsx("flex items-start w-full", ar ? "justify-start" : "justify-end")}>
          <Link href={`/${locale}/configure/signs/${cat.id}`} onClick={e => e.stopPropagation()} style={{
            width: 32, height: 32, borderRadius: "50%",
            background: cat.accentColor + "15",
            border: `1.5px solid ${cat.accentColor}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: cat.accentColor, textDecoration: "none",
            opacity: 0, transform: "scale(0.75)",
            transition: "all 0.3s 0.1s",
          }} className="group-hover:!opacity-100 group-hover:!scale-100">
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Bottom */}
        <div className="space-y-2 w-full">
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "0.25rem 0.8rem", borderRadius: 999,
            background: cat.accentColor + "15",
            border: `1px solid ${cat.accentColor}30`,
            color: cat.accentColor, fontSize: "0.6rem",
            fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.1em",
            opacity: 0, transform: "translateY(8px)",
            transition: "all 0.35s",
          }} className="group-hover:!opacity-100 group-hover:!translate-y-0">
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: cat.accentColor }} />
            {cat.badge}
          </div>

          <h3 style={{ color: "#F7ECD8", fontWeight: 800, lineHeight: 1.2, fontSize: "clamp(0.95rem,1.8vw,1.1rem)", margin: 0, textShadow: "0 2px 10px rgba(0,0,0,0.75)" }}>
            {name}
          </h3>

          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.8rem", lineHeight: 1.6, margin: 0, textShadow: "0 1px 6px rgba(0,0,0,0.6)",
            overflow: "hidden", maxHeight: 0, opacity: 0, transition: "all 0.4s",
          }} className="group-hover:!max-h-20 group-hover:!opacity-100">
            {desc}
          </p>

          {/* Target audience */}
          <div style={{
            fontSize: "0.7rem", color: cat.accentColor + "bb",
            overflow: "hidden", maxHeight: 0, opacity: 0, transition: "all 0.4s 0.05s",
          }} className="group-hover:!max-h-10 group-hover:!opacity-100">
            🎯 {target}
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SignsPage() {
  const locale = useLocale() as Locale;
  const ar = locale === "ar";
  const router = useRouter();
  const [images, setImages] = useState<SignImages>(DEFAULT_SIGN_IMAGES);
  const [dynamicSubs, setDynamicSubs] = useState<StoreSubcategory[]>([]);

  useEffect(() => {
    const signImgs = siteStore.getSignImages();

    // Load all sign subcategories from store
    const subcats: StoreSubcategory[] = siteStore.getStoreSubcategories()
      .filter(s => s.mainKey === "signs");

    // Merge images: prefer storeSubcategory image, fallback to signImages for known keys
    const withImages = subcats.map(s => ({
      ...s,
      image: s.image ?? (signImgs[s.key as keyof SignImages] ?? null),
    }));

    setDynamicSubs(withImages);

    // Also update legacy images map for compatibility
    const mapped: SignImages = { ...DEFAULT_SIGN_IMAGES };
    (["outdoor", "metal", "neon", "indoor", "decor"] as (keyof SignImages)[]).forEach(key => {
      const sub = withImages.find(s => s.key === key);
      mapped[key] = sub?.image ?? null;
    });
    setImages(mapped);
  }, []);

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: "#FDFBF7", fontFamily: "Tajawal, Cairo, sans-serif" }}>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section style={{ position: "relative", padding: "1.5rem 0 1.5rem", overflow: "hidden" }}>
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(201,162,75,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(201,162,75,0.03) 1px,transparent 1px)",
            backgroundSize: "50px 50px",
          }} />
          <div style={{
            position: "absolute", top: -80, [ar ? "right" : "left"]: -80,
            width: 400, height: 400, borderRadius: "50%",
            background: "radial-gradient(circle,rgba(201,162,75,0.07) 0%,transparent 70%)",
            pointerEvents: "none",
          }} />

          <div className="section-container" dir={ar ? "rtl" : "ltr"} style={{ position: "relative", zIndex: 1 }}>
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "#666", marginBottom: "1.5rem", justifyContent: "flex-start" }}>
              <Link href={`/${locale}`} style={{ color: "#C9A24B", textDecoration: "none" }}>{ar ? "الرئيسية" : "Home"}</Link>
              <span style={{ opacity: 0.4 }}>›</span>
              <Link href={`/${locale}/products`} style={{ color: "#C9A24B", textDecoration: "none" }}>{ar ? "المنتجات" : "Products"}</Link>
              <span style={{ opacity: 0.4 }}>›</span>
              <span>{ar ? "اللوحات" : "Signs"}</span>
            </div>

            {/* Title */}
            <div style={{ textAlign: ar ? "right" : "left" }}>
              <div style={{ display: "block", marginBottom: "0.75rem" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "2rem" }}>🪧</span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(201,162,75,0.7)", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "monospace" }}>
                    {ar ? "قسم اللوحات" : "Signs Category"}
                  </span>
                </span>
              </div>
              <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, color: "#2C1E15", lineHeight: 1.12, margin: "0 0 1rem 0" }}>
                {ar ? (
                  <>لوحات لكل <span style={{ background: "linear-gradient(135deg,#C9A24B,#EBCB7C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>احتياج ومناسبة</span></>
                ) : (
                  <>Signs for Every <span style={{ background: "linear-gradient(135deg,#C9A24B,#EBCB7C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Need & Occasion</span></>
                )}
              </h1>
              <p style={{ fontSize: "clamp(0.9rem,1.5vw,1rem)", color: "#888", maxWidth: 580, lineHeight: 1.8, margin: "0 0 0.5rem 0" }}>
                {ar
                  ? "خمسة أقسام متخصصة من اللوحات — من واجهات المحلات إلى الديكورات الجدارية — كل قسم مصمم لخدمة احتياج مختلف"
                  : "Five specialized sign categories — from storefronts to wall art — each designed to serve a distinct need"}
              </p>
            </div>
          </div>
        </section>

        {/* ── Grid ─────────────────────────────────────────────────────── */}
        <section style={{ padding: "1.5rem 0 5rem" }}>
          <div className="section-container">
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1rem",
            }}
            className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
            >
              {/* Known subcategories (with SVG patterns) */}
              {subcategories.map((cat, idx) => {
                const dynSub = dynamicSubs.find(s => s.key === cat.id);
                const name = dynSub ? (ar ? dynSub.nameAr : dynSub.nameEn) : undefined;
                const desc = dynSub ? (ar ? dynSub.descAr : dynSub.descEn) : undefined;
                return (
                  <SubCatCard key={cat.id} cat={cat} ar={ar} locale={locale} index={idx}
                    image={dynSub?.image ?? images[cat.id as keyof SignImages]}
                    overrideName={name} overrideDesc={desc} />
                );
              })}
              {/* Extra subcategories added from admin (no hardcoded SVG) */}
              {dynamicSubs
                .filter(s => !subcategories.find(c => c.id === s.key))
                .map((s, idx) => (
                  <div key={s.id}
                    onClick={() => router.push(`/${locale}/configure/signs/${s.key}`)}
                    className={clsx(
                    "group relative rounded-2xl overflow-hidden cursor-pointer",
                    "border border-brand-gold/10 hover:border-brand-gold/40",
                    "transition-all duration-500 hover:-translate-y-1.5",
                  )} style={{ background: "linear-gradient(135deg,#FDFBF7,#F4EFE6)", height: "300px" }}>
                    {s.image
                      ? <img src={s.image} alt={ar ? s.nameAr : s.nameEn}
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{ opacity: 0.7 }} />
                      : <div className="absolute inset-0 flex items-center justify-center" style={{ color: "rgba(201,162,75,0.15)", fontSize: "3rem" }}>🪧</div>
                    }
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.80) 24%, rgba(0,0,0,0.38) 48%, rgba(0,0,0,0) 78%)" }} />
                    <div className="absolute inset-0 p-5 flex flex-col justify-end z-10" style={{ textAlign: ar ? "right" : "left" }}>
                      <h3 style={{ color: "#F7ECD8", fontWeight: 800, margin: 0, fontSize: "1.05rem", textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}>
                        {ar ? s.nameAr : s.nameEn}
                      </h3>
                      {(ar ? s.descAr : s.descEn) && (
                        <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "0.78rem", margin: "0.35rem 0 0", lineHeight: 1.5, textShadow: "0 1px 6px rgba(0,0,0,0.6)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {ar ? s.descAr : s.descEn}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Process steps */}
            <div style={{ marginTop: "3.5rem" }}>
              <h2 style={{
                textAlign: "center", fontSize: "1.3rem", fontWeight: 800,
                color: "#2C1E15", marginBottom: "2rem",
              }}>
                {ar ? "كيف نعمل؟" : "How We Work?"}
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "1rem" }}>
                {[
                  { num: "01", icon: "💬", titleAr: "استشارة مجانية",    titleEn: "Free Consultation",   descAr: "أخبرنا باحتياجك",          descEn: "Tell us your need" },
                  { num: "02", icon: "🎨", titleAr: "تصميم مخصص",        titleEn: "Custom Design",       descAr: "نصمم لك الفكرة",            descEn: "We design your concept" },
                  { num: "03", icon: "⚙️", titleAr: "تنفيذ احترافي",     titleEn: "Pro Execution",       descAr: "إنتاج بأعلى الجودة",       descEn: "Production at highest quality" },
                  { num: "04", icon: "🚚", titleAr: "توصيل وتركيب",      titleEn: "Delivery & Install",  descAr: "نوصل ونركّب لك",            descEn: "We deliver and install" },
                ].map(step => (
                  <div key={step.num} style={{
                    padding: "1.5rem", borderRadius: 16, textAlign: "center",
                    background: "rgba(201,162,75,0.04)", border: "1px solid rgba(201,162,75,0.1)",
                    transition: "all 0.2s",
                  }}>
                    <div style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "rgba(201,162,75,0.5)", marginBottom: "0.5rem" }}>{step.num}</div>
                    <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>{step.icon}</div>
                    <div style={{ fontWeight: 700, color: "#2C1E15", marginBottom: "0.3rem", fontSize: "0.95rem" }}>{ar ? step.titleAr : step.titleEn}</div>
                    <div style={{ fontSize: "0.78rem", color: "#666" }}>{ar ? step.descAr : step.descEn}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{
              marginTop: "3rem", borderRadius: 20, padding: "2.5rem",
              background: "linear-gradient(135deg,#FDFBF7,#F4EFE6,#0a1218)",
              border: "1px solid rgba(201,162,75,0.2)", position: "relative", overflow: "hidden",
              textAlign: "center",
            }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(201,162,75,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(201,162,75,0.03) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <h2 style={{ fontSize: "clamp(1.3rem,3vw,1.8rem)", fontWeight: 900, color: "#2C1E15", margin: "0 0 0.75rem 0" }}>
                  {ar ? "جاهز لطلب لوحتك؟" : "Ready to Order Your Sign?"}
                </h2>
                <p style={{ color: "#888", margin: "0 0 1.75rem 0", fontSize: "0.92rem" }}>
                  {ar ? "تواصل معنا الآن وسنساعدك باختيار الأنسب لمشروعك" : "Contact us now and we'll help you choose what's best for your project"}
                </p>
                <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                  <Link href={`/${locale}/contact`} className="btn-shine btn-shine-gold" style={{
                    padding: "0.85rem 2rem", borderRadius: 999, fontWeight: 700, fontSize: "0.9rem",
                    background: "linear-gradient(135deg,#C9A24B,#EBCB7C)", color: "#2C1E15",
                    textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    boxShadow: "0 6px 24px rgba(201,162,75,0.3)",
                  }}>
                    {ar ? "اطلب الآن" : "Order Now"} <ArrowUpRight size={16} />
                  </Link>
                  <a href="https://wa.me/966500000000" target="_blank" rel="noopener noreferrer"
                    className="btn-shine btn-shine-outline" style={{
                      padding: "0.85rem 1.75rem", borderRadius: 999, fontSize: "0.9rem",
                      border: "1.5px solid rgba(201,162,75,0.3)", color: "#EBCB7C",
                      textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
    </div>
  );
}
