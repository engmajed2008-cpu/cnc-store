import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _supabase;
}

const CACHE = new Map<string, { data: unknown; ts: number }>();
const TTL = 5 * 60 * 1000;

// GET /api/site-config?key=slides
export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get("key");
  const cacheKey = key ?? "__all__";

  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json(cached.data, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" },
    });
  }

  if (!key) {
    const { data, error } = await getSupabase().from("site_config").select("key, value");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const result: Record<string, unknown> = {};
    (data ?? []).forEach(row => { result[row.key] = row.value; });
    CACHE.set(cacheKey, { data: result, ts: Date.now() });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" },
    });
  }

  const { data, error } = await getSupabase()
    .from("site_config")
    .select("value")
    .eq("key", key)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = { value: data?.value ?? null };
  CACHE.set(cacheKey, { data: result, ts: Date.now() });
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" },
  });
}

// POST /api/site-config  body: { key, value }
export async function POST(req: NextRequest) {
  const { key, value } = await req.json() as { key: string; value: unknown };
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });

  const { error } = await getSupabase()
    .from("site_config")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
