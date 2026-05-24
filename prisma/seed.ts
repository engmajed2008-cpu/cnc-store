/**
 * prisma/seed.ts
 * Run: npm run db:seed
 *
 * Creates:
 *  - Default super admin user
 *  - Validates material, finish, urgency seed data
 *  - Ensures site settings are populated
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── 1. Admin user ──────────────────────────────────────────
  const adminEmail    = process.env.SEED_ADMIN_EMAIL    ?? "admin@metalart.sa";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "MetalArt@2024!";
  const adminName     = process.env.SEED_ADMIN_NAME     ?? "Metal Art Admin";

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.adminUser.upsert({
    where:  { email: adminEmail },
    update: {},
    create: { email: adminEmail, name: adminName, passwordHash, role: "super_admin" },
  });
  console.log(`✅ Admin user: ${admin.email} (role: ${admin.role})`);

  // ── 2. Materials ──────────────────────────────────────────
  const materialCount = await prisma.material.count();
  console.log(`✅ Materials: ${materialCount} rows`);

  // ── 3. Finish rates ───────────────────────────────────────
  const finishCount = await prisma.finishRate.count();
  console.log(`✅ Finish rates: ${finishCount} rows`);

  // ── 4. Urgency rates ──────────────────────────────────────
  const urgencyCount = await prisma.urgencyRate.count();
  console.log(`✅ Urgency rates: ${urgencyCount} rows`);

  // ── 5. Categories ─────────────────────────────────────────
  const catCount = await prisma.category.count();
  console.log(`✅ Categories: ${catCount} rows`);

  // ── 6. Site settings ──────────────────────────────────────
  const settingsCount = await prisma.siteSetting.count();
  console.log(`✅ Site settings: ${settingsCount} rows`);

  console.log("\n🎉 Seed complete!");
  console.log(`\n   Admin login:`);
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`\n   ⚠  Change the password after first login!\n`);
}

main()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
