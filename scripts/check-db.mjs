import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const [lt, ss] = await Promise.all([p.letterType.count(), p.sideStyle.count()]);
console.log("letter_types:", lt, "| side_styles:", ss);
if (lt > 0) {
  const rows = await p.letterType.findMany({ select: { slug: true, nameAr: true, isActive: true } });
  rows.forEach(r => console.log(" LT:", r.slug, r.nameAr, r.isActive ? "✓" : "✗"));
}
if (ss > 0) {
  const rows = await p.sideStyle.findMany({ select: { slug: true, nameAr: true, isActive: true } });
  rows.forEach(r => console.log(" SS:", r.slug, r.nameAr, r.isActive ? "✓" : "✗"));
}
await p.$disconnect();
