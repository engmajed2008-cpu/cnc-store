/**
 * scripts/e2e-marketplace.js — Phase 0 end-to-end smoke test.
 *
 * Flow:
 *  1. Create test auth users (customer + agency) via service role
 *  2. Verify the on_auth_user_created trigger created profiles rows
 *  3. Upgrade agency profile → AGENCY + agency_profiles (amana-jeddah)
 *  4. Customer creates a request via POST /api/requests
 *  5. Agency lists requests via GET /api/requests
 *  6. Agency submits an offer via POST /api/requests/[id]/offers
 *  7. Verify request status moved to OFFERS + duplicate offer → 409
 *  8. Cleanup: delete request, agency profile, profiles, auth users
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { PrismaClient } = require("@prisma/client");

// ── env ──────────────────────────────────────────────────────
const envText = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"]*)"?\s*$/);
  if (m) env[m[1]] = m[2];
}
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const BASE = "http://localhost:3000";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const prisma = new PrismaClient();

const CUSTOMER_EMAIL = "e2e-customer@marketplace-test.local";
const AGENCY_EMAIL = "e2e-agency@marketplace-test.local";
const PASSWORD = "E2e-Test-Pass-123!";

let pass = 0, fail = 0;
function check(name, ok, extra) {
  if (ok) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}${extra ? " — " + extra : ""}`); }
}

async function findUserByEmail(email) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  return data?.users?.find((u) => u.email === email) ?? null;
}

async function ensureUser(email, fullName) {
  const existing = await findUserByEmail(email);
  if (existing) {
    await admin.auth.admin.deleteUser(existing.id);
    await prisma.profile.deleteMany({ where: { id: existing.id } });
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw new Error(`createUser(${email}): ${error.message}`);
  return data.user;
}

async function signIn(email) {
  const { data, error } = await anon.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`signIn(${email}): ${error.message}`);
  return data.session.access_token;
}

async function api(pathname, { method = "GET", token, body } = {}) {
  const res = await fetch(BASE + pathname, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

let customerUser, agencyUser, requestId;

async function main() {
  console.log("🧪 Marketplace Phase 0 — E2E\n");

  // 1) Create users (trigger should create profiles)
  console.log("1) إنشاء مستخدمي الاختبار");
  customerUser = await ensureUser(CUSTOMER_EMAIL, "عميل تجريبي");
  agencyUser = await ensureUser(AGENCY_EMAIL, "وكالة تجريبية");

  // 2) Trigger check
  await new Promise((r) => setTimeout(r, 1500));
  const custProfile = await prisma.profile.findUnique({ where: { id: customerUser.id } });
  const agProfile = await prisma.profile.findUnique({ where: { id: agencyUser.id } });
  check("Trigger أنشأ profile للعميل (role=CUSTOMER)", custProfile?.role === "CUSTOMER");
  check("Trigger أنشأ profile للوكالة + fullName", agProfile?.fullName === "وكالة تجريبية");

  // 3) Upgrade agency
  await prisma.profile.update({ where: { id: agencyUser.id }, data: { role: "AGENCY" } });
  await prisma.agencyProfile.upsert({
    where: { profileId: agencyUser.id },
    update: { amanaId: "amana-jeddah", verified: true },
    create: {
      profileId: agencyUser.id,
      companyName: "وكالة الاختبار للدعاية",
      amanaId: "amana-jeddah",
      verified: true,
    },
  });
  console.log("  ✅ ترقية حساب الوكالة إلى AGENCY مرتبطة بأمانة جدة");

  // tokens
  const custToken = await signIn(CUSTOMER_EMAIL);
  const agToken = await signIn(AGENCY_EMAIL);

  // pick a SERVICE category
  const category = await prisma.category.findFirst({ where: { kind: "SERVICE", isActive: true } });
  if (!category) throw new Error("لا توجد فئة SERVICE نشطة");

  // unauthenticated → 401
  const unauth = await api("/api/requests", { method: "POST", body: {} });
  check("بدون توكن → 401", unauth.status === 401, `got ${unauth.status}`);

  // 4) Customer creates request
  console.log("\n2) العميل ينشئ طلباً");
  const created = await api("/api/requests", {
    method: "POST",
    token: custToken,
    body: {
      municipalityId: "mun-jeddah-albalad",
      categoryId: category.id,
      title: "لوحة محل أحذية — حروف بارزة",
      specs: { signType: "raised-letters", widthCm: 300, heightCm: 80 },
      attachments: [],
      budgetEstimate: 4500,
    },
  });
  check("POST /api/requests → 201 + OPEN", created.status === 201 && created.json?.request?.status === "OPEN",
    `got ${created.status}: ${JSON.stringify(created.json)?.slice(0, 200)}`);
  requestId = created.json?.request?.id;
  check("لقطة الدليل التنظيمي (guideVersion=draft-0)", created.json?.request?.guideVersion === "draft-0");

  // agency cannot create a request
  const agCreate = await api("/api/requests", {
    method: "POST", token: agToken,
    body: { municipalityId: "mun-jeddah-albalad", categoryId: category.id, title: "تجربة", specs: {} },
  });
  check("الوكالة لا تستطيع إنشاء طلب → 403", agCreate.status === 403, `got ${agCreate.status}`);

  // 5) Agency lists
  console.log("\n3) الوكالة تسرد الطلبات المفتوحة");
  const listed = await api("/api/requests", { token: agToken });
  const found = listed.json?.requests?.some((r) => r.id === requestId);
  check("GET /api/requests → 200 ويتضمن الطلب", listed.status === 200 && found, `got ${listed.status}`);

  const custList = await api("/api/requests", { token: custToken });
  check("العميل لا يستطيع سرد طلبات الوكالات → 403", custList.status === 403, `got ${custList.status}`);

  // 6) Agency offers
  console.log("\n4) الوكالة تقدّم عرضاً");
  const offer = await api(`/api/requests/${requestId}/offers`, {
    method: "POST", token: agToken,
    body: { price: 3900, leadTimeDays: 10, notes: "شامل التركيب والتصريح", attachments: [] },
  });
  check("POST offers → 201", offer.status === 201, `got ${offer.status}: ${JSON.stringify(offer.json)?.slice(0, 200)}`);

  const dup = await api(`/api/requests/${requestId}/offers`, {
    method: "POST", token: agToken,
    body: { price: 3500, leadTimeDays: 7 },
  });
  check("عرض مكرر من نفس الوكالة → 409", dup.status === 409, `got ${dup.status}`);

  // 7) Status check + detail access
  console.log("\n5) التحقق من الحالة والوصول");
  const detail = await api(`/api/requests/${requestId}`, { token: custToken });
  check("الحالة انتقلت إلى OFFERS", detail.json?.request?.status === "OFFERS",
    `got ${detail.json?.request?.status}`);
  check("صاحب الطلب يرى العروض (1)", detail.json?.request?.offers?.length === 1);

  const agDetail = await api(`/api/requests/${requestId}`, { token: agToken });
  check("الوكالة ترى الطلب وعرضها", agDetail.status === 200 && agDetail.json?.request?.offers?.length === 1);

  console.log(`\nالنتيجة: ${pass} ناجح / ${fail} فاشل`);
  if (fail > 0) process.exitCode = 1;
}

async function cleanup() {
  console.log("\n🧹 تنظيف بيانات الاختبار...");
  try {
    if (requestId) await prisma.request.deleteMany({ where: { id: requestId } });
    if (agencyUser) await prisma.agencyProfile.deleteMany({ where: { profileId: agencyUser.id } });
    const ids = [customerUser?.id, agencyUser?.id].filter(Boolean);
    if (ids.length) await prisma.profile.deleteMany({ where: { id: { in: ids } } });
    for (const id of ids) await admin.auth.admin.deleteUser(id);
    console.log("   تم التنظيف.");
  } catch (e) {
    console.error("   تحذير أثناء التنظيف:", e.message);
  }
}

main()
  .catch((e) => { console.error("\n💥 فشل الاختبار:", e.message); process.exitCode = 1; })
  .finally(async () => { await cleanup(); await prisma.$disconnect(); });
