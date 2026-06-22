export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

const FALLBACK = [
  { slug: "acrylic-alum",   nameAr: "أكريليك + ألومنيوم", nameEn: "Acrylic + Aluminum", tagAr: "الأكثر مبيعاً", faceMaterial: "acrylic",   sideMaterial: "aluminum",  lighting: "front", rateMultiplier: 0.75, gradientCss: "linear-gradient(135deg,#dff0ff,#f0f8ff,#cce4f8)", availableColors: ["white","black","red","blue","green","gold","copper","silver"], colorful: true, sortOrder: 0 },
  { slug: "stainless",      nameAr: "إستانلس ستيل",       nameEn: "Stainless Steel",    tagAr: "فاخر · عاكس",   faceMaterial: "stainless", sideMaterial: "stainless", lighting: "none", rateMultiplier: 2.80, gradientCss: "linear-gradient(135deg,#3a3a3a,#9aa0a6 45%,#e9edf0 60%,#7c7f84)", availableColors: ["gold","silver"], colorful: false, sortOrder: 1 },
  { slug: "acrylic-zincor", nameAr: "أكريليك + زنكور",    nameEn: "Acrylic + Zincor",   tagAr: "جوانب مخصصة",   faceMaterial: "acrylic",   sideMaterial: "zincor",   lighting: "front", rateMultiplier: 1.10, gradientCss: "linear-gradient(135deg,#ffdada,#fff0f0,#f8cccc)", availableColors: ["white","black","red","blue","green","gold","silver"], colorful: true, sortOrder: 2 },
  { slug: "zincor-full",    nameAr: "زنكور شامل",          nameEn: "Full Zincor",        tagAr: "هالة خلفية",     faceMaterial: "zincor",    sideMaterial: "zincor",   lighting: "back", rateMultiplier: 1.50, gradientCss: "linear-gradient(135deg,#2a3540,#1c252e)", availableColors: ["white","black","red","blue","green","gold","copper","silver"], colorful: true, sortOrder: 3 },
  { slug: "acrylic-full",   nameAr: "أكريليك شامل",       nameEn: "Full Acrylic",       tagAr: "توهج كامل",     faceMaterial: "acrylic",   sideMaterial: "acrylic",  lighting: "both", rateMultiplier: 0.75, gradientCss: "linear-gradient(135deg,#ffe0a0,#fff4d0,#ffd060)", availableColors: ["white","black","red","blue","green","gold","copper","silver"], colorful: true, sortOrder: 4 },
];

export async function GET() {
  try {
    const rows = await prisma.letterType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        slug: true, nameAr: true, nameEn: true, tagAr: true,
        faceMaterial: true, sideMaterial: true, lighting: true,
        rateMultiplier: true, gradientCss: true, availableColors: true,
        colorful: true, sortOrder: true,
      },
    });
    const data = rows.map(r => ({ ...r, rateMultiplier: Number(r.rateMultiplier) }));
    return NextResponse.json({ letterTypes: data });
  } catch {
    return NextResponse.json({ letterTypes: FALLBACK });
  }
}
