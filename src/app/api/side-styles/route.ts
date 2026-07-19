import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

const FALLBACK = [
  { slug: "solid",    nameAr: "صماء",          nameEn: "Solid",           descriptionAr: "جانب مصمت كلياً — الخيار الأساسي",        svgPatternId: "",           priceAddPercent: 0,  metalOnly: true, sortOrder: 0 },
  { slug: "dots",     nameAr: "نقاط دائرية",   nameEn: "Circular Dots",   descriptionAr: "ثقوب دائرية منتظمة — ضوء ناعم ومتوزع",   svgPatternId: "pat-dots",   priceAddPercent: 8,  metalOnly: true, sortOrder: 1 },
  { slug: "slots",    nameAr: "شرائح أفقية",   nameEn: "Horizontal Slots", descriptionAr: "فتحات مستطيلة أفقية — ضوء متدرج مخطط",  svgPatternId: "pat-slots",  priceAddPercent: 8,  metalOnly: true, sortOrder: 2 },
  { slug: "squares",  nameAr: "مربعات هندسية", nameEn: "Grid Squares",    descriptionAr: "فتحات مربعة منتظمة — مظهر عصري نظيف",    svgPatternId: "pat-grid",   priceAddPercent: 10, metalOnly: true, sortOrder: 3 },
  { slug: "diamonds", nameAr: "معينات",        nameEn: "Diamonds",        descriptionAr: "فتحات ماسية — مظهر فاخر راقٍ",           svgPatternId: "pat-diamond",priceAddPercent: 10, metalOnly: true, sortOrder: 4 },
  { slug: "arabic",   nameAr: "نمط عربي",      nameEn: "Arabic Pattern",  descriptionAr: "زخرفة عربية أصيلة — ضوء دافئ ومتوهج",   svgPatternId: "pat-arabic", priceAddPercent: 15, metalOnly: true, sortOrder: 5 },
];

const CACHE = new Map<string, { data: unknown; ts: number }>();
const TTL = 5 * 60 * 1000;

export async function GET() {
  const cached = CACHE.get("side-styles");
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json(cached.data, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" },
    });
  }
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 4000)
    );
    const query = prisma.sideStyle.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        slug: true, nameAr: true, nameEn: true, descriptionAr: true,
        svgPatternId: true, priceAddPercent: true, metalOnly: true, sortOrder: true,
      },
    });
    const rows = await Promise.race([query, timeout]);
    const data = { sideStyles: rows.map(r => ({ ...r, priceAddPercent: Number(r.priceAddPercent) })) };
    CACHE.set("side-styles", { data, ts: Date.now() });
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" },
    });
  } catch {
    return NextResponse.json({ sideStyles: FALLBACK }, {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  }
}
