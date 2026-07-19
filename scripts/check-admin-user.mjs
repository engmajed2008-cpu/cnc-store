import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const admins = await p.adminUser.findMany({ select: { email: true, role: true, isActive: true } });
if (admins.length === 0) {
  console.log("No admin users found.");
} else {
  admins.forEach(a => console.log(`admin: ${a.email} | role: ${a.role} | active: ${a.isActive}`));
}
await p.$disconnect();
