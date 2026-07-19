export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rateLimit";
import { withAdminAuth } from "@/lib/db/adminAuth";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET — جلب كل الشكاوي مع بيانات العميل
export const GET = withAdminAuth(async (req) => {
  const rl = rateLimit(req, { limit: 30, windowMs: 60_000, prefix: "admin:complaints" });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const supabase = adminClient();
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // جلب أسماء العملاء من auth.users
  const userIds = Array.from(new Set((data ?? []).map((c: Record<string,string>) => c.user_id)));
  const usersMap: Record<string, { name: string; email: string }> = {};

  for (const uid of userIds) {
    const { data: u } = await supabase.auth.admin.getUserById(uid as string);
    if (u?.user) {
      usersMap[uid as string] = {
        name:  u.user.user_metadata?.full_name ?? u.user.user_metadata?.name ?? "",
        email: u.user.email ?? "",
      };
    }
  }

  const enriched = (data ?? []).map((c: Record<string,string>) => ({
    ...c,
    customerName:  usersMap[c.user_id]?.name  ?? "—",
    customerEmail: usersMap[c.user_id]?.email ?? "—",
  }));

  return NextResponse.json({ complaints: enriched });
});

// PATCH — تغيير الحالة أو إرسال الرد
export const PATCH = withAdminAuth(async (req) => {
  const rl = rateLimit(req, { limit: 20, windowMs: 60_000, prefix: "admin:complaints:patch" });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const supabase = adminClient();
  const body = await req.json();
  const { id, status, admin_reply } = body;

  const updates: Record<string, string> = { updated_at: new Date().toISOString() };
  if (status)       updates.status      = status;
  if (admin_reply !== undefined) updates.admin_reply = admin_reply;
  if (status === "in_review" && admin_reply) updates.status = "in_review";

  const { error } = await supabase
    .from("complaints")
    .update(updates)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});
