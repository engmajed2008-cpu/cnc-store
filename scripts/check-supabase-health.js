const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const envText = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"]*)"?\s*$/);
  if (m) env[m[1]] = m[2];
}

const prisma = new PrismaClient();

async function main() {
  const rest = await fetch(env.NEXT_PUBLIC_SUPABASE_URL + "/auth/v1/health", {
    headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    signal: AbortSignal.timeout(8000),
  }).then((r) => r.ok).catch(() => false);

  const db = await prisma.$queryRawUnsafe("select 1").then(() => true).catch(() => false);

  console.log(JSON.stringify({ rest, db }));
  process.exitCode = rest && db ? 0 : 1;
}

main().finally(() => prisma.$disconnect());
