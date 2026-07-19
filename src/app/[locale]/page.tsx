import { setRequestLocale } from "next-intl/server";
import dynamic from "next/dynamic";
import HomeHero from "@/components/sections/HomeHero";
import HomeStats from "@/components/sections/HomeStats";
import PartnerBanner from "@/components/sections/PartnerBanner";

const HeroSlider = dynamic(() => import("@/components/sections/HeroSlider"), { ssr: false });

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <HeroSlider locale={locale} />
      <HomeHero locale={locale} />
      <HomeStats locale={locale} />
      <PartnerBanner locale={locale} />
    </>
  );
}
