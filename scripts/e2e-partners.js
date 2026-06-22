/**
 * scripts/e2e-partners.js — اختبار مسار انضمام الشركاء
 * 1. مستخدم جديد يقدّم طلب انضمام (منشأة صناعة)
 * 2. أدمن يسجّل دخوله ويرى الطلب في القائمة
 * 3. الأدمن يوافق → الدور يصبح AGENCY و verified=true
 * 4. مستخدم ثانٍ يقدّم كمورد → موافقة → SUPPLIER
 * 5. تنظيف كامل
 */

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
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const prisma = new PrismaClient();
const BASE = "http://localhost:3000";
const PASSWORD = "E2e-Partner-123!";

let pass = 0, fail = 0;
function check(name, ok, extra) {
  if (ok) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}${extra ? " — " + extra : ""}`); }
}

async function ensureUser(email, fullName) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = data?.users?.find((u) => u.email === email);
  if (existing) {
    await prisma.agencyProfile.deleteMany({ where: { profileId: existing.id } });
    await prisma.supplierProfile.deleteMany({ where: { profileId: existing.id } });
    await prisma.profile.deleteMany({ where: { id: existing.id } });
    await admin.auth.admin.deleteUser(existing.id);
  }
  const { data: created, error } = await admin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw new Error(error.message);
  return created.user;
}

async function signIn(email) {
  const { data, error } = await anon.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(error.message);
  return data.session.access_token;
}

// رفع مستند تجريبي (سجل تجاري أو هوية مالك) → { storagePath, docProof }
async function uploadCrDoc(kind = "cr") {
  const fd = new FormData();
  fd.append("file", new Blob([Buffer.from("fake-" + kind + "-image")], { type: "image/png" }), kind + "-test.png");
  fd.append("kind", kind);
  const r = await fetch(BASE + "/api/partners/upload-cr", { method: "POST", body: fd });
  const j = await r.json();
  if (!j.docProof) throw new Error("فشل رفع مستند الاختبار: " + JSON.stringify(j).slice(0, 120));
  return j;
}

// دورة تأكيد البريد (وضع التطوير): إرسال → devCode → تحقق → emailProof
async function getEmailProof(email) {
  const sent = await fetch(BASE + "/api/otp/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  }).then((r) => r.json());
  if (!sent.devCode) throw new Error("Email OTP dev mode غير مفعّل: " + JSON.stringify(sent).slice(0, 120));
  const verified = await fetch(BASE + "/api/otp/email/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code: sent.devCode }),
  }).then((r) => r.json());
  if (!verified.emailProof) throw new Error("فشل تأكيد البريد");
  return verified.emailProof;
}

// دورة OTP (وضع التطوير): إرسال → devCode → تحقق → phoneProof
async function getPhoneProof(phone) {
  const sent = await fetch(BASE + "/api/otp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  }).then((r) => r.json());
  if (!sent.devCode) throw new Error("OTP dev mode غير مفعّل");
  const verified = await fetch(BASE + "/api/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code: sent.devCode }),
  }).then((r) => r.json());
  if (!verified.phoneProof) throw new Error("فشل تحقق OTP");
  return verified.phoneProof;
}

async function api(pathname, { method = "GET", token, body, cookie } = {}) {
  const res = await fetch(BASE + pathname, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json, headers: res.headers };
}

let mfgUser, supUser;

async function main() {
  console.log("🧪 مسار انضمام الشركاء — E2E\n");

  mfgUser = await ensureUser("e2e-manufacturer@marketplace-test.local", "مصنع تجريبي");
  supUser = await ensureUser("e2e-supplier@marketplace-test.local", "مورد تجريبي");
  await new Promise((r) => setTimeout(r, 1200));

  const mfgToken = await signIn("e2e-manufacturer@marketplace-test.local");
  const supToken = await signIn("e2e-supplier@marketplace-test.local");

  // 1) تقديم الطلبات
  console.log("1) تقديم طلبات الانضمام");
  // حد الرفع 5/دقيقة — نرفع 4 مستندات ونعيد استخدام مستندات المصنع في اختبار التكرار
  const doc1 = await uploadCrDoc("cr");
  const owner1 = await uploadCrDoc("owner-id");
  const mfgEmailProof = await getEmailProof("e2e-manufacturer@marketplace-test.local");
  const apply1 = await api("/api/partners", {
    method: "POST", token: mfgToken,
    body: { entityType: "MANUFACTURER", fullName: "مدير المصنع التجريبي", companyName: "مصنع اللوحات التجريبي", crNumberType: "CR", crNumber: "4030099999", amanaId: "amana-jeddah", cityId: "city-jeddah", phone: "+966550000001", phoneProof: await getPhoneProof("+966550000001"), emailProof: mfgEmailProof, crDocPath: doc1.storagePath, crDocProof: doc1.docProof, ownerIdNumber: "1012345678", ownerIdDocPath: owner1.storagePath, ownerIdDocProof: owner1.docProof, pledgeAccepted: true },
  });
  check("تقديم منشأة صناعة → 201", apply1.status === 201, `got ${apply1.status}: ${JSON.stringify(apply1.json)?.slice(0, 150)}`);

  const dup = await api("/api/partners", {
    method: "POST", token: mfgToken,
    body: { entityType: "AD_AGENCY", fullName: "تكرار", companyName: "تكرار", crNumberType: "CR", crNumber: "4030011111", amanaId: "amana-jeddah", cityId: "city-jeddah", phone: "+966550000009", phoneProof: await getPhoneProof("+966550000009"), emailProof: mfgEmailProof, crDocPath: doc1.storagePath, crDocProof: doc1.docProof, ownerIdNumber: "1012345678", ownerIdDocPath: owner1.storagePath, ownerIdDocProof: owner1.docProof, pledgeAccepted: true },
  });
  check("طلب مكرر لنفس الحساب → 409", dup.status === 409, `got ${dup.status}`);

  const doc3 = await uploadCrDoc("cr");
  const owner3 = await uploadCrDoc("owner-id");
  const supEmailProof = await getEmailProof("e2e-supplier@marketplace-test.local");
  const supPhoneProof = await getPhoneProof("+966550000002"); // ثالث إرسال — حد 3/دقيقة
  const apply2 = await api("/api/partners", {
    method: "POST", token: supToken,
    body: { entityType: "SUPPLIER", fullName: "مدير المورد التجريبي", companyName: "مورد الخامات التجريبي", crNumberType: "UNIFIED", crNumber: "7030088888", amanaId: "amana-jeddah", cityId: "city-jeddah", phone: "+966550000002", phoneProof: supPhoneProof, emailProof: supEmailProof, crDocPath: doc3.storagePath, crDocProof: doc3.docProof, ownerIdNumber: "2098765432", ownerIdDocPath: owner3.storagePath, ownerIdDocProof: owner3.docProof, pledgeAccepted: true },
  });
  check("تقديم مورد (بالرقم الموحد) → 201", apply2.status === 201, `got ${apply2.status}: ${JSON.stringify(apply2.json)?.slice(0, 150)}`);

  // بدون إثبات تأكيد البريد → 400 (إعادة استخدام إثبات الجوال — الإثباتات صالحة لعدة دقائق)
  const noEmailProof = await api("/api/partners", {
    method: "POST", token: supToken,
    body: { entityType: "SUPPLIER", fullName: "بلا بريد", companyName: "بلا بريد", crNumberType: "CR", crNumber: "4030012345", amanaId: "amana-jeddah", cityId: "city-jeddah", phone: "+966550000002", phoneProof: supPhoneProof, crDocPath: doc3.storagePath, crDocProof: doc3.docProof, ownerIdNumber: "2098765432", ownerIdDocPath: owner3.storagePath, ownerIdDocProof: owner3.docProof, pledgeAccepted: true },
  });
  check("بدون تأكيد البريد → 400", noEmailProof.status === 400, `got ${noEmailProof.status}`);

  // تعهد غير موافَق عليه → 400
  const badPledge = await api("/api/partners", {
    method: "POST", token: supToken,
    body: { entityType: "SUPPLIER", fullName: "بلا تعهد", companyName: "بلا تعهد", crNumberType: "UNIFIED", crNumber: "7030012345", amanaId: "amana-jeddah", cityId: "city-jeddah", phone: "+966550000002", emailProof: supEmailProof, crDocPath: doc3.storagePath, crDocProof: doc3.docProof, ownerIdNumber: "2098765432", ownerIdDocPath: owner3.storagePath, ownerIdDocProof: owner3.docProof, pledgeAccepted: false },
  });
  check("بدون موافقة على التعهد → 400", badPledge.status === 400, `got ${badPledge.status}`);

  const status1 = await api("/api/partners", { token: mfgToken });
  check("حالة الطلب: قيد المراجعة (verified=false)", status1.json?.application?.verified === false);

  // قبل الموافقة: لا يستطيع سرد طلبات العملاء
  const beforeList = await api("/api/requests", { token: mfgToken });
  check("قبل الموافقة: ممنوع من سرد الطلبات → 403", beforeList.status === 403, `got ${beforeList.status}`);

  // 2) دخول الأدمن
  console.log("\n2) دخول الأدمن ومراجعة الطلبات");
  const noAuth = await api("/api/admin/partners");
  check("قائمة الأدمن بدون جلسة → 401", noAuth.status === 401, `got ${noAuth.status}`);

  const login = await api("/api/admin/login", {
    method: "POST",
    body: { email: env.SEED_ADMIN_EMAIL || "admin@metalart.sa", password: env.SEED_ADMIN_PASSWORD || "MetalArt@2024!" },
  });
  check("دخول الأدمن → 200", login.status === 200, `got ${login.status}: ${JSON.stringify(login.json)?.slice(0, 120)}`);
  const setCookie = login.headers.get("set-cookie") ?? "";
  const cookie = setCookie.split(";")[0];

  const list = await api("/api/admin/partners", { cookie });
  const agencyApp = list.json?.agencies?.find((a) => a.companyName === "مصنع اللوحات التجريبي");
  const supplierApp = list.json?.suppliers?.find((s) => s.companyName === "مورد الخامات التجريبي");
  check("الأدمن يرى طلب المصنع (kind=MANUFACTURER)", agencyApp?.kind === "MANUFACTURER");
  check("الأدمن يرى طلب المورد", Boolean(supplierApp));
  check("المدينة + الأمانة المطابَقة + رابط المستند", agencyApp?.city === "جدة" && agencyApp?.amana?.nameAr?.includes("جدة") && Boolean(agencyApp?.crDocUrl));
  check("هوية المالك + رابط صورتها + تاريخ التعهد", agencyApp?.ownerIdNumber === "1012345678" && Boolean(agencyApp?.ownerIdDocUrl) && Boolean(agencyApp?.pledgeAcceptedAt));
  check("نوع الرقم الموحد محفوظ للمورد", supplierApp?.crNumberType === "UNIFIED" && supplierApp?.crNumber === "7030088888");

  // 3) الموافقة
  console.log("\n3) الموافقة اليدوية");
  const d1 = await api("/api/admin/partners/decision", {
    method: "POST", cookie,
    body: { type: "agency", id: agencyApp.id, action: "approve" },
  });
  check("موافقة على المصنع → AGENCY", d1.status === 200 && d1.json?.role === "AGENCY", `got ${d1.status}`);

  const d2 = await api("/api/admin/partners/decision", {
    method: "POST", cookie,
    body: { type: "supplier", id: supplierApp.id, action: "approve" },
  });
  check("موافقة على المورد → SUPPLIER", d2.status === 200 && d2.json?.role === "SUPPLIER", `got ${d2.status}`);

  const mfgProfile = await prisma.profile.findUnique({ where: { id: mfgUser.id } });
  const supProfile = await prisma.profile.findUnique({ where: { id: supUser.id } });
  check("دور المصنع في القاعدة = AGENCY", mfgProfile?.role === "AGENCY");
  check("دور المورد في القاعدة = SUPPLIER", supProfile?.role === "SUPPLIER");

  // 4) بعد الموافقة يستطيع المصنع سرد الطلبات
  const afterList = await api("/api/requests", { token: mfgToken });
  check("بعد الموافقة: المصنع يسرد طلبات أمانته → 200", afterList.status === 200, `got ${afterList.status}`);

  console.log(`\nالنتيجة: ${pass} ناجح / ${fail} فاشل`);
  if (fail > 0) process.exitCode = 1;
}

async function cleanup() {
  console.log("\n🧹 تنظيف...");
  try {
    const ids = [mfgUser?.id, supUser?.id].filter(Boolean);
    await prisma.agencyProfile.deleteMany({ where: { profileId: { in: ids } } });
    await prisma.supplierProfile.deleteMany({ where: { profileId: { in: ids } } });
    await prisma.profile.deleteMany({ where: { id: { in: ids } } });
    for (const id of ids) await admin.auth.admin.deleteUser(id);
    console.log("   تم.");
  } catch (e) {
    console.error("   تحذير:", e.message);
  }
}

main()
  .catch((e) => { console.error("💥 فشل:", e.message); process.exitCode = 1; })
  .finally(async () => { await cleanup(); await prisma.$disconnect(); });
