import { setRequestLocale } from "next-intl/server";
import ConfiguratorPage from "@/components/configure/ConfiguratorPage";

export default async function ConfigurePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ConfiguratorPage locale={locale} />;
}
