"use client";

/**
 * siteStore — shared localStorage bridge between admin and main page.
 * Admin writes here on save; main page components read on mount.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type Slide = {
  id: number;
  badge: string;
  badgeEn?: string;
  title: string;
  titleEn?: string;
  subtitle: string;
  subtitleEn?: string;
  ctaAr: string;
  ctaEn: string;
  href: string;
  color: string;
  image: string | null;
};

export type HeroData = {
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

export type Stat = {
  value: string;
  suffix: string;
  icon: string;
  label: string;
  labelEn?: string;
};

export type WhyCard = {
  id: number;
  icon: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
};

export type Product = {
  id: number;
  key: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  href: string;
  image: string | null;
  gradient: string;
};

// Legacy SubProduct — kept for backward compatibility
export type SubProduct = {
  id: number;
  categoryKey: string;
  nameAr: string; nameEn: string;
  descAr: string; descEn: string;
  price: string; unit: string;
  image: string | null;
  badge: string; available: boolean;
};

// ─── New store types ──────────────────────────────────────────────────────────

export type StoreSubcategory = {
  id: number;
  mainKey: string;   // key of main category (e.g. "signs")
  key: string;       // own key (e.g. "outdoor")
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  image: string | null;
};

export type StoreProduct = {
  id: number;
  mainKey: string;        // main category key
  subcategoryKey: string; // subcategory key
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  price: string;
  unit: string;
  image: string | null;
  badge: string;
  available: boolean;
  href?: string; // مسار صفحة المنتج (بدون اللغة) — النقر على الكرت ينتقل إليه
};

export type Service = {
  id: number;
  key: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  href: string;
  featuresAr: string[];
  gradient: string;
  image?: string | null;
};

export type PartnerBannerData = {
  badgeAr: string;
  badgeEn: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  benefitsAr: string[];
  benefitsEn: string[];
  ctaAr: string;
  ctaEn: string;
  ctaHref: string;
  noteAr: string;
  noteEn: string;
};

// ─── Site Colors ─────────────────────────────────────────────────────────────

export type SiteColors = {
  sectionCream: string;  // خلفية الأقسام الفاتحة (HomeHero, stats bar, why cards, partner card)
  sectionDark:  string;  // خلفية الأقسام الداكنة (HomeStats section, PartnerBanner outer)
  pageBg:       string;  // خلفية الصفحة العامة (body background)
  navBg:        string;  // خلفية شريط التنقل العلوي
  footerBg:     string;  // خلفية الفوتر السفلي
};

export type ContactInfo = {
  whatsapp: string;
  phone: string;
  email: string;
  address: string;
  addressEn: string;
  instagram: string;
  twitter: string;
  snapchat: string;
  tiktok: string;
  facebook: string;
  youtube: string;
  linkedin: string;
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_SLIDES: Slide[] = [
  { id: 1, image: null, badge: "عرض خاص", badgeEn: "Special Offer", title: "قص CNC بدقة استثنائية", titleEn: "Exceptional CNC Cutting Precision", subtitle: "احصل على خصم 20% على جميع طلبات القص الرقمي هذا الشهر", subtitleEn: "Get 20% off all digital cutting orders this month", ctaAr: "اطلب الآن", ctaEn: "Order Now", href: "/products/cnc", color: "#FDFBF7" },
  { id: 2, image: null, badge: "جديد", badgeEn: "New", title: "ديكورات معدنية فاخرة", titleEn: "Luxury Metal Decorations", subtitle: "حوّل مساحتك إلى تحفة فنية مع أحدث تصاميم الديكور المعدني", subtitleEn: "Transform your space into a work of art with our latest metal decor designs", ctaAr: "اكتشف المزيد", ctaEn: "Discover More", href: "/services/decor", color: "#FDFBF7" },
  { id: 3, image: null, badge: "الأكثر طلباً", badgeEn: "Most Popular", title: "لوحات ولافتات احترافية", titleEn: "Professional Signs & Boards", subtitle: "اصنع هوية بصرية قوية لعلامتك التجارية مع لافتاتنا المخصصة", subtitleEn: "Build a strong visual identity for your brand with our custom signs", ctaAr: "شاهد الأعمال", ctaEn: "View Work", href: "/clients/projects", color: "#2C1E15" },
  { id: 4, image: null, badge: "خدمة مميزة", badgeEn: "Premium Service", title: "تصميم وتنفيذ متكامل", titleEn: "Complete Design & Execution", subtitle: "من الفكرة إلى التنفيذ — فريقنا يرافقك في كل خطوة", subtitleEn: "From concept to execution — our team is with you every step of the way", ctaAr: "تواصل معنا", ctaEn: "Contact Us", href: "/contact", color: "#FDFBF7" },
];

export const DEFAULT_HERO: HeroData = {
  badge: "تقنية CNC المتقدمة",
  title: "نحوّل أفكارك إلى",
  titleHighlight: "تحف فنية معدنية",
  subtitle: "دعاية وإعلان احترافية، ديكورات مذهلة، وقص CNC بدقة استثنائية. نجمع الإبداع بالتكنولوجيا لنصنع ما لا يُنسى.",
  ctaPrimary: "اطلب الآن",
  ctaSecondary: "شاهد أعمالنا",
};

export const DEFAULT_STATS: Stat[] = [
  { value: "500", suffix: "+",  icon: "🏆", label: "مشروع منجز",   labelEn: "Projects Done"   },
  { value: "300", suffix: "+",  icon: "😊", label: "عميل راضٍ",    labelEn: "Happy Clients"   },
  { value: "13",  suffix: "",   icon: "🗺️", label: "منطقة سعودية", labelEn: "Saudi Regions"   },
  { value: "24",  suffix: "/7", icon: "📞", label: "دعم متواصل",    labelEn: "Support"         },
];

export const DEFAULT_WHY_CARDS: WhyCard[] = [
  {
    id: 1, icon: "🏛",
    titleAr: "امتثال بلدي مضمون",
    titleEn: "Municipal Compliance Guaranteed",
    descAr:  "كل تصميم ينتجه الموقع يلتزم تلقائياً باشتراطات الأمانة في مدينتك — لا مخالفات ولا تأخير في التركيب.",
    descEn:  "Every design auto-complies with your city's Amanah regulations — zero violations, zero installation delays.",
  },
  {
    id: 2, icon: "⚡",
    titleAr: "سعر تقديري فوري + عروض حقيقية",
    titleEn: "Instant Estimate + Real Offers",
    descAr:  "حدّد مواصفاتك واحصل على تسعير تقديري فوري — ثم يُرسَل طلبك للشركاء القريبين منك وتختار من عروضهم الفعلية.",
    descEn:  "Set your specs and get an instant estimated price — your request is then sent to nearby partners and you choose from their real offers.",
  },
  {
    id: 3, icon: "🤝",
    titleAr: "شركاء معتمدون فقط",
    titleEn: "Certified Partners Only",
    descAr:  "كل مورد يمر بعملية اعتماد صارمة — جودتك محمية بعقد وNDA وضمان تنفيذ كامل.",
    descEn:  "Every supplier passes a strict vetting process — your quality is protected by contract and full delivery guarantee.",
  },
];

export const DEFAULT_PRODUCTS: Product[] = [
  { id: 1, key: "signs", nameAr: "اللوحات", nameEn: "Signs", descAr: "لافتات ولوحات معدنية بتصاميم مخصصة واحترافية تعكس هويتك التجارية", descEn: "Custom metal signs and boards", href: "/configure/signs", image: null, gradient: "linear-gradient(135deg,#FDFBF7 0%,#F4EFE6 100%)" },
  { id: 2, key: "banners", nameAr: "البنرات", nameEn: "Banners", descAr: "بنرات عالية الجودة للمعارض والفعاليات والإعلانات الخارجية", descEn: "High-quality banners for exhibitions and events", href: "/products/banners", image: null, gradient: "linear-gradient(135deg,#FDFBF7 0%,#ECE3D2 100%)" },
  { id: 3, key: "flags", nameAr: "الأعلام", nameEn: "Flags", descAr: "أعلام ترويجية بأشكال متعددة مناسبة للمعارض والمداخل", descEn: "Promotional flags in multiple shapes", href: "/products/flags", image: null, gradient: "linear-gradient(135deg,#F4EFE6 0%,#E6CA83 100%)" },
  { id: 4, key: "stickers", nameAr: "الملصقات", nameEn: "Stickers", descAr: "ملصقات فينيل عالية الجودة للسيارات والواجهات والمتاجر", descEn: "High-quality vinyl stickers", href: "/products/stickers", image: null, gradient: "linear-gradient(135deg,#FDFBF7 0%,#F4EFE6 100%)" },
  { id: 5, key: "promotional", nameAr: "منتجات العروض الترويجية", nameEn: "Promotional Products", descAr: "هدايا دعائية ومطبوعات ترويجية تُعزز حضور علامتك التجارية", descEn: "Promotional gifts and prints", href: "/products/promotional", image: null, gradient: "linear-gradient(135deg,#FDFBF7 0%,#ECE3D2 100%)" },
  { id: 6, key: "tradeshow", nameAr: "العروض", nameEn: "Tradeshow", descAr: "حلول متكاملة للمعارض والمؤتمرات من بنرات وأكشاك وديكورات", descEn: "Complete solutions for exhibitions and conferences", href: "/products/tradeshow", image: null, gradient: "linear-gradient(135deg,#FDFBF7 0%,#F4EFE6 100%)" },
];

export const DEFAULT_SERVICES: Service[] = [
  { id: 1, key: "decor", nameAr: "خدمات الديكور الداخلي", nameEn: "Interior Decor", descAr: "تصميم وتنفيذ ديكورات داخلية فاخرة تمزج بين الفن والتقنية", descEn: "Luxury interior decor blending art with modern technology", href: "/services/decor", gradient: "linear-gradient(135deg,#F4EFE6 0%,#F4EFE6 100%)", featuresAr: ["تصميم مخصص", "تنفيذ احترافي", "ضمان الجودة"] },
  { id: 2, key: "cutting", nameAr: "خدمات القص الرقمي", nameEn: "Digital Cutting", descAr: "قص وحفر المعادن بدقة ميكرونية باستخدام أحدث ماكينات CNC", descEn: "Metal cutting with micrometric precision using CNC", href: "/services/cutting", gradient: "linear-gradient(135deg,#FDFBF7 0%,#ECE3D2 100%)", featuresAr: ["دقة عالية", "سرعة إنجاز", "جميع أنواع المعادن"] },
  { id: 3, key: "facade", nameAr: "خدمات تصميم الواجهات", nameEn: "Facade Design", descAr: "تصميم واجهات تجارية ومعمارية احترافية تجذب الأنظار", descEn: "Professional commercial facade design", href: "/services/facade", gradient: "linear-gradient(135deg,#FDFBF7 0%,#F4EFE6 100%)", featuresAr: ["تصميم فريد", "مواد عالية الجودة", "تسليم في الموعد"] },
];

export const DEFAULT_PARTNER_BANNER: PartnerBannerData = {
  badgeAr: "للموردين والمقاولين",
  badgeEn: "For Suppliers & Contractors",
  titleAr: "انضم كشريك معتمد في إعلاني",
  titleEn: "Become a Certified Partner on E3lani",
  descAr:  "سجّل مؤسستك وتحصل على طلبات منتظمة من عملاء موثوقين في منطقتك — بلا مبيعات ولا تسويق. المنصة تجلب لك العملاء وأنت تنفّذ فقط.",
  descEn:  "Register your business and receive regular orders from verified clients in your area — no sales, no marketing needed. The platform brings you clients; you just execute.",
  benefitsAr: ["✓ طلبات مستمرة", "✓ دفع مضمون", "✓ شبكة عملاء واسعة"],
  benefitsEn: ["✓ Steady orders", "✓ Guaranteed payment", "✓ Wide client network"],
  ctaAr:   "سجّل مؤسستك الآن",
  ctaEn:   "Register Your Business",
  ctaHref: "/join",
  noteAr:  "التسجيل مجاني — يستغرق أقل من دقيقتين",
  noteEn:  "Free registration — takes less than 2 minutes",
};

export const DEFAULT_COLORS: SiteColors = {
  sectionCream: "#F4EFE6",  // البطاقة الداخلية الدافئة
  sectionDark:  "#FDFBF7",  // الإطار الخارجي للأقسام — كريمي فاتح
  pageBg:       "#FDFBF7",
  navBg:        "#FDFBF7",
  footerBg:     "#F4EFE6",  // فوتر كريمي دافئ
};

export const DEFAULT_CONTACT: ContactInfo = {
  whatsapp:  "966500000000",
  phone:     "966500000000",
  email:     "info@adsouq.sa",
  address:   "جدة، المملكة العربية السعودية",
  addressEn: "Jeddah, Saudi Arabia",
  instagram: "",
  twitter:   "",
  snapchat:  "",
  tiktok:    "",
  facebook:  "",
  youtube:   "",
  linkedin:  "",
};

// ─── Home Paths (3 بوابات الصفحة الرئيسية) ────────────────────────────────────

export type HomePath = {
  id: number;
  num: string;
  key: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  ctaAr: string;
  ctaEn: string;
  tagAr: string;
  tagEn: string;
  href: string;
  badge: string;
  image: string | null;
  gradient: string;
};

export const DEFAULT_HOME_PATHS: HomePath[] = [
  {
    id: 1, num: "01", key: "products",
    nameAr: "منتجات جاهزة",      nameEn: "Ready Products",
    descAr:  "تصفّح كتالوجنا المتكامل وطلب فوري بدون انتظار — لوحات، بنرات، أعلام، ملصقات وأكثر.",
    descEn:  "Browse our complete catalog and order instantly — signs, banners, flags, stickers and more.",
    ctaAr: "تصفّح الكتالوج",     ctaEn: "Browse Catalog",
    tagAr: "المسار الأول",       tagEn: "Track One",
    href: "/products",           badge: "01",
    image: null,
    gradient: "linear-gradient(135deg,#FDFBF7 0%,#F4EFE6 50%,#FDFBF7 100%)",
  },
  {
    id: 2, num: "02", key: "configure",
    nameAr: "صمّم وسعّر",         nameEn: "Design & Price",
    descAr:  "حدّد مواصفات منتجك واحصل على سعر تقديري فوري — ثم يُرسَل طلبك للشركاء القريبين منك، وتختار من عروضهم الفعلية.",
    descEn:  "Set your product specs and get an instant estimated price — your request is then sent to nearby partners, and you pick from their real offers.",
    ctaAr: "صمّم وقارن العروض",  ctaEn: "Design & Compare Offers",
    tagAr: "المسار الثاني",      tagEn: "Track Two",
    href: "/configure",          badge: "02",
    image: null,
    gradient: "linear-gradient(135deg,#FDFBF7 0%,#ECE3D2 50%,#FDFBF7 100%)",
  },
  {
    id: 3, num: "03", key: "request",
    nameAr: "سعّر مشروعك",        nameEn: "Price Your Project",
    descAr:  "شاركنا تفاصيل مشروعك الكامل، واحصل على عروض تنافسية من شركاء معتمدين مع ضمان على التنفيذ.",
    descEn:  "Share your complete project details and receive competitive offers from certified partners — with a guaranteed delivery.",
    ctaAr: "سعّر مشروعك الآن",   ctaEn: "Price Your Project Now",
    tagAr: "المسار الثالث",      tagEn: "Track Three",
    href: "/request/new",        badge: "03",
    image: null,
    gradient: "linear-gradient(135deg,#F4EFE6 0%,#E6CA83 50%,#FDFBF7 100%)",
  },
];

// ─── Configure Categories ─────────────────────────────────────────────────────

export type ConfigureCategory = {
  id: number;
  key: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  badge: string;
  image: string | null;
  gradient: string;
};

export const DEFAULT_CONFIGURE_CATEGORIES: ConfigureCategory[] = [
  { id: 1, key: "signs",    nameAr: "لوحات وافتات",      nameEn: "Signs & Signage",       descAr: "حديد، أكريليك، ACM، MDF — قص وطباعة",             descEn: "Steel, acrylic, ACM, MDF — cutting & printing",   badge: "SIGNS",   image: null, gradient: "linear-gradient(135deg,#FDFBF7 0%,#F4EFE6 50%,#FDFBF7 100%)" },
  { id: 2, key: "banners",  nameAr: "بنرات وفلكسات",      nameEn: "Banners & Flex",         descAr: "فلكس عادي وممتاز، شبكي، مضيء",                    descEn: "Standard & premium flex, mesh, backlit",          badge: "BANNERS", image: null, gradient: "linear-gradient(135deg,#FDFBF7 0%,#ECE3D2 50%,#FDFBF7 100%)" },
  { id: 3, key: "flags",    nameAr: "أعلام وراياة",        nameEn: "Flags & Pennants",       descAr: "ستان، تافيتا، نايلون — للداخل والخارج",            descEn: "Satin, taffeta, nylon — indoor & outdoor",        badge: "FLAGS",   image: null, gradient: "linear-gradient(135deg,#F4EFE6 0%,#E6CA83 50%,#FDFBF7 100%)" },
  { id: 4, key: "stickers", nameAr: "ملصقات وستيكر",       nameEn: "Stickers & Labels",      descAr: "PVC، كروم، شفاف — قص مخصص",                       descEn: "PVC, chrome, clear — custom cut",                 badge: "STICKERS",image: null, gradient: "linear-gradient(135deg,#FDFBF7 0%,#F4EFE6 50%,#FDFBF7 100%)" },
  { id: 5, key: "promo",    nameAr: "منتجات ترويجية",      nameEn: "Promotional Products",   descAr: "أكواب، تيشيرت، أقلام، حقائب، مظلات",              descEn: "Cups, t-shirts, pens, bags, umbrellas",           badge: "PROMO",   image: null, gradient: "linear-gradient(135deg,#FDFBF7 0%,#ECE3D2 50%,#FDFBF7 100%)" },
  { id: 6, key: "expo",     nameAr: "معارض وإكسبو",         nameEn: "Exhibitions & Expo",     descAr: "رول-آب، بوب-آب، بوث معرض، جدار عرض",              descEn: "Roll-ups, pop-ups, booths, display walls",        badge: "EXPO",    image: null, gradient: "linear-gradient(135deg,#FDFBF7 0%,#F4EFE6 50%,#FDFBF7 100%)" },
];

// ─── Storage keys ──────────────────────────────────────────────────────────────

export const DEFAULT_SUB_PRODUCTS: SubProduct[] = [];

// ─── LED Letters Pricing ──────────────────────────────────────────────────────
export type LedLettersPricing = {
  acrylicPerCmPerLetter: number;   // ريال/سم/حرف - أكريليك
  aluminumPerCmPerLetter: number;  // ريال/سم/حرف - ألمنيوم
  stainlessPerCmPerLetter: number; // ريال/سم/حرف - ستانلس ستيل
  frontLitMultiplier: number;      // مضاعف الإضاءة الأمامية
  backLitMultiplier: number;       // مضاعف الإضاءة الخلفية
  doubleLitMultiplier: number;     // مضاعف الإضاءة المزدوجة
  minimumOrder: number;            // الحد الأدنى للطلب
  installationFee: number;         // رسوم التركيب
};

export const DEFAULT_LED_PRICING: LedLettersPricing = {
  acrylicPerCmPerLetter: 8,
  aluminumPerCmPerLetter: 15,
  stainlessPerCmPerLetter: 25,
  frontLitMultiplier: 1.0,
  backLitMultiplier: 1.3,
  doubleLitMultiplier: 1.6,
  minimumOrder: 300,
  installationFee: 0,
};

export const DEFAULT_STORE_PRODUCTS: StoreProduct[] = [
  {
    id: 1, mainKey: "signs", subcategoryKey: "outdoor",
    nameAr: "لوحات المتاجر",
    nameEn: "Storefront Signs",
    descAr: "لوحات واجهات متكاملة للمتاجر: حروف بارزة ثلاثية الأبعاد من الاكريليك أو الألمنيوم مع إضاءة LED، على خلفية كلادينج أو مضيئة. صمّمها بنفسك واحسب السعر فوراً.",
    descEn: "Complete storefront signs: 3D raised letters in acrylic or aluminum with LED lighting, on cladding or illuminated backgrounds. Design it yourself with instant pricing.",
    price: "", unit: "ريال",
    image: null, badge: "الأكثر طلباً", available: true,
    href: "/configure/signs/raised-letters",
  },
  {
    id: 2, mainKey: "signs", subcategoryKey: "outdoor",
    nameAr: "لوحات البايلون",
    nameEn: "Pylon Signs",
    descAr: "لوحات عمودية مرتفعة تُنصب أمام المداخل والطرق الرئيسية. مثالية لعيادات، مجمعات، ومحطات الوقود. تشمل إضاءة LED مع إمكانية عرض شعار الشركة.",
    descEn: "Tall vertical signs installed at entrances and main roads. Ideal for clinics, complexes, and gas stations. Includes LED lighting with company logo.",
    price: "", unit: "ريال",
    image: null, badge: "", available: true,
  },
  {
    id: 3, mainKey: "signs", subcategoryKey: "outdoor",
    nameAr: "لوحات الفليكس المضيئة Flex LED",
    nameEn: "Illuminated Flex LED Signs",
    descAr: "لوحات ضوئية كبيرة بطباعة رقمية عالية الدقة على مادة الفليكس مع إضاءة LED خلفية. توفر رؤية واضحة نهاراً وليلاً بتكلفة مناسبة.",
    descEn: "Large illuminated signs with high-resolution digital printing on flex material with LED backlight. Clear visibility day and night.",
    price: "", unit: "ريال",
    image: null, badge: "جديد", available: true,
  },
];

export const DEFAULT_STORE_SUBCATEGORIES: StoreSubcategory[] = [
  { id: 1, mainKey: "signs", key: "outdoor", nameAr: "اللوحات الخارجية والواجهات",     nameEn: "Outdoor & Facade Signs",    descAr: "واجهتك هي انطباعك الأول. لوحات واجهات وحروف بارزة مخصصة بأحدث تقنيات الإضاءة.", descEn: "Your facade is your first impression. Custom signs and raised letters with the latest lighting.", image: null },
  { id: 2, mainKey: "signs", key: "metal",   nameAr: "اللوحات المعدنية والقص بالليزر",  nameEn: "Metal & Laser-Cut Signs",   descAr: "الفخامة والأصالة في قطعة واحدة. لوحات ستانلس ستيل وحديد مقصوص بالليزر بدقة متناهية.", descEn: "Luxury and authenticity in one piece. Stainless steel and CNC laser-cut signs.", image: null },
  { id: 3, mainKey: "signs", key: "neon",    nameAr: "لوحات النيون المضيئة",            nameEn: "Neon LED Signs",            descAr: "أضف لمسة حيوية وعصرية. لوحات نيون LED مرنة بتصاميم وعبارات مخصصة.", descEn: "Add vibrant modern flair. Flexible LED neon signs with custom designs.", image: null },
  { id: 4, mainKey: "signs", key: "indoor",  nameAr: "اللوحات الداخلية والمكتبية",     nameEn: "Indoor & Office Signs",     descAr: "عزز الاحترافية داخل مقر عملك. لوحات استقبال وأنظمة إرشادية أنيقة.", descEn: "Elevate professionalism. Reception signs and elegant wayfinding systems.", image: null },
  { id: 5, mainKey: "signs", key: "decor",   nameAr: "لوحات الديكور والجداريات",        nameEn: "Decorative & Wall Art",     descAr: "اكتمل جمال جدرانك بلمسة فنية. لوحات جدارية وديكورية متنوعة.", descEn: "Complete your walls with an artistic touch. Diverse decorative wall art.", image: null },
];

// Images for sign subcategory cards
export type SignImages = {
  outdoor:     string | null;
  metal:       string | null;
  neon:        string | null;
  indoor:      string | null;
  decor:       string | null;
};

export const DEFAULT_SIGN_IMAGES: SignImages = {
  outdoor: null, metal: null, neon: null, indoor: null, decor: null,
};

const KEYS = {
  slides:              "metalart_slides_v1",
  hero:                "metalart_hero_v1",
  stats:               "metalart_stats_v1",
  products:            "metalart_products_v1",       // كروت الصفحة الرئيسية (CategoryGrid)
  storeCategories:     "metalart_store_cats_v1",     // أقسام صفحة /products
  configureCategories: "metalart_configure_cats_v1", // أقسام صفحة /configure
  homePaths:           "metalart_home_paths_v1",      // المسارات الثلاث في الصفحة الرئيسية
  whyCards:            "metalart_why_cards_v1",       // بطاقات لماذا إعلاني؟
  partnerBanner:       "metalart_partner_banner_v1",  // بانر الشراكة
  colors:              "metalart_site_colors_v1",      // ألوان الموقع
  signImages:       "metalart_sign_images_v1",
  storeSubcategories: "metalart_store_subcats_v1",
  storeProducts:      "metalart_store_products_v1",
  ledPricing:         "metalart_led_pricing_v1",
  subProducts:    "metalart_sub_products_v1",  // منتجات فرعية داخل كل قسم
  services:       "metalart_services_v1",
  contact:        "metalart_contact_v1",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  // Save to localStorage immediately (fast)
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  // Notify same-tab listeners (e.g. Navbar, Footer, AdminLayout)
  window.dispatchEvent(new CustomEvent("siteStore:saved", { detail: { key } }));
  // Also persist to Supabase (durable)
  fetch("/api/site-config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  }).catch(() => {}); // silent fail
}

// Load from Supabase and sync to localStorage
export async function syncFromSupabase(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/api/site-config");
    if (!res.ok) return;
    const data = await res.json() as Record<string, unknown>;
    Object.entries(data).forEach(([k, v]) => {
      // Never overwrite slides with an empty array — keeps DEFAULT_SLIDES as fallback
      if (k === KEYS.slides && Array.isArray(v) && v.length === 0) return;
      try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
    });
    // Notify components (Footer, Navbar, etc.) that colors may have changed
    window.dispatchEvent(new CustomEvent("siteStore:saved", { detail: { source: "supabase-sync" } }));
  } catch {}
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const siteStore = {
  // Slides
    // Slides
  getSlides: () => {
    const s = load<Slide[]>(KEYS.slides, DEFAULT_SLIDES);
    return s && s.length > 0 ? s : DEFAULT_SLIDES;
  },
  saveSlides:   (v: Slide[])   => save(KEYS.slides, v),

  // Hero
  getHero:      ()             => load<HeroData>(KEYS.hero, DEFAULT_HERO),
  saveHero:     (v: HeroData)  => save(KEYS.hero, v),

  // Stats
  getStats:     ()             => load<Stat[]>(KEYS.stats, DEFAULT_STATS),
  saveStats:    (v: Stat[])    => save(KEYS.stats, v),

  // Why cards
  getWhyCards:  ()               => load<WhyCard[]>(KEYS.whyCards, DEFAULT_WHY_CARDS),
  saveWhyCards: (v: WhyCard[])   => save(KEYS.whyCards, v),

  // Homepage CategoryGrid cards — managed by /admin/products
  getProducts:  ()             => load<Product[]>(KEYS.products, DEFAULT_PRODUCTS),
  saveProducts: (v: Product[]) => save(KEYS.products, v),

  // /products page categories — managed by /admin/store/main (SEPARATE from homepage)
  getStoreCategories:  ()             => load<Product[]>(KEYS.storeCategories, DEFAULT_PRODUCTS),
  saveStoreCategories: (v: Product[]) => save(KEYS.storeCategories, v),

  // /configure page categories — managed by /admin/configure
  getConfigureCategories:  ()                       => load<ConfigureCategory[]>(KEYS.configureCategories, DEFAULT_CONFIGURE_CATEGORIES),
  saveConfigureCategories: (v: ConfigureCategory[]) => save(KEYS.configureCategories, v),

  // Home page 3 paths — managed by /admin/home-paths
  getHomePaths:  ()               => load<HomePath[]>(KEYS.homePaths, DEFAULT_HOME_PATHS),
  saveHomePaths: (v: HomePath[])  => save(KEYS.homePaths, v),

  // LED Letters pricing
  getLedPricing:  ()                    => load<LedLettersPricing>(KEYS.ledPricing, DEFAULT_LED_PRICING),
  saveLedPricing: (v: LedLettersPricing) => save(KEYS.ledPricing, v),

  // New store subcategories
  getStoreSubcategories:  ()                      => load<StoreSubcategory[]>(KEYS.storeSubcategories, DEFAULT_STORE_SUBCATEGORIES),
  saveStoreSubcategories: (v: StoreSubcategory[]) => save(KEYS.storeSubcategories, v),

  // New store products
  getStoreProducts:  ()                   => load<StoreProduct[]>(KEYS.storeProducts, DEFAULT_STORE_PRODUCTS),
  saveStoreProducts: (v: StoreProduct[]) => save(KEYS.storeProducts, v),

  // Sign subcategory images
  getSignImages:  ()               => load<SignImages>(KEYS.signImages, DEFAULT_SIGN_IMAGES),
  saveSignImages: (v: SignImages)  => save(KEYS.signImages, v),

  // Sub-products (items inside each product category page)
  getSubProducts:  ()                => load<SubProduct[]>(KEYS.subProducts, DEFAULT_SUB_PRODUCTS),
  saveSubProducts: (v: SubProduct[]) => save(KEYS.subProducts, v),

  // Services
  getServices:  ()             => load<Service[]>(KEYS.services, DEFAULT_SERVICES),
  saveServices: (v: Service[]) => save(KEYS.services, v),

  // Contact
  getContact:   ()                => load<ContactInfo>(KEYS.contact, DEFAULT_CONTACT),
  saveContact:  (v: ContactInfo)  => save(KEYS.contact, v),

  // Partner banner
  getPartnerBanner:  ()                      => load<PartnerBannerData>(KEYS.partnerBanner, DEFAULT_PARTNER_BANNER),
  savePartnerBanner: (v: PartnerBannerData)  => save(KEYS.partnerBanner, v),

  // Site colors
  getColors:  ()               => ({ ...DEFAULT_COLORS, ...load<SiteColors>(KEYS.colors, DEFAULT_COLORS) }),
  saveColors: (v: SiteColors)  => save(KEYS.colors, v),
};
