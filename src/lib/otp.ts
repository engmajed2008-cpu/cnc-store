/**
 * src/lib/otp.ts — التحقق من الجوال برمز OTP
 *
 * - توليد رمز 6 أرقام وتخزينه مجزّأً (SHA-256 + secret) في phone_otps
 * - الإرسال عبر مزوّد SMS قابل للتهيئة بمتغيرات البيئة:
 *     Msegat : MSEGAT_USERNAME, MSEGAT_API_KEY, MSEGAT_SENDER
 *     Twilio : TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
 *     تطوير : OTP_DEV_MODE=true (لا إرسال — يُعاد الرمز في الاستجابة للاختبار)
 * - بعد التحقق يصدر "إثبات" HMAC موقّت يقدَّم مع نموذج الانضمام
 *   ليثبت للسيرفر أن الجوال تم التحقق منه فعلاً.
 *
 * Server-only.
 */

import crypto from "crypto";

const OTP_SECRET =
  process.env.OTP_SECRET ?? process.env.ADMIN_JWT_SECRET ?? "change-me-in-production";

export const OTP_TTL_MINUTES = 5;
export const OTP_MAX_ATTEMPTS = 5;
const PROOF_TTL_MINUTES = 30;

// ─────────────────────────────────────────────────────────────
// الرمز
// ─────────────────────────────────────────────────────────────

export function generateOtpCode(): string {
  // 6 أرقام عشوائية آمنة (لا تبدأ بصفر لتفادي الالتباس)
  const n = crypto.randomInt(100000, 1000000);
  return String(n);
}

export function hashOtpCode(code: string): string {
  return crypto.createHash("sha256").update(code + "|" + OTP_SECRET).digest("hex");
}

// ─────────────────────────────────────────────────────────────
// إثباتات HMAC موقّتة — تربط قيمة (جوال/مسار ملف) بعملية تحقق ناجحة
// ─────────────────────────────────────────────────────────────

export function signValueProof(value: string, ttlMinutes = PROOF_TTL_MINUTES): string {
  const exp = Math.floor(Date.now() / 1000) + ttlMinutes * 60;
  const payload = `${value}|${exp}`;
  const sig = crypto.createHmac("sha256", OTP_SECRET).update(payload).digest("base64url");
  return Buffer.from(payload).toString("base64url") + "." + sig;
}

export function verifyValueProof(proof: string, value: string): boolean {
  try {
    const [payloadB64, sig] = proof.split(".");
    const payload = Buffer.from(payloadB64, "base64url").toString();
    const expected = crypto.createHmac("sha256", OTP_SECRET).update(payload).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    const idx = payload.lastIndexOf("|");
    const v = payload.slice(0, idx);
    const expStr = payload.slice(idx + 1);
    if (v !== value) return false;
    if (Date.now() / 1000 > Number(expStr)) return false;
    return true;
  } catch {
    return false;
  }
}

export const signPhoneProof = (phone: string) => signValueProof(phone);
export const verifyPhoneProof = (proof: string, phone: string) => verifyValueProof(proof, phone);

// إثبات تأكيد البريد — القيمة بريد بأحرف صغيرة مع بادئة لمنع الخلط مع إثباتات أخرى
export const signEmailProof = (email: string) => signValueProof("email:" + email.toLowerCase());
export const verifyEmailProof = (proof: string, email: string) =>
  verifyValueProof(proof, "email:" + email.toLowerCase());

// ─────────────────────────────────────────────────────────────
// قوة كلمة المرور — تُفرض في السيرفر وتُعرض إرشاداتها في الواجهة
// ─────────────────────────────────────────────────────────────

/** 8+ أحرف، حرف كبير، حرف صغير، رقم، رمز خاص. */
export function isStrongPassword(pw: string): boolean {
  return (
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /\d/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  );
}
export const STRONG_PASSWORD_MESSAGE =
  "كلمة المرور ضعيفة — يجب 8 أحرف على الأقل وتشمل حرفاً كبيراً وحرفاً صغيراً ورقماً ورمزاً خاصاً";

// ─────────────────────────────────────────────────────────────
// الإرسال — مزوّد قابل للتهيئة
// ─────────────────────────────────────────────────────────────

type Provider = "msegat" | "twilio" | "dev" | null;

export function otpProvider(): Provider {
  if (process.env.MSEGAT_USERNAME && process.env.MSEGAT_API_KEY) return "msegat";
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) return "twilio";
  if (process.env.OTP_DEV_MODE === "true") return "dev";
  return null;
}

export function otpEnabled(): boolean {
  return otpProvider() !== null;
}

/** يرسل الرمز. في وضع التطوير لا يرسل شيئاً ويعيد devCode. */
export async function sendOtpSms(phone: string, code: string): Promise<{ devCode?: string }> {
  const provider = otpProvider();
  const message = `رمز التحقق لسوق الدعاية والإعلان: ${code}\nصالح لمدة ${OTP_TTL_MINUTES} دقائق.`;

  if (provider === "msegat") {
    const res = await fetch("https://www.msegat.com/gw/sendsms.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userName: process.env.MSEGAT_USERNAME,
        apiKey: process.env.MSEGAT_API_KEY,
        userSender: process.env.MSEGAT_SENDER ?? "OTP",
        numbers: phone.replace("+", ""), // مسيجات تتوقع 9665XXXXXXXX
        msg: message,
      }),
    });
    const body = await res.text();
    // مسيجات تعيد "1" أو {"code":"1"} عند النجاح
    if (!res.ok || !/^\s*(1|\{"code"\s*:\s*"1")/.test(body)) {
      throw new Error("Msegat send failed: " + body.slice(0, 120));
    }
    return {};
  }

  if (provider === "twilio") {
    const sid = process.env.TWILIO_ACCOUNT_SID!;
    const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: phone,
        From: process.env.TWILIO_FROM!,
        Body: message,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error("Twilio send failed: " + body.slice(0, 120));
    }
    return {};
  }

  if (provider === "dev") {
    console.log(`[OTP DEV MODE] ${phone} → ${code}`);
    return { devCode: code };
  }

  throw new Error("لا يوجد مزوّد رسائل مهيأ");
}

// ─────────────────────────────────────────────────────────────
// تأكيد البريد الإلكتروني — مزوّد قابل للتهيئة
//   Resend : RESEND_API_KEY (+ EMAIL_FROM اختياري)
//   تطوير  : OTP_DEV_MODE=true (لا إرسال — يُعاد الرمز في الاستجابة)
// ─────────────────────────────────────────────────────────────

type EmailProvider = "resend" | "dev" | null;

export function emailOtpProvider(): EmailProvider {
  const key = process.env.RESEND_API_KEY ?? "";
  // تجاهل القيم الوهمية (placeholders) مثل re_xxxxxxxx حتى لا تعطّل وضع التطوير
  if (key && !/x{6,}/i.test(key)) return "resend";
  if (process.env.OTP_DEV_MODE === "true") return "dev";
  return null;
}

export function emailOtpEnabled(): boolean {
  return emailOtpProvider() !== null;
}

/** يرسل رمز تأكيد البريد. في وضع التطوير لا يرسل شيئاً ويعيد devCode. */
export async function sendOtpEmail(email: string, code: string): Promise<{ devCode?: string }> {
  const provider = emailOtpProvider();

  if (provider === "resend") {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "E3lani <noreply@e3lani.com>",
        to: [email],
        subject: `رمز تأكيد البريد: ${code} — سوق الدعاية والإعلان`,
        html: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;background:#F4EFE6;color:#2C1E15;padding:32px;border-radius:12px;max-width:480px;margin:0 auto">
          <h2 style="color:#C9A24B;margin:0 0 16px">سوق الدعاية والإعلان</h2>
          <p style="margin:0 0 8px">رمز تأكيد بريدك الإلكتروني:</p>
          <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#C9A24B;margin:8px 0 16px">${code}</p>
          <p style="color:#999;font-size:13px;margin:0">الرمز صالح لمدة ${OTP_TTL_MINUTES} دقائق. إن لم تطلب هذا الرمز فتجاهل الرسالة.</p>
        </div>`,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error("Resend send failed: " + body.slice(0, 120));
    }
    return {};
  }

  if (provider === "dev") {
    console.log(`[EMAIL OTP DEV MODE] ${email} → ${code}`);
    return { devCode: code };
  }

  throw new Error("لا يوجد مزوّد بريد مهيأ");
}
