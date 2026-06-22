import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/site-config?key=slides
export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get("key");
  if (!key) {
    // Return all config
    const { data, error } = await supabase
      .from("site_config")
      .select("key, value");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const result: Record<string, unknown> = {};
    (data ?? []).forEach(row => { result[row.key] = row.value; });
    return NextResponse.json(result);
  }

  const { data, error } = await supabase
    .from("site_config")
    .select("value")
    .eq("key", key)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ value: data?.value ?? null });
}

// POST /api/site-config  body: { key, value }
export async function POST(req: NextRequest) {
  const { key, value } = await req.json() as { key: string; value: unknown };
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });

  const { error } = await supabase
    .from("site_config")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
