import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  // 20 OAuth attempts per minute per IP
  const rl = rateLimit(req, { limit: 20, windowMs: 60_000, prefix: "auth:cb" });
  if (!rl.ok) {
    return NextResponse.redirect(new URL("/ar/login?error=too_many_requests", req.url));
  }

  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/ar";

  if (!code) {
    return NextResponse.redirect(origin + "/ar/login?error=oauth");
  }

  // Exchange code using Supabase REST API directly so we can set cookies
  const tokenRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=pkce`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({ auth_code: code, code_verifier: "" }),
    }
  );

  if (!tokenRes.ok) {
    // Fallback: redirect to login and let the client handle it
    // (Supabase client-side will detect the code in the URL fragment)
    return NextResponse.redirect(origin + next);
  }

  const tokens = await tokenRes.json() as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (!tokens.access_token) {
    return NextResponse.redirect(origin + next);
  }

  const response = NextResponse.redirect(origin + next);

  // Set session cookies so the client Supabase instance picks them up
  const maxAge = tokens.expires_in ?? 3600;
  const cookieOpts = { httpOnly: false, path: "/", maxAge, sameSite: "lax" as const };

  response.cookies.set("sb-access-token",  tokens.access_token,  cookieOpts);
  response.cookies.set("sb-refresh-token", tokens.refresh_token ?? "", { ...cookieOpts, maxAge: 60 * 60 * 24 * 365 });

  return response;
}
