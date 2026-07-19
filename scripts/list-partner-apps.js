const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const agencies = await p.agencyProfile.findMany({
    include: { profile: { select: { fullName: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });
  const suppliers = await p.supplierProfile.findMany({
    include: { profile: { select: { fullName: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });
  console.log("── الوكالات والمصانع ──");
  for (const a of agencies) {
    console.log(`- ${a.companyName} | ${a.kind} | verified: ${a.verified} | ${a.profile.email} | role: ${a.profile.role}`);
  }
  console.log("── الموردون ──");
  for (const s of suppliers) {
    console.log(`- ${s.companyName} | verified: ${s.verified} | ${s.profile.email} | role: ${s.profile.role}`);
  }
  if (!agencies.length && !suppliers.length) console.log("(لا توجد طلبات)");
}

main().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => p.$disconnect());
