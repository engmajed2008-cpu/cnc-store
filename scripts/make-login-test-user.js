const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { PrismaClient } = require("@prisma/client");

const envText = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"]*)"?\s*$/);
  if (m) env[m[1]] = m[2];
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const prisma = new PrismaClient();
const EMAIL = "e2e-loginflow@marketplace-test.local";
const PASSWORD = "LoginFlow-123!";

async function main() {
  const action = process.argv[2] ?? "create";
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = data?.users?.find((u) => u.email === EMAIL);

  if (action === "delete") {
    if (existing) {
      await prisma.agencyProfile.deleteMany({ where: { profileId: existing.id } });
      await prisma.supplierProfile.deleteMany({ where: { profileId: existing.id } });
      await prisma.profile.deleteMany({ where: { id: existing.id } });
      await admin.auth.admin.deleteUser(existing.id);
      console.log("deleted");
    } else console.log("not found");
    return;
  }

  if (existing) { console.log("exists:", EMAIL); return; }
  const { error } = await admin.auth.admin.createUser({
    email: EMAIL, password: PASSWORD, email_confirm: true,
    user_metadata: { full_name: "اختبار الدخول" },
  });
  if (error) throw new Error(error.message);
  console.log("created:", EMAIL, "/", PASSWORD);
}

main().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
