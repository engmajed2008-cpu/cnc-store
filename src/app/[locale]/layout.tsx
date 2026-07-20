import "@/styles/globals.css";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Tajawal, IBM_Plex_Sans_Arabic } from "next/font/google";
import { Providers } from "./providers";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return locale === "ar"
    ? {
        title: "إعلاني | سوق الدعاية والإعلان",
        description: "سوقك المتكامل للدعاية والإعلان — لوحات ولافتات احترافية، ديكور فني، وقص CNC بدقة عالية",
      }
    : {
        title: "E3lani — Advertising & Signage Market",
        description: "Your complete advertising marketplace — professional signs, artistic decor, and precision CNC cutting",
      };
}

// خط الموقع الأساسي — Tajawal (هوية «إعلاني» الفاخرة)
const tajawal = Tajawal({ subsets: ["arabic", "latin"], weight: ["400", "500", "700", "900"], display: "swap" });

// خط هوية «إعلاني» — يحافظ على نقطتي «ي» في الكلمة (Cairo Bold يحذفها)
const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-brand",
});

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <div lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={`${tajawal.className} ${plex.variable}`} style={{ margin: 0, color: "var(--text-primary)", minHeight: "100vh" }}>
      <Providers locale={locale} messages={messages}>
        <main style={{ paddingTop: "108px" }}>{children}</main>
      </Providers>
    </div>
  );
}
