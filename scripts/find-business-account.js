const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const envText = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"]*)"?\s*$/);
  if (m) env[m[1]] = m[2];
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

admin.auth.admin.listUsers({ perPage: 1000 }).then(({ data, error }) => {
  if (error) { console.error(error.message); process.exit(1); }
  if (!data.users.length) { console.log("لا يوجد أي مستخدم مسجَّل بعد."); return; }
  for (const u of data.users) {
    const name = u.user_metadata?.full_name ?? u.user_metadata?.name ?? "";
    console.log(`- ${u.email} | الاسم: ${name || "(بدون اسم)"} | أُنشئ: ${u.created_at?.slice(0, 10)}`);
  }
});
