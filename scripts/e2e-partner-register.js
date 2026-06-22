/**
 * scripts/e2e-partner-register.js — اختبار التسجيل بخطوة واحدة (حساب + طلب)
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
const EMAIL = "e2e-onestep@marketplace-test.local";
const PASSWORD = "OneStep-Pass-123!";

let pass = 0, fail = 0;
function check(name, ok, extra) {
  if (ok) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}${extra ? " — " + extra : ""}`); }
}

async function deleteIfExists(email) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const u = data?.users?.find((x) => x.email === email);
  if (u) {
    await prisma.agencyProfile.deleteMany({ where: { profileId: u.id } });
    await prisma.supplierProfile.deleteMany({ where: { profileId: u.id } });
    await prisma.profile.deleteMany({ where: { id: u.id } });
    await admin.auth.admin.deleteUser(u.id);
  }
}

async function main() {
  console.log("🧪 التسجيل بخطوة واحدة — E2E\n");
  await deleteIfExists(EMAIL);

  const PHONE = "+966551112222";

  // ── رفع مستند السجل التجاري ──
  const fd = new FormData();
  fd.append("file", new Blob([Buffer.from("fake-cr-image")], { type: "image/png" }), "cr-test.png");
  const up = await fetch(BASE + "/api/partners/upload-cr", { method: "POST", body: fd });
  const upJson = await up.json().catch(() => ({}));
  check("رفع مستند السجل → 201 + proof", up.status === 201 && Boolean(upJson.docProof), `got ${up.status}`);

  // ── رفع صورة هوية المالك ──
  const fdOwner = new FormData();
  fdOwner.append("file", new Blob([Buffer.from("fake-owner-id-image")], { type: "image/png" }), "owner-id-test.png");
  fdOwner.append("kind", "owner-id");
  const upOwner = await fetch(BASE + "/api/partners/upload-cr", { method: "POST", body: fdOwner });
  const upOwnerJson = await upOwner.json().catch(() => ({}));
  check("رفع هوية المالك → 201 + مسار owner-ids", upOwner.status === 201 && (upOwnerJson.storagePath ?? "").startsWith("owner-ids/"), `got ${upOwner.status}: ${upOwnerJson.storagePath}`);

  const badType = new FormData();
  badType.append("file", new Blob([Buffer.from("x")], { type: "text/plain" }), "x.txt");
  const upBad = await fetch(BASE + "/api/partners/upload-cr", { method: "POST", body: badType });
  check("صيغة ملف مرفوضة → 400", upBad.status === 400, `got ${upBad.status}`);

  // ── دورة OTP ──
  const status = await fetch(BASE + "/api/otp/send").then((r) => r.json());
  check("خدمة OTP مفعّلة (dev mode)", status.enabled === true);

  const sent = await fetch(BASE + "/api/otp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: PHONE }),
  });
  const sentJson = await sent.json().catch(() => ({}));
  check("إرسال رمز → 200 + devCode", sent.status === 200 && /^\d{6}$/.test(sentJson.devCode ?? ""), `got ${sent.status}`);

  const wrong = await fetch(BASE + "/api/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: PHONE, code: "000000" }),
  });
  check("رمز خاطئ → 401", wrong.status === 401, `got ${wrong.status}`);

  const verified = await fetch(BASE + "/api/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: PHONE, code: sentJson.devCode }),
  });
  const verifiedJson = await verified.json().catch(() => ({}));
  check("الرمز الصحيح → phoneProof", verified.status === 200 && Boolean(verifiedJson.phoneProof), `got ${verified.status}`);

  // ── دورة تأكيد البريد ──
  const emailStatus = await fetch(BASE + "/api/otp/email/send").then((r) => r.json());
  check("خدمة تأكيد البريد مفعّلة (dev mode)", emailStatus.enabled === true);

  const emailSent = await fetch(BASE + "/api/otp/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL }),
  });
  const emailSentJson = await emailSent.json().catch(() => ({}));
  check("إرسال رمز البريد → 200 + devCode", emailSent.status === 200 && /^\d{6}$/.test(emailSentJson.devCode ?? ""), `got ${emailSent.status}`);

  const emailVerified = await fetch(BASE + "/api/otp/email/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, code: emailSentJson.devCode }),
  });
  const emailVerifiedJson = await emailVerified.json().catch(() => ({}));
  check("رمز البريد الصحيح → emailProof", emailVerified.status === 200 && Boolean(emailVerifiedJson.emailProof), `got ${emailVerified.status}`);

  const payload = {
    fullName: "مسؤول تجريبي",
    email: EMAIL,
    emailProof: emailVerifiedJson.emailProof,
    password: PASSWORD,
    entityType: "AD_AGENCY",
    companyName: "وكالة الخطوة الواحدة",
    crNumberType: "CR",
    crNumber: "4030077777",
    amanaId: "amana-jeddah",
    cityId: "city-jeddah",
    phone: PHONE,
    phoneProof: verifiedJson.phoneProof,
    crDocPath: upJson.storagePath,
    crDocProof: upJson.docProof,
    ownerIdNumber: "1087654321",
    ownerIdDocPath: upOwnerJson.storagePath,
    ownerIdDocProof: upOwnerJson.docProof,
    pledgeAccepted: true,
  };

  // الشروط الديناميكية للتعهد متاحة للعموم
  const pledge = await fetch(BASE + "/api/partners/pledge").then((r) => r.json()).catch(() => ({}));
  check("شروط التعهد متاحة (عام)", Array.isArray(pledge.terms) && pledge.terms.length > 0, JSON.stringify(pledge).slice(0, 120));

  // مسار مستند مزوّر (بلا إثبات صحيح) → يُرفض
  const fakeDoc = await fetch(BASE + "/api/partners/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, crDocPath: "cr-docs/hacked/evil.png" }),
  });
  check("مسار مستند مزوّر → 400", fakeDoc.status === 400, `got ${fakeDoc.status}`);

  // بدون إثبات تحقق → يُرفض
  const noProof = await fetch(BASE + "/api/partners/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, phoneProof: undefined }),
  });
  check("تسجيل بدون تحقق الجوال → 400", noProof.status === 400, `got ${noProof.status}`);

  // بدون تأكيد البريد → يُرفض
  const noEmail = await fetch(BASE + "/api/partners/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, emailProof: undefined }),
  });
  check("تسجيل بدون تأكيد البريد → 400", noEmail.status === 400, `got ${noEmail.status}`);

  // حد التسجيل 3/دقيقة واستُهلكت المحاولات الثلاث في الفحوص السلبية — ننتظر نافذة جديدة
  console.log("  ⏳ انتظار 61 ثانية لنافذة حد المحاولات...");
  await new Promise((r) => setTimeout(r, 61_000));

  // كلمة مرور ضعيفة → تُرفض من السيرفر
  const weakPw = await fetch(BASE + "/api/partners/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, password: "12345678" }),
  });
  check("كلمة مرور ضعيفة → 400", weakPw.status === 400, `got ${weakPw.status}`);

  const res = await fetch(BASE + "/api/partners/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = await res.json().catch(() => ({}));
  check("تسجيل جديد → 201", res.status === 201, `got ${res.status}: ${JSON.stringify(j)?.slice(0, 150)}`);

  // الحساب أُنشئ ويمكن الدخول به
  const { data: si, error: siErr } = await anon.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  check("الدخول بالحساب الجديد يعمل", !siErr && Boolean(si?.session));

  const userId = si?.user?.id;
  const profile = userId ? await prisma.profile.findUnique({ where: { id: userId } }) : null;
  check("profile موجود + الجوال محفوظ بالصيغة الدولية", profile?.phone === "+966551112222");
  check("phoneVerifiedAt مسجَّل", Boolean(profile?.phoneVerifiedAt));
  check("الدور CUSTOMER حتى الموافقة", profile?.role === "CUSTOMER");

  const agency = userId ? await prisma.agencyProfile.findUnique({ where: { profileId: userId } }) : null;
  check("طلب الانضمام مسجَّل (verified=false)", agency?.verified === false && agency?.companyName === "وكالة الخطوة الواحدة");
  check("المدينة محفوظة + الأمانة مطابَقة تلقائياً (جدة)", agency?.city === "جدة" && agency?.amanaId === "amana-jeddah");
  check("هوية المالك + التعهد محفوظان", agency?.ownerIdNumber === "1087654321" && Boolean(agency?.ownerIdDocPath) && Boolean(agency?.pledgeAcceptedAt));

  // بريد مكرر → 409 (ننتظر انقضاء نافذة حد المحاولات: 3 تسجيلات/دقيقة)
  console.log("  ⏳ انتظار 61 ثانية لنافذة حد المحاولات...");
  await new Promise((r) => setTimeout(r, 61_000));
  const dup = await fetch(BASE + "/api/partners/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  check("بريد مكرر → 409", dup.status === 409, `got ${dup.status}`);

  console.log(`\nالنتيجة: ${pass} ناجح / ${fail} فاشل`);
  if (fail > 0) process.exitCode = 1;
}

main()
  .catch((e) => { console.error("💥 فشل:", e.message); process.exitCode = 1; })
  .finally(async () => { await deleteIfExists(EMAIL); console.log("🧹 تم التنظيف."); await prisma.$disconnect(); });
