export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rateLimit";
import { withAdminAuth } from "@/lib/db/adminAuth";

export const GET = withAdminAuth(async (req) => {
  const rl = rateLimit(req, { limit: 30, windowMs: 60_000, prefix: "admin:users" });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const users = data.users.map((u) => ({
      id:         u.id,
      email:      u.email ?? "",
      name:       u.user_metadata?.full_name ?? u.user_metadata?.name ?? "",
      avatar:     u.user_metadata?.avatar_url ?? null,
      provider:   u.app_metadata?.provider ?? "email",
      createdAt:  u.created_at,
      lastSignIn: u.last_sign_in_at ?? null,
      confirmed:  !!u.email_confirmed_at,
      banned:     (u as { banned?: boolean }).banned ?? false,
    }));

    return NextResponse.json({ users });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
});

export const PATCH = withAdminAuth(async (req) => {
  const rl = rateLimit(req, { limit: 10, windowMs: 60_000, prefix: "admin:users:patch" });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  try {
    const { userId, banned } = await req.json();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { error } = await supabase.auth.admin.updateUserById(userId, { ban_duration: banned ? "876600h" : "none" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
});
